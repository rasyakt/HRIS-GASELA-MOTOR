import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let prisma: any;

  const officeSetting = {
    key: 'office.location',
    value: JSON.stringify({ lat: -6.914744, lng: 107.60981 }),
  };
  const radiusSetting = { key: 'office.radius_meters', value: '100' };

  beforeEach(async () => {
    prisma = {
      companySetting: { findUnique: jest.fn() },
      shift: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      attendance: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        AttendancesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AttendancesService);
  });

  const officeCoords = { latitude: -6.914744, longitude: 107.60981 };

  describe('checkIn', () => {
    beforeEach(() => {
      prisma.companySetting.findUnique.mockImplementation(
        ({ where }: { where: { key: string } }) =>
          Promise.resolve(
            where.key === 'office.location' ? officeSetting : radiusSetting,
          ),
      );
    });

    it('menolak saat di luar radius kantor', async () => {
      await expect(
        service.checkIn(1, {
          latitude: -6.95,
          longitude: 107.62,
          notes: 'jauh',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.attendance.upsert).not.toHaveBeenCalled();
    });

    it('check-in sukses dan menandai telat', async () => {
      prisma.shift.findFirst.mockResolvedValue({
        id: 1,
        startTime: '00:00:00',
        gracePeriodMinutes: 15,
      });
      prisma.attendance.findUnique.mockResolvedValue(null);
      prisma.attendance.upsert.mockImplementation(
        ({ create }: { create: Record<string, unknown> }) =>
          Promise.resolve({ ...create, id: 9 }),
      );

      const result = await service.checkIn(1, { ...officeCoords });
      expect(result.status).toBe('late'); // asumsi waktu sekarang > 08:15
      expect(result.attendanceId).toBe(9);
      expect(result.distanceFromOfficeMeters).toBeLessThan(100);
    });

    it('menolak check-in ganda di hari yang sama', async () => {
      prisma.shift.findFirst.mockResolvedValue({
        id: 1,
        startTime: '08:00:00',
        gracePeriodMinutes: 15,
      });
      prisma.attendance.findUnique.mockResolvedValue({
        id: 5,
        checkInTime: '08:01:00',
      });
      await expect(service.checkIn(1, officeCoords)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('checkOut', () => {
    it('menolak jika belum check-in', async () => {
      prisma.companySetting.findUnique.mockImplementation(
        ({ where }: { where: { key: string } }) =>
          Promise.resolve(
            where.key === 'office.location' ? officeSetting : radiusSetting,
          ),
      );
      prisma.attendance.findUnique.mockResolvedValue(null);
      await expect(service.checkOut(1, officeCoords)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('menolak di luar radius', async () => {
      prisma.companySetting.findUnique.mockImplementation(
        ({ where }: { where: { key: string } }) =>
          Promise.resolve(
            where.key === 'office.location' ? officeSetting : radiusSetting,
          ),
      );
      await expect(
        service.checkOut(1, { latitude: -7.5, longitude: 110.0 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('check-out sukses menghitung jam kerja', async () => {
      prisma.companySetting.findUnique.mockImplementation(
        ({ where }: { where: { key: string } }) =>
          Promise.resolve(
            where.key === 'office.location' ? officeSetting : radiusSetting,
          ),
      );
      prisma.attendance.findUnique.mockResolvedValue({
        id: 5,
        checkInTime: '08:00:00',
        checkOutTime: null,
        shiftId: null,
        status: 'present',
      });
      prisma.attendance.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 5, ...data }),
      );
      const result = await service.checkOut(1, officeCoords);
      expect(typeof result.workHours).toBe('number');
      expect(result.checkOutTime).toBeDefined();
    });

    it('menolak check-out lebih awal jika tanpa alasan/catatan izin', async () => {
      prisma.companySetting.findUnique.mockImplementation(
        ({ where }: { where: { key: string } }) => {
          if (where.key === 'office.location') return officeSetting;
          if (where.key === 'office.radius_meters') return radiusSetting;
          if (where.key === 'attendance.checkout_earliest_buffer_minutes')
            return { key: 'attendance.checkout_earliest_buffer_minutes', value: '30' };
          return null;
        },
      );
      prisma.attendance.findUnique.mockResolvedValue({
        id: 5,
        checkInTime: '08:00:00',
        checkOutTime: null,
        shiftId: 1,
        status: 'present',
      });
      // Shift berakhir jam 23:00 (jauh di masa depan)
      prisma.shift.findUnique.mockResolvedValue({
        id: 1,
        name: 'Shift Malam',
        endTime: '23:00:00',
      });

      await expect(
        service.checkOut(1, { ...officeCoords, notes: '' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('mengizinkan check-out lebih awal jika menyertakan alasan izin', async () => {
      prisma.companySetting.findUnique.mockImplementation(
        ({ where }: { where: { key: string } }) => {
          if (where.key === 'office.location') return officeSetting;
          if (where.key === 'office.radius_meters') return radiusSetting;
          if (where.key === 'attendance.checkout_earliest_buffer_minutes')
            return { key: 'attendance.checkout_earliest_buffer_minutes', value: '30' };
          return null;
        },
      );
      prisma.attendance.findUnique.mockResolvedValue({
        id: 5,
        checkInTime: '08:00:00',
        checkOutTime: null,
        shiftId: 1,
        status: 'present',
      });
      prisma.shift.findUnique.mockResolvedValue({
        id: 1,
        name: 'Shift Malam',
        endTime: '23:00:00',
      });
      prisma.attendance.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 5, ...data }),
      );

      const result = await service.checkOut(1, {
        ...officeCoords,
        notes: 'Izin sakit / ke dokter',
      });
      expect(result.status).toBe('early_leave');
      expect(result.earlyLeaveMinutes).toBeGreaterThan(0);
    });
  });
});
