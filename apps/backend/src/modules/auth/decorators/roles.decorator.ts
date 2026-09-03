import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@gasela/shared-types';

export const ROLES_KEY = 'roles';
export const EXACT_ROLES_KEY = 'exactRoles';

/**
 * Pencocokan hierarkis (roleAtLeast) — role yang lebih tinggi melewati
 * guard role yang lebih rendah (mis. owner melewati @Roles('admin')).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Pencocokan TEPAT — hanya user dengan role persis yang lolos.
 * Dipakai untuk peran yang terisolasi (mis. landing_admin) yang TIDAK
 * boleh berbagi akses dengan hierarki HRIS.
 */
export const ExactRoles = (...roles: UserRole[]) =>
  SetMetadata(EXACT_ROLES_KEY, roles);
