import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { CreateShiftInput, UpdateShiftInput } from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

/** Normalisasi "HH:mm" / "HH:mm:ss" → "HH:mm:ss" */
function normalizeTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeInactive = false) {
    return this.prisma.shift.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async getById(id: number) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift #${id} tidak ditemukan`);
    }
    return shift;
  }

  async create(input: CreateShiftInput) {
    const existing = await this.prisma.shift.findFirst({
      where: { name: input.name },
    });
    if (existing) {
      throw new ConflictException(`Nama shift '${input.name}' sudah dipakai`);
    }
    const { startTime, endTime, ...rest } = input;
    return this.prisma.shift.create({
      data: {
        ...rest,
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
      },
    });
  }

  async update(id: number, input: UpdateShiftInput) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift #${id} tidak ditemukan`);
    }
    const { startTime, endTime, ...rest } = input;
    return this.prisma.shift.update({
      where: { id },
      data: {
        ...rest,
        startTime: startTime ? normalizeTime(startTime) : undefined,
        endTime: endTime ? normalizeTime(endTime) : undefined,
      },
    });
  }

  async deactivate(id: number) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift #${id} tidak ditemukan`);
    }
    const usage = await this.prisma.attendance.count({
      where: { shiftId: id },
    });
    if (usage > 0) {
      throw new ConflictException(
        `Shift sudah dipakai ${usage} catatan kehadiran, tidak bisa dinonaktifkan`,
      );
    }
    return this.prisma.shift.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
