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

export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type DecideOvertimeInput = z.infer<typeof decideOvertimeSchema>;