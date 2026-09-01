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
  Globe,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const SECTION_DESCRIPTIONS: Record<LandingSection, string> = {
  nav: 'Logo, tombol navigasi, menu tautan, dan CTA portal login.',
  hero: 'Judul utama, tagline, statistik ringkas, dan banner video/gambar beranda.',
  marquee: 'Teks berjalan (ticker) yang menampilkan slogan & lini bisnis.',
  about: 'Profil pendiri, sejarah CV GASELA sejak 1996, visi misi & nilai perusahaan.',
  portfolio: 'Daftar 4 unit bisnis utama: Motor, Futsal, Sellular, dan Makaroni.',
  contact: 'Nomor telepon, WhatsApp, email, dan alamat Google Maps tiap cabang.',
  footer: 'Hak cipta, tautan sosial media, dan informasi legal.',
};

const IMAGE_FIELD = /(image|logo|icon|photo|background|banner)/i;
const TEXTAREA_FIELD = /(desc|subtitle|paragraph|quote|address|copy|text|bio)/i;

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
      <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 hover:bg-zinc-100/60 dark:hover:bg-zinc-850 transition-colors">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4.5 rounded border-zinc-300 dark:border-zinc-700 accent-amber-600 focus:ring-amber-500"
        />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
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
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{label}</Label>
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
        />
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{label}</Label>
        <Input
          type="number"
          value={strValue}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="rounded-xl h-10 px-4 shadow-xs border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{label}</Label>
      <Input 
        value={strValue} 
        onChange={(e) => onChange(e.target.value)} 
        className="rounded-xl h-10 px-4 shadow-xs border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus-visible:ring-amber-500/30 focus-visible:border-amber-500" 
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
      });
      onChange(res.data.url);
    } catch (err: any) {
      setError(err?.message ?? 'Upload gagal. Pastikan file < 10MB dan format jpg/png/webp/svg.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{label}</Label>
      
      {/* Visual Image Preview if URL exists */}
      {value && (
        <div className="flex items-center gap-4 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 max-w-md">
          <div className="relative size-16 shrink-0 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={value} 
              alt="Preview" 
              className="size-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{value}</p>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 mt-1"
            >
              Lihat Gambar Asli <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/gasela_hd_hero.png atau /api/uploads/landing/..."
            className="rounded-xl h-10 px-4 shadow-xs border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 pr-10"
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
          className="shrink-0 h-10 rounded-xl px-4 shadow-xs border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium"
        >
          {uploading ? <Loader2 className="size-4 mr-2 animate-spin text-amber-600" /> : <ImagePlus className="size-4 mr-2 text-amber-600 dark:text-amber-400" />}
          {uploading ? 'Mengunggah…' : 'Pilih File'}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
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
    <div className="space-y-6">
      {Object.entries(data).map(([key, value]) => {
        if (isArrayOfObjects(value)) {
          return (
            <div key={key} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-base font-bold text-zinc-900 dark:text-white">{fieldLabel(key)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total {value.length} entri</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => set(key, [...value, emptyLike(value[0] ?? {})])}
                  className="rounded-xl font-semibold shadow-xs"
                >
                  <Plus className="size-4 mr-1.5" /> Tambah Entri
                </Button>
              </div>
              <div className="space-y-4">
                {value.map((item, idx) => (
                  <div
                    key={idx}
                    className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-850">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">
                        Item #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => set(key, value.filter((_, i) => i !== idx))}
                        className="h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Hapus Item"
                      >
                        <Trash2 className="size-4 mr-1" />
                        <span className="text-xs">Hapus</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(item).map(([subKey, subValue]) => (
                        <div key={subKey} className={TEXTAREA_FIELD.test(subKey) || isArrayOfObjects(subValue) ? 'md:col-span-2' : ''}>
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
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (Array.isArray(value)) {
          // Array primitif (mis. paragraphs) → satu textarea, satu baris per entri
          return (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{fieldLabel(key)}</Label>
              <textarea
                value={value.map((x) => String(x)).join('\n')}
                onChange={(e) => set(key, e.target.value.split('\n'))}
                rows={Math.max(4, value.length)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Tekan Enter untuk membuat baris baru per item.</p>
            </div>
          );
        }

        return (
          <div key={key}>
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
      setNotice({ type: 'ok', text: `Section "${SECTION_LABELS[active]}" berhasil disimpan! Landing page langsung terupdate.` });
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
      setNotice({ type: 'ok', text: `Section "${SECTION_LABELS[active]}" berhasil dikembalikan ke konten bawaan (default).` });
      queryClient.invalidateQueries({ queryKey: ['landing-admin'] });
    },
    onError: (err: Error) => {
      setNotice({ type: 'err', text: `Gagal reset: ${err.message}` });
    },
  });

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="size-5 shrink-0" />
          Akses ditolak — halaman ini khusus akun Admin Landing Page (landing_admin).
        </div>
      </div>
    );
  }

  if (contentQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Memuat data konten landing page…</p>
      </div>
    );
  }

  if (contentQuery.isError || !loadedDraft) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          Gagal memuat konten landing page dari server. Pastikan koneksi backend aktif.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header Banner Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Landing Page CMS
            </h1>
            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30">
              <Sparkles className="size-3 mr-1" /> Live Sync
            </Badge>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Kelola teks, foto, dan struktur publik{' '}
            <a href="/landing" target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline inline-flex items-center gap-0.5">
              /landing <ExternalLink className="size-3" />
            </a>{' '}
            secara dinamis tanpa perlu deploy ulang.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/landing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs transition-colors"
          >
            <Globe className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>Lihat Website</span>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['landing-admin'] })}
            className="rounded-xl border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs font-semibold text-xs"
          >
            <RefreshCw className="size-3.5 mr-1.5 text-zinc-500" /> Muat Ulang
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            notice.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'ok' ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button 
            onClick={() => setNotice(null)} 
            className="text-xs font-bold opacity-70 hover:opacity-100 underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section Navigation */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 space-y-2">
          <div className="px-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pilih Bagian (Section)
            </h2>
          </div>
          <nav className="space-y-1.5">
            {LANDING_SECTIONS.map((section) => {
              const isCustom = !!contentQuery.data?.meta?.[section];
              const isActive = active === section;
              return (
                <button
                  key={section}
                  onClick={() => {
                    setActive(section);
                    setNotice(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{SECTION_LABELS[section]}</span>
                  {isCustom && (
                    <span 
                      className={`h-2 w-2 rounded-full shrink-0 ${isActive ? 'bg-primary-foreground' : 'bg-primary'}`} 
                      title="Telah dimodifikasi" 
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Editor Card */}
        <div className="lg:col-span-9">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
            {/* Sticky Editor Header Bar */}
            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 p-5 sm:px-8 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {SECTION_LABELS[active]}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {SECTION_DESCRIPTIONS[active]}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Kembalikan section "${SECTION_LABELS[active]}" ke konten default bawaan kode?`)) {
                      resetMutation.mutate(active);
                    }
                  }}
                  disabled={resetMutation.isPending}
                  className="rounded-xl border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold"
                >
                  <RotateCcw className="size-3.5 mr-1.5" /> Reset Default
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate(active)}
                  disabled={saveMutation.isPending}
                  className="rounded-xl font-bold shadow-xs text-xs"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5 mr-1.5" />
                  )}
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </div>

            {/* Editor Fields Content */}
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
