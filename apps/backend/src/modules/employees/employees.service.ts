import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateEmployeeInput,
  EmployeeQuery,
  Paginated,
  UpdateEmployeeInput,
} from '@gasela/shared-types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, code: true, name: true } },
  position: { select: { id: true, code: true, name: true } },
  manager: { select: { id: true, employeeNumber: true, fullName: true } },
  user: { select: { id: true, username: true, role: true, isActive: true } },
  _count: { select: { subordinates: true, familyMembers: true } },
} satisfies Prisma.EmployeeInclude;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmployeeQuery): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EmployeeWhereInput = { isActive: true };

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search } },
        { employeeNumber: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.positionId) where.positionId = query.positionId;
    if (query.employmentStatus) where.employmentStatus = query.employmentStatus;
    if (query.role) {
      if (query.role === 'none') {
        where.user = null;
      } else {
        where.user = {
          role: query.role as any,
        };
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        include: EMPLOYEE_INCLUDE,
        orderBy: { employeeNumber: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        ...EMPLOYEE_INCLUDE,
        user: {
          select: { id: true, username: true, role: true, isActive: true },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Karyawan #${id} tidak ditemukan`);
    }
    return employee;
  }

  async create(input: CreateEmployeeInput) {
    await this.assertUnique({
      employeeNumber: input.employeeNumber,
      email: input.email,
    });
    await this.assertReferences(input);

    return this.prisma.employee.create({
      data: {
        ...input,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        joinDate: new Date(input.joinDate),
        permanentDate: input.permanentDate
          ? new Date(input.permanentDate)
          : null,
      },
      include: EMPLOYEE_INCLUDE,
    });
  }

  async update(id: number, input: UpdateEmployeeInput) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Karyawan #${id} tidak ditemukan`);
    }
    await this.assertUnique(
      {
        employeeNumber: input.employeeNumber,
        email: input.email,
      },
      id,
    );
    await this.assertReferences(input);

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...input,
        birthDate: input.birthDate
          ? new Date(input.birthDate)
          : input.birthDate,
        joinDate: input.joinDate ? new Date(input.joinDate) : input.joinDate,
        permanentDate: input.permanentDate
          ? new Date(input.permanentDate)
          : input.permanentDate,
      },
      include: EMPLOYEE_INCLUDE,
    });
  }

  async deactivate(id: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Karyawan #${id} tidak ditemukan`);
    }
    if (employee.isActive === false) {
      return employee;
    }
    await this.prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        resignDate: new Date(),
      },
    });
    await this.prisma.user.updateMany({
      where: { employeeId: id },
      data: { isActive: false },
    });
    return this.getById(id);
  }

  async createAccount(employeeId: number, input: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) {
      throw new NotFoundException(`Karyawan #${employeeId} tidak ditemukan`);
    }
    if (employee.user) {
      throw new ConflictException('Karyawan ini sudah memiliki akun login');
    }

    const dup = await this.prisma.user.findUnique({
      where: { username: input.username },
    });
    if (dup) {
      throw new ConflictException(`Username '${input.username}' sudah dipakai`);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        employeeId,
        username: input.username,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });
  }

  async updateAccount(employeeId: number, input: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Akun karyawan #${employeeId} tidak ditemukan`);
    }

    if (input.username && input.username !== employee.user.username) {
      const dup = await this.prisma.user.findUnique({
        where: { username: input.username },
      });
      if (dup) {
        throw new ConflictException(`Username '${input.username}' sudah dipakai`);
      }
    }

    return this.prisma.user.update({
      where: { employeeId },
      data: input,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });
  }

  async resetPassword(employeeId: number, input: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Akun karyawan #${employeeId} tidak ditemukan`);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    await this.prisma.user.update({
      where: { employeeId },
      data: {
        passwordHash,
        refreshTokenHash: null,
      },
      select: { id: true },
    });
  }

  private async assertUnique(
    fields: { employeeNumber?: string; email?: string },
    excludeId?: number,
  ) {
    const { employeeNumber, email } = fields;
    if (employeeNumber) {
      const dup = await this.prisma.employee.findUnique({
        where: { employeeNumber },
      });
      if (dup && dup.id !== excludeId) {
        throw new ConflictException(`NIK '${employeeNumber}' sudah dipakai`);
      }
    }
    if (email) {
      const dup = await this.prisma.employee.findUnique({ where: { email } });
      if (dup && dup.id !== excludeId) {
        throw new ConflictException(`Email '${email}' sudah dipakai`);
      }
    }
  }

  private async assertReferences(
    input: CreateEmployeeInput | UpdateEmployeeInput,
  ) {
    if (input.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!dept || !dept.isActive) {
        throw new ConflictException(
          `Departemen #${input.departmentId} tidak valid`,
        );
      }
    }
    if (input.positionId) {
      const pos = await this.prisma.position.findUnique({
        where: { id: input.positionId },
      });
      if (!pos || !pos.isActive) {
        throw new ConflictException(`Posisi #${input.positionId} tidak valid`);
      }
    }
    if (input.managerId) {
      const mgr = await this.prisma.employee.findUnique({
        where: { id: input.managerId },
      });
      if (!mgr || !mgr.isActive) {
        throw new ConflictException(`Atasan #${input.managerId} tidak valid`);
      }
    }
  }
}
