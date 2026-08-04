'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOvertimeInput,
  OvertimeRequestDto,
  Paginated,
} from '@gasela/shared-types';
import { createOvertimeSchema } from '@gasela/shared-types';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { badgeClass, fmtDate, fmtDateTime, fmtHours, fmtTime, todayInput } from '@/lib/format';

export default function OvertimePage() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOvertimeInput>({
    resolver: zodResolver(createOvertimeSchema),
    defaultValues: {
      overtimeDate: todayInput(),
      startTime: '17:00',
      endTime: '20:00',
      purpose: '',
    },
  });

  const myRequests = useQuery({
    queryKey: ['overtime-my'],
    queryFn: () =>
      authApi<Paginated<OvertimeRequestDto>>('/api/overtime/requests/my?page=1&limit=20'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['overtime-my'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateOvertimeInput) =>
      authApi('/api/overtime/requests', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidate();
      reset({
        overtimeDate: todayInput(),
        startTime: '17:00',
        endTime: '20:00',
        purpose: '',
      });
      setFormError(null);
      setFormOk(true);
    },
    onError: (err) => {
      setFormOk(false);
      setFormError(err instanceof Error ? err.message : 'Gagal mengajukan lembur.');
    },
  });

  const cancel = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/overtime/requests/${id}/cancel`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (err) =>
      alert(err instanceof Error ? err.message : 'Gagal membatalkan pengajuan.'),
  });

  function onSubmit(values: CreateOvertimeInput) {
    setFormOk(false);
    create.mutate(values);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Lembur</h2>
        <p className="text-sm text-zinc-500">
          Ajukan lembur dan pantau status persetujuannya.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="self-start lg:col-span-1">
          <CardHeader>
            <CardTitle>Ajukan Lembur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overtimeDate">Tanggal Lembur</Label>
                <Input
                  id="overtimeDate"
                  type="date"
                  aria-invalid={!!errors.overtimeDate}
                  {...register('overtimeDate')}
                />
                {errors.overtimeDate && (
                  <p className="text-xs text-red-600">{errors.overtimeDate.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime">Mulai</Label>
                  <Input
                    id="startTime"
                    type="time"
                    aria-invalid={!!errors.startTime}
                    {...register('startTime')}
                  />
                  {errors.startTime && (
                    <p className="text-xs text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime">Selesai</Label>
                  <Input
                    id="endTime"
                    type="time"
                    aria-invalid={!!errors.endTime}
                    {...register('endTime')}
                  />
                  {errors.endTime && (
                    <p className="text-xs text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose">Tujuan</Label>
                <textarea
                  id="purpose"
                  rows={3}
                  placeholder="Jelaskan tujuan lembur…"
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                  aria-invalid={!!errors.purpose}
                  {...register('purpose')}
                />
                {errors.purpose && (
                  <p className="text-xs text-red-600">{errors.purpose.message}</p>
                )}
              </div>
              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </p>
              )}
              {formOk && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  Pengajuan lembur berhasil dikirim.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                Ajukan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            {myRequests.isLoading ? (
              <p className="text-sm text-zinc-400">Memuat…</p>
            ) : myRequests.data && myRequests.data.items.length > 0 ? (
              <>
                {/* Mobile View (Cards) */}
                <div className="grid grid-cols-1 gap-3 lg:hidden">
                  {myRequests.data.items.map((r) => (
                    <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 text-sm">{r.requestNumber}</span>
                        <Badge className={badgeClass(r.status)}>{r.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-zinc-500 mb-0.5">Tanggal</p>
                          <p className="font-medium text-zinc-900">{fmtDate(r.overtimeDate)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 mb-0.5">Durasi</p>
                          <p className="font-medium text-zinc-900">{fmtHours(r.hours)} jam</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-zinc-500 mb-0.5">Jam</p>
                          <p className="font-medium text-zinc-900">{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</p>
                        </div>
                      </div>
                      {r.status === 'pending' && (
                        <div className="mt-2 text-right border-t border-zinc-200 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => cancel.mutate(r.id)}
                            disabled={cancel.isPending}
                          >
                            Batalkan Pengajuan
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                        <th className="pb-2 pr-3 font-medium">No. Pengajuan</th>
                        <th className="pb-2 pr-3 font-medium">Tanggal</th>
                        <th className="pb-2 pr-3 font-medium">Jam</th>
                        <th className="pb-2 pr-3 font-medium">Durasi</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 pr-3 font-medium">Diajukan</th>
                        <th className="pb-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.data.items.map((r) => (
                        <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                          <td className="py-2 pr-3 font-medium text-zinc-900">
                            {r.requestNumber}
                          </td>
                          <td className="py-2 pr-3 text-zinc-600">{fmtDate(r.overtimeDate)}</td>
                          <td className="py-2 pr-3 text-zinc-600">
                            {fmtTime(r.startTime)} – {fmtTime(r.endTime)}
                          </td>
                          <td className="py-2 pr-3 text-zinc-600">{fmtHours(r.hours)} jam</td>
                          <td className="py-2 pr-3">
                            <Badge className={badgeClass(r.status)}>{r.status}</Badge>
                          </td>
                          <td className="py-2 pr-3 text-zinc-500">
                            {fmtDateTime(r.createdAt)}
                          </td>
                          <td className="py-2 text-right">
                            {r.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => cancel.mutate(r.id)}
                                disabled={cancel.isPending}
                              >
                                Batalkan
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">Belum ada pengajuan lembur.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
