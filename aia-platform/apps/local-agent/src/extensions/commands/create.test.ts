import { describe, expect, it } from 'vitest';

import { buildCommandScaffold } from './create.js';

describe('command create', () => {
  it('builds valid scaffold', () => {
    const def = buildCommandScaffold('weekly-report', 'Report settimanale');
    expect(def.name).toBe('weekly-report');
    expect(def.prompt).toContain('weekly-report');
    expect(def.output?.model).toBe('fast-cheap');
  });
});
