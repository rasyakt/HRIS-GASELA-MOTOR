import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  createPositionSchema,
  updatePositionSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreatePositionDto extends createZodDto(createPositionSchema) {
  @ApiProperty({
    example: 'KASE',
    description: 'Kode unik (dikapitalisasi otomatis)',
  })
  code: string;
  @ApiProperty({ example: 'Kepala Sales' })
  name: string;
  @ApiPropertyOptional({ example: 'Mengelola tim sales' })
  jobDescription?: string | null;
  @ApiPropertyOptional({ example: 2 })
  level?: number | null;
  @ApiPropertyOptional({ example: 5000000 })
  minSalary?: number | null;
  @ApiPropertyOptional({ example: 10000000 })
  maxSalary?: number | null;
}

export class UpdatePositionDto extends createZodDto(updatePositionSchema) {
  @ApiPropertyOptional()
  code?: string;
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional()
  jobDescription?: string | null;
  @ApiPropertyOptional()
  level?: number | null;
  @ApiPropertyOptional()
  minSalary?: number | null;
  @ApiPropertyOptional()
  maxSalary?: number | null;
}
