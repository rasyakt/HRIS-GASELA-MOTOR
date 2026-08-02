'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateLeaveRequestInput,
  LeaveBalanceDto,
  LeaveRequestDto,
  LeaveTypeDto,
  Paginated,
} from '@gasela/shared-types';
import { createLeaveRequestSchema } from '@gasela/shared-types';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import {
  badgeClass,
  fmtDate,
  fmtDateTime,
  fmtNumber,
  todayInput,
} from '@/lib/format';

export default function LeavePage() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeaveRequestInput>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: { leaveTypeId: undefined as unknown as number, startDate: '', endDate: '', reason: '' },
  });

  const startDate = useWatch({ control, name: 'startDate' });

  const balances = useQuery({
    queryKey: ['leave-balances'],
    queryFn: () => authApi<LeaveBalanceDto[]>('/api/leaves/balances/my'),
  });

  const types = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => authApi<LeaveTypeDto[]>('/api/leaves/types'),
  });

  const myRequests = useQuery({
    queryKey: ['leave-my'],
    queryFn: () =>
      authApi<Paginated<LeaveRequestDto>>('/api/leaves/requests/my?page=1&limit=20'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    queryClient.invalidateQueries({ queryKey: ['leave-my'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateLeaveRequestInput) =>
      authApi('/api/leaves/requests', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidate();
      reset({ leaveTypeId: undefined as unknown as number, startDate: '', endDate: '', reason: '' });
      setFormError(null);
      setFormOk(true);
    },
    onError: (err) => {
      setFormOk(false);
      setFormError(err instanceof Error ? err.message : 'Gagal mengajukan cuti.');
    },
  });

  const cancel = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/leaves/requests/${id}/cancel`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (err) =>
      alert(err instanceof Error ? err.message : 'Gagal membatalkan pengajuan.'),
  });

  function onSubmit(values: CreateLeaveRequestInput) {
    setFormOk(false);
    create.mutate(values);
  }

  const activeTypes = (types.data ?? []).filter((t) => t.isActive);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Cuti</h2>
        <p className="text-sm text-zinc-500">
          Cek saldo, ajukan cuti, dan pantau status pengajuan Anda.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Saldo Cuti</CardTitle>
            </CardHeader>
            <CardContent>
              {balances.isLoading ? (
                <p className="text-sm text-zinc-400">Memuat…</p>
              ) : balances.data && balances.data.length > 0 ? (
                <div className="space-y-3">
                  {balances.data.map((b) => (
                    <div key={b.leaveTypeId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-900">{b.leaveTypeName}</span>
                        <span className="text-zinc-500">
                          {fmtNumber(b.quota)} hr
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-900"
                            style={{
                              width: `${b.quota > 0 ? (b.remaining / b.quota) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-zinc-900">
                          sisa {b.remaining}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        terpakai {b.used} dari kuota {b.quota}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Belum ada saldo cuti.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ajukan Cuti</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTypes.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Tidak ada jenis cuti aktif. Hubungi HRD.
                </p>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="leaveTypeId">Jenis Cuti</Label>
                    <select
                      id="leaveTypeId"
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                      aria-invalid={!!errors.leaveTypeId}
                      {...register('leaveTypeId', { setValueAs: (v) => Number(v) })}
                    >
                      <option value="">Pilih jenis cuti…</option>
                      {activeTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (sisa {t.annualQuota} hr)
                        </option>
                      ))}
                    </select>
                    {errors.leaveTypeId && (
                      <p className="text-xs text-red-600">{errors.leaveTypeId.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate">Tanggal Mulai</Label>
                      <Input
                        id="startDate"
                        type="date"
                        min={todayInput()}
                        aria-invalid={!!errors.startDate}
                        {...register('startDate')}
                      />
                      {errors.startDate && (
                        <p className="text-xs text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate">Tanggal Selesai</Label>
                      <Input
                        id="endDate"
                        type="date"
                        min={startDate || todayInput()}
                        aria-invalid={!!errors.endDate}
                        {...register('endDate')}
                      />
                      {errors.endDate && (
                        <p className="text-xs text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Alasan</Label>
                    <textarea
                      id="reason"
                      rows={3}
                      placeholder="Tuliskan alasan pengajuan cuti…"
                      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                      aria-invalid={!!errors.reason}
                      {...register('reason')}
                    />
                    {errors.reason && (
                      <p className="text-xs text-red-600">{errors.reason.message}</p>
                    )}
                  </div>
                  {formError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      {formError}
                    </p>
                  )}
                  {formOk && (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      Pengajuan cuti berhasil dikirim.
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
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            {myRequests.isLoading ? (
              <p className="text-sm text-zinc-400">Memuat…</p>
            ) : myRequests.data && myRequests.data.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                      <th className="pb-2 pr-3 font-medium">No. Pengajuan</th>
                      <th className="pb-2 pr-3 font-medium">Jenis</th>
                      <th className="pb-2 pr-3 font-medium">Tanggal</th>
                      <th className="pb-2 pr-3 font-medium">Hari</th>
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
                        <td className="py-2 pr-3 text-zinc-600">{r.leaveTypeName}</td>
                        <td className="py-2 pr-3 text-zinc-600">
                          {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                        </td>
                        <td className="py-2 pr-3 text-zinc-600">{r.totalDays}</td>
                        <td className="py-2 pr-3">
                          <Badge className={badgeClass(r.status)}>{r.status}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-zinc-500">{fmtDateTime(r.createdAt)}</td>
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
            ) : (
              <p className="text-sm text-zinc-500">Belum ada pengajuan cuti.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
