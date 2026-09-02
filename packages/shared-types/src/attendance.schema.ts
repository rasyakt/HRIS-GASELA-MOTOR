import { z } from 'zod';

export const LATITUDE_RANGE = [-90, 90] as const;
export const LONGITUDE_RANGE = [-180, 180] as const;

export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  shiftId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
  photoUrl: z
    .string()
    .max(500)
    .optional()
    .describe('URL hasil upload kategori attendance'),
});

export const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().max(500).optional(),
  photoUrl: z
    .string()
    .max(500)
    .optional()
    .describe('URL hasil upload kategori attendance'),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.coerce.number().int().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;

export interface CheckInResult {
  attendanceId: number;
  status: string;
  checkInTime: string;
  lateMinutes: number;
  distanceFromOfficeMeters: number;
}