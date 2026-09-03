'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssetAssignmentDto } from '@gasela/shared-types';
import { Edit, Loader2, Package, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate } from '@/lib/format';

interface AssetForm {
  assetName: string;
  assetCode: string;
  serialNumber: string;
  assignmentDate: string;
  returnDate: string;
  status: string;
  conditionNotes: string;
}

const EMPTY_FORM: AssetForm = {
  assetName: '',
  assetCode: '',
  serialNumber: '',
  assignmentDate: '',
  returnDate: '',
  status: 'assigned',
  conditionNotes: '',
};

export function AssetPanel({ employeeId }: { employeeId: number }) {
  const authApi = useAuthApi();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const assets = useQuery({
    queryKey: ['employee-assets', employeeId],
    queryFn: () =>
      authApi<AssetAssignmentDto[]>(
        `/api/asset-assignments?employeeId=${employeeId}`,
      ),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['employee-assets', employeeId] });
  };

  const saveAsset = useMutation({
    mutationFn: (input: any) => {
      const payload = {
        ...input,
        employeeId,
        serialNumber: input.serialNumber || null,
        returnDate: input.returnDate || null,
        conditionNotes: input.conditionNotes || null,
      };
      return editingId
        ? authApi(`/api/asset-assignments/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : authApi('/api/asset-assignments', {
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
    onError: (err: any) => setError(err.message || 'Gagal menyimpan aset'),
  });

  const markReturned = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/asset-assignments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'returned' }),
      }),
    onSuccess: invalidate,
  });

  const deleteAsset = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/asset-assignments/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  function startEdit(a: AssetAssignmentDto) {
    setEditingId(a.id);
    setForm({
      assetName: a.assetName,
      assetCode: a.assetCode,
      serialNumber: a.serialNumber ?? '',
      assignmentDate: a.assignmentDate.slice(0, 10),
      returnDate: a.returnDate ? a.returnDate.slice(0, 10) : '',
      status: a.status,
      conditionNotes: a.conditionNotes ?? '',
    });
    setError(null);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.assetName.trim()) return setError('Nama aset wajib diisi');
    if (!form.assetCode.trim()) return setError('Kode aset wajib diisi');
    if (!form.assignmentDate) return setError('Tanggal penugasan wajib diisi');
    saveAsset.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
          <Package className="size-4" />
          Aset Perusahaan
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
            Tambah Aset
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
              <Label htmlFor="as-name">Nama Aset</Label>
              <Input
                id="as-name"
                value={form.assetName}
                onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                placeholder="mis. Laptop Lenovo ThinkPad"
              />
            </div>
            <div>
              <Label htmlFor="as-code">Kode Aset</Label>
              <Input
                id="as-code"
                value={form.assetCode}
                onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
                placeholder="AST-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="as-serial">Nomor Seri (Opsional)</Label>
              <Input
                id="as-serial"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder="SN123456789"
              />
            </div>
            <div>
              <Label htmlFor="as-status">Status</Label>
              <select
                id="as-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="assigned">Dipinjamkan</option>
                <option value="returned">Dikembalikan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="as-assign">Tanggal Penugasan</Label>
              <Input
                id="as-assign"
                type="date"
                value={form.assignmentDate}
                onChange={(e) => setForm({ ...form, assignmentDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="as-return">Tanggal Kembali (Opsional)</Label>
              <Input
                id="as-return"
                type="date"
                value={form.returnDate}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="as-notes">Catatan Kondisi</Label>
            <textarea
              id="as-notes"
              value={form.conditionNotes}
              onChange={(e) => setForm({ ...form, conditionNotes: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saveAsset.isPending}
            >
              {saveAsset.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {editingId ? 'Simpan Perubahan' : 'Simpan Aset'}
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

      {assets.isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-zinc-500 size-5" />
        </div>
      ) : assets.data && assets.data.length > 0 ? (
        <div className="space-y-2">
          {assets.data.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-200 bg-white"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-zinc-900 truncate">
                    {a.assetName}
                  </span>
                  <span className="text-xs text-zinc-500">({a.assetCode})</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.status === 'assigned'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {a.status === 'assigned' ? 'Dipinjamkan' : 'Dikembalikan'}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-2">
                  <span>Diberikan: {fmtDate(a.assignmentDate)}</span>
                  {a.serialNumber && <span>SN: {a.serialNumber}</span>}
                  {a.returnDate && <span>Dikembalikan: {fmtDate(a.returnDate)}</span>}
                </div>
                {a.conditionNotes && (
                  <p className="text-xs text-zinc-500 mt-1 truncate">
                    {a.conditionNotes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {a.status === 'assigned' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Tandai '${a.assetName}' sudah dikembalikan?`)) {
                        markReturned.mutate(a.id);
                      }
                    }}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Tandai dikembalikan"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded"
                  title="Ubah"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus penugasan aset ini?')) deleteAsset.mutate(a.id);
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
          Belum ada aset yang dipinjamkan ke karyawan ini.
        </p>
      )}
    </div>
  );
}
