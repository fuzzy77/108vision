/**
 * @aia/auth/client — Client-side authentication helper.
 *
 * Provides methods to manage authentication state in browser environments:
 * - Login / logout
 * - Session persistence (localStorage or httpOnly cookie)
 * - Role and tenant access checks
 *
 * Usage:
 *   import { createAuthClient } from '@aia/auth/client';
 *   const auth = createAuthClient({ baseUrl: '/api/auth' });
 *   await auth.login('user@example.com', 'password');
 */

import type { AuthUser, UserRole } from './types.js';
import { AUTH_ROLES } from './types.js';

export interface AuthClientConfig {
  /** Base URL for auth API endpoints (e.g., '/api/auth' or 'https://api.example.com/api/auth'). */
  baseUrl: string;
  /** Storage key for the session token. Default: 'aia_session_token'. */
  storageKey?: string;
  /** Whether to store token in localStorage. Default: true. If false, relies on httpOnly cookies. */
  useLocalStorage?: boolean;
  /** Custom fetch implementation (for SSR or testing). */
  fetchFn?: typeof fetch;
}

export interface LoginResult {
  success: true;
  user: AuthUser;
  token: string;
}

export interface AuthError {
  success: false;
  code: string;
  message: string;
}

type AuthResult<T> = T | AuthError;

const DEFAULT_STORAGE_KEY = 'aia_session_token';

export function createAuthClient(config: AuthClientConfig) {
  const {
    baseUrl,
    storageKey = DEFAULT_STORAGE_KEY,
    useLocalStorage = true,
    fetchFn = globalThis.fetch.bind(globalThis),
  } = config;

  let cachedUser: AuthUser | null = null;
  let cachedToken: string | null = null;

  function getStoredToken(): string | null {
    if (!useLocalStorage) return cachedToken;
    try {
      return globalThis.localStorage?.getItem(storageKey) ?? null;
    } catch {
      return cachedToken;
    }
  }

  function setStoredToken(token: string | null): void {
    cachedToken = token;
    if (!useLocalStorage) return;
    try {
      if (token) {
        globalThis.localStorage?.setItem(storageKey, token);
      } else {
        globalThis.localStorage?.removeItem(storageKey);
      }
    } catch {
      // localStorage unavailable (SSR, private browsing)
    }
  }

  function getAuthHeaders(): HeadersInit {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<AuthResult<T>> {
    try {
      const response = await fetchFn(`${baseUrl}${path}`, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Send cookies for httpOnly cookie mode
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          code: data.title || data.error?.code || 'UNKNOWN_ERROR',
          message: data.detail || data.error?.message || 'An error occurred',
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Authenticate with email and password.
   * On success, stores the session token and caches the user.
   */
  async function login(
    email: string,
    password: string,
  ): Promise<AuthResult<LoginResult>> {
    const result = await request<LoginResult>('POST', '/login', { email, password });

    if ('success' in result && result.success === true) {
      setStoredToken(result.token);
      cachedUser = result.user;
    }

    return result;
  }

  /**
   * End the current session.
   * Clears stored token and cached user.
   */
  async function logout(): Promise<void> {
    const token = getStoredToken();
    if (token) {
      await request('POST', '/logout', {});
    }
    setStoredToken(null);
    cachedUser = null;
  }

  /**
   * Get the current session from the server.
   * Returns null if not authenticated or session expired.
   */
  async function getSession(): Promise<{ user: AuthUser; token: string } | null> {
    const token = getStoredToken();
    if (!token) return null;

    const result = await request<{ user: AuthUser; token: string }>('GET', '/me');

    if ('success' in result && result.success === false) {
      // Session invalid — clear local state
      setStoredToken(null);
      cachedUser = null;
      return null;
    }

    const session = result as { user: AuthUser; token: string };
    cachedUser = session.user;
    return session;
  }

  /**
   * Get the currently cached user. Call getSession() first to hydrate.
   */
  function getUser(): AuthUser | null {
    return cachedUser;
  }

  /**
   * Check if the user is authenticated (has a stored token).
   * Does NOT validate the token — use getSession() for full validation.
   */
  function isAuthenticated(): boolean {
    return getStoredToken() !== null;
  }

  /**
   * Check if the current user has one of the specified roles.
   */
  function hasRole(...roles: UserRole[]): boolean {
    if (!cachedUser) return false;
    return roles.includes(cachedUser.role);
  }

  /**
   * Check if the current user can access a specific tenant.
   * CONSULTANT (platform_admin) can access all tenants.
   */
  function canAccessTenant(tenantId: string): boolean {
    if (!cachedUser) return false;
    if (cachedUser.role === AUTH_ROLES.CONSULTANT) return true;
    return cachedUser.tenantId === tenantId;
  }

  /**
   * Refresh the current session token.
   * Returns the new token on success, or null if refresh failed.
   */
  async function refreshToken(): Promise<string | null> {
    const result = await request<{ token: string; expiresAt: string }>('POST', '/refresh');

    if ('success' in result && result.success === false) {
      setStoredToken(null);
      cachedUser = null;
      return null;
    }

    const data = result as { token: string; expiresAt: string };
    setStoredToken(data.token);
    return data.token;
  }

  /**
   * Request a password reset email.
   */
  async function forgotPassword(email: string): Promise<AuthResult<{ message: string }>> {
    return request('POST', '/forgot-password', { email });
  }

  /**
   * Reset password using a valid reset token.
   */
  async function resetPassword(
    token: string,
    newPassword: string,
  ): Promise<AuthResult<{ message: string }>> {
    return request('POST', '/reset-password', { token, newPassword });
  }

  /**
   * Accept an invitation and set a password for the new account.
   */
  async function acceptInvite(
    inviteToken: string,
    name: string,
    password: string,
  ): Promise<AuthResult<LoginResult>> {
    const result = await request<LoginResult>('POST', '/accept-invite', {
      token: inviteToken,
      name,
      password,
    });

    if ('success' in result && result.success === true) {
      setStoredToken(result.token);
      cachedUser = result.user;
    }

    return result;
  }

  /**
   * Get the stored token value (for custom API calls).
   */
  function getToken(): string | null {
    return getStoredToken();
  }

  return {
    login,
    logout,
    getSession,
    getUser,
    isAuthenticated,
    hasRole,
    canAccessTenant,
    refreshToken,
    forgotPassword,
    resetPassword,
    acceptInvite,
    getToken,
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
