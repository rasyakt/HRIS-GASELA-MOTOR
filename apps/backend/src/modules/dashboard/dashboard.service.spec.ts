import { Test } from '@nestjs/testing';
import type { AdminDashboard, ManagerDashboard } from '@gasela/shared-types';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      attendance: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      leaveBalance: { findMany: jest.fn() },
      leaveRequest: { count: jest.fn(), findMany: jest.fn() },
      overtimeRequest: {
        count: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      employee: { count: jest.fn(), findMany: jest.fn() },
      department: { findMany: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  const user = {
    id: 1,
    employeeId: 2,
    username: 'budi',
    role: 'employee' as const,
    fullName: 'Budi Santoso',
  };

  it('role employee: mengembalikan ringkasan pribadi', async () => {
    prisma.attendance.findFirst.mockResolvedValue(null);
    prisma.leaveBalance.findMany.mockResolvedValue([]);
    prisma.leaveRequest.count.mockResolvedValue(1);
    prisma.overtimeRequest.count.mockResolvedValue(0);
    prisma.attendance.findMany.mockResolvedValue([
      {
        attendanceDate: new Date(Date.UTC(2026, 7, 1)),
        status: 'present',
        checkInTime: new Date(2026, 0, 1, 8, 1, 0),
        checkOutTime: new Date(2026, 0, 1, 17, 0, 0),
        workHours: 8,
      },
    ]);

    const result = await service.summary(user);
    expect(result.role).toBe('employee');
    expect(result.pendingLeave).toBe(1);
    expect(result.today.attendance).toBeNull();
    expect(result.recentAttendance).toHaveLength(1);
    expect(result.recentAttendance[0].date).toBe('2026-08-01');
    expect(result.recentAttendance[0].checkInTime).toBe('08:01:00');
  });

  it('role manager: menambahkan approvals & statistik tim', async () => {
    prisma.attendance.findFirst.mockResolvedValue(null);
    prisma.leaveBalance.findMany.mockResolvedValue([]);
    prisma.leaveRequest.count.mockResolvedValue(0);
    prisma.overtimeRequest.count.mockResolvedValue(0);
    prisma.attendance.findMany.mockResolvedValue([]);
    prisma.leaveRequest.findMany.mockResolvedValue([]);
    prisma.overtimeRequest.findMany.mockResolvedValue([]);
    prisma.employee.findMany.mockResolvedValue([{ id: 3 }, { id: 4 }]);

    const result = (await service.summary({
      ...user,
      role: 'manager',
    })) as ManagerDashboard;
    expect(result.role).toBe('manager');
    expect(result.approvals.count).toBe(0);
    expect(result.team.total).toBe(2);
  });

  it('role hrd: menambahkan statistik perusahaan & sebaran departemen', async () => {
    prisma.attendance.findFirst.mockResolvedValue(null);
    prisma.leaveBalance.findMany.mockResolvedValue([]);
    prisma.leaveRequest.count.mockResolvedValue(0);
    prisma.overtimeRequest.count.mockResolvedValue(0);
    prisma.attendance.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(5);
    prisma.attendance.count.mockResolvedValue(2);
    prisma.leaveRequest.findMany.mockResolvedValue([]);
    prisma.overtimeRequest.aggregate.mockResolvedValue({ _sum: { hours: 10 } });
    prisma.department.findMany.mockResolvedValue([
      { name: 'HRD', _count: { employees: 2 } },
      { name: 'Workshop', _count: { employees: 3 } },
    ]);

    const result = (await service.summary({
      ...user,
      role: 'hrd',
    })) as AdminDashboard;
    expect(result.role).toBe('admin');
    expect(result.stats.activeEmployees).toBe(5);
    expect(result.stats.presentToday).toBe(2);
    expect(result.stats.absentToday).toBe(1); // 5 - 2 - 0 - 2(leave)
    expect(result.stats.overtimeHoursThisMonth).toBe(10);
    expect(result.departments).toHaveLength(2);
  });
});
