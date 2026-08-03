import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export interface CreateDocumentInput {
  employeeId: number;
  documentType: string;
  documentName: string;
  documentUrl: string;
  expiryDate?: string;
}

export interface DocumentQuery {
  employeeId?: number;
  expiringDays?: number;
}

const documentTypes = [
  'ktp',
  'npwp',
  'ijazah',
  'sertifikat',
  'kontrak',
  'skck',
  'cv',
  'other',
] as const;

export const createDocumentSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  documentType: z.enum(documentTypes, {
    errorMap: () => ({
      message: `Tipe dokumen harus salah satu: ${documentTypes.join(', ')}`,
    }),
  }),
  documentName: z.string().min(1, 'Nama dokumen wajib diisi').max(200),
  documentUrl: z.string().url('URL dokumen tidak valid'),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
});
export class CreateDocumentDto
  extends createZodDto(createDocumentSchema)
  implements CreateDocumentInput
{
  @ApiProperty({ example: 2 })
  employeeId: number;
  @ApiProperty({ example: 'ktp' })
  documentType: string;
  @ApiProperty({ example: 'KTP Budi Santoso' })
  documentName: string;
  @ApiProperty({ example: '/api/uploads/document/xxx.pdf' })
  documentUrl: string;
  @ApiPropertyOptional({ example: '2030-01-01' })
  expiryDate?: string;
}

export const documentQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  expiringDays: z.coerce.number().int().min(1).max(365).optional(),
});
export class DocumentQueryDto
  extends createZodDto(documentQuerySchema)
  implements DocumentQuery
{
  @ApiPropertyOptional({ description: 'Filter per karyawan' })
  employeeId?: number;
  @ApiPropertyOptional({
    description: 'Tampilkan dokumen yang akan kedaluwarsa dalam N hari',
  })
  expiringDays?: number;
}
