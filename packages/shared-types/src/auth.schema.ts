import { z } from 'zod';
import type { UserRole } from './enums';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    message: 'Password baru harus berbeda dari password lama',
    path: ['newPassword'],
  });

export const twoFactorVerifySchema = z.object({
  tempToken: z.string().min(1, 'Temporary token wajib diisi'),
  code: z.string().min(6, 'Kode harus minimal 6 karakter').max(30, 'Kode tidak valid'),
  rememberMe: z.boolean().optional(),
});

export const twoFactorEnableSchema = z.object({
  code: z.string().min(6, 'Kode harus 6 digit angka').max(10),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, 'Password konfirmasi wajib diisi'),
});

export const twoFactorRegenerateRecoveryCodesSchema = z.object({
  password: z.string().min(1, 'Password konfirmasi wajib diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type TwoFactorEnableInput = z.infer<typeof twoFactorEnableSchema>;
export type TwoFactorDisableInput = z.infer<typeof twoFactorDisableSchema>;
export type TwoFactorRegenerateRecoveryCodesInput = z.infer<
  typeof twoFactorRegenerateRecoveryCodesSchema
>;

export interface AuthUser {
  id: number;
  employeeId: number;
  username: string;
  role: UserRole;
  fullName: string;
  department?: string | null;
  twoFactorEnabled?: boolean;
}

export interface LoginResponse {
  requires2FA?: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number; // Access token TTL in seconds
  user?: AuthUser;
}

export interface JwtPayload {
  sub: number;
  employeeId: number;
  username: string;
  role: UserRole;
  isTemp2FA?: boolean;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  hasRecoveryCodes?: boolean;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export interface TwoFactorEnableResponse {
  message: string;
  recoveryCodes: string[];
}

export interface TwoFactorRegenerateResponse {
  message: string;
  recoveryCodes: string[];
}