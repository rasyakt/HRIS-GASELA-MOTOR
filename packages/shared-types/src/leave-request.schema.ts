import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(10)
    .toUpperCase()
    .regex(/^[A-Z0-9_]+$/, 'Hanya huruf besar, angka, dan underscore'),
  name: z.string().min(2).max(50),
  annualQuota: z.number().int().min(0).max(365),
  isPaid: z.boolean().default(true),
  requiresDocument: z.boolean().default(false),
  maxConsecutiveDays: z.number().int().positive().max(365).optional(),
  minNoticeDays: z.number().int().min(0).max(365).optional(),
});
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.number().int().positive(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().min(5).max(500),
    documentUrl: z
      .string()
      .url('URL dokumen tidak valid')
      .optional()
      .describe('URL hasil upload kategori document'),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Tanggal selesai harus setelah/sama dengan tanggal mulai',
    path: ['endDate'],
  });

export const decideLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().min(5).max(500).optional(),
});

export const leaveQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  employeeId: z.coerce.number().int().optional(),
});

export const balanceQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  employeeId: z.coerce.number().int().optional(),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type DecideLeaveInput = z.infer<typeof decideLeaveSchema>;
export type LeaveQuery = z.infer<typeof leaveQuerySchema>;
export type BalanceQuery = z.infer<typeof balanceQuerySchema>;

export interface LeaveTypeDto {
  id: number;
  code: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  requiresDocument: boolean;
  maxConsecutiveDays: number | null;
  minNoticeDays: number | null;
  isActive: boolean;
}

export interface LeaveBalanceDto {
  leaveTypeId: number;
  leaveTypeName: string;
  code: string;
  isPaid: boolean;
  year: number;
  quota: number;
  used: number;
  remaining: number;
}

export interface LeaveRequestDto {
  id: number;
  requestNumber: string;
  employeeId: number;
  employeeName: string;
  department: string | null;
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  documentUrl: string | null;
  status: LeaveReqStatus;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

import type { LeaveReqStatus } from './enums';