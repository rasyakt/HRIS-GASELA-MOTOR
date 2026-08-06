'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  Loader2,
  ReceiptText,
  Clock,
  TrendingUp,
  Wallet,
  Users,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Filter,
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
    zinc: 'text-zinc-900 bg-zinc-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
      <div className={`inline-flex items-center justify-center rounded-lg p-2 ${accents[accent]}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 leading-none">{value}</p>
        <p className="mt-1.5 text-xs text-zinc-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
      <div className="rounded-full bg-zinc-100 p-3">
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
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow';

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
        <Label htmlFor="att-from" className="text-xs font-semibold text-zinc-600">Dari Tanggal</Label>
        <Input id="att-from" type="date" value={attFrom} onChange={(e) => setAttFrom(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="att-to" className="text-xs font-semibold text-zinc-600">Sampai Tanggal</Label>
        <Input id="att-to" type="date" value={attTo} onChange={(e) => setAttTo(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="att-dept" className="text-xs font-semibold text-zinc-600">Departemen</Label>
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
        <Label htmlFor="leave-from" className="text-xs font-semibold text-zinc-600">Dari Tanggal</Label>
        <Input id="leave-from" type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="leave-to" className="text-xs font-semibold text-zinc-600">Sampai Tanggal</Label>
        <Input id="leave-to" type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="leave-status" className="text-xs font-semibold text-zinc-600">Status</Label>
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
        <Label htmlFor="pay-month" className="text-xs font-semibold text-zinc-600">Bulan</Label>
        <select id="pay-month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} className={`mt-1.5 ${SELECT_CLS}`}>
          {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="pay-year" className="text-xs font-semibold text-zinc-600">Tahun</Label>
        <Input id="pay-year" type="number" min={2000} max={2100} value={payYear} onChange={(e) => setPayYear(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="pay-status" className="text-xs font-semibold text-zinc-600">Status</Label>
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
  const [leaveTo, setLeaveTo] = useState(todayInput());
  const [leaveStatus, setLeaveStatus] = useState('');
  const now = new Date();
  const [payMonth, setPayMonth] = useState(String(now.getMonth() + 1));
  const [payYear, setPayYear] = useState(String(now.getFullYear()));
  const [payStatus, setPayStatus] = useState('');

  const [downloading, setDownloading] = useState<string | null>(null);
  const [csvMsg, setCsvMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = !!user && roleAtLeast(user.role, 'manager');
  const canPayroll = !!user && roleAtLeast(user.role, 'admin');
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
  const payDeductions = payRecs.reduce((s, r) => s + Number(r.totalDeduction || 0), 0);
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
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Laporan & Analitik</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Tinjau visualisasi data sebelum mengekspor ke CSV/Excel.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <FileSpreadsheet className="size-3.5 text-emerald-500" />
          Format ekspor: CSV (UTF-8) · Kompatibel Excel &amp; Google Sheets
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {csvMsg && (
        <div className={`mb-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
          csvMsg.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {csvMsg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          {csvMsg.text}
          <button onClick={() => setCsvMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity text-xs">✕</button>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="flex items-center gap-1 border-b border-zinc-200 mb-6 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCsvMsg(null); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
                active
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-zinc-900' : 'text-zinc-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── FILTER BAR (horizontal, full-width) ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-zinc-100 p-2">
              <Filter className="size-4 text-zinc-600" />
            </div>
            <span className="text-sm font-bold text-zinc-800">Filter</span>
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

          <Button
            className="shrink-0 bg-zinc-900 text-white hover:bg-zinc-700 gap-2 px-5 py-2.5 h-auto"
            disabled={downloading !== null}
            onClick={() => downloadCsv(activeTab)}
          >
            {downloading === activeTab ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            <span className="hidden sm:inline">{downloading === activeTab ? 'Memproses…' : 'Ekspor CSV'}</span>
            <span className="sm:hidden">{downloading === activeTab ? '…' : 'CSV'}</span>
          </Button>
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="size-8 animate-spin text-zinc-900" />
          <p className="text-sm text-zinc-500 font-medium">Memuat data laporan…</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ATTENDANCE REVIEW DASHBOARD
          ═══════════════════════════════════════════════ */}
      {activeTab === 'attendance' && hasData && (
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
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white p-6">
              <SectionHeader title="Sebaran Status Kehadiran" subtitle="Persentase status dari seluruh record" />
              {attPieData.length === 0 ? (
                <EmptyState message="Tidak ada data untuk ditampilkan." />
              ) : (
                <div className="mt-5 flex flex-col sm:flex-row items-center gap-6 min-h-[200px]">
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
                        <span className="text-3xl font-extrabold text-zinc-900">{attTotal}</span>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">Record</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2">
                    {attPieData.map((item) => {
                      const pct = Math.round((item.value / attTotal) * 100);
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-zinc-600 flex-1">{item.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                            </div>
                            <span className="text-xs font-bold text-zinc-800 w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Discipline Metrics (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6">
              <SectionHeader title="Ringkasan Kedisiplinan" subtitle="Rincian berdasarkan kategori status" />
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Tepat Waktu', value: attPresent, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Terlambat', value: attLate, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Cuti / Izin Resmi', value: attOnLeave, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Mangkir / Absen', value: attAbsent, color: 'text-red-600 bg-red-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                    <span className="text-sm text-zinc-600">{item.label}</span>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${item.color}`}>{item.value} hari</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <SectionHeader title="Detail Data Kehadiran" subtitle={`Menampilkan ${Math.min(15, attTotal)} dari ${attTotal} record`} />
              {attTotal > 15 && (
                <span className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1">
                  +{attTotal - 15} record lagi tersedia via CSV
                </span>
              )}
            </div>
            {attTotal === 0 ? (
              <EmptyState message="Tidak ada data kehadiran yang sesuai filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Karyawan</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Departemen</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Shift</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Masuk / Keluar</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Terlambat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {attRecs.slice(0, 15).map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-zinc-900 whitespace-nowrap">{fmtDate(r.attendanceDate)}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-900 text-sm">{r.employee?.fullName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{r.employee?.employeeNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-500 hidden md:table-cell">{r.employee?.department?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-500 hidden lg:table-cell">{r.shift?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-700 whitespace-nowrap font-mono">
                          {r.checkInTime ? fmtTime(r.checkInTime) : '—'}&nbsp;/&nbsp;{r.checkOutTime ? fmtTime(r.checkOutTime) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {Number(r.lateMinutes) > 0 ? (
                            <span className="text-amber-600 font-semibold text-xs">{r.lateMinutes} mnt</span>
                          ) : (
                            <span className="text-zinc-300 text-xs">—</span>
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
      {activeTab === 'leave' && hasData && (
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
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white p-6">
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
                          cursor={{ fill: '#f4f4f5' }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="rounded-lg border border-zinc-200 bg-white shadow-lg px-3 py-2 text-xs font-bold text-zinc-900">
                                {payload[0].value} Pengajuan
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="value" fill="#18181b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* Alasan Teratas (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6">
              <SectionHeader title="Riwayat Pengajuan Terbaru" subtitle="5 pengajuan terkini" />
              <div className="mt-4 space-y-3 max-h-56 overflow-y-auto">
                {leaveRecs.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-50 last:border-0">
                    <div className="flex size-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 shrink-0 mt-0.5">
                      {r.employee?.fullName?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-800 truncate">{r.employee?.fullName}</div>
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
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <SectionHeader title="Detail Data Cuti" subtitle={`Menampilkan ${Math.min(15, leaveTotal)} dari ${leaveTotal} record`} />
              {leaveTotal > 15 && (
                <span className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1">
                  +{leaveTotal - 15} record lagi via CSV
                </span>
              )}
            </div>
            {leaveTotal === 0 ? (
              <EmptyState message="Tidak ada data cuti yang sesuai filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">No. Pengajuan</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Karyawan</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Jenis Cuti</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Tanggal</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Jumlah Hari</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {leaveRecs.slice(0, 15).map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-mono font-medium text-zinc-500">{r.requestNumber}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-900 text-sm">{r.employee?.fullName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{r.employee?.employeeNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-600 hidden md:table-cell">{r.leaveType?.name}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500 whitespace-nowrap hidden lg:table-cell">
                          {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-zinc-900">{r.totalDays}</span>
                          <span className="text-xs text-zinc-400 ml-1">hari</span>
                        </td>
                        <td className="px-5 py-3.5">
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
      {activeTab === 'payroll' && hasData && (
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
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white p-6">
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
                          cursor={{ fill: '#f4f4f5' }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="rounded-lg border border-zinc-200 bg-white shadow-lg px-3 py-2 text-xs font-bold text-zinc-900">
                                {fmtRupiah(Number(payload[0].value))}
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="value" fill="#18181b" radius={[0, 6, 6, 0]} maxBarSize={28} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* Top Earners (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6">
              <SectionHeader title="Gaji Tertinggi" subtitle="5 karyawan dengan gaji bersih terbesar" />
              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
                {[...payRecs]
                  .sort((a, b) => Number(b.netSalary) - Number(a.netSalary))
                  .slice(0, 5)
                  .map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0">
                      <span className="size-6 flex items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-extrabold shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-zinc-800 truncate">{r.employee?.fullName}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 truncate">{r.employee?.department?.name ?? '—'}</div>
                      </div>
                      <span className="text-xs font-bold text-zinc-900 shrink-0">{fmtRupiah(r.netSalary)}</span>
                    </div>
                  ))}
                {payRecs.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">Belum ada data penggajian.</p>}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <SectionHeader title="Detail Data Penggajian" subtitle={`${payRecs.length} record ditemukan`} />
            </div>
            {payRecs.length === 0 ? (
              <EmptyState message="Tidak ada data penggajian yang sesuai filter." />
            ) : (
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Karyawan</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Departemen</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gaji Pokok</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Tunjangan</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Potongan</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gaji Bersih</th>
                      <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {payRecs.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-900 text-sm">{r.employee?.fullName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{r.payrollNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-500 hidden md:table-cell">{r.employee?.department?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-700">{fmtRupiah(r.basicSalary)}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-500 hidden lg:table-cell">{fmtRupiah(r.totalAllowance)}</td>
                        <td className="px-5 py-3.5 text-sm text-red-500 hidden lg:table-cell">−{fmtRupiah(r.totalDeduction)}</td>
                        <td className="px-5 py-3.5 text-sm font-extrabold text-zinc-900">{fmtRupiah(r.netSalary)}</td>
                        <td className="px-5 py-3.5">
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

      {/* ── EXCEL HINT ── */}
      <div className="mt-8 rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-4 flex gap-3">
        <FileSpreadsheet className="size-4 text-zinc-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-zinc-700 mb-1">Cara membuka file CSV di Microsoft Excel</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-zinc-500">
            <li>Klik tombol <strong>Ekspor CSV</strong> pada bagian filter di atas.</li>
            <li>Buka Excel → <strong>Data</strong> → <strong>From Text/CSV</strong> → pilih file yang diunduh.</li>
            <li>Pastikan delimiter yang dipilih adalah <strong>titik koma (;)</strong> → klik <strong>Load</strong>.</li>
          </ol>
        </div>
      </div>

    </div>
  );
}
