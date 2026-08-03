import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      attendance: { findMany: jest.fn() },
      leaveRequest: { findMany: jest.fn() },
      payroll: { findMany: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ReportsService);
  });

  const emp = {
    employeeNumber: 'EMP-0001',
    fullName: 'Admin HRIS',
    department: { name: 'HRD' },
    position: { name: 'HRD Staff' },
  };

  it('menghasilkan CSV kehadiran dengan header dan BOM', async () => {
    prisma.attendance.findMany.mockResolvedValue([
      {
        attendanceDate: new Date('2026-08-01T00:00:00Z'),
        employee: emp,
        shift: { name: 'Pagi' },
        checkInTime: new Date('2026-08-01T08:00:00Z'),
        checkOutTime: new Date('2026-08-01T17:00:00Z'),
        status: 'present',
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workHours: '8.00',
        notes: '',
      },
    ]);
    const result = await service.attendanceReport({
      from: '2026-08-01',
      to: '2026-08-31',
    });
    expect(result.filename).toBe('attendance_2026-08-01_to_2026-08-31.csv');
    expect(result.content.startsWith('\uFEFF')).toBe(true);
    expect(result.content).toContain('EMP-0001');
    expect(result.content).toContain('Hadir');
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          attendanceDate: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });

  it('meneruskan filter departemen pada laporan kehadiran', async () => {
    prisma.attendance.findMany.mockResolvedValue([]);
    await service.attendanceReport({
      from: '2026-08-01',
      to: '2026-08-31',
      departmentId: 3,
    });
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employee: { departmentId: 3 },
        }),
      }),
    );
  });

  it('menghasilkan CSV cuti', async () => {
    prisma.leaveRequest.findMany.mockResolvedValue([
      {
        requestNumber: 'LV-2026-0001',
        employee: { ...emp, department: { name: 'Sales' } },
        leaveType: { name: 'Cuti Tahunan' },
        startDate: new Date('2026-08-10T00:00:00Z'),
        endDate: new Date('2026-08-12T00:00:00Z'),
        totalDays: 3,
        reason: 'Liburan',
        status: 'approved',
        approvedBy: { fullName: 'Budi Santoso' },
        approvedAt: new Date('2026-08-09T00:00:00Z'),
      },
    ]);
    const result = await service.leaveReport({
      from: '2026-08-01',
      to: '2026-08-31',
      status: 'approved',
    });
    expect(result.filename).toBe('leave_2026-08-01_to_2026-08-31.csv');
    expect(result.content).toContain('LV-2026-0001');
    expect(result.content).toContain('Cuti Tahunan');
    expect(result.content).toContain('3');
  });

  it('menghasilkan CSV payroll dengan format Rupiah', async () => {
    prisma.payroll.findMany.mockResolvedValue([
      {
        payrollNumber: 'PR-202608-0001',
        employee: emp,
        basicSalary: '10000000',
        totalAllowance: '500000',
        overtimePay: '0',
        totalDeduction: '0',
        bpjsKesehatanEmployee: '100000',
        bpjsKetenagakerjaanEmployee: '200000',
        taxPph21: '100000',
        grossSalary: '10500000',
        netSalary: '10100000',
        status: 'paid',
        paymentDate: new Date('2026-08-25T00:00:00Z'),
      },
    ]);
    const result = await service.payrollReport({ month: 8, year: 2026 });
    expect(result.filename).toBe('payroll_2026-08.csv');
    expect(result.content).toContain('PR-202608-0001');
    expect(result.content).toContain('10.000.000');
    expect(result.content).toContain('10.100.000');
    expect(result.content).toContain('Dibayar');
  });

  it('escape sel yang mengandung pemisah atau tanda kutip', async () => {
    prisma.attendance.findMany.mockResolvedValue([
      {
        attendanceDate: new Date('2026-08-01T00:00:00Z'),
        employee: emp,
        shift: null,
        checkInTime: null,
        checkOutTime: null,
        status: 'present',
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workHours: '0',
        notes: 'Catatan "penting", sudah dibalas',
      },
    ]);
    const result = await service.attendanceReport({
      from: '2026-08-01',
      to: '2026-08-31',
    });
    expect(result.content).toContain('"Catatan ""penting"", sudah dibalas"');
  });
});
