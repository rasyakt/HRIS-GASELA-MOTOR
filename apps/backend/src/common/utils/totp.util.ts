import * as crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode a buffer to standard Base32 string (RFC 4648)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Decode a Base32 string to Buffer
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.replace(/[\s=-]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleanInput[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generate a cryptographically secure Base32 secret for TOTP (20 bytes = 160 bits)
 */
export function generateTotpSecret(byteLength = 20): string {
  const randomBytes = crypto.randomBytes(byteLength);
  return base32Encode(randomBytes);
}

/**
 * Generate 6-digit TOTP code for a given time step (RFC 6238)
 */
export function generateTotpCode(
  secret: string,
  timeStep = Math.floor(Date.now() / 1000 / 30),
): string {
  const key = base32Decode(secret);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(timeBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = code % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP code with time drift window (default ±2 steps = ±60 seconds)
 * Menoleransi deviasi waktu hingga 1 menit antara perangkat ponsel & server
 */
export function verifyTotpCode(
  token: string,
  secret: string,
  window = 2,
): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expected = generateTotpCode(secret, currentStep + i);
    if (
      crypto.timingSafeEqual(
        Buffer.from(cleanToken),
        Buffer.from(expected),
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Generate standard otpauth:// URL for Google Authenticator / Authy QR code scanning
 */
export function generateOtpauthUrl(
  account: string,
  issuer: string,
  secret: string,
): string {
  const encAccount = encodeURIComponent(account);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}
