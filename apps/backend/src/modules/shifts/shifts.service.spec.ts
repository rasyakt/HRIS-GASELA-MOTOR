import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      shift: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      attendance: { count: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [ShiftsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ShiftsService);
  });

  it('menolak nama shift duplikat', async () => {
    prisma.shift.findFirst.mockResolvedValue({ id: 1, name: 'Shift Pagi' });
    await expect(
      service.create({
        name: 'Shift Pagi',
        startTime: '08:00:00',
        endTime: '17:00:00',
        gracePeriodMinutes: 15,
        workHours: 8,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('membuat shift dan normalisasi jam', async () => {
    prisma.shift.findFirst.mockResolvedValue(null);
    prisma.shift.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 1, ...data }),
    );
    const result = await service.create({
      name: 'Shift Malam',
      startTime: '22:00',
      endTime: '06:00',
      gracePeriodMinutes: 15,
      workHours: 8,
    });
    expect(result.startTime).toBe('22:00:00');
    expect(result.endTime).toBe('06:00:00');
  });

  it('404 saat shift tidak ada', async () => {
    prisma.shift.findUnique.mockResolvedValue(null);
    await expect(service.getById(9)).rejects.toThrow(NotFoundException);
  });

  it('menonaktifkan shift jika sudah dipakai di kehadiran', async () => {
    prisma.shift.findUnique.mockResolvedValue({ id: 1 });
    prisma.attendance.count.mockResolvedValue(4);
    prisma.shift.update.mockResolvedValue({ id: 1, startTime: '08:00:00', endTime: '17:00:00', isActive: false });
    const res = await service.deactivate(1);
    expect(res.shift?.isActive).toBe(false);
  });

  it('menghapus permanen shift jika belum pernah dipakai', async () => {
    prisma.shift.findUnique.mockResolvedValue({ id: 2 });
    prisma.attendance.count.mockResolvedValue(0);
    prisma.shift.delete.mockResolvedValue({ id: 2 });
    const res = await service.remove(2);
    expect(res.id).toBe(2);
  });
});
