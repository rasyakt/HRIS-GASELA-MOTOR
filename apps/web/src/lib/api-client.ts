// Di browser → pakai path relatif (/api/...) sehingga request melewati proxy Next.js
// Di server (SSR) → pakai URL penuh ke backend agar tidak loop
const isServer = typeof window === 'undefined';
const API_URL = isServer
  ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
  : '';

interface ApiOptions extends RequestInit {
  token?: string | null;
  timeoutMs?: number;
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
  const { token, headers, timeoutMs = 30000, signal, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    clearTimeout(timeoutId);

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
      throw new ApiError(408, 'Waktu permintaan habis (Request Timeout). Silakan coba lagi.');
    }
    throw err;
  }
}

export const apiUrl = API_URL;
export default api;