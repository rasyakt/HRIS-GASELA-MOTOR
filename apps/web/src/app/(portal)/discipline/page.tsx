'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Search, FileText, Loader2, ShieldAlert, CheckCircle2, User, Calendar, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAuthApi } from '@/lib/auth-api';
import { roleAtLeast, fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WarningItem {
  id: number;
  letterNumber: string;
  level: 'SP1' | 'SP2' | 'SP3';
  violationReason: string;
  issuedDate: string;
  effectiveUntil: string;
  documentUrl?: string | null;
  employee: {
    id: number;
    employeeNumber: string;
    fullName: string;
    department?: { name: string } | null;
    position?: { name: string } | null;
  };
  issuedBy?: { fullName: string } | null;
}

const SP_BADGE_STYLE = {
  SP1: 'bg-amber-100 text-amber-800 border-amber-200',
  SP2: 'bg-orange-100 text-orange-800 border-orange-200',
  SP3: 'bg-red-100 text-red-800 border-red-200',
};

export default function DisciplinePage() {
  const user = useAuthStore((s) => s.user);
  const authApi = useAuthApi();
  const queryClient = useQueryClient();

  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    employeeId: '',
    letterNumber: '',
    level: 'SP1' as 'SP1' | 'SP2' | 'SP3',
    violationReason: '',
    issuedDate: new Date().toISOString().split('T')[0],
    effectiveUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 6 months
    documentUrl: '',
  });

  // Query warnings list
  const warningsQuery = useQuery({
    queryKey: ['warning-letters', selectedLevel, search],
    queryFn: () =>
      authApi<{ items: WarningItem[]; total: number }>(
        `/api/warning-letters?${selectedLevel !== 'all' ? `level=${selectedLevel}` : ''}${
          search ? `&search=${encodeURIComponent(search)}` : ''
        }`,
      ),
  });

  // Query employee list for dropdown selection
  const employeesQuery = useQuery({
    queryKey: ['employee-options'],
    queryFn: () => authApi<{ items: any[] }>('/api/employees?limit=100'),
    enabled: isModalOpen,
  });

  // Create Warning Letter Mutation
  const createMutation = useMutation({
    mutationFn: (body: any) =>
      authApi('/api/warning-letters', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-letters'] });
      setIsModalOpen(false);
      setErrorMsg('');
      setForm({
        employeeId: '',
        letterNumber: '',
        level: 'SP1',
        violationReason: '',
        issuedDate: new Date().toISOString().split('T')[0],
        effectiveUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        documentUrl: '',
      });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Gagal menerbitkan surat peringatan');
    },
  });

  // Delete Warning Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/warning-letters/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-letters'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.letterNumber || !form.violationReason) {
      setErrorMsg('Semua kolom wajib diisi');
      return;
    }
    createMutation.mutate({
      employeeId: Number(form.employeeId),
      letterNumber: form.letterNumber,
      level: form.level,
      violationReason: form.violationReason,
      issuedDate: form.issuedDate,
      effectiveUntil: form.effectiveUntil,
      documentUrl: form.documentUrl || null,
    });
  };

  const isHR = user && roleAtLeast(user.role, 'hrd');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-zinc-900 p-6 text-white shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-6 text-amber-400" />
            <h1 className="text-xl font-bold">Manajemen Disiplin & Surat Peringatan</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Pencatatan resmi Surat Peringatan (SP1, SP2, SP3) dan rekam jejak disiplin karyawan Gasela Motor.
          </p>
        </div>
        {isHR && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 shrink-0"
          >
            <Plus className="size-4" /> Terbitkan SP Baru
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Level Tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
              {[
                { label: 'Semua Status', value: 'all' },
                { label: 'SP 1', value: 'SP1' },
                { label: 'SP 2', value: 'SP2' },
                { label: 'SP 3', value: 'SP3' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedLevel(tab.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedLevel === tab.value
                      ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-900 dark:text-white'
                      : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput.trim());
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Cari NIK / Nama / No Surat..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64 text-xs h-9"
              />
              <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">
                <Search className="size-3.5 mr-1" /> Cari
              </Button>
            </form>
          </div>

          {/* List Table */}
          {warningsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-zinc-400 size-6" />
            </div>
          ) : warningsQuery.data && warningsQuery.data.items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  <tr>
                    <th className="p-3">No. Surat</th>
                    <th className="p-3">Tingkat SP</th>
                    <th className="p-3">Karyawan</th>
                    <th className="p-3">Departemen / Posisi</th>
                    <th className="p-3">Alasan Pelanggaran</th>
                    <th className="p-3">Masa Berlaku</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-900 dark:text-zinc-100">
                  {warningsQuery.data.items.map((sp) => {
                    const isExpired = new Date(sp.effectiveUntil) < new Date();
                    return (
                      <tr key={sp.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3 font-mono font-medium">{sp.letterNumber}</td>
                        <td className="p-3">
                          <Badge className={`${SP_BADGE_STYLE[sp.level]} text-[10px] font-bold`}>
                            {sp.level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{sp.employee.fullName}</div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">NIK: {sp.employee.employeeNumber}</div>
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-300">
                          <div>{sp.employee.department?.name || '—'}</div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{sp.employee.position?.name || '—'}</div>
                        </td>
                        <td className="p-3 max-w-xs truncate" title={sp.violationReason}>
                          {sp.violationReason}
                        </td>
                        <td className="p-3">
                          <div>{fmtDate(sp.issuedDate)} s/d {fmtDate(sp.effectiveUntil)}</div>
                          {isExpired ? (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Status: Selesai</span>
                          ) : (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">Status: Aktif</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isHR && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus catatan SP ini?')) {
                                  deleteMutation.mutate(sp.id);
                                }
                              }}
                              className="size-7 p-0 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tidak ada Surat Peringatan (SP) yang tercatat</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Semua karyawan berdisiplin tinggi atau sesuai dengan kata kunci pencarian.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form Terbitkan SP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" /> Terbitkan Surat Peringatan (SP)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Pilih Karyawan *</Label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employeesQuery.data?.items.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeNumber}) — {emp.department?.name || 'No Dept'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Nomor Surat SP *</Label>
                  <Input
                    required
                    placeholder="mis. SP/001/HRD/2026"
                    value={form.letterNumber}
                    onChange={(e) => setForm({ ...form, letterNumber: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Tingkat SP *</Label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  >
                    <option value="SP1">Surat Peringatan 1 (SP1)</option>
                    <option value="SP2">Surat Peringatan 2 (SP2)</option>
                    <option value="SP3">Surat Peringatan 3 (SP3)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Alasan Pelanggaran *</Label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan jenis dan tanggal terjadinya pelanggaran secara detail..."
                  value={form.violationReason}
                  onChange={(e) => setForm({ ...form, violationReason: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 bg-white p-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Tanggal Terbit</Label>
                  <Input
                    type="date"
                    value={form.issuedDate}
                    onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Berlaku Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={form.effectiveUntil}
                    onChange={(e) => setForm({ ...form, effectiveUntil: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-xs font-medium text-red-500">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  size="sm"
                  className="text-xs gap-1.5"
                >
                  {createMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Terbitkan Surat Peringatan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
