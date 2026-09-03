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
import { assertPasswordComplexity } from '../../common/utils/password-validator';

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, code: true, name: true } },
  position: { select: { id: true, code: true, name: true } },
  manager: { select: { id: true, employeeNumber: true, fullName: true } },
  user: { select: { id: true, username: true, role: true, isActive: true } },
  _count: { select: { subordinates: true, familyMembers: true } },
} satisfies Prisma.EmployeeInclude;

import { sanitizeSearchString } from '../../common/utils/sanitize-search';
import type {
  CreateUserAccountInput,
  UpdateUserAccountInput,
  ResetUserPasswordInput,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
} from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmployeeQuery): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    // BUG-009 FIX: Tambah dukungan includeInactive agar HRD bisa melihat
    // karyawan yang sudah resign/nonaktif untuk audit historis
    const where: Prisma.EmployeeWhereInput = {};
    if (!(query as any).includeInactive) {
      where.isActive = true;
    }

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

  async getById(id: number, requestingUser?: AuthUser) {
    // Authorization check in service layer (SECURITY FIX for IDOR)
    if (
      requestingUser &&
      requestingUser.role === 'employee' &&
      requestingUser.employeeId !== id
    ) {
      throw new ForbiddenException(
        'Anda hanya dapat melihat data profil Anda sendiri',
      );
    }

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

    const {
      basicSalary,
      birthDate,
      joinDate,
      permanentDate,
      ...restInput
    } = input;

    return this.prisma.employee.create({
      data: {
        ...restInput,
        basicSalary: String(basicSalary),
        birthDate: birthDate ? new Date(birthDate) : null,
        joinDate: new Date(joinDate),
        permanentDate: permanentDate ? new Date(permanentDate) : null,
      },
      include: EMPLOYEE_INCLUDE,
    });
  }

  async update(
    id: number,
    input: UpdateEmployeeInput,
    requestingUser?: AuthUser,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!employee) {
      throw new NotFoundException(`Karyawan #${id} tidak ditemukan`);
    }

    // Proteksi akun Superadmin: Hanya Superadmin itu sendiri yang boleh mengubah datanya
    if (
      (employee.employeeNumber === 'EMP-0000' ||
        (employee.user?.role as string) === 'superadmin') &&
      requestingUser &&
      (requestingUser.role as string) !== 'superadmin'
    ) {
      throw new ForbiddenException(
        'Data karyawan Superadmin (Developer) bersifat permanen dan hanya dapat diubah oleh Superadmin itu sendiri',
      );
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
    let parsedBirthDate: Date | null = null;
    if (input.birthDate !== undefined && input.birthDate !== null) {
      if (typeof input.birthDate === 'string' && input.birthDate.trim()) {
        try {
          parsedBirthDate = new Date(input.birthDate);
          if (isNaN(parsedBirthDate.getTime())) {
            parsedBirthDate = null;
          }
        } catch {
          parsedBirthDate = null;
        }
      }
    }

    let parsedJoinDate: Date | undefined;
    if (input.joinDate !== undefined && input.joinDate !== null) {
      if (typeof input.joinDate === 'string' && input.joinDate.trim()) {
        try {
          parsedJoinDate = new Date(input.joinDate);
          if (isNaN(parsedJoinDate.getTime())) {
            parsedJoinDate = undefined;
          }
        } catch {
          parsedJoinDate = undefined;
        }
      }
    }

    let parsedPermanentDate: Date | null = null;
    if (input.permanentDate !== undefined && input.permanentDate !== null) {
      if (typeof input.permanentDate === 'string' && input.permanentDate.trim()) {
        try {
          parsedPermanentDate = new Date(input.permanentDate);
          if (isNaN(parsedPermanentDate.getTime())) {
            parsedPermanentDate = null;
          }
        } catch {
          parsedPermanentDate = null;
        }
      }
    }

    const {
      basicSalary,
      birthDate: _bd,
      joinDate: _jd,
      permanentDate: _pd,
      ...restInput
    } = input;

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...restInput,
        ...(basicSalary !== undefined && {
          basicSalary: String(basicSalary),
        }),
        ...(input.birthDate !== undefined && { birthDate: parsedBirthDate }),
        ...(input.joinDate !== undefined && { joinDate: parsedJoinDate }),
        ...(input.permanentDate !== undefined && {
          permanentDate: parsedPermanentDate,
        }),
      },
      include: EMPLOYEE_INCLUDE,
    });
  }

  async deactivate(id: number, requestingUser?: AuthUser) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!employee) {
      throw new NotFoundException(`Karyawan #${id} tidak ditemukan`);
    }
    if (
      employee.employeeNumber === 'EMP-0000' ||
      (employee.user?.role as string) === 'superadmin'
    ) {
      throw new ForbiddenException(
        'Akun dan karyawan Superadmin bersifat permanen dan tidak dapat dihapus atau dinonaktifkan',
      );
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

  // BUG-019 FIX: Gunakan tipe eksplisit dari DTO, bukan any
  // Sebelumnya input: any menghilangkan type safety dan IDE support
  async createAccount(
    employeeId: number,
    input: CreateUserAccountInput,
    currentUser?: AuthUser,
  ) {
    if ((input.role as string) === 'superadmin') {
      throw new ForbiddenException(
        'Role superadmin bersifat permanen dan tidak dapat dibuat akun baru',
      );
    }
    if (input.role === 'owner' && currentUser?.role !== 'owner' && currentUser?.role !== 'superadmin') {
      throw new ForbiddenException('Hanya Owner atau Superadmin yang dapat menetapkan peran Owner');
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

    // Validate password complexity
    assertPasswordComplexity(input.password);

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        employeeId,
        username: input.username,
        passwordHash,
        role: input.role as any,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });
  }

  // BUG-019 FIX: Gunakan tipe eksplisit
  async updateAccount(
    employeeId: number,
    input: UpdateUserAccountInput,
    currentUser?: AuthUser,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Akun karyawan #${employeeId} tidak ditemukan`);
    }

    if ((input.role as string) === 'superadmin') {
      throw new ForbiddenException(
        'Role superadmin bersifat permanen dan tidak dapat ditetapkan ke akun lain',
      );
    }

    if ((employee.user.role as string) === 'superadmin') {
      if (input.isActive === false) {
        throw new ForbiddenException(
          'Akun Superadmin bersifat permanen dan tidak dapat dinonaktifkan',
        );
      }
      if (input.role && (input.role as string) !== 'superadmin') {
        throw new ForbiddenException(
          'Role Superadmin bersifat permanen dan tidak dapat diubah',
        );
      }
      if (currentUser?.role !== 'superadmin') {
        throw new ForbiddenException(
          'Hanya Superadmin itu sendiri yang dapat memodifikasi akun Superadmin',
        );
      }
    }

    if (employee.user.role === 'owner' && currentUser?.role !== 'owner' && currentUser?.role !== 'superadmin') {
      throw new ForbiddenException('Hanya Owner atau Superadmin yang dapat memodifikasi akun Owner');
    }
    if (input.role === 'owner' && currentUser?.role !== 'owner' && currentUser?.role !== 'superadmin') {
      throw new ForbiddenException('Hanya Owner atau Superadmin yang dapat menetapkan peran Owner');
    }

    if (input.username && input.username !== employee.user.username) {
      const dup = await this.prisma.user.findUnique({
        where: { username: input.username },
      });
      if (dup) {
        throw new ConflictException(`Username '${input.username}' sudah dipakai`);
      }
    }

    // SECURITY: Invalidate JWT if role changes
    // Gunakan tipe Prisma.UserUpdateInput untuk menampung semua field yang mungkin
    const updateData: Record<string, unknown> = {
      ...(input.username !== undefined && { username: input.username }),
      ...(input.role !== undefined && { role: input.role as any }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };
    if (input.role && input.role !== employee.user.role) {
      updateData.jwtVersion = { increment: 1 };
      updateData.refreshTokenHash = null;
      updateData.refreshTokenExpiry = null;
    }

    return this.prisma.user.update({
      where: { employeeId },
      data: updateData as any,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });
  }

  // BUG-019 FIX: Gunakan tipe eksplisit
  async resetPassword(
    employeeId: number,
    input: ResetUserPasswordInput,
    currentUser?: AuthUser,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Akun karyawan #${employeeId} tidak ditemukan`);
    }

    if ((employee.user.role as string) === 'superadmin' && currentUser?.role !== 'superadmin') {
      throw new ForbiddenException(
        'Hanya Superadmin itu sendiri yang dapat mereset password akun Superadmin',
      );
    }

    if (employee.user.role === 'owner' && currentUser?.role !== 'owner' && currentUser?.role !== 'superadmin') {
      throw new ForbiddenException('Hanya Owner atau Superadmin yang dapat mereset password akun Owner');
    }

    // Validate password complexity
    assertPasswordComplexity(input.password);

    const passwordHash = await bcrypt.hash(input.password, 10);
    // Invalidate all refresh tokens on password reset for security
    await this.prisma.user.update({
      where: { employeeId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        refreshTokenHash: null,
        refreshTokenExpiry: null,
        jwtVersion: { increment: 1 }, // Invalidate existing JWTs
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

  async addFamilyMember(employeeId: number, input: CreateFamilyMemberInput) {
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

  async updateFamilyMember(familyId: number, input: UpdateFamilyMemberInput) {
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
