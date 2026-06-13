const TOKEN_KEY = 'aia_token';
const REFRESH_TOKEN_KEY = 'aia_refresh_token';

export type UserRole = 'platform_admin' | 'tenant_admin' | 'tenant_operator' | 'client_user';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  tenantId: string;
  role: UserRole;
  exp: number;
  iat: number;
}

interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  success?: boolean;
}

function decodeJwt(token: string): JwtPayload {
  const base64Url = token.split('.')[1];
  if (!base64Url) throw new Error('Invalid token format');
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
  return JSON.parse(jsonPayload) as JwtPayload;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = decodeJwt(token);
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUser(): JwtPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    return decodeJwt(token);
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<JwtPayload> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Login failed' } }));
    throw new Error(error.error?.message ?? 'Login failed');
  }

  const data: AuthResponse = await response.json();
  const jwt = data.token || data.accessToken || '';
  if (!jwt) throw new Error('No token in response');
  setToken(jwt);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  return decodeJwt(jwt);
}

export async function register(name: string, email: string, password: string): Promise<JwtPayload> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Registration failed' } }));
    throw new Error(error.error?.message ?? 'Registration failed');
  }

  const data: AuthResponse = await response.json();
  const jwt = data.token || data.accessToken || '';
  if (!jwt) throw new Error('No token in response');
  setToken(jwt);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  return decodeJwt(jwt);
}

export function logout(): void {
  clearTokens();
  window.location.href = '/login';
}

export function getUserRole(): UserRole | null {
  const user = getUser();
  return user?.role ?? null;
}

export function isTenantAdmin(): boolean {
  const role = getUserRole();
  return role === 'tenant_admin' || role === 'platform_admin';
}
