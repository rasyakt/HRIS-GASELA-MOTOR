import { z } from 'zod';

export const createUploadSchema = z.object({
  category: z.enum(['avatar', 'attendance', 'document', 'landing'], {
    errorMap: () => ({
      message:
        'Kategori harus salah satu: avatar, attendance, document, landing',
    }),
  }),
});

export type CreateUploadDto = z.infer<typeof createUploadSchema>;
