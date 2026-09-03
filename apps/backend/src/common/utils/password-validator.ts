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

  // BUG-018: Perluas daftar weak password dari 5 ke 35+ entri.
  // Mencakup variasi nama perusahaan, pola keyboard umum,
  // dan kata-kata mudah ditebak dalam konteks HRIS Indonesia.
  const weakPasswords = [
    // Generic common passwords
    'password123!',
    'password@123',
    'password@1234',
    'admin123456!',
    'admin@123456',
    'qwerty123456!',
    'qwerty@12345',
    '123456789abc!',
    'abcdefg@123',
    'iloveyou@123',
    'welcome@1234',
    'letmein@1234',
    // Company name variants (Gasela Motor)
    'gasela@12345',
    'gasela123456',
    'gasela@motor1',
    'motor@12345!',
    'motorgasela1!',
    'gaselamotor1!',
    'gasela2026!',
    'motor2026@',
    'gasela@2026!',
    'gaselahris@1',
    // Keyboard patterns
    'qwerty@12345',
    'asdfgh@1234!',
    '1qaz@wsx12345',
    'zxcvbn@1234!',
    // Common Indonesian patterns
    'indonesia@123',
    'jakarta@12345',
    'karyawan@1234',
    'pegawai@12345',
    'karyawan2026!',
    'hris@12345678',
    'admin@hris123',
    // Repeating patterns
    'aaaaaa@1234!',
    '111111@qwerty',
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password terlalu umum, gunakan kombinasi yang lebih unik');
  }

  // Tambahan: cek pola karakter berulang (misal aaaa1! atau 1111A@)
  if (/(.)\1{5,}/.test(password)) {
    errors.push('Password tidak boleh mengandung karakter yang sama berulang lebih dari 5 kali');
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
