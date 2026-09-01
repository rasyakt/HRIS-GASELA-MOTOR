'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TrainingRecordDto } from '@gasela/shared-types';
import { Edit, GraduationCap, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate, fmtRupiah } from '@/lib/format';

interface TrainingForm {
  trainingName: string;
  trainingProvider: string;
  startDate: string;
  endDate: string;
  durationHours: string;
  cost: string;
  notes: string;
}

const EMPTY_FORM: TrainingForm = {
  trainingName: '',
  trainingProvider: '',
  startDate: '',
  endDate: '',
  durationHours: '',
  cost: '',
  notes: '',
};

export function TrainingPanel({ employeeId }: { employeeId: number }) {
  const authApi = useAuthApi();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TrainingForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const records = useQuery({
    queryKey: ['employee-trainings', employeeId],
    queryFn: () =>
      authApi<TrainingRecordDto[]>(
        `/api/training-records?employeeId=${employeeId}`,
      ),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['employee-trainings', employeeId] });
  };

  const saveTraining = useMutation({
    mutationFn: (input: any) => {
      const payload = {
        ...input,
        employeeId,
        durationHours: input.durationHours === '' ? null : Number(input.durationHours),
        cost: input.cost === '' ? null : Number(input.cost),
        trainingProvider: input.trainingProvider || null,
        notes: input.notes || null,
      };
      return editingId
        ? authApi(`/api/training-records/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : authApi('/api/training-records', {
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
    onError: (err: any) => setError(err.message || 'Gagal menyimpan pelatihan'),
  });

  const deleteTraining = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/training-records/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  function startEdit(r: TrainingRecordDto) {
    setEditingId(r.id);
    setForm({
      trainingName: r.trainingName,
      trainingProvider: r.trainingProvider ?? '',
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate.slice(0, 10),
      durationHours: r.durationHours === null ? '' : String(r.durationHours),
      cost: r.cost === null ? '' : String(r.cost),
      notes: r.notes ?? '',
    });
    setError(null);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.trainingName.trim()) return setError('Nama pelatihan wajib diisi');
    if (!form.startDate || !form.endDate) return setError('Tanggal pelatihan wajib diisi');
    saveTraining.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
          <GraduationCap className="size-4" />
          Pelatihan
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
            Tambah Pelatihan
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
              <Label htmlFor="tr-name">Nama Pelatihan</Label>
              <Input
                id="tr-name"
                value={form.trainingName}
                onChange={(e) => setForm({ ...form, trainingName: e.target.value })}
                placeholder="mis. Training Service Motor"
              />
            </div>
            <div>
              <Label htmlFor="tr-provider">Penyelenggara (Opsional)</Label>
              <Input
                id="tr-provider"
                value={form.trainingProvider}
                onChange={(e) => setForm({ ...form, trainingProvider: e.target.value })}
                placeholder="mis. Yamaha Training Center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tr-start">Tanggal Mulai</Label>
              <Input
                id="tr-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tr-end">Tanggal Selesai</Label>
              <Input
                id="tr-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tr-hours">Durasi (Jam)</Label>
              <Input
                id="tr-hours"
                type="number"
                min={0}
                value={form.durationHours}
                onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                placeholder="24"
              />
            </div>
            <div>
              <Label htmlFor="tr-cost">Biaya (Rupiah)</Label>
              <Input
                id="tr-cost"
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="500000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tr-notes">Catatan</Label>
            <textarea
              id="tr-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saveTraining.isPending}
            >
              {saveTraining.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {editingId ? 'Simpan Perubahan' : 'Simpan Pelatihan'}
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

      {records.isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-zinc-500 size-5" />
        </div>
      ) : records.data && records.data.length > 0 ? (
        <div className="space-y-2">
          {records.data.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-200 bg-white"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-zinc-900 truncate">
                    {t.trainingName}
                  </span>
                  {t.trainingProvider && (
                    <span className="text-xs text-zinc-500">· {t.trainingProvider}</span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-2">
                  <span>
                    {fmtDate(t.startDate)} — {fmtDate(t.endDate)}
                  </span>
                  {t.durationHours !== null && <span>{t.durationHours} jam</span>}
                  {t.cost !== null && <span>{fmtRupiah(t.cost)}</span>}
                </div>
                {t.notes && (
                  <p className="text-xs text-zinc-500 mt-1 truncate">{t.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded"
                  title="Ubah"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus pelatihan ini?')) deleteTraining.mutate(t.id);
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
          Belum ada data pelatihan untuk karyawan ini.
        </p>
      )}
    </div>
  );
}
