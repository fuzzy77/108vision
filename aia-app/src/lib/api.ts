import { config } from './config';

export interface ChatResult {
  content: string;
  model: string;
  tokens: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export type ExplainResult =
  | { success: true; data: ChatResult }
  | { success: false; error: ApiError };

const TIMEOUT_MS = 90_000;
const HEALTH_TIMEOUT_MS = 5_000;

/**
 * Liveness probe against the platform gateway.
 * Returns true only when the API process is reachable. Used to gate the
 * anonymous assistant: the UI is enabled only when the APIs are live.
 *
 * Uses `/health/live` (process liveness, no dependency checks) so a temporary
 * Postgres/Redis/Qdrant hiccup does not hide a working assistant — the actual
 * chat call surfaces any deeper error with a clean message.
 */
export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.gatewayUrl}/health/live`, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One-shot, non-streaming "explain" call.
 *
 * POST {gatewayUrl}/api/chat/quick with a Bearer JWT. The gateway resolves the
 * tenant from the token's `tenantId` claim and enforces isolation server-side;
 * the LiteLLM master key never leaves the server, so it is not present here.
 *
 * `system` is an optional system-level prompt (e.g. the 108 Vision guardrail).
 */
export async function explain(
  message: string,
  token: string,
  system?: string,
): Promise<ExplainResult> {
  return postChat('/api/chat/quick', message, system, token);
}

/**
 * Anonymous one-shot "explain" call — no user login, key-authenticated.
 *
 * POST {gatewayUrl}/api/public/chat with a tenant-scoped `X-API-Key`. The
 * gateway validates the key (hashed in DB, revocable) and applies its own rate
 * limit; only the 108 Vision guardrail system prompt is sent. Callers MUST
 * gate this behind `checkHealth()`.
 */
export async function explainPublic(
  message: string,
  system?: string,
): Promise<ExplainResult> {
  if (!config.publicChatApiKey) {
    return {
      success: false,
      error: {
        code: 'API_KEY_MISSING',
        message: 'Chiave API non configurata per l’Assistente.',
        status: 0,
      },
    };
  }
  return postChat(
    '/api/public/chat',
    message,
    system,
    undefined,
    config.publicChatApiKey,
  );
}

async function postChat(
  path: string,
  message: string,
  system: string | undefined,
  token?: string,
  apiKey?: string,
): Promise<ExplainResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await fetch(`${config.gatewayUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, system }),
      signal: controller.signal,
    });

    // RFC 7807 problem details on error; { content, model, tokens } on success.
    const data = (await response.json().catch(() => ({}))) as ChatResult & {
      title?: string;
      detail?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.title ?? 'CHAT_FAILED',
          message: data.detail ?? 'Risposta AI non disponibile',
          status: response.status,
        },
      };
    }

    return {
      success: true,
      data: {
        content: data.content ?? '',
        model: data.model ?? '',
        tokens: data.tokens ?? 0,
      },
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      success: false,
      error: {
        code: aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: aborted
          ? 'La risposta ha impiegato troppo tempo. Riprova.'
          : error instanceof Error
            ? error.message
            : 'Errore di rete',
        status: 0,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
