import { describe, expect, it } from 'vitest';

import { assertSafeUrl } from './web.js';
import { performSecurityCheck } from '../security.js';
import type { AgentConfig } from '../config.js';

const baseConfig = {
  gatewayUrl: '',
  authToken: '',
  tenantId: '',
  allowedDirectories: [],
  autoStart: false,
  riskPreferences: {
    autoApproveReadOnly: true,
    autoApproveLowRisk: true,
    requireApprovalHighRisk: false,
  },
  maxActionsPerMinute: 100,
  desktopEnabled: false,
  desktopVisionEnabled: false,
  screenshotBeforeAction: false,
} satisfies AgentConfig;

describe('assertSafeUrl', () => {
  it('allows public https URLs', () => {
    const url = assertSafeUrl('https://example.com/path');
    expect(url.hostname).toBe('example.com');
  });

  it('blocks localhost', () => {
    expect(() => assertSafeUrl('http://localhost:3000')).toThrow(/Blocked host/);
  });

  it('blocks private IPv4', () => {
    expect(() => assertSafeUrl('http://192.168.1.1/admin')).toThrow(/Private/);
  });

  it('blocks non-http schemes', () => {
    expect(() => assertSafeUrl('file:///etc/passwd')).toThrow(/Only http/);
  });
});

describe('web.fetch security', () => {
  it('denies private URLs at security layer', () => {
    const check = performSecurityCheck('web.fetch', { url: 'http://127.0.0.1' }, baseConfig);
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/Blocked host|Private/);
  });
});
