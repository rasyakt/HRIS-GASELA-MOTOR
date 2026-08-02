import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      department: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: { findUnique: jest.fn(), count: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DepartmentsService);
  });

  describe('create', () => {
    it('menolak kode duplikat', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 2, code: 'HRD' });
      await expect(
        service.create({ code: 'HRD', name: 'HRD Baru' }),
      ).rejects.toThrow(ConflictException);
    });

    it('membuat departemen baru', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      prisma.department.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 9, ...data }),
      );
      const result = await service.create({ code: 'SVC', name: 'Service' });
      expect(result.name).toBe('Service');
      expect(prisma.department.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('deactivate', () => {
    it('menolak saat masih ada karyawan aktif', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1 });
      prisma.employee.count.mockResolvedValue(3);
      await expect(service.deactivate(1)).rejects.toThrow(ConflictException);
    });

    it('404 saat departemen tidak ada', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      await expect(service.deactivate(99)).rejects.toThrow(NotFoundException);
    });
  });
});
