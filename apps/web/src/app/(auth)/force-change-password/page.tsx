'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  ArrowRight,
  LogOut,
  Loader2,
  AlertCircle,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { api, ApiError } from '@/lib/api-client';
import { GaselaLogo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import type { LoginResponse } from '@gasela/shared-types';

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect guard
  useEffect(() => {
    if (hasHydrated) {
      if (!token) {
        router.replace('/login');
      } else if (user && !user.mustChangePassword) {
        router.replace('/dashboard');
      }
    }
  }, [hasHydrated, token, user, router]);

  // Live password validation rules
  const rules = useMemo(() => {
    const hasMinLength = newPassword.length >= 12;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
    const notRepeated = !/(.)\1{5,}/.test(newPassword);

    const isNotDefaultOrOld =
      Boolean(newPassword) &&
      newPassword.toLowerCase() !== 'gasela123!' &&
      newPassword !== oldPassword;

    const usernameLower = (user?.username || '').trim().toLowerCase();
    const notContainUsername =
      !usernameLower ||
      usernameLower.length < 3 ||
      !newPassword.toLowerCase().includes(usernameLower);

    const confirmMatches =
      Boolean(newPassword) &&
      Boolean(confirmPassword) &&
      newPassword === confirmPassword;

    return {
      hasMinLength,
      hasCombo: hasUpper && hasLower && hasNumber && hasSymbol,
      notRepeated,
      isNotDefaultOrOld,
      notContainUsername,
      confirmMatches,
    };
  }, [newPassword, oldPassword, confirmPassword, user?.username]);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-zinc-200 dark:bg-zinc-700' };

    let passed = 0;
    if (rules.hasMinLength) passed++;
    if (rules.hasCombo) passed++;
    if (rules.isNotDefaultOrOld && rules.notContainUsername && rules.notRepeated) passed++;

    if (passed <= 1) {
      return { score: 33, label: 'Lemah', color: 'bg-red-500' };
    }
    if (passed === 2) {
      return { score: 66, label: 'Cukup', color: 'bg-amber-500' };
    }
    return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500' };
  }, [newPassword, rules]);

  const allRulesPassed =
    rules.hasMinLength &&
    rules.hasCombo &&
    rules.notRepeated &&
    rules.isNotDefaultOrOld &&
    rules.notContainUsername &&
    rules.confirmMatches &&
    Boolean(oldPassword.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed || submitting) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const response = await api<LoginResponse>('/api/auth/change-password', {
        method: 'POST',
        token,
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      setSuccessMsg('Password berhasil diperbarui! Mengalihkan ke Dashboard…');

      // Update session with fresh tokens & updated user
      if (response && response.accessToken && response.user) {
        setSession({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || '',
          user: response.user,
          expiresIn: response.expiresIn || 900,
        });
      }

      setTimeout(() => {
        router.replace('/dashboard');
      }, 800);
    } catch (err: any) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : err?.message || 'Gagal mengubah password. Pastikan password lama benar.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await api('/api/auth/logout', { method: 'POST', token });
      }
    } catch {
      // Ignore
    } finally {
      clearSession();
      router.replace('/login');
    }
  };

  if (!hasHydrated || !token) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-400">Memuat…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 transition-colors">
      {/* Background Decorative Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[36px_36px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-emerald-600/5 blur-3xl" />

      {/* Header Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between">
        <GaselaLogo variant="full-dark" size="sm" showText />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="mr-1.5 size-3.5" />
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-md py-6">
        <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-8 shadow-2xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none transition-all">
          {/* Card Title & Icon */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <ShieldCheck className="size-5.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Pengamanan Akun
                </span>
                <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  Ubah Password Anda
                </h1>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Halo <strong className="text-zinc-800 dark:text-zinc-200">{user?.fullName || user?.username}</strong>, demi keamanan akun dan data internal perusahaan, Anda diwajibkan memperbarui kata sandi sebelum melanjutkan.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 dark:border-red-900/60 dark:bg-red-950/40">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium leading-relaxed text-red-800 dark:text-red-300">
                {errorMsg}
              </p>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium leading-relaxed text-emerald-800 dark:text-emerald-300">
                {successMsg}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Lama / Default */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password Default / Lama
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password default (contoh: Gasela123!)"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pl-10 pr-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-white dark:focus:border-emerald-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
                >
                  {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password Baru yang Kuat
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 12 karakter kombinasi"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pl-10 pr-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-white dark:focus:border-emerald-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Strength Meter Bar */}
              {newPassword && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Konfirmasi Password Baru */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pl-10 pr-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-white dark:focus:border-emerald-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Compact Requirements Checklist */}
            <div className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Ketentuan Kata Sandi
              </p>
              <div className="space-y-1.5 text-xs">
                <CheckItem valid={rules.hasMinLength} label="Minimal 12 karakter" />
                <CheckItem valid={rules.hasCombo} label="Kombinasi A-Z, a-z, 0-9 & simbol (@, #, $, dll)" />
                <CheckItem valid={rules.isNotDefaultOrOld} label="Bukan password default / password lama" />
                <CheckItem valid={rules.notContainUsername} label="Tidak memuat NIK atau Username" />
                <CheckItem valid={rules.confirmMatches} label="Konfirmasi password cocok" />
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={!allRulesPassed || submitting}
                className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-xs text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan Kata Sandi…
                  </>
                ) : (
                  <>
                    Simpan Password & Masuk ke Dashboard
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-md text-center text-[11px] text-zinc-400 dark:text-zinc-600">
        &copy; {new Date().getFullYear()} PT Gasela Jaya Motor &bull; HRIS Security Guard
      </footer>
    </div>
  );
}

function CheckItem({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {valid ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Circle className="size-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
      )}
      <span className={valid ? 'font-medium text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'}>
        {label}
      </span>
    </div>
  );
}

