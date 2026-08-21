import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  LoginResponse,
  RefreshTokenInput,
} from '@gasela/shared-types';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface UserWithEmployee {
  id: number;
  employeeId: number;
  username: string;
  passwordHash: string;
  role: UserRole;
  refreshTokenHash: string | null;
  isActive: boolean;
  employee: { fullName: string; departmentId: number | null };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private toAuthUser(u: UserWithEmployee): AuthUser {
    return {
      id: u.id,
      employeeId: u.employeeId,
      username: u.username,
      role: u.role,
      fullName: u.employee?.fullName ?? u.username,
      department: null,
    };
  }

  private tokenTtl(key: 'app.jwtAccessTtl' | 'app.jwtRefreshTtl') {
    return this.config.getOrThrow<string>(
      key,
    ) as unknown as JwtSignOptions['expiresIn'];
  }

  private signAccessToken(u: UserWithEmployee): string {
    return this.jwtService.sign(
      {
        sub: u.id,
        employeeId: u.employeeId,
        username: u.username,
        role: u.role,
        fullName: u.employee?.fullName ?? u.username,
      },
      {
        secret: this.config.getOrThrow<string>('app.jwtSecret'),
        expiresIn: this.tokenTtl('app.jwtAccessTtl'),
      },
    );
  }

  private signRefreshToken(u: UserWithEmployee): string {
    return this.jwtService.sign(
      { sub: u.id, username: u.username },
      {
        secret: this.config.getOrThrow<string>('app.jwtRefreshSecret'),
        expiresIn: this.tokenTtl('app.jwtRefreshTtl'),
      },
    );
  }

  private async buildLoginResponse(
    user: UserWithEmployee,
  ): Promise<LoginResponse> {
    const tokens = await this.issueTokens(user);

    // Get access token TTL in seconds
    const ttlConfig = this.config.getOrThrow<string>('app.jwtAccessTtl');
    let expiresIn = 900; // default 15 minutes

    // Parse TTL (e.g., "15m", "1h", "3600")
    if (typeof ttlConfig === 'string') {
      if (ttlConfig.endsWith('m')) {
        expiresIn = parseInt(ttlConfig) * 60;
      } else if (ttlConfig.endsWith('h')) {
        expiresIn = parseInt(ttlConfig) * 3600;
      } else if (ttlConfig.endsWith('d')) {
        expiresIn = parseInt(ttlConfig) * 86400;
      } else {
        expiresIn = parseInt(ttlConfig);
      }
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn,
      user: this.toAuthUser(user),
    };
  }

  async login(input: LoginInput): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: input.username },
      include: { employee: true },
    });
    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }
    const passwordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Username atau password salah');
    }
    if (!user.isActive || !user.employee.isActive) {
      throw new UnauthorizedException('Akun dinonaktifkan, hubungi HRD');
    }
    return this.buildLoginResponse(user);
  }

  private async issueTokens(user: UserWithEmployee) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    // Set refresh token expiry (default 7 days)
    const refreshTtl = this.config.getOrThrow<string>('app.jwtRefreshTtl');
    let expiryDays = 7;

    if (typeof refreshTtl === 'string') {
      if (refreshTtl.endsWith('d')) {
        expiryDays = parseInt(refreshTtl);
      } else if (refreshTtl.endsWith('h')) {
        expiryDays = parseInt(refreshTtl) / 24;
      } else if (refreshTtl.endsWith('m')) {
        expiryDays = parseInt(refreshTtl) / (24 * 60);
      }
    }

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + expiryDays);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: refreshHash,
        refreshTokenExpiry,
        lastLogin: new Date(),
      },
      select: { id: true },
    });
    return { accessToken, refreshToken };
  }

  async refresh(input: RefreshTokenInput): Promise<LoginResponse> {
    let payload: { sub: number; username: string };
    try {
      payload = await this.jwtService.verifyAsync(input.refreshToken, {
        secret: this.config.getOrThrow<string>('app.jwtRefreshSecret'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau kadaluarsa',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { employee: true },
    });
    if (!user || !user.isActive || !user.employee.isActive) {
      throw new UnauthorizedException(
        'Akun tidak ditemukan atau dinonaktifkan',
      );
    }
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException(
        'Sesi sudah berakhir, silakan login ulang',
      );
    }

    // Check if refresh token has expired
    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null, refreshTokenExpiry: null },
        select: { id: true },
      });
      throw new UnauthorizedException(
        'Refresh token kadaluarsa, silakan login ulang',
      );
    }

    const hashMatches = await bcrypt.compare(
      input.refreshToken,
      user.refreshTokenHash,
    );
    if (!hashMatches) {
      // Token refresh diduga dicuri → cabut seluruh sesi
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null, refreshTokenExpiry: null },
        select: { id: true },
      });
      throw new UnauthorizedException(
        'Refresh token tidak cocok, sesi dicabut',
      );
    }

    return this.buildLoginResponse(user);
  }

  async logout(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenExpiry: null },
      select: { id: true },
    });
  }

  async getMe(userId: number): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }
    return this.toAuthUser(user);
  }

  async changePassword(
    userId: number,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    const valid = await bcrypt.compare(input.oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Password lama salah');
    }
    if (input.oldPassword === input.newPassword) {
      throw new ConflictException('Password baru tidak boleh sama dengan lama');
    }
    const newHash = await bcrypt.hash(input.newPassword, 10);
    // Invalidate all sessions on password change
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        refreshTokenHash: null,
        refreshTokenExpiry: null,
      },
      select: { id: true },
    });
  }
}
