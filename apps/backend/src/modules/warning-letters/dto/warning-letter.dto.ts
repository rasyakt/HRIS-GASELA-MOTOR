import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export const createWarningLetterSchema = z.object({
  employeeId: z.number().int().positive('ID Karyawan wajib diisi'),
  letterNumber: z.string().min(3, 'Nomor surat minimal 3 karakter'),
  level: z.enum(['SP1', 'SP2', 'SP3']),
  violationReason: z.string().min(5, 'Alasan pelanggaran minimal 5 karakter'),
  issuedDate: z.string().date('Tanggal terbit tidak valid'),
  effectiveUntil: z.string().date('Tanggal berlaku tidak valid'),
  documentUrl: z.string().optional().nullable(),
});

export const updateWarningLetterSchema = createWarningLetterSchema.partial();

export const warningLetterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.coerce.number().int().optional(),
  level: z.enum(['SP1', 'SP2', 'SP3']).optional(),
  search: z.string().optional(),
});

export class CreateWarningLetterDto extends createZodDto(
  createWarningLetterSchema,
) {
  @ApiProperty()
  employeeId: number;
  @ApiProperty()
  letterNumber: string;
  @ApiProperty({ enum: ['SP1', 'SP2', 'SP3'] })
  level: 'SP1' | 'SP2' | 'SP3';
  @ApiProperty()
  violationReason: string;
  @ApiProperty()
  issuedDate: string;
  @ApiProperty()
  effectiveUntil: string;
  @ApiPropertyOptional()
  documentUrl?: string | null;
}

export class UpdateWarningLetterDto extends createZodDto(
  updateWarningLetterSchema,
) {
  @ApiPropertyOptional()
  letterNumber?: string;
  @ApiPropertyOptional({ enum: ['SP1', 'SP2', 'SP3'] })
  level?: 'SP1' | 'SP2' | 'SP3';
  @ApiPropertyOptional()
  violationReason?: string;
  @ApiPropertyOptional()
  issuedDate?: string;
  @ApiPropertyOptional()
  effectiveUntil?: string;
  @ApiPropertyOptional()
  documentUrl?: string | null;
}

export class WarningLetterQueryDto extends createZodDto(
  warningLetterQuerySchema,
) {
  @ApiPropertyOptional({ default: 1 })
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  limit?: number;
  @ApiPropertyOptional()
  employeeId?: number;
  @ApiPropertyOptional({ enum: ['SP1', 'SP2', 'SP3'] })
  level?: 'SP1' | 'SP2' | 'SP3';
  @ApiPropertyOptional()
  search?: string;
}
