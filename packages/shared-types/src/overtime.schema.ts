import { z } from 'zod';

export const createOvertimeSchema = z
  .object({
    overtimeDate: z.string().date(),
    startTime: z.string().time(),
    endTime: z.string().time(),
    purpose: z.string().min(5).max(500),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'Jam selesai harus setelah jam mulai',
    path: ['endTime'],
  });

export const decideOvertimeSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export const overtimeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  employeeId: z.coerce.number().int().optional(),
});

export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type DecideOvertimeInput = z.infer<typeof decideOvertimeSchema>;
export type OvertimeQuery = z.infer<typeof overtimeQuerySchema>;

export interface OvertimeRequestDto {
  id: number;
  requestNumber: string;
  employeeId: number;
  employeeName: string;
  department: string | null;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  purpose: string | null;
  status: OvertimeStatus;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
}

import type { OvertimeStatus } from './enums';