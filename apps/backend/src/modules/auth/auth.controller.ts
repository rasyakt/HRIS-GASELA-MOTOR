import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import type { AuthUser, LoginResponse } from '@gasela/shared-types';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

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
    description: 'Berhasil login, mengembalikan token & profil',
  })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const result = await this.authService.login(body, ipAddress);
    await this.auditLogsService.record({
      action: 'login',
      resource: 'auth',
      userId: result.user.id,
      username: result.user.username,
      ipAddress,
      userAgent: req.headers['user-agent'],
    });
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
}
