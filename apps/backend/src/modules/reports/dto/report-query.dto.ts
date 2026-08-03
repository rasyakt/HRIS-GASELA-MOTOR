import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export interface AttendanceReportQuery {
  from: string;
  to: string;
  departmentId?: number;
}

export interface LeaveReportQuery {
  from: string;
  to: string;
  status?: string;
}

export interface PayrollReportQuery {
  month: number;
  year: number;
  status?: string;
}

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

export const attendanceReportQuerySchema = z.object({
  from: dateString,
  to: dateString,
  departmentId: z.coerce.number().int().positive().optional(),
});
export class AttendanceReportQueryDto
  extends createZodDto(attendanceReportQuerySchema)
  implements AttendanceReportQuery
{
  @ApiProperty({ example: '2026-08-01' })
  from: string;
  @ApiProperty({ example: '2026-08-31' })
  to: string;
  @ApiPropertyOptional({ description: 'Filter departemen' })
  departmentId?: number;
}

export const leaveReportQuerySchema = z.object({
  from: dateString,
  to: dateString,
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
});
export class LeaveReportQueryDto
  extends createZodDto(leaveReportQuerySchema)
  implements LeaveReportQuery
{
  @ApiProperty({ example: '2026-08-01' })
  from: string;
  @ApiProperty({ example: '2026-08-31' })
  to: string;
  @ApiPropertyOptional({ example: 'approved' })
  status?: string;
}

export const payrollReportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  status: z.enum(['draft', 'approved', 'paid']).optional(),
});
export class PayrollReportQueryDto
  extends createZodDto(payrollReportQuerySchema)
  implements PayrollReportQuery
{
  @ApiProperty({ example: 8 })
  month: number;
  @ApiProperty({ example: 2026 })
  year: number;
  @ApiPropertyOptional({ example: 'paid' })
  status?: string;
}
