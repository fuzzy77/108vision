const TOKEN_KEY = 'aia_dashboard_token';
const REFRESH_KEY = 'aia_dashboard_refresh';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'consultant';
  avatar?: string;
}

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: 'admin' | 'consultant';
  exp: number;
  iat: number;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    const payload = parts[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  if (payload.exp * 1000 < Date.now()) {
    clearTokens();
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Errore di autenticazione' } }));
    throw new Error(error.error?.message || 'Credenziali non valide');
  }

  const data = await response.json() as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
  const user = getCurrentUser();
  if (!user) throw new Error('Token non valido ricevuto');
  return user;
}

export function logout(): void {
  clearTokens();
  window.location.href = '/login';
}
