'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarDays,
  Download,
  FileDown,
  Loader2,
  ReceiptText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { roleAtLeast } from '@/lib/format';
import { todayInput } from '@/lib/format';
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

export default function ReportsPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [attFrom, setAttFrom] = useState(todayInput(-30));
  const [attTo, setAttTo] = useState(todayInput());
  const [attDept, setAttDept] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [leaveFrom, setLeaveFrom] = useState(todayInput(-30));
  const [leaveTo, setLeaveTo] = useState(todayInput());
  const [leaveStatus, setLeaveStatus] = useState('');

  const now = new Date();
  const [payMonth, setPayMonth] = useState(String(now.getMonth() + 1));
  const [payYear, setPayYear] = useState(String(now.getFullYear()));
  const [payStatus, setPayStatus] = useState('');

  const canManage = !!user && roleAtLeast(user.role, 'manager');
  const canPayroll = !!user && roleAtLeast(user.role, 'admin');

  useEffect(() => {
    if (user && !canManage) router.replace('/dashboard');
  }, [user, canManage, router]);

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => authApi<DepartmentItem[]>('/api/departments'),
    enabled: canManage,
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
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengunduh laporan.');
    } finally {
      setDownloading(null);
    }
  }

  if (!user || !canManage) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">Laporan</h2>
        <p className="text-sm text-zinc-500">
          Ekspor laporan kehadiran, cuti, dan penggajian dalam format CSV.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Laporan Kehadiran */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BarChart3 className="size-4 text-zinc-500" />
            Laporan Kehadiran
            <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 ml-1">
              CSV
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
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
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">Semua Departemen</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
            disabled={downloading !== null || !attFrom || !attTo}
            onClick={() => downloadCsv('attendance')}
          >
            {downloading === 'attendance' ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <FileDown className="mr-1.5 size-4" />
            )}
            Unduh CSV Kehadiran
          </Button>
        </CardContent>
      </Card>

      {/* Laporan Cuti */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-zinc-500" />
            Laporan Cuti
            <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 ml-1">
              CSV
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
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
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
          <Button
            className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
            disabled={downloading !== null || !leaveFrom || !leaveTo}
            onClick={() => downloadCsv('leave')}
          >
            {downloading === 'leave' ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <FileDown className="mr-1.5 size-4" />
            )}
            Unduh CSV Cuti
          </Button>
        </CardContent>
      </Card>

      {/* Laporan Gaji */}
      {canPayroll && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ReceiptText className="size-4 text-zinc-500" />
              Laporan Penggajian
              <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 ml-1">
                CSV
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="pay-month">Bulan</Label>
                <select
                  id="pay-month"
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}
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
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Disetujui</option>
                  <option value="paid">Dibayar</option>
                </select>
              </div>
            </div>
            <Button
              className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={downloading !== null || !payMonth || !payYear}
              onClick={() => downloadCsv('payroll')}
            >
              {downloading === 'payroll' ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 size-4" />
              )}
              Unduh CSV Penggajian
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
