import { describe, expect, it } from 'vitest';

import {
  buildAgentToolsSystemAppend,
  extractMcpToolCalls,
  parseMcpToolRef,
  stripMcpBlocks,
} from './mcp-tools.js';
import type { LoadedPersonaAgent } from '../types.js';

function mockPersona(tools?: string[]): LoadedPersonaAgent {
  return {
    definition: {
      name: 'test',
      description: 'test',
      system_prompt: 'You are a test agent.',
      tools,
    },
    filePath: '/tmp/test.yml',
  };
}

describe('agent mcp tools', () => {
  it('parses mcp:server:tool ref', () => {
    expect(parseMcpToolRef('mcp:filesystem:list_directory')).toEqual({
      server: 'filesystem',
      tool: 'list_directory',
    });
  });

  it('extracts mcp blocks from llm output', () => {
    const content = `Eseguo il tool:\n\`\`\`mcp\nfilesystem: list_directory\n{"path": "/"}\n\`\`\``;
    const calls = extractMcpToolCalls(content);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.server).toBe('filesystem');
    expect(calls[0]?.tool).toBe('list_directory');
  });

  it('strips mcp blocks from visible output', () => {
    const content = 'Ok\n```mcp\na: b\n{}\n```\nFine';
    expect(stripMcpBlocks(content)).toBe('Ok\n\nFine');
  });

  it('appends tools section to system prompt', () => {
    const append = buildAgentToolsSystemAppend(
      mockPersona(['mcp:db:query', 'calendar']),
    );
    expect(append).toContain('MCP db.query');
    expect(append).toContain('integrazione: calendar');
  });
});
