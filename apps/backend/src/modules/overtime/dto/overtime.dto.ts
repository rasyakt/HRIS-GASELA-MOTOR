import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateOvertimeInput,
  DecideOvertimeInput,
  OvertimeQuery,
} from '@gasela/shared-types';
import {
  createOvertimeSchema,
  decideOvertimeSchema,
  overtimeQuerySchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateOvertimeDto
  extends createZodDto(createOvertimeSchema)
  implements CreateOvertimeInput
{
  @ApiProperty({ example: '2026-08-05' })
  overtimeDate: string;
  @ApiProperty({ example: '18:00:00', description: 'Jam mulai (HH:mm:ss)' })
  startTime: string;
  @ApiProperty({ example: '21:30:00', description: 'Jam selesai (HH:mm:ss)' })
  endTime: string;
  @ApiProperty({ example: 'Menyelesaikan laporan bulanan' })
  purpose: string;
}

export class DecideOvertimeDto
  extends createZodDto(decideOvertimeSchema)
  implements DecideOvertimeInput
{
  @ApiProperty({ enum: ['approved', 'rejected'] })
  status: 'approved' | 'rejected';
}

export class OvertimeQueryDto
  extends createZodDto(overtimeQuerySchema)
  implements OvertimeQuery
{
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 20 })
  limit: number;
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'] })
  status?: 'pending' | 'approved' | 'rejected';
  @ApiPropertyOptional({ description: 'Filter karyawan (khusus admin/hrd)' })
  employeeId?: number;
}
