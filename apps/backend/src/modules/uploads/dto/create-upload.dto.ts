import { z } from 'zod';

export const createUploadSchema = z.object({
  category: z.enum(['avatar', 'attendance', 'document'], {
    errorMap: () => ({
      message: 'Kategori harus salah satu: avatar, attendance, document',
    }),
  }),
});

export type CreateUploadDto = z.infer<typeof createUploadSchema>;
