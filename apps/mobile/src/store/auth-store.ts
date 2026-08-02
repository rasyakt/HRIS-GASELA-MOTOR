import { create } from 'zustand';
import type { AuthUser } from '@gasela/shared-types';
import { tokenStore, userStore } from '../services/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: tokenStore.getAccessToken() ?? null,
  refreshToken: tokenStore.getRefreshToken() ?? null,
  user: userStore.get(),
  setSession: ({ accessToken, refreshToken, user }) => {
    tokenStore.setTokens(accessToken, refreshToken);
    userStore.set(user);
    set({ accessToken, refreshToken, user });
  },
  clearSession: () => {
    tokenStore.clear();
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
