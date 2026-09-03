import { z } from 'zod';

export const COMPANY_SETTING_KEYS = [
  'company.name',
  'office.location',
  'office.radius_meters',
  'bpjs.rates',
  'overtime.rate_multiplier_weekday',
  'portal.theme_config',
  'attendance.photo_retention_days',
] as const;
export type CompanySettingKey = (typeof COMPANY_SETTING_KEYS)[number];

export const updateCompanySettingSchema = z.object({
  key: z.enum(COMPANY_SETTING_KEYS),
  value: z.string().min(1).max(5000),
});
export type UpdateCompanySettingInput = z.infer<
  typeof updateCompanySettingSchema
>;

export const companySettingDtoSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().nullable(),
  updatedAt: z.string(),
});
export type CompanySettingDto = z.infer<typeof companySettingDtoSchema>;

export const holidayQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});
export type HolidayQuery = z.infer<typeof holidayQuerySchema>;

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  name: z.string().min(2).max(150),
  isRecurringYearly: z.boolean().default(false),
});
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;

export const updateHolidaySchema = createHolidaySchema.partial();
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;

export const holidayDtoSchema = z.object({
  id: z.number(),
  date: z.string(),
  name: z.string(),
  isRecurringYearly: z.boolean(),
});
export type HolidayDto = z.infer<typeof holidayDtoSchema>;
