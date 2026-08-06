import { create } from 'zustand';
import type { AuthUser } from '@gasela/shared-types';
import { tokenStore, userStore, secureStorage } from '../services/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  tokenExpiresAt: number | null;
  isHydrated: boolean;
  setSession: (
    session: {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
      expiresIn?: number;
    },
    rememberMe?: boolean
  ) => void;
  updateTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => void;
  clearSession: () => void;
  restoreSession: () => Promise<void>;
  isTokenExpiring: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: tokenStore.getAccessToken() ?? null,
  refreshToken: tokenStore.getRefreshToken() ?? null,
  user: userStore.get(),
  tokenExpiresAt: tokenStore.getTokenExpiresAt() ?? null,
  isHydrated: false,
  setSession: ({ accessToken, refreshToken, user, expiresIn = 900 }, rememberMe = false) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    tokenStore.setTokens(accessToken, refreshToken, expiresAt);
    userStore.set(user);
    set({ accessToken, refreshToken, user, tokenExpiresAt: expiresAt });

    if (rememberMe) {
      secureStorage.saveSession({ accessToken, refreshToken, user, tokenExpiresAt: expiresAt });
    } else {
      secureStorage.clearSession();
    }
  },
  updateTokens: (accessToken, refreshToken, expiresIn = 900) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    tokenStore.setTokens(accessToken, refreshToken, expiresAt);
    set({ accessToken, refreshToken, tokenExpiresAt: expiresAt });
  },
  clearSession: () => {
    tokenStore.clear();
    secureStorage.clearSession();
    set({ accessToken: null, refreshToken: null, user: null, tokenExpiresAt: null });
  },
  restoreSession: async () => {
    try {
      const session = await secureStorage.getSession();
      if (session) {
        tokenStore.setTokens(session.accessToken, session.refreshToken, session.tokenExpiresAt);
        userStore.set(session.user);
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          tokenExpiresAt: session.tokenExpiresAt,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
  isTokenExpiring: () => {
    const expiresAt = get().tokenExpiresAt;
    if (!expiresAt) return true;
    // Token expiring in less than 2 minutes
    return Date.now() > expiresAt - 120_000;
  },
}));
