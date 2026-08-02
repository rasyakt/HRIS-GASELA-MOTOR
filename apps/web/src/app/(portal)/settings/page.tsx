'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Loader2, Save, Trash2 } from 'lucide-react';
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
  'company.name': 'Nama perusahaan (muncul di header payslip)',
  'office.location': 'JSON koordinat kantor: {"lat":-6.9,"lng":107.6}',
  'office.radius_meters': 'Radius geofence check-in/out dalam meter',
  'bpjs.rates': 'JSON rate & cap BPJS: {"kesehatanRateEmployee":0.01,...}',
  'overtime.rate_multiplier_weekday': 'Pengali upah lembur hari kerja (mis. 1.5)',
};

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
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-sm font-medium text-zinc-900">
            {setting.key}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {SETTING_HINTS[setting.key] ?? setting.description}
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onSave(value)}
          disabled={!dirty || saving}
        >
          {saving ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Simpan
        </Button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={setting.key === 'bpjs.rates' ? 5 : 2}
        className="mt-3 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
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
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <CalendarPlus data-icon="inline-start" />
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
                  <tbody>
                    {holidays.data.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-zinc-100 last:border-0"
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
