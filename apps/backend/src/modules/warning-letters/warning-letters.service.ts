import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateWarningLetterDto,
  UpdateWarningLetterDto,
  WarningLetterQueryDto,
} from './dto/warning-letter.dto';

@Injectable()
export class WarningLettersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: WarningLetterQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: any = {};

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.level) where.level = query.level;
    if (query.search) {
      where.OR = [
        { letterNumber: { contains: query.search } },
        { violationReason: { contains: query.search } },
        { employee: { fullName: { contains: query.search } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.warningLetter.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeNumber: true, fullName: true, department: true, position: true } },
          issuedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { issuedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.warningLetter.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: number) {
    const warning = await this.prisma.warningLetter.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, employeeNumber: true, fullName: true, department: true, position: true } },
        issuedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!warning) throw new NotFoundException(`Surat peringatan #${id} tidak ditemukan`);
    return warning;
  }

  async create(input: CreateWarningLetterDto, issuerEmployeeId?: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee) throw new NotFoundException(`Karyawan #${input.employeeId} tidak ditemukan`);

    const existingNumber = await this.prisma.warningLetter.findUnique({
      where: { letterNumber: input.letterNumber },
    });
    if (existingNumber) throw new ConflictException(`Nomor surat "${input.letterNumber}" sudah ada`);

    return this.prisma.warningLetter.create({
      data: {
        employeeId: input.employeeId,
        letterNumber: input.letterNumber,
        level: input.level,
        violationReason: input.violationReason,
        issuedDate: new Date(input.issuedDate),
        effectiveUntil: new Date(input.effectiveUntil),
        issuedById: issuerEmployeeId || null,
        documentUrl: input.documentUrl || null,
      },
    });
  }

  async update(id: number, input: UpdateWarningLetterDto) {
    await this.getById(id);
    return this.prisma.warningLetter.update({
      where: { id },
      data: {
        ...(input.letterNumber && { letterNumber: input.letterNumber }),
        ...(input.level && { level: input.level }),
        ...(input.violationReason && { violationReason: input.violationReason }),
        ...(input.issuedDate && { issuedDate: new Date(input.issuedDate) }),
        ...(input.effectiveUntil && { effectiveUntil: new Date(input.effectiveUntil) }),
        ...(input.documentUrl !== undefined && { documentUrl: input.documentUrl }),
      },
    });
  }

  async delete(id: number) {
    await this.getById(id);
    return this.prisma.warningLetter.delete({ where: { id } });
  }
}
