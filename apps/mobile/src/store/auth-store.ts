import { create } from 'zustand';
import type { AuthUser } from '@gasela/shared-types';
import { tokenStore, userStore } from '../services/storage';

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
  updateTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => void;
  clearSession: () => void;
  isTokenExpiring: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: tokenStore.getAccessToken() ?? null,
  refreshToken: tokenStore.getRefreshToken() ?? null,
  user: userStore.get(),
  tokenExpiresAt: tokenStore.getTokenExpiresAt() ?? null,
  setSession: ({ accessToken, refreshToken, user, expiresIn = 900 }) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    tokenStore.setTokens(accessToken, refreshToken, expiresAt);
    userStore.set(user);
    set({ accessToken, refreshToken, user, tokenExpiresAt: expiresAt });
  },
  updateTokens: (accessToken, refreshToken, expiresIn = 900) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    tokenStore.setTokens(accessToken, refreshToken, expiresAt);
    set({ accessToken, refreshToken, tokenExpiresAt: expiresAt });
  },
  clearSession: () => {
    tokenStore.clear();
    set({ accessToken: null, refreshToken: null, user: null, tokenExpiresAt: null });
  },
  isTokenExpiring: () => {
    const expiresAt = get().tokenExpiresAt;
    if (!expiresAt) return true;
    // Token expiring in less than 2 minutes
    return Date.now() > expiresAt - 120_000;
  },
}));
