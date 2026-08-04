import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const baseAnnouncement = {
  id: 1,
  title: 'Libur Lebaran',
  content: 'Kantor libur selama 2 minggu.',
  priority: 'high' as const,
  targetAudience: 'all' as const,
  targetDepartmentId: null,
  targetPositionId: null,
  targetEmployeeId: null,
  publishDate: new Date('2026-08-02T00:00:00.000Z'),
  expiryDate: null,
  isPublished: false,
  createdAt: new Date('2026-08-02T10:00:00.000Z'),
  createdBy: { fullName: 'Admin HRIS' },
  reads: [],
};

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let prisma: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      announcement: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      announcementRead: { upsert: jest.fn() },
      employee: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2,
          departmentId: 1,
          positionId: 2,
        }),
      },
      $transaction: jest.fn(),
    };
    notifications = {
      sendAnnouncement: jest.fn().mockResolvedValue({ sent: 0 }),
    };
    const module = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(AnnouncementsService);
  });

  describe('create', () => {
    it('menolak expiryDate sebelum publishDate', async () => {
      await expect(
        service.create(1, {
          title: 'Pengumuman',
          content: 'Isi pengumuman cukup panjang.',
          priority: 'normal',
          targetAudience: 'all',
          publishDate: new Date('2026-08-10'),
          expiryDate: new Date('2026-08-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('wajib targetDepartmentId untuk audience department', async () => {
      await expect(
        service.create(1, {
          title: 'Pengumuman',
          content: 'Isi pengumuman cukup panjang.',
          priority: 'normal',
          targetAudience: 'department',
          publishDate: new Date('2026-08-10'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('membuat draft dengan targetAudience default all', async () => {
      prisma.announcement.create.mockResolvedValue(baseAnnouncement);
      const result = await service.create(1, {
        title: 'Libur Lebaran',
        content: 'Kantor libur selama 2 minggu.',
        priority: 'high',
        targetAudience: 'all',
        publishDate: new Date('2026-08-02'),
      });
      expect(result).toMatchObject({
        id: 1,
        title: 'Libur Lebaran',
        isPublished: false,
        publishDate: '2026-08-02',
      });
      expect(prisma.announcement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublished: false,
            targetAudience: 'all',
          }),
        }),
      );
    });
  });

  describe('publish', () => {
    it('mengirim notifikasi FCM saat publish', async () => {
      prisma.announcement.findUnique.mockResolvedValue(baseAnnouncement);
      prisma.announcement.update.mockResolvedValue({
        ...baseAnnouncement,
        isPublished: true,
      });
      await service.publish(1);
      expect(notifications.sendAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, isPublished: true }),
      );
    });

    it('menolak publish dua kali', async () => {
      prisma.announcement.findUnique.mockResolvedValue({
        ...baseAnnouncement,
        isPublished: true,
      });
      await expect(service.publish(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('NotFound jika id tidak ada', async () => {
      prisma.announcement.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('myList', () => {
    it('hanya mengembalikan pengumuman terbit & belum kedaluwarsa', async () => {
      prisma.$transaction.mockResolvedValue([
        [{ ...baseAnnouncement, isPublished: true }],
        1,
      ]);
      const result = await service.myList(2, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('unreadCount', () => {
    it('menghitung pengumuman belum dibaca', async () => {
      prisma.announcement.count.mockResolvedValue(3);
      const result = await service.unreadCount(2);
      expect(result).toEqual({ unread: 3 });
    });
  });

  describe('markRead', () => {
    it('upsert record baca', async () => {
      prisma.announcement.findUnique.mockResolvedValue(baseAnnouncement);
      prisma.announcementRead.upsert.mockResolvedValue({ id: 1 });
      const result = await service.markRead(2, 1);
      expect(result).toEqual({ announcementId: 1, read: true });
    });
  });
});
