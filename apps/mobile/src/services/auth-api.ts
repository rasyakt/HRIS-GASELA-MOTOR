import { useCallback } from 'react';
import { useAuthStore } from '../store/auth-store';
import { api, ApiError } from './api-client';

export function useAuthApi() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);

  return useCallback(
    async function authApi<T>(
      path: string,
      options: RequestInit = {},
    ): Promise<T> {
      try {
        return await api<T>(path, { ...options, token: accessToken });
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          clearSession();
        }
        throw err;
      }
    },
    [accessToken, clearSession],
  );
}
