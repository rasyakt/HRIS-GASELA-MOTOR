import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AnnouncementDto,
  AnnouncementListDto,
  AnnouncementQuery,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function parseLocalDay(s: string | Date): Date {
  if (s instanceof Date) return s;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private toDto(
    a: {
      id: number;
      title: string;
      content: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      targetAudience: 'all' | 'department' | 'position' | 'specific';
      targetDepartmentId: number | null;
      targetPositionId: number | null;
      targetEmployeeId: number | null;
      publishDate: Date;
      expiryDate: Date | null;
      isPublished: boolean;
      createdAt: Date;
      createdBy: { fullName: string };
      reads: { employeeId: number }[];
    },
    employeeId?: number,
  ): AnnouncementDto {
    return {
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      targetAudience: a.targetAudience,
      targetDepartmentId: a.targetDepartmentId,
      targetPositionId: a.targetPositionId,
      targetEmployeeId: a.targetEmployeeId,
      publishDate: dayKey(a.publishDate),
      expiryDate: a.expiryDate ? dayKey(a.expiryDate) : null,
      isPublished: a.isPublished,
      createdAt: a.createdAt.toISOString(),
      createdByName: a.createdBy.fullName,
      isRead: employeeId
        ? a.reads.some((r) => r.employeeId === employeeId)
        : undefined,
      readCount: a.reads.length,
    };
  }

  private announcementInclude = {
    createdBy: { select: { fullName: true } },
    reads: { select: { employeeId: true } },
  } as const;

  async create(createdById: number, input: CreateAnnouncementInput) {
    const publishDate = parseLocalDay(input.publishDate);
    let expiryDate: Date | null = null;
    if (input.expiryDate) {
      expiryDate = parseLocalDay(input.expiryDate);
      if (expiryDate < publishDate) {
        throw new BadRequestException(
          'Tanggal berakhir tidak boleh sebelum tanggal tayang',
        );
      }
    }
    if (input.targetAudience === 'department' && !input.targetDepartmentId) {
      throw new BadRequestException(
        'Target departemen wajib diisi untuk audience department',
      );
    }
    if (input.targetAudience === 'position' && !input.targetPositionId) {
      throw new BadRequestException(
        'Target posisi wajib diisi untuk audience position',
      );
    }
    if (input.targetAudience === 'specific' && !input.targetEmployeeId) {
      throw new BadRequestException(
        'Target karyawan wajib diisi untuk audience specific',
      );
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        title: input.title,
        content: input.content,
        priority: input.priority,
        targetAudience: input.targetAudience,
        targetDepartmentId: input.targetDepartmentId ?? null,
        targetPositionId: input.targetPositionId ?? null,
        targetEmployeeId: input.targetEmployeeId ?? null,
        publishDate,
        expiryDate,
        createdById,
        isPublished: false,
      },
      include: this.announcementInclude,
    });
    return this.toDto(announcement);
  }

  async update(id: number, input: UpdateAnnouncementInput) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Pengumuman #${id} tidak ditemukan`);
    }
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) data.content = input.content;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.targetAudience !== undefined)
      data.targetAudience = input.targetAudience;
    if (input.publishDate !== undefined)
      data.publishDate = parseLocalDay(input.publishDate);
    if (input.expiryDate !== undefined)
      data.expiryDate = input.expiryDate
        ? parseLocalDay(input.expiryDate)
        : null;
    return this.toDto(
      await this.prisma.announcement.update({
        where: { id },
        data,
        include: this.announcementInclude,
      }),
    );
  }

  async publish(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: this.announcementInclude,
    });
    if (!announcement) {
      throw new NotFoundException(`Pengumuman #${id} tidak ditemukan`);
    }
    if (announcement.isPublished) {
      throw new BadRequestException('Pengumuman sudah terpublikasi');
    }
    const published = await this.prisma.announcement.update({
      where: { id },
      data: { isPublished: true },
      include: this.announcementInclude,
    });
    await this.notifications.sendAnnouncement(published);
    return this.toDto(published);
  }

  async remove(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Pengumuman #${id} tidak ditemukan`);
    }
    await this.prisma.announcement.delete({ where: { id } });
    return { id };
  }

  async list(query: AnnouncementQuery): Promise<AnnouncementListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Record<string, unknown> = {};
    if (query.status === 'published') where.isPublished = true;
    if (query.status === 'draft') where.isPublished = false;
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { content: { contains: query.keyword } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        include: this.announcementInclude,
        orderBy: [{ isPublished: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return {
      items: items.map((a) => this.toDto(a)),
      page,
      limit,
      total,
    };
  }

  async myList(employeeId: number, query: AnnouncementQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const today = new Date();
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true, positionId: true },
    });
    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    const or: Prisma.AnnouncementWhereInput[] = [{ targetAudience: 'all' }];
    if (employee.departmentId) {
      or.push({
        targetAudience: 'department',
        targetDepartmentId: employee.departmentId,
      });
    }
    if (employee.positionId) {
      or.push({
        targetAudience: 'position',
        targetPositionId: employee.positionId,
      });
    }
    or.push({ targetAudience: 'specific', targetEmployeeId: employeeId });

    const where: Prisma.AnnouncementWhereInput = {
      isPublished: true,
      publishDate: { lte: today },
      OR: [{ expiryDate: null }, { expiryDate: { gte: today } }],
      AND: { OR: or },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        include: this.announcementInclude,
        orderBy: [
          { priority: 'desc' },
          { publishDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return {
      items: items.map((a) => this.toDto(a, employeeId)),
      page,
      limit,
      total,
    };
  }

  async markRead(employeeId: number, announcementId: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException(
        `Pengumuman #${announcementId} tidak ditemukan`,
      );
    }
    await this.prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId,
        },
      },
      create: { announcementId, employeeId },
      update: {},
    });
    return { announcementId, read: true };
  }

  async unreadCount(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true, positionId: true },
    });
    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }
    const today = new Date();
    const or: Prisma.AnnouncementWhereInput[] = [{ targetAudience: 'all' }];
    if (employee.departmentId) {
      or.push({
        targetAudience: 'department',
        targetDepartmentId: employee.departmentId,
      });
    }
    if (employee.positionId) {
      or.push({
        targetAudience: 'position',
        targetPositionId: employee.positionId,
      });
    }
    or.push({ targetAudience: 'specific', targetEmployeeId: employeeId });
    const count = await this.prisma.announcement.count({
      where: {
        isPublished: true,
        publishDate: { lte: today },
        OR: [{ expiryDate: null }, { expiryDate: { gte: today } }],
        AND: { OR: or },
        reads: { none: { employeeId } },
      },
    });
    return { count };
  }
}
