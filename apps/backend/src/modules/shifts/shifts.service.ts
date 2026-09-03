import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { CreateShiftInput, UpdateShiftInput } from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

/** Mengubah string "HH:mm" / "HH:mm:ss" → Date UTC 1970-01-01 untuk @db.Time() Prisma */
function parseTimeToDate(value: string): Date {
  const norm = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${norm}Z`);
}

/** Mengubah Date (atau string) dari Prisma @db.Time() → "HH:mm:ss" */
function timeToString(value: unknown): string {
  if (value instanceof Date) {
    const hh = String(value.getUTCHours()).padStart(2, '0');
    const mm = String(value.getUTCMinutes()).padStart(2, '0');
    const ss = String(value.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  if (typeof value === 'string') {
    return value.length === 5 ? `${value}:00` : value;
  }
  return '00:00:00';
}

function mapShiftDto<T extends { startTime: any; endTime: any }>(shift: T) {
  return {
    ...shift,
    startTime: timeToString(shift.startTime),
    endTime: timeToString(shift.endTime),
  };
}

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeInactive = false) {
    const shifts = await this.prisma.shift.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { startTime: 'asc' },
    });
    return shifts.map(mapShiftDto);
  }

  async getById(id: number) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift #${id} tidak ditemukan`);
    }
    return mapShiftDto(shift);
  }

  async create(input: CreateShiftInput) {
    const existing = await this.prisma.shift.findFirst({
      where: { name: input.name },
    });
    if (existing) {
      throw new ConflictException(`Nama shift '${input.name}' sudah dipakai`);
    }
    const { startTime, endTime, ...rest } = input;
    const created = await this.prisma.shift.create({
      data: {
        ...rest,
        startTime: parseTimeToDate(startTime),
        endTime: parseTimeToDate(endTime),
      },
    });
    return mapShiftDto(created);
  }

  async update(id: number, input: UpdateShiftInput) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift #${id} tidak ditemukan`);
    }
    const { startTime, endTime, ...rest } = input;
    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        ...rest,
        startTime: startTime ? parseTimeToDate(startTime) : undefined,
        endTime: endTime ? parseTimeToDate(endTime) : undefined,
      },
    });
    return mapShiftDto(updated);
  }

  async remove(id: number) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift #${id} tidak ditemukan`);
    }
    const usage = await this.prisma.attendance.count({
      where: { shiftId: id },
    });
    if (usage > 0) {
      const deactivated = await this.prisma.shift.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: `Shift memiliki ${usage} riwayat kehadiran dan telah dinonaktifkan.`,
        shift: mapShiftDto(deactivated),
      };
    }
    await this.prisma.shift.delete({ where: { id } });
    return {
      message: 'Shift berhasil dihapus permanen.',
      id,
    };
  }

  async deactivate(id: number) {
    return this.remove(id);
  }
}
