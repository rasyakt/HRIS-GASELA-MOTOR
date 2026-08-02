'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api, ApiError } from './api-client';

export function useAuthApi() {
  const token = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();

  return useCallback(
    async function authApi<T>(
      path: string,
      options: RequestInit = {},
    ): Promise<T> {
      try {
        return await api<T>(path, { ...options, token });
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          clearSession();
          router.replace('/login');
        }
        throw err;
      }
    },
    [token, clearSession, router],
  );
}
