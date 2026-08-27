import { Prisma } from '@prisma/client';
import { encrypt, decrypt, encryptNumber, decryptNumber, isEncrypted } from '../common/utils/encryption.util';

/**
 * Prisma middleware for transparent encryption/decryption of sensitive fields
 * 
 * Encrypts data before storing in database
 * Decrypts data when reading from database
 */

// Fields that should be encrypted per model
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Employee: [
    'idCardNumber',
    'taxNumber',
    'bankAccountNumber',
  ],
};

// Numeric fields that need special handling
const ENCRYPTED_NUMERIC_FIELDS: Record<string, string[]> = {
  Employee: ['basicSalary'],
  Payroll: ['basicSalary'],
};

/**
 * Check if encryption is enabled
 */
function isEncryptionEnabled(): boolean {
  return !!process.env.ENCRYPTION_KEY && process.env.ENABLE_ENCRYPTION !== 'false';
}

/**
 * Encrypt sensitive fields in data object
 */
function encryptFields(model: string, data: any): any {
  if (!isEncryptionEnabled() || !data) return data;

  const encryptedData = { ...data };
  
  // Encrypt string fields
  const stringFields = ENCRYPTED_FIELDS[model] || [];
  for (const field of stringFields) {
    if (field in encryptedData && encryptedData[field]) {
      // Only encrypt if not already encrypted
      if (!isEncrypted(encryptedData[field])) {
        encryptedData[field] = encrypt(encryptedData[field]);
      }
    }
  }
  
  // Encrypt numeric fields
  const numericFields = ENCRYPTED_NUMERIC_FIELDS[model] || [];
  for (const field of numericFields) {
    if (field in encryptedData && encryptedData[field] !== null && encryptedData[field] !== undefined) {
      // Convert Decimal to number if needed
      const value = typeof encryptedData[field] === 'object' && 'toNumber' in encryptedData[field]
        ? encryptedData[field].toNumber()
        : Number(encryptedData[field]);
      
      // Only encrypt if not already encrypted
      if (typeof encryptedData[field] !== 'string' || !isEncrypted(encryptedData[field])) {
        encryptedData[field] = encryptNumber(value);
      }
    }
  }
  
  return encryptedData;
}

/**
 * Decrypt sensitive fields in result object
 */
function decryptFields(model: string, result: any): any {
  if (!isEncryptionEnabled() || !result) return result;

  // Handle array results
  if (Array.isArray(result)) {
    return result.map(item => decryptFields(model, item));
  }

  const decryptedResult = { ...result };
  
  // Decrypt string fields
  const stringFields = ENCRYPTED_FIELDS[model] || [];
  for (const field of stringFields) {
    if (field in decryptedResult && decryptedResult[field]) {
      try {
        decryptedResult[field] = decrypt(decryptedResult[field]);
      } catch (error) {
        console.error(`Failed to decrypt ${model}.${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  // Decrypt numeric fields
  const numericFields = ENCRYPTED_NUMERIC_FIELDS[model] || [];
  for (const field of numericFields) {
    if (field in decryptedResult && decryptedResult[field]) {
      try {
        decryptedResult[field] = decryptNumber(decryptedResult[field]);
      } catch (error) {
        console.error(`Failed to decrypt ${model}.${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  return decryptedResult;
}

/**
 * Prisma middleware factory
 */
export function createEncryptionMiddleware() {
  return async (params: any, next: any) => {
    const model = params.model;
    if (!model) return next(params);

    // List of operations that write data
    const writeOperations = ['create', 'update', 'upsert', 'createMany', 'updateMany'];
    
    // Encrypt data before write operations
    if (writeOperations.includes(params.action)) {
      if (params.action === 'create' || params.action === 'update') {
        if (params.args.data) {
          params.args.data = encryptFields(model, params.args.data);
        }
      } else if (params.action === 'upsert') {
        if (params.args.create) {
          params.args.create = encryptFields(model, params.args.create);
        }
        if (params.args.update) {
          params.args.update = encryptFields(model, params.args.update);
        }
      } else if (params.action === 'createMany') {
        if (params.args.data && Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => 
            encryptFields(model, item)
          );
        }
      } else if (params.action === 'updateMany') {
        if (params.args.data) {
          params.args.data = encryptFields(model, params.args.data);
        }
      }
    }

    // Execute the query
    const result = await next(params);

    // Decrypt data after read operations
    const readOperations = ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'upsert'];
    if (readOperations.includes(params.action) && result) {
      return decryptFields(model, result);
    }

    return result;
  };
}
