import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let config: any;

  beforeEach(async () => {
    prisma = {
      deviceToken: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };
    config = { get: jest.fn().mockReturnValue('') };
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  describe('registerDevice', () => {
    it('mendaftarkan token baru via upsert', async () => {
      prisma.deviceToken.upsert.mockResolvedValue({ id: 1 });
      const result = await service.registerDevice(
        2,
        'token-abc-123',
        'android',
      );
      expect(result).toEqual({ registered: true });
      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employeeId_token: { employeeId: 2, token: 'token-abc-123' },
          },
          create: {
            employeeId: 2,
            token: 'token-abc-123',
            platform: 'android',
          },
        }),
      );
    });

    it('menolak token kosong', async () => {
      const result = await service.registerDevice(2, '   ', 'android');
      expect(result.registered).toBe(false);
      expect(prisma.deviceToken.upsert).not.toHaveBeenCalled();
    });
  });

  describe('sendAnnouncement', () => {
    const announcement = {
      id: 1,
      title: 'Penting',
      content: 'Isi pengumuman.',
      priority: 'high' as const,
      targetAudience: 'all' as const,
      targetDepartmentId: null,
      targetPositionId: null,
      targetEmployeeId: null,
    };

    it('skip jika tidak ada token', async () => {
      prisma.deviceToken.findMany.mockResolvedValue([]);
      const result = await service.sendAnnouncement(announcement);
      expect(result).toEqual({ sent: 0, skipped: 0, mode: 'none' });
    });

    it('skip dengan mode unconfigured jika FCM key kosong', async () => {
      prisma.deviceToken.findMany.mockResolvedValue([{ token: 't1' }]);
      const result = await service.sendAnnouncement(announcement);
      expect(result.mode).toBe('unconfigured');
      expect(result.skipped).toBe(1);
    });
  });
});
