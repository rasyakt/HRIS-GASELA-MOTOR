'use client';

/**
 * landing-cms/page.tsx
 * ─────────────────────
 * Landing Page CMS — admin-only editor for every content section of the
 * public landing page (/landing). Loads the merged content from the
 * backend, edits fields in a generic recursive form, saves per section,
 * uploads images (category: landing) and can reset a section to default.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import {
  LANDING_SECTIONS,
  type LandingContent,
  type LandingSection,
} from '@gasela/shared-types';

type JsonPrimitive = string | number | boolean;
type JsonValue = JsonPrimitive | null | JsonValue[] | { [k: string]: JsonValue };
type SectionData = Record<string, JsonValue>;

const SECTION_LABELS: Record<LandingSection, string> = {
  nav: 'Navigasi (Navbar)',
  hero: 'Hero (Beranda)',
  marquee: 'Marquee (Ticker)',
  about: 'Biografi & Reputasi',
  portfolio: 'Portofolio Bisnis',
  contact: 'Kontak & Direktori',
  footer: 'Footer',
};

const IMAGE_FIELD = /(image|logo|icon|photo|background)/i;
const TEXTAREA_FIELD = /(desc|subtitle|paragraph|quote|address|copy|title)/i;

function isPlainObject(v: JsonValue): v is { [k: string]: JsonValue } {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isArrayOfObjects(v: JsonValue): v is { [k: string]: JsonValue }[] {
  return Array.isArray(v) && v.every(isPlainObject);
}

function isArrayOfPrimitives(v: JsonValue): v is JsonPrimitive[] {
  return Array.isArray(v) && v.every((x) => typeof x !== 'object' || x === null);
}

function fieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function emptyLike(template: { [k: string]: JsonValue }): { [k: string]: JsonValue } {
  const out: { [k: string]: JsonValue } = {};
  for (const [k, v] of Object.entries(template)) {
    if (isArrayOfObjects(v)) out[k] = [emptyLike(v[0])];
    else if (isArrayOfPrimitives(v)) out[k] = [];
    else if (typeof v === 'string') out[k] = '';
    else if (typeof v === 'number') out[k] = 0;
    else if (typeof v === 'boolean') out[k] = false;
    else out[k] = null;
  }
  return out;
}

function FieldEditor({
  label,
  value,
  onChange,
  isImage,
  isTextarea,
}: {
  label: string;
  value: JsonValue;
  onChange: (next: JsonValue) => void;
  isImage: boolean;
  isTextarea: boolean;
}) {
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border-zinc-300 accent-amber-600"
        />
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </label>
    );
  }

  const strValue = value == null ? '' : String(value);

  if (isImage) {
    return (
      <ImageFieldEditor label={label} value={strValue} onChange={(v) => onChange(v)} />
    );
  }

  if (isTextarea) {
    return (
      <div>
        <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</Label>
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div>
        <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</Label>
        <Input
          type="number"
          value={strValue}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="mt-2 rounded-xl h-11 px-4 shadow-sm focus-visible:ring-amber-500/20 dark:border-zinc-800"
        />
      </div>
    );
  }

  return (
    <div>
      <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</Label>
      <Input 
        value={strValue} 
        onChange={(e) => onChange(e.target.value)} 
        className="mt-2 rounded-xl h-11 px-4 shadow-sm focus-visible:ring-amber-500/20 dark:border-zinc-800" 
      />
    </div>
  );
}

function ImageFieldEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'landing');
      const res = await api<{ data: { url: string } }>('/api/uploads', {
        method: 'POST',
        body: fd,
        token,
        headers: {}, // biarkan browser set multipart boundary
      });
      onChange(res.data.url);
    } catch {
      setError('Upload gagal. Pastikan file < 5MB dan format jpg/png/webp/svg.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</Label>
      <div className="mt-2 flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/path/gambar.png atau /api/uploads/landing/..."
            className="rounded-xl h-11 px-4 shadow-sm focus-visible:ring-amber-500/20 dark:border-zinc-800 pr-10"
          />
          {value && (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              title="Lihat gambar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors dark:hover:text-zinc-200"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 h-11 rounded-xl px-4 shadow-sm bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          {uploading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ImagePlus className="size-4 mr-2" />}
          {uploading ? 'Mengunggah…' : 'Upload'}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SectionEditor({
  data,
  onChange,
}: {
  data: SectionData;
  onChange: (next: SectionData) => void;
}) {
  const set = (key: string, value: JsonValue) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-8">
      {Object.entries(data).map(([key, value]) => {
        if (isArrayOfObjects(value)) {
          return (
            <div key={key} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-base font-bold text-zinc-900 dark:text-white">{fieldLabel(key)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set(key, [...value, emptyLike(value[0] ?? {})])}
                  className="shadow-sm"
                >
                  <Plus className="size-4 mr-1.5" /> Tambah Item
                </Button>
              </div>
              <div className="space-y-4">
                {value.map((item, idx) => (
                  <div
                    key={idx}
                    className="group rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 space-y-4 relative transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item #{idx + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => set(key, value.filter((_, i) => i !== idx))}
                        className="size-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus Item"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {Object.entries(item).map(([subKey, subValue]) => (
                      <div key={subKey} className="pb-1">
                        <FieldEditor
                          label={fieldLabel(subKey)}
                          value={subValue}
                          isImage={IMAGE_FIELD.test(subKey)}
                          isTextarea={TEXTAREA_FIELD.test(subKey)}
                          onChange={(next) =>
                            set(
                              key,
                              value.map((x, i) => (i === idx ? { ...x, [subKey]: next } : x)),
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (Array.isArray(value)) {
          // Array primitif (mis. paragraphs) → satu textarea, satu baris per entri
          return (
            <div key={key}>
              <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{fieldLabel(key)}</Label>
              <textarea
                value={value.map((x) => String(x)).join('\n')}
                onChange={(e) => set(key, e.target.value.split('\n'))}
                rows={Math.max(4, value.length)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1.5 text-xs text-zinc-500">Satu item per baris.</p>
            </div>
          );
        }

        return (
          <div key={key} className="pb-1">
            <FieldEditor
              label={fieldLabel(key)}
              value={value}
              isImage={IMAGE_FIELD.test(key)}
              isTextarea={TEXTAREA_FIELD.test(key)}
              onChange={(next) => set(key, next)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function LandingCmsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<LandingSection>('hero');
  const [draft, setDraft] = useState<Record<string, SectionData> | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const isAdmin = !!user && user.role === 'landing_admin';

  const contentQuery = useQuery<{ content: LandingContent; meta: Record<string, { updatedAt: string }> }>({
    queryKey: ['landing-admin'],
    queryFn: () => api('/api/landing/sections', { token }),
    enabled: isAdmin && !!token,
  });

  const loadedDraft = draft ?? (contentQuery.data ? toDraft(contentQuery.data.content) : null);

  function toDraft(content: LandingContent): Record<string, SectionData> {
    return Object.fromEntries(
      Object.entries(content).map(([k, v]) => [k, v as unknown as SectionData]),
    ) as Record<string, SectionData>;
  }

  const saveMutation = useMutation({
    mutationFn: async (section: LandingSection) => {
      if (!loadedDraft) throw new Error('Konten belum dimuat');
      return api(`/api/landing/sections/${section}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(loadedDraft[section]),
      });
    },
    onSuccess: () => {
      setNotice({ type: 'ok', text: 'Section berhasil disimpan. Landing page otomatis menampilkan konten baru.' });
      queryClient.invalidateQueries({ queryKey: ['landing-admin'] });
    },
    onError: (err: Error) => {
      setNotice({ type: 'err', text: `Gagal menyimpan: ${err.message}` });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (section: LandingSection) =>
      api(`/api/landing/sections/${section}`, { method: 'DELETE', token }),
    onSuccess: () => {
      setNotice({ type: 'ok', text: 'Section dikembalikan ke konten default.' });
      queryClient.invalidateQueries({ queryKey: ['landing-admin'] });
    },
    onError: (err: Error) => {
      setNotice({ type: 'err', text: `Gagal reset: ${err.message}` });
    },
  });

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="size-5" />
          Akses ditolak — halaman ini khusus akun Admin Landing Page (landing_admin).
        </div>
      </div>
    );
  }

  if (contentQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (contentQuery.isError || !loadedDraft) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          Gagal memuat konten landing page dari server.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Landing Page CMS
          </h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Kelola seluruh teks, tautan, dan gambar situs publik{' '}
            <a href="/landing" target="_blank" rel="noopener noreferrer" className="text-amber-600 font-medium hover:underline dark:text-amber-400">
              /landing
            </a>{' '}
            — perubahan langsung tampil tanpa perlu deploy ulang.
          </p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['landing-admin'] })} className="shrink-0 bg-white shadow-sm dark:bg-zinc-900">
          <RefreshCw className="size-4 mr-2" /> Muat Ulang
        </Button>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            notice.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {notice.type === 'ok' ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-500" /> : <AlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-500" />}
          <span className="font-medium">{notice.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Nav */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 space-y-1">
          <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Section Konten
          </h2>
          <nav className="space-y-1">
            {LANDING_SECTIONS.map((section) => {
              const isCustom = !!contentQuery.data?.meta?.[section];
              const isActive = active === section;
              return (
                <button
                  key={section}
                  onClick={() => setActive(section)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{SECTION_LABELS[section]}</span>
                  {isCustom && (
                    <span 
                      className={`h-2 w-2 rounded-full ${isActive ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} 
                      title="Telah dimodifikasi" 
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-9">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
            {/* Sticky Editor Header */}
            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 bg-white/80 p-5 sm:px-8 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
              <div>
                <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {SECTION_LABELS[active]}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Sesuaikan konten untuk bagian ini.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Kembalikan section "${SECTION_LABELS[active]}" ke konten default?`)) {
                      resetMutation.mutate(active);
                    }
                  }}
                  disabled={resetMutation.isPending}
                  className="bg-white shadow-sm hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RotateCcw className="size-4 sm:mr-2" /> <span className="hidden sm:inline">Reset Default</span>
                </Button>
                <Button
                  onClick={() => saveMutation.mutate(active)}
                  disabled={saveMutation.isPending}
                  className="bg-amber-600 shadow-sm hover:bg-amber-700 text-white transition-colors"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-4 sm:mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Simpan Perubahan</span>
                  <span className="sm:hidden">Simpan</span>
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="p-5 sm:p-8">
              <SectionEditor
                data={loadedDraft[active]}
                onChange={(next) =>
                  setDraft((d) => ({ ...(d ?? toDraft(contentQuery.data!.content)), [active]: next }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
