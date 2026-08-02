import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      employee: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      department: { findUnique: jest.fn() },
      position: { findUnique: jest.fn() },
      user: { updateMany: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(EmployeesService);
  });

  const input = {
    employeeNumber: 'EMP-0003',
    fullName: 'Andi Wijaya',
    email: 'andi@gaselamotor.com',
    joinDate: '2024-01-01',
    employmentStatus: 'active' as const,
    employmentType: 'permanent' as const,
    basicSalary: 5000000,
  };

  describe('list', () => {
    it('mengembalikan halaman hasil dengan total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 1, fullName: 'Andi' }], 1]);
      const result = await service.list({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('menerapkan pencarian', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      await service.list({ page: 1, limit: 10, search: 'andi' });
      const where = prisma.employee.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
    });
  });

  describe('create', () => {
    it('menolak NIK duplikat', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 5,
        employeeNumber: 'EMP-0003',
      });
      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('membuat karyawan baru', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      prisma.department.findUnique.mockResolvedValue(null);
      prisma.position.findUnique.mockResolvedValue(null);
      prisma.employee.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 1, ...data }),
      );
      const result = await service.create(input);
      expect(result.id).toBe(1);
    });
  });

  describe('update & deactivate', () => {
    it('menolak update untuk id yang tidak ada', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(service.update(99, { fullName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('menonaktifkan karyawan dan user terkait', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 1, isActive: true });
      prisma.employee.update.mockResolvedValue({ id: 1 });
      prisma.user.updateMany.mockResolvedValue({ count: 1 });
      prisma.employee.findUnique.mockResolvedValueOnce({
        id: 1,
        isActive: true,
      });
      await service.deactivate(1);
      expect(prisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: 1 } }),
      );
    });
  });
});
