import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type {
  CreateEmployeeInput,
  EmployeeQuery,
  Paginated,
  UpdateEmployeeInput,
  AuthUser,
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

import { sanitizeSearchString } from '../../common/utils/sanitize-search';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmployeeQuery): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.EmployeeWhereInput = { isActive: true };

    const search = sanitizeSearchString(query.search);
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { employeeNumber: { contains: search } },
        { email: { contains: search } },
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
        familyMembers: { where: { isActive: true } },
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

    // Safely parse dates with null checks
    let birthDate: Date | null = null;
    if (input.birthDate !== undefined && input.birthDate !== null) {
      if (typeof input.birthDate === 'string' && input.birthDate.trim()) {
        try {
          birthDate = new Date(input.birthDate);
          if (isNaN(birthDate.getTime())) {
            birthDate = null;
          }
        } catch {
          birthDate = null;
        }
      }
    }

    let joinDate: Date | undefined;
    if (input.joinDate !== undefined && input.joinDate !== null) {
      if (typeof input.joinDate === 'string' && input.joinDate.trim()) {
        try {
          joinDate = new Date(input.joinDate);
          if (isNaN(joinDate.getTime())) {
            joinDate = undefined;
          }
        } catch {
          joinDate = undefined;
        }
      }
    }

    let permanentDate: Date | null = null;
    if (input.permanentDate !== undefined && input.permanentDate !== null) {
      if (typeof input.permanentDate === 'string' && input.permanentDate.trim()) {
        try {
          permanentDate = new Date(input.permanentDate);
          if (isNaN(permanentDate.getTime())) {
            permanentDate = null;
          }
        } catch {
          permanentDate = null;
        }
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...input,
        ...(input.birthDate !== undefined && { birthDate }),
        ...(input.joinDate !== undefined && { joinDate }),
        ...(input.permanentDate !== undefined && { permanentDate }),
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

  async createAccount(employeeId: number, input: any, currentUser?: AuthUser) {
    if (input.role === 'owner' && currentUser?.role !== 'owner') {
      throw new ForbiddenException('Hanya Owner yang dapat menetapkan peran Owner');
    }

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

  async updateAccount(employeeId: number, input: any, currentUser?: AuthUser) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Akun karyawan #${employeeId} tidak ditemukan`);
    }

    if (employee.user.role === 'owner' && currentUser?.role !== 'owner') {
      throw new ForbiddenException('Hanya Owner yang dapat memodifikasi akun Owner');
    }
    if (input.role === 'owner' && currentUser?.role !== 'owner') {
      throw new ForbiddenException('Hanya Owner yang dapat menetapkan peran Owner');
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

  async resetPassword(employeeId: number, input: any, currentUser?: AuthUser) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Akun karyawan #${employeeId} tidak ditemukan`);
    }

    if (employee.user.role === 'owner' && currentUser?.role !== 'owner') {
      throw new ForbiddenException('Hanya Owner yang dapat mereset password akun Owner');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    // Invalidate all refresh tokens on password reset for security
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

  async addFamilyMember(employeeId: number, input: any) {
    await this.getById(employeeId);
    return this.prisma.familyMember.create({
      data: {
        employeeId,
        fullName: input.fullName,
        relationship: input.relationship,
        idCardNumber: input.idCardNumber || null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        gender: input.gender || null,
        isBpjsDependent: Boolean(input.isBpjsDependent),
      },
    });
  }

  async updateFamilyMember(familyId: number, input: any) {
    const family = await this.prisma.familyMember.findUnique({ where: { id: familyId } });
    if (!family) throw new NotFoundException(`Anggota keluarga #${familyId} tidak ditemukan`);
    return this.prisma.familyMember.update({
      where: { id: familyId },
      data: {
        ...(input.fullName && { fullName: input.fullName }),
        ...(input.relationship && { relationship: input.relationship }),
        ...(input.idCardNumber !== undefined && { idCardNumber: input.idCardNumber }),
        ...(input.birthDate !== undefined && { birthDate: input.birthDate ? new Date(input.birthDate) : null }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.isBpjsDependent !== undefined && { isBpjsDependent: Boolean(input.isBpjsDependent) }),
      },
    });
  }

  async deleteFamilyMember(familyId: number) {
    const family = await this.prisma.familyMember.findUnique({ where: { id: familyId } });
    if (!family) throw new NotFoundException(`Anggota keluarga #${familyId} tidak ditemukan`);
    return this.prisma.familyMember.update({
      where: { id: familyId },
      data: { isActive: false },
    });
  }
}
