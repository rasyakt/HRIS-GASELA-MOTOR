'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  KeyRound,
  Copy,
  Download,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import type {
  TwoFactorEnableResponse,
  TwoFactorRegenerateResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from '@gasela/shared-types';
import { useAuthApi } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TwoFactorAuthCard() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();

  // Dialog / Modal states
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2>(1); // 1: QR & Verify, 2: Recovery Codes
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [receivedCodes, setReceivedCodes] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable modal states
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  // Regenerate modal states
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');

  // Message feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Query 2FA status
  const statusQuery = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => authApi<TwoFactorStatusResponse>('/api/auth/2fa/status'),
  });

  // Setup mutation
  const setupMutation = useMutation({
    mutationFn: () => authApi<TwoFactorSetupResponse>('/api/auth/2fa/setup', { method: 'POST' }),
    onSuccess: (data) => {
      setSetupData(data);
      setSetupStep(1);
      setOtpInput('');
      setSetupModalOpen(true);
      setFeedback(null);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Gagal memulai setup 2FA.' });
    },
  });

  // Enable mutation
  const enableMutation = useMutation({
    mutationFn: (code: string) =>
      authApi<TwoFactorEnableResponse>('/api/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      setReceivedCodes(data.recoveryCodes || []);
      setSetupStep(2);
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setFeedback({ type: 'success', message: '2FA berhasil diaktifkan!' });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Kode OTP salah atau kadaluarsa.' });
    },
  });

  // Disable mutation
  const disableMutation = useMutation({
    mutationFn: (password: string) =>
      authApi<{ message: string }>('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    onSuccess: () => {
      setDisableModalOpen(false);
      setDisablePassword('');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setFeedback({ type: 'success', message: '2FA berhasil dinonaktifkan.' });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Password konfirmasi salah.' });
    },
  });

  // Regenerate codes mutation
  const regenerateMutation = useMutation({
    mutationFn: (password: string) =>
      authApi<TwoFactorRegenerateResponse>('/api/auth/2fa/recovery-codes', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    onSuccess: (data) => {
      setReceivedCodes(data.recoveryCodes || []);
      setRegenerateModalOpen(false);
      setRegeneratePassword('');
      setSetupStep(2);
      setSetupModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setFeedback({ type: 'success', message: 'Kode pemulihan baru berhasil dibuat.' });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Password konfirmasi salah.' });
    },
  });

  // Handlers
  const handleCopyKey = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCodes = () => {
    if (!receivedCodes.length) return;
    navigator.clipboard.writeText(receivedCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    if (!receivedCodes.length) return;
    const content = `HRIS GASELA MOTOR - RECOVERY CODES\nTanggal Dibuat: ${new Date().toLocaleString('id-ID')}\n\nKode Pemulihan Cadangan (Gunakan 1x jika kehilangan ponsel):\n` +
      receivedCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\nSimpan dokumen ini di tempat yang aman dan rahasia.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HRIS_Gasela_2FA_Recovery_Codes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isEnabled = statusQuery.data?.enabled;

  return (
    <>
      <Card className="shadow-2xs border-zinc-200 dark:border-zinc-800">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
              <ShieldCheck className="size-4.5 text-zinc-500 dark:text-zinc-400" />
              Autentikasi Dua Langkah (2FA)
            </CardTitle>
            {statusQuery.isLoading ? (
              <Loader2 className="size-4 animate-spin text-zinc-400" />
            ) : isEnabled ? (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium">
                Aktif
              </Badge>
            ) : (
              <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 font-medium">
                Nonaktif
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Tingkatkan keamanan akun Anda dengan mewajibkan kode 6 digit dari aplikasi Authenticator (Google Authenticator, Microsoft Authenticator, atau Authy) setiap kali login.
          </p>

          {feedback && (
            <div
              className={`flex gap-2 items-start rounded-lg p-3 text-xs font-semibold border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/50'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {isEnabled ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 text-xs text-zinc-600 dark:text-zinc-300">
                <Smartphone className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Akun Anda dilindungi dengan TOTP Authenticator.</span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegeneratePassword('');
                    setFeedback(null);
                    setRegenerateModalOpen(true);
                  }}
                  className="w-full justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200"
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Buat Ulang Recovery Codes
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDisablePassword('');
                    setFeedback(null);
                    setDisableModalOpen(true);
                  }}
                  className="w-full justify-center text-xs font-semibold text-red-600 dark:text-red-400 border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <ShieldAlert className="mr-1.5 size-3.5" />
                  Nonaktifkan 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                className="w-full text-xs font-semibold h-9.5"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Menyiapkan 2FA…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-1.5 size-4" />
                    Aktifkan Autentikasi 2 Langkah
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= MODAL: SETUP 2FA & RECOVERY CODES ================= */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSetupModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="size-4" />
            </button>

            {setupStep === 1 ? (
              /* STEP 1: SCAN QR CODE & ENTER 6-DIGIT OTP */
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                    Setup Autentikasi 2 Langkah
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Langkah 1: Pindai QR Code menggunakan aplikasi Authenticator pada ponsel Anda.
                  </p>
                </div>

                {/* QR Code container */}
                {setupData?.qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                    <img
                      src={setupData.qrCodeUrl}
                      alt="QR Code 2FA"
                      className="size-44 rounded-lg bg-white p-2 shadow-xs"
                    />
                    <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                      Google Authenticator / Authy / Microsoft Authenticator
                    </p>
                  </div>
                )}

                {/* Secret Key fallback */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                    Atau masukkan kode secara manual:
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 select-all">
                      {setupData?.secret}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyKey}
                      className="shrink-0 text-xs"
                    >
                      {copiedKey ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* OTP Verification form */}
                <div className="space-y-3 pt-2">
                  <Label htmlFor="setup-otp" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Langkah 2: Masukkan Kode OTP 6 Digit Konfirmasi
                  </Label>
                  <Input
                    id="setup-otp"
                    autoFocus
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={6}
                    className="h-11 rounded-lg text-center font-mono text-lg font-bold tracking-widest"
                  />

                  <Button
                    type="button"
                    onClick={() => enableMutation.mutate(otpInput)}
                    disabled={enableMutation.isPending || otpInput.trim().length !== 6}
                    className="w-full font-semibold"
                  >
                    {enableMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Memverifikasi…
                      </>
                    ) : (
                      'Konfirmasi & Aktifkan 2FA'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* STEP 2: BACKUP RECOVERY CODES */
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      ✓
                    </span>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                      Simpan Kode Pemulihan Cadangan
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Setiap kode hanya dapat digunakan <span className="font-semibold text-zinc-800 dark:text-zinc-200">1 kali</span> untuk login jika Anda kehilangan akses ke ponsel.
                  </p>
                </div>

                {/* Grid of codes */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {receivedCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-3 py-2 text-center font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 select-all"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyCodes}
                    className="flex-1 text-xs font-semibold"
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="mr-1.5 size-3.5 text-emerald-600" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 size-3.5" />
                        Salin Semua
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadCodes}
                    className="flex-1 text-xs font-semibold"
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Unduh .txt
                  </Button>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => setSetupModalOpen(false)}
                    className="w-full font-semibold"
                  >
                    Saya Sudah Menyimpan Kode Cadangan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: DISABLE 2FA ================= */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setDisableModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="space-y-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  Nonaktifkan Autentikasi 2 Langkah?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Akun Anda tidak lagi memerlukan kode 2FA saat login. Masukkan password akun Anda untuk konfirmasi.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="disable-password" className="text-xs font-semibold">
                    Password Akun
                  </Label>
                  <PasswordInput
                    id="disable-password"
                    autoFocus
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDisableModalOpen(false)}
                    className="flex-1 text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => disableMutation.mutate(disablePassword)}
                    disabled={disableMutation.isPending || !disablePassword}
                    className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
                  >
                    {disableMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'Nonaktifkan'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGENERATE RECOVERY CODES ================= */}
      {regenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setRegenerateModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="space-y-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                <RefreshCw className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  Buat Ulang Kode Pemulihan
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Kode pemulihan sebelumnya akan otomatis dibatalkan. Masukkan password Anda untuk melanjutkan.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="regen-password" className="text-xs font-semibold">
                    Password Akun
                  </Label>
                  <PasswordInput
                    id="regen-password"
                    autoFocus
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegenerateModalOpen(false)}
                    className="flex-1 text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => regenerateMutation.mutate(regeneratePassword)}
                    disabled={regenerateMutation.isPending || !regeneratePassword}
                    className="flex-1 text-xs font-semibold"
                  >
                    {regenerateMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'Buat Ulang'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
