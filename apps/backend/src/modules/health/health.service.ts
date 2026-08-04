import { Injectable } from '@nestjs/common';
import * as os from 'os';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    let db = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }

    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    const memoryUsagePercent = Math.round(((totalMemMb - freeMemMb) / totalMemMb) * 100);

    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        totalMb: totalMemMb,
        freeMb: freeMemMb,
        usedPercent: memoryUsagePercent,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
