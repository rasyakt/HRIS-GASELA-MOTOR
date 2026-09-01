'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  PlusCircle,
  Search,
  Star,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

interface PerformanceReviewItem {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewerId: number;
  reviewerName: string;
  periodMonth: number;
  periodYear: number;
  reviewDate: string;
  overallScore: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  goalsNextPeriod: string | null;
  status: 'draft' | 'submitted' | 'acknowledged';
}

interface EmployeeItem {
  id: number;
  fullName: string;
  employeeNumber: string;
}

const MONTH_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  acknowledged: 'Diakui',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  acknowledged: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 100) * 100));
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-8 text-right">{score}</span>
    </div>
  );
}

function ReviewCard({
  review,
  canManage,
  onEdit,
  onDelete,
}: {
  review: PerformanceReviewItem;
  canManage: boolean;
  onEdit: (r: PerformanceReviewItem) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-shadow">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{review.employeeName}</span>
              <Badge className={`text-[10px] font-semibold ${STATUS_COLORS[review.status]}`}>
                {STATUS_LABELS[review.status]}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Periode: <strong className="text-zinc-800 dark:text-zinc-200">{MONTH_NAMES[review.periodMonth - 1]} {review.periodYear}</strong>
              {' · '}Reviewer: {review.reviewerName}
              {' · '}{fmtDate(review.reviewDate)}
            </p>
            {review.overallScore !== null && (
              <div className="mb-2">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                  <Star className="size-3" /> Skor Keseluruhan
                </p>
                <ScoreBar score={review.overallScore} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canManage && (
              <>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(review)}>
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  onClick={() => onDelete(review.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </Button>
          </div>
        </div>
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            {review.strengths && (
              <div>
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Kekuatan</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{review.strengths}</p>
              </div>
            )}
            {review.areasForImprovement && (
              <div>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5">Area Perbaikan</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{review.areasForImprovement}</p>
              </div>
            )}
            {review.goalsNextPeriod && (
              <div>
                <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-0.5">Target Berikutnya</p>
                <p className="text-xs text-zinc-700 whitespace-pre-wrap">{review.goalsNextPeriod}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const EMPTY_FORM = {
  employeeId: '',
  reviewerId: '',
  periodMonth: String(new Date().getMonth() + 1),
  periodYear: String(new Date().getFullYear()),
  reviewDate: new Date().toISOString().slice(0, 10),
  overallScore: '',
  strengths: '',
  areasForImprovement: '',
  goalsNextPeriod: '',
  status: 'draft',
};

export default function PerformanceReviewsPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = !!user && roleAtLeast(user.role, 'manager');

  useEffect(() => {
    if (user && !canManage) router.replace('/dashboard');
  }, [user, canManage, router]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterEmployee, setFilterEmployee] = useState('');

  const reviews = useQuery<PerformanceReviewItem[]>({
    queryKey: ['performance-reviews'],
    queryFn: () => authApi<PerformanceReviewItem[]>('/api/performance-reviews'),
    enabled: canManage,
  });

  const employees = useQuery<EmployeeItem[]>({
    queryKey: ['employees-simple'],
    queryFn: async () => {
      const res = await authApi<{ items: EmployeeItem[] }>('/api/employees?limit=100');
      return res.items ?? [];
    },
    enabled: canManage,
  });

  const createMut = useMutation({
    mutationFn: (body: object) =>
      authApi<PerformanceReviewItem>('/api/performance-reviews', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance-reviews'] }); closeDrawer(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      authApi<PerformanceReviewItem>(`/api/performance-reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance-reviews'] }); closeDrawer(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/performance-reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-reviews'] }),
  });

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setDrawerOpen(true); }
  function openEdit(r: PerformanceReviewItem) {
    setEditingId(r.id);
    setForm({
      employeeId: String(r.employeeId),
      reviewerId: String(r.reviewerId),
      periodMonth: String(r.periodMonth),
      periodYear: String(r.periodYear),
      reviewDate: r.reviewDate.slice(0, 10),
      overallScore: r.overallScore !== null ? String(r.overallScore) : '',
      strengths: r.strengths ?? '',
      areasForImprovement: r.areasForImprovement ?? '',
      goalsNextPeriod: r.goalsNextPeriod ?? '',
      status: r.status,
    });
    setDrawerOpen(true);
  }
  function closeDrawer() { setDrawerOpen(false); setEditingId(null); setForm(EMPTY_FORM); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      employeeId: Number(form.employeeId),
      reviewerId: Number(form.reviewerId),
      periodMonth: Number(form.periodMonth),
      periodYear: Number(form.periodYear),
      reviewDate: form.reviewDate,
      overallScore: form.overallScore ? Number(form.overallScore) : null,
      strengths: form.strengths || null,
      areasForImprovement: form.areasForImprovement || null,
      goalsNextPeriod: form.goalsNextPeriod || null,
      status: form.status,
    };
    if (editingId !== null) updateMut.mutate({ id: editingId, body });
    else createMut.mutate(body);
  }

  const filtered = reviews.data?.filter((r) =>
    filterEmployee === '' || r.employeeName.toLowerCase().includes(filterEmployee.toLowerCase()),
  ) ?? [];

  const avgScore = filtered.length > 0
    ? filtered.filter((r) => r.overallScore !== null).reduce((a, r) => a + (r.overallScore ?? 0), 0)
      / (filtered.filter((r) => r.overallScore !== null).length || 1)
    : null;

  const isBusy = createMut.isPending || updateMut.isPending;

  if (!user || !canManage) return null;

  const selectCls = 'mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-5 text-blue-400" />
              <h1 className="text-xl font-bold">Performance Review</h1>
            </div>
            <p className="text-sm text-zinc-400">Evaluasi kinerja karyawan per periode</p>
          </div>
          {canManage && (
            <Button onClick={openCreate} className="gap-2 font-semibold shadow-2xs">
              <PlusCircle className="size-4" /> Tambah Review
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-2xs">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-primary">{reviews.data?.length ?? '—'}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Total Review</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-2xs">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {avgScore !== null ? avgScore.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Rata-rata Skor</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-2xs">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {reviews.data?.filter((r) => r.status === 'acknowledged').length ?? '—'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Diakui</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter by employee */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Filter nama karyawan..."
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="pl-9"
          />
        </div>
        {avgScore !== null && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 shadow-2xs">
            <Star className="size-3.5 text-amber-500 fill-amber-500" />
            <span>Rata-rata Skor: <strong className="text-zinc-900 dark:text-white font-bold">{avgScore.toFixed(1)}</strong></span>
          </div>
        )}
      </div>

      {/* List */}
      {reviews.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-zinc-400" />
        </div>
      )}
      {reviews.isError && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center py-8">Gagal memuat data review.</p>
      )}
      {!reviews.isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-zinc-400">
          <BarChart2 className="size-12 mb-3 opacity-30" />
          <p className="text-sm">Belum ada data performance review</p>
          {canManage && (
            <Button variant="outline" className="mt-4 gap-2" onClick={openCreate}>
              <PlusCircle className="size-4" /> Tambah Review Pertama
            </Button>
          )}
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={(id) => {
              if (confirm('Hapus review ini?')) deleteMut.mutate(id);
            }}
          />
        ))}
      </div>

      {/* Centered Modal Popup */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={closeDrawer} />
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
            <div className="pointer-events-auto w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {editingId !== null ? 'Edit Review' : 'Tambah Review'}
                </h3>
                <button onClick={closeDrawer} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <Label htmlFor="pr-employee">Karyawan</Label>
                  <select id="pr-employee" required value={form.employeeId}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    className={selectCls}>
                    <option value="">Pilih karyawan…</option>
                    {employees.data?.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="pr-reviewer">Reviewer</Label>
                  <select id="pr-reviewer" required value={form.reviewerId}
                    onChange={(e) => setForm((f) => ({ ...f, reviewerId: e.target.value }))}
                    className={selectCls}>
                    <option value="">Pilih reviewer…</option>
                    {employees.data?.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pr-month">Periode Bulan</Label>
                    <select id="pr-month" value={form.periodMonth}
                      onChange={(e) => setForm((f) => ({ ...f, periodMonth: e.target.value }))}
                      className={selectCls}>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pr-year">Tahun</Label>
                    <Input id="pr-year" type="number" min={2020} max={2100}
                      value={form.periodYear}
                      onChange={(e) => setForm((f) => ({ ...f, periodYear: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pr-date">Tanggal Review</Label>
                  <Input id="pr-date" type="date" required value={form.reviewDate}
                    onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pr-score">Skor Keseluruhan (0–100, opsional)</Label>
                  <Input id="pr-score" type="number" min={0} max={100} placeholder="mis: 85"
                    value={form.overallScore}
                    onChange={(e) => setForm((f) => ({ ...f, overallScore: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pr-status">Status</Label>
                  <select id="pr-status" value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className={selectCls}>
                    <option value="draft">Draft</option>
                    <option value="submitted">Diajukan</option>
                    <option value="acknowledged">Diakui</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pr-strengths">Kekuatan / Prestasi</Label>
                  <textarea id="pr-strengths" rows={3} value={form.strengths}
                    onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
                    placeholder="Tulis kelebihan karyawan di periode ini…"
                    className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400" />
                </div>
                <div>
                  <Label htmlFor="pr-improve">Area Perbaikan</Label>
                  <textarea id="pr-improve" rows={3} value={form.areasForImprovement}
                    onChange={(e) => setForm((f) => ({ ...f, areasForImprovement: e.target.value }))}
                    placeholder="Hal-hal yang perlu diperbaiki…"
                    className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400" />
                </div>
                <div>
                  <Label htmlFor="pr-goals">Target Periode Berikutnya</Label>
                  <textarea id="pr-goals" rows={3} value={form.goalsNextPeriod}
                    onChange={(e) => setForm((f) => ({ ...f, goalsNextPeriod: e.target.value }))}
                    placeholder="Target & rencana untuk periode selanjutnya…"
                    className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400" />
                </div>

                {(createMut.isError || updateMut.isError) && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {((createMut.error || updateMut.error) as Error)?.message ?? 'Terjadi kesalahan'}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isBusy} className="flex-1 font-semibold">
                    {isBusy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                    {editingId !== null ? 'Simpan Perubahan' : 'Tambah Review'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDrawer}>Batal</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
