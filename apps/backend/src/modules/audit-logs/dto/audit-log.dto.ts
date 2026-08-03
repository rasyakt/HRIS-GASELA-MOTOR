import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from '../../../common/dto/create-zod-dto';
import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(100).optional(),
  resource: z.string().trim().max(100).optional(),
});

export class AuditLogQueryDto extends createZodDto(auditLogQuerySchema) {
  @ApiPropertyOptional({ example: 1 })
  page?: number;
  @ApiPropertyOptional({ example: 20 })
  limit?: number;
  @ApiPropertyOptional({ example: 'login' })
  action?: string;
  @ApiPropertyOptional({ example: 'leave-request' })
  resource?: string;
}
