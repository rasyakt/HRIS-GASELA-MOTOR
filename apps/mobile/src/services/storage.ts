import { createMMKV } from 'react-native-mmkv';
import type { AuthUser } from '@gasela/shared-types';

export const storage = createMMKV({ id: 'gasela-hris' });

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export const tokenStore = {
  getAccessToken: () => storage.getString(ACCESS_TOKEN_KEY),
  getRefreshToken: () => storage.getString(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    storage.set(ACCESS_TOKEN_KEY, access);
    storage.set(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    storage.remove(ACCESS_TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
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