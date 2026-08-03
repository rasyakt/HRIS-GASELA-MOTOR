'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PerformanceReviewDto } from '@gasela/shared-types';
import { Award, Edit, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate } from '@/lib/format';

interface ManagerItem {
  id: number;
  fullName: string;
}

interface ReviewForm {
  reviewerId: string;
  periodMonth: string;
  periodYear: string;
  reviewDate: string;
  overallScore: string;
  status: string;
  strengths: string;
  areasForImprovement: string;
  goalsNextPeriod: string;
}

const EMPTY_FORM: ReviewForm = {
  reviewerId: '',
  periodMonth: '',
  periodYear: '',
  reviewDate: '',
  overallScore: '',
  status: 'draft',
  strengths: '',
  areasForImprovement: '',
  goalsNextPeriod: '',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
];

export function ReviewsPanel({ employeeId }: { employeeId: number }) {
  const authApi = useAuthApi();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const reviews = useQuery({
    queryKey: ['employee-reviews', employeeId],
    queryFn: () =>
      authApi<PerformanceReviewDto[]>(
        `/api/performance-reviews?employeeId=${employeeId}`,
      ),
  });

  const managers = useQuery({
    queryKey: ['managers-list'],
    queryFn: () => authApi<{ items: ManagerItem[] }>('/api/employees?limit=100'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['employee-reviews', employeeId] });
  };

  const saveReview = useMutation({
    mutationFn: (input: any) => {
      const payload = {
        ...input,
        employeeId,
        reviewerId: Number(input.reviewerId),
        periodMonth: Number(input.periodMonth),
        periodYear: Number(input.periodYear),
        overallScore: input.overallScore === '' ? null : Number(input.overallScore),
        strengths: input.strengths || null,
        areasForImprovement: input.areasForImprovement || null,
        goalsNextPeriod: input.goalsNextPeriod || null,
      };
      return editingId
        ? authApi(`/api/performance-reviews/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : authApi('/api/performance-reviews', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
    },
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => setError(err.message || 'Gagal menyimpan review'),
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/performance-reviews/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  function startEdit(r: PerformanceReviewDto) {
    setEditingId(r.id);
    setForm({
      reviewerId: String(r.reviewerId),
      periodMonth: String(r.periodMonth),
      periodYear: String(r.periodYear),
      reviewDate: r.reviewDate.slice(0, 10),
      overallScore: r.overallScore === null ? '' : String(r.overallScore),
      status: r.status,
      strengths: r.strengths ?? '',
      areasForImprovement: r.areasForImprovement ?? '',
      goalsNextPeriod: r.goalsNextPeriod ?? '',
    });
    setError(null);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.reviewerId) return setError('Reviewer wajib dipilih');
    if (!form.periodMonth || !form.periodYear) return setError('Periode wajib diisi');
    if (!form.reviewDate) return setError('Tanggal review wajib diisi');
    saveReview.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
          <Award className="size-4" />
          Performance Review
        </h4>
        {!showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setError(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Tambah Review
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-200 p-4 space-y-4 bg-zinc-50/50"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rev-reviewer">Reviewer</Label>
              <select
                id="rev-reviewer"
                value={form.reviewerId}
                onChange={(e) => setForm({ ...form, reviewerId: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">Pilih Reviewer</option>
                {managers.data?.items
                  .filter((m) => m.id !== employeeId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label htmlFor="rev-status">Status</Label>
              <select
                id="rev-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="rev-month">Bulan</Label>
              <select
                id="rev-month"
                value={form.periodMonth}
                onChange={(e) => setForm({ ...form, periodMonth: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">Bulan</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="rev-year">Tahun</Label>
              <Input
                id="rev-year"
                type="number"
                min={2000}
                max={2100}
                value={form.periodYear}
                onChange={(e) => setForm({ ...form, periodYear: e.target.value })}
                placeholder="2026"
              />
            </div>
            <div>
              <Label htmlFor="rev-date">Tanggal Review</Label>
              <Input
                id="rev-date"
                type="date"
                value={form.reviewDate}
                onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rev-score">Skor (0-100)</Label>
              <Input
                id="rev-score"
                type="number"
                min={0}
                max={100}
                value={form.overallScore}
                onChange={(e) => setForm({ ...form, overallScore: e.target.value })}
                placeholder="85"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="rev-strengths">Kelebihan</Label>
            <textarea
              id="rev-strengths"
              value={form.strengths}
              onChange={(e) => setForm({ ...form, strengths: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="rev-improve">Area yang Perlu Ditingkatkan</Label>
            <textarea
              id="rev-improve"
              value={form.areasForImprovement}
              onChange={(e) => setForm({ ...form, areasForImprovement: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="rev-goals">Tujuan Periode Berikutnya</Label>
            <textarea
              id="rev-goals"
              value={form.goalsNextPeriod}
              onChange={(e) => setForm({ ...form, goalsNextPeriod: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saveReview.isPending}
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {saveReview.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {editingId ? 'Simpan Perubahan' : 'Simpan Review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {reviews.isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-zinc-500 size-5" />
        </div>
      ) : reviews.data && reviews.data.length > 0 ? (
        <div className="space-y-2">
          {reviews.data.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-200 bg-white"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-zinc-900">
                    {r.periodMonth}/{r.periodYear}
                  </span>
                  {r.overallScore !== null && (
                    <span className="text-sm font-bold text-zinc-700">
                      Skor: {r.overallScore}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    · Reviewer: {r.reviewerName}
                  </span>
                  <span className="text-xs text-zinc-500">· {fmtDate(r.reviewDate)}</span>
                </div>
                {r.strengths && (
                  <p className="text-xs text-zinc-600 mt-1 truncate">{r.strengths}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    r.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : r.status === 'submitted'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? r.status}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded"
                  title="Ubah"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus review ini?')) deleteReview.mutate(r.id);
                  }}
                  className="p-1 text-zinc-400 hover:text-red-600 hover:bg-zinc-50 rounded"
                  title="Hapus"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 py-4 text-center border border-dashed border-zinc-200 rounded-lg">
          Belum ada review untuk karyawan ini.
        </p>
      )}
    </div>
  );
}
