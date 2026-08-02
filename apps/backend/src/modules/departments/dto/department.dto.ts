import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateDepartmentDto extends createZodDto(createDepartmentSchema) {
  @ApiProperty({
    example: 'SVC',
    description: 'Kode unik (dikapitalisasi otomatis)',
  })
  code: string;
  @ApiProperty({ example: 'Service' })
  name: string;
  @ApiPropertyOptional({ example: 1, description: 'ID departemen induk' })
  parentId?: number | null;
  @ApiPropertyOptional({
    example: 1,
    description: 'ID karyawan kepala departemen',
  })
  headEmployeeId?: number | null;
}

export class UpdateDepartmentDto extends createZodDto(updateDepartmentSchema) {
  @ApiPropertyOptional({ example: 'Service Center' })
  code?: string;
  @ApiPropertyOptional({ example: 'Service Center' })
  name?: string;
  @ApiPropertyOptional()
  parentId?: number | null;
  @ApiPropertyOptional()
  headEmployeeId?: number | null;
}
