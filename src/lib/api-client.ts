/**
 * Fetch wrapper that uses relative `/api/` paths (same origin).
 * Replaces the old config.js that hardcoded the Render URL.
 */

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(typeof data === 'object' && data !== null && 'error' in data
      ? (data as { error: string }).error
      : `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('customerToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

export const apiGet = <T = unknown>(path: string) => api<T>(path);

export const apiPost = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const apiPut = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const apiDelete = <T = unknown>(path: string) =>
  api<T>(path, { method: 'DELETE' });
