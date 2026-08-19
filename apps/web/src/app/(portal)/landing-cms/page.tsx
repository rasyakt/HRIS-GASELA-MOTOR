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
        <Label>{label}</Label>
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div>
        <Label>{label}</Label>
        <Input
          type="number"
          value={strValue}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="mt-1.5"
        />
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Input value={strValue} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
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
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/path/gambar.png atau /api/uploads/landing/..."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {uploading ? 'Mengunggah…' : 'Upload'}
        </Button>
        {value && (
          <a href={value} target="_blank" rel="noopener noreferrer" title="Lihat gambar">
            <ExternalLink className="size-4 text-zinc-400 hover:text-zinc-700" />
          </a>
        )}
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
    <div className="space-y-5">
      {Object.entries(data).map(([key, value]) => {
        if (isArrayOfObjects(value)) {
          return (
            <div key={key} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{fieldLabel(key)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set(key, [...value, emptyLike(value[0] ?? {})])}
                >
                  <Plus className="size-3.5 mr-1" /> Tambah
                </Button>
              </div>
              {value.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/60 dark:border-zinc-800/80 dark:bg-zinc-900/40 p-3 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {fieldLabel(key)} #{idx + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => set(key, value.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {Object.entries(item).map(([subKey, subValue]) => (
                    <FieldEditor
                      key={subKey}
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
                  ))}
                </div>
              ))}
            </div>
          );
        }

        if (Array.isArray(value)) {
          // Array primitif (mis. paragraphs) → satu textarea, satu baris per entri
          return (
            <div key={key}>
              <Label>{fieldLabel(key)}</Label>
              <textarea
                value={value.map((x) => String(x)).join('\n')}
                onChange={(e) => set(key, e.target.value.split('\n'))}
                rows={Math.max(3, value.length)}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1 text-xs text-zinc-400">Satu item per baris.</p>
            </div>
          );
        }

        return (
          <FieldEditor
            key={key}
            label={fieldLabel(key)}
            value={value}
            isImage={IMAGE_FIELD.test(key)}
            isTextarea={TEXTAREA_FIELD.test(key)}
            onChange={(next) => set(key, next)}
          />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            Landing Page CMS
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kelola seluruh teks, tautan, dan gambar situs publik{' '}
            <a href="/landing" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline dark:text-amber-300">
              /landing
            </a>{' '}
            — perubahan langsung tampil tanpa perlu deploy.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['landing-admin'] })}>
          <RefreshCw className="size-4 mr-2" /> Muat Ulang
        </Button>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {notice.type === 'ok' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Section tabs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Section Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {LANDING_SECTIONS.map((section) => {
              const isCustom = !!contentQuery.data?.meta?.[section];
              return (
                <button
                  key={section}
                  onClick={() => setActive(section)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${
                    active === section
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span>{SECTION_LABELS[section]}</span>
                  {isCustom && (
                    <Badge className="bg-amber-500 text-white border-transparent text-[9px]">Diubah</Badge>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{SECTION_LABELS[active]}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Kembalikan section "${SECTION_LABELS[active]}" ke konten default?`)) {
                    resetMutation.mutate(active);
                  }
                }}
                disabled={resetMutation.isPending}
              >
                <RotateCcw className="size-4 mr-1.5" /> Reset ke Default
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate(active)}
                disabled={saveMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="size-4 mr-1.5" />
                )}
                Simpan Section
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SectionEditor
              data={loadedDraft[active]}
              onChange={(next) =>
                setDraft((d) => ({ ...(d ?? toDraft(contentQuery.data!.content)), [active]: next }))
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
