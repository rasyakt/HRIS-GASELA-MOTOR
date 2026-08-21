'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Loader2, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
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
              <Input
                type="number" step="0.1" min="0" max="100"
                value={(rates.kesehatanRateEmployee * 100).toFixed(1)}
                onChange={(e) => updateRate('kesehatanRateEmployee', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Standar resmi: 1%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Iuran Perusahaan (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number" step="0.1" min="0" max="100"
                value={(rates.kesehatanRateCompany * 100).toFixed(1)}
                onChange={(e) => updateRate('kesehatanRateCompany', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Standar resmi: 4%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Maksimal Upah Kena BPJS Kes (Rp)</Label>
            <Input
              type="number" step="100000" min="0"
              value={rates.kesehatanCapSalary}
              onChange={(e) => updateRate('kesehatanCapSalary', parseInt(e.target.value, 10) || 0)}
              className="mt-1 text-xs font-semibold"
            />
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
              <Input
                type="number" step="0.1" min="0" max="100"
                value={(rates.jhtRateEmployee * 100).toFixed(1)}
                onChange={(e) => updateRate('jhtRateEmployee', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Tabungan Hari Tua: 2%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">JHT Perusahaan (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number" step="0.1" min="0" max="100"
                value={(rates.jhtRateCompany * 100).toFixed(1)}
                onChange={(e) => updateRate('jhtRateCompany', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Ditanggung Perusahaan: 3.7%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Jaminan Pensiun (JP) Pekerja (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number" step="0.1" min="0" max="100"
                value={(rates.jpRateEmployee * 100).toFixed(1)}
                onChange={(e) => updateRate('jpRateEmployee', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Jaminan Pensiun: 1%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Jaminan Pensiun (JP) Perusahaan (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number" step="0.1" min="0" max="100"
                value={(rates.jpRateCompany * 100).toFixed(1)}
                onChange={(e) => updateRate('jpRateCompany', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Ditanggung Perusahaan: 2%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Maksimal Upah Kena JP (Rp)</Label>
            <Input
              type="number" step="100000" min="0"
              value={rates.jpCapSalary}
              onChange={(e) => updateRate('jpCapSalary', parseInt(e.target.value, 10) || 0)}
              className="mt-1 text-xs font-semibold"
            />
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
              <Input
                type="number" step="0.01" min="0" max="100"
                value={(rates.jkkRateCompany * 100).toFixed(2)}
                onChange={(e) => updateRate('jkkRateCompany', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Risiko standar: 0.24%</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">JKM (Jaminan Kematian) (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number" step="0.01" min="0" max="100"
                value={(rates.jkmRateCompany * 100).toFixed(2)}
                onChange={(e) => updateRate('jkmRateCompany', (parseFloat(e.target.value) || 0) / 100)}
                className="pr-7 text-xs font-semibold"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Standar resmi: 0.3%</p>
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

  if (setting.key === 'bpjs.rates') {
    return <BpjsSettingForm setting={setting} onSave={onSave} saving={saving} />;
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pengaturan Perusahaan</span>
              <Badge>{settings.data ? `${settings.data.length} item` : '…'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings.isLoading ? (
              <p className="text-sm text-zinc-400">Memuat…</p>
            ) : settings.data ? (
              <>
                <div className="space-y-3">
                  {settings.data.map((s) => (
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
