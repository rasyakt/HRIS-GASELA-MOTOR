import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AttendanceReportQuery,
  LeaveReportQuery,
  PayrollReportQuery,
} from './dto/report-query.dto';

export interface CsvOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private escapeCell(v: string | number | null | undefined): string {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n;]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private toCsv({ filename, headers, rows }: CsvOptions): {
    filename: string;
    content: string;
  } {
    const lines = [
      headers.map((h) => this.escapeCell(h)).join(';'),
      ...rows.map((r) => r.map((c) => this.escapeCell(c)).join(';')),
    ];
    return { filename, content: '\uFEFF' + lines.join('\r\n') + '\r\n' };
  }

  async attendanceReport(
    params: AttendanceReportQuery,
  ): Promise<{ filename: string; content: string }> {
    const from = new Date(`${params.from}T00:00:00Z`);
    const to = new Date(`${params.to}T00:00:00Z`);
    to.setUTCDate(to.getUTCDate() + 1);

    const records = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: { gte: from, lt: to },
        employee: params.departmentId
          ? { departmentId: params.departmentId }
          : undefined,
      },
      include: {
        employee: { include: { department: true, position: true } },
        shift: true,
      },
      orderBy: [{ attendanceDate: 'asc' }, { employeeId: 'asc' }],
    });

    return this.toCsv({
      filename: `attendance_${params.from}_to_${params.to}.csv`,
      headers: [
        'Tanggal',
        'NIK',
        'Nama',
        'Departemen',
        'Posisi',
        'Shift',
        'Masuk',
        'Keluar',
        'Status',
        'Terlambat (menit)',
        'Pulang Cepat (menit)',
        'Jam Kerja',
        'Catatan',
      ],
      rows: records.map((a) => [
        a.attendanceDate.toISOString().slice(0, 10),
        a.employee.employeeNumber,
        a.employee.fullName,
        a.employee.department?.name ?? '',
        a.employee.position?.name ?? '',
        a.shift?.name ?? '',
        a.checkInTime ? this.formatTime(a.checkInTime) : '',
        a.checkOutTime ? this.formatTime(a.checkOutTime) : '',
        this.statusLabel(a.status),
        a.lateMinutes,
        a.earlyLeaveMinutes,
        Number(a.workHours).toFixed(2),
        a.notes ?? '',
      ]),
    });
  }

  async leaveReport(
    params: LeaveReportQuery,
  ): Promise<{ filename: string; content: string }> {
    const from = new Date(`${params.from}T00:00:00Z`);
    const to = new Date(`${params.to}T00:00:00Z`);
    to.setUTCDate(to.getUTCDate() + 1);

    const records = await this.prisma.leaveRequest.findMany({
      where: {
        startDate: { gte: from, lt: to },
        status: params.status
          ? (params.status as Prisma.LeaveRequestWhereInput['status'])
          : undefined,
      },
      include: {
        employee: { include: { department: true } },
        leaveType: true,
        approvedBy: true,
      },
      orderBy: [{ startDate: 'asc' }, { employeeId: 'asc' }],
    });

    return this.toCsv({
      filename: `leave_${params.from}_to_${params.to}.csv`,
      headers: [
        'No. Pengajuan',
        'NIK',
        'Nama',
        'Departemen',
        'Tipe Cuti',
        'Mulai',
        'Selesai',
        'Jumlah Hari',
        'Alasan',
        'Status',
        'Disetujui Oleh',
        'Tanggal Setuju',
      ],
      rows: records.map((l) => [
        l.requestNumber,
        l.employee.employeeNumber,
        l.employee.fullName,
        l.employee.department?.name ?? '',
        l.leaveType.name,
        l.startDate.toISOString().slice(0, 10),
        l.endDate.toISOString().slice(0, 10),
        l.totalDays,
        l.reason ?? '',
        this.statusLabel(l.status),
        l.approvedBy?.fullName ?? '',
        l.approvedAt ? new Date(l.approvedAt).toISOString().slice(0, 10) : '',
      ]),
    });
  }

  async payrollReport(
    params: PayrollReportQuery,
  ): Promise<{ filename: string; content: string }> {
    const records = await this.prisma.payroll.findMany({
      where: {
        month: params.month,
        year: params.year,
        status: params.status
          ? (params.status as Prisma.PayrollWhereInput['status'])
          : undefined,
      },
      include: {
        employee: { include: { department: true, position: true } },
      },
      orderBy: [{ employeeId: 'asc' }],
    });

    return this.toCsv({
      filename: `payroll_${params.year}-${String(params.month).padStart(2, '0')}.csv`,
      headers: [
        'No. Payroll',
        'NIK',
        'Nama',
        'Departemen',
        'Posisi',
        'Gaji Pokok',
        'Tunjangan',
        'Lembur',
        'Potongan',
        'BPJS Kesehatan',
        'BPJS Ketenagakerjaan',
        'PPh 21',
        'Gaji Kotor',
        'Gaji Bersih',
        'Status',
        'Tanggal Bayar',
      ],
      rows: records.map((p) => [
        p.payrollNumber,
        p.employee.employeeNumber,
        p.employee.fullName,
        p.employee.department?.name ?? '',
        p.employee.position?.name ?? '',
        this.rp(p.basicSalary),
        this.rp(p.totalAllowance),
        this.rp(p.overtimePay),
        this.rp(p.totalDeduction),
        this.rp(p.bpjsKesehatanEmployee),
        this.rp(p.bpjsKetenagakerjaanEmployee),
        this.rp(p.taxPph21),
        this.rp(p.grossSalary),
        this.rp(p.netSalary),
        this.statusLabel(p.status),
        p.paymentDate ? p.paymentDate.toISOString().slice(0, 10) : '',
      ]),
    });
  }

  private rp(v: Prisma.Decimal | number): string {
    return Number(v).toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  private formatTime(t: Date): string {
    return t.toISOString().slice(11, 16);
  }

  private statusLabel(s: string): string {
    const map: Record<string, string> = {
      present: 'Hadir',
      absent: 'Absen',
      late: 'Terlambat',
      on_leave: 'Cuti',
      approved: 'Disetujui',
      pending: 'Menunggu',
      rejected: 'Ditolak',
      cancelled: 'Dibatalkan',
      draft: 'Draf',
      paid: 'Dibayar',
    };
    return map[s] ?? s;
  }
}
