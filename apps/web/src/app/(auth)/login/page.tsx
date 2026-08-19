'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginResponse } from '@gasela/shared-types';
import { loginSchema } from '@gasela/shared-types';
import { Loader2, ArrowRight, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input, PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { GaselaLogo } from '@/components/ui/logo';

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const homePath = user?.role === 'landing_admin' ? '/landing-cms' : '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (accessToken) router.replace(homePath);
  }, [accessToken, router, homePath]);

  async function onSubmit(values: { username: string; password: string }) {
    setError(null);
    try {
      const session = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSession(session);
      router.replace(session.user.role === 'landing_admin' ? '/landing-cms' : '/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Gagal menghubungi server. Pastikan backend berjalan.',
      );
    }
  }

  return (
    <main className="flex min-h-screen w-full">

      {/* Left Panel — Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex">
        {/* Background Image Gasela Motor */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/gasela_motor.png')` }}
        />
        {/* Dark Overlay gradient for high contrast & premium readability */}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/50 pointer-events-none" />

        {/* Decorative grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[48px_48px] pointer-events-none" />
        {/* Soft glow orbs */}
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-zinc-600/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <GaselaLogo variant="full-light" size="lg" />
        </div>

        {/* Center tagline */}
        <div className="relative z-10 space-y-5">
          
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
            Human Resource<br />
            <span className="text-zinc-500">Information System</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
            Platform terpadu untuk pengelolaan data karyawan, penggajian, absensi, dan administrasi sumber daya manusia Gasela Motor.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8">
          {[
            { label: 'Karyawan Aktif', value: 'Multi-divisi' },
            { label: 'Perhitungan Gaji', value: 'Otomatis' },
            { label: 'Laporan', value: 'Real-time' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xs font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Mobile Logo */}
          <div className="mb-10 lg:hidden">
            <GaselaLogo variant="full-dark" size="md" />
          </div>

          {/* Heading */}
          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              Selamat Datang
            </h2>
            <p className="text-sm text-zinc-500">
              Masuk menggunakan akun karyawan Anda untuk melanjutkan.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <Input
                  id="username"
                  autoComplete="username"
                  autoFocus
                  placeholder="Masukkan username Anda"
                  className="h-11 rounded-lg border-zinc-200 bg-zinc-50 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                  aria-invalid={!!errors.username}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="text-xs font-medium text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 rounded-lg border-zinc-200 bg-zinc-50 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-400" />
                <p className="text-xs font-medium leading-relaxed text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative mt-2 flex h-11 w-full items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-zinc-950 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memproses…</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} CV.GASELA · HRIS v1.0
          </p>
        </div>
      </div>

    </main>
  );
}
