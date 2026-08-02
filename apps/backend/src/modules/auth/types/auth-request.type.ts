import type { AuthUser } from '@gasela/shared-types';
import type { Request } from 'express';

export interface AuthRequest extends Request {
  user: AuthUser;
}

export const USER_ROLE_ORDER = ['employee', 'manager', 'hrd', 'admin', 'owner'];

export function roleAtLeast(required: string, actual: string): boolean {
  const req = USER_ROLE_ORDER.indexOf(required);
  const act = USER_ROLE_ORDER.indexOf(actual);
  return act >= req && req !== -1 && act !== -1;
}
