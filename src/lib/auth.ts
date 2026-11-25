import { api } from './http';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'ojimbaejike@gmail.com';

let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

function publish(user: User | null) {
  currentUser = user;
  listeners.forEach((listener) => listener(user));
}

export async function signIn(email: string, password: string): Promise<User> {
  const result = await api<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  publish(result.user);
  return result.user;
}

export async function registerAccount(
  displayName: string,
  email: string,
  password: string
): Promise<User> {
  const result = await api<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName, email, password }),
  });
  publish(result.user);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
  publish(null);
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  listeners.add(callback);
  callback(currentUser);
  api<{ user: User | null }>('/auth/me')
    .then((result) => publish(result.user))
    .catch(() => publish(null));
  return () => listeners.delete(callback);
}

export async function checkIsAdminUser(): Promise<boolean> {
  try {
    return (await api<{ isAdmin: boolean }>('/auth/admin-status')).isAdmin;
  } catch {
    return false;
  }
}

export async function testApiConnection(): Promise<boolean> {
  try {
    await api('/health');
    return true;
  } catch {
    return false;
  }
}
