'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api, ApiError } from './api-client';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(
  refreshToken: string,
  updateTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => void,
  clearSession: () => void,
): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return false;
    }

    const data = await response.json();
    updateTokens(data.accessToken, data.refreshToken, data.expiresIn);
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearSession();
    return false;
  }
}

export function useAuthApi() {
  const token = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isTokenExpiring = useAuthStore((s) => s.isTokenExpiring);
  const updateTokens = useAuthStore((s) => s.updateTokens);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();

  return useCallback(
    async function authApi<T>(
      path: string,
      options: RequestInit = {},
    ): Promise<T> {
      // Check if token is expiring and refresh if needed
      if (refreshToken && isTokenExpiring()) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken(refreshToken, updateTokens, clearSession)
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        const refreshed = await refreshPromise;
        if (!refreshed) {
          router.replace('/login');
          throw new Error('Session expired. Please login again.');
        }
      }

      try {
        // Use the potentially new token from store
        const currentToken = useAuthStore.getState().accessToken;
        return await api<T>(path, { ...options, token: currentToken });
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          // Try to refresh one more time on 401
          if (refreshToken && !isRefreshing) {
            const refreshed = await refreshAccessToken(refreshToken, updateTokens, clearSession);
            if (refreshed) {
              // Retry the original request with new token
              const newToken = useAuthStore.getState().accessToken;
              return await api<T>(path, { ...options, token: newToken });
            }
          }
          
          clearSession();
          router.replace('/login');
        }
        throw err;
      }
    },
    [token, refreshToken, isTokenExpiring, updateTokens, clearSession, router],
  );
}
