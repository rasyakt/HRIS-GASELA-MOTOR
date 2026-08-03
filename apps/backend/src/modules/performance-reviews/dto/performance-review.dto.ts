import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreatePerformanceReviewInput,
  PerformanceReviewQuery,
  UpdatePerformanceReviewInput,
} from '@gasela/shared-types';
import {
  createPerformanceReviewSchema,
  performanceReviewQuerySchema,
  updatePerformanceReviewSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export type {
  CreatePerformanceReviewInput,
  UpdatePerformanceReviewInput,
  PerformanceReviewQuery,
} from '@gasela/shared-types';

export class CreatePerformanceReviewDto
  extends createZodDto(createPerformanceReviewSchema)
  implements CreatePerformanceReviewInput
{
  @ApiProperty({ example: 2 })
  employeeId: number;
  @ApiProperty({ example: 3 })
  reviewerId: number;
  @ApiProperty({ example: 8 })
  periodMonth: number;
  @ApiProperty({ example: 2026 })
  periodYear: number;
  @ApiProperty({ example: '2026-08-15' })
  reviewDate: Date;
  @ApiPropertyOptional({ example: 85.5 })
  overallScore?: number | null;
  @ApiPropertyOptional({ example: 'Kerja keras dan disiplin' })
  strengths?: string | null;
  @ApiPropertyOptional({ example: 'Perlu meningkatkan komunikasi' })
  areasForImprovement?: string | null;
  @ApiPropertyOptional({ example: 'Mencapai target penjualan' })
  goalsNextPeriod?: string | null;
  @ApiPropertyOptional({ enum: ['draft', 'submitted', 'completed'], default: 'draft' })
  status: 'draft' | 'submitted' | 'completed';
}

export class UpdatePerformanceReviewDto
  extends createZodDto(updatePerformanceReviewSchema)
  implements UpdatePerformanceReviewInput {}

export class PerformanceReviewQueryDto
  extends createZodDto(performanceReviewQuerySchema)
  implements PerformanceReviewQuery
{
  @ApiPropertyOptional({ description: 'Filter per karyawan' })
  employeeId?: number;
}
