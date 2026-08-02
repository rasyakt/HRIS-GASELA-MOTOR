import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from '../../../common/dto/create-zod-dto';

const registerDeviceSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

export class RegisterDeviceDto
  extends createZodDto(registerDeviceSchema)
  implements z.infer<typeof registerDeviceSchema>
{
  @ApiProperty({ example: 'fcm_token_dari_expo_or_firebase' })
  token: string;
  @ApiPropertyOptional({ enum: ['android', 'ios', 'web'], default: 'android' })
  platform: 'android' | 'ios' | 'web';
}
