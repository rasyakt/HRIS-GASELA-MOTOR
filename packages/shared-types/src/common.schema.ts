import { z } from 'zod';
import { ANNOUNCEMENT_PRIORITIES, TARGET_AUDIENCES } from './enums';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES).default('normal'),
  targetAudience: z.enum(TARGET_AUDIENCES).default('all'),
  publishDate: z.string().date(),
  expiryDate: z.string().date().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
});

export const createDepartmentSchema = z.object({
  code: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  parentId: z.number().int().positive().optional().nullable(),
  headEmployeeId: z.number().int().positive().optional().nullable(),
});

export const createPositionSchema = z.object({
  code: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  jobDescription: z.string().optional().nullable(),
  level: z.number().int().optional().nullable(),
  minSalary: z.number().nonnegative().optional().nullable(),
  maxSalary: z.number().nonnegative().optional().nullable(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial();
export const updatePositionSchema = createPositionSchema.partial();

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;