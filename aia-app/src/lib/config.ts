import Constants from 'expo-constants';

/**
 * Runtime configuration, injected at build time via `app.json` → `expo.extra`.
 *
 * `Constants.expoConfig.extra` is typed `any` by expo-constants, so we cast to a
 * known shape after reading it — the contract is owned by `app.json` in this repo.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
  gatewayUrl?: string;
  publicChatApiKey?: string;
};

export interface AppConfig {
  /** Base URL of the AIA Platform gateway (Hono API). No trailing slash. */
  gatewayUrl: string;
  /**
   * Tenant-scoped API key for the anonymous assistant endpoint. This is a
   * "publishable" key (revocable, rate-limited, single-tenant) — NOT the
   * LiteLLM master key, which must never ship in the client bundle.
   */
  publicChatApiKey: string;
}

export const config: AppConfig = {
  gatewayUrl: (extra.gatewayUrl ?? 'http://localhost:3000').replace(/\/+$/, ''),
  publicChatApiKey: extra.publicChatApiKey ?? '',
};
