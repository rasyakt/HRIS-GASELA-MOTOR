import { BadRequestException } from '@nestjs/common';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password complexity requirements
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordComplexity(
  password: string,
): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password minimal 12 karakter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter spesial (@, #, $, %, dll)');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password123!',
    'admin123456!',
    'qwerty123456!',
    '123456789abc!',
    'password@123',
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password terlalu umum, gunakan kombinasi yang lebih unik');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates password or throws BadRequestException
 */
export function assertPasswordComplexity(password: string): void {
  const result = validatePasswordComplexity(password);
  if (!result.isValid) {
    throw new BadRequestException({
      message: 'Password tidak memenuhi persyaratan kompleksitas',
      errors: result.errors,
    });
  }
}
