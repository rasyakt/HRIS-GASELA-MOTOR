'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Palette,
  Paintbrush,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PositiveNumberInput } from '@/components/ui/positive-number-input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { usePortalTheme } from '@/components/portal-theme-provider';
import {
  DEFAULT_PORTAL_THEME,
  THEME_PRESETS,
  type CompanySettingDto,
  type HolidayDto,
  type PortalThemeConfig,
  type ThemePreset,
} from '@gasela/shared-types';

const SETTING_HINTS: Record<string, string> = {
  'company.name': 'Nama resmi perusahaan (ditampilkan pada header slip gaji)',
  'office.location': 'Koordinat lokasi kantor pusat (Format JSON: {"lat":-6.9,"lng":107.6})',
  'office.radius_meters': 'Radius geofence presensi check-in/out karyawan (dalam meter)',
  'overtime.rate_multiplier_weekday': 'Pengali upah lembur pada hari kerja (misal: 1.5)',
};

const DEFAULT_BPJS_CONFIG = {
  kesehatanRateEmployee: 0.01,
  kesehatanRateCompany: 0.04,
  kesehatanCapSalary: 12000000,
  jhtRateEmployee: 0.02,
  jhtRateCompany: 0.037,
  jpRateEmployee: 0.01,
  jpRateCompany: 0.02,
  jpCapSalary: 10547400,
  jkkRateCompany: 0.0024,
  jkmRateCompany: 0.003,
};

function BpjsSettingForm({
  setting,
  onSave,
  saving,
}: {
  setting: CompanySettingDto;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const parseRates = (str: string): typeof DEFAULT_BPJS_CONFIG => {
    try {
      return { ...DEFAULT_BPJS_CONFIG, ...JSON.parse(str) };
    } catch {
      return DEFAULT_BPJS_CONFIG;
    }
  };

  const [rates, setRates] = useState<typeof DEFAULT_BPJS_CONFIG>(() => parseRates(setting.value));

  const updateRate = (field: keyof typeof DEFAULT_BPJS_CONFIG, numVal: number) => {
    setRates((prev: typeof DEFAULT_BPJS_CONFIG) => ({ ...prev, [field]: numVal }));
  };

  const handleSave = () => {
    onSave(JSON.stringify(rates));
  };

  const handleResetGov = () => {
    setRates(DEFAULT_BPJS_CONFIG);
  };

  const isDirty = JSON.stringify(rates) !== JSON.stringify(parseRates(setting.value));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 space-y-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="size-4 text-zinc-700 dark:text-zinc-300" />
            Pengaturan Tarif &amp; Batas Upah BPJS
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Atur persentase potongan iuran BPJS karyawan dan kontribusi perusahaan tanpa perlu mengedit kode JSON.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleResetGov} className="text-xs">
            <RotateCcw className="size-3.5 mr-1" />
            Standar Pemerintah 2024
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Save className="size-3.5 mr-1" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* BPJS Kesehatan Section */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">1. BPJS Kesehatan</span>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Iuran Pekerja (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.kesehatanRateEmployee * 100).toFixed(1)}
                onChangeValue={(val) => updateRate('kesehatanRateEmployee', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Standar resmi: 1%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Iuran Perusahaan (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.kesehatanRateCompany * 100).toFixed(1)}
                onChangeValue={(val) => updateRate('kesehatanRateCompany', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Standar resmi: 4%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Maksimal Upah Kena BPJS Kes</Label>
            <div className="mt-1">
              <CurrencyInput
                value={rates.kesehatanCapSalary}
                onChangeValue={(val) => updateRate('kesehatanCapSalary', val)}
                className="text-xs font-semibold"
              />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Batas max: Rp {rates.kesehatanCapSalary.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* BPJS Ketenagakerjaan Section */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">2. BPJS Ketenagakerjaan (JHT &amp; JP)</span>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">JHT Pekerja (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.jhtRateEmployee * 100).toFixed(1)}
                onChangeValue={(val) => updateRate('jhtRateEmployee', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Tabungan Hari Tua: 2%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">JHT Perusahaan (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.jhtRateCompany * 100).toFixed(1)}
                onChangeValue={(val) => updateRate('jhtRateCompany', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Ditanggung Perusahaan: 3.7%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Jaminan Pensiun (JP) Pekerja (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.jpRateEmployee * 100).toFixed(1)}
                onChangeValue={(val) => updateRate('jpRateEmployee', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Jaminan Pensiun: 1%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Jaminan Pensiun (JP) Perusahaan (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.jpRateCompany * 100).toFixed(1)}
                onChangeValue={(val) => updateRate('jpRateCompany', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Ditanggung Perusahaan: 2%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Maksimal Upah Kena JP</Label>
            <div className="mt-1">
              <CurrencyInput
                value={rates.jpCapSalary}
                onChangeValue={(val) => updateRate('jpCapSalary', val)}
                className="text-xs font-semibold"
              />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Cap JP: Rp {rates.jpCapSalary.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* JKK & JKM Section */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">3. JKK &amp; JKM Perusahaan</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">JKK (Kecelakaan Kerja) (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.jkkRateCompany * 100).toFixed(2)}
                onChangeValue={(val) => updateRate('jkkRateCompany', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Risiko standar: 0.24%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">JKM (Jaminan Kematian) (%)</Label>
            <div className="relative mt-1">
              <PositiveNumberInput
                allowDecimal={true}
                max={100}
                value={(rates.jkmRateCompany * 100).toFixed(2)}
                onChangeValue={(val) => updateRate('jkmRateCompany', val / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Standar resmi: 0.3%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfficeLocationSettingForm({
  setting,
  onSave,
  saving,
}: {
  setting: CompanySettingDto;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const parseCoords = (str: string): { lat: number; lng: number } => {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {}
    return { lat: -6.914744, lng: 107.60981 };
  };

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() =>
    parseCoords(setting.value),
  );
  const [gettingGps, setGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const initial = parseCoords(setting.value);
  const isDirty = coords.lat !== initial.lat || coords.lng !== initial.lng;

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung Geolocation.');
      return;
    }
    setGettingGps(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setGettingGps(false);
      },
      (err) => {
        setGpsError(`Gagal mengambil GPS: ${err.message}`);
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = () => {
    onSave(JSON.stringify({ lat: coords.lat, lng: coords.lng }));
  };

  const delta = 0.003;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - delta}%2C${coords.lat - delta}%2C${coords.lng + delta}%2C${coords.lat + delta}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <MapPin className="size-4 text-zinc-700 dark:text-zinc-300" />
            Koordinat Lokasi Kantor ({setting.key})
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Titik pusat geofence presensi check-in/out karyawan dan peta di Dashboard Admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetGps}
            disabled={gettingGps}
            className="text-xs"
          >
            {gettingGps ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Crosshair className="size-3.5 mr-1 text-zinc-500 dark:text-zinc-400" />
            )}
            Ambil Lokasi GPS
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Save className="size-3.5 mr-1" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {gpsError && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
          {gpsError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Latitude (Lintang)
            </Label>
            <Input
              type="number"
              step="0.000001"
              value={coords.lat}
              onChange={(e) =>
                setCoords((c) => ({
                  ...c,
                  lat: parseFloat(e.target.value) || 0,
                }))
              }
              className="mt-1 text-xs font-mono font-semibold"
              placeholder="-6.914744"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              Contoh: -6.914744
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Longitude (Bujur)
            </Label>
            <Input
              type="number"
              step="0.000001"
              value={coords.lng}
              onChange={(e) =>
                setCoords((c) => ({
                  ...c,
                  lng: parseFloat(e.target.value) || 0,
                }))
              }
              className="mt-1 text-xs font-mono font-semibold"
              placeholder="107.609810"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              Contoh: 107.609810
            </p>
          </div>

          <div className="pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ExternalLink className="size-3.5" />
              Verifikasi titik di Google Maps
            </a>
          </div>
        </div>

        {/* Live Mini Map Preview */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Pratinjau Peta Lokasi
          </Label>
          <div className="relative h-44 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-2xs">
            <iframe
              src={osmEmbedUrl}
              title="Pratinjau Peta Lokasi Kantor"
              className="absolute inset-0 size-full border-0 dark:filter-[invert(0.88)_hue-rotate(180deg)_contrast(0.9)_saturate(0.65)]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // Keep live preview updated
  useEffect(() => {
    setPreviewTheme(config);
  }, [config, setPreviewTheme]);

  // Reset preview on unmount
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
            <Palette className="size-4 text-zinc-700 dark:text-zinc-300" />
            Tema &amp; Warna Aksen Portal HRIS (GaselaPulse)
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Atur warna tema tombol, badge, focus ring, dan menu navigasi portal HRIS. Tidak mempengaruhi Landing Page publik.
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
                className={`relative flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/80 shadow-xs ring-1 ring-zinc-900 dark:ring-white'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700'
                }`}
              >
                <div
                  className="size-5 rounded-full shrink-0 shadow-2xs flex items-center justify-center text-white"
                  style={{ backgroundColor: preset.previewColor }}
                >
                  {isSelected && <Check className="size-3 stroke-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {preset.label}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Custom HEX Preset Button */}
          <button
            type="button"
            onClick={() => handleSelectPreset('custom')}
            className={`relative flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
              isCustom
                ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/80 shadow-xs ring-1 ring-zinc-900 dark:ring-white'
                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700'
            }`}
          >
            <div
              className="size-5 rounded-full shrink-0 shadow-2xs flex items-center justify-center text-white border border-white/20"
              style={{ backgroundColor: customHex }}
            >
              {isCustom && <Check className="size-3 stroke-3" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                Custom HEX
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Custom HEX Picker Form (when Custom is selected) */}
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
              Klik kotak warna atau ketik kode HEX 6 digit (contoh: <code className="text-zinc-600 dark:text-zinc-300">#0284c7</code>)
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
          {/* Simulated Buttons & Badges */}
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

          {/* Simulated Active Navigation */}
          <div className="space-y-3 bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Simulasi Menu Sidebar Aktif
            </p>
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Dashboard HRIS (Halaman Aktif)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  onSave,
  saving,
}: {
  setting: CompanySettingDto;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(setting.value);
  const dirty = value !== setting.value;

  if (setting.key === 'portal.theme_config') {
    return <PortalThemeSettingForm setting={setting} onSave={onSave} saving={saving} />;
  }

  if (setting.key === 'bpjs.rates') {
    return <BpjsSettingForm setting={setting} onSave={onSave} saving={saving} />;
  }

  if (setting.key === 'office.location') {
    return (
      <OfficeLocationSettingForm
        setting={setting}
        onSave={onSave}
        saving={saving}
      />
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-sm font-medium text-zinc-900 dark:text-white">
            {setting.key}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {SETTING_HINTS[setting.key] ?? setting.description}
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onSave(value)}
          disabled={!dirty || saving}
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin mr-1" />
          ) : (
            <Save className="size-3.5 mr-1" />
          )}
          Simpan
        </Button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="mt-3 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-100 outline-none"
      />
    </div>
  );
}

export default function SettingsPage() {
  const authApi = useAuthApi();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [year, setYear] = useState(new Date().getFullYear());
  const [holDate, setHolDate] = useState('');
  const [holName, setHolName] = useState('');
  const [holRecurring, setHolRecurring] = useState(false);

  const isAdmin = !!user && roleAtLeast(user.role, 'admin');

  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => authApi<CompanySettingDto[]>('/api/settings/company'),
  });

  const holidays = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => authApi<HolidayDto[]>(`/api/settings/holidays?year=${year}`),
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

  const addHoliday = useMutation({
    mutationFn: () =>
      authApi('/api/settings/holidays', {
        method: 'POST',
        body: JSON.stringify({
          date: holDate,
          name: holName,
          isRecurringYearly: holRecurring,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] });
      setHolDate('');
      setHolName('');
      setHolRecurring(false);
    },
  });

  const removeHoliday = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/settings/holidays/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-zinc-500">
          Halaman ini khusus untuk admin, HRD, dan owner.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Pengaturan</h2>
        <p className="text-sm text-zinc-500">
          Pengaturan perusahaan dan kalender hari libur.
        </p>
      </div>

      {isAdmin && (
        <PortalThemeSettingForm
          setting={settings.data?.find((s) => s.key === 'portal.theme_config')}
          saving={saveSetting.isPending}
          onSave={(value) => saveSetting.mutate({ key: 'portal.theme_config', value })}
        />
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pengaturan Perusahaan</span>
              <Badge>
                {settings.data
                  ? `${settings.data.filter((s) => s.key !== 'portal.theme_config').length} item`
                  : '…'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings.isLoading ? (
              <p className="text-sm text-zinc-400">Memuat…</p>
            ) : settings.data ? (
              <>
                <div className="space-y-3">
                  {settings.data
                    .filter((s) => s.key !== 'portal.theme_config')
                    .map((s) => (
                      <SettingRow
                        key={s.key}
                        setting={s}
                        saving={saveSetting.isPending}
                        onSave={(value) => saveSetting.mutate({ key: s.key, value })}
                      />
                    ))}
                </div>
                {saveSetting.isError && (
                  <p className="mt-3 text-sm text-red-600">
                    {saveSetting.error instanceof Error
                      ? saveSetting.error.message
                      : 'Gagal menyimpan pengaturan'}
                  </p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Kalender Hari Libur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="hol-date">Tanggal</Label>
                <Input
                  id="hol-date"
                  type="date"
                  value={holDate}
                  onChange={(e) => setHolDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hol-name">Nama Libur</Label>
                <Input
                  id="hol-name"
                  value={holName}
                  onChange={(e) => setHolName(e.target.value)}
                  placeholder="mis. Hari Kemerdekaan"
                />
              </div>
              <label className="flex h-9 items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={holRecurring}
                  onChange={(e) => setHolRecurring(e.target.checked)}
                  className="size-4 accent-zinc-900"
                />
                Berulang tiap tahun
              </label>
              <Button
                onClick={() => addHoliday.mutate()}
                disabled={!holDate || !holName.trim() || addHoliday.isPending}
              >
                {addHoliday.isPending ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : (
                  <CalendarPlus className="size-3.5 mr-1" />
                )}
                Tambah
              </Button>
            </div>
            {addHoliday.isError && (
              <p className="text-sm text-red-600">
                {addHoliday.error instanceof Error
                  ? addHoliday.error.message
                  : 'Gagal menambah libur'}
              </p>
            )}

            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="hol-year">Tahun</Label>
                <Input
                  id="hol-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-28"
                />
              </div>
            </div>

            {holidays.isLoading ? (
              <p className="text-sm text-zinc-400">Memuat…</p>
            ) : holidays.data && holidays.data.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                      <th className="px-3 py-2 font-medium">Tanggal</th>
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Tahunan</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {holidays.data.map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-zinc-50 transition-colors"
                      >
                        <td className="px-3 py-2 font-medium text-zinc-900">
                          {fmtDate(h.date)}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">{h.name}</td>
                        <td className="px-3 py-2 text-zinc-600">
                          {h.isRecurringYearly ? 'Ya' : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHoliday.mutate(h.id)}
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Tidak ada hari libur untuk tahun {year}.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
