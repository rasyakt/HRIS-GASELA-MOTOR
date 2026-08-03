import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AssetAssignmentQuery,
  CreateAssetAssignmentInput,
  UpdateAssetAssignmentInput,
} from '@gasela/shared-types';
import {
  assetAssignmentQuerySchema,
  createAssetAssignmentSchema,
  updateAssetAssignmentSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export type {
  AssetAssignmentQuery,
  CreateAssetAssignmentInput,
  UpdateAssetAssignmentInput,
} from '@gasela/shared-types';

export class CreateAssetAssignmentDto
  extends createZodDto(createAssetAssignmentSchema)
  implements CreateAssetAssignmentInput
{
  @ApiProperty({ example: 2 })
  employeeId: number;
  @ApiProperty({ example: 'Laptop Lenovo ThinkPad' })
  assetName: string;
  @ApiProperty({ example: 'AST-001' })
  assetCode: string;
  @ApiPropertyOptional({ example: 'SN123456789' })
  serialNumber?: string | null;
  @ApiProperty({ example: '2026-08-01' })
  assignmentDate: Date;
  @ApiPropertyOptional({ example: '2027-08-01' })
  returnDate?: Date | null;
  @ApiPropertyOptional({ enum: ['assigned', 'returned'], default: 'assigned' })
  status: 'assigned' | 'returned';
  @ApiPropertyOptional({ example: 'Kondisi baik' })
  conditionNotes?: string | null;
}

export class UpdateAssetAssignmentDto
  extends createZodDto(updateAssetAssignmentSchema)
  implements UpdateAssetAssignmentInput {}

export class AssetAssignmentQueryDto
  extends createZodDto(assetAssignmentQuerySchema)
  implements AssetAssignmentQuery
{
  @ApiPropertyOptional({ description: 'Filter per karyawan' })
  employeeId?: number;
}
