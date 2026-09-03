'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
import type { CompanySettingDto, HolidayDto } from '@gasela/shared-types';

const SETTING_HINTS: Record<string, string> = {
  'company.name': 'Nama resmi perusahaan (ditampilkan pada header slip gaji)',
  'office.location': 'Koordinat lokasi kantor pusat (Format JSON: {"lat":-6.9,"lng":107.6})',
  'office.radius_meters': 'Radius geofence presensi check-in/out karyawan (dalam meter)',
  'overtime.rate_multiplier_weekday': 'Pengali upah lembur pada hari kerja (misal: 1.5)',
  'attendance.photo_retention_days': 'Batas waktu penyimpanan foto selfie presensi sebelum dibersihkan otomatis (hari, standar: 60)',
  'attendance.checkout_earliest_buffer_minutes': 'Waktu paling awal karyawan boleh check-out sebelum jam shift berakhir (dalam menit, misal: 30)',
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

interface ShiftItem {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  workHours: number;
  isActive: boolean;
}

function ShiftsManagementCard() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formGrace, setFormGrace] = useState(15);
  const [formHours, setFormHours] = useState(8);
  const [formError, setFormError] = useState<string | null>(null);

  const shifts = useQuery({
    queryKey: ['shifts-list'],
    queryFn: () => authApi<ShiftItem[]>('/api/shifts?includeInactive=true'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      authApi('/api/shifts', {
        method: 'POST',
        body: JSON.stringify({
          name: formName,
          startTime: formStart,
          endTime: formEnd,
          gracePeriodMinutes: Number(formGrace),
          workHours: Number(formHours),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
      resetForm();
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat shift');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/shifts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formName,
          startTime: formStart,
          endTime: formEnd,
          gracePeriodMinutes: Number(formGrace),
          workHours: Number(formHours),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
      resetForm();
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Gagal memperbarui shift');
    },
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [openMenu, setOpenMenu] = useState<{ id: number; top: number; right: number } | null>(null);

  // Close ellipsis menu when clicking anywhere outside or scrolling
  useEffect(() => {
    if (!openMenu) return;
    const handleClose = () => setOpenMenu(null);
    const handleScroll = () => setOpenMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenu]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, shift: ShiftItem) => {
    e.stopPropagation();
    if (openMenu?.id === shift.id) {
      setOpenMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({
      id: shift.id,
      top: rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/shifts/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Gagal menghapus shift');
      setDeleteConfirmId(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      authApi(`/api/shifts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
    },
  });

  // Helper kalkulasi Jam Keluar otomatis dari Jam Masuk + Jam Kerja
  const calcEndTime = (startStr: string, workHours: number): string => {
    const [sh, sm] = startStr.split(':').map(Number);
    const startMin = (sh || 0) * 60 + (sm || 0);
    // Jam kerja penuh (>= 8 jam) diberi 1 jam standar istirahat makan siang/sholat
    const breakHours = workHours >= 8 ? 1 : 0;
    const totalMinutes = Math.round((workHours + breakHours) * 60);
    const endTotalMinutes = (startMin + totalMinutes) % (24 * 60);
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // Helper kalkulasi Durasi Kerja jika Jam Keluar diedit manual
  const calcHoursFromEnd = (startStr: string, endStr: string): number => {
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMin = (sh || 0) * 60 + (sm || 0);
    let endMin = (eh || 0) * 60 + (em || 0);
    if (endMin <= startMin) {
      endMin += 24 * 60; // Lintas malam
    }
    const diffHours = (endMin - startMin) / 60;
    // Jika rentang tepat 9 jam (misal 08:00 - 17:00), durasi kerja efektif adalah 8 jam
    if (diffHours === 9) return 8;
    return Number(diffHours.toFixed(1));
  };

  const handleStartChange = (val: string) => {
    setFormStart(val);
    setFormEnd(calcEndTime(val, formHours));
  };

  const handleHoursChange = (val: number) => {
    setFormHours(val);
    setFormEnd(calcEndTime(formStart, val));
  };

  const handleEndChange = (val: string) => {
    setFormEnd(val);
    setFormHours(calcHoursFromEnd(formStart, val));
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormName('');
    setFormStart('08:00');
    setFormEnd('17:00');
    setFormGrace(15);
    setFormHours(8);
    setFormError(null);
  };

  const handleStartEdit = (s: ShiftItem) => {
    setEditingId(s.id);
    setIsCreating(false);
    setFormName(s.name);
    setFormStart(s.startTime.slice(0, 5));
    setFormEnd(s.endTime.slice(0, 5));
    setFormGrace(s.gracePeriodMinutes);
    setFormHours(Number(s.workHours) || 8);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Nama shift wajib diisi');
      return;
    }
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-zinc-900 dark:text-white">
          <span className="flex items-center gap-2">
            <Clock className="size-4 text-zinc-700 dark:text-zinc-300" />
            Jadwal Shift Kerja &amp; Toleransi Keterlambatan
          </span>
          {!isCreating && !editingId && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              Tambah Shift
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Atur jam mulai kerja, durasi jam kerja, jam selesai, dan toleransi keterlambatan (grace period) untuk masing-masing shift.
        </p>

        {/* Form Tambah/Edit Shift */}
        {(isCreating || editingId) && (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 p-4 space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                {editingId ? 'Edit Jadwal Shift' : 'Tambah Shift Kerja Baru'}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="shift-name" className="text-xs">Nama Shift</Label>
                <Input
                  id="shift-name"
                  placeholder="Contoh: Shift Pagi, Shift Malam"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-start" className="text-xs">Jam Masuk</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={formStart}
                  onChange={(e) => handleStartChange(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-hours" className="text-xs">Durasi Kerja (Jam)</Label>
                <Input
                  id="shift-hours"
                  type="number"
                  step="0.5"
                  min={1}
                  max={24}
                  value={formHours}
                  onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
                  className="text-xs text-center font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shift-end" className="text-xs">Jam Keluar</Label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Otomatis</span>
                </div>
                <Input
                  id="shift-end"
                  type="time"
                  value={formEnd}
                  onChange={(e) => handleEndChange(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-grace" className="text-xs">Toleransi (Mnt)</Label>
                <Input
                  id="shift-grace"
                  type="number"
                  min={0}
                  max={120}
                  value={formGrace}
                  onChange={(e) => setFormGrace(parseInt(e.target.value, 10) || 0)}
                  className="text-xs text-center font-bold"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-md border border-red-200 dark:border-red-900/40">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                disabled={isSaving}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="text-xs gap-1.5">
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {editingId ? 'Simpan Perubahan' : 'Buat Shift'}
              </Button>
            </div>
          </form>
        )}

        {/* Tabel / List Shift */}
        {shifts.isLoading ? (
          <p className="text-xs text-zinc-400">Memuat data shift…</p>
        ) : shifts.data && shifts.data.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                <tr>
                  <th className="px-3.5 py-2.5">Nama Shift</th>
                  <th className="px-3.5 py-2.5">Jam Masuk</th>
                  <th className="px-3.5 py-2.5">Jam Keluar</th>
                  <th className="px-3.5 py-2.5">Toleransi Terlambat</th>
                  <th className="px-3.5 py-2.5">Durasi Kerja</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {shifts.data.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                      {s.name}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-zinc-700 dark:text-zinc-300">
                      {s.startTime.slice(0, 5)} WIB
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-zinc-700 dark:text-zinc-300">
                      {s.endTime.slice(0, 5)} WIB
                    </td>
                    <td className="px-3.5 py-2.5 text-zinc-700 dark:text-zinc-300 font-medium">
                      +{s.gracePeriodMinutes} menit
                    </td>
                    <td className="px-3.5 py-2.5 text-zinc-700 dark:text-zinc-300 font-mono">
                      {s.workHours} jam
                    </td>
                    <td className="px-3.5 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate({ id: s.id, isActive: !s.isActive })}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                          s.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                        }`}
                        title="Klik untuk mengubah status aktif/nonaktif"
                      >
                        {s.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        {deleteConfirmId === s.id ? (
                          <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-1 rounded-lg border border-red-200 dark:border-red-900/50 shadow-xs">
                            <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold px-1">
                              Hapus Shift?
                            </span>
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => deleteMutation.mutate(s.id)}
                              disabled={deleteMutation.isPending}
                              className="h-6 px-2 text-[10px] rounded"
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                'Ya, Hapus'
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setDeleteConfirmId(null)}
                              className="h-6 px-1.5 text-[10px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded"
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleOpenMenu(e, s)}
                            className={`size-7 rounded-lg transition-colors ${
                              openMenu?.id === s.id
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                            title="Menu Opsi Shift"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Belum ada shift yang terdaftar.</p>
        )}

        {/* Floating Portal Dropdown Menu */}
        {typeof document !== 'undefined' &&
          openMenu &&
          (() => {
            const targetShift = shifts.data?.find((s) => s.id === openMenu.id);
            if (!targetShift) return null;
            return createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: `${openMenu.top}px`,
                  right: `${openMenu.right}px`,
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-38 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-black/5 z-9999 py-1 text-xs divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      handleStartEdit(targetShift);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-left font-medium transition-colors"
                  >
                    <Pencil className="size-3.5 text-zinc-500" />
                    <span>Edit Shift</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      toggleStatusMutation.mutate({
                        id: targetShift.id,
                        isActive: !targetShift.isActive,
                      });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-left font-medium transition-colors"
                  >
                    <Power className="size-3.5 text-zinc-500" />
                    <span>{targetShift.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </button>
                </div>
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      setDeleteConfirmId(targetShift.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left font-medium transition-colors"
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                    <span>Hapus Shift</span>
                  </button>
                </div>
              </div>,
              document.body,
            );
          })()}
      </CardContent>
    </Card>
  );
}

function ShiftCheckoutPolicyCard({
  settings,
  onSave,
  saving,
}: {
  settings: CompanySettingDto[] | undefined;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) {
  const currentSetting = settings?.find(
    (s) => s.key === 'attendance.checkout_earliest_buffer_minutes',
  );
  const [bufferVal, setBufferVal] = useState(currentSetting?.value ?? '30');

  useEffect(() => {
    if (currentSetting?.value) {
      setBufferVal(currentSetting.value);
    }
  }, [currentSetting?.value]);

  const isDirty = bufferVal !== (currentSetting?.value ?? '30');

  const calcSampleCheckout = (bufferStr: string) => {
    const b = Math.max(0, parseInt(bufferStr, 10) || 0);
    const endMinutes = 17 * 60; // Contoh shift jam 17:00
    const earliest = Math.max(0, endMinutes - b);
    const hh = String(Math.floor(earliest / 60)).padStart(2, '0');
    const mm = String(earliest % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return (
    <Card className="mt-6 border border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-white">
          <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
          Kebijakan Batas Waktu Check-out Pulang Shift
        </CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Mencegah karyawan langsung melakukan check-out setelah check-in. Tombol check-out baru terbuka menjelang jam selesai shift kerja.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          <div className="space-y-2">
            <Label
              htmlFor="checkout-buffer"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Batas Waktu Awal Check-out Sebelum Shift Selesai (Menit)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="checkout-buffer"
                type="number"
                min="0"
                max="300"
                value={bufferVal}
                onChange={(e) => setBufferVal(e.target.value)}
                className="w-28 font-mono text-sm"
              />
              <span className="text-xs text-zinc-500 font-medium">menit sebelum jam pulang</span>
              <Button
                size="sm"
                onClick={() =>
                  onSave('attendance.checkout_earliest_buffer_minutes', bufferVal)
                }
                disabled={!isDirty || saving}
                className="ml-auto"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : (
                  <Save className="size-3.5 mr-1" />
                )}
                Simpan Aturan
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
              <strong>Contoh:</strong> Jika shift kerja berakhir pukul <strong>17:00</strong> dan aturan diisi <strong>{bufferVal || '0'} menit</strong>, maka check-out dibuka mulai pukul <strong>{calcSampleCheckout(bufferVal)} WIB</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <ShieldCheck className="size-4" />
              Ketentuan Pulang Lebih Awal (Early Leave)
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/80">
              Karyawan yang terpaksa pulang sebelum jam tersebut (misal karena sakit atau urusan keluarga darurat) <strong>wajib menyertakan alasan izin</strong> pada catatan. Presensi akan otomatis tercatat sebagai <strong>Pulang Cepat</strong>.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
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

type SettingsTab = 'company' | 'shifts' | 'holidays';

export default function SettingsPage() {
  const authApi = useAuthApi();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as SettingsTab;
      if (tab && ['company', 'shifts', 'holidays'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [year, setYear] = useState(new Date().getFullYear());
  const [holDate, setHolDate] = useState('');
  const [holName, setHolName] = useState('');
  const [holRecurring, setHolRecurring] = useState(false);

  const canManage = !!user && (roleAtLeast(user.role, 'hrd') || user.role === 'owner' || user.role === 'superadmin');

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

  if (!canManage) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-zinc-500">
          Halaman ini khusus untuk admin, HRD, dan owner.
        </p>
      </div>
    );
  }

  const SETTINGS_TABS: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    {
      id: 'company',
      label: 'Perusahaan & Lokasi',
      icon: Building2,
      badge: settings.data
        ? `${settings.data.filter((s) => s.key !== 'portal.theme_config' && s.key !== 'attendance.photo_retention_days' && s.key !== 'attendance.checkout_earliest_buffer_minutes').length}`
        : undefined,
    },
    {
      id: 'shifts',
      label: 'Jadwal Shift',
      icon: Clock,
    },
    {
      id: 'holidays',
      label: 'Kalender Libur',
      icon: CalendarDays,
      badge: holidays.data ? `${holidays.data.length}` : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Pengaturan Sistem</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Kelola parameter operasional perusahaan, jadwal shift, hari libur, retensi foto, dan tema antarmuka.
        </p>
      </div>

      {/* ── SUB-MENU TABS ── */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-px">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-primary text-primary font-bold dark:border-primary dark:text-primary bg-primary/5 dark:bg-primary/10 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-primary' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: PERUSAHAAN & LOKASI ── */}
      {activeTab === 'company' && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <span>Pengaturan Perusahaan &amp; Lokasi</span>
                <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400 mt-1">
                  Nama resmi entitas, koordinat GPS kantor pusat, radius geofence, dan tarif BPJS Ketenagakerjaan &amp; Kesehatan.
                </p>
              </div>
              <Badge>
                {settings.data
                  ? `${settings.data.filter((s) => s.key !== 'portal.theme_config' && s.key !== 'attendance.photo_retention_days').length} item`
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
                    .filter((s) => s.key !== 'portal.theme_config' && s.key !== 'attendance.photo_retention_days' && s.key !== 'attendance.checkout_earliest_buffer_minutes')
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

      {/* ── TAB 2: JADWAL SHIFT ── */}
      {activeTab === 'shifts' && canManage && (
        <div className="space-y-6">
          <ShiftsManagementCard />
          <ShiftCheckoutPolicyCard
            settings={settings.data}
            onSave={(key, value) => saveSetting.mutate({ key, value })}
            saving={saveSetting.isPending}
          />
        </div>
      )}

      {/* ── TAB 3: KALENDER HARI LIBUR ── */}
      {activeTab === 'holidays' && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Kalender Hari Libur</CardTitle>
            <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400 mt-1">
              Hari libur nasional dan keagamaan. Tanggal libur di sini otomatis tidak memotong saldo cuti tahunan karyawan.
            </p>
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
              <label className="flex h-9 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={holRecurring}
                  onChange={(e) => setHolRecurring(e.target.checked)}
                  className="size-4 accent-zinc-900 dark:accent-zinc-100"
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
              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left text-xs text-zinc-500 dark:text-zinc-400">
                      <th className="px-3 py-2 font-medium">Tanggal</th>
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Tahunan</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {holidays.data.map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                          {fmtDate(h.date)}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{h.name}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Tidak ada hari libur untuk tahun {year}.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
