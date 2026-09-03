import type { AuthUser } from '@gasela/shared-types';
import type { Request } from 'express';

export interface AuthRequest extends Request {
  user: AuthUser;
}

/**
 * Hierarki peran operasional HRIS (dari terendah ke tertinggi).
 * Catatan: 'landing_admin' adalah peran non-hierarkis (CMS only),
 * ditangani via @ExactRoles — sengaja tidak ada di sini agar tidak
 * mendapat akses ke endpoint HR operasional melalui cek hierarkis.
 */
export const USER_ROLE_ORDER = ['employee', 'manager', 'hrd', 'admin', 'owner'];

/**
 * Cek apakah `actual` role setidaknya setara dengan `required` role.
 * Role di luar hierarki (landing_admin) akan selalu return false —
 * mereka harus menggunakan @ExactRoles decorator.
 */
export function roleAtLeast(required: string, actual: string): boolean {
  const req = USER_ROLE_ORDER.indexOf(required);
  const act = USER_ROLE_ORDER.indexOf(actual);
  // Jika salah satu tidak ada di hierarki → tidak lolos
  if (req === -1 || act === -1) return false;
  return act >= req;
}
