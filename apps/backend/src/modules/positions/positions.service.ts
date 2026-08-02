import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreatePositionInput,
  UpdatePositionInput,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.position.findMany({
      where: { isActive: true },
      include: { _count: { select: { employees: true } } },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  async getById(id: number) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Posisi #${id} tidak ditemukan`);
    }
    return position;
  }

  async create(input: CreatePositionInput) {
    const existing = await this.prisma.position.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictException(`Kode posisi '${input.code}' sudah dipakai`);
    }
    if (
      input.minSalary != null &&
      input.maxSalary != null &&
      input.minSalary > input.maxSalary
    ) {
      throw new ConflictException(
        'Gaji minimal tidak boleh melebihi gaji maksimal',
      );
    }
    return this.prisma.position.create({ data: input });
  }

  async update(id: number, input: UpdatePositionInput) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Posisi #${id} tidak ditemukan`);
    }
    if (input.code && input.code !== position.code) {
      const existing = await this.prisma.position.findUnique({
        where: { code: input.code },
      });
      if (existing) {
        throw new ConflictException(
          `Kode posisi '${input.code}' sudah dipakai`,
        );
      }
    }
    const min = input.minSalary ?? position.minSalary;
    const max = input.maxSalary ?? position.maxSalary;
    if (min != null && max != null && min > max) {
      throw new ConflictException(
        'Gaji minimal tidak boleh melebihi gaji maksimal',
      );
    }
    return this.prisma.position.update({ where: { id }, data: input });
  }

  async deactivate(id: number) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Posisi #${id} tidak ditemukan`);
    }
    const employeeCount = await this.prisma.employee.count({
      where: { positionId: id, isActive: true },
    });
    if (employeeCount > 0) {
      throw new ConflictException(
        `Posisi masih dipakai ${employeeCount} karyawan aktif, pindahkan dahulu`,
      );
    }
    return this.prisma.position.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
