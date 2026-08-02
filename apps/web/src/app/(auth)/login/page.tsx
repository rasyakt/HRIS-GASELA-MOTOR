'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginResponse } from '@gasela/shared-types';
import { loginSchema } from '@gasela/shared-types';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (accessToken) router.replace('/dashboard');
  }, [accessToken, router]);

  async function onSubmit(values: { username: string; password: string }) {
    setError(null);
    try {
      const session = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSession(session);
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Gagal menghubungi server. Pastikan backend berjalan.',
      );
    }
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-900 px-4 py-12">
      <Card className="w-full max-w-md border-slate-800 bg-slate-950/90 text-slate-100 shadow-2xl backdrop-blur-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/30">
            G
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              HRIS Gasela Motor
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-400">
              Masuk menggunakan akun karyawan Anda.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="mis. employee / admin"
                className="border-slate-700 bg-slate-900/90 text-white placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs font-medium text-red-400">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="border-slate-700 bg-slate-900/90 text-white placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs font-medium text-red-400">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 text-xs font-medium text-red-300">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-2 w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <LogIn data-icon="inline-start" />
              )}
              {isSubmitting ? 'Memproses…' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
