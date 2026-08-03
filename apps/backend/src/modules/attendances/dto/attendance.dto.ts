import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AttendanceQuery,
  CheckInInput,
  CheckOutInput,
} from '@gasela/shared-types';
import {
  attendanceQuerySchema,
  checkInSchema,
  checkOutSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CheckInDto
  extends createZodDto(checkInSchema)
  implements CheckInInput
{
  @ApiProperty({ example: -6.914744 })
  latitude: number;
  @ApiProperty({ example: 107.60981 })
  longitude: number;
  @ApiPropertyOptional({
    example: 1,
    description: 'ID shift (opsional, default shift pertama)',
  })
  shiftId?: number;
  @ApiPropertyOptional({ example: 'Berangkat lebih awal' })
  notes?: string;
  @ApiPropertyOptional({
    example: '/api/uploads/attendance/xxx.jpg',
    description: 'URL foto check-in (hasil upload kategori attendance)',
  })
  photoUrl?: string;
}

export class CheckOutDto
  extends createZodDto(checkOutSchema)
  implements CheckOutInput
{
  @ApiProperty({ example: -6.914744 })
  latitude: number;
  @ApiProperty({ example: 107.60981 })
  longitude: number;
  @ApiPropertyOptional()
  notes?: string;
  @ApiPropertyOptional({
    example: '/api/uploads/attendance/xxx.jpg',
    description: 'URL foto check-out (hasil upload kategori attendance)',
  })
  photoUrl?: string;
}

export class AttendanceQueryDto
  extends createZodDto(attendanceQuerySchema)
  implements AttendanceQuery
{
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 20 })
  limit: number;
  @ApiPropertyOptional({ description: 'Filter karyawan (khusus admin/hrd)' })
  employeeId?: number;
  @ApiPropertyOptional({ example: '2026-08-01' })
  from?: string;
  @ApiPropertyOptional({ example: '2026-08-31' })
  to?: string;
}
