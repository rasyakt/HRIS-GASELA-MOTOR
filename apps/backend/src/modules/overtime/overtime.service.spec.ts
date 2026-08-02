import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OvertimeService', () => {
  let service: OvertimeService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      overtimeRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        OvertimeService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(OvertimeService);
  });

  describe('createRequest', () => {
    it('menghitung jam lembur dari jam mulai/selesai', async () => {
      prisma.overtimeRequest.count.mockResolvedValue(3);
      prisma.overtimeRequest.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 4,
            ...data,
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
        overtimeDate: '2026-08-05',
        startTime: '18:00:00',
        endTime: '21:30:00',
        purpose: 'Menyelesaikan laporan bulanan',
      });
      expect(result.hours).toBe(3.5);
      expect(result.startTime).toBe('18:00:00');
      expect(result.requestNumber).toMatch(/^OT-\d{8}-\d{4}$/);
    });

    it('menolak jam selesai sebelum jam mulai', async () => {
      prisma.overtimeRequest.count.mockResolvedValue(1);
      prisma.overtimeRequest.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 1,
            ...data,
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
        overtimeDate: '2026-08-05',
        startTime: '21:00:00',
        endTime: '18:00:00',
        purpose: 'Menyelesaikan laporan bulanan',
      });
      expect(result.hours).toBeLessThanOrEqual(0);
    });
  });

  describe('decide', () => {
    const pending = {
      id: 1,
      requestNumber: 'OT-20260805-0001',
      employeeId: 2,
      overtimeDate: new Date(Date.UTC(2026, 7, 5)),
      startTime: '18:00:00',
      endTime: '21:00:00',
      hours: 3,
      purpose: 'Laporan',
      status: 'pending',
      approvedById: null,
      approvedAt: null,
      createdAt: new Date(),
    };

    it('404 jika pengajuan tidak ada', async () => {
      prisma.overtimeRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.decide(9, 1, { status: 'approved' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('menolak decide ulang', async () => {
      prisma.overtimeRequest.findUnique.mockResolvedValue({
        ...pending,
        status: 'approved',
      });
      await expect(
        service.decide(1, 1, { status: 'approved' }),
      ).rejects.toThrow(ConflictException);
    });

    it('menyetujui lembur', async () => {
      prisma.overtimeRequest.findUnique.mockResolvedValue(pending);
      prisma.overtimeRequest.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...pending, ...data }),
      );
      const result = await service.decide(1, 1, { status: 'approved' });
      expect(result.status).toBe('approved');
      expect(result.approvedById).toBe(1);
    });
  });

  describe('cancel', () => {
    const pending = {
      id: 1,
      requestNumber: 'OT-20260805-0001',
      employeeId: 2,
      status: 'pending',
    };

    it('melarang membatalkan milik karyawan lain', async () => {
      prisma.overtimeRequest.findUnique.mockResolvedValue(pending);
      await expect(service.cancel(1, 3)).rejects.toThrow(ForbiddenException);
    });

    it('hanya status pending yang bisa dibatalkan', async () => {
      prisma.overtimeRequest.findUnique.mockResolvedValue({
        ...pending,
        status: 'approved',
      });
      await expect(service.cancel(1, 2)).rejects.toThrow(ConflictException);
    });

    it('menghapus pengajuan sendiri', async () => {
      prisma.overtimeRequest.findUnique.mockResolvedValue(pending);
      prisma.overtimeRequest.delete.mockResolvedValue(pending);
      const result = await service.cancel(1, 2);
      expect(result.id).toBe(1);
      expect(prisma.overtimeRequest.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
