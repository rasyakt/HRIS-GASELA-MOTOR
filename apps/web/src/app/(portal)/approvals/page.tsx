'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LeaveRequestDto,
  OvertimeRequestDto,
  Paginated,
} from '@gasela/shared-types';
import { Check, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate, fmtDateTime, fmtHours, fmtTime, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

export default function ApprovalsPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !roleAtLeast(user.role, 'manager')) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const leavePending = useQuery({
    queryKey: ['approvals-leave'],
    queryFn: () =>
      authApi<Paginated<LeaveRequestDto>>('/api/leaves/requests?status=pending&limit=50'),
  });

  const overtimePending = useQuery({
    queryKey: ['approvals-overtime'],
    queryFn: () =>
      authApi<Paginated<OvertimeRequestDto>>('/api/overtime/requests?status=pending&limit=50'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['approvals-leave'] });
    queryClient.invalidateQueries({ queryKey: ['approvals-overtime'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const decideLeave = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: number;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) =>
      authApi(`/api/leaves/requests/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status, rejectionReason }),
      }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      setRejectError(null);
      invalidate();
    },
  });

  const decideOvertime = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: 'approved' | 'rejected';
    }) =>
      authApi(`/api/overtime/requests/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidate,
  });

  function submitReject(id: number, kind: 'leave' | 'overtime') {
    if (kind === 'leave') {
      if (rejectReason.trim().length < 5) {
        setRejectError('Alasan penolakan minimal 5 karakter.');
        return;
      }
      decideLeave.mutate({ id, status: 'rejected', rejectionReason: rejectReason.trim() });
    } else {
      decideOvertime.mutate({ id, status: 'rejected' });
    }
  }

  if (!user || !roleAtLeast(user.role, 'manager')) {
    return null;
  }

  const leaveItems = leavePending.data?.items ?? [];
  const overtimeItems = overtimePending.data?.items ?? [];
  const loading = leavePending.isLoading || overtimePending.isLoading;
  const busy = decideLeave.isPending || decideOvertime.isPending;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Persetujuan</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Proses pengajuan cuti dan lembur yang menunggu keputusan Anda.
        </p>
      </div>

      {loading && <p className="text-sm text-zinc-400">Memuat…</p>}

      <Card>
        <CardHeader>
          <CardTitle>
            Pengajuan Cuti Menunggu
            <Badge className="ml-2">{leaveItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveItems.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Tidak ada pengajuan cuti menunggu.</p>
          ) : (
            <div className="space-y-3">
              {leaveItems.map((r) => (
                <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {r.employeeName}
                        <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                          {r.department}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {r.requestNumber} · {r.leaveTypeName} · {fmtDate(r.startDate)} –{' '}
                        {fmtDate(r.endDate)} ({r.totalDays} hari)
                      </div>
                      {r.reason && (
                        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">“{r.reason}”</div>
                      )}
                      <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Diajukan {fmtDateTime(r.createdAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="xs"
                        onClick={() => decideLeave.mutate({ id: r.id, status: 'approved' })}
                        disabled={busy}
                      >
                        <Check data-icon="inline-start" />
                        Setujui
                      </Button>
                      {rejectingId !== r.id ? (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setRejectingId(r.id);
                            setRejectError(null);
                          }}
                          disabled={busy}
                        >
                          <X data-icon="inline-start" />
                          Tolak
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Alasan penolakan…"
                            className="h-7 w-48 rounded-lg border border-input bg-transparent dark:bg-zinc-800 px-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus-visible:border-ring"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => submitReject(r.id, 'leave')}
                          >
                            {decideLeave.isPending ? (
                              <Loader2 className="animate-spin" data-icon="inline-start" />
                            ) : (
                              <X data-icon="inline-start" />
                            )}
                            Tolak
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setRejectingId(null)}
                          >
                            Batal
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {rejectingId === r.id && rejectError && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{rejectError}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Pengajuan Lembur Menunggu
            <Badge className="ml-2">{overtimeItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overtimeItems.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Tidak ada pengajuan lembur menunggu.</p>
          ) : (
            <div className="space-y-3">
              {overtimeItems.map((r) => (
                <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {r.employeeName}
                        <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                          {r.department}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {r.requestNumber} · {fmtDate(r.overtimeDate)} · {fmtTime(r.startTime)} –{' '}
                        {fmtTime(r.endTime)} ({fmtHours(r.hours)} jam)
                      </div>
                      {r.purpose && (
                        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">“{r.purpose}”</div>
                      )}
                      <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Diajukan {fmtDateTime(r.createdAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="xs"
                        onClick={() => decideOvertime.mutate({ id: r.id, status: 'approved' })}
                        disabled={busy}
                      >
                        <Check data-icon="inline-start" />
                        Setujui
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => decideOvertime.mutate({ id: r.id, status: 'rejected' })}
                        disabled={busy}
                      >
                        <X data-icon="inline-start" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
