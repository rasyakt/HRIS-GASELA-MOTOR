'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Loader2, Printer, Wallet, PlusCircle, Download, Trash2, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { downloadWithAuth } from '@/lib/download';
import {
  badgeClass,
  fmtDate,
  fmtMonthYear,
  fmtRupiah,
  roleAtLeast,
  statusLabel,
} from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import type {
  PayrollBatchSummary,
  PayrollDetailDto,
  PayrollDto,
  SalaryComponentDto,
} from '@gasela/shared-types';

interface PayrollPage {
  items: PayrollDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function DetailModal({
  detail,
  onClose,
  isAdmin,
  token,
}: {
  detail: PayrollDetailDto;
  onClose: () => void;
  isAdmin: boolean;
  token: string | null;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const path = isAdmin
        ? `/api/payroll/${detail.id}/payslip`
        : `/api/payroll/my/${detail.id}/payslip`;
      await downloadWithAuth(path, token, `payslip_${detail.payrollNumber}.pdf`);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Gagal unduh PDF');
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    const printArea = document.getElementById('payslip-print-area');
    if (!printArea) return;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Slip Gaji — ${detail.payrollNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
          h2 { font-size: 16px; font-weight: bold; margin: 0 0 4px; }
          .sub { color: #555; font-size: 11px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f4f4f5; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #e4e4e7; }
          td { padding: 6px 8px; border-bottom: 1px solid #f4f4f5; }
          td:last-child, th:last-child { text-align: right; }
          .deduction { color: #dc2626; }
          .net-row td { background: #18181b; color: #fff; font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 12px; }
          .label { color: #71717a; }
          .footer { margin-top: 24px; font-size: 10px; color: #a1a1aa; text-align: center; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
        <div class="footer">Dicetak oleh HRIS GaselaPulse — ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Slip Gaji</span>
            <Badge className={badgeClass(detail.status)}>
              {statusLabel(detail.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div id="payslip-print-area">
            <h2>Slip Gaji — {detail.payrollNumber}</h2>
            <p className="text-xs text-zinc-500 mb-3">{detail.employeeName} · {detail.department ?? ''} · {fmtMonthYear(detail.month, detail.year)}</p>
            <div className="grid grid-cols-2 gap-2 text-zinc-600">
            <div>No.</div>
            <div className="font-medium text-zinc-900">{detail.payrollNumber}</div>
            <div>Periode</div>
            <div className="font-medium text-zinc-900">
              {fmtMonthYear(detail.month, detail.year)}
            </div>
            <div>Karyawan</div>
            <div className="font-medium text-zinc-900">{detail.employeeName}</div>
            <div>Departemen</div>
            <div className="font-medium text-zinc-900">{detail.department ?? '—'}</div>
            <div>Tanggal Bayar</div>
            <div className="font-medium text-zinc-900">
              {detail.paymentDate ? fmtDate(detail.paymentDate) : '—'}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-3 py-2 font-medium">Komponen</th>
                  <th className="px-3 py-2 text-right font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="px-3 py-2 text-zinc-700">Gaji Pokok</td>
                  <td className="px-3 py-2 text-right text-zinc-900">
                    {fmtRupiah(detail.basicSalary)}
                  </td>
                </tr>
                {detail.components
                  .filter((c) => c.salaryComponentName.toLowerCase() !== 'gaji pokok' && c.amount > 0)
                  .map((c) => (
                  <tr key={c.salaryComponentId} className="border-b border-zinc-100">
                    <td className="px-3 py-2 text-zinc-700">
                      {c.salaryComponentName}
                      <span className="ml-1 text-xs text-zinc-400">
                        {c.type === 'allowance' ? '(tunjangan)' : '(potongan)'}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2 text-right ${
                        c.type === 'deduction' ? 'text-red-600' : 'text-zinc-900'
                      }`}
                    >
                      {c.type === 'deduction' ? '−' : ''}
                      {fmtRupiah(c.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <td className="px-3 py-2 font-medium text-zinc-700">Lembur</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-900">
                    {fmtRupiah(detail.overtimePay)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-700">
                    Gaji Bruto
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-900">
                    {fmtRupiah(detail.grossSalary)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-3 py-2 text-zinc-600">
                    BPJS Kesehatan (1%)
                  </td>
                  <td className="px-3 py-2 text-right text-red-600">
                    −{fmtRupiah(detail.bpjsKesehatanEmployee)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-3 py-2 text-zinc-600">
                    BPJS Ketenagakerjaan (JHT+JP 3%)
                  </td>
                  <td className="px-3 py-2 text-right text-red-600">
                    −{fmtRupiah(detail.bpjsKetenagakerjaanEmployee)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-3 py-2 text-zinc-600">PPh21 (TER)</td>
                  <td className="px-3 py-2 text-right text-red-600">
                    −{fmtRupiah(detail.taxPph21)}
                  </td>
                </tr>
                <tr className="bg-zinc-900 text-white">
                  <td className="px-3 py-2 font-semibold">Gaji Bersih</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {fmtRupiah(detail.netSalary)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          </div>{/* /payslip-print-area */}

          {downloadError && (
            <p className="text-sm text-red-600">{downloadError}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              Unduh PDF
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer data-icon="inline-start" />
              Cetak
            </Button>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SalaryComponentsModal({ onClose }: { onClose: () => void }) {
  const authApi = useAuthApi();
  const qc = useQueryClient();

  const [editId, setEditId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('0');
  const [editType, setEditType] = useState<'fixed' | 'percentage' | 'formula'>('percentage');

  const components = useQuery({
    queryKey: ['salary-components'],
    queryFn: () => authApi<SalaryComponentDto[]>('/api/payroll/salary-components?includeInactive=true'),
  });

  const updateComp = useMutation({
    mutationFn: ({ id, defaultAmount, calculationType }: { id: number; defaultAmount?: number; calculationType?: 'fixed' | 'percentage' }) =>
      authApi(`/api/payroll/salary-components/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ defaultAmount, calculationType }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-components'] });
      setEditId(null);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900">Kelola Komponen Gaji &amp; THR</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Atur persentase THR dan komponen pendapatan/potongan gaji otomatis.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {components.isLoading ? (
            <p className="text-sm text-zinc-400">Memuat komponen gaji…</p>
          ) : (
            <div className="space-y-3">
              {components.data?.map((c) => {
                const isEditing = editId === c.id;
                const isThr = c.code === 'THR';
                const isGajiPokok = c.code === 'GAJI';
                return (
                  <div key={c.id} className={`rounded-xl border p-4 transition-colors ${isThr ? 'border-amber-300 bg-amber-50/70' : 'border-zinc-200 bg-white'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900">{c.name}</span>
                          <span className="font-mono text-[10px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 font-semibold">{c.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === 'allowance' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {c.type === 'allowance' ? 'Pendapatan' : 'Potongan'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {isGajiPokok ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              Gaji Pokok dihitung otomatis dari profil masing-masing karyawan.
                            </span>
                          ) : (
                            <>
                              Nilai bawaan saat ini:{' '}
                              <strong className="text-zinc-900 font-bold">
                                {c.calculationType === 'percentage' ? `${c.defaultAmount ?? 0}% dari Gaji Pokok` : fmtRupiah(c.defaultAmount ?? 0)}
                              </strong>
                            </>
                          )}
                        </p>
                      </div>

                      {!isEditing ? (
                        <Button
                          size="sm"
                          variant={isThr ? 'default' : 'outline'}
                          className={isThr ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5' : ''}
                          onClick={() => {
                            setEditId(c.id);
                            setEditAmount(String(c.defaultAmount ?? 0));
                            setEditType(c.calculationType);
                          }}
                        >
                          {isThr ? (
                            <>
                              Set THR (Aktifkan/Ubah)
                            </>
                          ) : (
                            'Edit Komponen'
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs font-bold"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                            />
                            <select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value as any)}
                              className="h-8 rounded border border-zinc-300 bg-white px-2 text-xs font-semibold"
                            >
                              <option value="percentage">% (Persentase)</option>
                              <option value="fixed">Rp (Nominal Tetap)</option>
                            </select>
                          </div>
                          <Button
                            size="sm"
                            disabled={updateComp.isPending}
                            onClick={() =>
                              updateComp.mutate({
                                id: c.id,
                                defaultAmount: parseFloat(editAmount) || 0,
                                calculationType: editType === 'formula' ? 'percentage' : editType,
                              })
                            }
                          >
                            {updateComp.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Simpan'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Batal</Button>
                        </div>
                      )}
                    </div>

                    {isThr && (
                      <div className="mt-3 rounded-lg bg-amber-100/90 border border-amber-200 p-3 text-xs text-amber-900 space-y-1.5">
                        <p className="font-bold flex items-center gap-1.5">
                          <Info className="size-3.5 text-amber-700 shrink-0" />
                          Cara Mengaktifkan THR (Cara 1):
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 font-medium">
                          <li>Klik tombol <strong>Set THR</strong> di atas.</li>
                          <li>Isi angka <strong>100</strong> dan pilih <strong>% (Persentase)</strong> agar karyawan menerima 1 bulan Gaji Pokok penuh.</li>
                          <li>Tekan <strong>Simpan</strong>, lalu lakukan <strong>Generate Gaji</strong> pada bulan Hari Raya.</li>
                          <li>*(Setelah bulan Hari Raya selesai, ubah kembali nilainya menjadi <strong>0%</strong> agar THR tidak terhitung di bulan biasa).*</li>
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GenerateCard({
  onDone,
}: {
  onDone: (r: { batch: PayrollBatchSummary }) => void;
}) {
  const authApi = useAuthApi();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showCompModal, setShowCompModal] = useState(false);

  const generate = useMutation({
    mutationFn: () =>
      authApi<{ batch: PayrollBatchSummary }>('/api/payroll/generate', {
        method: 'POST',
        body: JSON.stringify({ month, year }),
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      onDone(r);
    },
  });

  return (
    <>
      {showCompModal && <SalaryComponentsModal onClose={() => setShowCompModal(false)} />}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-900 dark:text-white">Generate Gaji</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowCompModal(true)} className="text-xs font-semibold gap-1.5 border-zinc-200 dark:border-zinc-800">
            <PlusCircle className="size-3.5 text-primary" />
            Kelola Komponen Gaji &amp; THR
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="gen-month" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bulan</Label>
              <select
                id="gen-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-400"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="gen-year" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tahun</Label>
              <Input
                id="gen-year"
                type="number"
                min={2020}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-28"
              />
            </div>
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="font-semibold"
            >
              {generate.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <PlusCircle data-icon="inline-start" />
              )}
              Generate
            </Button>
          </div>
          {generate.isError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {generate.error instanceof Error
                ? generate.error.message
                : 'Gagal generate gaji'}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function PayrollPage() {
  const authApi = useAuthApi();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const [month, setMonth] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [generateResult, setGenerateResult] = useState<PayrollBatchSummary | null>(
    null,
  );

  const isAdmin = !!user && roleAtLeast(user.role, 'admin');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  if (status) params.set('status', status);

  const payroll = useQuery({
    queryKey: ['payroll-list', month, year, status, page],
    queryFn: () => authApi<PayrollPage>(`/api/payroll${isAdmin ? '' : '/my'}?${params}`),
  });

  const detail = useQuery({
    queryKey: ['payroll-detail', detailId],
    queryFn: () =>
      authApi<PayrollDetailDto>(`/api/payroll/${isAdmin ? '' : 'my/'}${detailId}`),
    enabled: detailId !== null,
  });

  const approve = useMutation({
    mutationFn: () =>
      authApi('/api/payroll/approve', {
        method: 'POST',
        body: JSON.stringify({
          payPeriods: [...selected].map((payrollId) => ({ payrollId })),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      setSelected(new Set());
    },
  });

  const markPaid = useMutation({
    mutationFn: () =>
      authApi('/api/payroll/mark-paid', {
        method: 'POST',
        body: JSON.stringify({ payrollIds: [...selected] }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      setSelected(new Set());
    },
  });

  const deleteDrafts = useMutation({
    mutationFn: () =>
      authApi('/api/payroll/drafts', {
        method: 'DELETE',
        body: JSON.stringify({ payrollIds: [...selected] }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      setSelected(new Set());
    },
  });

  if (!user) return null;
  const data = payroll.data;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableRows =
    data?.items.filter((r) => r.status === 'draft' || r.status === 'approved') ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Penggajian</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isAdmin
            ? 'Generate, tinjau, setujui, dan tandai pembayaran gaji.'
            : 'Slip gaji Anda.'}
        </p>
      </div>

      {isAdmin && (
        <>
          <GenerateCard onDone={(r) => setGenerateResult(r.batch)} />
          {generateResult && (
            <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40">
              <CardContent className="py-3 text-sm text-emerald-800 dark:text-emerald-300">
                Generate selesai: {generateResult.totalEmployees} slip dibuat,{' '}
                {generateResult.skipped} dilewati (sudah ada). Total bruto{' '}
                {fmtRupiah(generateResult.summary.totalGross)} · bersih{' '}
                {fmtRupiah(generateResult.summary.totalNet)} · PPh21{' '}
                {fmtRupiah(generateResult.summary.totalPph21)}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-zinc-900 dark:text-white">
                <span>Slip Gaji</span>
                <Badge>{data ? `${data.total} slip` : '…'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="f-month" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bulan</Label>
                  <select
                    id="f-month"
                    value={month ?? ''}
                    onChange={(e) => {
                      setMonth(e.target.value ? Number(e.target.value) : undefined);
                      setPage(1);
                      setSelected(new Set());
                    }}
                    className="h-9 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-400"
                  >
                    <option value="">Semua</option>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-year" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tahun</Label>
                  <Input
                    id="f-year"
                    type="number"
                    placeholder="Semua"
                    value={year ?? ''}
                    onChange={(e) => {
                      setYear(
                        e.target.value ? Number(e.target.value) : undefined,
                      );
                      setPage(1);
                      setSelected(new Set());
                    }}
                    className="w-28"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-status" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Status</Label>
                  <select
                    id="f-status"
                    value={status ?? ''}
                    onChange={(e) => {
                      setStatus(e.target.value || undefined);
                      setPage(1);
                      setSelected(new Set());
                    }}
                    className="h-9 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-400"
                  >
                    <option value="">Semua</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Disetujui</option>
                    <option value="paid">Dibayar</option>
                  </select>
                </div>
              </div>

              {payroll.isLoading ? (
                <p className="text-sm text-zinc-400">Memuat…</p>
              ) : data && data.items.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          <th className="p-3">
                            <input
                              type="checkbox"
                              className="size-4 accent-zinc-900 dark:accent-amber-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={selectableRows.length === 0}
                              checked={
                                selectableRows.length > 0 &&
                                selectableRows.every((r) => selected.has(r.id))
                              }
                              onChange={(e) => {
                                const next = new Set(selected);
                                if (e.target.checked) {
                                  selectableRows.forEach((r) => next.add(r.id));
                                } else {
                                  selectableRows.forEach((r) => next.delete(r.id));
                                }
                                setSelected(next);
                              }}
                            />
                          </th>
                          <th className="p-3">No.</th>
                          <th className="p-3">Nama</th>
                          <th className="p-3">Periode</th>
                          <th className="p-3 text-right">
                            Gaji Bruto
                          </th>
                          <th className="p-3 text-right">
                            Gaji Bersih
                          </th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((r) => {
                          const selectable =
                            r.status === 'draft' || r.status === 'approved';
                          return (
                            <tr
                              key={r.id}
                              className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors last:border-0"
                            >
                              <td className="p-3">
                                {selectable && (
                                  <input
                                    type="checkbox"
                                    className="size-4 accent-zinc-900 dark:accent-amber-500"
                                    checked={selected.has(r.id)}
                                    onChange={() => toggle(r.id)}
                                  />
                                )}
                              </td>
                              <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                                {r.payrollNumber}
                              </td>
                              <td className="p-3 text-zinc-900 dark:text-zinc-100 font-medium">
                                {r.employeeName}
                              </td>
                              <td className="p-3 text-zinc-600 dark:text-zinc-300">
                                {fmtMonthYear(r.month, r.year)}
                              </td>
                              <td className="p-3 text-right text-zinc-600 dark:text-zinc-300 font-mono">
                                {fmtRupiah(r.grossSalary)}
                              </td>
                              <td className="p-3 text-right font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                                {fmtRupiah(r.netSalary)}
                              </td>
                              <td className="p-3">
                                <Badge className={badgeClass(r.status)}>
                                  {statusLabel(r.status)}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDetailId(r.id)}
                                >
                                  Detail
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {data.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || payroll.isFetching}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Sebelumnya
                      </Button>
                      <span className="text-xs text-zinc-500">
                        Halaman {data.page} dari {data.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.totalPages || payroll.isFetching}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Berikutnya
                      </Button>
                    </div>
                  )}

                  {isAdmin && selected.size > 0 && (
                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-4">
                      <span className="text-sm text-zinc-600">
                        {selected.size} slip dipilih
                      </span>
                      <Button
                        size="sm"
                        onClick={() => approve.mutate()}
                        disabled={approve.isPending}
                      >
                        {approve.isPending ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCheck data-icon="inline-start" />
                        )}
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markPaid.mutate()}
                        disabled={markPaid.isPending}
                      >
                        {markPaid.isPending ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                          />
                        ) : (
                          <Wallet data-icon="inline-start" />
                        )}
                        Tandai Dibayar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDrafts.mutate()}
                        disabled={deleteDrafts.isPending}
                      >
                        {deleteDrafts.isPending ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin text-white"
                          />
                        ) : (
                          <Trash2 data-icon="inline-start" className="size-3.5" />
                        )}
                        Hapus Draft
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-zinc-500">
                  {month || year || status
                    ? 'Tidak ada slip gaji untuk filter tersebut.'
                    : 'Belum ada data penggajian. Gunakan "Generate Gaji" untuk membuat slip periode tertentu.'}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
              <span>Slip Gaji Saya</span>
              <Badge>{data ? `${data.total} slip` : '…'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payroll.isLoading ? (
              <p className="text-sm text-zinc-400">Memuat…</p>
            ) : data && data.items.length > 0 ? (
              <>
                {/* Mobile View (Cards) */}
                <div className="grid grid-cols-1 gap-3 lg:hidden">
                  {data.items.map((r) => (
                    <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 text-sm">{fmtMonthYear(r.month, r.year)}</span>
                        <Badge className={badgeClass(r.status)}>{statusLabel(r.status)}</Badge>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mb-1">{r.payrollNumber}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-zinc-500 mb-0.5">Gaji Bruto</p>
                          <p className="font-medium text-zinc-600">{fmtRupiah(r.grossSalary)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 mb-0.5">Gaji Bersih</p>
                          <p className="font-bold text-zinc-900">{fmtRupiah(r.netSalary)}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-right border-t border-zinc-200 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setDetailId(r.id)}
                        >
                          Lihat Slip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                        <th className="pb-2 pr-3 font-medium">No.</th>
                        <th className="pb-2 pr-3 font-medium">Periode</th>
                        <th className="pb-2 pr-3 text-right font-medium">
                          Gaji Bruto
                        </th>
                        <th className="pb-2 pr-3 text-right font-medium">
                          Gaji Bersih
                        </th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-zinc-100 last:border-0"
                        >
                          <td className="py-2 pr-3 font-medium text-zinc-900">
                            {r.payrollNumber}
                          </td>
                          <td className="py-2 pr-3 text-zinc-600">
                            {fmtMonthYear(r.month, r.year)}
                          </td>
                          <td className="py-2 pr-3 text-right text-zinc-600">
                            {fmtRupiah(r.grossSalary)}
                          </td>
                          <td className="py-2 pr-3 text-right font-medium text-zinc-900">
                            {fmtRupiah(r.netSalary)}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge className={badgeClass(r.status)}>
                              {statusLabel(r.status)}
                            </Badge>
                          </td>
                          <td className="py-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailId(r.id)}
                            >
                              Lihat
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Belum ada slip gaji. Hubungi HRD setelah periode gaji diproses.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {detailId !== null && detail.data && (
        <DetailModal
          detail={detail.data}
          onClose={() => setDetailId(null)}
          isAdmin={isAdmin}
          token={token}
        />
      )}
    </div>
  );
}
