'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary, Paginated } from '@gasela/shared-types';
import { Loader2, LogIn, LogOut, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthApi } from '@/lib/auth-api';
import { badgeClass, fmtDate, fmtHours, fmtTime, OFFICE_LOCATION } from '@/lib/format';

interface AttendanceRow {
  id: number;
  attendanceDate: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number | string | null;
  lateMinutes?: number | null;
  shift?: { id: number; name: string } | null;
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ latitude: OFFICE_LOCATION.lat, longitude: OFFICE_LOCATION.lng });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve({ latitude: OFFICE_LOCATION.lat, longitude: OFFICE_LOCATION.lng }),
      { timeout: 8000, maximumAge: 60000 },
    );
  });
}

export default function AttendancePage() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [geoFallback, setGeoFallback] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const dashboard = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => authApi<DashboardSummary>('/api/dashboard/summary'),
  });

  const history = useQuery({
    queryKey: ['attendance-my'],
    queryFn: () => authApi<Paginated<AttendanceRow>>('/api/attendances/my?page=1&limit=20'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
  };

  const checkIn = useMutation({
    mutationFn: async () => {
      const pos = await getPosition();
      setGeoFallback(Math.abs(pos.latitude - OFFICE_LOCATION.lat) < 0.0001);
      return authApi('/api/attendances/check-in', {
        method: 'POST',
        body: JSON.stringify({ latitude: pos.latitude, longitude: pos.longitude }),
      });
    },
    onSuccess: invalidate,
    onError: (err) =>
      setActionError(
        err instanceof Error ? err.message : 'Gagal melakukan check-in.',
      ),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      const pos = await getPosition();
      setGeoFallback(Math.abs(pos.latitude - OFFICE_LOCATION.lat) < 0.0001);
      return authApi('/api/attendances/check-out', {
        method: 'POST',
        body: JSON.stringify({ latitude: pos.latitude, longitude: pos.longitude }),
      });
    },
    onSuccess: invalidate,
    onError: (err) =>
      setActionError(
        err instanceof Error ? err.message : 'Gagal melakukan check-out.',
      ),
  });

  const today = dashboard.data?.today.attendance ?? null;
  const busy = checkIn.isPending || checkOut.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Kehadiran Saya</h2>
        <p className="text-sm text-zinc-500">
          Catat kehadiran dengan lokasi GPS dan pantau riwayat Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Kehadiran Hari Ini</span>
            <span className="text-sm font-normal text-zinc-500">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.isLoading ? (
            <p className="text-sm text-zinc-400">Memuat…</p>
          ) : today ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={badgeClass(today.status)}>{today.status}</Badge>
                {today.shiftName && (
                  <span className="text-sm text-zinc-500">Shift: {today.shiftName}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Check-in</div>
                  <div className="text-lg font-semibold">{fmtTime(today.checkInTime)}</div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Check-out</div>
                  <div className="text-lg font-semibold">{fmtTime(today.checkOutTime)}</div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Keterlambatan</div>
                  <div className="text-lg font-semibold">
                    {today.lateMinutes > 0 ? `${today.lateMinutes} mnt` : '—'}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Jam Kerja</div>
                  <div className="text-lg font-semibold">{fmtHours(today.workHours)}</div>
                </div>
              </div>
              {!today.checkInTime && (
                <Button size="lg" onClick={() => checkIn.mutate()} disabled={busy}>
                  {checkIn.isPending ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <LogIn data-icon="inline-start" />
                  )}
                  Check-in Sekarang
                </Button>
              )}
              {today.checkInTime && !today.checkOutTime && (
                <Button size="lg" onClick={() => checkOut.mutate()} disabled={busy}>
                  {checkOut.isPending ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <LogOut data-icon="inline-start" />
                  )}
                  Check-out
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">
                Belum ada catatan kehadiran hari ini.
              </p>
              <Button size="lg" onClick={() => checkIn.mutate()} disabled={busy}>
                {checkIn.isPending ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <LogIn data-icon="inline-start" />
                )}
                Check-in Sekarang
              </Button>
            </div>
          )}

          {geoFallback && (
            <p className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
              <MapPin className="size-3" />
              Lokasi perangkat tidak terdeteksi; memakai koordinat kantor.
            </p>
          )}
          {actionError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {actionError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          {history.isLoading ? (
            <p className="text-sm text-zinc-400">Memuat…</p>
          ) : history.data && history.data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-3 font-medium">Tanggal</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Masuk</th>
                    <th className="pb-2 pr-3 font-medium">Keluar</th>
                    <th className="pb-2 pr-3 font-medium">Terlambat</th>
                    <th className="pb-2 font-medium">Jam Kerja</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.items.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                      <td className="py-2 pr-3 text-zinc-900">{fmtDate(r.attendanceDate)}</td>
                      <td className="py-2 pr-3">
                        <Badge className={badgeClass(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-zinc-600">{fmtTime(r.checkInTime)}</td>
                      <td className="py-2 pr-3 text-zinc-600">{fmtTime(r.checkOutTime)}</td>
                      <td className="py-2 pr-3 text-zinc-600">
                        {r.lateMinutes && r.lateMinutes > 0 ? `${r.lateMinutes} mnt` : '—'}
                      </td>
                      <td className="py-2 text-zinc-600">{fmtHours(r.workHours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Belum ada riwayat kehadiran.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
