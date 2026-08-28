import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { config } from './config';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  name?: string | null;
}

export interface LoginResult {
  success: true;
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export interface AuthError {
  success: false;
  code: string;
  message: string;
}

export type AuthResponse = LoginResult | AuthError;

const TOKEN_KEY = 'vision108_session_token';
const USER_KEY = 'vision108_session_user';

/**
 * SecureStore is native-only (iOS Keychain / Android Keystore).
 * On web we fall back to localStorage so `expo export --platform web` keeps working.
 */
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage.setItem(key, value);
    } catch {
      // storage unavailable (private browsing) — session stays in memory only
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * Authenticate against the platform gateway.
 * POST {gatewayUrl}/api/auth/login → { success, user, token, expiresAt }.
 * On success the JWT (with the tenantId claim) and the user are persisted.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${config.gatewayUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // RFC 7807 problem details on error, plain object on success.
    const data = (await response.json().catch(() => ({}))) as LoginResult & {
      title?: string;
      detail?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        code: data.title ?? 'LOGIN_FAILED',
        message: data.detail ?? 'Accesso non riuscito',
      };
    }

    await setItem(TOKEN_KEY, data.token);
    await setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  } catch (error) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Errore di rete',
    };
  }
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getCachedUser(): Promise<AuthUser | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
}
