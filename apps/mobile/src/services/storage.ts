import type { AuthUser } from '@gasela/shared-types';
import * as SecureStore from 'expo-secure-store';

class PersistentSecureMMKV {
  private map = new Map<string, any>();

  constructor() {
    this.preload();
  }

  private async preload() {
    const keys = [
      'app-theme-preference',
      'cached-portal-theme-config',
      'access_token',
      'refresh_token',
      'token_expires_at',
      'user',
    ];
    for (const key of keys) {
      try {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null && val !== undefined) {
          this.map.set(key, val);
        }
      } catch {}
    }
  }

  getString(key: string): string | undefined {
    const val = this.map.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  getNumber(key: string): number {
    const val = this.map.get(key);
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  set(key: string, value: string | number | boolean) {
    const strVal = String(value);
    this.map.set(key, strVal);
    try {
      SecureStore.setItemAsync(key, strVal).catch(() => {});
    } catch {}
  }

  remove(key: string) {
    this.map.delete(key);
    try {
      SecureStore.deleteItemAsync(key).catch(() => {});
    } catch {}
  }
}

let storageInstance: any = new PersistentSecureMMKV();

export const storage = storageInstance;

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at';
const USER_KEY = 'user';

export const tokenStore = {
  getAccessToken: () => storage.getString(ACCESS_TOKEN_KEY),
  getRefreshToken: () => storage.getString(REFRESH_TOKEN_KEY),
  getTokenExpiresAt: () => {
    const val = storage.getNumber(TOKEN_EXPIRES_AT_KEY);
    return val === 0 ? null : val;
  },
  setTokens: (access: string, refresh: string, expiresAt?: number) => {
    storage.set(ACCESS_TOKEN_KEY, access);
    storage.set(REFRESH_TOKEN_KEY, refresh);
    if (expiresAt !== undefined) {
      storage.set(TOKEN_EXPIRES_AT_KEY, expiresAt);
    }
  },
  clear: () => {
    storage.remove(ACCESS_TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove(TOKEN_EXPIRES_AT_KEY);
    storage.remove(USER_KEY);
  },
};

export const userStore = {
  get: (): AuthUser | null => {
    const raw = storage.getString(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  set: (user: AuthUser) => storage.set(USER_KEY, JSON.stringify(user)),
};

// Secure Session Storage using expo-secure-store for Expo Go compatibility
const SECURE_SESSION_KEY = 'gasela_secure_session';

export const secureStorage = {
  saveSession: async (session: { accessToken: string; refreshToken: string; user: AuthUser; tokenExpiresAt: number }) => {
    try {
      await SecureStore.setItemAsync(SECURE_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to save secure session:', e);
    }
  },
  getSession: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SECURE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to get secure session:', e);
      return null;
    }
  },
  clearSession: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_SESSION_KEY);
    } catch (e) {
      console.warn('Failed to delete secure session:', e);
    }
  },
};

const SAVED_CREDENTIALS_KEY = 'gasela_saved_credentials';

export const savedCredentialsStore = {
  saveCredentials: async (credentials: { username: string; password?: string }) => {
    try {
      await SecureStore.setItemAsync(SAVED_CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (e) {
      console.warn('Failed to save credentials:', e);
    }
  },
  getCredentials: async (): Promise<{ username: string; password?: string } | null> => {
    try {
      const raw = await SecureStore.getItemAsync(SAVED_CREDENTIALS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to get saved credentials:', e);
      return null;
    }
  },
  clearCredentials: async () => {
    try {
      await SecureStore.deleteItemAsync(SAVED_CREDENTIALS_KEY);
    } catch (e) {
      console.warn('Failed to delete saved credentials:', e);
    }
  },
};