import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import { EXACT_ROLES_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import { roleAtLeast, AuthRequest } from '../types/auth-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const exactRoles = this.reflector.getAllAndOverride<UserRole[]>(
      EXACT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    // Tanpa metadata role apa pun (mis. rute @Public) → langsung lolos
    const noExact = !exactRoles || exactRoles.length === 0;
    const noRegular = !requiredRoles || requiredRoles.length === 0;
    if (noExact && noRegular) return true;

    if (!user) throw new UnauthorizedException('Anda belum login');

    // Superadmin (Developer) memiliki akses mutlak ke seluruh fitur sistem
    if (user.role === 'superadmin') return true;

    if (exactRoles && exactRoles.length > 0) {
      if (exactRoles.includes(user.role)) return true;
      // @Roles hierarkis tetap dievaluasi — lolos jika salah satunya cocok
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      if (exactRoles && exactRoles.length > 0) {
        throw new ForbiddenException(
          `Hak akses tidak cukup (khusus peran: ${exactRoles.join(', ')})`,
        );
      }
      return true;
    }

    const allowed = requiredRoles.some((r) => roleAtLeast(r, user.role));
    if (!allowed) {
      throw new ForbiddenException(
        `Hak akses tidak cukup (dibutuhkan salah satu: ${requiredRoles.join(', ')})`,
      );
    }
    return true;
  }
}
