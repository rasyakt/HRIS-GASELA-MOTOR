import { z } from 'zod';

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Format jam HH:mm atau HH:mm:ss');

export const createShiftSchema = z.object({
  name: z.string().min(1).max(50),
  startTime: timeString,
  endTime: timeString,
  gracePeriodMinutes: z.number().int().min(0).max(120).default(15),
  workHours: z.number().min(0).max(24).default(8),
  isActive: z.boolean().optional(),
});

export const updateShiftSchema = createShiftSchema.partial();

export const shiftQuerySchema = z.object({
  includeInactive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type ShiftQuery = z.infer<typeof shiftQuerySchema>;
