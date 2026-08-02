import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  BalanceQuery,
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  DecideLeaveInput,
  LeaveQuery,
  UpdateLeaveTypeInput,
} from '@gasela/shared-types';
import {
  balanceQuerySchema,
  createLeaveRequestSchema,
  createLeaveTypeSchema,
  decideLeaveSchema,
  leaveQuerySchema,
  updateLeaveTypeSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateLeaveTypeDto
  extends createZodDto(createLeaveTypeSchema)
  implements CreateLeaveTypeInput
{
  @ApiProperty({ example: 'CT' })
  code: string;
  @ApiProperty({ example: 'Cuti Tahunan' })
  name: string;
  @ApiProperty({ example: 12 })
  annualQuota: number;
  @ApiPropertyOptional({ default: true })
  isPaid: boolean;
  @ApiPropertyOptional({ default: false })
  requiresDocument: boolean;
  @ApiPropertyOptional({ example: 12 })
  maxConsecutiveDays?: number;
  @ApiPropertyOptional({ example: 3 })
  minNoticeDays?: number;
}

export class UpdateLeaveTypeDto
  extends createZodDto(updateLeaveTypeSchema)
  implements UpdateLeaveTypeInput
{
  @ApiPropertyOptional()
  code?: string;
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional()
  annualQuota?: number;
  @ApiPropertyOptional()
  isPaid?: boolean;
  @ApiPropertyOptional()
  requiresDocument?: boolean;
  @ApiPropertyOptional()
  maxConsecutiveDays?: number;
  @ApiPropertyOptional()
  minNoticeDays?: number;
}

export class CreateLeaveRequestDto
  extends createZodDto(createLeaveRequestSchema)
  implements CreateLeaveRequestInput
{
  @ApiProperty({ example: 1, description: 'ID jenis cuti' })
  leaveTypeId: number;
  @ApiProperty({ example: '2026-08-10' })
  startDate: string;
  @ApiProperty({ example: '2026-08-12' })
  endDate: string;
  @ApiProperty({ example: 'Liburan keluarga' })
  reason: string;
}

export class DecideLeaveDto
  extends createZodDto(decideLeaveSchema)
  implements DecideLeaveInput
{
  @ApiProperty({ enum: ['approved', 'rejected'] })
  status: 'approved' | 'rejected';
  @ApiPropertyOptional({ example: 'Bertepatan dengan pekerjaan penting' })
  rejectionReason?: string;
}

export class LeaveQueryDto
  extends createZodDto(leaveQuerySchema)
  implements LeaveQuery
{
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 20 })
  limit: number;
  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
  })
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  @ApiPropertyOptional({ description: 'Filter karyawan (khusus admin/hrd)' })
  employeeId?: number;
}

export class BalanceQueryDto
  extends createZodDto(balanceQuerySchema)
  implements BalanceQuery
{
  @ApiPropertyOptional({ example: 2026 })
  year?: number;
  @ApiPropertyOptional({ description: 'Filter karyawan (khusus admin/hrd)' })
  employeeId?: number;
}
