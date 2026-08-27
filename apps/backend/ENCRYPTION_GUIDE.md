# Data Encryption at Rest - Implementation Guide

## 📋 Overview

Sistem ini mengimplementasikan **encryption at rest** untuk melindungi data sensitif karyawan menggunakan **AES-256-GCM** (authenticated encryption).

### ✅ Protected Fields

| Model | Field | Description |
|-------|-------|-------------|
| **Employee** | `idCardNumber` | NIK (Nomor Induk Kependudukan) |
| **Employee** | `taxNumber` | NPWP (Nomor Pokok Wajib Pajak) |
| **Employee** | `bankAccountNumber` | Nomor Rekening Bank |
| **Employee** | `basicSalary` | Gaji Pokok (numeric) |
| **Payroll** | `basicSalary` | Gaji Pokok di payroll (numeric) |

---

## 🔐 How It Works

### 1. Transparent Encryption/Decryption

Sistem menggunakan **Prisma Middleware** untuk otomatis encrypt/decrypt data:

```typescript
// Ketika menyimpan (CREATE/UPDATE)
prisma.employee.create({
  data: {
    idCardNumber: '3201234567890123', // Plain text
    taxNumber: '12.345.678.9-012.345', // Plain text
    basicSalary: 5000000 // Plain number
  }
})
// ↓ Middleware automatically encrypts before storing
// Stored in DB: 'abc123==:def456==:ghi789==' (encrypted)

// Ketika membaca (FIND)
const employee = await prisma.employee.findUnique({...})
// ↓ Middleware automatically decrypts before returning
console.log(employee.idCardNumber) // '3201234567890123' (decrypted)
```

**Tidak perlu mengubah kode aplikasi!** Encryption/decryption terjadi otomatis.

### 2. Encryption Algorithm

- **Algorithm:** AES-256-GCM
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes) - random per encryption
- **Auth Tag:** 128 bits (16 bytes) - for authenticated encryption
- **Format:** `iv:authTag:encryptedData` (all base64)

**Keuntungan AES-256-GCM:**
- ✅ Authenticated encryption (tamper-proof)
- ✅ Industry standard (NIST approved)
- ✅ Fast performance
- ✅ Detects data corruption/modification

---

## ⚙️ Setup & Configuration

### 1. Environment Variables

Required in `apps/backend/.env`:

```bash
# Encryption key (64 hex chars = 32 bytes)
ENCRYPTION_KEY=8166209d72886574447e6c7da4f790a1ba990096e0e76ff71717571b823a31db

# Enable/disable encryption
ENABLE_ENCRYPTION=true
```

**⚠️ CRITICAL SECURITY NOTES:**

1. **NEVER commit encryption key to git**
2. **Use different keys for dev/staging/production**
3. **Backup encryption key securely** - if lost, data cannot be recovered
4. **Store key in secrets manager** (AWS Secrets Manager, HashiCorp Vault, etc.)

### 2. Generate New Encryption Key

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[System.Convert]::ToHex([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 3. Middleware Registration

Already registered in `src/prisma/prisma.service.ts`:

```typescript
async onModuleInit() {
  // Register encryption middleware
  this.$use(createEncryptionMiddleware());
  await this.$connect();
}
```

---

## 🚀 Migration: Encrypt Existing Data

### Pre-Migration Checklist

- [ ] **BACKUP DATABASE** - Mandatory!
  ```bash
  mysqldump -u root -p gasela_hris > backup_before_encryption_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Set `ENCRYPTION_KEY` in `.env`
- [ ] Set `ENABLE_ENCRYPTION=true`
- [ ] Test on development environment first

### Run Migration Script

```bash
cd apps/backend

# Dry run (optional - check what will be encrypted)
pnpm encrypt:data

# The script will:
# 1. Read all employees from database
# 2. Check which fields are already encrypted
# 3. Encrypt unencrypted sensitive fields
# 4. Update database records
# 5. Show summary report
```

### Migration Script Output

```
🔐 Starting encryption of existing data...

📊 Found 150 employees to process

  🔒 Employee 1: Encrypting idCardNumber
  🔒 Employee 1: Encrypting taxNumber
  🔒 Employee 1: Encrypting bankAccountNumber
  🔒 Employee 1: Encrypting basicSalary
  ✅ Employee 1: Successfully encrypted and updated

  ✓ Employee 2: idCardNumber already encrypted
  ✓ Employee 2: taxNumber already encrypted
  ⏭️  Employee 2: No encryption needed

...

============================================================
📊 ENCRYPTION SUMMARY
============================================================
Total Employees:      150
Already Encrypted:    0
Newly Encrypted:      150
Failed:               0
============================================================

✅ All sensitive data encrypted successfully!
```

### Rollback (If Needed)

```bash
# Restore from backup
mysql -u root -p gasela_hris < backup_before_encryption_20260827_120000.sql

# Disable encryption
# In .env: ENABLE_ENCRYPTION=false
```

---

## 🔍 Verification

### 1. Check Raw Database (Should be Encrypted)

```sql
-- Check employee data in database
SELECT 
  employee_id,
  full_name,
  id_card_number,
  tax_number,
  bank_account_number,
  basic_salary
FROM employees
LIMIT 5;

-- Encrypted format should look like:
-- id_card_number: 'ZGVm...abc==:ghi...xyz==:jkl...mno=='
-- (base64 string with 2 colons)
```

### 2. Check via Application (Should be Decrypted)

```typescript
// In your code
const employee = await prisma.employee.findUnique({
  where: { id: 1 }
});

console.log(employee.idCardNumber);    // '3201234567890123' (decrypted)
console.log(employee.taxNumber);       // '12.345.678.9-012.345' (decrypted)
console.log(employee.basicSalary);     // 5000000 (decrypted number)
```

### 3. API Response

```bash
# Test API endpoint
curl http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response should show decrypted values
{
  "id": 1,
  "idCardNumber": "3201234567890123",  // ✅ Decrypted
  "taxNumber": "12.345.678.9-012.345", // ✅ Decrypted
  "basicSalary": 5000000               // ✅ Decrypted
}
```

---

## 🛠️ Utilities & Functions

### Encryption Utilities (`src/common/utils/encryption.util.ts`)

```typescript
import { encrypt, decrypt, encryptNumber, decryptNumber, hash, isEncrypted } from './encryption.util';

// Encrypt string
const encrypted = encrypt('3201234567890123');
// Returns: 'iv:authTag:encryptedData' (base64)

// Decrypt string
const decrypted = decrypt(encrypted);
// Returns: '3201234567890123'

// Encrypt number
const encryptedSalary = encryptNumber(5000000);
// Returns: encrypted string

// Decrypt number
const decryptedSalary = decryptNumber(encryptedSalary);
// Returns: 5000000

// One-way hash (for searching without decryption)
const hashed = hash('3201234567890123');
// Returns: hex hash (cannot be reversed)

// Check if already encrypted
const isEnc = isEncrypted('iv:authTag:data');
// Returns: true
```

### Manual Encryption (If Needed)

```typescript
// If you need to manually encrypt/decrypt outside Prisma

import { encrypt, decrypt } from '../common/utils/encryption.util';

// Manual encryption
const sensitiveData = '3201234567890123';
const encrypted = encrypt(sensitiveData);

// Store in database manually
await prisma.$executeRawUnsafe(
  'UPDATE employees SET id_card_number = ? WHERE employee_id = ?',
  encrypted,
  employeeId
);

// Manual decryption
const result = await prisma.$queryRawUnsafe(
  'SELECT id_card_number FROM employees WHERE employee_id = ?',
  employeeId
);
const decrypted = decrypt(result[0].id_card_number);
```

---

## 🚨 Troubleshooting

### Error: "ENCRYPTION_KEY not set"

**Solution:**
```bash
# Add to apps/backend/.env
ENCRYPTION_KEY=your_64_char_hex_key_here
```

### Error: "ENCRYPTION_KEY must be 64 hex characters"

**Solution:** Generate proper key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: "Failed to decrypt data"

**Possible causes:**
1. Wrong encryption key
2. Data corrupted in database
3. Data not actually encrypted

**Solution:**
1. Check `ENCRYPTION_KEY` is correct
2. Verify data format in database (should have 2 colons)
3. Run migration script again

### Some Fields Not Encrypted

**Solution:** Run migration script:
```bash
cd apps/backend
pnpm encrypt:data
```

### Performance Issues

**Impact:** Minimal - AES-256-GCM is very fast
- Encryption: ~0.1ms per field
- Decryption: ~0.1ms per field

**If concerned:**
1. Check database query performance (may need indexes)
2. Consider caching decrypted values in memory
3. Use connection pooling (already configured)

---

## 📊 Security Considerations

### ✅ What's Protected

- **Data at Rest:** Encrypted in database
- **Data in Transit:** HTTPS (separate concern)
- **Tamper Detection:** GCM auth tag detects modifications
- **Compliance:** Helps meet GDPR, HIPAA, PCI-DSS requirements

### ⚠️ What's NOT Protected

- **Data in Memory:** Decrypted while processing (normal)
- **Data in Logs:** Be careful not to log sensitive fields
- **Data in Backups:** Backup contains encrypted data (good!)
- **API Responses:** Decrypted for authorized users (intended)

### 🔐 Best Practices

1. **Key Management:**
   - Store encryption key in secrets manager
   - Rotate keys annually
   - Use different keys per environment

2. **Access Control:**
   - Limit who can access encryption key
   - Audit key access
   - Use IAM roles, not hardcoded keys

3. **Monitoring:**
   - Log encryption/decryption errors
   - Monitor for unusual patterns
   - Alert on key access

4. **Disaster Recovery:**
   - Backup encryption key securely
   - Document key recovery process
   - Test restoration regularly

---

## 🎯 Future Enhancements

### Key Rotation

Currently not implemented. To rotate keys:

1. Generate new key
2. Add as `ENCRYPTION_KEY_NEW`
3. Update middleware to try both keys
4. Re-encrypt all data with new key
5. Remove old key

### Field-Level Encryption Key

Use different keys for different fields:

```typescript
const FIELD_KEYS = {
  idCardNumber: process.env.ENCRYPTION_KEY_NIK,
  taxNumber: process.env.ENCRYPTION_KEY_NPWP,
  salary: process.env.ENCRYPTION_KEY_SALARY,
};
```

### Searchable Encryption

For searching encrypted fields, use hashed index:

```typescript
// Add hash field to schema
model Employee {
  idCardNumber: String
  idCardNumberHash: String // For searching
}

// Create with hash
await prisma.employee.create({
  data: {
    idCardNumber: '3201234567890123',
    idCardNumberHash: hash('3201234567890123')
  }
});

// Search by hash
const employees = await prisma.employee.findMany({
  where: {
    idCardNumberHash: hash(searchQuery)
  }
});
```

---

## 📚 References

- [NIST AES-GCM Guidelines](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)

---

## 📞 Support

**Questions?** Contact security team or check:
- `SECURITY_AUDIT_REPORT.md` - Full security audit
- `SECURITY_FIXES_SUMMARY.md` - All security fixes
- Prisma middleware: `src/prisma/encryption.middleware.ts`
- Encryption utils: `src/common/utils/encryption.util.ts`

---

**Status:** ✅ Production Ready  
**Last Updated:** 27 Agustus 2026  
**Maintained By:** Security Team
