-- Migration to change column types for encrypted data
-- Encrypted data is stored as base64 string: "iv:authTag:data" (~80-200 chars depending on data)

-- Drop unique constraints first (TEXT columns can't have UNIQUE constraint)
ALTER TABLE `employees` 
  DROP INDEX `employees_id_card_number_key`;

-- Change Employee sensitive fields to TEXT for encryption
ALTER TABLE `employees` 
  MODIFY COLUMN `id_card_number` TEXT,
  MODIFY COLUMN `tax_number` TEXT,
  MODIFY COLUMN `bank_account_number` TEXT,
  MODIFY COLUMN `basic_salary` TEXT;

-- Change Payroll basicSalary to TEXT for encryption  
ALTER TABLE `payrolls`
  MODIFY COLUMN `basic_salary` TEXT;

-- Note: For uniqueness validation, application layer will handle it
-- Or we can add hash-based index columns later if needed
