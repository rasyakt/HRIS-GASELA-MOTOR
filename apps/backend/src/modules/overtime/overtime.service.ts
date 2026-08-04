import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateOvertimeInput,
  DecideOvertimeInput,
  OvertimeQuery,
  OvertimeRequestDto,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function timeToMinutes(value: string): number | null {
  const m = TIME_RE.exec(value);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutesToDate(min: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Math.floor(min / 60),
    min % 60,
    0,
  );
}

function timeToString(value: unknown): string | null {
  if (value instanceof Date) {
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    const ss = String(value.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  if (typeof value === 'string')
    return value.length === 5 ? `${value}:00` : value;
  return null;
}

/** 'YYYY-MM-DD' → UTC-midnight dari tanggal lokal (konsisten dgn attendance) */
function parseLocalDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class OvertimeService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(employeeId: number, input: CreateOvertimeInput) {
    const startMin = timeToMinutes(input.startTime);
    const endMin = timeToMinutes(input.endTime);
    if (startMin === null || endMin === null) {
      throw new ConflictException('Format jam tidak valid');
    }
    if (endMin <= startMin) {
      throw new ConflictException('Jam selesai lembur harus setelah jam mulai');
    }
    const hours = Number(((endMin - startMin) / 60).toFixed(2));
    if (hours > 4) {
      throw new ConflictException('Batas maksimal lembur harian adalah 4 jam (PP 35/2021)');
    }

    // Check monthly total overtime budget limit (Max 56 hours/month per employee)
    const otDate = parseLocalDay(input.overtimeDate);
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 60);
    if (otDate > maxFutureDate) {
      throw new ConflictException('Pengajuan lembur tidak boleh lebih dari 60 hari ke depan');
    }

    const startOfMonth = new Date(Date.UTC(otDate.getUTCFullYear(), otDate.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(otDate.getUTCFullYear(), otDate.getUTCMonth() + 1, 0, 23, 59, 59));

    const existingOt = await this.prisma.overtimeRequest.aggregate({
      where: {
        employeeId,
        status: { in: ['approved', 'pending'] },
        overtimeDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { hours: true },
    });

    const currentMonthlyHours = Number(existingOt._sum.hours || 0);
    if (currentMonthlyHours + hours > 56) {
      throw new ConflictException(
        `Total lembur bulan ini (${currentMonthlyHours.toFixed(1)} jam) akan melebihi batas kuota 56 jam/bulan`,
      );
    }

    const count = await this.prisma.overtimeRequest.count();
    const requestNumber = `OT-${dayKey(new Date()).replace(/-/g, '')}-${String(
      count + 1,
    ).padStart(4, '0')}`;

    return this.toRequestDto(
      await this.prisma.overtimeRequest.create({
        data: {
          requestNumber,
          employeeId,
          overtimeDate: parseLocalDay(input.overtimeDate),
          startTime: minutesToDate(startMin),
          endTime: minutesToDate(endMin),
          hours,
          purpose: input.purpose,
        },
        include: this.requestInclude,
      }),
    );
  }

  async myRequests(employeeId: number, query: OvertimeQuery) {
    return this.listRequests(query, { employeeId });
  }

  async listRequests(
    query: OvertimeQuery,
    extraWhere: Record<string, unknown> = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...extraWhere,
      ...(query.status ? { status: query.status } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.overtimeRequest.findMany({
        where,
        include: this.requestInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.overtimeRequest.count({ where }),
    ]);
    return {
      items: items.map((r) => this.toRequestDto(r)),
      total,
      page,
      limit,
    };
  }

  async decide(
    id: number,
    approverEmployeeId: number,
    input: DecideOvertimeInput,
  ) {
    const request = await this.prisma.overtimeRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Pengajuan lembur #${id} tidak ditemukan`);
    }
    if (request.status !== 'pending') {
      throw new ConflictException(
        `Pengajuan sudah berstatus '${request.status}'`,
      );
    }
    return this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: input.status,
        approvedById: approverEmployeeId,
        approvedAt: new Date(),
      },
    });
  }

  async cancel(id: number, employeeId: number) {
    const request = await this.prisma.overtimeRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Pengajuan lembur #${id} tidak ditemukan`);
    }
    if (request.employeeId !== employeeId) {
      throw new ForbiddenException(
        'Hanya pemilik pengajuan yang bisa membatalkan',
      );
    }
    if (request.status !== 'pending') {
      throw new ConflictException(
        `Hanya pengajuan 'pending' yang bisa dibatalkan (status: '${request.status}')`,
      );
    }
    return this.prisma.overtimeRequest.delete({ where: { id } });
  }

  // ===================== HELPER =====================

  private requestInclude = {
    employee: { include: { department: true } },
    approvedBy: true,
  } as const;

  private toRequestDto(r: {
    id: number;
    requestNumber: string;
    employeeId: number;
    employee: { fullName: string; department: { name: string } | null };
    overtimeDate: Date;
    startTime: Date | string;
    endTime: Date | string;
    hours: unknown;
    purpose: string | null;
    status: 'pending' | 'approved' | 'rejected';
    approvedById: number | null;
    approvedBy: { fullName: string } | null;
    approvedAt: Date | null;
    createdAt: Date;
  }): OvertimeRequestDto {
    return {
      id: r.id,
      requestNumber: r.requestNumber,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      department: r.employee.department?.name ?? null,
      overtimeDate: dayKey(r.overtimeDate),
      startTime: timeToString(r.startTime) ?? '',
      endTime: timeToString(r.endTime) ?? '',
      hours: Number(r.hours),
      purpose: r.purpose,
      status: r.status,
      approvedById: r.approvedById,
      approvedByName: r.approvedBy?.fullName ?? null,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
