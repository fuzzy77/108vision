import { describe, expect, it } from 'vitest';

import { formatHistoryForPrompt } from '../extensions/agents/context.js';
import { compressConversationMessages } from './prompt-compress.js';
import { isTokenNearExpiry } from './token-refresh.js';
import { initCache, setCached, getSemanticCached, clearExpired } from '../local-cache.js';

describe('prompt compress', () => {
  it('truncates long history with omission marker', () => {
    const msgs = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg ${i}`,
    }));
    const out = compressConversationMessages(msgs, 5);
    expect(out).toContain('omessi');
    expect(out).toContain('msg 19');
  });
});

describe('persona summarize context', () => {
  it('includes summary block when strategy is summarize', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `turn ${i}`,
      timestamp: Date.now(),
    }));

    const block = formatHistoryForPrompt(history, {
      strategy: 'summarize',
      max_messages: 6,
      summarize_after: 10,
    });

    expect(block).toContain('[Riepilogo conversazione precedente]');
    expect(block).toContain('turn 24');
  });
});

describe('token refresh', () => {
  it('detects near expiry', () => {
    expect(
      isTokenNearExpiry({ tokenExpiresAt: Date.now() + 2 * 60 * 1000 } as never),
    ).toBe(true);
    expect(
      isTokenNearExpiry({ tokenExpiresAt: Date.now() + 60 * 60 * 1000 } as never),
    ).toBe(false);
  });
});

describe('semantic cache', () => {
  it('matches paraphrased query', () => {
    initCache();
    clearExpired();
    setCached(
      'riassumi le email urgenti di oggi per favore',
      'risposta cache',
      'fast-cheap',
      100,
    );

    const hit = getSemanticCached('riassumi email urgenti oggi');
    expect(hit?.response).toBe('risposta cache');
  });
});
