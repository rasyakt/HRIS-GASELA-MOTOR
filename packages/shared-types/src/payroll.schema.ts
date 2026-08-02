import { z } from 'zod';

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
  status: z.enum(['draft', 'pending_approval', 'approved', 'paid']).optional(),
});

export const approvePayrollSchema = z.object({
  payPeriods: z.array(z.object({ payrollId: z.number().int().positive() })).min(1),
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
export type PayrollQuery = z.infer<typeof payrollQuerySchema>;
export type ApprovePayrollInput = z.infer<typeof approvePayrollSchema>;

export interface PayrollBatchSummary {
  batchId: string;
  totalEmployees: number;
  status: string;
  summary: {
    totalGross: number;
    totalNet: number;
    totalPph21: number;
  };
}