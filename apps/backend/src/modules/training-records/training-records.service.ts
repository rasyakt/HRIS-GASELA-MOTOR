import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TrainingRecord } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateTrainingRecordInput,
  TrainingRecordQuery,
  UpdateTrainingRecordInput,
} from './dto/training-record.dto';

type RecordWithEmployee = TrainingRecord & {
  employee: { fullName: string };
};

export interface TrainingRecordItem {
  id: number;
  employeeId: number;
  employeeName: string;
  trainingName: string;
  trainingProvider: string | null;
  startDate: Date;
  endDate: Date;
  durationHours: number | null;
  certificateUrl: string | null;
  cost: number | null;
  notes: string | null;
}

@Injectable()
export class TrainingRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  private decorate(r: RecordWithEmployee): TrainingRecordItem {
    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      trainingName: r.trainingName,
      trainingProvider: r.trainingProvider,
      startDate: r.startDate,
      endDate: r.endDate,
      durationHours: r.durationHours,
      certificateUrl: r.certificateUrl,
      cost: r.cost === null ? null : Number(r.cost),
      notes: r.notes,
    };
  }

  private readonly include = {
    employee: { select: { fullName: true } },
  } satisfies Prisma.TrainingRecordInclude;

  async list(query: TrainingRecordQuery = {}): Promise<TrainingRecordItem[]> {
    const records = await this.prisma.trainingRecord.findMany({
      where: query.employeeId
        ? { employeeId: query.employeeId }
        : undefined,
      include: this.include,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    });
    return records.map((r) => this.decorate(r));
  }

  async getExpiringCertificates(withinDays = 30): Promise<(TrainingRecordItem & { daysUntilExpiry: number })[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + withinDays);
    const records = await this.prisma.trainingRecord.findMany({
      where: {
        certificateUrl: { not: null },
        endDate: { gte: now, lte: future },
      },
      include: this.include,
      orderBy: [{ endDate: 'asc' }],
    });
    return records.map((r) => ({
      ...this.decorate(r),
      daysUntilExpiry: Math.ceil((r.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getById(id: number): Promise<TrainingRecordItem> {
    const record = await this.prisma.trainingRecord.findUnique({
      where: { id },
      include: this.include,
    });
    if (!record) throw new NotFoundException('Data pelatihan tidak ditemukan');
    return this.decorate(record);
  }

  async create(input: CreateTrainingRecordInput): Promise<TrainingRecordItem> {
    await this.assertEmployee(input.employeeId);
    if (input.endDate < input.startDate) {
      throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');
    }
    const record = await this.prisma.trainingRecord.create({
      data: {
        employeeId: input.employeeId,
        trainingName: input.trainingName,
        trainingProvider: input.trainingProvider ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        durationHours: input.durationHours ?? null,
        certificateUrl: input.certificateUrl ?? null,
        cost: input.cost ?? null,
        notes: input.notes ?? null,
      },
      include: this.include,
    });
    return this.decorate(record);
  }

  async update(
    id: number,
    input: UpdateTrainingRecordInput,
  ): Promise<TrainingRecordItem> {
    const existing = await this.prisma.trainingRecord.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Data pelatihan tidak ditemukan');

    const startDate = input.startDate ?? existing.startDate;
    const endDate = input.endDate ?? existing.endDate;
    if (endDate < startDate) {
      throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');
    }
    if (input.employeeId) await this.assertEmployee(input.employeeId);

    const record = await this.prisma.trainingRecord.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        trainingName: input.trainingName,
        trainingProvider:
          input.trainingProvider === undefined ? undefined : input.trainingProvider ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        durationHours:
          input.durationHours === undefined ? undefined : input.durationHours ?? null,
        certificateUrl:
          input.certificateUrl === undefined ? undefined : input.certificateUrl ?? null,
        cost: input.cost === undefined ? undefined : input.cost ?? null,
        notes: input.notes === undefined ? undefined : input.notes ?? null,
      },
      include: this.include,
    });
    return this.decorate(record);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.prisma.trainingRecord.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Data pelatihan tidak ditemukan');
    await this.prisma.trainingRecord.delete({ where: { id } });
  }

  private async assertEmployee(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new BadRequestException(`Karyawan ID ${employeeId} tidak ditemukan`);
    }
  }
}
