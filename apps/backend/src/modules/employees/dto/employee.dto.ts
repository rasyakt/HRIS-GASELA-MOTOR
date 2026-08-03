import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import type {
  CreateEmployeeInput,
  EmployeeQuery,
  EmploymentStatus,
  EmploymentType,
  PtkpStatus,
  UpdateEmployeeInput,
} from '@gasela/shared-types';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class CreateEmployeeDto
  extends createZodDto(createEmployeeSchema)
  implements CreateEmployeeInput
{
  @ApiProperty({ example: 'EMP-0010' })
  employeeNumber: string;
  @ApiProperty({ example: 'Siti Rahayu' })
  fullName: string;
  @ApiProperty({ example: 'siti@gaselamotor.com' })
  email: string;
  @ApiPropertyOptional({ example: '081234567891' })
  phone?: string | null;
  @ApiPropertyOptional({ example: '1998-04-12' })
  birthDate?: string | null;
  @ApiPropertyOptional({ example: '3171001234' })
  idCardNumber?: string | null;
  @ApiPropertyOptional({ example: '10.123.456.7-808.000' })
  taxNumber?: string | null;
  @ApiPropertyOptional()
  address?: string | null;
  @ApiPropertyOptional({ example: 'Ibu Siti' })
  emergencyContactName?: string | null;
  @ApiPropertyOptional({ example: '081234567892' })
  emergencyContactPhone?: string | null;
  @ApiPropertyOptional({ example: 1 })
  departmentId?: number | null;
  @ApiPropertyOptional({ example: 3 })
  positionId?: number | null;
  @ApiPropertyOptional({ example: 1, description: 'ID atasan langsung' })
  managerId?: number | null;
  @ApiProperty({ example: '2024-01-15' })
  joinDate: string;
  @ApiPropertyOptional({ example: '2024-07-15' })
  permanentDate?: string | null;
  @ApiPropertyOptional({ example: 'probation' })
  employmentStatus: EmploymentStatus;
  @ApiProperty({ example: 'permanent' })
  employmentType: EmploymentType;
  @ApiPropertyOptional({
    example: 'K2',
    description: 'Status PTKP untuk PPh21 (default K2)',
  })
  ptkpStatus: PtkpStatus;
  @ApiProperty({ example: 5000000 })
  basicSalary: number;
  @ApiPropertyOptional()
  bankAccountName?: string | null;
  @ApiPropertyOptional()
  bankAccountNumber?: string | null;
  @ApiPropertyOptional()
  bankName?: string | null;
}

export class UpdateEmployeeDto
  extends createZodDto(updateEmployeeSchema)
  implements UpdateEmployeeInput
{
  @ApiPropertyOptional({ example: 'EMP-0010' })
  employeeNumber?: string;
  @ApiPropertyOptional({ example: 'Siti Rahayu' })
  fullName?: string;
  @ApiPropertyOptional({ example: 'siti@gaselamotor.com' })
  email?: string;
  @ApiPropertyOptional({ example: '081234567891' })
  phone?: string | null;
  @ApiPropertyOptional({ example: '1998-04-12' })
  birthDate?: string | null;
  @ApiPropertyOptional()
  idCardNumber?: string | null;
  @ApiPropertyOptional()
  taxNumber?: string | null;
  @ApiPropertyOptional()
  address?: string | null;
  @ApiPropertyOptional()
  emergencyContactName?: string | null;
  @ApiPropertyOptional()
  emergencyContactPhone?: string | null;
  @ApiPropertyOptional()
  departmentId?: number | null;
  @ApiPropertyOptional()
  positionId?: number | null;
  @ApiPropertyOptional()
  managerId?: number | null;
  @ApiPropertyOptional()
  joinDate?: string;
  @ApiPropertyOptional()
  permanentDate?: string | null;
  @ApiPropertyOptional()
  employmentStatus?: EmploymentStatus;
  @ApiPropertyOptional()
  employmentType?: EmploymentType;
  @ApiPropertyOptional({ description: 'Status PTKP untuk PPh21' })
  ptkpStatus?: PtkpStatus;
  @ApiPropertyOptional({ example: 5000000 })
  basicSalary?: number;
  @ApiPropertyOptional()
  bankAccountName?: string | null;
  @ApiPropertyOptional()
  bankAccountNumber?: string | null;
  @ApiPropertyOptional()
  bankName?: string | null;
}

export class EmployeeQueryDto
  extends createZodDto(employeeQuerySchema)
  implements EmployeeQuery
{
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 20 })
  limit: number;
  @ApiPropertyOptional({ description: 'Cari nama/NIK/email' })
  search?: string;
  @ApiPropertyOptional({ description: 'Filter departemen' })
  departmentId?: number;
  @ApiPropertyOptional({ description: 'Filter posisi' })
  positionId?: number;
  @ApiPropertyOptional({ description: 'Filter status kerja' })
  employmentStatus?: EmploymentStatus;
}

export const createUserAccountSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['admin', 'hrd', 'manager', 'employee', 'owner']),
});

export const updateUserAccountSchema = z.object({
  username: z.string().min(3).optional(),
  role: z.enum(['admin', 'hrd', 'manager', 'employee', 'owner']).optional(),
  isActive: z.boolean().optional(),
});

export const resetUserPasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export class CreateUserAccountDto extends createZodDto(createUserAccountSchema) {}
export class UpdateUserAccountDto extends createZodDto(updateUserAccountSchema) {}
export class ResetUserPasswordDto extends createZodDto(resetUserPasswordSchema) {}
