import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { roleAtLeast, AuthRequest } from '../types/auth-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Anda belum login');

    const allowed = requiredRoles.some((r) => roleAtLeast(r, user.role));
    if (!allowed) {
      throw new ForbiddenException(
        `Hak akses tidak cukup (dibutuhkan salah satu: ${requiredRoles.join(', ')})`,
      );
    }
    return true;
  }
}
