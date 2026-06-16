import { describe, expect, it } from 'vitest';

import { expandKnowledgePath, loadKnowledgeBlock } from './loader.js';

describe('knowledge loader', () => {
  it('expands tilde path', () => {
    const expanded = expandKnowledgePath('~/.108ai/knowledge');
    expect(expanded).toContain('.108ai');
    expect(expanded).not.toContain('~');
  });

  it('returns empty block when no refs', async () => {
    await expect(loadKnowledgeBlock(undefined)).resolves.toBe('');
    await expect(loadKnowledgeBlock([])).resolves.toBe('');
  });
});
