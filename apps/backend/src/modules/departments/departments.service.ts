import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        headEmployee: { select: { id: true, fullName: true } },
        _count: { select: { employees: true, children: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getById(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: {
          where: { isActive: true },
          select: { id: true, code: true, name: true },
        },
        headEmployee: { select: { id: true, fullName: true } },
      },
    });
    if (!department) {
      throw new NotFoundException(`Departemen #${id} tidak ditemukan`);
    }
    return department;
  }

  async create(input: CreateDepartmentInput) {
    const existing = await this.prisma.department.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictException(
        `Kode departemen '${input.code}' sudah dipakai`,
      );
    }
    await this.assertReferences(input);
    return this.prisma.department.create({ data: input });
  }

  async update(id: number, input: UpdateDepartmentInput) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Departemen #${id} tidak ditemukan`);
    }
    if (input.code && input.code !== department.code) {
      const existing = await this.prisma.department.findUnique({
        where: { code: input.code },
      });
      if (existing) {
        throw new ConflictException(
          `Kode departemen '${input.code}' sudah dipakai`,
        );
      }
    }
    await this.assertReferences(input);
    return this.prisma.department.update({ where: { id }, data: input });
  }

  async deactivate(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Departemen #${id} tidak ditemukan`);
    }
    const employeeCount = await this.prisma.employee.count({
      where: { departmentId: id, isActive: true },
    });
    if (employeeCount > 0) {
      throw new ConflictException(
        `Departemen masih memiliki ${employeeCount} karyawan aktif, pindahkan dahulu`,
      );
    }
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertReferences(
    input: CreateDepartmentInput | UpdateDepartmentInput,
  ) {
    if (input.parentId) {
      const parent = await this.prisma.department.findUnique({
        where: { id: input.parentId },
      });
      if (!parent || !parent.isActive) {
        throw new ConflictException(
          `Parent departemen #${input.parentId} tidak valid`,
        );
      }
    }
    if (input.headEmployeeId) {
      const head = await this.prisma.employee.findUnique({
        where: { id: input.headEmployeeId },
      });
      if (!head || !head.isActive) {
        throw new ConflictException(
          `Kepala departemen #${input.headEmployeeId} tidak valid`,
        );
      }
    }
  }
}
