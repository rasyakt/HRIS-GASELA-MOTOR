import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PositionsService', () => {
  let service: PositionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      position: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: { count: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        PositionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PositionsService);
  });

  it('menolak saat minSalary > maxSalary', async () => {
    prisma.position.findUnique.mockResolvedValue(null);
    await expect(
      service.create({
        code: 'TEST',
        name: 'Test',
        minSalary: 9000000,
        maxSalary: 5000000,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('menolak kode duplikat', async () => {
    prisma.position.findUnique.mockResolvedValue({ id: 1, code: 'MECH' });
    await expect(
      service.create({ code: 'MECH', name: 'Mekanik' }),
    ).rejects.toThrow(ConflictException);
  });

  it('menolak nonaktif saat masih dipakai karyawan', async () => {
    prisma.position.findUnique.mockResolvedValue({ id: 1 });
    prisma.employee.count.mockResolvedValue(2);
    await expect(service.deactivate(1)).rejects.toThrow(ConflictException);
  });

  it('404 saat posisi tidak ada', async () => {
    prisma.position.findUnique.mockResolvedValue(null);
    await expect(service.getById(42)).rejects.toThrow(NotFoundException);
  });
});
