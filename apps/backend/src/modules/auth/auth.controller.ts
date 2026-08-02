import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser, LoginResponse } from '@gasela/shared-types';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@ApiTags('Autentikasi')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Login pengguna' })
  @ApiOkResponse({
    description: 'Berhasil login, mengembalikan token & profil',
  })
  @Post('login')
  login(@Body() body: LoginDto): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Public()
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
