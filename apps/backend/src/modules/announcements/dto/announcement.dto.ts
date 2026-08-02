import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AnnouncementQuery,
  CreateAnnouncementInput,
  MarkAnnouncementReadInput,
  UpdateAnnouncementInput,
} from '@gasela/shared-types';
import {
  announcementQuerySchema,
  createAnnouncementSchema,
  markAnnouncementReadSchema,
  updateAnnouncementSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateAnnouncementDto
  extends createZodDto(createAnnouncementSchema)
  implements CreateAnnouncementInput
{
  @ApiProperty({ example: 'Jadwal Kerja Lebaran' })
  title: string;
  @ApiProperty({ example: 'Seluruh karyawan harap memperhatikan...' })
  content: string;
  @ApiPropertyOptional({
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  priority: 'low' | 'normal' | 'high' | 'urgent';
  @ApiPropertyOptional({
    enum: ['all', 'department', 'position', 'specific'],
    default: 'all',
  })
  targetAudience: 'all' | 'department' | 'position' | 'specific';
  @ApiPropertyOptional({
    example: 1,
    description: 'Wajib jika targetAudience=department',
  })
  targetDepartmentId?: number;
  @ApiPropertyOptional({
    example: 1,
    description: 'Wajib jika targetAudience=position',
  })
  targetPositionId?: number;
  @ApiPropertyOptional({
    example: 1,
    description: 'Wajib jika targetAudience=specific',
  })
  targetEmployeeId?: number;
  @ApiPropertyOptional({ example: '2026-08-02' })
  publishDate: Date;
  @ApiPropertyOptional({ example: '2026-08-31', nullable: true })
  expiryDate?: Date | null;
}

export class UpdateAnnouncementDto
  extends createZodDto(updateAnnouncementSchema)
  implements UpdateAnnouncementInput
{
  @ApiPropertyOptional()
  title?: string;
  @ApiPropertyOptional()
  content?: string;
  @ApiPropertyOptional()
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  @ApiPropertyOptional()
  targetAudience?: 'all' | 'department' | 'position' | 'specific';
  @ApiPropertyOptional()
  publishDate?: Date;
  @ApiPropertyOptional({ nullable: true })
  expiryDate?: Date | null;
}

export class AnnouncementQueryDto
  extends createZodDto(announcementQuerySchema)
  implements AnnouncementQuery
{
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 10 })
  limit: number;
  @ApiPropertyOptional({ enum: ['all', 'published', 'draft'], default: 'all' })
  status?: 'all' | 'published' | 'draft';
  @ApiPropertyOptional({ description: 'Cari berdasarkan judul/isi' })
  keyword?: string;
}

export class MarkAnnouncementReadDto
  extends createZodDto(markAnnouncementReadSchema)
  implements MarkAnnouncementReadInput
{
  @ApiProperty({ example: 1 })
  announcementId: number;
}
