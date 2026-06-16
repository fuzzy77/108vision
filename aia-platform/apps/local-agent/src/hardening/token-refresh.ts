import type { AgentConfig } from '../config.js';
import { performBrowserLogin } from '../auth.js';

/** Refresh token when within this margin of expiry (ms). */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

let refreshInFlight: Promise<void> | null = null;

export function isTokenNearExpiry(config: AgentConfig): boolean {
  if (!config.tokenExpiresAt) return false;
  return Date.now() > config.tokenExpiresAt - REFRESH_MARGIN_MS;
}

/**
 * Proactively renew JWT before gateway returns 401 (opens browser if near expiry).
 */
export async function ensureAuthFresh(
  config: AgentConfig,
  gatewayHttp: string,
  onUpdated: (auth: { token: string; tenantId: string; expiresAt: number }) => void,
): Promise<void> {
  if (!config.authToken || !isTokenNearExpiry(config)) return;

  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  refreshInFlight = (async () => {
    try {
      process.stdout.write('  \x1b[33m[!]\x1b[0m Token in scadenza — rinnovo preventivo...\n');
      const authResult = await performBrowserLogin(gatewayHttp);
      onUpdated({
        token: authResult.token,
        tenantId: authResult.tenantId,
        expiresAt: authResult.expiresAt,
      });
    } catch {
      // Fall back to reactive 401 handler in callLLM
    }
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
