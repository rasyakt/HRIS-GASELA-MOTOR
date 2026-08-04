'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Loader2, Printer, Wallet, PlusCircle, Download } from 'lucide-react';
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
                {detail.components.map((c) => (
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
    <Card>
      <CardHeader>
        <CardTitle>Generate Gaji</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="gen-month">Bulan</Label>
            <select
              id="gen-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="gen-year">Tahun</Label>
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
          <p className="mt-3 text-sm text-red-600">
            {generate.error instanceof Error
              ? generate.error.message
              : 'Gagal generate gaji'}
          </p>
        )}
      </CardContent>
    </Card>
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
        <h2 className="text-lg font-semibold text-zinc-900">Penggajian</h2>
        <p className="text-sm text-zinc-500">
          {isAdmin
            ? 'Generate, tinjau, setujui, dan tandai pembayaran gaji.'
            : 'Slip gaji Anda.'}
        </p>
      </div>

      {isAdmin && (
        <>
          <GenerateCard onDone={(r) => setGenerateResult(r.batch)} />
          {generateResult && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="py-3 text-sm text-emerald-800">
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
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>Slip Gaji</span>
                <Badge>{data ? `${data.total} slip` : '…'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="f-month">Bulan</Label>
                  <select
                    id="f-month"
                    value={month ?? ''}
                    onChange={(e) => {
                      setMonth(e.target.value ? Number(e.target.value) : undefined);
                      setPage(1);
                      setSelected(new Set());
                    }}
                    className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm"
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
                  <Label htmlFor="f-year">Tahun</Label>
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
                  <Label htmlFor="f-status">Status</Label>
                  <select
                    id="f-status"
                    value={status ?? ''}
                    onChange={(e) => {
                      setStatus(e.target.value || undefined);
                      setPage(1);
                      setSelected(new Set());
                    }}
                    className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm"
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                          <th className="pb-2 pr-3 font-medium">
                            <input
                              type="checkbox"
                              className="size-4 accent-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed"
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
                          <th className="pb-2 pr-3 font-medium">No.</th>
                          <th className="pb-2 pr-3 font-medium">Nama</th>
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
                        {data.items.map((r) => {
                          const selectable =
                            r.status === 'draft' || r.status === 'approved';
                          return (
                            <tr
                              key={r.id}
                              className="border-b border-zinc-100 last:border-0"
                            >
                              <td className="py-2 pr-3">
                                {selectable && (
                                  <input
                                    type="checkbox"
                                    className="size-4 accent-zinc-900"
                                    checked={selected.has(r.id)}
                                    onChange={() => toggle(r.id)}
                                  />
                                )}
                              </td>
                              <td className="py-2 pr-3 font-medium text-zinc-900">
                                {r.payrollNumber}
                              </td>
                              <td className="py-2 pr-3 text-zinc-900">
                                {r.employeeName}
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
              <div className="overflow-x-auto">
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
                            Lihat Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
