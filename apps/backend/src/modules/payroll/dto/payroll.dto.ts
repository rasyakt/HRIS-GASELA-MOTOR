import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ApprovePayrollInput,
  CreateSalaryComponentInput,
  GeneratePayrollInput,
  MarkPaidInput,
  PayrollQuery,
  UpdateSalaryComponentInput,
} from '@gasela/shared-types';
import {
  approvePayrollSchema,
  createSalaryComponentSchema,
  generatePayrollSchema,
  markPaidSchema,
  payrollQuerySchema,
  updateSalaryComponentSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateSalaryComponentDto
  extends createZodDto(createSalaryComponentSchema)
  implements CreateSalaryComponentInput
{
  @ApiProperty({ example: 'TJM' })
  code: string;
  @ApiProperty({ example: 'Tunjangan Makan' })
  name: string;
  @ApiProperty({ enum: ['allowance', 'deduction'] })
  type: 'allowance' | 'deduction';
  @ApiProperty({ enum: ['fixed', 'percentage', 'formula'] })
  calculationType: 'fixed' | 'percentage' | 'formula';
  @ApiPropertyOptional({ example: 500000 })
  defaultAmount?: number | null;
  @ApiPropertyOptional({ default: true })
  isTaxable: boolean;
  @ApiPropertyOptional({ default: true })
  isActive: boolean;
}

export class UpdateSalaryComponentDto
  extends createZodDto(updateSalaryComponentSchema)
  implements UpdateSalaryComponentInput
{
  @ApiPropertyOptional({ example: 'TJM' })
  code?: string;
  @ApiPropertyOptional({ example: 'Tunjangan Makan' })
  name?: string;
  @ApiPropertyOptional({ enum: ['allowance', 'deduction'] })
  type?: 'allowance' | 'deduction';
  @ApiPropertyOptional({ enum: ['fixed', 'percentage', 'formula'] })
  calculationType?: 'fixed' | 'percentage' | 'formula';
  @ApiPropertyOptional({ example: 500000 })
  defaultAmount?: number | null;
  @ApiPropertyOptional()
  isTaxable?: boolean;
  @ApiPropertyOptional()
  isActive?: boolean;
}

export class GeneratePayrollDto
  extends createZodDto(generatePayrollSchema)
  implements GeneratePayrollInput
{
  @ApiProperty({ example: 8, description: 'Bulan (1-12)' })
  month: number;
  @ApiProperty({ example: 2026 })
  year: number;
  @ApiPropertyOptional({
    example: null,
    description: 'Filter departemen (null = semua)',
  })
  departmentId?: number | null;
}

export class PayrollQueryDto
  extends createZodDto(payrollQuerySchema)
  implements PayrollQuery
{
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 20 })
  limit: number;
  @ApiPropertyOptional({ example: 8, description: 'Filter bulan' })
  month?: number;
  @ApiPropertyOptional({ example: 2026, description: 'Filter tahun' })
  year?: number;
  @ApiPropertyOptional({
    enum: ['draft', 'pending_approval', 'approved', 'paid'],
  })
  status?: 'draft' | 'pending_approval' | 'approved' | 'paid';
  @ApiPropertyOptional({ description: 'Filter karyawan' })
  employeeId?: number;
}

export class ApprovePayrollDto
  extends createZodDto(approvePayrollSchema)
  implements ApprovePayrollInput
{
  @ApiProperty({ example: [{ payrollId: 1 }, { payrollId: 2 }] })
  payPeriods: Array<{ payrollId: number }>;
}

export class MarkPaidDto
  extends createZodDto(markPaidSchema)
  implements MarkPaidInput
{
  @ApiProperty({ example: [1, 2] })
  payrollIds: number[];
  @ApiPropertyOptional({ example: '2026-08-25' })
  paymentDate?: string;
}
