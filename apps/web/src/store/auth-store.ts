import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@gasela/shared-types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  tokenExpiresAt: number | null;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    expiresIn?: number;
  }) => void;
  setUser: (user: AuthUser) => void;
  updateTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => void;
  clearSession: () => void;
  isTokenExpiring: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      tokenExpiresAt: null,
      setSession: ({ accessToken, refreshToken, user, expiresIn = 900 }) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({ accessToken, refreshToken, user, tokenExpiresAt: expiresAt });
      },
      setUser: (user) => set({ user }),
      updateTokens: (accessToken, refreshToken, expiresIn = 900) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({ accessToken, refreshToken, tokenExpiresAt: expiresAt });
      },
      clearSession: () => set({ 
        accessToken: null, 
        refreshToken: null, 
        user: null,
        tokenExpiresAt: null 
      }),
      isTokenExpiring: () => {
        const expiresAt = get().tokenExpiresAt;
        if (!expiresAt) return true;
        // Token expiring in less than 2 minutes
        return Date.now() > expiresAt - 120000;
      },
    }),
    { name: 'gasela-auth' },
  ),
);