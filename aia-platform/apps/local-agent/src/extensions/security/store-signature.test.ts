import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import {
  buildSignaturePayload,
  computeContentSha256,
  signStorePayload,
  verifyStoreSignature,
} from './store-signature.js';

describe('store-signature', () => {
  const prev = process.env['AIA_STORE_SIGNING_KEY'];

  beforeEach(() => {
    process.env['AIA_STORE_SIGNING_KEY'] = 'test-secret-key';
  });

  afterEach(() => {
    if (prev === undefined) delete process.env['AIA_STORE_SIGNING_KEY'];
    else process.env['AIA_STORE_SIGNING_KEY'] = prev;
  });

  it('verifies valid HMAC signature', () => {
    const content = 'name: demo\nversion: 1\n';
    const author = '108ai';
    const name = 'demo';
    const version = '1';
    const payload = buildSignaturePayload(
      author,
      name,
      version,
      computeContentSha256(content),
    );
    const signature = signStorePayload(payload, 'test-secret-key');

    const result = verifyStoreSignature({
      author,
      name,
      version,
      content,
      signature,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects tampered content', () => {
    const content = 'name: demo\n';
    const payload = buildSignaturePayload(
      '108ai',
      'demo',
      '1',
      computeContentSha256(content),
    );
    const signature = signStorePayload(payload, 'test-secret-key');

    const result = verifyStoreSignature({
      author: '108ai',
      name: 'demo',
      version: '1',
      content: 'name: hacked\n',
      signature,
    });
    expect(result.ok).toBe(false);
  });
});
