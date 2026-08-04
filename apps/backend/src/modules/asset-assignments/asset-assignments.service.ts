import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetAssignment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AssetAssignmentQuery,
  CreateAssetAssignmentInput,
  UpdateAssetAssignmentInput,
} from './dto/asset-assignment.dto';

type AssignmentWithEmployee = AssetAssignment & {
  employee: { fullName: string };
};

export interface AssetAssignmentItem {
  id: number;
  employeeId: number;
  employeeName: string;
  assetName: string;
  assetCode: string;
  serialNumber: string | null;
  assignmentDate: Date;
  returnDate: Date | null;
  status: AssetAssignment['status'];
  conditionNotes: string | null;
}

@Injectable()
export class AssetAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private decorate(a: AssignmentWithEmployee): AssetAssignmentItem {
    return {
      id: a.id,
      employeeId: a.employeeId,
      employeeName: a.employee.fullName,
      assetName: a.assetName,
      assetCode: a.assetCode,
      serialNumber: a.serialNumber,
      assignmentDate: a.assignmentDate,
      returnDate: a.returnDate,
      status: a.status,
      conditionNotes: a.conditionNotes,
    };
  }

  private readonly include = {
    employee: { select: { fullName: true } },
  } satisfies Prisma.AssetAssignmentInclude;

  async list(query: AssetAssignmentQuery = {}): Promise<AssetAssignmentItem[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      where: query.employeeId
        ? { employeeId: query.employeeId }
        : undefined,
      include: this.include,
      orderBy: [{ status: 'asc' }, { assignmentDate: 'desc' }, { id: 'desc' }],
    });
    return assignments.map((a) => this.decorate(a));
  }

  async listActive(): Promise<AssetAssignmentItem[]> {
    const assignments = await this.prisma.assetAssignment.findMany({
      where: { status: 'assigned' },
      include: this.include,
      orderBy: [{ assignmentDate: 'desc' }],
    });
    return assignments.map((a) => this.decorate(a));
  }

  async returnAsset(id: number, conditionNotes?: string): Promise<AssetAssignmentItem> {
    const existing = await this.prisma.assetAssignment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Penugasan aset tidak ditemukan');
    if (existing.status === 'returned') {
      throw new ConflictException('Aset ini sudah dikembalikan sebelumnya');
    }
    const assignment = await this.prisma.assetAssignment.update({
      where: { id },
      data: {
        status: 'returned',
        returnDate: new Date(),
        conditionNotes: conditionNotes ?? existing.conditionNotes,
      },
      include: this.include,
    });
    return this.decorate(assignment);
  }

  async getById(id: number): Promise<AssetAssignmentItem> {
    const assignment = await this.prisma.assetAssignment.findUnique({
      where: { id },
      include: this.include,
    });
    if (!assignment) throw new NotFoundException('Penugasan aset tidak ditemukan');
    return this.decorate(assignment);
  }

  async create(input: CreateAssetAssignmentInput): Promise<AssetAssignmentItem> {
    await this.assertEmployee(input.employeeId);
    const existing = await this.prisma.assetAssignment.findUnique({
      where: { assetCode: input.assetCode },
    });
    if (existing) {
      throw new ConflictException(`Kode aset '${input.assetCode}' sudah dipakai`);
    }
    if (input.returnDate && input.returnDate < input.assignmentDate) {
      throw new BadRequestException('Tanggal kembali harus setelah tanggal penugasan');
    }
    const assignment = await this.prisma.assetAssignment.create({
      data: {
        employeeId: input.employeeId,
        assetName: input.assetName,
        assetCode: input.assetCode,
        serialNumber: input.serialNumber ?? null,
        assignmentDate: input.assignmentDate,
        returnDate: input.returnDate ?? null,
        status: input.status ?? 'assigned',
        conditionNotes: input.conditionNotes ?? null,
      },
      include: this.include,
    });
    return this.decorate(assignment);
  }

  async update(
    id: number,
    input: UpdateAssetAssignmentInput,
  ): Promise<AssetAssignmentItem> {
    const existing = await this.prisma.assetAssignment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Penugasan aset tidak ditemukan');

    if (input.assetCode && input.assetCode !== existing.assetCode) {
      const duplicate = await this.prisma.assetAssignment.findUnique({
        where: { assetCode: input.assetCode },
      });
      if (duplicate) {
        throw new ConflictException(`Kode aset '${input.assetCode}' sudah dipakai`);
      }
    }
    if (input.employeeId) await this.assertEmployee(input.employeeId);

    const assignmentDate = input.assignmentDate ?? existing.assignmentDate;
    const returnDate = input.returnDate ?? existing.returnDate;
    if (returnDate && returnDate < assignmentDate) {
      throw new BadRequestException('Tanggal kembali harus setelah tanggal penugasan');
    }
    const status = input.status ?? existing.status;
    const effectiveReturnDate =
      input.returnDate === null
        ? null
        : returnDate ??
          (status === 'returned' ? new Date() : null);

    const assignment = await this.prisma.assetAssignment.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        assetName: input.assetName,
        assetCode: input.assetCode,
        serialNumber:
          input.serialNumber === undefined ? undefined : input.serialNumber ?? null,
        assignmentDate: input.assignmentDate,
        returnDate: effectiveReturnDate,
        status: input.status,
        conditionNotes:
          input.conditionNotes === undefined ? undefined : input.conditionNotes ?? null,
      },
      include: this.include,
    });
    return this.decorate(assignment);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.prisma.assetAssignment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Penugasan aset tidak ditemukan');
    await this.prisma.assetAssignment.delete({ where: { id } });
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
