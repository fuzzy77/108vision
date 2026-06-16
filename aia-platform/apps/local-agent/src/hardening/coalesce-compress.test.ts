import { describe, expect, it } from 'vitest';

import { coalesceByKey } from './llm-coalesce.js';
import { compressAssistantOutput } from './response-compress.js';

describe('llm coalesce', () => {
  it('deduplicates concurrent calls', async () => {
    let runs = 0;
    const factory = async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 20));
      return 'ok';
    };

    const [a, b] = await Promise.all([
      coalesceByKey('same-key', factory),
      coalesceByKey('same-key', factory),
    ]);

    expect(a).toBe('ok');
    expect(b).toBe('ok');
    expect(runs).toBe(1);
  });
});

describe('response compress', () => {
  it('truncates very long output', () => {
    const long = 'x'.repeat(10_000);
    const out = compressAssistantOutput(long, 1000);
    expect(out.length).toBeLessThan(long.length);
    expect(out).toContain('omessi');
  });
});
