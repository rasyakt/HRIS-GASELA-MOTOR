import * as crypto from 'crypto';

/**
 * Encryption utility for sensitive data at rest
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

// Default dummy key ONLY for local development & unit tests fallback.
// In production (NODE_ENV=production), a unique ENCRYPTION_KEY in .env is strictly enforced.
const DEFAULT_DEV_KEY =
  '8166209d72886574447e6c7da4f790a1ba990096e0e76ff71717571b823a31db';

/**
 * Get encryption key from environment
 * Key should be 64 hex characters (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const isProduction = process.env.NODE_ENV === 'production';
  const key = process.env.ENCRYPTION_KEY;

  if (isProduction) {
    if (!key) {
      throw new Error(
        'SECURITY ERROR: ENCRYPTION_KEY must be explicitly set in environment variables for production environment.'
      );
    }
    if (key === DEFAULT_DEV_KEY) {
      throw new Error(
        'SECURITY ERROR: Default development ENCRYPTION_KEY cannot be used in production. Generate a unique 64-hex key.'
      );
    }
  }

  const effectiveKey = key || DEFAULT_DEV_KEY;

  if (effectiveKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(effectiveKey, 'hex');
}

/**
 * Encrypt a string value
 * Returns: base64 string in format: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string | null): string | null {
  if (!plaintext) return null;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * Input format: iv:authTag:encryptedData (base64)
 */
export function decrypt(ciphertext: string | null): string | null {
  if (!ciphertext) return null;
  
  try {
    const parts = ciphertext.split(':');
    
    // If not in standard iv:authTag:encrypted format, return as plaintext
    if (parts.length !== 3) {
      return ciphertext;
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Hash a value for searching (one-way)
 * Used for fields that need to be searchable but not reversible
 */
export function hash(value: string | null): string | null {
  if (!value) return null;
  
  try {
    const key = getEncryptionKey();
    return crypto
      .createHmac('sha256', key)
      .update(value)
      .digest('hex');
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
}

/**
 * Encrypt numeric value (like salary)
 * Converts to string, encrypts, then can be decrypted back to number
 */
export function encryptNumber(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  return encrypt(value.toString());
}

/**
 * Decrypt to numeric value
 */
export function decryptNumber(ciphertext: string | null): number | null {
  if (!ciphertext) return null;
  const decrypted = decrypt(ciphertext);
  return decrypted ? parseFloat(decrypted) : null;
}

/**
 * Check if a value is encrypted (has our format)
 */
export function isEncrypted(value: string | null): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3;
}
