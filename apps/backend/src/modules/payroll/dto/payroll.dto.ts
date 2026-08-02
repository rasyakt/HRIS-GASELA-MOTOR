import {
  approvePayrollSchema,
  createSalaryComponentSchema,
  generatePayrollSchema,
  markPaidSchema,
  payrollQuerySchema,
  updateSalaryComponentSchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../common/dto/create-zod-dto';

export class CreateSalaryComponentDto extends createZodDto(createSalaryComponentSchema) {}
export class UpdateSalaryComponentDto extends createZodDto(updateSalaryComponentSchema) {}
export class GeneratePayrollDto extends createZodDto(generatePayrollSchema) {}
export class PayrollQueryDto extends createZodDto(payrollQuerySchema) {}
export class ApprovePayrollDto extends createZodDto(approvePayrollSchema) {}
export class MarkPaidDto extends createZodDto(markPaidSchema) {}
