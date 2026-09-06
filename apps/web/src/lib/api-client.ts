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
  const { token, headers = {}, timeoutMs = 30000, signal, body, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isPlainObject =
    body !== null &&
    typeof body === 'object' &&
    !isFormData &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  const requestBody = isPlainObject ? JSON.stringify(body) : (body as BodyInit | null | undefined);

  const defaultHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      body: requestBody,
      signal: signal || controller.signal,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
    clearTimeout(timeoutId);

    const resBody = await res.json().catch(() => null);

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      if (resBody && typeof resBody === 'object' && 'message' in resBody) {
        const rawMsg = (resBody as any).message;
        message = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);
      }
      throw new ApiError(res.status, message);
    }

    return resBody as T;
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