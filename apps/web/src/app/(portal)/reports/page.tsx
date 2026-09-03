'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileDown,
  FileSpreadsheet,
  Filter,
  Loader2,
  MapPin,
  Printer,
  ReceiptText,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PositiveNumberInput } from '@/components/ui/positive-number-input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import {
  badgeClass,
  fmtDate,
  fmtTime,
  fmtRupiah,
  statusLabel,
  todayInput,
  roleAtLeast,
} from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

interface DepartmentItem {
  id: number;
  name: string;
}

type TabKey = 'attendance' | 'leave' | 'payroll';

// ─── Reusable components ───────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon: Icon,
  accent = 'zinc',
}: {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'zinc' | 'green' | 'amber' | 'red' | 'blue';
}) {
  const accents: Record<string, string> = {
    zinc: 'text-zinc-900 bg-zinc-50 dark:text-zinc-100 dark:bg-zinc-800',
    green: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50',
    amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50',
    red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50',
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
      <div className={`inline-flex items-center justify-center rounded-lg p-2 ${accents[accent]}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">{value}</p>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-3">
        <BarChart3 className="size-5 text-zinc-400" />
      </div>
      <p className="text-sm text-zinc-400 font-medium">{message}</p>
    </div>
  );
}

// ─── TABS CONFIG ───────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'attendance', label: 'Kehadiran', icon: Clock },
  { key: 'leave', label: 'Cuti', icon: CalendarDays },
  { key: 'payroll', label: 'Penggajian', icon: ReceiptText },
];

// ─── FILTER PANELS ─────────────────────────────────────────────────────────────

const SELECT_CLS =
  'w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 focus:border-transparent transition-shadow';

function AttendanceFilters({
  attFrom, setAttFrom,
  attTo, setAttTo,
  attDept, setAttDept,
  departments,
}: {
  attFrom: string; setAttFrom: (v: string) => void;
  attTo: string; setAttTo: (v: string) => void;
  attDept: string; setAttDept: (v: string) => void;
  departments: DepartmentItem[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="att-from" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Dari Tanggal</Label>
        <Input id="att-from" type="date" value={attFrom} onChange={(e) => setAttFrom(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="att-to" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Sampai Tanggal</Label>
        <Input id="att-to" type="date" value={attTo} onChange={(e) => setAttTo(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="att-dept" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Departemen</Label>
        <select id="att-dept" value={attDept} onChange={(e) => setAttDept(e.target.value)} className={`mt-1.5 ${SELECT_CLS}`}>
          <option value="">Semua Departemen</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function LeaveFilters({
  leaveFrom, setLeaveFrom,
  leaveTo, setLeaveTo,
  leaveStatus, setLeaveStatus,
}: {
  leaveFrom: string; setLeaveFrom: (v: string) => void;
  leaveTo: string; setLeaveTo: (v: string) => void;
  leaveStatus: string; setLeaveStatus: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="leave-from" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Dari Tanggal</Label>
        <Input id="leave-from" type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="leave-to" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Sampai Tanggal</Label>
        <Input id="leave-to" type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="leave-status" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Status</Label>
        <select id="leave-status" value={leaveStatus} onChange={(e) => setLeaveStatus(e.target.value)} className={`mt-1.5 ${SELECT_CLS}`}>
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>
    </div>
  );
}

function PayrollFilters({
  payMonth, setPayMonth,
  payYear, setPayYear,
  payStatus, setPayStatus,
}: {
  payMonth: string; setPayMonth: (v: string) => void;
  payYear: string; setPayYear: (v: string) => void;
  payStatus: string; setPayStatus: (v: string) => void;
}) {
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="pay-month" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Bulan</Label>
        <select id="pay-month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} className={`mt-1.5 ${SELECT_CLS}`}>
          {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="pay-year" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Tahun</Label>
        <PositiveNumberInput
          id="pay-year"
          min={2000}
          max={2100}
          value={payYear}
          onChangeValue={(num, raw) => setPayYear(raw)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="pay-status" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Status</Label>
        <select id="pay-status" value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className={`mt-1.5 ${SELECT_CLS}`}>
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Disetujui</option>
          <option value="paid">Dibayar</option>
        </select>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [activeTab, setActiveTab] = useState<TabKey>('attendance');
  const [mounted, setMounted] = useState(false);

  const [attFrom, setAttFrom] = useState(todayInput(-30));
  const [attTo, setAttTo] = useState(todayInput());
  const [attDept, setAttDept] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(todayInput(-30));
  const [leaveTo, setLeaveTo] = useState(todayInput(30));
  const [leaveStatus, setLeaveStatus] = useState('');
  const now = new Date();
  const [payMonth, setPayMonth] = useState(String(now.getMonth() + 1));
  const [payYear, setPayYear] = useState(String(now.getFullYear()));
  const [payStatus, setPayStatus] = useState('');

  const [downloading, setDownloading] = useState<string | null>(null);
  const [csvMsg, setCsvMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo & PDF Preview Modal States
  const [viewPhotoUrl, setViewPhotoUrl] = useState<{ url: string; title: string } | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewKind, setPdfPreviewKind] = useState<TabKey>('attendance');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const canManage = !!user && (roleAtLeast(user.role, 'manager') || user.role === 'owner');
  const canPayroll = !!user && (roleAtLeast(user.role, 'hrd') || user.role === 'owner');
  const visibleTabs = TABS.filter((t) => t.key !== 'payroll' || canPayroll);

  useEffect(() => {
    setMounted(true);
    if (user && !canManage) router.replace('/dashboard');
  }, [user, canManage, router]);

  const deptQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => authApi<DepartmentItem[]>('/api/departments'),
    enabled: canManage,
  });

  const attQ = useQuery({
    queryKey: ['report-att-preview', attFrom, attTo, attDept],
    queryFn: () => authApi<any[]>(`/api/reports/attendance/preview?from=${attFrom}&to=${attTo}${attDept ? `&departmentId=${attDept}` : ''}`),
    enabled: activeTab === 'attendance' && !!attFrom && !!attTo && canManage,
  });

  const leaveQ = useQuery({
    queryKey: ['report-leave-preview', leaveFrom, leaveTo, leaveStatus],
    queryFn: () => authApi<any[]>(`/api/reports/leave/preview?from=${leaveFrom}&to=${leaveTo}${leaveStatus ? `&status=${leaveStatus}` : ''}`),
    enabled: activeTab === 'leave' && !!leaveFrom && !!leaveTo && canManage,
  });

  const payQ = useQuery({
    queryKey: ['report-pay-preview', payMonth, payYear, payStatus],
    queryFn: () => authApi<any[]>(`/api/reports/payroll/preview?month=${payMonth}&year=${payYear}${payStatus ? `&status=${payStatus}` : ''}`),
    enabled: activeTab === 'payroll' && !!payMonth && !!payYear && canPayroll,
  });

  async function downloadCsv(kind: TabKey) {
    const params = new URLSearchParams();
    if (kind === 'attendance') {
      params.set('from', attFrom); params.set('to', attTo);
      if (attDept) params.set('departmentId', attDept);
    } else if (kind === 'leave') {
      params.set('from', leaveFrom); params.set('to', leaveTo);
      if (leaveStatus) params.set('status', leaveStatus);
    } else {
      params.set('month', payMonth); params.set('year', payYear);
      if (payStatus) params.set('status', payStatus);
    }
    setDownloading(kind);
    setCsvMsg(null);
    try {
      const res = await fetch(`/api/reports/${kind}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || `Gagal (${res.status})`);
      }
      const disp = res.headers.get('Content-Disposition') ?? '';
      const filename = disp.match(/filename="?([^";]+)"?/)?.[1] ?? `${kind}.csv`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setCsvMsg({ type: 'success', text: `"${filename}" berhasil diunduh.` });
    } catch (e: any) {
      setCsvMsg({ type: 'error', text: e.message || 'Gagal mengunduh laporan.' });
    } finally {
      setDownloading(null);
    }
  }

  function getReportContentHtml(kind: TabKey) {
    const titleMap: Record<TabKey, string> = {
      attendance: 'LAPORAN REKAPITULASI KEHADIRAN KARYAWAN',
      leave: 'LAPORAN REKAPITULASI CUTI KARYAWAN',
      payroll: 'LAPORAN REKAPITULASI PENGGAJIAN KARYAWAN',
    };

    const periodStr =
      kind === 'attendance'
        ? `${fmtDate(attFrom)} s/d ${fmtDate(attTo)}`
        : kind === 'leave'
        ? `${fmtDate(leaveFrom)} s/d ${fmtDate(leaveTo)}`
        : `Bulan ${payMonth} Tahun ${payYear}`;

    let rowsHtml = '';
    if (kind === 'attendance') {
      rowsHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th>Tanggal</th>
              <th>NIK</th>
              <th>Nama Karyawan</th>
              <th>Departemen</th>
              <th>Shift</th>
              <th>Masuk / Keluar</th>
              <th style="text-align: center; width: 85px;">Foto Presensi</th>
              <th>Status</th>
              <th>Terlambat</th>
              <th>Jam Kerja</th>
            </tr>
          </thead>
          <tbody>
            ${attRecs.length === 0 ? `<tr><td colspan="11" style="text-align:center; padding: 24px; color: #94a3b8;">Tidak ada data kehadiran pada periode ini.</td></tr>` : ''}
            ${attRecs.map((r: any, i: number) => `
              <tr>
                <td style="color: #64748b;">${i + 1}</td>
                <td>${fmtDate(r.attendanceDate)}</td>
                <td>${r.employee?.employeeNumber ?? '-'}</td>
                <td><strong>${r.employee?.fullName ?? '-'}</strong></td>
                <td>${r.employee?.department?.name ?? '-'}</td>
                <td>${r.shift?.name ?? '-'}</td>
                <td style="font-family: monospace;">${r.checkInTime ? fmtTime(r.checkInTime) : '-'} / ${r.checkOutTime ? fmtTime(r.checkOutTime) : '-'}</td>
                <td style="text-align: center;">
                  <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
                    ${r.checkInPhotoUrl ? `<div style="text-align: center;"><img src="${r.checkInPhotoUrl}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid #10b981;" /><div style="font-size: 7.5px; color: #059669; font-weight: bold; margin-top: 1px;">MASUK</div></div>` : ''}
                    ${r.checkOutPhotoUrl ? `<div style="text-align: center;"><img src="${r.checkOutPhotoUrl}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid #0284c7;" /><div style="font-size: 7.5px; color: #0284c7; font-weight: bold; margin-top: 1px;">KELUAR</div></div>` : ''}
                    ${!r.checkInPhotoUrl && !r.checkOutPhotoUrl ? `<span style="color: #94a3b8;">—</span>` : ''}
                  </div>
                </td>
                <td><span style="font-weight: 600;">${statusLabel(r.status)}</span></td>
                <td>${r.lateMinutes ? `${r.lateMinutes} mnt` : '-'}</td>
                <td>${r.workHours ? `${r.workHours} jam` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (kind === 'leave') {
      rowsHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th>NIK</th>
              <th>Nama Karyawan</th>
              <th>Jenis Cuti</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Selesai</th>
              <th>Total Hari</th>
              <th>Status</th>
              <th>Alasan</th>
            </tr>
          </thead>
          <tbody>
            ${leaveRecs.length === 0 ? `<tr><td colspan="9" style="text-align:center; padding: 24px; color: #94a3b8;">Tidak ada data cuti pada periode ini.</td></tr>` : ''}
            ${leaveRecs.map((r: any, i: number) => `
              <tr>
                <td style="color: #64748b;">${i + 1}</td>
                <td>${r.employee?.employeeNumber ?? '-'}</td>
                <td><strong>${r.employee?.fullName ?? '-'}</strong></td>
                <td>${r.leaveType?.name ?? '-'}</td>
                <td>${fmtDate(r.startDate)}</td>
                <td>${fmtDate(r.endDate)}</td>
                <td>${r.totalDays} Hari</td>
                <td>${r.status}</td>
                <td>${r.reason ?? '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      rowsHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th>No. Slip</th>
              <th>NIK</th>
              <th>Nama Karyawan</th>
              <th>Departemen</th>
              <th>Gaji Pokok</th>
              <th>Total Potongan</th>
              <th>Gaji Bersih (THP)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${payRecs.length === 0 ? `<tr><td colspan="9" style="text-align:center; padding: 24px; color: #94a3b8;">Tidak ada data penggajian pada periode ini.</td></tr>` : ''}
            ${payRecs.map((r: any, i: number) => `
              <tr>
                <td style="color: #64748b;">${i + 1}</td>
                <td>${r.payrollNumber}</td>
                <td>${r.employeeNumber ?? '-'}</td>
                <td><strong>${r.employeeName ?? '-'}</strong></td>
                <td>${r.department ?? '-'}</td>
                <td>${fmtRupiah(r.basicSalary)}</td>
                <td style="color:#dc2626">- ${fmtRupiah(r.totalAllDeductions ?? 0)}</td>
                <td><strong>${fmtRupiah(r.netSalary)}</strong></td>
                <td>${r.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    return {
      title: titleMap[kind],
      periodStr,
      rowsHtml,
    };
  }

  function printDocument(kind: TabKey) {
    const { title, periodStr, rowsHtml } = getReportContentHtml(kind);
    const printWindow = window.open('', '_blank', 'width=1050,height=850');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan - ${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #0f172a; font-size: 11px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .company { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
          .title { font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; margin-top: 2px; }
          .sub { color: #64748b; font-size: 11px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10px; }
          th { background: #f8fafc; color: #475569; text-align: left; padding: 8px 6px; font-weight: 700; border-bottom: 1.5px solid #cbd5e1; text-transform: uppercase; font-size: 9.5px; }
          td { padding: 6px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; page-break-inside: avoid; }
          .sign { text-align: center; margin-top: 20px; min-width: 180px; }
          @media print {
            body { padding: 0; }
            @page { margin: 10mm; size: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">PT GASELA MOTOR</div>
            <div class="title">${title}</div>
            <div class="sub">Periode: <strong>${periodStr}</strong></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: #64748b;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Sistem HRIS GaselaPulse</div>
          </div>
        </div>

        ${rowsHtml}

        <div class="footer">
          <div>GaselaPulse HRIS System — Laporan Resmi</div>
          <div class="sign">
            <p>Disetujui Oleh,</p>
            <br/><br/><br/>
            <p>__________________________</p>
            <p><strong>Manager HRD / Finance</strong></p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function downloadDirectPdf(kind: TabKey) {
    const reportElement = document.getElementById('report-paper-container');
    if (!reportElement) {
      printDocument(kind);
      return;
    }

    setDownloadingPdf(true);
    try {
      // Ensure html2pdf is loaded from local bundle or fallback CDN
      if (typeof window !== 'undefined' && !(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '/libs/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => {
            const fallbackScript = document.createElement('script');
            fallbackScript.src =
              'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            fallbackScript.onload = () => resolve();
            fallbackScript.onerror = () =>
              reject(new Error('Gagal memuat generator PDF'));
            document.head.appendChild(fallbackScript);
          };
          document.head.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        printDocument(kind);
        return;
      }

      const { title, periodStr } = getReportContentHtml(kind);
      const safePeriod = periodStr
        .replace(/\s+/g, '_')
        .replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `${title.replace(/\s+/g, '_')}_${safePeriod}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(reportElement).save();
    } catch {
      // Fallback to print if conversion fails
      printDocument(kind);
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (!user || !canManage) return null;

  // ── Attendance metrics ──
  const attRecs = attQ.data ?? [];
  const attTotal = attRecs.length;
  const attPresent = attRecs.filter((r) => r.status === 'present').length;
  const attLate = attRecs.filter((r) => r.status === 'late').length;
  const attAbsent = attRecs.filter((r) => r.status === 'absent').length;
  const attOnLeave = attRecs.filter((r) => r.status === 'on_leave').length;
  const attRate = attTotal > 0 ? Math.round(((attPresent + attLate) / attTotal) * 100) : 0;
  const totalLateMin = attRecs.reduce((s, r) => s + (Number(r.lateMinutes) || 0), 0);
  const validHrs = attRecs.filter((r) => r.workHours);
  const avgWH = validHrs.length > 0 ? (validHrs.reduce((s, r) => s + Number(r.workHours), 0) / validHrs.length).toFixed(1) : '0.0';
  const attPieData = [
    { name: 'Tepat Waktu', value: attPresent, color: '#10b981' },
    { name: 'Terlambat', value: attLate, color: '#f59e0b' },
    { name: 'Cuti / Izin', value: attOnLeave, color: '#3b82f6' },
    { name: 'Absen', value: attAbsent, color: '#ef4444' },
  ].filter((x) => x.value > 0);

  // ── Leave metrics ──
  const leaveRecs = leaveQ.data ?? [];
  const leaveTotal = leaveRecs.length;
  const leaveApproved = leaveRecs.filter((r) => r.status === 'approved').length;
  const leavePending = leaveRecs.filter((r) => r.status === 'pending').length;
  const leaveDays = leaveRecs.reduce((s, r) => s + (Number(r.totalDays) || 0), 0);
  const leaveTypeCnt: Record<string, number> = {};
  leaveRecs.forEach((r) => {
    const n = r.leaveType?.name || 'Lainnya';
    leaveTypeCnt[n] = (leaveTypeCnt[n] || 0) + 1;
  });
  const leaveBarData = Object.entries(leaveTypeCnt).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // ── Payroll metrics ──
  const payRecs = payQ.data ?? [];
  const payTotal = payRecs.reduce((s, r) => s + Number(r.netSalary || 0), 0);
  const payDeductions = payRecs.reduce((s, r) => s + Number(r.totalAllDeductions || 0), 0);
  const payAvg = payRecs.length > 0 ? payTotal / payRecs.length : 0;
  const payPaidCnt = payRecs.filter((r) => r.status === 'paid').length;
  const deptPay: Record<string, number> = {};
  payRecs.forEach((r) => {
    const n = r.employee?.department?.name || 'Lainnya';
    deptPay[n] = (deptPay[n] || 0) + Number(r.netSalary || 0);
  });
  const payBarData = Object.entries(deptPay).map(([name, value]) => ({ name, value }));

  const activeQ = activeTab === 'attendance' ? attQ : activeTab === 'leave' ? leaveQ : payQ;
  const isLoading = activeQ.isLoading;
  const hasData = !!activeQ.data;

  return (
    <div className="mx-auto max-w-6xl space-y-0">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Laporan &amp; Analitik</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Tinjau visualisasi data sebelum mengekspor ke CSV/Excel.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
          <FileSpreadsheet className="size-3.5 text-emerald-500" />
          Format ekspor: CSV (UTF-8) · Kompatibel Excel &amp; Google Sheets
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {csvMsg && (
        <div className={`mb-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
          csvMsg.type === 'success'
            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
        }`}>
          {csvMsg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          {csvMsg.text}
          <button onClick={() => setCsvMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity text-xs">✕</button>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCsvMsg(null); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
                active
                  ? 'border-primary text-primary font-bold dark:border-primary dark:text-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-primary' : 'text-zinc-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── FILTER BAR (horizontal, full-width) ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 mb-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2">
              <Filter className="size-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Filter</span>
          </div>

          <div className="flex-1">
            {activeTab === 'attendance' && (
              <AttendanceFilters
                attFrom={attFrom} setAttFrom={setAttFrom}
                attTo={attTo} setAttTo={setAttTo}
                attDept={attDept} setAttDept={setAttDept}
                departments={deptQuery.data ?? []}
              />
            )}
            {activeTab === 'leave' && (
              <LeaveFilters
                leaveFrom={leaveFrom} setLeaveFrom={setLeaveFrom}
                leaveTo={leaveTo} setLeaveTo={setLeaveTo}
                leaveStatus={leaveStatus} setLeaveStatus={setLeaveStatus}
              />
            )}
            {activeTab === 'payroll' && (
              <PayrollFilters
                payMonth={payMonth} setPayMonth={setPayMonth}
                payYear={payYear} setPayYear={setPayYear}
                payStatus={payStatus} setPayStatus={setPayStatus}
              />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              className="border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 font-semibold text-xs gap-1.5 px-4 py-2.5 h-auto shadow-2xs"
              onClick={() => {
                setPdfPreviewKind(activeTab);
                setPdfPreviewOpen(true);
              }}
            >
              <Eye className="size-3.5 text-red-600 dark:text-red-400 shrink-0" />
              <span>Pratinjau &amp; Cetak PDF</span>
            </Button>
            <Button
              className="text-xs font-semibold gap-1.5 px-4 py-2.5 h-auto shadow-2xs"
              disabled={downloading !== null}
              onClick={() => downloadCsv(activeTab)}
            >
              {downloading === activeTab ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-3.5" />
              )}
              <span>Ekspor CSV / Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Memuat data laporan…</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ATTENDANCE REVIEW DASHBOARD
          ═══════════════════════════════════════════════ */}
      {activeTab === 'attendance' && !attQ.isLoading && (
        <div className="space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={attTotal} label="Total Record Kehadiran" icon={Users} />
            <StatCard value={`${attRate}%`} label="Tingkat Kehadiran" icon={TrendingUp} accent="green" />
            <StatCard value={`${totalLateMin} mnt`} label="Akumulasi Keterlambatan" icon={Clock} accent="amber" />
            <StatCard value={`${avgWH} jam`} label="Rata-rata Jam Kerja" icon={SlidersHorizontal} accent="blue" />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-5">

            {/* Donut Chart (3 cols) */}
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs">
              <SectionHeader title="Sebaran Status Kehadiran" subtitle="Persentase status dari seluruh record" />
              {attPieData.length === 0 ? (
                <EmptyState message="Tidak ada data untuk ditampilkan." />
              ) : (
                <div className="mt-5 flex flex-col sm:flex-row items-center gap-6 min-h-50">
                  {mounted && (
                    <div className="relative size-44 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={attPieData}
                            cx="50%" cy="50%"
                            innerRadius={58} outerRadius={78}
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {attPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{attTotal}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">Record</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2">
                    {attPieData.map((item) => {
                      const pct = Math.round((item.value / attTotal) * 100);
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-zinc-600 dark:text-zinc-300 flex-1">{item.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-20 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                            </div>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Discipline Metrics (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs">
              <SectionHeader title="Ringkasan Kedisiplinan" subtitle="Rincian berdasarkan kategori status" />
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Tepat Waktu', value: attPresent, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' },
                  { label: 'Terlambat', value: attLate, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60' },
                  { label: 'Cuti / Izin Resmi', value: attOnLeave, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' },
                  { label: 'Mangkir / Absen', value: attAbsent, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-zinc-50 dark:border-zinc-850/80 last:border-0">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{item.label}</span>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${item.color}`}>{item.value} hari</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <SectionHeader title="Detail Data Kehadiran" subtitle={`Menampilkan ${Math.min(15, attTotal)} dari ${attTotal} record`} />
              {attTotal > 15 && (
                <span className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1">
                  +{attTotal - 15} record lagi tersedia via CSV
                </span>
              )}
            </div>
            {attTotal === 0 ? (
              <EmptyState message="Tidak ada data kehadiran yang sesuai filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-left">
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Karyawan</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Departemen</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">Shift</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Masuk / Keluar</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center whitespace-nowrap">Foto Wajah</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Lokasi GPS</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right whitespace-nowrap">Terlambat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850/80">
                    {attRecs.slice(0, 15).map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="px-3.5 py-2.5 text-xs md:text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{fmtDate(r.attendanceDate)}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs md:text-sm whitespace-nowrap">{r.employee?.fullName}</div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">{r.employee?.employeeNumber}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 hidden md:table-cell whitespace-nowrap">{r.employee?.department?.name ?? '—'}</td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 hidden lg:table-cell whitespace-nowrap">{r.shift?.name ?? '—'}</td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-mono">
                          {r.checkInTime ? fmtTime(r.checkInTime) : '—'}&nbsp;/&nbsp;{r.checkOutTime ? fmtTime(r.checkOutTime) : '—'}
                        </td>
                        {/* Foto Wajah Presensi Thumbnail */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {r.checkInPhotoUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewPhotoUrl({
                                    url: r.checkInPhotoUrl,
                                    title: `Foto Check-in: ${r.employee?.fullName ?? ''} (${fmtDate(r.attendanceDate)})`,
                                  })
                                }
                                title="Lihat Foto Wajah Check-in"
                                className="group relative size-8 rounded-lg overflow-hidden border border-emerald-500/60 hover:scale-105 transition-transform shadow-xs"
                              >
                                <img src={r.checkInPhotoUrl} alt="Masuk" className="size-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="size-3 text-white" />
                                </div>
                              </button>
                            ) : null}
                            {r.checkOutPhotoUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewPhotoUrl({
                                    url: r.checkOutPhotoUrl,
                                    title: `Foto Check-out: ${r.employee?.fullName ?? ''} (${fmtDate(r.attendanceDate)})`,
                                  })
                                }
                                title="Lihat Foto Wajah Check-out"
                                className="group relative size-8 rounded-lg overflow-hidden border border-sky-500/60 hover:scale-110 transition-transform shadow-xs"
                              >
                                <img src={r.checkOutPhotoUrl} alt="Keluar" className="size-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="size-3 text-white" />
                                </div>
                              </button>
                            ) : null}
                            {!r.checkInPhotoUrl && !r.checkOutPhotoUrl && (
                              <span className="text-xs text-zinc-400 font-mono">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {r.checkInLat && r.checkInLng ? (
                            <a
                              href={`https://www.google.com/maps?q=${r.checkInLat},${r.checkInLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/50 px-2 py-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs whitespace-nowrap"
                              title="Buka lokasi persis check-in di Google Maps"
                            >
                              <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{Number(r.checkInLat).toFixed(4)}, {Number(r.checkInLng).toFixed(4)}</span>
                              <ExternalLink className="size-2.5 text-emerald-500 ml-0.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          {Number(r.lateMinutes) > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold text-xs whitespace-nowrap">{r.lateMinutes} mnt</span>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600 text-xs whitespace-nowrap">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          LEAVE REVIEW DASHBOARD
          ═══════════════════════════════════════════════ */}
      {activeTab === 'leave' && !leaveQ.isLoading && (
        <div className="space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={leaveTotal} label="Total Pengajuan Cuti" icon={CalendarDays} />
            <StatCard value={leaveApproved} label="Disetujui" icon={TrendingUp} accent="green" />
            <StatCard value={leavePending} label="Menunggu Persetujuan" icon={Clock} accent="amber" />
            <StatCard value={`${leaveDays} Hari`} label="Total Hari Cuti Diambil" icon={SlidersHorizontal} accent="blue" />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-5">

            {/* Bar Chart (3 cols) */}
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs">
              <SectionHeader title="Frekuensi per Jenis Cuti" subtitle="Jumlah pengajuan berdasarkan tipe" />
              {leaveBarData.length === 0 ? (
                <EmptyState message="Tidak ada data jenis cuti untuk ditampilkan." />
              ) : (
                <div className="mt-5 h-52 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={leaveBarData} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: '#27272a', opacity: 0.3 }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {payload[0].value} Pengajuan
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* Alasan Teratas (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs">
              <SectionHeader title="Riwayat Pengajuan Terbaru" subtitle="5 pengajuan terkini" />
              <div className="mt-4 space-y-3 max-h-56 overflow-y-auto">
                {leaveRecs.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-50 dark:border-zinc-850/80 last:border-0">
                    <div className="flex size-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                      {r.employee?.fullName?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{r.employee?.fullName}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{r.leaveType?.name} · {r.totalDays} hari</div>
                    </div>
                    <span className={`ml-auto shrink-0 ${badgeClass(r.status)}`}>{statusLabel(r.status)}</span>
                  </div>
                ))}
                {leaveRecs.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">Tidak ada pengajuan.</p>}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <SectionHeader title="Detail Data Cuti" subtitle={`Menampilkan ${Math.min(15, leaveTotal)} dari ${leaveTotal} record`} />
              {leaveTotal > 15 && (
                <span className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1">
                  +{leaveTotal - 15} record lagi via CSV
                </span>
              )}
            </div>
            {leaveTotal === 0 ? (
              <EmptyState message="Tidak ada data cuti yang sesuai filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-left">
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">No. Pengajuan</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Karyawan</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Jenis Cuti</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">Tanggal</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Jumlah Hari</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850/80">
                    {leaveRecs.slice(0, 15).map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="px-3.5 py-2.5 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{r.requestNumber}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs md:text-sm whitespace-nowrap">{r.employee?.fullName}</div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">{r.employee?.employeeNumber}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-600 dark:text-zinc-300 hidden md:table-cell whitespace-nowrap">{r.leaveType?.name}</td>
                        <td className="px-3.5 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap hidden lg:table-cell">
                          {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.totalDays}</span>
                          <span className="text-[11px] text-zinc-400 ml-1">hari</span>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          PAYROLL REVIEW DASHBOARD
          ═══════════════════════════════════════════════ */}
      {activeTab === 'payroll' && !payQ.isLoading && (
        <div className="space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={fmtRupiah(payTotal)} label="Total Pengeluaran Gaji" icon={Wallet} />
            <StatCard value={fmtRupiah(payAvg)} label="Rata-rata Gaji Bersih" icon={TrendingUp} accent="green" />
            <StatCard value={fmtRupiah(payDeductions)} label="Total Potongan" icon={SlidersHorizontal} accent="red" />
            <StatCard value={`${payPaidCnt} / ${payRecs.length}`} label="Karyawan Telah Dibayar" icon={Users} accent="blue" />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-5">

            {/* Horizontal Bar (3 cols) */}
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs">
              <SectionHeader title="Biaya Gaji per Departemen" subtitle="Total gaji bersih yang dibayarkan" />
              {payBarData.length === 0 ? (
                <EmptyState message="Tidak ada data departemen untuk ditampilkan." />
              ) : (
                <div className="mt-5 h-52 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={payBarData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={90} />
                        <Tooltip
                          cursor={{ fill: '#27272a', opacity: 0.3 }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {fmtRupiah(Number(payload[0].value))}
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} maxBarSize={28} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* Top Earners (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xs">
              <SectionHeader title="Gaji Tertinggi" subtitle="5 karyawan dengan gaji bersih terbesar" />
              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
                {[...payRecs]
                  .sort((a, b) => Number(b.netSalary) - Number(a.netSalary))
                  .slice(0, 5)
                  .map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-50 dark:border-zinc-850/80 last:border-0">
                      <span className="size-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{r.employee?.fullName}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 truncate">{r.employee?.department?.name ?? '—'}</div>
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 shrink-0">{fmtRupiah(r.netSalary)}</span>
                    </div>
                  ))}
                {payRecs.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">Belum ada data penggajian.</p>}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <SectionHeader title="Detail Data Penggajian" subtitle={`${payRecs.length} record ditemukan`} />
            </div>
            {payRecs.length === 0 ? (
              <EmptyState message="Belum ada data penggajian yang di-generate untuk bulan/tahun ini. Silakan generate gaji terlebih dahulu di menu Penggajian (Payroll)." />
            ) : (
              <div className="overflow-x-auto max-h-90 overflow-y-auto">
                <table className="w-full text-xs md:text-sm whitespace-nowrap">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-left">
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Karyawan</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Departemen</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Gaji Pokok</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">Tunjangan</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">Potongan</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Gaji Bersih</th>
                      <th className="px-3.5 py-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850/80">
                    {payRecs.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs md:text-sm whitespace-nowrap">{r.employeeName ?? r.employee?.fullName}</div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">{r.payrollNumber}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 hidden md:table-cell whitespace-nowrap">{r.department ?? r.employee?.department?.name ?? '—'}</td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{fmtRupiah(r.basicSalary)}</td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 hidden lg:table-cell whitespace-nowrap">{fmtRupiah(r.totalAllowance)}</td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm text-red-500 hidden lg:table-cell whitespace-nowrap">−{fmtRupiah(r.totalAllDeductions ?? 0)}</td>
                        <td className="px-3.5 py-2.5 text-xs md:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{fmtRupiah(r.netSalary)}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PHOTO ZOOM PREVIEW MODAL ── */}
      {viewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {viewPhotoUrl.title}
              </h4>
              <button
                type="button"
                onClick={() => setViewPhotoUrl(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-black/5 flex items-center justify-center">
              <img
                src={viewPhotoUrl.url}
                alt="Foto Wajah"
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setViewPhotoUrl(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PDF PREVIEW MODAL ── */}
      {pdfPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-red-100 dark:bg-red-950/60 p-2 text-red-600 dark:text-red-400">
                  <FileDown className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Pratinjau Dokumen PDF
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Tinjau tata letak dokumen dan foto kehadiran sebelum mencetak atau menyimpan PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printDocument(pdfPreviewKind)}
                  className="gap-1.5 border-zinc-300 dark:border-zinc-700 text-xs font-semibold"
                >
                  <Printer className="size-3.5 text-zinc-600 dark:text-zinc-300" />
                  <span>Cetak Dokumen</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadDirectPdf(pdfPreviewKind)}
                  disabled={downloadingPdf}
                  className="gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-xs font-semibold text-xs"
                >
                  {downloadingPdf ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileDown className="size-3.5" />
                  )}
                  <span>{downloadingPdf ? 'Mengunduh PDF…' : 'Unduh PDF Langsung'}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPdfPreviewOpen(false)}
                  className="text-xs ml-1"
                >
                  <X className="size-4" />
                  <span className="hidden sm:inline ml-1">Tutup</span>
                </Button>
              </div>
            </div>

            {/* Modal Scrollable Body (A4 Paper Rendering) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-200 dark:bg-zinc-950 flex justify-center">
              <div
                id="report-paper-container"
                className="w-full max-w-4xl bg-white text-zinc-900 p-8 sm:p-12 shadow-xl rounded-sm border border-zinc-200 min-h-225 text-[11px] font-sans"
              >
                {/* Paper Header */}
                <div className="flex justify-between items-end border-b-2 border-zinc-900 pb-3 mb-4">
                  <div>
                    <div className="text-lg font-extrabold tracking-tight text-zinc-950">PT GASELA MOTOR</div>
                    <div className="text-xs font-bold uppercase text-zinc-700 mt-0.5">
                      {getReportContentHtml(pdfPreviewKind).title}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Periode: <strong>{getReportContentHtml(pdfPreviewKind).periodStr}</strong>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500">
                    <div>Dicetak pada: {new Date().toLocaleString('id-ID')}</div>
                    <div className="text-zinc-400 mt-0.5">Sistem HRIS GaselaPulse</div>
                  </div>
                </div>

                {/* Paper Table */}
                <div
                  className="report-paper-table [&_table]:w-full [&_table]:border-collapse [&_table]:text-[10px] [&_th]:bg-zinc-100 [&_th]:text-zinc-700 [&_th]:p-2 [&_th]:text-left [&_th]:border-b [&_th]:border-zinc-300 [&_th]:font-bold [&_th]:uppercase [&_td]:p-2 [&_td]:border-b [&_td]:border-zinc-200 [&_td]:align-middle"
                  dangerouslySetInnerHTML={{
                    __html: getReportContentHtml(pdfPreviewKind).rowsHtml,
                  }}
                />

                {/* Paper Footer / Signatures */}
                <div className="mt-12 flex justify-between items-end text-[10px] text-zinc-500 pt-6 border-t border-dashed border-zinc-200">
                  <div>GaselaPulse HRIS System — Laporan Resmi</div>
                  <div className="text-center min-w-45">
                    <p>Disetujui Oleh,</p>
                    <div className="h-16" />
                    <p className="border-b border-zinc-400 pb-0.5 font-medium">__________________________</p>
                    <p className="font-bold text-zinc-800 mt-0.5">Manager HRD / Finance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 shrink-0 text-xs text-zinc-500">
              <span>Klik <strong>&quot;Unduh PDF Langsung&quot;</strong> untuk menyimpan file ke perangkat atau <strong>&quot;Cetak Dokumen&quot;</strong> untuk print ke kertas.</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPdfPreviewOpen(false)}
                  className="text-xs"
                >
                  Tutup Pratinjau
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadDirectPdf(pdfPreviewKind)}
                  disabled={downloadingPdf}
                  className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                >
                  {downloadingPdf ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileDown className="size-3.5" />
                  )}
                  <span>{downloadingPdf ? 'Mengunduh PDF…' : 'Unduh PDF Langsung'}</span>
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
