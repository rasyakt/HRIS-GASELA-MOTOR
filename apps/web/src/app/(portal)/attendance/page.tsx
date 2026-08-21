'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary, Paginated } from '@gasela/shared-types';
import { Loader2, LogIn, LogOut, MapPin, ExternalLink } from 'lucide-react';
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
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS tidak tersedia di perangkat Anda. Aktifkan lokasi untuk melakukan absensi.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (error) => {
        let message = 'Gagal mendapatkan lokasi GPS. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Izinkan akses lokasi di browser Anda untuk melakukan absensi.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
            break;
          case error.TIMEOUT:
            message += 'Permintaan lokasi timeout. Coba lagi.';
            break;
          default:
            message += 'Terjadi kesalahan tidak diketahui.';
        }
        reject(new Error(message));
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true },
    );
  });
}

export default function AttendancePage() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
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
      setActionError(null);
      const pos = await getPosition();
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
      setActionError(null);
      const pos = await getPosition();
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Kehadiran Saya</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Catat kehadiran dengan lokasi GPS dan pantau riwayat Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-zinc-900 dark:text-white font-bold">Kehadiran Hari Ini</span>
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
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
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Shift: {today.shiftName}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Check-in</div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{fmtTime(today.checkInTime)}</div>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Check-out</div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{fmtTime(today.checkOutTime)}</div>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Keterlambatan</div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {today.lateMinutes > 0 ? `${today.lateMinutes} mnt` : '—'}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Jam Kerja</div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{fmtHours(today.workHours)}</div>
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
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

          {actionError && (
            <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-2 text-xs text-red-700 dark:text-red-300">
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
            <>
              {/* Mobile View (Cards) */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {history.data.items.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{fmtDate(r.attendanceDate)}</span>
                      <Badge className={badgeClass(r.status)}>{r.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Masuk</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmtTime(r.checkInTime)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Keluar</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmtTime(r.checkOutTime)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Terlambat</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.lateMinutes && r.lateMinutes > 0 ? `${r.lateMinutes} mnt` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Jam Kerja</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmtHours(r.workHours)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View (Table) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-400">
                      <th className="pb-2 pr-3 font-medium">Tanggal</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Masuk</th>
                      <th className="pb-2 pr-3 font-medium">Keluar</th>
                      <th className="pb-2 pr-3 font-medium">Lokasi GPS Check-in</th>
                      <th className="pb-2 pr-3 font-medium">Terlambat</th>
                      <th className="pb-2 font-medium">Jam Kerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {history.data.items.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2.5 pr-3 text-zinc-900 dark:text-zinc-100 font-medium">{fmtDate(r.attendanceDate)}</td>
                        <td className="py-2.5 pr-3">
                          <Badge className={badgeClass(r.status)}>{r.status}</Badge>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-300 font-mono">{fmtTime(r.checkInTime)}</td>
                        <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-300 font-mono">{fmtTime(r.checkOutTime)}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {r.checkInLat && r.checkInLng ? (
                            <a
                              href={`https://www.google.com/maps?q=${r.checkInLat},${r.checkInLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900/50 px-2.5 py-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors"
                              title="Buka titik koordinat presensi di Google Maps"
                            >
                              <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{Number(r.checkInLat).toFixed(4)}, {Number(r.checkInLng).toFixed(4)}</span>
                              <ExternalLink className="size-3 text-emerald-500 dark:text-emerald-400 shrink-0 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-300">
                          {r.lateMinutes && r.lateMinutes > 0 ? `${r.lateMinutes} mnt` : '—'}
                        </td>
                        <td className="py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">{fmtHours(r.workHours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada riwayat kehadiran.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
