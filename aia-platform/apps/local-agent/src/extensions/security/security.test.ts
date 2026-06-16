import { describe, expect, it } from 'vitest';

import { resolveSecretString } from './secrets.js';
import { checkExtensionRateLimit } from './rate-limit.js';

describe('extension secrets', () => {
  it('resolves ${ENV} from process.env', () => {
    process.env['TEST_108AI_SECRET'] = 'hello';
    expect(resolveSecretString('token=${TEST_108AI_SECRET}')).toBe('token=hello');
    delete process.env['TEST_108AI_SECRET'];
  });
});

describe('extension rate limit', () => {
  it('allows burst then blocks', () => {
    const key = `test-${Date.now()}`;
    expect(checkExtensionRateLimit(key, '2/min')).toBe(true);
    expect(checkExtensionRateLimit(key, '2/min')).toBe(true);
    expect(checkExtensionRateLimit(key, '2/min')).toBe(false);
  });
});
