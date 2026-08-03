import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;
  let uploads: any;

  beforeEach(async () => {
    prisma = {
      employee: { findUnique: jest.fn() },
      employeeDocument: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    uploads = { remove: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploads },
      ],
    }).compile();
    service = module.get(DocumentsService);
  });

  const baseDoc = {
    id: 1,
    employeeId: 2,
    documentType: 'ktp',
    documentName: 'KTP Budi',
    documentUrl: '/api/uploads/document/xx.pdf',
    uploadDate: new Date('2026-07-01'),
    expiryDate: new Date('2030-01-01'),
    employee: {
      id: 2,
      employeeNumber: 'EMP-0002',
      fullName: 'Budi Santoso',
    },
  };

  it('menolak membuat dokumen untuk karyawan yang tidak ada', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(
      service.create({
        employeeId: 999,
        documentType: 'ktp',
        documentName: 'X',
        documentUrl: '/api/uploads/document/x.pdf',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('membuat dokumen dan menandai expired', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 2 });
    const past = new Date('2020-01-01');
    prisma.employeeDocument.create.mockResolvedValue({
      ...baseDoc,
      expiryDate: past,
    });
    const result = await service.create({
      employeeId: 2,
      documentType: 'ktp',
      documentName: 'KTP Budi',
      documentUrl: '/api/uploads/document/xx.pdf',
    });
    expect(result.expired).toBe(true);
    expect(result.daysUntilExpiry).toBeLessThan(0);
    expect(prisma.employeeDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ employeeId: 2, documentType: 'ktp' }),
      }),
    );
  });

  it('list menandai dokumen sehat (belum kedaluwarsa)', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 100);
    prisma.employeeDocument.findMany.mockResolvedValue([
      { ...baseDoc, expiryDate: future },
    ]);
    const result = await service.list({});
    expect(result[0].expired).toBe(false);
    expect(result[0].daysUntilExpiry).toBe(100);
  });

  it('list dengan expiringDays memfilter dokumen yang akan kedaluwarsa', async () => {
    prisma.employeeDocument.findMany.mockResolvedValue([]);
    await service.list({ expiringDays: 30 });
    expect(prisma.employeeDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiryDate: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      }),
    );
  });

  it('melempar NotFound untuk detail yang tidak ada', async () => {
    prisma.employeeDocument.findUnique.mockResolvedValue(null);
    await expect(service.getById(99)).rejects.toThrow(NotFoundException);
  });

  it('menghapus dokumen beserta file upload', async () => {
    prisma.employeeDocument.findUnique.mockResolvedValue(baseDoc);
    prisma.employeeDocument.delete.mockResolvedValue(baseDoc);
    await service.delete(1);
    expect(uploads.remove).toHaveBeenCalledWith('document/xx.pdf');
    expect(prisma.employeeDocument.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('menghapus dokumen tanpa menghapus file bila URL bukan upload', async () => {
    prisma.employeeDocument.findUnique.mockResolvedValue({
      ...baseDoc,
      documentUrl: 'https://drive.google.com/x.pdf',
    });
    await service.delete(1);
    expect(uploads.remove).not.toHaveBeenCalled();
  });

  it('stats menghitung expired dan expiring 30 hari', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const past = new Date(today);
    past.setDate(past.getDate() - 5);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 10);
    const far = new Date(today);
    far.setDate(far.getDate() + 200);
    prisma.employeeDocument.findMany.mockResolvedValue([
      { expiryDate: past },
      { expiryDate: soon },
      { expiryDate: far },
      { expiryDate: null },
    ]);
    const stats = await service.stats();
    expect(stats).toEqual({ total: 4, expired: 1, expiring30: 1 });
  });
});
