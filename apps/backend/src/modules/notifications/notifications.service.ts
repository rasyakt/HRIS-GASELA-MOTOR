import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface AnnouncementPayload {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'department' | 'position' | 'specific';
  targetDepartmentId: number | null;
  targetPositionId: number | null;
  targetEmployeeId: number | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly fcmKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.fcmKey = this.config.get<string>('fcmServerKey') ?? '';
  }

  async registerDevice(employeeId: number, token: string, platform: string) {
    const cleaned = token.trim();
    if (!cleaned) {
      return { registered: false, reason: 'token kosong' };
    }
    await this.prisma.deviceToken.upsert({
      where: {
        employeeId_token: { employeeId, token: cleaned },
      },
      create: { employeeId, token: cleaned, platform },
      update: { platform },
    });
    return { registered: true };
  }

  async sendAnnouncement(announcement: AnnouncementPayload) {
    const tokens = await this.targetDeviceTokens(announcement);
    if (tokens.length === 0) {
      this.logger.log(
        `Announcement #${announcement.id}: tidak ada device token target`,
      );
      return { sent: 0, skipped: 0, mode: 'none' };
    }
    if (!this.fcmKey) {
      this.logger.warn(
        `FCM_SERVER_KEY kosong — push #${announcement.id} dilewati (${tokens.length} token)`,
      );
      return { sent: 0, skipped: tokens.length, mode: 'unconfigured' };
    }
    return this.sendLegacyFcm(tokens, {
      title: announcement.title,
      body: announcement.content.slice(0, 200),
      data: {
        type: 'announcement',
        announcementId: String(announcement.id),
        priority: announcement.priority,
      },
    });
  }

  private async targetDeviceTokens(
    announcement: AnnouncementPayload,
  ): Promise<string[]> {
    const where: Record<string, unknown> = {
      employee: {
        isActive: true,
        user: { isActive: true },
      },
    };
    if (announcement.targetAudience === 'department') {
      where.employee = {
        ...(where.employee as Record<string, unknown>),
        departmentId: announcement.targetDepartmentId,
      };
    } else if (announcement.targetAudience === 'position') {
      where.employee = {
        ...(where.employee as Record<string, unknown>),
        positionId: announcement.targetPositionId,
      };
    } else if (announcement.targetAudience === 'specific') {
      where.employee = {
        ...(where.employee as Record<string, unknown>),
        id: announcement.targetEmployeeId,
      };
    }
    const rows = await this.prisma.deviceToken.findMany({
      where,
      select: { token: true },
      take: 1000,
    });
    return rows.map((r) => r.token);
  }

  private async sendLegacyFcm(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data: Record<string, string>;
    },
  ) {
    let sent = 0;
    let skipped = 0;
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.fcmKey}`,
        },
        body: JSON.stringify({
          registration_ids: tokens,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        success?: number;
        failure?: number;
      } | null;
      sent = body?.success ?? (res.ok ? tokens.length : 0);
      skipped = (body?.failure ?? 0) + (res.ok ? 0 : tokens.length);
      if (!res.ok) {
        this.logger.error(
          `FCM error HTTP ${res.status}: ${JSON.stringify(body)}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `FCM request gagal: ${err instanceof Error ? err.message : String(err)}`,
      );
      skipped = tokens.length;
    }
    this.logger.log(`FCM push: ${sent} terkirim, ${skipped} gagal`);
    return { sent, skipped, mode: 'legacy' };
  }
}
