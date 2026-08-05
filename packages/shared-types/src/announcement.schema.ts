import { z } from 'zod';
import { ANNOUNCEMENT_PRIORITIES, TARGET_AUDIENCES } from './enums';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200),
  content: z.string().min(10, 'Isi minimal 10 karakter').max(5000),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES).default('normal'),
  targetAudience: z.enum(TARGET_AUDIENCES).default('all'),
  targetDepartmentId: z.number().int().positive().nullish(),
  targetPositionId: z.number().int().positive().nullish(),
  targetEmployeeId: z.number().int().positive().nullish(),
  publishDate: z.coerce.date().default(() => new Date()),
  expiryDate: z.coerce.date().nullish(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().omit({
  targetDepartmentId: true,
  targetPositionId: true,
  targetEmployeeId: true,
});

export const announcementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['all', 'published', 'draft']).optional(),
  keyword: z.string().trim().max(100).optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementQuery = z.infer<typeof announcementQuerySchema>;

export const announcementDtoSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES),
  targetAudience: z.enum(TARGET_AUDIENCES),
  targetDepartmentId: z.number().int().positive().nullable(),
  targetPositionId: z.number().int().positive().nullable(),
  targetEmployeeId: z.number().int().positive().nullable(),
  publishDate: z.string(),
  expiryDate: z.string().nullable(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  createdByName: z.string().nullable(),
  isRead: z.boolean().nullish(),
  readCount: z.number().nullish(),
});
export type AnnouncementDto = z.infer<typeof announcementDtoSchema>;

export const announcementListSchema = z.object({
  items: z.array(announcementDtoSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});
export type AnnouncementListDto = z.infer<typeof announcementListSchema>;

export const markAnnouncementReadSchema = z.object({
  announcementId: z.number().int().positive(),
});
export type MarkAnnouncementReadInput = z.infer<typeof markAnnouncementReadSchema>;

export const unreadCountDtoSchema = z.object({
  unread: z.number(),
});
export type UnreadCountDto = z.infer<typeof unreadCountDtoSchema>;
