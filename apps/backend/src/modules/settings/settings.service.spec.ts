import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      companySetting: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      holiday: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(SettingsService);
  });

  describe('company settings', () => {
    it('membuat key baru jika belum ada (upsert)', async () => {
      prisma.companySetting.findUnique.mockResolvedValue(null);
      prisma.companySetting.create.mockResolvedValue({
        key: 'portal.theme_config',
        value: '{"primaryColor":"#059669"}',
        description: 'Konfigurasi tema & warna portal HRIS GaselaPulse',
        updatedAt: new Date('2026-08-02T10:00:00.000Z'),
      });
      const result = await service.updateCompanySetting({
        key: 'portal.theme_config',
        value: '{"primaryColor":"#059669"}',
      });
      expect(result.key).toBe('portal.theme_config');
      expect(prisma.companySetting.create).toHaveBeenCalled();
    });

    it('memperbarui nilai setting', async () => {
      prisma.companySetting.findUnique.mockResolvedValue({
        key: 'company.name',
        value: 'PT Gasela Motor',
        description: 'Nama perusahaan',
        updatedAt: new Date('2026-08-02T10:00:00.000Z'),
      });
      prisma.companySetting.update.mockResolvedValue({
        key: 'company.name',
        value: 'PT Gasela Motor Baru',
        description: 'Nama perusahaan',
        updatedAt: new Date('2026-08-02T11:00:00.000Z'),
      });
      const result = await service.updateCompanySetting({
        key: 'company.name',
        value: 'PT Gasela Motor Baru',
      });
      expect(result.value).toBe('PT Gasela Motor Baru');
      expect(prisma.companySetting.update).toHaveBeenCalledWith({
        where: { key: 'company.name' },
        data: { value: 'PT Gasela Motor Baru' },
      });
    });
  });

  describe('holidays', () => {
    it('menolak tanggal libur duplikat', async () => {
      prisma.holiday.findUnique.mockResolvedValue({
        id: 1,
        date: new Date('2026-08-17'),
        name: 'Hari Kemerdekaan',
      });
      await expect(
        service.createHoliday({
          date: '2026-08-17',
          name: 'HUT RI',
          isRecurringYearly: false,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('membuat hari libur baru', async () => {
      prisma.holiday.findUnique.mockResolvedValue(null);
      prisma.holiday.create.mockResolvedValue({
        id: 2,
        date: new Date('2026-08-17'),
        name: 'Hari Kemerdekaan RI',
        isRecurringYearly: true,
      });
      const result = await service.createHoliday({
        date: '2026-08-17',
        name: 'Hari Kemerdekaan RI',
        isRecurringYearly: true,
      });
      expect(result).toEqual({
        id: 2,
        date: '2026-08-17',
        name: 'Hari Kemerdekaan RI',
        isRecurringYearly: true,
      });
    });

    it('NotFound saat menghapus libur yang tidak ada', async () => {
      prisma.holiday.findUnique.mockResolvedValue(null);
      await expect(service.removeHoliday(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
