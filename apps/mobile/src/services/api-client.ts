import Constants from 'expo-constants';
import { tokenStore } from './storage';
import { useOnlineStore } from '../store/online-store';

const normalizeApiUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/api')) {
    cleaned = cleaned.slice(0, -4);
  }
  return cleaned;
};

const getDevApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  // Release/standalone APK build (!__DEV__) defaults to production domain
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return 'https://gasela.my.id';
  }

  // Metro Bundler's host IP (e.g., "192.168.1.X:8081") mapped to backend port 3001
  const hostUri = Constants.expoConfig?.hostUri || (Constants.expoGoConfig as any)?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:3001`;
    }
  }

  return 'http://10.169.180.16:3001'; // Fallback to local dev IP
};

const API_URL = getDevApiUrl();

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const authToken = token === undefined ? tokenStore.getAccessToken() : token;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
    });

    clearTimeout(timeoutId);
    useOnlineStore.getState().setOnline(true);

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        body && typeof body === 'object' && 'message' in body
          ? String((body as { message: string | string[] }).message)
          : `Request failed (${res.status})`;
      throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
    }

    return body as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Koneksi terputus (Request Timeout 30s ke ${API_URL}). Silakan coba lagi.`);
    }
    if (err instanceof TypeError || err.message?.includes('Network request failed')) {
      useOnlineStore.getState().setOnline(false);
      throw new Error(`Gagal terhubung ke server (${API_URL}). Periksa koneksi internet & alamat API.`);
    }
    throw err;
  }
}

export const apiUrl = API_URL;
export default api;