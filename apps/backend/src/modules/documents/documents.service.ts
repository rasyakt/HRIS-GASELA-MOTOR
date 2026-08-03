import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import type { CreateDocumentInput, DocumentQuery } from './dto/document.dto';

type DocumentWithEmployee = Prisma.EmployeeDocumentGetPayload<{
  include: {
    employee: { select: { id: true; employeeNumber: true; fullName: true } };
  };
}>;

export interface DocumentItem {
  id: number;
  employeeId: number;
  documentType: DocumentType;
  documentName: string;
  documentUrl: string;
  uploadDate: Date;
  expiryDate: Date | null;
  expired: boolean;
  daysUntilExpiry: number | null;
  employee: { id: number; employeeNumber: string; fullName: string };
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  private decorate(doc: DocumentWithEmployee): DocumentItem {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
    if (expiry) expiry.setHours(0, 0, 0, 0);
    const ms = expiry ? expiry.getTime() - today.getTime() : null;
    return {
      id: doc.id,
      employeeId: doc.employeeId,
      documentType: doc.documentType,
      documentName: doc.documentName,
      documentUrl: doc.documentUrl,
      uploadDate: doc.uploadDate,
      expiryDate: doc.expiryDate,
      expired: ms !== null && ms < 0,
      daysUntilExpiry: ms === null ? null : Math.ceil(ms / 86400000),
      employee: {
        id: doc.employee.id,
        employeeNumber: doc.employee.employeeNumber,
        fullName: doc.employee.fullName,
      },
    };
  }

  async create(input: CreateDocumentInput): Promise<DocumentItem> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: input.employeeId },
    });
    if (!employee) {
      throw new BadRequestException(
        `Karyawan ID ${input.employeeId} tidak ditemukan`,
      );
    }

    const doc = await this.prisma.employeeDocument.create({
      data: {
        employeeId: input.employeeId,
        documentType: input.documentType as DocumentType,
        documentName: input.documentName,
        documentUrl: input.documentUrl,
        uploadDate: new Date(),
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      },
      include: {
        employee: {
          select: { id: true, employeeNumber: true, fullName: true },
        },
      },
    });
    return this.decorate(doc);
  }

  async list(query: DocumentQuery = {}): Promise<DocumentItem[]> {
    const expiringDays = query.expiringDays;
    const extraWhere: Prisma.EmployeeDocumentWhereInput = {};
    if (expiringDays !== undefined) {
      const limit = new Date();
      limit.setHours(0, 0, 0, 0);
      limit.setDate(limit.getDate() + expiringDays);
      extraWhere.expiryDate = { lte: limit };
    }

    const docs = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId: query.employeeId,
        ...extraWhere,
      },
      include: {
        employee: {
          select: { id: true, employeeNumber: true, fullName: true },
        },
      },
      orderBy: [{ expiryDate: 'asc' }, { uploadDate: 'desc' }],
    });
    return docs.map((d) => this.decorate(d));
  }

  async getById(id: number): Promise<DocumentItem> {
    const doc = await this.prisma.employeeDocument.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, employeeNumber: true, fullName: true },
        },
      },
    });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    return this.decorate(doc);
  }

  async delete(id: number): Promise<void> {
    const doc = await this.prisma.employeeDocument.findUnique({
      where: { id },
    });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');

    // Delete from database first in a try-catch
    try {
      await this.prisma.employeeDocument.delete({ where: { id } });
    } catch (error) {
      throw new BadRequestException('Gagal menghapus dokumen dari database');
    }

    // Then try to delete the file from disk
    // If this fails, the DB record is already deleted which is acceptable
    // (orphaned files can be cleaned up separately)
    if (doc.documentUrl.startsWith('/api/uploads/')) {
      try {
        const relative = doc.documentUrl.replace(/^\/api\/uploads\//, '');
        await this.uploadsService.remove(relative);
      } catch (error) {
        // Log the error but don't throw - DB record is already deleted
        console.error(`Failed to delete file ${doc.documentUrl}:`, error);
      }
    }
  }

  async stats(): Promise<{
    total: number;
    expired: number;
    expiring30: number;
  }> {
    const all = await this.prisma.employeeDocument.findMany({
      select: { expiryDate: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit30 = new Date(today);
    limit30.setDate(limit30.getDate() + 30);

    let expired = 0;
    let expiring30 = 0;
    for (const d of all) {
      if (!d.expiryDate) continue;
      const exp = new Date(d.expiryDate);
      exp.setHours(0, 0, 0, 0);
      if (exp.getTime() < today.getTime()) expired++;
      else if (exp.getTime() <= limit30.getTime()) expiring30++;
    }
    return { total: all.length, expired, expiring30 };
  }
}
