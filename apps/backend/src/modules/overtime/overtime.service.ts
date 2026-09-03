import * as crypto from 'crypto';
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
import {
  calcOvertimeHours,
  dayKey,
  isBeyondFutureLimit,
  MAX_DAILY_OVERTIME_HOURS,
  MAX_MONTHLY_OVERTIME_HOURS,
  minutesToDate,
  monthRange,
  parseLocalDay,
  timeToMinutes,
  timeToString,
} from './overtime-calc.utils';

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
    const hours = calcOvertimeHours(startMin, endMin);
    if (hours > MAX_DAILY_OVERTIME_HOURS) {
      throw new ConflictException(
        `Batas maksimal lembur harian adalah ${MAX_DAILY_OVERTIME_HOURS} jam (PP 35/2021)`,
      );
    }

    const otDate = parseLocalDay(input.overtimeDate);
    if (isBeyondFutureLimit(otDate, 60)) {
      throw new ConflictException('Pengajuan lembur tidak boleh lebih dari 60 hari ke depan');
    }

    // Check for overlapping overtime request on the same day
    const overlapping = await this.prisma.overtimeRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['approved', 'pending'] },
        overtimeDate: otDate,
        startTime: { lt: minutesToDate(endMin) },
        endTime: { gt: minutesToDate(startMin) },
      },
    });
    if (overlapping) {
      throw new ConflictException(
        'Sudah ada pengajuan lembur yang bertabrakan pada rentang jam tersebut',
      );
    }

    const { startOfMonth, endOfMonth } = monthRange(otDate);

    const existingOt = await this.prisma.overtimeRequest.aggregate({
      where: {
        employeeId,
        status: { in: ['approved', 'pending'] },
        overtimeDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { hours: true },
    });

    const currentMonthlyHours = Number(existingOt._sum.hours || 0);
    if (currentMonthlyHours + hours > MAX_MONTHLY_OVERTIME_HOURS) {
      throw new ConflictException(
        `Total lembur bulan ini (${currentMonthlyHours.toFixed(1)} jam) akan melebihi batas kuota ${MAX_MONTHLY_OVERTIME_HOURS} jam/bulan`,
      );
    }

    const datePrefix = dayKey(new Date()).replace(/-/g, '');
    const randSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    // BUG-004 FIX: Gunakan ID terakhir bukan count() untuk penomoran
    // count() bermasalah jika ada record yang di-delete (cancel → delete):
    // count=3 setelah hapus 2 dari 5 → nomor OT-XXXX-004 bisa duplikat!
    const lastOt = await this.prisma.overtimeRequest.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const nextSeq = (lastOt?.id ?? 0) + 1;
    const requestNumber = `OT-${datePrefix}-${String(nextSeq).padStart(3, '0')}${randSuffix}`;

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
    const limit = Math.min(query.limit ?? 20, 100);
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
      totalPages: Math.ceil(total / limit),
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
    const updated = await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: input.status,
        approvedById: approverEmployeeId,
        approvedAt: new Date(),
      },
      include: this.requestInclude,
    });
    return this.toRequestDto(updated);
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
    await this.prisma.overtimeRequest.delete({ where: { id } });
    return { id, success: true, message: 'Pengajuan lembur berhasil dibatalkan' };
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
