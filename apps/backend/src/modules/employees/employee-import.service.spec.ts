import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { EmployeeImportService } from './employee-import.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EmployeeImportService', () => {
  let service: EmployeeImportService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      department: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, code: 'TEK', name: 'Teknisi' },
          { id: 2, code: 'HRD', name: 'HRD & Admin' },
        ]),
      },
      position: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, code: 'MEK', name: 'Mekanik Senior' },
          { id: 2, code: 'STF', name: 'Staff HRD' },
        ]),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([
          { employeeNumber: 'EMP-0001', email: 'admin@gaselamotor.com' },
        ]),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 99, ...data })),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 101, ...data })),
      },
      $transaction: jest.fn().mockImplementation((arg) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg))),
    };

    const module = await Test.createTestingModule({
      providers: [
        EmployeeImportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(EmployeeImportService);
  });

  describe('generateTemplate', () => {
    it('menghasilkan file buffer Excel dengan 2 sheet', async () => {
      const buffer = await service.generateTemplate();
      expect(buffer).toBeInstanceOf(Buffer);

      const wb = XLSX.read(buffer, { type: 'buffer' });
      expect(wb.SheetNames).toContain('Data Karyawan');
      expect(wb.SheetNames).toContain('Panduan & Referensi');
    });

    it('dapat membaca dan mengimpor file template resmi yang di-generate sendiri', async () => {
      const templateBuf = await service.generateTemplate();
      const result = await service.importFromExcel(templateBuf);
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });
  });

  describe('importFromExcel - Keamanan & Validasi', () => {
    it('menolak file non-Excel dengan memvalidasi magic bytes', async () => {
      const invalidBuffer = Buffer.from('Bukan file spreadsheet asli sama sekali');
      await expect(service.importFromExcel(invalidBuffer)).rejects.toThrow(BadRequestException);
    });

    it('menolak nama lengkap yang diawali karakter formula injection', async () => {
      const rows = [
        ['NIK', 'Nama Lengkap', 'Email', 'Tanggal Bergabung', 'Tipe Kerja', 'Gaji Pokok'],
        ['EMP-9901', '=cmd|calc', 'formula@gasela.com', '2024-01-01', 'permanent', 5000000],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = await service.importFromExcel(buf);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors[0].message).toContain('karakter formula');
    });
  });

  describe('importFromExcel - Model Atomic Rollback (All-or-Nothing)', () => {
    it('mengembalikan error jika sheet kosong', async () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = await service.importFromExcel(buf);
      expect(result.totalRows).toBe(0);
      expect(result.failedCount).toBe(1);
    });

    it('berhasil mengimpor jika 100% baris data valid', async () => {
      const rows = [
        [
          'NIK (Wajib)',
          'Nama Lengkap (Wajib)',
          'Email (Wajib)',
          'Tanggal Bergabung (Wajib: YYYY-MM-DD)',
          'Tipe Kerja (Wajib)',
          'Gaji Pokok (Wajib: Angka Bulat)',
          'Status Kerja (Opsional)',
          'Departemen (Opsional)',
          'Jabatan (Opsional)',
          'Status PTKP (Opsional)',
          'Nomor Telepon (Opsional)',
        ],
        [
          'EMP-0088',
          'Rian Hidayat',
          'rian@gaselamotor.com',
          '2024-03-01',
          'permanent',
          6000000,
          'permanent',
          'Teknisi',
          'Mekanik Senior',
          'TK0',
          '081299988877',
        ],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = await service.importFromExcel(buf);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeNumber: 'EMP-0088',
            fullName: 'Rian Hidayat',
            departmentId: 1,
            positionId: 1,
            basicSalary: '6000000',
          }),
        }),
      );
    });

    it('ATOMIC ROLLBACK: jika ada 1 baris salah dari beberapa baris, 0 data yang disimpan ke DB', async () => {
      const rows = [
        ['NIK', 'Nama Lengkap', 'Email', 'Tanggal Bergabung', 'Tipe Kerja', 'Gaji Pokok'],
        ['EMP-1001', 'Karyawan Benar', 'benar@gaselamotor.com', '2024-03-01', 'permanent', 5000000],
        ['EMP-1002', 'Karyawan Salah Email', 'email-salah-tanpa-domain', '2024-03-01', 'permanent', 5000000],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = await service.importFromExcel(buf);
      // Tidak ada data yang tersimpan sebagian (All-or-Nothing / Rollback)
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].row).toBe(3);
      expect(result.errors[0].message).toContain('Format email');

      // Pastikan transaksi simpan ke database sama sekali tidak dipanggil!
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.employee.create).not.toHaveBeenCalled();
    });

    it('menolak baris dengan NIK yang sudah terdaftar di database', async () => {
      const rows = [
        ['NIK', 'Nama Lengkap', 'Email', 'Tanggal Bergabung', 'Tipe Kerja', 'Gaji Pokok'],
        ['EMP-0001', 'Kloning Admin', 'kloning@gaselamotor.com', '2024-03-01', 'permanent', 5000000],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = await service.importFromExcel(buf);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors[0].message).toContain('sudah terdaftar di database');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('membuat akun User dengan mustChangePassword: true saat autoCreateAccounts aktif', async () => {
      const rows = [
        ['NIK', 'Nama Lengkap', 'Email', 'Tanggal Bergabung', 'Tipe Kerja', 'Gaji Pokok', 'Departemen', 'Jabatan'],
        ['EMP-5555', 'Siti Rahma', 'siti@gaselamotor.com', '2024-03-01', 'permanent', 6000000, 'HRD & Admin', 'Staff HRD'],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = await service.importFromExcel(buf, { autoCreateAccounts: true });
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(prisma.employee.create).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'EMP-5555',
            mustChangePassword: true,
            passwordChangedAt: null,
            role: 'hrd',
          }),
        }),
      );
    });
  });
});
