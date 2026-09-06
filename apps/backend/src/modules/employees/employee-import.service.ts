import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { EmployeeImportResultDto, EmployeeImportErrorItem } from '@gasela/shared-types';

@Injectable()
export class EmployeeImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menghasilkan file buffer Excel template import karyawan resmi (.xlsx)
   * Berisi Sheet 1 ("Data Karyawan") dan Sheet 2 ("Panduan & Referensi") dengan desain profesional.
   */
  async generateTemplate(): Promise<Buffer> {
    const [departments, positions] = await Promise.all([
      this.prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.position.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HRIS Gasela Motor';
    workbook.lastModifiedBy = 'HRIS Gasela Motor';
    workbook.created = new Date();

    // ==========================================
    // SHEET 1: Data Karyawan
    // ==========================================
    const ws1 = workbook.addWorksheet('Data Karyawan', {
      views: [{ showGridLines: true }],
    });

    // Definisi Kolom (18 Kolom)
    ws1.columns = [
      { header: 'NIK (Wajib)', key: 'nik', width: 18 },
      { header: 'Nama Lengkap (Wajib)', key: 'fullName', width: 28 },
      { header: 'Email (Wajib)', key: 'email', width: 32 },
      { header: 'Tanggal Bergabung (Wajib: YYYY-MM-DD)', key: 'joinDate', width: 30 },
      { header: 'Tipe Kerja (Wajib)', key: 'type', width: 20 },
      { header: 'Gaji Pokok (Wajib: Angka Bulat)', key: 'salary', width: 24 },
      { header: 'Status Kerja (Opsional)', key: 'status', width: 22 },
      { header: 'Departemen (Opsional)', key: 'dept', width: 26 },
      { header: 'Jabatan (Opsional)', key: 'pos', width: 26 },
      { header: 'Status PTKP (Opsional)', key: 'ptkp', width: 18 },
      { header: 'Nomor Telepon (Opsional)', key: 'phone', width: 22 },
      { header: 'Tanggal Lahir (Opsional: YYYY-MM-DD)', key: 'birthDate', width: 28 },
      { header: 'Nomor KTP (Opsional: 16 Digit)', key: 'ktp', width: 26 },
      { header: 'NPWP (Opsional)', key: 'npwp', width: 22 },
      { header: 'Alamat (Opsional)', key: 'address', width: 38 },
      { header: 'Nama Bank (Opsional)', key: 'bank', width: 18 },
      { header: 'Nomor Rekening (Opsional)', key: 'accountNo', width: 22 },
      { header: 'Nama Pemilik Rekening (Opsional)', key: 'accountName', width: 28 },
    ];

    // Banner Judul Utama di Baris 1
    ws1.spliceRows(1, 0, []);
    ws1.mergeCells('A1:R1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'TEMPLATE IMPORT DATA KARYAWAN — HRIS GASELA MOTOR';
    titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' }, // Slate 900 Navy
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 32;

    // Subtitle Petunjuk di Baris 2
    ws1.spliceRows(2, 0, []);
    ws1.mergeCells('A2:R2');
    const subtitleCell = ws1.getCell('A2');
    subtitleCell.value = 'PETUNJUK: Kolom berlabel (Wajib) HARUS diisi. Kolom (Opsional) boleh dikosongkan. Jangan mengubah nama/urutan header pada Baris 3.';
    subtitleCell.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: '334155' } };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' }, // Slate 100
    };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(2).height = 24;

    // Styling Header Kolom (Baris 3)
    const headerRow = ws1.getRow(3);
    headerRow.height = 30;

    // Kolom 1-6 Wajib (Emerald Green #047857)
    // Kolom 7-18 Opsional (Slate Gray #475569)
    for (let c = 1; c <= 18; c++) {
      const cell = headerRow.getCell(c);
      const isMandatory = c <= 6;

      cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isMandatory ? '047857' : '475569' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: '94A3B8' } },
        left: { style: 'thin', color: { argb: '94A3B8' } },
        bottom: { style: 'medium', color: { argb: '1E293B' } },
        right: { style: 'thin', color: { argb: '94A3B8' } },
      };
    }

    // Data Contoh 1 (Baris 4)
    const row4 = ws1.addRow([
      'EMP-0010',
      'Ahmad Fauzi',
      'ahmad.fauzi@gaselamotor.com',
      '2024-01-15',
      'permanent',
      5000000,
      'active',
      departments[0]?.name || 'Teknisi',
      positions[0]?.name || 'Mekanik Senior',
      'TK0',
      '081234567890',
      '1995-08-20',
      '3201234567890001',
      '123456789012345',
      'Jl. Raya Gasela No. 12, Bandung',
      'BCA',
      '1234567890',
      'Ahmad Fauzi',
    ]);
    row4.height = 24;

    // Data Contoh 2 (Baris 5)
    const row5 = ws1.addRow([
      'EMP-0011',
      'Siti Nurhaliza',
      'siti.nurhaliza@gaselamotor.com',
      '2024-02-01',
      'contract',
      4500000,
      'probation',
      departments[1]?.name || 'Penjualan & Kasir',
      positions[1]?.name || 'Kasir',
      'TK1',
      '081987654321',
      '1998-03-12',
      '3201234567890002',
      '',
      'Jl. Merdeka No. 45, Bandung',
      'Mandiri',
      '9876543210',
      'Siti Nurhaliza',
    ]);
    row5.height = 24;

    // Format & Border untuk Baris Contoh Data
    [row4, row5].forEach((row, idx) => {
      const isZebra = idx % 2 === 1;
      const bgHex = isZebra ? 'F8FAFC' : 'FFFFFF';

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10, color: { argb: '0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgHex },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'CBD5E1' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } },
        };

        // Alignments & Number formatting
        if (
          colNumber === 1 ||
          colNumber === 4 ||
          colNumber === 5 ||
          colNumber === 7 ||
          colNumber === 10 ||
          colNumber === 11 ||
          colNumber === 12 ||
          colNumber === 13 ||
          colNumber === 14 ||
          colNumber === 17
        ) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0'; // Format nominal gaji rapi (misal: 5,000,000)
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // ==========================================
    // SHEET 2: Panduan & Referensi
    // ==========================================
    const ws2 = workbook.addWorksheet('Panduan & Referensi', {
      views: [{ showGridLines: true }],
    });

    ws2.columns = [
      { width: 22 },
      { width: 38 },
      { width: 22 },
      { width: 38 },
    ];

    // Banner Judul Sheet 2
    ws2.mergeCells('A1:D1');
    const guideTitle = ws2.getCell('A1');
    guideTitle.value = 'PANDUAN LENGKAP & REFERENSI MASTER DATA HRIS GASELA MOTOR';
    guideTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    guideTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    guideTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 32;

    const formatTableHeader = (rowObj: ExcelJS.Row, bgHex: string) => {
      rowObj.height = 24;
      rowObj.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgHex } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: '64748B' } },
          left: { style: 'thin', color: { argb: '64748B' } },
          bottom: { style: 'medium', color: { argb: '1E293B' } },
          right: { style: 'thin', color: { argb: '64748B' } },
        };
      });
    };

    const formatDataRow = (rowObj: ExcelJS.Row, isZebra: boolean) => {
      rowObj.height = 20;
      rowObj.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5, color: { argb: '0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isZebra ? 'F8FAFC' : 'FFFFFF' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        if (colNumber === 1 || colNumber === 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: '0369A1' } };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    };

    // Table 1: Tipe Kerja & Status Kerja
    ws2.addRow([]);
    const sec1Header = ws2.addRow(['1. DAFTAR PILIHAN TIPE KERJA (Wajib)', '', '2. DAFTAR PILIHAN STATUS KERJA (Opsional)', '']);
    ws2.mergeCells(`A${sec1Header.number}:B${sec1Header.number}`);
    ws2.mergeCells(`C${sec1Header.number}:D${sec1Header.number}`);
    formatTableHeader(sec1Header, '0284C7');

    const subHeader1 = ws2.addRow(['Nilai Valid', 'Keterangan Tipe Kerja', 'Nilai Valid', 'Keterangan Status Kerja']);
    formatTableHeader(subHeader1, '0369A1');

    const typeStatusData = [
      ['permanent', 'Karyawan Tetap', 'active', 'Karyawan Aktif Bekerja (Default)'],
      ['contract', 'Karyawan Kontrak (PKWT)', 'probation', 'Masa Percobaan (Probation)'],
      ['magang', 'Magang / PKL / Internship', 'resigned', 'Mengundurkan Diri (Resigned)'],
      ['', '', 'terminated', 'Diberhentikan (Terminated)'],
    ];

    typeStatusData.forEach((d, i) => {
      const r = ws2.addRow(d);
      formatDataRow(r, i % 2 === 1);
    });

    // Table 2: Status PTKP Pajak
    ws2.addRow([]);
    const sec2Header = ws2.addRow(['3. DAFTAR PILIHAN STATUS PTKP PAJAK (Opsional, Default: TK0)', '', '', '']);
    ws2.mergeCells(`A${sec2Header.number}:D${sec2Header.number}`);
    formatTableHeader(sec2Header, '6366F1');

    const subHeader2 = ws2.addRow(['Nilai Valid PTKP', 'Keterangan Tanggungan Pajak', '', '']);
    ws2.mergeCells(`B${subHeader2.number}:D${subHeader2.number}`);
    formatTableHeader(subHeader2, '4F46E5');

    const ptkpData = [
      ['TK0', 'Tidak Kawin, Tanpa Tanggungan'],
      ['TK1', 'Tidak Kawin, 1 Tanggungan'],
      ['TK2', 'Tidak Kawin, 2 Tanggungan'],
      ['TK3', 'Tidak Kawin, 3 Tanggungan'],
      ['K0', 'Kawin, Tanpa Tanggungan'],
      ['K1', 'Kawin, 1 Tanggungan'],
      ['K2', 'Kawin, 2 Tanggungan'],
      ['K3', 'Kawin, 3 Tanggungan'],
    ];

    ptkpData.forEach((d, i) => {
      const r = ws2.addRow([d[0], d[1], '', '']);
      ws2.mergeCells(`B${r.number}:D${r.number}`);
      formatDataRow(r, i % 2 === 1);
    });

    // Table 3: Master Departemen & Jabatan Aktif dari Database
    ws2.addRow([]);
    const sec3Header = ws2.addRow(['4. DEPARTEMEN AKTIF DI SISTEM', '', '5. POSISI / JABATAN AKTIF DI SISTEM', '']);
    ws2.mergeCells(`A${sec3Header.number}:B${sec3Header.number}`);
    ws2.mergeCells(`C${sec3Header.number}:D${sec3Header.number}`);
    formatTableHeader(sec3Header, '047857');

    const subHeader3 = ws2.addRow(['Kode Dept', 'Nama Departemen', 'Kode Jabatan', 'Nama Jabatan']);
    formatTableHeader(subHeader3, '059669');

    const maxMasterLen = Math.max(departments.length, positions.length);
    for (let i = 0; i < maxMasterLen; i++) {
      const dept = departments[i];
      const pos = positions[i];
      const r = ws2.addRow([
        dept ? dept.code : '',
        dept ? dept.name : '',
        pos ? pos.code : '',
        pos ? pos.name : '',
      ]);
      formatDataRow(r, i % 2 === 1);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Validasi Magic Bytes file untuk memastikan buffer merupakan file Excel (.xlsx atau .xls) asli
   * XLSX (ZIP): 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
   * XLS (OLE2): 0xD0 0xCF 0x11 0xE0
   */
  private validateExcelMagicBytes(buffer: Buffer): void {
    if (!buffer || buffer.length < 4) {
      throw new BadRequestException('File yang diunggah kosong atau rusak.');
    }

    const isXlsx =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    const isXls =
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;

    if (!isXlsx && !isXls) {
      throw new BadRequestException(
        'Format file tidak valid. File harus merupakan spreadsheet Excel (.xlsx atau .xls) asli.',
      );
    }
  }

  /**
   * Menentukan UserRole berdasarkan nama Departemen dan Jabatan
   */
  private determineUserRole(deptName: string, posName: string): string {
    const d = (deptName || '').toLowerCase();
    const p = (posName || '').toLowerCase();
    if (p.includes('direktur') || p.includes('director') || p.includes('owner') || p.includes('komisaris')) {
      return 'owner';
    }
    if (p.includes('manager') || p.includes('kepala') || p.includes('head') || p.includes('lead') || p.includes('supervisor')) {
      return 'manager';
    }
    if (d.includes('hrd') || d.includes('human resource') || d.includes('sdm')) {
      return 'hrd';
    }
    return 'employee';
  }

  /**
   * Membaca file Excel yang diunggah dan memvalidasi serta menyimpan karyawan baru
   */
  async importFromExcel(
    fileBuffer: Buffer,
    options?: { autoCreateAccounts?: boolean },
  ): Promise<EmployeeImportResultDto> {
    const autoCreateAccounts = options?.autoCreateAccounts ?? true;

    // 1. Validasi Magic Bytes untuk menangkal MIME / Extension Spoofing
    this.validateExcelMagicBytes(fileBuffer);

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
    } catch {
      throw new BadRequestException('Format file tidak valid. Pastikan file berupa spreadsheet Excel (.xlsx, .xls).');
    }

    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('File Excel kosong atau tidak memiliki worksheet.');
    }

    const ws = wb.Sheets[sheetName];

    // Deteksi baris header secara dinamis (Mencari baris yang memuat kolom NIK/Nama)
    let rangeHeaderIndex = 0;
    const sheetRef = ws['!ref'];
    if (sheetRef) {
      const range = XLSX.utils.decode_range(sheetRef);
      for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
        const cellA = ws[XLSX.utils.encode_cell({ r, c: 0 })];
        const cellB = ws[XLSX.utils.encode_cell({ r, c: 1 })];
        const valA = cellA ? String(cellA.v).toLowerCase() : '';
        const valB = cellB ? String(cellB.v).toLowerCase() : '';
        if (valA.includes('nik') || valB.includes('nama') || valA.includes('email')) {
          rangeHeaderIndex = r;
          break;
        }
      }
    }

    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, {
      range: rangeHeaderIndex,
      defval: '',
    });

    if (!rawRows || rawRows.length === 0) {
      return {
        totalRows: 0,
        successCount: 0,
        failedCount: 1,
        errors: [{ row: 1, message: 'Tidak ada baris data karyawan ditemukan pada file Excel.' }],
      };
    }

    // 2. Batasan Denial of Service (DoS) / Memory Exhaustion: Maksimal 500 baris per file
    const MAX_IMPORT_ROWS = 500;
    if (rawRows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `File memiliki ${rawRows.length} baris data. Batas maksimal import adalah ${MAX_IMPORT_ROWS} baris per file demi stabilitas server.`,
      );
    }

    // Pre-load reference maps untuk pencocokan cepat O(1)
    const [existingEmployees, existingUsers, departments, positions] = await Promise.all([
      this.prisma.employee.findMany({
        select: { employeeNumber: true, email: true },
      }),
      this.prisma.user.findMany({
        select: { username: true },
      }),
      this.prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.position.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
      }),
    ]);

    const existingNiks = new Set(existingEmployees.map((e) => e.employeeNumber.trim().toLowerCase()));
    const existingEmails = new Set(existingEmployees.map((e) => e.email.trim().toLowerCase()));
    const existingUsernames = new Set(existingUsers.map((u) => u.username.trim().toLowerCase()));

    // Map department by name (lower) and code (lower)
    const deptMap = new Map<string, number>();
    for (const d of departments) {
      deptMap.set(d.name.trim().toLowerCase(), d.id);
      deptMap.set(d.code.trim().toLowerCase(), d.id);
    }

    // Map position by name (lower) and code (lower)
    const posMap = new Map<string, number>();
    for (const p of positions) {
      posMap.set(p.name.trim().toLowerCase(), p.id);
      posMap.set(p.code.trim().toLowerCase(), p.id);
    }

    const seenNiksInFile = new Set<string>();
    const seenEmailsInFile = new Set<string>();

    const validRecords: any[] = [];
    const errors: EmployeeImportErrorItem[] = [];

    const ALLOWED_EMPLOYMENT_TYPES = new Set(['permanent', 'contract', 'internship', 'freelance']);
    const ALLOWED_EMPLOYMENT_STATUSES = new Set(['permanent', 'contract', 'probation', 'resigned', 'terminated']);
    const ALLOWED_PTKP = new Set(['TK0', 'TK1', 'TK2', 'TK3', 'K0', 'K1', 'K2', 'K3']);

    // Helper untuk mencari nilai kolom secara fleksibel berdasarkan nama alias
    const getVal = (row: any, ...aliases: string[]): string => {
      const keys = Object.keys(row);
      for (const alias of aliases) {
        const foundKey = keys.find((k) => k.toLowerCase().includes(alias.toLowerCase()));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    // Helper parsing tanggal Excel
    const parseDateStr = (dateVal: string): string | null => {
      if (!dateVal) return null;
      // Jika angka serial Excel (mis. 45306)
      if (/^\d{5}$/.test(dateVal)) {
        const d = new Date((Number(dateVal) - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      }
      // Format standar YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal;
      }
      // Format DD/MM/YYYY atau DD-MM-YYYY
      const dmy = dateVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) {
        const day = dmy[1].padStart(2, '0');
        const month = dmy[2].padStart(2, '0');
        const year = dmy[3];
        return `${year}-${month}-${day}`;
      }
      return null;
    };

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = rangeHeaderIndex + i + 2; // Baris riil di Excel

      const employeeNumber = getVal(row, 'nik', 'nomor induk');
      const fullName = getVal(row, 'nama lengkap', 'nama');
      const email = getVal(row, 'email');
      const rawJoinDate = getVal(row, 'tanggal bergabung', 'join date');
      const rawType = getVal(row, 'tipe kerja', 'employment type');
      const rawSalary = getVal(row, 'gaji pokok', 'basic salary', 'gaji');

      // Skip baris jika benar-benar kosong
      if (!employeeNumber && !fullName && !email) {
        continue;
      }

      // Validasi 1: NIK
      if (!employeeNumber) {
        errors.push({ row: rowNumber, field: 'NIK', message: 'NIK wajib diisi.' });
        continue;
      }
      if (employeeNumber.length > 20) {
        errors.push({ row: rowNumber, employeeNumber, field: 'NIK', message: 'NIK maksimal 20 karakter.' });
        continue;
      }
      if (!/^[A-Za-z0-9\-_./]+$/.test(employeeNumber)) {
        errors.push({
          row: rowNumber,
          employeeNumber,
          field: 'NIK',
          message: 'NIK hanya boleh memuat huruf, angka, serta karakter - _ . / (tidak boleh memuat spasi atau karakter formula).',
        });
        continue;
      }
      const nikLower = employeeNumber.toLowerCase();
      if (existingNiks.has(nikLower)) {
        errors.push({ row: rowNumber, employeeNumber, field: 'NIK', message: `NIK '${employeeNumber}' sudah terdaftar di database.` });
        continue;
      }
      if (autoCreateAccounts && existingUsernames.has(nikLower)) {
        errors.push({
          row: rowNumber,
          employeeNumber,
          field: 'NIK',
          message: `Username '${employeeNumber}' sudah terdaftar di sistem akun pengguna.`,
        });
        continue;
      }
      if (seenNiksInFile.has(nikLower)) {
        errors.push({ row: rowNumber, employeeNumber, field: 'NIK', message: `NIK '${employeeNumber}' duplikat di dalam file Excel ini.` });
        continue;
      }

      // Validasi 2: Nama Lengkap
      if (!fullName || fullName.length < 3) {
        errors.push({ row: rowNumber, employeeNumber, field: 'Nama Lengkap', message: 'Nama lengkap minimal 3 karakter.' });
        continue;
      }
      if (/^[=+@-]/.test(fullName)) {
        errors.push({
          row: rowNumber,
          employeeNumber,
          field: 'Nama Lengkap',
          message: 'Nama lengkap tidak boleh diawali karakter formula (=, +, -, @).',
        });
        continue;
      }

      // Validasi 3: Email
      if (!email) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Email', message: 'Email wajib diisi.' });
        continue;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Email', message: `Format email '${email}' tidak valid.` });
        continue;
      }
      const emailLower = email.toLowerCase();
      if (existingEmails.has(emailLower)) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Email', message: `Email '${email}' sudah terdaftar di database.` });
        continue;
      }
      if (seenEmailsInFile.has(emailLower)) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Email', message: `Email '${email}' duplikat di dalam file Excel ini.` });
        continue;
      }

      // Validasi 4: Tanggal Bergabung
      const joinDate = parseDateStr(rawJoinDate);
      if (!joinDate) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Tanggal Bergabung', message: 'Tanggal bergabung wajib diisi dengan format YYYY-MM-DD (Contoh: 2024-01-15).' });
        continue;
      }

      // Validasi 5: Tipe Kerja (Prisma: 'permanent' | 'contract' | 'magang')
      let employmentType: 'permanent' | 'contract' | 'magang' = 'permanent';
      const rawTypeLower = rawType.toLowerCase();
      if (['permanent', 'tetap', 'karyawan tetap'].includes(rawTypeLower)) {
        employmentType = 'permanent';
      } else if (['contract', 'kontrak', 'pkwt', 'freelance'].includes(rawTypeLower)) {
        employmentType = 'contract';
      } else if (['magang', 'internship', 'intern', 'pkl'].includes(rawTypeLower)) {
        employmentType = 'magang';
      } else {
        errors.push({
          row: rowNumber,
          employeeNumber,
          fullName,
          field: 'Tipe Kerja',
          message: `Tipe kerja '${rawType}' tidak valid. Pilihan: permanent, contract, magang.`,
        });
        continue;
      }

      // Validasi 6: Gaji Pokok
      const cleanSalaryNum = parseFloat(rawSalary.replace(/[^0-9.]/g, ''));
      if (isNaN(cleanSalaryNum) || cleanSalaryNum < 0) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Gaji Pokok', message: 'Gaji pokok wajib diisi berupa angka positif.' });
        continue;
      }

      // Opsional: Status Kerja (Prisma: 'active' | 'probation' | 'resigned' | 'terminated')
      const rawStatusLower = getVal(row, 'status kerja', 'employment status').toLowerCase();
      let employmentStatus: 'active' | 'probation' | 'resigned' | 'terminated' = 'active';
      if (['active', 'aktif', 'permanent', 'tetap', 'contract', 'kontrak'].includes(rawStatusLower)) {
        employmentStatus = 'active';
      } else if (['probation', 'percobaan', 'masa percobaan'].includes(rawStatusLower)) {
        employmentStatus = 'probation';
      } else if (['resigned', 'resign', 'keluar'].includes(rawStatusLower)) {
        employmentStatus = 'resigned';
      } else if (['terminated', 'phk', 'diberhentikan'].includes(rawStatusLower)) {
        employmentStatus = 'terminated';
      } else if (rawStatusLower) {
        employmentStatus = 'active';
      }

      // Opsional: Status PTKP
      const rawPtkp = getVal(row, 'ptkp', 'status ptkp');
      let ptkpStatus: 'TK0' | 'TK1' | 'TK2' | 'TK3' | 'K0' | 'K1' | 'K2' | 'K3' = 'TK0';
      if (rawPtkp && ALLOWED_PTKP.has(rawPtkp.toUpperCase() as any)) {
        ptkpStatus = rawPtkp.toUpperCase() as any;
      }

      // Opsional: Departemen
      const rawDept = getVal(row, 'departemen', 'department');
      let departmentId: number | null = null;
      if (rawDept) {
        const foundDeptId = deptMap.get(rawDept.toLowerCase());
        if (foundDeptId) {
          departmentId = foundDeptId;
        } else {
          errors.push({
            row: rowNumber,
            employeeNumber,
            fullName,
            field: 'Departemen',
            message: `Departemen '${rawDept}' tidak ditemukan pada sistem. Periksa Sheet Panduan & Referensi.`,
          });
          continue;
        }
      }

      // Opsional: Jabatan
      const rawPos = getVal(row, 'jabatan', 'posisi', 'position');
      let positionId: number | null = null;
      if (rawPos) {
        const foundPosId = posMap.get(rawPos.toLowerCase());
        if (foundPosId) {
          positionId = foundPosId;
        } else {
          errors.push({
            row: rowNumber,
            employeeNumber,
            fullName,
            field: 'Jabatan',
            message: `Jabatan/Posisi '${rawPos}' tidak ditemukan pada sistem. Periksa Sheet Panduan & Referensi.`,
          });
          continue;
        }
      }

      // Opsional: Nomor Telepon
      const phone = getVal(row, 'nomor telepon', 'telepon', 'phone', 'no hp');
      if (phone && !/^(?:\+62|62|0)[0-9\- ]{7,18}$/.test(phone)) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Nomor Telepon', message: `Format nomor telepon '${phone}' tidak valid.` });
        continue;
      }

      // Opsional: Tanggal Lahir
      const rawBirthDate = getVal(row, 'tanggal lahir', 'birth date');
      let birthDate: Date | null = null;
      if (rawBirthDate) {
        const parsedBirth = parseDateStr(rawBirthDate);
        if (parsedBirth) {
          const bDate = new Date(parsedBirth);
          if (bDate > new Date()) {
            errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Tanggal Lahir', message: 'Tanggal lahir tidak boleh di masa depan.' });
            continue;
          }
          birthDate = bDate;
        }
      }

      // Opsional: KTP
      const idCardNumber = getVal(row, 'ktp', 'nomor ktp');
      if (idCardNumber && !/^\d{16}$/.test(idCardNumber)) {
        errors.push({ row: rowNumber, employeeNumber, fullName, field: 'Nomor KTP', message: `Nomor KTP harus 16 digit angka.` });
        continue;
      }

      // Data tambahan
      const taxNumber = getVal(row, 'npwp') || null;
      const address = getVal(row, 'alamat') || null;
      const bankName = getVal(row, 'nama bank', 'bank') || null;
      const bankAccountNumber = getVal(row, 'nomor rekening', 'no rekening', 'rekening') || null;
      const bankAccountName = getVal(row, 'nama pemilik rekening', 'pemilik rekening') || fullName;

      // Catat sebagai terpakai
      seenNiksInFile.add(nikLower);
      seenEmailsInFile.add(emailLower);

      validRecords.push({
        employeeNumber,
        fullName,
        email,
        phone: phone || null,
        birthDate,
        joinDate: new Date(joinDate),
        employmentStatus,
        employmentType,
        ptkpStatus,
        basicSalary: String(cleanSalaryNum),
        departmentId,
        positionId,
        idCardNumber: idCardNumber || null,
        taxNumber,
        address,
        bankName,
        bankAccountNumber,
        bankAccountName,
      });
    }

    // MODEL ATOMIC TRANSACTION / ALL-OR-NOTHING:
    // Jika terdapat minimal 1 error validasi, batalkan seluruh penyimpanan data (Rollback)!
    if (errors.length > 0) {
      return {
        totalRows: rawRows.length,
        successCount: 0,
        failedCount: errors.length,
        errors,
      };
    }

    // Jika file tidak memiliki baris data karyawan yang valid
    if (validRecords.length === 0) {
      return {
        totalRows: rawRows.length,
        successCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    // Seluruh baris 100% lolos validasi -> eksekusi dalam satu transaksi atomik database
    try {
      const defaultPasswordHash = autoCreateAccounts
        ? await bcrypt.hash('Gasela123!', 10)
        : '';

      await this.prisma.$transaction(async (tx) => {
        for (const record of validRecords) {
          const created = await tx.employee.create({ data: record });
          if (autoCreateAccounts) {
            const dept = departments.find((d) => d.id === record.departmentId);
            const pos = positions.find((p) => p.id === record.positionId);
            const role = this.determineUserRole(dept?.name || '', pos?.name || '');
            await tx.user.create({
              data: {
                employeeId: created.id,
                username: record.employeeNumber,
                passwordHash: defaultPasswordHash,
                role: role as any,
                mustChangePassword: true,
                passwordChangedAt: null,
              },
            });
          }
        }
      });
    } catch (err: any) {
      throw new BadRequestException(
        `Gagal menyimpan data ke database (Transaksi dibatalkan otomatis / Rollback): ${err?.message || 'Kesalahan database'}`,
      );
    }

    return {
      totalRows: rawRows.length,
      successCount: validRecords.length,
      failedCount: 0,
      errors: [],
    };
  }
}
