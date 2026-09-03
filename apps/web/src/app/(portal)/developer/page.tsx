'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Database,
  HardDrive,
  Key,
  Layers,
  Loader2,
  Paintbrush,
  Palette,
  RotateCcw,
  Save,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { usePortalTheme } from '@/components/portal-theme-provider';
import {
  DEFAULT_PORTAL_THEME,
  THEME_PRESETS,
  type CompanySettingDto,
  type PortalThemeConfig,
} from '@gasela/shared-types';

type DeveloperTab = 'theme' | 'retention' | 'diagnostics';

/* ─── TAB 1: FORM TEMA & WARNA ─── */
function PortalThemeSettingForm({
  setting,
  onSave,
  saving,
}: {
  setting?: CompanySettingDto;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const { setPreviewTheme } = usePortalTheme();

  const parseConfig = (val?: string): PortalThemeConfig => {
    if (!val) return DEFAULT_PORTAL_THEME;
    try {
      return { ...DEFAULT_PORTAL_THEME, ...JSON.parse(val) };
    } catch {
      return DEFAULT_PORTAL_THEME;
    }
  };

  const initial = useMemo(() => parseConfig(setting?.value), [setting?.value]);
  const [config, setConfig] = useState<PortalThemeConfig>(initial);
  const [customHex, setCustomHex] = useState(initial.customColor ?? '#059669');

  useEffect(() => {
    setPreviewTheme(config);
  }, [config, setPreviewTheme]);

  useEffect(() => {
    return () => {
      setPreviewTheme(null);
    };
  }, [setPreviewTheme]);

  const isDirty = JSON.stringify(config) !== JSON.stringify(initial);

  const handleSelectPreset = (presetId: string) => {
    const next: PortalThemeConfig = { ...config, presetId };
    if (presetId !== 'custom') {
      delete next.customColor;
    } else {
      next.customColor = customHex;
    }
    setConfig(next);
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    if (config.presetId === 'custom') {
      setConfig((prev) => ({ ...prev, customColor: hex }));
    }
  };

  const handleRadiusChange = (radius: PortalThemeConfig['radius']) => {
    setConfig((prev) => ({ ...prev, radius }));
  };

  const handleResetDefault = () => {
    setConfig(DEFAULT_PORTAL_THEME);
    setCustomHex('#059669');
  };

  const handleSave = () => {
    onSave(JSON.stringify(config));
    setPreviewTheme(null);
  };

  const activePreset = THEME_PRESETS.find((p) => p.id === config.presetId);
  const isCustom = config.presetId === 'custom';
  const effectiveColor = isCustom ? customHex : activePreset?.previewColor || '#10b981';

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Palette className="size-4 text-emerald-600 dark:text-emerald-400" />
            Tema &amp; Warna Aksen Portal HRIS (GaselaPulse)
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Atur warna tema tombol, badge, focus ring, dan menu navigasi portal HRIS secara global.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefault}
            className="text-xs"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Standar Gasela
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Save className="size-3.5 mr-1" />
            )}
            Simpan Tema
          </Button>
        </div>
      </div>

      {/* Preset Swatches Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-zinc-500 dark:text-zinc-400" />
            Pilihan Palet Warna Preset
          </Label>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Aktif: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{isCustom ? 'Warna Custom (HEX)' : activePreset?.label}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {THEME_PRESETS.map((preset) => {
            const isSelected = config.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/80 shadow-2xs ring-1 ring-zinc-900 dark:ring-zinc-100'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                }`}
              >
                <div
                  className="size-5 rounded-full shrink-0 shadow-2xs border border-black/10"
                  style={{ backgroundColor: preset.previewColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {preset.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom HEX Picker Form */}
      {isCustom && (
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 space-y-3">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Paintbrush className="size-3.5 text-zinc-500 dark:text-zinc-400" />
            Pilih Warna Kustom Sendiri
          </Label>
          <div className="flex items-center gap-3">
            <div className="relative size-9 shrink-0 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-2xs">
              <input
                type="color"
                value={customHex}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <div
                className="size-full"
                style={{ backgroundColor: customHex }}
              />
            </div>
            <Input
              type="text"
              value={customHex}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              placeholder="#059669"
              maxLength={7}
              className="w-36 font-mono text-xs font-semibold uppercase"
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Klik kotak warna atau ketik kode HEX (contoh: <code className="text-zinc-600 dark:text-zinc-300">#0284c7</code>)
            </p>
          </div>
        </div>
      )}

      {/* Border Radius Setting */}
      <div className="space-y-2.5">
        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Gaya Lengkungan Sudut (Corner Radius)
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'none', label: 'Tegas (0px)', rClass: 'rounded-none' },
            { id: 'sm', label: 'Kompak (4px)', rClass: 'rounded-xs' },
            { id: 'md', label: 'Standar (8px)', rClass: 'rounded-md' },
            { id: 'lg', label: 'Modern (12px)', rClass: 'rounded-xl' },
            { id: 'full', label: 'Pill / Bulat', rClass: 'rounded-full' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRadiusChange(r.id as any)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                config.radius === r.id
                  ? 'border-primary bg-primary text-primary-foreground font-bold shadow-2xs'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
              } ${r.rClass}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Interactive Preview */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full inline-block animate-pulse"
              style={{ backgroundColor: effectiveColor }}
            />
            Pratinjau Langsung (Live Preview)
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            {effectiveColor}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-3 bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Tombol &amp; Badge
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">
                Simpan Perubahan
              </Button>
              <Button variant="outline" size="sm">
                Batal
              </Button>
              <Badge>
                Karyawan Aktif
              </Badge>
            </div>
          </div>

          <div className="space-y-3 bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Item Navigasi Aktif
            </p>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-2">
              <Code2 className="size-4" />
              <span>Menu Aktif Terpilih</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TAB 2: FORM RETENSI & STORAGE ─── */
function PhotoRetentionSettingCard({
  setting,
  onSave,
  saving,
}: {
  setting?: CompanySettingDto;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const authApi = useAuthApi();
  const [days, setDays] = useState<number>(() =>
    setting?.value ? parseInt(setting.value, 10) || 60 : 60,
  );
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);

  const cleanupMutation = useMutation({
    mutationFn: () =>
      authApi<{ message: string; deletedFilesCount: number; freedBytesEstimated: number }>(
        '/api/attendances/cleanup-photos',
        {
          method: 'POST',
          body: JSON.stringify({ days }),
        },
      ),
    onSuccess: (data) => {
      setCleanupStatus(data.message);
    },
    onError: (err) => {
      setCleanupStatus(
        err instanceof Error ? err.message : 'Gagal menjalankan pembersihan foto.',
      );
    },
  });

  const isDirty = (setting?.value ? parseInt(setting.value, 10) : 60) !== days;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-zinc-900 dark:text-white">
          <span className="flex items-center gap-2">
            <HardDrive className="size-4 text-emerald-600 dark:text-emerald-400" />
            Penyimpanan &amp; Retensi Foto Presensi (Auto-Retention)
          </span>
          <Badge>
            Jadwal Cron 02:00 WIB
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sistem secara otomatis menghapus file foto selfie lama di server disk untuk menghemat ruang penyimpanan. Seluruh data rekap jam, menit keterlambatan, dan status presensi karyawan di database tetap tersimpan permanen.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <Label htmlFor="retention-days" className="text-xs font-semibold">
              Masa Retensi Foto (Hari)
            </Label>
            <p className="text-[11px] text-zinc-400">
              Foto yang lebih lama dari jumlah hari ini akan dibersihkan secara otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="retention-days"
              type="number"
              min={7}
              max={365}
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value, 10) || 60))}
              className="w-24 text-center font-bold"
            />
            <Button
              size="sm"
              disabled={!isDirty || saving}
              onClick={() => onSave(days.toString())}
              className="text-xs"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Save className="size-3.5 mr-1" />}
              Simpan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Pembersihan Disk Manual
            </p>
            <p className="text-[11px] text-zinc-400">
              Jalankan proses pembersihan file lama sekarang tanpa menunggu jadwal cron harian.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCleanupStatus(null);
              cleanupMutation.mutate();
            }}
            disabled={cleanupMutation.isPending}
            className="text-xs"
          >
            {cleanupMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Trash2 className="size-3.5 mr-1 text-red-500" />
            )}
            Jalankan Pembersihan Sekarang
          </Button>
        </div>

        {cleanupStatus && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{cleanupStatus}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── TAB 3: DIAGNOSTIK & SERVER STATUS ─── */
function SystemDiagnosticsCard() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toLocaleString('id-ID', { timeZoneName: 'short' }));
    const timer = setInterval(() => {
      setTime(new Date().toLocaleString('id-ID', { timeZoneName: 'short' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>Database Engine</span>
            <Database className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">MySQL 8.0</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">● Terhubung (Prisma ORM)</p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>Backend Runtime</span>
            <Server className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">NestJS + Node.js</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">● Status Sehat (HTTP 200)</p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>Frontend Engine</span>
            <Cpu className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">Next.js 15 (Turbopack)</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">● App Router + Tailwind v4</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
            Informasi Lingkungan &amp; Keamanan Sistem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Waktu Server (Lokal):</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{time || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Enkripsi Data Sensitif:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> AES-256-CBC Aktif
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Autentikasi Dua Faktor (2FA):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">TOTP Authenticator (RFC 6238)</span>
              </div>
            </div>

            <div className="space-y-3 md:pl-4 pt-3 md:pt-0">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Arsitektur Peran:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Hierarkis + ExactRoles</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Audit Trail Logging:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Aktif ke Database</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Masa Token JWT:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">Access: 15m · Refresh: 7d</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── MAIN DEVELOPER PAGE ─── */
export default function DeveloperPage() {
  const authApi = useAuthApi();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<DeveloperTab>('theme');

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => authApi<CompanySettingDto[]>('/api/settings/company'),
  });

  const saveSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      authApi('/api/settings/company', {
        method: 'PUT',
        body: JSON.stringify({ key, value }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  if (!user || user.role !== 'superadmin') {
    return null;
  }

  const DEV_TABS = [
    {
      id: 'theme' as DeveloperTab,
      label: 'Tema & Tampilan Portal',
      icon: Palette,
    },
    {
      id: 'retention' as DeveloperTab,
      label: 'Penyimpanan & Retensi Foto',
      icon: HardDrive,
    },
    {
      id: 'diagnostics' as DeveloperTab,
      label: 'Diagnostik & Server Status',
      icon: Activity,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Code2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              Developer Hub
            </h2>
            <Badge className="bg-emerald-600 text-white font-bold text-[10px] tracking-wider uppercase">
              Superadmin Only
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Pusat konfigurasi teknis, manajemen palet warna portal, retensi disk server, dan pemantauan sistem.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-px">
        {DEV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-primary text-primary font-bold dark:border-primary dark:text-primary bg-primary/5 dark:bg-primary/10 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-primary' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Theme */}
      {activeTab === 'theme' && (
        <PortalThemeSettingForm
          setting={settings.data?.find((s) => s.key === 'portal.theme_config')}
          saving={saveSetting.isPending}
          onSave={(value) => saveSetting.mutate({ key: 'portal.theme_config', value })}
        />
      )}

      {/* Tab 2: Retention */}
      {activeTab === 'retention' && (
        <PhotoRetentionSettingCard
          setting={settings.data?.find((s) => s.key === 'attendance.photo_retention_days')}
          saving={saveSetting.isPending}
          onSave={(value) => saveSetting.mutate({ key: 'attendance.photo_retention_days', value })}
        />
      )}

      {/* Tab 3: Diagnostics */}
      {activeTab === 'diagnostics' && <SystemDiagnosticsCard />}
    </div>
  );
}
