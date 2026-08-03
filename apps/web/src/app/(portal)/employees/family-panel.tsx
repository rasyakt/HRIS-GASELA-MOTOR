'use client';

import { useState } from 'react';
import { Plus, Trash2, Users, HeartHandshake, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthApi } from '@/lib/auth-api';

interface FamilyMember {
  id: number;
  fullName: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling';
  idCardNumber?: string | null;
  birthDate?: string | null;
  gender?: 'male' | 'female' | null;
  isBpjsDependent: boolean;
}

interface FamilyPanelProps {
  employeeId: number;
  familyMembers?: FamilyMember[];
  onRefresh?: () => void;
}

const RELATION_MAP = {
  spouse: 'Istri / Suami',
  child: 'Anak',
  parent: 'Orang Tua',
  sibling: 'Saudara Kandung',
};

export function FamilyPanel({ employeeId, familyMembers = [], onRefresh }: FamilyPanelProps) {
  const authApi = useAuthApi();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    relationship: 'spouse' as 'spouse' | 'child' | 'parent' | 'sibling',
    idCardNumber: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    isBpjsDependent: false,
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi(`/api/employees/${employeeId}/family`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          relationship: form.relationship,
          idCardNumber: form.idCardNumber || null,
          birthDate: form.birthDate || null,
          gender: form.gender,
          isBpjsDependent: form.isBpjsDependent,
        }),
      });

      setForm({
        fullName: '',
        relationship: 'spouse',
        idCardNumber: '',
        birthDate: '',
        gender: 'male',
        isBpjsDependent: false,
      });
      setIsAdding(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan anggota keluarga');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(familyId: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota keluarga ini?')) return;
    setDeletingId(familyId);
    try {
      await authApi(`/api/employees/${employeeId}/family/${familyId}`, {
        method: 'DELETE',
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="size-4 text-emerald-600" /> Data Keluarga & Tanggungan BPJS
          </h3>
          <p className="text-xs text-zinc-500">
            Daftar anggota keluarga karyawan yang terdaftar dan/atau menjadi tanggungan BPJS.
          </p>
        </div>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs shrink-0 gap-1.5"
          >
            <Plus className="size-3.5" /> Tambah Anggota
          </Button>
        )}
      </div>

      {/* Form Add */}
      {isAdding && (
        <form onSubmit={handleAdd} className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Tambah Anggota Keluarga Baru
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="text-xs text-zinc-500 h-7 px-2"
            >
              Batal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Nama Lengkap *</Label>
              <Input
                required
                placeholder="mis. Siti Aminah"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="bg-white text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Hubungan *</Label>
              <select
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value as any })}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="spouse">Istri / Suami</option>
                <option value="child">Anak</option>
                <option value="parent">Orang Tua</option>
                <option value="sibling">Saudara Kandung</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">NIK (KTP/KK)</Label>
              <Input
                placeholder="16 digit NIK"
                value={form.idCardNumber}
                onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })}
                className="bg-white text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Tanggal Lahir</Label>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="bg-white text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Jenis Kelamin</Label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isBpjs"
                checked={form.isBpjsDependent}
                onChange={(e) => setForm({ ...form, isBpjsDependent: e.target.checked })}
                className="size-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="isBpjs" className="text-xs font-medium text-zinc-700 cursor-pointer">
                Tanggungan BPJS (Kesehatan / TK)
              </Label>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-500 text-xs gap-1.5"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : 'Simpan Anggota'}
            </Button>
          </div>
        </form>
      )}

      {/* List Members */}
      {familyMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
          <HeartHandshake className="mx-auto size-8 text-zinc-300 mb-2" />
          <p className="text-xs font-medium text-zinc-500">Belum ada data anggota keluarga yang dicatat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="group relative flex items-start justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">{member.fullName}</span>
                  <Badge className="text-[10px] bg-zinc-100 text-zinc-700 border-zinc-200">
                    {RELATION_MAP[member.relationship] || member.relationship}
                  </Badge>
                </div>
                {member.idCardNumber && (
                  <p className="text-xs text-zinc-500 font-mono">NIK: {member.idCardNumber}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  {member.isBpjsDependent ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium">
                      Tanggungan BPJS
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-zinc-400">Non-BPJS</span>
                  )}
                  {member.gender && (
                    <span className="text-[10px] text-zinc-400 capitalize">
                      · {member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === member.id}
                onClick={() => handleDelete(member.id)}
                className="text-zinc-400 hover:text-red-600 size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deletingId === member.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
