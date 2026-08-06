'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarDays,
  Download,
  FileDown,
  FileSpreadsheet,
  Loader2,
  ReceiptText,
  Clock,
  TrendingUp,
  Percent,
  Wallet,
  Users,
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
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import {
  badgeClass,
  fmtDate,
  fmtHours,
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
      {message}
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
      <FileSpreadsheet className="size-4 shrink-0" />
      {message}
    </div>
  );
}

export default function ReportsPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'payroll'>('attendance');
  const [mounted, setMounted] = useState(false);

  // Filters State
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canManage = !!user && roleAtLeast(user.role, 'manager');
  const canPayroll = !!user && roleAtLeast(user.role, 'admin');

  useEffect(() => {
    setMounted(true);
    if (user && !canManage) router.replace('/dashboard');
  }, [user, canManage, router]);

  // Queries
  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => authApi<DepartmentItem[]>('/api/departments'),
    enabled: canManage,
  });

  const attendancePreviewQuery = useQuery({
    queryKey: ['attendance-preview', attFrom, attTo, attDept],
    queryFn: () =>
      authApi<any[]>(
        `/api/reports/attendance/preview?from=${attFrom}&to=${attTo}${
          attDept ? `&departmentId=${attDept}` : ''
        }`,
      ),
    enabled: activeTab === 'attendance' && !!attFrom && !!attTo && canManage,
  });

  const leavePreviewQuery = useQuery({
    queryKey: ['leave-preview', leaveFrom, leaveTo, leaveStatus],
    queryFn: () =>
      authApi<any[]>(
        `/api/reports/leave/preview?from=${leaveFrom}&to=${leaveTo}${
          leaveStatus ? `&status=${leaveStatus}` : ''
        }`,
      ),
    enabled: activeTab === 'leave' && !!leaveFrom && !!leaveTo && canManage,
  });

  const payrollPreviewQuery = useQuery({
    queryKey: ['payroll-preview', payMonth, payYear, payStatus],
    queryFn: () =>
      authApi<any[]>(
        `/api/reports/payroll/preview?month=${payMonth}&year=${payYear}${
          payStatus ? `&status=${payStatus}` : ''
        }`,
      ),
    enabled: activeTab === 'payroll' && !!payMonth && !!payYear && canPayroll,
  });

  async function downloadCsv(kind: 'attendance' | 'leave' | 'payroll') {
    const params = new URLSearchParams();
    if (kind === 'attendance') {
      params.set('from', attFrom);
      params.set('to', attTo);
      if (attDept) params.set('departmentId', attDept);
    } else if (kind === 'leave') {
      params.set('from', leaveFrom);
      params.set('to', leaveTo);
      if (leaveStatus) params.set('status', leaveStatus);
    } else {
      params.set('month', payMonth);
      params.set('year', payYear);
      if (payStatus) params.set('status', payStatus);
    }

    setDownloading(kind);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/reports/${kind}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body === 'object' && 'message' in body
            ? String((body as { message: string | string[] }).message)
            : `Gagal mengunduh laporan (${res.status})`;
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      }
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filename =
        disposition.match(/filename="?([^";]+)"?/)?.[1] ?? `${kind}.csv`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess(
        `File "${filename}" berhasil diunduh. Buka dengan Microsoft Excel atau Google Sheets.`,
      );
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengunduh laporan.');
    } finally {
      setDownloading(null);
    }
  }

  if (!user || !canManage) return null;

  const inputClasses =
    'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent';

  // ------------------ CALCULATE METRICS & CHART DATA ------------------

  // 1. Attendance Review Calculations
  const attendanceRecords = attendancePreviewQuery.data ?? [];
  const totalAttRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;
  const leaveCount = attendanceRecords.filter((r) => r.status === 'on_leave').length;

  const attendanceRate =
    totalAttRecords > 0
      ? Math.round(((presentCount + lateCount) / totalAttRecords) * 100)
      : 0;
  const totalLateMinutes = attendanceRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
  const avgWorkHours =
    attendanceRecords.filter((r) => r.workHours).length > 0
      ? (
          attendanceRecords.reduce((acc, r) => acc + Number(r.workHours || 0), 0) /
          attendanceRecords.filter((r) => r.workHours).length
        ).toFixed(1)
      : '0.0';

  const attChartData = [
    { name: 'Tepat Waktu', value: presentCount, color: '#10b981' },
    { name: 'Terlambat', value: lateCount, color: '#f59e0b' },
    { name: 'Cuti', value: leaveCount, color: '#3b82f6' },
    { name: 'Absen', value: absentCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // 2. Leave Review Calculations
  const leaveRecords = leavePreviewQuery.data ?? [];
  const totalLeaveRequests = leaveRecords.length;
  const approvedLeaveCount = leaveRecords.filter((r) => r.status === 'approved').length;
  const pendingLeaveCount = leaveRecords.filter((r) => r.status === 'pending').length;
  const totalLeaveDays = leaveRecords.reduce((acc, r) => acc + (r.totalDays || 0), 0);

  const leaveTypeCounts = leaveRecords.reduce((acc: Record<string, number>, curr) => {
    const name = curr.leaveType?.name || 'Lainnya';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const leaveChartData = Object.entries(leaveTypeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 3. Payroll Review Calculations
  const payrollRecords = payrollPreviewQuery.data ?? [];
  const totalPayrollCost = payrollRecords.reduce((acc, r) => acc + Number(r.netSalary || 0), 0);
  const totalPayrollDeductions = payrollRecords.reduce(
    (acc, r) => acc + Number(r.totalDeduction || 0),
    0,
  );
  const avgNetSalary = payrollRecords.length > 0 ? totalPayrollCost / payrollRecords.length : 0;
  const paidCount = payrollRecords.filter((r) => r.status === 'paid').length;

  const deptPayrollExpenses = payrollRecords.reduce((acc: Record<string, number>, curr) => {
    const name = curr.employee?.department?.name || 'Lainnya';
    acc[name] = (acc[name] || 0) + Number(curr.netSalary || 0);
    return acc;
  }, {});
  const payrollChartData = Object.entries(deptPayrollExpenses).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 p-6 text-white shadow-xs">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="size-6 text-emerald-400" />
          <h1 className="text-xl font-bold">Dasbor Laporan & Review</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Tinjau data secara visual (statistik, grafik, dan tabel) sebelum melakukan ekspor laporan ke format CSV/Excel.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-1 overflow-x-auto select-none">
        <button
          onClick={() => {
            setActiveTab('attendance');
            setError(null);
            setSuccess(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus:outline-none whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Clock className="size-4" />
          Laporan Kehadiran
        </button>
        <button
          onClick={() => {
            setActiveTab('leave');
            setError(null);
            setSuccess(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus:outline-none whitespace-nowrap ${
            activeTab === 'leave'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <CalendarDays className="size-4" />
          Laporan Cuti
        </button>
        {canPayroll && (
          <button
            onClick={() => {
              setActiveTab('payroll');
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus:outline-none whitespace-nowrap ${
              activeTab === 'payroll'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ReceiptText className="size-4" />
            Laporan Penggajian
          </button>
        )}
      </div>

      {/* Main Grid: Left Filters, Right Review Dashboard */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Filter Form */}
        <div className="w-full lg:w-80 shrink-0">
          <Card className="border-zinc-200 shadow-sm sticky top-6">
            <CardHeader className="border-b border-zinc-100 pb-3">
              <CardTitle className="text-sm font-bold text-zinc-800">
                Filter Laporan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {activeTab === 'attendance' && (
                <>
                  <div>
                    <Label htmlFor="att-from">Dari Tanggal</Label>
                    <Input
                      id="att-from"
                      type="date"
                      value={attFrom}
                      onChange={(e) => setAttFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="att-to">Sampai Tanggal</Label>
                    <Input
                      id="att-to"
                      type="date"
                      value={attTo}
                      onChange={(e) => setAttTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="att-dept">Departemen (Opsional)</Label>
                    <select
                      id="att-dept"
                      value={attDept}
                      onChange={(e) => setAttDept(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Semua Departemen</option>
                      {departments.data?.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'leave' && (
                <>
                  <div>
                    <Label htmlFor="leave-from">Dari Tanggal</Label>
                    <Input
                      id="leave-from"
                      type="date"
                      value={leaveFrom}
                      onChange={(e) => setLeaveFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leave-to">Sampai Tanggal</Label>
                    <Input
                      id="leave-to"
                      type="date"
                      value={leaveTo}
                      onChange={(e) => setLeaveTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leave-status">Status (Opsional)</Label>
                    <select
                      id="leave-status"
                      value={leaveStatus}
                      onChange={(e) => setLeaveStatus(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Semua Status</option>
                      <option value="pending">Menunggu</option>
                      <option value="approved">Disetujui</option>
                      <option value="rejected">Ditolak</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'payroll' && (
                <>
                  <div>
                    <Label htmlFor="pay-month">Bulan</Label>
                    <select
                      id="pay-month"
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                      className={inputClasses}
                    >
                      {[
                        'Januari',
                        'Februari',
                        'Maret',
                        'April',
                        'Mei',
                        'Juni',
                        'Juli',
                        'Agustus',
                        'September',
                        'Oktober',
                        'November',
                        'Desember',
                      ].map((name, i) => (
                        <option key={i + 1} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pay-year">Tahun</Label>
                    <Input
                      id="pay-year"
                      type="number"
                      min={2000}
                      max={2100}
                      value={payYear}
                      onChange={(e) => setPayYear(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pay-status">Status (Opsional)</Label>
                    <select
                      id="pay-status"
                      value={payStatus}
                      onChange={(e) => setPayStatus(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Semua Status</option>
                      <option value="draft">Draft</option>
                      <option value="approved">Disetujui</option>
                      <option value="paid">Dibayar</option>
                    </select>
                  </div>
                </>
              )}

              <Button
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 gap-2 mt-4"
                disabled={
                  downloading !== null ||
                  (activeTab === 'attendance' && (!attFrom || !attTo)) ||
                  (activeTab === 'leave' && (!leaveFrom || !leaveTo)) ||
                  (activeTab === 'payroll' && (!payMonth || !payYear))
                }
                onClick={() => downloadCsv(activeTab)}
              >
                {downloading === activeTab ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {downloading === activeTab ? 'Memproses...' : 'Ekspor Laporan (CSV)'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Dashboard Review Panels */}
        <div className="flex-1 space-y-6">
          {/* loading state */}
          {((activeTab === 'attendance' && attendancePreviewQuery.isLoading) ||
            (activeTab === 'leave' && leavePreviewQuery.isLoading) ||
            (activeTab === 'payroll' && payrollPreviewQuery.isLoading)) && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 className="size-8 animate-spin text-zinc-900" />
              <p className="text-sm font-medium">Memuat dasbor peninjauan data…</p>
            </div>
          )}

          {/* ATTENDANCE REVIEW DASHBOARD */}
          {activeTab === 'attendance' && attendancePreviewQuery.data && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{totalAttRecords}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Users className="size-3.5" /> Total Kehadiran
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{attendanceRate}%</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Percent className="size-3.5" /> Rasio Kehadiran
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">
                      {fmtHours(totalLateMinutes)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Clock className="size-3.5" /> Terlambat (Menit)
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{avgWorkHours} jam</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="size-3.5" /> Rata-rata Kerja
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart & Summary */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Recharts Pie Donut */}
                <Card className="border-zinc-200 bg-white md:col-span-2">
                  <CardHeader className="border-b border-zinc-50 pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-800">
                      Sebaran Status Kehadiran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {totalAttRecords === 0 ? (
                      <div className="flex h-56 items-center justify-center text-zinc-400 text-sm">
                        Tidak ada data grafik untuk ditampilkan.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-56">
                        {mounted && (
                          <div className="relative size-36 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={attChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={65}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {attChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                              <span className="text-2xl font-extrabold text-zinc-900">
                                {totalAttRecords}
                              </span>
                              <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mt-1">
                                Record
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5 text-xs w-full sm:w-auto">
                          {attChartData.map((item) => {
                            const pct = Math.round((item.value / totalAttRecords) * 100);
                            return (
                              <div
                                key={item.name}
                                className="flex items-center justify-between gap-4 py-0.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-zinc-600 font-medium">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-zinc-900">
                                    {item.value}
                                  </span>
                                  <span className="text-zinc-400 ml-1">({pct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-zinc-200 bg-white">
                  <CardHeader className="border-b border-zinc-50 pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-800">
                      Metrik Kedisiplinan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-xs space-y-4">
                    <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">Tepat Waktu</span>
                      <span className="font-semibold text-zinc-800">{presentCount} hari</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">Terlambat Masuk</span>
                      <span className="font-semibold text-amber-600">{lateCount} hari</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">Izin / Cuti Resmi</span>
                      <span className="font-semibold text-blue-600">{leaveCount} hari</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500">Mangkir / Tanpa Izin</span>
                      <span className="font-semibold text-red-600">{absentCount} hari</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card className="border-zinc-200 bg-white">
                <CardHeader className="border-b border-zinc-100 pb-3">
                  <CardTitle className="text-sm font-bold text-zinc-800">
                    Preview Data Kehadiran (Menampilkan hingga 15 baris)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-0 pb-0">
                  {totalAttRecords === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-400">
                      Tidak ada data kehadiran yang sesuai filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider sticky top-0 border-b border-zinc-100">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Tanggal</th>
                            <th className="px-4 py-2 font-semibold">Karyawan</th>
                            <th className="px-4 py-2 font-semibold">Departemen</th>
                            <th className="px-4 py-2 font-semibold">Shift</th>
                            <th className="px-4 py-2 font-semibold">Masuk / Keluar</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                            <th className="px-4 py-2 font-semibold">Terlambat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {attendanceRecords.slice(0, 15).map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50">
                              <td className="px-4 py-2.5 font-medium text-zinc-900">
                                {fmtDate(r.attendanceDate)}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-zinc-900">
                                  {r.employee?.fullName}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {r.employee?.employeeNumber}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-zinc-600">
                                {r.employee?.department?.name ?? '—'}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-500">
                                {r.shift?.name ?? '—'}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-700">
                                {r.checkInTime ? fmtTime(r.checkInTime) : '—'} /{' '}
                                {r.checkOutTime ? fmtTime(r.checkOutTime) : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={badgeClass(r.status)}>
                                  {statusLabel(r.status)}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-zinc-950">
                                {r.lateMinutes > 0 ? `${r.lateMinutes} m` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* LEAVE REVIEW DASHBOARD */}
          {activeTab === 'leave' && leavePreviewQuery.data && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{totalLeaveRequests}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <FileSpreadsheet className="size-3.5" /> Total Pengajuan
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{approvedLeaveCount}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Clock className="size-3.5" /> Disetujui
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{pendingLeaveCount}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Clock className="size-3.5" /> Menunggu
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{totalLeaveDays} Hari</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <CalendarDays className="size-3.5" /> Total Hari Cuti
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart & Types */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Recharts Bar */}
                <Card className="border-zinc-200 bg-white md:col-span-2">
                  <CardHeader className="border-b border-zinc-50 pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-800">
                      Frekuensi Berdasarkan Jenis Cuti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {leaveChartData.length === 0 ? (
                      <div className="flex h-56 items-center justify-center text-zinc-400 text-sm">
                        Tidak ada data grafik untuk ditampilkan.
                      </div>
                    ) : (
                      <div className="h-56 w-full">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart
                              data={leaveChartData}
                              margin={{ left: 10, right: 10, top: 10, bottom: 5 }}
                            >
                              <XAxis
                                dataKey="name"
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                              />
                              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                              <Tooltip
                                cursor={{ fill: '#f4f4f5' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-md text-xs font-semibold text-zinc-900">
                                        {payload[0].value} Pengajuan
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" fill="#18181b" radius={[4, 4, 0, 0]} />
                            </ReBarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Leave Reason Summary List */}
                <Card className="border-zinc-200 bg-white">
                  <CardHeader className="border-b border-zinc-50 pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-800">
                      Rincian Alasan Teratas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 max-h-60 overflow-y-auto text-xs space-y-2.5">
                    {leaveRecords.slice(0, 5).map((r: any, idx: number) => (
                      <div key={idx} className="py-1 border-b border-zinc-50 last:border-0">
                        <div className="font-semibold text-zinc-800 truncate">
                          {r.employee?.fullName}
                        </div>
                        <p className="text-zinc-500 italic mt-0.5">"{r.reason || '—'}"</p>
                      </div>
                    ))}
                    {leaveRecords.length === 0 && (
                      <p className="text-zinc-400 text-center py-6">Belum ada pengajuan cuti.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card className="border-zinc-200 bg-white">
                <CardHeader className="border-b border-zinc-100 pb-3">
                  <CardTitle className="text-sm font-bold text-zinc-800">
                    Preview Data Cuti (Menampilkan hingga 15 baris)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-0 pb-0">
                  {totalLeaveRequests === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-400">
                      Tidak ada data cuti yang sesuai filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider sticky top-0 border-b border-zinc-100">
                          <tr>
                            <th className="px-4 py-2 font-semibold">No. Pengajuan</th>
                            <th className="px-4 py-2 font-semibold">Karyawan</th>
                            <th className="px-4 py-2 font-semibold">Jenis Cuti</th>
                            <th className="px-4 py-2 font-semibold">Tanggal Mulai/Selesai</th>
                            <th className="px-4 py-2 font-semibold">Jumlah Hari</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {leaveRecords.slice(0, 15).map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50">
                              <td className="px-4 py-2.5 font-medium text-zinc-900">
                                {r.requestNumber}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-zinc-900">
                                  {r.employee?.fullName}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {r.employee?.employeeNumber}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-zinc-700">
                                {r.leaveType?.name}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-500">
                                {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-zinc-950">
                                {r.totalDays} Hari
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={badgeClass(r.status)}>
                                  {statusLabel(r.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAYROLL REVIEW DASHBOARD */}
          {activeTab === 'payroll' && payrollPreviewQuery.data && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">{fmtRupiah(totalPayrollCost)}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Wallet className="size-3.5" /> Total Pengeluaran
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">
                      {fmtRupiah(avgNetSalary)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Wallet className="size-3.5" /> Rata-rata Gaji Bersih
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-red-600">
                      {fmtRupiah(totalPayrollDeductions)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="size-3.5" /> Total Potongan
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white">
                  <CardContent className="p-4 leading-none">
                    <div className="text-2xl font-bold text-zinc-900">
                      {paidCount} / {payrollRecords.length}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Users className="size-3.5" /> Karyawan Dibayar
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart & Department Salary List */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Recharts Bar */}
                <Card className="border-zinc-200 bg-white md:col-span-2">
                  <CardHeader className="border-b border-zinc-50 pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-800">
                      Biaya Penggajian per Departemen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {payrollChartData.length === 0 ? (
                      <div className="flex h-56 items-center justify-center text-zinc-400 text-sm">
                        Tidak ada data grafik untuk ditampilkan.
                      </div>
                    ) : (
                      <div className="h-56 w-full">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart
                              data={payrollChartData}
                              layout="vertical"
                              margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
                            >
                              <XAxis type="number" hide />
                              <YAxis
                                dataKey="name"
                                type="category"
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                width={80}
                              />
                              <Tooltip
                                cursor={{ fill: '#f4f4f5' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-md text-xs font-semibold text-zinc-900">
                                        {fmtRupiah(Number(payload[0].value))}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" fill="#18181b" radius={[0, 4, 4, 0]} />
                            </ReBarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Earner Summary List */}
                <Card className="border-zinc-200 bg-white">
                  <CardHeader className="border-b border-zinc-50 pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-800">
                      Gaji Bersih Tertinggi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 max-h-60 overflow-y-auto text-xs space-y-2.5">
                    {[...payrollRecords]
                      .sort((a, b) => Number(b.netSalary) - Number(a.netSalary))
                      .slice(0, 5)
                      .map((r: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-1 border-b border-zinc-50 last:border-0"
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold text-zinc-800 truncate">
                              {r.employee?.fullName}
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              {r.employee?.department?.name ?? '—'}
                            </span>
                          </div>
                          <span className="font-bold text-zinc-900 shrink-0">
                            {fmtRupiah(r.netSalary)}
                          </span>
                        </div>
                      ))}
                    {payrollRecords.length === 0 && (
                      <p className="text-zinc-400 text-center py-6">Belum ada data penggajian.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card className="border-zinc-200 bg-white">
                <CardHeader className="border-b border-zinc-100 pb-3">
                  <CardTitle className="text-sm font-bold text-zinc-800">
                    Preview Data Penggajian (Menampilkan seluruhnya)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-0 pb-0">
                  {payrollRecords.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-400">
                      Tidak ada data penggajian yang sesuai filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider sticky top-0 border-b border-zinc-100">
                          <tr>
                            <th className="px-4 py-2 font-semibold">No. Payroll</th>
                            <th className="px-4 py-2 font-semibold">Karyawan</th>
                            <th className="px-4 py-2 font-semibold">Departemen</th>
                            <th className="px-4 py-2 font-semibold">Gaji Pokok</th>
                            <th className="px-4 py-2 font-semibold">Tunjangan / Lembur</th>
                            <th className="px-4 py-2 font-semibold">Potongan</th>
                            <th className="px-4 py-2 font-semibold">Gaji Bersih</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {payrollRecords.map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50">
                              <td className="px-4 py-2.5 font-medium text-zinc-900">
                                {r.payrollNumber}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-zinc-900">
                                  {r.employee?.fullName}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {r.employee?.employeeNumber}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-zinc-600">
                                {r.employee?.department?.name ?? '—'}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-zinc-700">
                                {fmtRupiah(r.basicSalary)}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-600">
                                {fmtRupiah(r.totalAllowance)} / {fmtRupiah(r.overtimePay)}
                              </td>
                              <td className="px-4 py-2.5 text-red-600">
                                -{fmtRupiah(r.totalDeduction)}
                              </td>
                              <td className="px-4 py-2.5 font-extrabold text-zinc-950">
                                {fmtRupiah(r.netSalary)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={badgeClass(r.status)}>
                                  {statusLabel(r.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Petunjuk Penggunaan */}
      <Card className="border-zinc-100 bg-zinc-50 shadow-none">
        <CardContent className="pt-5">
          <h4 className="text-sm font-semibold text-zinc-800 mb-2">📋 Petunjuk Membuka di Microsoft Excel</h4>
          <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-600">
            <li>Unduh file CSV menggunakan tombol di atas.</li>
            <li>Buka Microsoft Excel → Klik <strong>Data</strong> → <strong>From Text/CSV</strong>.</li>
            <li>Pilih file yang sudah diunduh, pastikan delimiter <strong>titik koma (;)</strong> dipilih.</li>
            <li>Klik <strong>Load</strong> untuk membuka data ke spreadsheet.</li>
          </ol>
          <p className="mt-3 text-[11px] text-zinc-400">
            Atau: klik-kanan file → <em>Open with</em> → <em>Microsoft Excel</em> (untuk Excel versi terbaru yang mendukung UTF-8 BOM otomatis).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
