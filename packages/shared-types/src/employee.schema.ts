import { z } from 'zod';
import { EMPLOYMENT_STATUSES, EMPLOYMENT_TYPES, PTKP_STATUSES } from './enums';

const dateString = z.string().date();

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1).max(20),
  fullName: z.string().min(3).max(100),
  email: z.string().email().max(100),
  phone: z.string().max(20).optional().nullable(),
  birthDate: dateString.optional().nullable(),
  idCardNumber: z.string().max(20).optional().nullable(),
  taxNumber: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(20).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  positionId: z.number().int().positive().optional().nullable(),
  managerId: z.number().int().positive().optional().nullable(),
  joinDate: dateString,
  permanentDate: dateString.optional().nullable(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).default('probation'),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  ptkpStatus: z.enum(PTKP_STATUSES).default('K2'),
  basicSalary: z.number().nonnegative(),
  bankAccountName: z.string().max(100).optional().nullable(),
  bankAccountNumber: z.string().max(30).optional().nullable(),
  bankName: z.string().max(50).optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  departmentId: z.coerce.number().int().optional(),
  positionId: z.coerce.number().int().optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
  role: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}