import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CompanySettingDto,
  CreateHolidayInput,
  HolidayDto,
  HolidayQuery,
  UpdateCompanySettingInput,
  UpdateHolidayInput,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

function parseLocalDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== COMPANY SETTING =====================

  async listCompanySettings(): Promise<CompanySettingDto[]> {
    const rows = await this.prisma.companySetting.findMany({
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => ({
      key: r.key,
      value: r.value,
      description: r.description,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async updateCompanySetting(input: UpdateCompanySettingInput) {
    const row = await this.prisma.companySetting.findUnique({
      where: { key: input.key },
    });
    if (!row) {
      const description =
        input.key === 'portal.theme_config'
          ? 'Konfigurasi tema & warna portal HRIS GaselaPulse'
          : input.key === 'attendance.photo_retention_days'
            ? 'Batas waktu retensi foto presensi (hari)'
            : input.key === 'attendance.checkout_earliest_buffer_minutes'
              ? 'Batas waktu tercepat check-out sebelum jam shift berakhir (dalam menit)'
              : `Pengaturan ${input.key}`;
      const created = await this.prisma.companySetting.create({
        data: {
          key: input.key,
          value: input.value,
          description,
        },
      });
      return {
        key: created.key,
        value: created.value,
        description: created.description,
        updatedAt: created.updatedAt.toISOString(),
      } satisfies CompanySettingDto;
    }
    const updated = await this.prisma.companySetting.update({
      where: { key: input.key },
      data: { value: input.value },
    });
    return {
      key: updated.key,
      value: updated.value,
      description: updated.description,
      updatedAt: updated.updatedAt.toISOString(),
    } satisfies CompanySettingDto;
  }

  // ===================== HOLIDAY =====================

  async listHolidays(query: HolidayQuery): Promise<HolidayDto[]> {
    const year = query.year ?? new Date().getFullYear();
    const rows = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31)),
        },
      },
      orderBy: { date: 'asc' },
    });
    return rows.map((h) => ({
      id: h.id,
      date: dayKey(h.date),
      name: h.name,
      isRecurringYearly: h.isRecurringYearly,
    }));
  }

  async createHoliday(input: CreateHolidayInput) {
    const date = parseLocalDay(input.date);
    const existing = await this.prisma.holiday.findUnique({
      where: { date },
    });
    if (existing) {
      throw new ConflictException(
        `Tanggal ${input.date} sudah terdaftar sebagai hari libur ('${existing.name}')`,
      );
    }
    return this.toHolidayDto(
      await this.prisma.holiday.create({
        data: {
          date,
          name: input.name,
          isRecurringYearly: input.isRecurringYearly,
        },
      }),
    );
  }

  async updateHoliday(id: number, input: UpdateHolidayInput) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    if (!holiday) {
      throw new NotFoundException(`Hari libur #${id} tidak ditemukan`);
    }
    const data: Record<string, unknown> = {};
    if (input.date !== undefined) {
      const date = parseLocalDay(input.date);
      const clash = await this.prisma.holiday.findUnique({
        where: { date },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException(`Tanggal ${input.date} sudah terdaftar`);
      }
      data.date = date;
    }
    if (input.name !== undefined) data.name = input.name;
    if (input.isRecurringYearly !== undefined)
      data.isRecurringYearly = input.isRecurringYearly;
    return this.toHolidayDto(
      await this.prisma.holiday.update({ where: { id }, data }),
    );
  }

  async removeHoliday(id: number) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    if (!holiday) {
      throw new NotFoundException(`Hari libur #${id} tidak ditemukan`);
    }
    await this.prisma.holiday.delete({ where: { id } });
    return { id };
  }

  private toHolidayDto(h: {
    id: number;
    date: Date;
    name: string;
    isRecurringYearly: boolean;
  }): HolidayDto {
    return {
      id: h.id,
      date: dayKey(h.date),
      name: h.name,
      isRecurringYearly: h.isRecurringYearly,
    };
  }
}
