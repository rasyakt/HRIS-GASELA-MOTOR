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
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">HRIS Gasela Motor</CardTitle>
          <CardDescription>Masuk menggunakan akun karyawan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="mis. employee"
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
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
