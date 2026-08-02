import { z } from 'zod';

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.number().int().positive(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().min(5).max(500),
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

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type DecideLeaveInput = z.infer<typeof decideLeaveSchema>;
export type LeaveQuery = z.infer<typeof leaveQuerySchema>;

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