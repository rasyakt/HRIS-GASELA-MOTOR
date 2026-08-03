import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateTrainingRecordInput,
  TrainingRecordQuery,
  UpdateTrainingRecordInput,
} from '@gasela/shared-types';
import {
  createTrainingRecordSchema,
  trainingRecordQuerySchema,
  updateTrainingRecordSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export type {
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
  TrainingRecordQuery,
} from '@gasela/shared-types';

export class CreateTrainingRecordDto
  extends createZodDto(createTrainingRecordSchema)
  implements CreateTrainingRecordInput
{
  @ApiProperty({ example: 2 })
  employeeId: number;
  @ApiProperty({ example: 'Pelatihan Service Motor' })
  trainingName: string;
  @ApiPropertyOptional({ example: 'Yamaha Training Center' })
  trainingProvider?: string | null;
  @ApiProperty({ example: '2026-08-01' })
  startDate: Date;
  @ApiProperty({ example: '2026-08-03' })
  endDate: Date;
  @ApiPropertyOptional({ example: 24 })
  durationHours?: number | null;
  @ApiPropertyOptional({ example: '/api/uploads/document/sertifikat.pdf' })
  certificateUrl?: string | null;
  @ApiPropertyOptional({ example: 500000 })
  cost?: number | null;
  @ApiPropertyOptional({ example: 'Biaya ditanggung perusahaan' })
  notes?: string | null;
}

export class UpdateTrainingRecordDto
  extends createZodDto(updateTrainingRecordSchema)
  implements UpdateTrainingRecordInput {}

export class TrainingRecordQueryDto
  extends createZodDto(trainingRecordQuerySchema)
  implements TrainingRecordQuery
{
  @ApiPropertyOptional({ description: 'Filter per karyawan' })
  employeeId?: number;
}
