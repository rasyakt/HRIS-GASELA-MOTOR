import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateShiftInput, UpdateShiftInput } from '@gasela/shared-types';
import { createShiftSchema, updateShiftSchema } from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateShiftDto
  extends createZodDto(createShiftSchema)
  implements CreateShiftInput
{
  @ApiProperty({ example: 'Shift Pagi' })
  name: string;
  @ApiProperty({ example: '08:00:00', description: 'Jam mulai (HH:mm:ss)' })
  startTime: string;
  @ApiProperty({ example: '17:00:00', description: 'Jam selesai (HH:mm:ss)' })
  endTime: string;
  @ApiPropertyOptional({
    example: 15,
    description: 'Toleransi terlambat (menit)',
  })
  gracePeriodMinutes: number;
  @ApiPropertyOptional({ example: 8 })
  workHours: number;
}

export class UpdateShiftDto
  extends createZodDto(updateShiftSchema)
  implements UpdateShiftInput
{
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional()
  startTime?: string;
  @ApiPropertyOptional()
  endTime?: string;
  @ApiPropertyOptional()
  gracePeriodMinutes?: number;
  @ApiPropertyOptional()
  workHours?: number;
  @ApiPropertyOptional({ description: 'Status aktif shift' })
  isActive?: boolean;
}
