import { describe, expect, it } from 'vitest';

import { parseMcpInstall } from './install.js';

describe('parseMcpInstall', () => {
  it('parses npm package into npx definition', () => {
    const { name, definition } = parseMcpInstall([
      'npm',
      '@modelcontextprotocol/server-filesystem',
      '--name',
      'filesystem',
    ]);
    expect(name).toBe('filesystem');
    expect(definition.command).toBe('npx');
    expect(definition.args).toEqual(['-y', '@modelcontextprotocol/server-filesystem']);
  });

  it('parses everything-demo preset', () => {
    const { name, definition } = parseMcpInstall(['everything-demo']);
    expect(name).toBe('everything-demo');
    expect(definition.args?.[1]).toContain('server-everything');
  });

  it('rejects non-https git urls', () => {
    expect(() =>
      parseMcpInstall(['git', 'file:///tmp/repo', '--command', 'node']),
    ).toThrow(/HTTPS/);
  });
});
