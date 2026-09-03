import { Injectable } from '@nestjs/common';
import type {
  DashboardSummary,
  EmployeeDashboard,
  OfficeLocationDto,
  RecentAttendanceDto,
} from '@gasela/shared-types';
import type { AuthUser } from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { roleAtLeast } from '../auth/types/auth-request.type';

function localToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function timeToString(value: unknown): string | null {
  if (value instanceof Date) {
    if (value.getUTCFullYear() <= 1970) {
      const hh = String(value.getUTCHours()).padStart(2, '0');
      const mm = String(value.getUTCMinutes()).padStart(2, '0');
      const ss = String(value.getUTCSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    const ss = String(value.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  if (typeof value === 'string')
    return value.length === 5 ? `${value}:00` : value;
  return null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(user: AuthUser): Promise<DashboardSummary> {
    const employeePart = await this.employeePart(user.employeeId);
    if (roleAtLeast('hrd', user.role)) {
      const [stats, departments, officeLocation] = await Promise.all([
        this.companyStats(),
        this.departmentDistribution(),
        this.getOfficeLocationInfo(),
      ]);
      return {
        ...employeePart,
        role: 'admin',
        stats,
        departments,
        officeLocation,
      };
    }
    if (roleAtLeast('manager', user.role)) {
      const [approvals, team] = await Promise.all([
        this.pendingApprovals(),
        this.teamStats(user.employeeId),
      ]);
      return {
        ...employeePart,
        role: 'manager',
        approvals,
        team,
      };
    }
    return { ...employeePart, role: 'employee' };
  }

  // ===================== PER ROLE =====================

  private async employeePart(
    employeeId: number,
  ): Promise<Omit<EmployeeDashboard, 'role'>> {
    const today = localToday();
    const [attendance, balances, pendingLeave, pendingOvertime, recent] =
      await Promise.all([
        this.prisma.attendance.findFirst({
          where: { employeeId, attendanceDate: today },
          include: { shift: true },
        }),
        this.prisma.leaveBalance.findMany({
          where: { employeeId, year: today.getUTCFullYear() },
          include: { leaveType: true },
          orderBy: { leaveType: { code: 'asc' } },
        }),
        this.prisma.leaveRequest.count({
          where: { employeeId, status: 'pending' },
        }),
        this.prisma.overtimeRequest.count({
          where: { employeeId, status: 'pending' },
        }),
        this.prisma.attendance.findMany({
          where: { employeeId },
          orderBy: { attendanceDate: 'desc' },
          take: 7,
        }),
      ]);

    const recentAttendance: RecentAttendanceDto[] = recent.map((r) => ({
      date: dayKey(r.attendanceDate),
      status: r.status,
      checkInTime: timeToString(r.checkInTime),
      checkOutTime: timeToString(r.checkOutTime),
      workHours: Number(r.workHours),
    }));

    return {
      today: {
        date: dayKey(today),
        attendance: attendance
          ? {
              status: attendance.status,
              checkInTime: timeToString(attendance.checkInTime),
              checkOutTime: timeToString(attendance.checkOutTime),
              lateMinutes: attendance.lateMinutes,
              workHours: Number(attendance.workHours),
              shiftName: attendance.shift?.name ?? null,
            }
          : null,
      },
      leaveBalances: balances.map((b) => ({
        leaveTypeId: b.leaveTypeId,
        leaveTypeName: b.leaveType.name,
        code: b.leaveType.code,
        isPaid: b.leaveType.isPaid,
        year: b.year,
        quota: b.quota,
        used: b.used,
        remaining: b.remaining,
      })),
      pendingLeave,
      pendingOvertime,
      recentAttendance,
    };
  }

  private async pendingApprovals() {
    const [leave, overtime] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: { status: 'pending' },
        include: { employee: true, leaveType: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      this.prisma.overtimeRequest.findMany({
        where: { status: 'pending' },
        include: { employee: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ]);
    return {
      count: leave.length + overtime.length,
      leave: leave.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        employeeName: r.employee.fullName,
        leaveTypeName: r.leaveType.name,
        startDate: dayKey(r.startDate),
        endDate: dayKey(r.endDate),
        totalDays: r.totalDays,
      })),
      overtime: overtime.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        employeeName: r.employee.fullName,
        overtimeDate: dayKey(r.overtimeDate),
        startTime: timeToString(r.startTime) ?? '',
        endTime: timeToString(r.endTime) ?? '',
        hours: Number(r.hours),
      })),
    };
  }

  private async teamStats(managerId: number) {
    const today = localToday();
    const team = await this.prisma.employee.findMany({
      where: { managerId },
      select: { id: true },
    });
    const teamIds = team.map((e) => e.id);
    if (teamIds.length === 0) {
      return { total: 0, presentToday: 0, lateToday: 0, onLeaveToday: 0 };
    }
    const [attendance, onLeave] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { employeeId: { in: teamIds }, attendanceDate: today },
        select: { employeeId: true, status: true },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          status: 'approved',
          employeeId: { in: teamIds },
          startDate: { lte: today },
          endDate: { gte: today },
        },
        select: { employeeId: true },
      }),
    ]);
    return {
      total: teamIds.length,
      presentToday: attendance.filter((a) => a.status === 'present').length,
      lateToday: attendance.filter((a) => a.status === 'late').length,
      onLeaveToday: onLeave.length,
    };
  }

  private async companyStats() {
    const today = localToday();
    const monthStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1),
    );
    const [
      activeEmployees,
      presentToday,
      lateToday,
      onLeaveToday,
      pendingLeave,
      pendingOvertime,
      overtimeAgg,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.attendance.count({
        where: { attendanceDate: today, status: 'present' },
      }),
      this.prisma.attendance.count({
        where: { attendanceDate: today, status: 'late' },
      }),
      this.prisma.leaveRequest.count({
        where: {
          status: 'approved',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      this.prisma.leaveRequest.count({ where: { status: 'pending' } }),
      this.prisma.overtimeRequest.count({ where: { status: 'pending' } }),
      this.prisma.overtimeRequest.aggregate({
        where: {
          status: 'approved',
          overtimeDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { hours: true },
      }),
    ]);
    return {
      totalEmployees: activeEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      absentToday: Math.max(
        0,
        activeEmployees - presentToday - lateToday - onLeaveToday,
      ),
      onLeaveToday,
      pendingLeaveRequests: pendingLeave,
      pendingOvertimeRequests: pendingOvertime,
      overtimeHoursThisMonth: Number(overtimeAgg._sum.hours ?? 0),
    };
  }

  private async departmentDistribution() {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { employees: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return departments.map((d) => ({
      name: d.name,
      count: d._count.employees,
    }));
  }

  private async getOfficeLocationInfo(): Promise<OfficeLocationDto | null> {
    try {
      const [locSetting, radiusSetting, nameSetting] = await Promise.all([
        this.prisma.companySetting.findUnique({
          where: { key: 'office.location' },
        }),
        this.prisma.companySetting.findUnique({
          where: { key: 'office.radius_meters' },
        }),
        this.prisma.companySetting.findUnique({
          where: { key: 'company.name' },
        }),
      ]);

      if (!locSetting?.value) {
        return null;
      }

      let parsedLoc: { lat: number; lng: number };
      try {
        parsedLoc = JSON.parse(locSetting.value) as {
          lat: number;
          lng: number;
        };
      } catch {
        return null;
      }

      if (
        typeof parsedLoc.lat !== 'number' ||
        typeof parsedLoc.lng !== 'number' ||
        isNaN(parsedLoc.lat) ||
        isNaN(parsedLoc.lng)
      ) {
        return null;
      }

      const radiusMeters = Number(radiusSetting?.value ?? 100) || 100;
      const companyName = nameSetting?.value?.trim() || 'PT Gasela Motor';

      return {
        lat: parsedLoc.lat,
        lng: parsedLoc.lng,
        radiusMeters,
        companyName,
      };
    } catch {
      return null;
    }
  }
}

