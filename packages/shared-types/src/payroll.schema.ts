import { z } from 'zod';
import { CALCULATION_TYPES, COMPONENT_TYPES, PAYROLL_STATUSES } from './enums';

// ===================== SALARY COMPONENT =====================

export const createSalaryComponentSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  type: z.enum(COMPONENT_TYPES),
  calculationType: z.enum(CALCULATION_TYPES),
  defaultAmount: z.number().nonnegative().optional().nullable(),
  isTaxable: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const updateSalaryComponentSchema = createSalaryComponentSchema.partial();

export interface SalaryComponentDto {
  id: number;
  code: string;
  name: string;
  type: 'allowance' | 'deduction';
  calculationType: 'fixed' | 'percentage' | 'formula';
  defaultAmount: number | null;
  isTaxable: boolean;
  isActive: boolean;
}

// ===================== PAYROLL =====================

export const generatePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  departmentId: z.number().int().positive().nullable().optional(),
});

export const payrollQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
  status: z.enum(PAYROLL_STATUSES).optional(),
  employeeId: z.coerce.number().int().optional(),
});

export const approvePayrollSchema = z.object({
  payPeriods: z.array(z.object({ payrollId: z.number().int().positive() })).min(1),
});

export const markPaidSchema = z.object({
  payrollIds: z.array(z.number().int().positive()).min(1),
  paymentDate: z.string().date().optional(),
});

export type CreateSalaryComponentInput = z.infer<typeof createSalaryComponentSchema>;
export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>;
export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
export type PayrollQuery = z.infer<typeof payrollQuerySchema>;
export type ApprovePayrollInput = z.infer<typeof approvePayrollSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;

export interface PayrollComponentDto {
  salaryComponentId: number;
  salaryComponentCode: string;
  salaryComponentName: string;
  type: 'allowance' | 'deduction';
  amount: number;
}

export interface PayrollDto {
  id: number;
  payrollNumber: string;
  employeeId: number;
  employeeNumber: string;
  employeeName: string;
  department: string | null;
  month: number;
  year: number;
  basicSalary: number;
  totalAllowance: number;
  totalDeduction: number;
  overtimePay: number;
  grossSalary: number;
  bpjsKesehatanEmployee: number;
  bpjsKesehatanCompany: number;
  bpjsKetenagakerjaanEmployee: number;
  bpjsKetenagakerjaanCompany: number;
  taxPph21: number;
  netSalary: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid';
  approvedByName: string | null;
  approvedAt: string | null;
  paymentDate: string | null;
  createdAt: string;
}

export interface PayrollDetailDto extends PayrollDto {
  components: PayrollComponentDto[];
}

export interface PayrollBatchSummary {
  batchId: string;
  totalEmployees: number;
  skipped: number;
  status: string;
  summary: {
    totalGross: number;
    totalNet: number;
    totalPph21: number;
  };
}
