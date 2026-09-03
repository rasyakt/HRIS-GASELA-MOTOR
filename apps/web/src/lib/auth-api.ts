'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api, ApiError } from './api-client';

// BUG-007 & BUG-015 FIX: Simpan referensi promise di module-level agar semua
// request berbagi satu refresh yang sedang berjalan.
// Race condition sebelumnya: `await refreshPromise` setelah finally() clear → await null → undefined (falsy)
// Fix: simpan ke variabel lokal sebelum await, sehingga referensi tidak bisa hilang.
let activeRefreshPromise: Promise<boolean> | null = null;

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
        if (!activeRefreshPromise) {
          activeRefreshPromise = refreshAccessToken(refreshToken, updateTokens, clearSession)
            .finally(() => {
              activeRefreshPromise = null;
            });
        }

        // BUG-015 FIX: Simpan ke variabel lokal SEBELUM await
        // agar race condition finally() tidak mengubah referensi menjadi null
        // di sela-sela await (yang akan membuat `await null` = undefined = falsy = logout salah)
        const pendingRefresh = activeRefreshPromise;
        const refreshed = await pendingRefresh;
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
          if (refreshToken) {
            // Jika ada refresh yang sedang berjalan, tunggu hasilnya
            // Jika tidak ada, mulai yang baru
            const pendingRefresh = activeRefreshPromise
              ?? refreshAccessToken(refreshToken, updateTokens, clearSession);

            const refreshed = await pendingRefresh;
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
