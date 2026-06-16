import { describe, expect, it } from 'vitest';

import { decryptSecret, encryptSecret } from './key-vault.js';

describe('key vault', () => {
  it('round-trips api key encryption', () => {
    const plain = 'sk-test-12345';
    const enc = encryptSecret(plain);
    expect(enc).not.toBe(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });
});
