import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      salaryComponent: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      payrollComponent: { count: jest.fn() },
      employee: { findMany: jest.fn() },
      companySetting: { findUnique: jest.fn() },
      payroll: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      overtimeRequest: { aggregate: jest.fn() },
      terRate: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [PayrollService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PayrollService);
  });

  describe('salary component', () => {
    it('menolak kode komponen duplikat', async () => {
      prisma.salaryComponent.findFirst.mockResolvedValue({ id: 1, code: 'GAJI' });
      await expect(
        service.createSalaryComponent({
          code: 'GAJI',
          name: 'Gaji Pokok',
          type: 'allowance',
          calculationType: 'fixed',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('menonaktifkan komponen hanya jika belum dipakai slip gaji', async () => {
      prisma.salaryComponent.findUnique.mockResolvedValue({ id: 3, code: 'POT' });
      prisma.payrollComponent.count.mockResolvedValue(2);
      await expect(service.deactivateSalaryComponent(3)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('generate', () => {
    beforeEach(() => {
      prisma.employee.findMany.mockResolvedValue([
        {
          id: 2,
          employeeNumber: 'EMP-0002',
          fullName: 'Budi Santoso',
          basicSalary: 5_000_000,
          ptkpStatus: 'TK0',
          employmentStatus: 'active',
          isActive: true,
          department: { name: 'Sales' },
        },
      ]);
      prisma.salaryComponent.findMany.mockResolvedValue([
        { id: 1, code: 'GAJI', name: 'Gaji Pokok', type: 'allowance', calculationType: 'fixed', defaultAmount: null },
        { id: 2, code: 'TJM', name: 'Tunjangan Makan', type: 'allowance', calculationType: 'fixed', defaultAmount: 500_000 },
        { id: 3, code: 'TJT', name: 'Tunjangan Transport', type: 'allowance', calculationType: 'fixed', defaultAmount: 400_000 },
        { id: 4, code: 'POT', name: 'Potongan Lain', type: 'deduction', calculationType: 'fixed', defaultAmount: 100_000 },
      ]);
      prisma.companySetting.findUnique.mockResolvedValue(null);
      prisma.payroll.findMany.mockResolvedValue([]);
      prisma.payroll.count.mockResolvedValue(0);
      prisma.overtimeRequest.aggregate.mockResolvedValue({ _sum: { hours: 10 } });
      prisma.terRate.findFirst.mockResolvedValue({
        category: 'A',
        incomeFrom: 6_300_000,
        incomeTo: 6_750_000,
        ratePercent: 1,
      });
      prisma.payroll.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 1,
            ...data,
            employee: {
              fullName: 'Budi Santoso',
              employeeNumber: 'EMP-0002',
              department: { name: 'Sales' },
            },
            approvedBy: null,
            approvedAt: null,
            paymentDate: null,
            createdAt: new Date(),
          }),
      );
    });

    it('menghitung komponen, lembur, BPJS, PPh21 TER, dan net', async () => {
      const { batch, items } = await service.generate({ month: 8, year: 2026 });

      const p = items[0];
      expect(p.basicSalary).toBe(5_000_000);
      expect(p.totalAllowance).toBe(900_000);
      expect(p.totalDeduction).toBe(100_000);
      expect(p.overtimePay).toBe(433_526);
      expect(p.grossSalary).toBe(6_333_526);
      expect(p.bpjsKesehatanEmployee).toBe(63_335);
      expect(p.bpjsKesehatanCompany).toBe(253_341);
      expect(p.bpjsKetenagakerjaanEmployee).toBe(253_341);
      expect(p.taxPph21).toBe(63_335);
      expect(p.netSalary).toBe(5_916_850);
      expect(p.status).toBe('draft');
      expect(batch.totalEmployees).toBe(1);
      expect(batch.skipped).toBe(0);
    });

    it('melewati karyawan yang sudah punya slip gaji di periode sama', async () => {
      prisma.payroll.findMany.mockResolvedValue([{ employeeId: 2 }]);
      const { batch, items } = await service.generate({ month: 8, year: 2026 });
      expect(items).toHaveLength(0);
      expect(batch.skipped).toBe(1);
    });
  });

  describe('approve & paid', () => {
    it('menolak approve jika ada slip sudah dibayar', async () => {
      prisma.payroll.findMany.mockResolvedValue([
        { id: 1, payrollNumber: 'PAY-202608-0001', status: 'paid' },
      ]);
      await expect(
        service.batchApprove(1, { payPeriods: [{ payrollId: 1 }] }),
      ).rejects.toThrow(ConflictException);
    });

    it('menolak mark-paid jika slip belum approved', async () => {
      prisma.payroll.findMany.mockResolvedValue([
        { id: 1, payrollNumber: 'PAY-202608-0001', status: 'draft' },
      ]);
      await expect(service.markPaid({ payrollIds: [1] })).rejects.toThrow(
        ConflictException,
      );
    });

    it('detail tidak ditemukan → NotFound', async () => {
      prisma.payroll.findUnique.mockResolvedValue(null);
      await expect(service.detail(99)).rejects.toThrow(NotFoundException);
    });
  });
});
