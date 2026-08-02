import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AttendanceQuery,
  CheckInInput,
  CheckInResult,
  CheckOutInput,
} from '@gasela/shared-types';
import { distanceInMeters } from '@gasela/shared-utils';
import { PrismaService } from '../../prisma/prisma.service';

const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function toMinutes(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
  if (typeof value !== 'string') return null;
  const m = TIME_RE.exec(value);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function toTimeString(value: unknown): string | null {
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

function localDateKey(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOfficeLocation() {
    const [locSetting, radiusSetting] = await Promise.all([
      this.prisma.companySetting.findUnique({
        where: { key: 'office.location' },
      }),
      this.prisma.companySetting.findUnique({
        where: { key: 'office.radius_meters' },
      }),
    ]);
    if (!locSetting) {
      throw new ConflictException(
        'Lokasi kantor belum dikonfigurasi (office.location)',
      );
    }
    let loc: { lat: number; lng: number };
    try {
      loc = JSON.parse(locSetting.value) as { lat: number; lng: number };
    } catch {
      throw new ConflictException('Konfigurasi office.location tidak valid');
    }
    const radius = Number(radiusSetting?.value ?? 100);
    return { lat: loc.lat, lng: loc.lng, radius };
  }

  async checkIn(
    employeeId: number,
    input: CheckInInput,
  ): Promise<CheckInResult> {
    const office = await this.getOfficeLocation();
    const distance = distanceInMeters(
      input.latitude,
      input.longitude,
      office.lat,
      office.lng,
    );
    if (distance > office.radius) {
      throw new ForbiddenException(
        `Anda berada ${Math.round(distance)}m dari kantor (maksimal ${office.radius}m)`,
      );
    }

    const now = new Date();
    const today = localDateKey(now);
    const shift = input.shiftId
      ? await this.prisma.shift.findUnique({ where: { id: input.shiftId } })
      : await this.prisma.shift.findFirst({
          where: { isActive: true },
          orderBy: { id: 'asc' },
        });
    if (input.shiftId && !shift) {
      throw new NotFoundException(`Shift #${input.shiftId} tidak ditemukan`);
    }

    const shiftStart = toMinutes(shift?.startTime) ?? 8 * 60;
    const grace = shift?.gracePeriodMinutes ?? 15;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const lateMinutes = Math.max(0, nowMinutes - (shiftStart + grace));
    const status = lateMinutes > 0 ? 'late' : 'present';

    const existing = await this.prisma.attendance.findUnique({
      where: {
        uq_employee_date: { employeeId, attendanceDate: today },
      },
    });
    if (existing?.checkInTime) {
      throw new ConflictException('Anda sudah check-in hari ini');
    }

    const attendance = await this.prisma.attendance.upsert({
      where: {
        uq_employee_date: { employeeId, attendanceDate: today },
      },
      update: {
        checkInTime: now,
        checkInLat: input.latitude,
        checkInLng: input.longitude,
        shiftId: shift?.id ?? null,
        status,
        lateMinutes,
        notes: input.notes,
      },
      create: {
        employeeId,
        attendanceDate: today,
        checkInTime: now,
        checkInLat: input.latitude,
        checkInLng: input.longitude,
        shiftId: shift?.id ?? null,
        status,
        lateMinutes,
        notes: input.notes,
      },
    });

    return {
      attendanceId: attendance.id,
      status,
      checkInTime:
        toTimeString(attendance.checkInTime) ?? toTimeString(now) ?? '',
      lateMinutes,
      distanceFromOfficeMeters: Math.round(distance),
    };
  }

  async checkOut(employeeId: number, input: CheckOutInput) {
    const office = await this.getOfficeLocation();
    const distance = distanceInMeters(
      input.latitude,
      input.longitude,
      office.lat,
      office.lng,
    );
    if (distance > office.radius) {
      throw new ForbiddenException(
        `Anda berada ${Math.round(distance)}m dari kantor (maksimal ${office.radius}m)`,
      );
    }

    const today = localDateKey(new Date());
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        uq_employee_date: { employeeId, attendanceDate: today },
      },
    });
    if (!attendance) {
      throw new NotFoundException('Belum ada check-in hari ini');
    }
    if (attendance.checkOutTime) {
      throw new ConflictException('Anda sudah check-out hari ini');
    }

    const now = new Date();
    const checkInMin = toMinutes(attendance.checkInTime) ?? 0;
    const checkOutMin = now.getHours() * 60 + now.getMinutes();
    const workedMinutes = Math.max(0, checkOutMin - checkInMin);
    const shiftEnd = toMinutes(
      attendance.shiftId
        ? (
            await this.prisma.shift.findUnique({
              where: { id: attendance.shiftId },
            })
          )?.endTime
        : null,
    );
    const earlyLeaveMinutes = shiftEnd
      ? Math.max(0, shiftEnd - checkOutMin)
      : 0;

    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        checkOutLat: input.latitude,
        checkOutLng: input.longitude,
        earlyLeaveMinutes,
        workHours: Number((workedMinutes / 60).toFixed(2)),
        notes: input.notes ?? attendance.notes,
      },
      include: { shift: true },
    });

    return {
      attendanceId: updated.id,
      status: updated.status,
      checkOutTime:
        toTimeString(updated.checkOutTime) ?? toTimeString(now) ?? '',
      workHours: updated.workHours,
      earlyLeaveMinutes,
      distanceFromOfficeMeters: Math.round(distance),
    };
  }

  async myAttendance(employeeId: number, query: AttendanceQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      employeeId,
      ...(query.from || query.to
        ? {
            attendanceDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        include: { shift: { select: { id: true, name: true } } },
        orderBy: { attendanceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async list(query: AttendanceQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.from || query.to
        ? {
            attendanceDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: { id: true, employeeNumber: true, fullName: true },
          },
          shift: { select: { id: true, name: true } },
        },
        orderBy: [{ attendanceDate: 'desc' }, { employeeId: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
