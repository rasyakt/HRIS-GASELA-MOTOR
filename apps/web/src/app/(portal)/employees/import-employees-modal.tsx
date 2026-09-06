'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import type { EmployeeImportResultDto } from '@gasela/shared-types';

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportEmployeesModal({ isOpen, onClose, onSuccess }: ImportEmployeesModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<EmployeeImportResultDto | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/employees/import/template', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Gagal mengunduh template Excel.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Karyawan_Gasela.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengunduh template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setErrorMsg('Hanya file Excel (.xlsx atau .xls) yang diperbolehkan.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Pilih file Excel terlebih dahulu.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Gagal memproses file Excel.');
      }

      setImportResult(data as EmployeeImportResultDto);
      if (data.successCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-zinc-900">
                Import Data Karyawan dari Excel
              </CardTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Tambahkan banyak karyawan sekaligus menggunakan template spreadsheet resmi.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700">
            <X className="size-4" />
          </Button>
        </CardHeader>

        {/* Isi Modal */}
        <CardContent className="p-6 space-y-5 overflow-y-auto flex-1 text-zinc-800">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Langkah 1: Unduh Template */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">1</span>
                Unduh Template Resmi (.xlsx)
              </h4>
              <p className="text-xs text-zinc-500 mt-1 pl-6">
                Gunakan template standar yang sudah dilengkapi contoh data dan daftar opsi resmi.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloadingTemplate}
              onClick={handleDownloadTemplate}
              className="text-xs font-semibold bg-white shrink-0"
            >
              {downloadingTemplate ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 size-3.5 text-emerald-600" />
              )}
              Unduh Template Excel
            </Button>
          </div>

          {/* Langkah 2: Panduan Kolom Wajib & Opsional */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-4 py-3 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-800">Panduan Kolom Wajib & Aturan Pengisian</span>
              </div>
              {showGuide ? <ChevronUp className="size-4 text-zinc-500" /> : <ChevronDown className="size-4 text-zinc-500" />}
            </button>

            {showGuide && (
              <div className="p-4 bg-white text-xs space-y-3.5 border-t border-zinc-100">
                <div>
                  <h5 className="font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px]">WAJIB DIISI</Badge>
                    Kolom yang harus ada pada setiap baris:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-600 pl-1">
                    <li>• <strong>NIK</strong>: Nomor Induk Karyawan unik huruf/angka (mis. <code>EMP-0015</code>)</li>
                    <li>• <strong>Nama Lengkap</strong>: Minimal 3 karakter (mis. <code>Ahmad Fauzi</code>)</li>
                    <li>• <strong>Email</strong>: Format email valid dan belum terdaftar</li>
                    <li>• <strong>Tanggal Bergabung</strong>: Format <code>YYYY-MM-DD</code> (mis. <code>2024-01-15</code>)</li>
                    <li>• <strong>Tipe Kerja</strong>: <code>permanent</code>, <code>contract</code>, <code>internship</code>, <code>freelance</code></li>
                    <li>• <strong>Gaji Pokok</strong>: Angka bulat tanpa Rp/titik (mis. <code>5000000</code>)</li>
                  </ul>
                </div>

                <div className="border-t border-zinc-100 pt-3">
                  <h5 className="font-bold text-zinc-700 flex items-center gap-1.5 mb-2">
                    <Badge className="border-zinc-300 text-zinc-600 font-bold text-[10px] bg-zinc-100">OPSIONAL</Badge>
                    Kolom pelengkap (boleh dikosongkan):
                  </h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Departemen & Jabatan (bisa diisi nama atau kodenya), Status Kerja (default: <code>probation</code>),
                    Status PTKP (default: <code>TK0</code>), No. Telepon, Tanggal Lahir (YYYY-MM-DD), No. KTP (16 digit),
                    NPWP, Alamat Domisili, dan Data Rekening Bank.
                  </p>
                </div>

                <div className="border-t border-zinc-100 pt-2 text-[10px] text-zinc-400">
                  🛡️ <strong>Prinsip Keamanan & Transaksi:</strong> Sistem menerapkan transaksi atomik (All-or-Nothing). Jika terdapat 1 baris yang keliru, sistem tidak akan menyimpan data parsial agar tidak terjadi data ganda saat Anda mengunggah ulang.
                </div>
              </div>
            )}
          </div>

          {/* Langkah 3: Upload Area */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">2</span>
              Pilih File Excel yang Sudah Diisi
            </h4>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 hover:bg-emerald-50/20"
              >
                <Upload className="size-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700">
                  Klik di sini untuk memilih file spreadsheet Excel
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Format didukung: .xlsx atau .xls (Maksimal 20MB, maks. 500 baris)</p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                    <FileCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-xs text-zinc-500">
                    Ganti
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={uploading}
                    onClick={handleUpload}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Mengimpor Data…
                      </>
                    ) : (
                      'Mulai Import Data'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Laporan Hasil Import */}
          {importResult && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                Laporan Hasil Import
              </h4>

              {/* Status Rollback jika ada error */}
              {importResult.errors && importResult.errors.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                      Import Dibatalkan (Rollback Otomatis - Tidak Ada Data Parsial yang Tersimpan)
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Ditemukan <strong>{importResult.errors.length} masalah validasi</strong>. Demi menjaga integritas database dan mencegah data duplikat saat Anda mencoba lagi, <strong>seluruh data ditahan (0 data masuk)</strong> sampai baris yang salah diperbaiki pada file Excel.
                    </p>
                  </div>
                </div>
              ) : importResult.successCount > 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900">100% Data Valid & Berhasil Diimpor!</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Semua <strong>{importResult.successCount} data karyawan</strong> berhasil divalidasi dan disimpan ke sistem database.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-2.5 text-center">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Total Baris</p>
                  <p className="text-lg font-bold text-zinc-800">{importResult.totalRows}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-center">
                  <p className="text-[10px] text-emerald-700 font-semibold uppercase">Tersimpan</p>
                  <p className="text-lg font-bold text-emerald-700">{importResult.successCount}</p>
                </div>
                <div className={`rounded-lg p-2.5 text-center border ${importResult.failedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-zinc-50 border-zinc-200'}`}>
                  <p className={`text-[10px] font-semibold uppercase ${importResult.failedCount > 0 ? 'text-red-700' : 'text-zinc-500'}`}>
                    Perlu Perbaikan
                  </p>
                  <p className={`text-lg font-bold ${importResult.failedCount > 0 ? 'text-red-700' : 'text-zinc-800'}`}>
                    {importResult.failedCount}
                  </p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-red-800">
                    Rincian Baris yang Perlu Diperbaiki ({importResult.errors.length} baris):
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-50/80 border border-red-200 text-[11px] text-red-800 flex items-start gap-2">
                        <span className="font-mono font-bold bg-red-200/80 px-2 py-0.5 rounded text-red-900 shrink-0">
                          Baris {err.row || '—'}
                        </span>
                        <div className="flex-1">
                          {err.employeeNumber && <span className="font-bold mr-1">[{err.employeeNumber}]</span>}
                          {err.fullName && <span className="font-medium mr-1">{err.fullName}:</span>}
                          {err.field && <span className="underline font-semibold mr-1">Kolom {err.field}:</span>}
                          <span>{err.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
