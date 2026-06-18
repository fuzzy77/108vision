/**
 * Session Boundary Monitor — suggests new session when context degrades.
 * Implements Principio 1 (Context Window) from Principi_AI_Fondamentali.
 */

export interface SessionMetrics {
  messageCount: number;
  estimatedTokens: number;
  startedAt: number; // epoch ms
}

export interface SessionBoundaryConfig {
  maxMessages: number;        // default 40
  maxTokensEstimate: number;  // default 80000
  maxDurationMs: number;      // default 90 * 60 * 1000 (90 min)
  warningThreshold: number;   // 0.8 = warn at 80%
}

const DEFAULT_CONFIG: SessionBoundaryConfig = {
  maxMessages: 40,
  maxTokensEstimate: 80_000,
  maxDurationMs: 90 * 60 * 1000,
  warningThreshold: 0.8,
};

// Track current session
let metrics: SessionMetrics = { messageCount: 0, estimatedTokens: 0, startedAt: Date.now() };

export function resetSession(): void {
  metrics = { messageCount: 0, estimatedTokens: 0, startedAt: Date.now() };
}

export function recordMessage(estimatedTokens: number): void {
  metrics.messageCount++;
  metrics.estimatedTokens += estimatedTokens;
}

export function getMetrics(): SessionMetrics {
  return { ...metrics };
}

export type BoundaryStatus = 'ok' | 'warning' | 'critical';

export function checkBoundary(config: SessionBoundaryConfig = DEFAULT_CONFIG): { status: BoundaryStatus; reason?: string } {
  const elapsed = Date.now() - metrics.startedAt;

  const msgRatio = metrics.messageCount / config.maxMessages;
  const tokenRatio = metrics.estimatedTokens / config.maxTokensEstimate;
  const timeRatio = elapsed / config.maxDurationMs;

  const maxRatio = Math.max(msgRatio, tokenRatio, timeRatio);

  if (maxRatio >= 1.0) {
    const reason = msgRatio >= 1
      ? `Conversazione lunga (${metrics.messageCount} messaggi). Le risposte potrebbero perdere coerenza.`
      : tokenRatio >= 1
        ? `Context window quasi piena (~${Math.round(metrics.estimatedTokens / 1000)}K token). La qualità delle risposte degrada.`
        : `Sessione attiva da oltre ${Math.round(elapsed / 60000)} minuti. Considera una nuova conversazione.`;
    return { status: 'critical', reason };
  }

  if (maxRatio >= config.warningThreshold) {
    return { status: 'warning', reason: 'La sessione si sta allungando. Se le risposte diventano meno precise, inizia una nuova chat.' };
  }

  return { status: 'ok' };
}

export function formatBoundaryHint(check: ReturnType<typeof checkBoundary>): string | null {
  if (check.status === 'ok') return null;
  const icon = check.status === 'warning' ? '💡' : '⚠️';
  return `${icon} ${check.reason}\n   Suggerimento: /nuova per iniziare una conversazione fresca.`;
}
