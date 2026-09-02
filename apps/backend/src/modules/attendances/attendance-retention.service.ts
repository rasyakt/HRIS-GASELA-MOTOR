import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { existsSync } from 'fs';
import { rm, stat } from 'fs/promises';
import { isAbsolute, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

export interface CleanupResult {
  purgedRecordsCount: number;
  deletedFilesCount: number;
  retentionDays: number;
  freedBytesEstimated: number;
  message: string;
}

@Injectable()
export class AttendanceRetentionService {
  private readonly logger = new Logger(AttendanceRetentionService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const dir = this.config.get<string>('uploadDir') ?? './uploads';
    this.uploadDir = isAbsolute(dir) ? dir : join(process.cwd(), dir);
  }

  /**
   * Automatic daily cron job running every night at 02:00 WIB (19:00 UTC)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup() {
    this.logger.log('Starting scheduled daily attendance photo retention cleanup...');
    try {
      const result = await this.cleanupOldPhotos();
      this.logger.log(
        `Scheduled cleanup completed: ${result.deletedFilesCount} photos purged across ${result.purgedRecordsCount} records (${(result.freedBytesEstimated / 1024 / 1024).toFixed(2)} MB freed).`,
      );
    } catch (err) {
      this.logger.error('Failed to execute daily attendance photo retention cleanup', err);
    }
  }

  /**
   * Purges attendance selfie photos older than retentionDays
   */
  async cleanupOldPhotos(customRetentionDays?: number): Promise<CleanupResult> {
    let retentionDays = customRetentionDays;

    if (!retentionDays || retentionDays <= 0) {
      const setting = await this.prisma.companySetting.findUnique({
        where: { key: 'attendance.photo_retention_days' },
      });
      retentionDays = setting?.value ? parseInt(setting.value, 10) : 60;
    }

    if (isNaN(retentionDays) || retentionDays < 1) {
      retentionDays = 60;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    cutoffDate.setHours(0, 0, 0, 0);

    // Find attendances before cutoffDate that still retain photo URLs
    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: { lt: cutoffDate },
        OR: [
          { checkInPhotoUrl: { not: null } },
          { checkOutPhotoUrl: { not: null } },
        ],
      },
      select: {
        id: true,
        checkInPhotoUrl: true,
        checkOutPhotoUrl: true,
      },
    });

    if (attendances.length === 0) {
      return {
        purgedRecordsCount: 0,
        deletedFilesCount: 0,
        retentionDays,
        freedBytesEstimated: 0,
        message: `Tidak ada foto presensi lebih lama dari ${retentionDays} hari yang perlu dibersihkan.`,
      };
    }

    let deletedFilesCount = 0;
    let freedBytesEstimated = 0;
    const idsToUpdate: number[] = [];

    for (const record of attendances) {
      idsToUpdate.push(record.id);

      const urls = [record.checkInPhotoUrl, record.checkOutPhotoUrl].filter(
        Boolean,
      ) as string[];

      for (const url of urls) {
        // e.g. /api/uploads/attendance/xxx.jpg -> attendance/xxx.jpg
        const relativePath = url.replace(/^\/api\/uploads\//, '');
        if (relativePath && !relativePath.startsWith('..')) {
          const filePath = join(this.uploadDir, relativePath);
          try {
            if (existsSync(filePath)) {
              const fileStats = await stat(filePath).catch(() => null);
              if (fileStats) {
                freedBytesEstimated += fileStats.size;
              }
              await rm(filePath, { force: true });
              deletedFilesCount++;
            }
          } catch (fileErr) {
            this.logger.warn(`Could not remove file ${filePath}: ${fileErr}`);
          }
        }
      }
    }

    // Clear photo references in DB while preserving attendance history
    if (idsToUpdate.length > 0) {
      await this.prisma.attendance.updateMany({
        where: { id: { in: idsToUpdate } },
        data: {
          checkInPhotoUrl: null,
          checkOutPhotoUrl: null,
        },
      });
    }

    const freedMb = (freedBytesEstimated / (1024 * 1024)).toFixed(2);
    return {
      purgedRecordsCount: idsToUpdate.length,
      deletedFilesCount,
      retentionDays,
      freedBytesEstimated,
      message: `Berhasil membersihkan ${deletedFilesCount} foto presensi lama (> ${retentionDays} hari). Ruang penyimpanan dihemat: ${freedMb} MB.`,
    };
  }
}
