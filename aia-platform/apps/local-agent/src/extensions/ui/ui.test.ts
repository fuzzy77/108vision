import { describe, expect, it } from 'vitest';

import { handleUiCli } from './cli.js';
import { renderDashboardPanel } from './panels.js';
import { buildUiApiSnapshot } from './api.js';

describe('ui cli', () => {
  it('renders dashboard help for unknown subcommand', async () => {
    const out = await handleUiCli(['unknown']);
    expect(out).toContain('/ui dashboard');
  });

  it('renders dashboard panel with extensions overview', async () => {
    const out = await handleUiCli(['dashboard']);
    expect(out).toContain('108ai Extensions');
    expect(out).toContain('/ui web');
  });
});

describe('ui panels', () => {
  it('dashboard includes commands section', () => {
    const panel = renderDashboardPanel();
    expect(panel.length).toBeGreaterThan(20);
  });
});

describe('ui api snapshot', () => {
  it('returns structured snapshot', () => {
    const snap = buildUiApiSnapshot('', 'all');
    expect(snap).toHaveProperty('commands');
    expect(snap).toHaveProperty('agents');
    expect(snap).toHaveProperty('generatedAt');
  });
});
