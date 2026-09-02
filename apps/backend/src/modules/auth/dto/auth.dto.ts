import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  twoFactorVerifySchema,
  twoFactorEnableSchema,
  twoFactorDisableSchema,
  twoFactorRegenerateRecoveryCodesSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class LoginDto extends createZodDto(loginSchema) {
  @ApiProperty({ example: 'admin', description: 'Username akun' })
  username: string;
  @ApiProperty({
    example: 'Admin123!',
    description: 'Password (min 8, ada huruf besar & angka)',
  })
  password: string;
  @ApiPropertyOptional({
    example: true,
    description: 'Ingat saya',
    default: false,
  })
  rememberMe?: boolean;
}

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {
  @ApiProperty({
    example: '<refreshToken>',
    description: 'Refresh token aktif',
  })
  refreshToken: string;
}

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {
  @ApiProperty({ description: 'Password lama' })
  oldPassword: string;
  @ApiProperty({
    description: 'Password baru (minimal 8, ada huruf besar & angka)',
  })
  newPassword: string;
}

export class TwoFactorVerifyDto extends createZodDto(twoFactorVerifySchema) {
  @ApiProperty({ description: 'Token sementara dari login tahap 1' })
  tempToken: string;
  @ApiProperty({ description: 'Kode OTP 6 digit dari Authenticator atau recovery code' })
  code: string;
  @ApiPropertyOptional({
    example: true,
    description: 'Ingat saya',
    default: false,
  })
  rememberMe?: boolean;
}

export class TwoFactorEnableDto extends createZodDto(twoFactorEnableSchema) {
  @ApiProperty({ example: '123456', description: 'Kode OTP 6 digit konfirmasi' })
  code: string;
}

export class TwoFactorDisableDto extends createZodDto(twoFactorDisableSchema) {
  @ApiProperty({ description: 'Password akun untuk konfirmasi penonaktifan' })
  password: string;
}

export class TwoFactorRegenerateRecoveryCodesDto extends createZodDto(
  twoFactorRegenerateRecoveryCodesSchema,
) {
  @ApiProperty({ description: 'Password akun untuk verifikasi' })
  password: string;
}
