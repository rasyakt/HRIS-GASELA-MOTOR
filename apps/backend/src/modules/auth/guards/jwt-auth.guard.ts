import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthRequest } from '../types/auth-request.type';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: number;
  employeeId: number;
  username: string;
  role: string;
  fullName: string;
  jwtVersion: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token tidak disertakan');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Format token tidak valid');
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        AccessTokenPayload & { iat: number; exp: number }
      >(token, { secret: this.config.getOrThrow<string>('app.jwtSecret') });

      // SECURITY: Validate JWT version to allow session invalidation
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { jwtVersion: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User tidak ditemukan atau tidak aktif');
      }

      if (user.jwtVersion !== payload.jwtVersion) {
        throw new UnauthorizedException(
          'Token sudah tidak valid. Silakan login ulang.',
        );
      }

      request.user = {
        id: payload.sub,
        employeeId: payload.employeeId,
        username: payload.username,
        role: payload.role as UserRole,
        fullName: payload.fullName,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kadaluarsa',
      );
    }
  }
}
