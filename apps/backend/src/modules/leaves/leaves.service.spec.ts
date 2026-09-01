import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LeavesService', () => {
  let service: LeavesService;
  let prisma: any;

  const leaveType = {
    id: 1,
    code: 'CT',
    name: 'Cuti Tahunan',
    annualQuota: 12,
    isPaid: true,
    requiresDocument: false,
    maxConsecutiveDays: 12,
    minNoticeDays: 0,
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      leaveType: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      leaveBalance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      leaveRequest: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      holiday: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [LeavesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(LeavesService);
  });

  describe('leave type', () => {
    it('menolak kode duplikat saat create', async () => {
      prisma.leaveType.findFirst.mockResolvedValue({ id: 2, code: 'CT' });
      await expect(
        service.createType({
          code: 'CT',
          name: 'Cuti Tahunan',
          annualQuota: 12,
          isPaid: true,
          requiresDocument: false,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('membuat jenis cuti baru', async () => {
      prisma.leaveType.findFirst.mockResolvedValue(null);
      prisma.leaveType.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 7, ...data }),
      );
      const result = await service.createType({
        code: 'CI',
        name: 'Cuti Ibadah',
        annualQuota: 2,
        isPaid: true,
        requiresDocument: false,
      });
      expect(result.code).toBe('CI');
      expect(prisma.leaveType.create).toHaveBeenCalled();
    });

    it('404 saat update jenis cuti tidak ada', async () => {
      prisma.leaveType.findUnique.mockResolvedValue(null);
      await expect(service.updateType(9, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('menolak nonaktif jika sudah dipakai pengajuan', async () => {
      prisma.leaveType.findUnique.mockResolvedValue(leaveType);
      prisma.leaveRequest.count.mockResolvedValue(3);
      await expect(service.deactivateType(1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('createRequest', () => {
    it('404 jika jenis cuti tidak ada', async () => {
      prisma.leaveType.findUnique.mockResolvedValue(null);
      await expect(
        service.createRequest(2, {
          leaveTypeId: 99,
          startDate: '2026-09-01',
          endDate: '2026-09-02',
          reason: 'Keperluan pribadi',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('menolak jika saldo tidak cukup', async () => {
      prisma.leaveType.findUnique.mockResolvedValue(leaveType);
      prisma.leaveRequest.findFirst.mockResolvedValue(null);
      prisma.leaveBalance.findUnique.mockResolvedValue({
        id: 1,
        remaining: 1,
      });
      await expect(
        service.createRequest(2, {
          leaveTypeId: 1,
          startDate: '2026-09-01',
          endDate: '2026-09-05',
          reason: 'Keperluan pribadi',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('membuat pengajuan dan menghitung hari kerja', async () => {
      prisma.leaveType.findUnique.mockResolvedValue(leaveType);
      prisma.leaveRequest.findFirst.mockResolvedValue(null);
      prisma.leaveBalance.findUnique.mockResolvedValue({
        id: 1,
        remaining: 12,
      });
      prisma.leaveRequest.count.mockResolvedValue(5);
      prisma.leaveRequest.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 6,
            ...data,
            leaveType: { code: 'CT', name: 'Cuti Tahunan' },
            employee: {
              fullName: 'Budi Santoso',
              department: { name: 'HRD' },
            },
            approvedBy: null,
            approvedAt: null,
            createdAt: new Date(),
          }),
      );
      const result = await service.createRequest(2, {
        leaveTypeId: 1,
        startDate: '2026-09-01',
        endDate: '2026-09-04',
        reason: 'Keperluan pribadi',
      });
      expect(result.totalDays).toBe(4);
      expect(result.requestNumber).toMatch(/^LV-\d{8}-\d{4}$/);
    });
  });

  describe('decide', () => {
    const pending = {
      id: 6,
      requestNumber: 'LV-20260901-0006',
      employeeId: 2,
      employee: { fullName: 'Budi Santoso', department: { name: 'HRD' } },
      leaveTypeId: 1,
      leaveType: { code: 'CT', name: 'Cuti Tahunan' },
      startDate: new Date(Date.UTC(2026, 8, 1)),
      endDate: new Date(Date.UTC(2026, 8, 2)),
      totalDays: 2,
      reason: 'Keperluan pribadi',
      documentUrl: null,
      status: 'pending',
      approvedById: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
    };

    it('404 jika pengajuan tidak ada', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.decide(99, 1, { status: 'approved' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('menolak decide ulang pada pengajuan yang sudah diputus', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue({
        ...pending,
        status: 'approved',
      });
      await expect(
        service.decide(6, 1, { status: 'approved' }),
      ).rejects.toThrow(ConflictException);
    });

    it('approve: menambah used dan mengurangi remaining saldo', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue(pending);
      prisma.leaveBalance.findUnique.mockResolvedValue({
        id: 1,
        remaining: 12,
      });
      prisma.$transaction.mockResolvedValue([]);
      prisma.leaveRequest.findUniqueOrThrow.mockResolvedValue({
        ...pending,
        status: 'approved',
        approvedById: 1,
        approvedAt: new Date(),
      });
      const result = await service.decide(6, 1, { status: 'approved' });
      expect(result.status).toBe('approved');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('tolak wajib menyertakan alasan', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue(pending);
      await expect(
        service.decide(6, 1, { status: 'rejected' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('tolak: menyimpan rejectionReason', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue(pending);
      prisma.leaveRequest.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...pending, ...data }),
      );
      prisma.leaveRequest.findUniqueOrThrow.mockResolvedValue({
        ...pending,
        status: 'rejected',
        approvedById: 1,
        approvedAt: new Date(),
        rejectionReason: 'Bertepatan dengan pekerjaan penting',
      });
      const result = await service.decide(6, 1, {
        status: 'rejected',
        rejectionReason: 'Bertepatan dengan pekerjaan penting',
      });
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(
        'Bertepatan dengan pekerjaan penting',
      );
    });
  });

  describe('cancel', () => {
    const pending = {
      id: 6,
      requestNumber: 'LV-20260901-0006',
      employeeId: 2,
      startDate: new Date(),
      endDate: new Date(),
      totalDays: 1,
      status: 'pending',
    };

    it('melarang membatalkan milik karyawan lain', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue(pending);
      await expect(service.cancel(6, 3)).rejects.toThrow(ForbiddenException);
    });

    it('hanya status pending yang bisa dibatalkan', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue({
        ...pending,
        status: 'approved',
      });
      await expect(service.cancel(6, 2)).rejects.toThrow(ConflictException);
    });

    it('membatalkan pengajuan sendiri', async () => {
      prisma.leaveRequest.findUnique.mockResolvedValue(pending);
      prisma.leaveRequest.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...pending, ...data }),
      );
      const result = await service.cancel(6, 2);
      expect(result.status).toBe('cancelled');
    });
  });
});
