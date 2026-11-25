const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload as T;
}

export function poll<T>(load: () => Promise<T>, onData: (data: T) => void, interval = 3000) {
  let active = true;
  const refresh = () => load().then((data) => active && onData(data)).catch(() => {});
  refresh();
  const timer = window.setInterval(refresh, interval);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}
