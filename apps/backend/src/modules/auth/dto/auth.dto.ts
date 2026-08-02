import { ApiProperty } from '@nestjs/swagger';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
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
