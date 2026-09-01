import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import type {
  AuthUser,
  LoginResponse,
  TwoFactorEnableResponse,
  TwoFactorRegenerateResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from '@gasela/shared-types';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  TwoFactorDisableDto,
  TwoFactorEnableDto,
  TwoFactorRegenerateRecoveryCodesDto,
  TwoFactorVerifyDto,
} from './dto/auth.dto';

/** Endpoint auth sensitif dibatasi lebih ketat: 5 req/menit per IP */
const AUTH_THROTTLE = { global: { limit: 5, ttl: 60_000 } };

@ApiTags('Autentikasi')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Login pengguna' })
  @ApiOkResponse({
    description: 'Berhasil login, mengembalikan token & profil atau tantangan 2FA',
  })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const result = await this.authService.login(body, ipAddress);

    if (result.user) {
      await this.auditLogsService.record({
        action: result.requires2FA ? 'login_2fa_challenge' : 'login',
        resource: 'auth',
        userId: result.user.id,
        username: result.user.username,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    return result;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Verifikasi login 2FA (TOTP / Recovery Code)' })
  @Post('2fa/verify')
  async verify2Fa(
    @Body() body: TwoFactorVerifyDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const result = await this.authService.verify2FaLogin(body, ipAddress);

    if (result.user) {
      await this.auditLogsService.record({
        action: 'login_2fa_success',
        resource: 'auth',
        userId: result.user.id,
        username: result.user.username,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    return result;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Perbarui (refresh) token' })
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto): Promise<LoginResponse> {
    return this.authService.refresh(body);
  }

  @HttpCode(204)
  @ApiOperation({ summary: 'Logout (cabut sesi refresh)' })
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.authService.logout(user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Profil user yang sedang login' })
  @ApiOkResponse({ description: 'Profil pengguna' })
  async me(@CurrentUser() user: AuthUser): Promise<AuthUser> {
    return this.authService.getMe(user.id);
  }

  @HttpCode(204)
  @ApiOperation({ summary: 'Ganti password sendiri' })
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user.id, body);
  }

  // ===================== 2FA / MFA ENDPOINTS =====================

  @Get('2fa/status')
  @ApiOperation({ summary: 'Periksa status 2FA akun saat ini' })
  async get2FaStatus(
    @CurrentUser() user: AuthUser,
  ): Promise<TwoFactorStatusResponse> {
    return this.authService.get2FaStatus(user.id);
  }

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Buat secret baru & QR code untuk aktivasi 2FA' })
  async setup2Fa(
    @CurrentUser() user: AuthUser,
  ): Promise<TwoFactorSetupResponse> {
    return this.authService.generate2FaSetup(user.id);
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Konfirmasi aktivasi 2FA dengan kode OTP 6 digit' })
  async enable2Fa(
    @CurrentUser() user: AuthUser,
    @Body() body: TwoFactorEnableDto,
    @Req() req: Request,
  ): Promise<TwoFactorEnableResponse> {
    const result = await this.authService.enable2Fa(user.id, body.code);
    await this.auditLogsService.record({
      action: '2fa_enabled',
      resource: 'auth',
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post('2fa/disable')
  @ApiOperation({ summary: 'Nonaktifkan 2FA dengan konfirmasi password' })
  async disable2Fa(
    @CurrentUser() user: AuthUser,
    @Body() body: TwoFactorDisableDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const result = await this.authService.disable2Fa(user.id, body);
    await this.auditLogsService.record({
      action: '2fa_disabled',
      resource: 'auth',
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post('2fa/recovery-codes')
  @ApiOperation({ summary: 'Buat ulang (regenerate) recovery codes 2FA' })
  async regenerateRecoveryCodes(
    @CurrentUser() user: AuthUser,
    @Body() body: TwoFactorRegenerateRecoveryCodesDto,
    @Req() req: Request,
  ): Promise<TwoFactorRegenerateResponse> {
    const result = await this.authService.regenerateRecoveryCodes(user.id, body);
    await this.auditLogsService.record({
      action: '2fa_recovery_codes_regenerated',
      resource: 'auth',
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }
}
