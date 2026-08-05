import type { AuthUser } from '@gasela/shared-types';

class InMemoryMMKV {
  private map = new Map<string, any>();

  getString(key: string): string | undefined {
    const val = this.map.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  getNumber(key: string): number {
    const val = this.map.get(key);
    return typeof val === 'number' ? val : 0;
  }

  set(key: string, value: string | number | boolean) {
    this.map.set(key, value);
  }

  remove(key: string) {
    this.map.delete(key);
  }
}

let storageInstance: any;

try {
  const { createMMKV } = require('react-native-mmkv');
  storageInstance = createMMKV({ id: 'gasela-hris' });
} catch {
  console.log('Using in-memory storage fallback because react-native-mmkv is not supported in Expo Go.');
  storageInstance = new InMemoryMMKV();
}

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