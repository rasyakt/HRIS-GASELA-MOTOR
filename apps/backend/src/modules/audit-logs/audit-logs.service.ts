import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId?: string | number;
  payload?: Record<string, unknown> | null;
  userId?: number;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId !== undefined ? String(entry.resourceId) : null,
        payload: entry.payload ? JSON.stringify(entry.payload) : null,
        userId: entry.userId ?? null,
        username: entry.username ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ? entry.userAgent.slice(0, 255) : null,
      },
    });
  }

  async list(query: AuditLogQuery = {}) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async stats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [total, today] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { timestamp: { gte: todayStart } } }),
    ]);
    return { total, today };
  }
}
