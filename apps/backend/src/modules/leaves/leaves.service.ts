import * as crypto from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BalanceQuery,
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  DecideLeaveInput,
  LeaveQuery,
  LeaveRequestDto,
  UpdateLeaveTypeInput,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

/** 'YYYY-MM-DD' → UTC-midnight dari tanggal lokal (konsisten dgn attendance) */
function parseLocalDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function localToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function workdayCount(from: Date, to: Date): number {
  let count = 0;
  for (
    const cur = new Date(from);
    cur <= to;
    cur.setUTCDate(cur.getUTCDate() + 1)
  ) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateWorkdaysWithHolidays(from: Date, to: Date): Promise<number> {
    const holidays = await this.prisma.holiday.findMany();
    let count = 0;
    
    for (
      const cur = new Date(from);
      cur <= to;
      cur.setUTCDate(cur.getUTCDate() + 1)
    ) {
      const dow = cur.getUTCDay();
      // Skip weekends
      if (dow === 0 || dow === 6) continue; 

      const m = cur.getUTCMonth() + 1;
      const d = cur.getUTCDate();
      const curDateStr = cur.toISOString().slice(0, 10);

      const isHoliday = holidays.some((h) => {
        if (h.isRecurringYearly) {
          return h.date.getUTCMonth() + 1 === m && h.date.getUTCDate() === d;
        }
        return h.date.toISOString().slice(0, 10) === curDateStr;
      });

      if (!isHoliday) {
        count++;
      }
    }
    return count;
  }

  // ===================== LEAVE TYPE =====================

  listTypes(includeInactive = false) {
    return this.prisma.leaveType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getTypeById(id: number) {
    const type = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!type) {
      throw new NotFoundException(`Jenis cuti #${id} tidak ditemukan`);
    }
    return type;
  }

  async createType(input: CreateLeaveTypeInput) {
    const existing = await this.prisma.leaveType.findFirst({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictException(`Kode '${input.code}' sudah dipakai`);
    }
    return this.prisma.leaveType.create({ data: input });
  }

  async updateType(id: number, input: UpdateLeaveTypeInput) {
    const type = await this.getTypeById(id);
    if (input.code && input.code !== type.code) {
      const existing = await this.prisma.leaveType.findFirst({
        where: { code: input.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Kode '${input.code}' sudah dipakai`);
      }
    }
    return this.prisma.leaveType.update({ where: { id }, data: input });
  }

  async deactivateType(id: number) {
    await this.getTypeById(id);
    const activeUsage = await this.prisma.leaveRequest.count({
      where: { leaveTypeId: id, status: { in: ['pending', 'approved'] } },
    });
    if (activeUsage > 0) {
      throw new ConflictException(
        `Jenis cuti masih memiliki ${activeUsage} pengajuan aktif (pending/approved), tidak bisa dinonaktifkan`,
      );
    }
    return this.prisma.leaveType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===================== BALANCE =====================

  async myBalances(employeeId: number, query: BalanceQuery) {
    const year = query.year ?? new Date().getFullYear();

    // Lazy initialization: Ensure a LeaveBalance row exists for all active quota-based leave types
    const activeQuotaTypes = await this.prisma.leaveType.findMany({
      where: { isActive: true, annualQuota: { gt: 0 } },
    });

    if (activeQuotaTypes.length > 0) {
      const existingBalances = await this.prisma.leaveBalance.findMany({
        where: {
          employeeId,
          year,
          leaveTypeId: { in: activeQuotaTypes.map((t) => t.id) },
        },
        select: { leaveTypeId: true },
      });
      const existingTypeIds = new Set(existingBalances.map((b) => b.leaveTypeId));
      const missingTypes = activeQuotaTypes.filter((t) => !existingTypeIds.has(t.id));

      if (missingTypes.length > 0) {
        await this.prisma.$transaction(
          missingTypes.map((type) =>
            this.prisma.leaveBalance.upsert({
              where: {
                employeeId_leaveTypeId_year: {
                  employeeId,
                  leaveTypeId: type.id,
                  year,
                },
              },
              create: {
                employeeId,
                leaveTypeId: type.id,
                year,
                quota: type.annualQuota,
                used: 0,
                remaining: type.annualQuota,
              },
              update: {},
            }),
          ),
        );
      }
    }

    const rows = await this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveType: { code: 'asc' } },
    });
    return rows.map((b) => ({
      leaveTypeId: b.leaveTypeId,
      leaveTypeName: b.leaveType.name,
      code: b.leaveType.code,
      isPaid: b.leaveType.isPaid,
      year: b.year,
      quota: b.quota,
      used: b.used,
      remaining: b.remaining,
    }));
  }

  async listBalances(query: BalanceQuery) {
    const year = query.year ?? new Date().getFullYear();
    const where = {
      year,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const items = await this.prisma.leaveBalance.findMany({
      where,
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { employee: { employeeNumber: 'asc' } },
    });
    return items.map((b) => ({
      id: b.id,
      employeeId: b.employeeId,
      employeeName: b.employee.fullName,
      employeeNumber: b.employee.employeeNumber,
      leaveTypeId: b.leaveTypeId,
      leaveTypeName: b.leaveType.name,
      code: b.leaveType.code,
      year: b.year,
      quota: b.quota,
      used: b.used,
      remaining: b.remaining,
    }));
  }

  // ===================== REQUEST =====================

  async createRequest(employeeId: number, input: CreateLeaveRequestInput) {
    const type = await this.prisma.leaveType.findUnique({
      where: { id: input.leaveTypeId },
    });
    if (!type) {
      throw new NotFoundException(
        `Jenis cuti #${input.leaveTypeId} tidak ditemukan`,
      );
    }
    if (!type.isActive) {
      throw new ConflictException('Jenis cuti tersebut tidak aktif');
    }

    const start = parseLocalDay(input.startDate);
    const end = parseLocalDay(input.endDate);
    if (end < start) {
      throw new BadRequestException('Tanggal selesai cuti tidak boleh sebelum tanggal mulai');
    }
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (start > maxFutureDate || end > maxFutureDate) {
      throw new BadRequestException('Pengajuan cuti tidak boleh lebih dari 1 tahun ke depan');
    }
    const days = await this.calculateWorkdaysWithHolidays(start, end);
    if (days === 0) {
      throw new BadRequestException('Rentang tanggal tidak berisi hari kerja atau bertepatan dengan libur sepenuhnya');
    }
    if (type.minNoticeDays != null) {
      const diff = Math.round(
        (start.getTime() - localToday().getTime()) / 86_400_000,
      );
      if (diff < type.minNoticeDays) {
        throw new BadRequestException(
          `Pengajuan minimal ${type.minNoticeDays} hari sebelum tanggal mulai`,
        );
      }
    }
    if (type.maxConsecutiveDays != null && days > type.maxConsecutiveDays) {
      throw new BadRequestException(
        `Maksimal ${type.maxConsecutiveDays} hari berturut-turut`,
      );
    }

    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['pending', 'approved'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlap) {
      throw new ConflictException(
        'Sudah ada pengajuan cuti yang menimpa rentang tanggal tersebut',
      );
    }

    let balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: type.id,
          year: start.getUTCFullYear(),
        },
      },
    });
    if (type.annualQuota > 0) {
      if (!balance) {
        // Lazy initialize in case they haven't fetched balances yet
        balance = await this.prisma.leaveBalance.create({
          data: {
            employeeId,
            leaveTypeId: type.id,
            year: start.getUTCFullYear(),
            quota: type.annualQuota,
            used: 0,
            remaining: type.annualQuota,
          },
        });
      }
      if (balance.remaining < days) {
        throw new ConflictException(
          `Saldo tidak cukup (tersisa ${balance.remaining} hari)`,
        );
      }
    }

    const datePrefix = dayKey(new Date()).replace(/-/g, '');
    const randSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const count = await this.prisma.leaveRequest.count();
    const requestNumber = `LV-${datePrefix}-${String(count + 1).padStart(3, '0')}${randSuffix}`;

    return this.toRequestDto(
      await this.prisma.leaveRequest.create({
        data: {
          requestNumber,
          employeeId,
          leaveTypeId: type.id,
          startDate: start,
          endDate: end,
          totalDays: days,
          reason: input.reason,
          documentUrl: input.documentUrl,
        },
        include: this.requestInclude,
      }),
    );
  }

  async myRequests(employeeId: number, query: LeaveQuery) {
    return this.listRequests(query, { employeeId });
  }

  async listRequests(
    query: LeaveQuery,
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
      this.prisma.leaveRequest.findMany({
        where,
        include: this.requestInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where }),
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
    input: DecideLeaveInput,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: this.requestInclude,
    });
    if (!request) {
      throw new NotFoundException(`Pengajuan cuti #${id} tidak ditemukan`);
    }
    if (request.status !== 'pending') {
      throw new ConflictException(
        `Pengajuan sudah berstatus '${request.status}'`,
      );
    }

    if (input.status === 'approved') {
      // Use transaction with locking to prevent race condition
      await this.prisma.$transaction(async (tx) => {
        if (request.leaveType.annualQuota > 0) {
          // Lock the balance row for update
          const balance = await tx.leaveBalance.findUnique({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: request.employeeId,
                leaveTypeId: request.leaveTypeId,
                year: request.startDate.getUTCFullYear(),
              },
            },
          });
          
          if (!balance) {
            throw new ConflictException('Saldo cuti karyawan tidak ditemukan');
          }
          
          // Check remaining balance again within transaction
          if (balance.remaining < request.totalDays) {
            throw new ConflictException(
              `Saldo tidak cukup (tersisa ${balance.remaining} hari)`,
            );
          }

          // Update balance and approve request atomically
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              used: { increment: request.totalDays },
              remaining: { decrement: request.totalDays },
            },
          });
        }

        // Check for overlapping approved leaves
        const overlap = await tx.leaveRequest.findFirst({
          where: {
            employeeId: request.employeeId,
            status: 'approved',
            NOT: { id },
            startDate: { lte: request.endDate },
            endDate: { gte: request.startDate },
          },
        });
        
        if (overlap) {
          throw new ConflictException(
            'Sudah ada cuti yang disetujui pada rentang tanggal yang sama',
          );
        }
        
        await tx.leaveRequest.update({
          where: { id },
          data: {
            status: 'approved',
            approvedById: approverEmployeeId,
            approvedAt: new Date(),
            rejectionReason: null,
          },
        });
      });
    } else {
      if (!input.rejectionReason) {
        throw new BadRequestException(
          'Alasan penolakan wajib diisi saat menolak',
        );
      }
      await this.prisma.leaveRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          approvedById: approverEmployeeId,
          approvedAt: new Date(),
          rejectionReason: input.rejectionReason,
        },
      });
    }

    return this.toRequestDto(
      await this.prisma.leaveRequest.findUniqueOrThrow({
        where: { id },
        include: this.requestInclude,
      }),
    );
  }

  async cancel(id: number, employeeId: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Pengajuan cuti #${id} tidak ditemukan`);
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
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  // ===================== HELPER =====================

  private requestInclude = {
    employee: { include: { department: true } },
    leaveType: true,
    approvedBy: true,
  } as const;

  private toRequestDto(r: {
    id: number;
    requestNumber: string;
    employeeId: number;
    employee: { fullName: string; department: { name: string } | null };
    leaveTypeId: number;
    leaveType: { code: string; name: string };
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string | null;
    documentUrl: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approvedById: number | null;
    approvedBy: { fullName: string } | null;
    approvedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
  }): LeaveRequestDto {
    return {
      id: r.id,
      requestNumber: r.requestNumber,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      department: r.employee.department?.name ?? null,
      leaveTypeId: r.leaveTypeId,
      leaveTypeCode: r.leaveType.code,
      leaveTypeName: r.leaveType.name,
      startDate: dayKey(r.startDate),
      endDate: dayKey(r.endDate),
      totalDays: r.totalDays,
      reason: r.reason,
      documentUrl: r.documentUrl,
      status: r.status,
      approvedById: r.approvedById,
      approvedByName: r.approvedBy?.fullName ?? null,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
