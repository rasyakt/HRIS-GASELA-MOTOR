import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as qrcode from 'qrcode';
import {
  generateOtpauthUrl,
  generateTotpSecret,
  verifyTotpCode,
} from '../../common/utils/totp.util';
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  LoginResponse,
  RefreshTokenInput,
  TwoFactorDisableInput,
  TwoFactorEnableResponse,
  TwoFactorRegenerateRecoveryCodesInput,
  TwoFactorRegenerateResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  TwoFactorVerifyInput,
} from '@gasela/shared-types';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertPasswordComplexity } from '../../common/utils/password-validator';
import { WinstonLoggerService } from '../../common/logger/logger.service';
import { decrypt, encrypt } from '../../common/utils/encryption.util';

interface UserWithEmployee {
  id: number;
  employeeId: number;
  username: string;
  passwordHash: string;
  role: UserRole;
  refreshTokenHash: string | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorRecoveryCodes?: string | null;
  isActive: boolean;
  jwtVersion: number | null;
  employee: { fullName: string; departmentId: number | null };
}

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {}

  private toAuthUser(u: UserWithEmployee): AuthUser {
    return {
      id: u.id,
      employeeId: u.employeeId,
      username: u.username,
      role: u.role,
      fullName: u.employee?.fullName ?? u.username,
      department: null,
      twoFactorEnabled: !!u.twoFactorEnabled,
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
        jwtVersion: u.jwtVersion || 0,
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

  private signTemp2FaToken(userId: number): string {
    return this.jwtService.sign(
      { sub: userId, isTemp2FA: true },
      {
        secret: this.config.getOrThrow<string>('app.jwtSecret'),
        expiresIn: '5m',
      },
    );
  }

  private generateRecoveryCodes(count = 8): {
    rawCodes: string[];
    hashedCodes: string[];
  } {
    const rawCodes: string[] = [];
    const hashedCodes: string[] = [];
    for (let i = 0; i < count; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${part1}-${part2}-${part3}`;
      rawCodes.push(code);
      const hashed = crypto.createHash('sha256').update(code).digest('hex');
      hashedCodes.push(hashed);
    }
    return { rawCodes, hashedCodes };
  }

  private async buildLoginResponse(
    user: UserWithEmployee,
  ): Promise<LoginResponse> {
    const tokens = await this.issueTokens(user);

    // Get access token TTL in seconds
    const ttlConfig = this.config.getOrThrow<string>('app.jwtAccessTtl');
    let expiresIn = 900; // default 15 minutes

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

  async login(input: LoginInput, ipAddress?: string): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: input.username },
      include: { employee: true },
    });

    if (!user) {
      this.logger.failedLogin(input.username, ipAddress || 'unknown', 'user_not_found');
      throw new UnauthorizedException('Username atau password salah');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      this.logger.warn(
        `Login attempt on locked account: ${user.username} from IP: ${ipAddress}`,
        'AuthService',
      );
      throw new UnauthorizedException(
        `Akun dikunci karena terlalu banyak percobaan login gagal. Coba lagi dalam ${minutesLeft} menit.`,
      );
    }

    // Validate password
    const passwordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      this.logger.failedLogin(input.username, ipAddress || 'unknown', 'invalid_password');

      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(
          lockUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES,
        );

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil: lockUntil,
          },
        });

        this.logger.accountLocked(user.username, ipAddress || 'unknown', lockUntil);
        throw new UnauthorizedException(
          `Akun dikunci selama ${this.LOCKOUT_DURATION_MINUTES} menit karena terlalu banyak percobaan login gagal.`,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });

      const remainingAttempts = this.MAX_FAILED_ATTEMPTS - failedAttempts;
      throw new UnauthorizedException(
        `Username atau password salah. ${remainingAttempts} percobaan tersisa.`,
      );
    }

    // Check if user is active
    if (!user.isActive || !user.employee.isActive) {
      this.logger.failedLogin(input.username, ipAddress || 'unknown', 'account_inactive');
      throw new UnauthorizedException('Akun dinonaktifkan, hubungi HRD');
    }

    // Two-Factor Authentication Check
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = this.signTemp2FaToken(user.id);
      return {
        requires2FA: true,
        tempToken,
        user: this.toAuthUser(user),
      };
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true },
    });

    this.logger.successfulLogin(user.username, ipAddress || 'unknown', user.id);
    return this.buildLoginResponse(user);
  }

  private async issueTokens(user: UserWithEmployee) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    const refreshHash = await bcrypt.hash(refreshToken, 10);

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

    assertPasswordComplexity(input.newPassword);
    const newHash = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
        refreshTokenHash: null,
        refreshTokenExpiry: null,
        jwtVersion: { increment: 1 },
      },
      select: { id: true },
    });
  }

  // ===================== 2FA / MFA METHODS =====================

  async get2FaStatus(userId: number): Promise<TwoFactorStatusResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorRecoveryCodes: true },
    });
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    let hasRecoveryCodes = false;
    if (user.twoFactorRecoveryCodes) {
      try {
        const codes = JSON.parse(user.twoFactorRecoveryCodes);
        hasRecoveryCodes = Array.isArray(codes) && codes.length > 0;
      } catch {}
    }

    return {
      enabled: user.twoFactorEnabled,
      hasRecoveryCodes,
    };
  }

  async generate2FaSetup(userId: number): Promise<TwoFactorSetupResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    const secret = generateTotpSecret(20);
    const otpauthUrl = generateOtpauthUrl(
      user.username,
      'HRIS Gasela Motor',
      secret,
    );
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    const encryptedSecret = encrypt(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptedSecret },
    });

    return {
      secret,
      qrCodeUrl,
      otpauthUrl,
    };
  }

  async enable2Fa(
    userId: number,
    code: string,
  ): Promise<TwoFactorEnableResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user || !user.twoFactorSecret) {
      throw new ConflictException('Silakan lakukan setup 2FA terlebih dahulu');
    }

    const secret = decrypt(user.twoFactorSecret);
    if (!secret) {
      throw new ConflictException('Gagal mendekripsi secret 2FA');
    }

    const isValid = verifyTotpCode(code.trim(), secret);
    if (!isValid) {
      throw new UnauthorizedException('Kode OTP 2FA salah atau kadaluarsa');
    }

    const { rawCodes, hashedCodes } = this.generateRecoveryCodes(8);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: JSON.stringify(hashedCodes),
      },
    });

    return {
      message: 'Autentikasi Dua Langkah (2FA) berhasil diaktifkan',
      recoveryCodes: rawCodes,
    };
  }

  async verify2FaLogin(
    input: TwoFactorVerifyInput,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    let payload: { sub: number; isTemp2FA?: boolean };
    try {
      payload = await this.jwtService.verifyAsync(input.tempToken, {
        secret: this.config.getOrThrow<string>('app.jwtSecret'),
      });
    } catch {
      throw new UnauthorizedException(
        'Sesi 2FA tidak valid atau sudah kadaluarsa',
      );
    }

    if (!payload.isTemp2FA) {
      throw new UnauthorizedException('Token 2FA tidak valid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { employee: true },
    });

    if (!user || !user.isActive || !user.employee.isActive) {
      throw new UnauthorizedException('Akun tidak aktif atau tidak ditemukan');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ConflictException('2FA belum diaktifkan pada akun ini');
    }

    const cleanCode = input.code.trim().toUpperCase();
    let codeValid = false;

    // 1. Try TOTP code
    const secret = decrypt(user.twoFactorSecret);
    if (secret && cleanCode.length === 6 && /^\d{6}$/.test(cleanCode)) {
      codeValid = verifyTotpCode(cleanCode, secret);
    }

    // 2. If not valid TOTP, try Recovery Code
    if (!codeValid && user.twoFactorRecoveryCodes) {
      try {
        const hashedCodes: string[] = JSON.parse(user.twoFactorRecoveryCodes);
        const inputHashed = crypto
          .createHash('sha256')
          .update(cleanCode)
          .digest('hex');
        const codeIndex = hashedCodes.indexOf(inputHashed);
        if (codeIndex !== -1) {
          codeValid = true;
          // Consume the used recovery code
          hashedCodes.splice(codeIndex, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { twoFactorRecoveryCodes: JSON.stringify(hashedCodes) },
          });
        }
      } catch {}
    }

    if (!codeValid) {
      this.logger.failedLogin(
        user.username,
        ipAddress || 'unknown',
        'invalid_2fa_code',
      );
      throw new UnauthorizedException('Kode OTP atau recovery code salah');
    }

    // Reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    this.logger.successfulLogin(user.username, ipAddress || 'unknown', user.id);
    return this.buildLoginResponse(user);
  }

  async disable2Fa(
    userId: number,
    input: TwoFactorDisableInput,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Password konfirmasi salah');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });

    return { message: 'Autentikasi Dua Langkah (2FA) berhasil dinonaktifkan' };
  }

  async regenerateRecoveryCodes(
    userId: number,
    input: TwoFactorRegenerateRecoveryCodesInput,
  ): Promise<TwoFactorRegenerateResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, twoFactorEnabled: true },
    });
    if (!user || !user.twoFactorEnabled) {
      throw new ConflictException('2FA belum diaktifkan pada akun ini');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Password konfirmasi salah');
    }

    const { rawCodes, hashedCodes } = this.generateRecoveryCodes(8);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: JSON.stringify(hashedCodes) },
    });

    return {
      message: 'Kode pemulihan baru berhasil dibuat',
      recoveryCodes: rawCodes,
    };
  }
}
