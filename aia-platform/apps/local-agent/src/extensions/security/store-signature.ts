/**
 * Store package signature verification (author attestation).
 *
 * Payload signed: author|name|version|sha256(content)
 * Algorithm: HMAC-SHA256, base64url encoding.
 *
 * Keys: AIA_STORE_SIGNING_KEY (global) or AIA_STORE_KEY_<AUTHOR> (per publisher).
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export interface StoreSignatureVerifyResult {
  ok: boolean;
  reason?: string;
  warnings: string[];
}

export function computeContentSha256(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

export function buildSignaturePayload(
  author: string,
  name: string,
  version: string,
  contentSha256: string,
): string {
  return `${author}|${name}|${version}|${contentSha256}`;
}

export function signStorePayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf-8').digest('base64url');
}

function resolveSigningKey(author: string): string | undefined {
  const envKey = `AIA_STORE_KEY_${author.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  return process.env[envKey] ?? process.env['AIA_STORE_SIGNING_KEY'];
}

export function verifyStoreSignature(params: {
  author: string;
  name: string;
  version: string;
  content: string;
  signature?: string;
  verified?: boolean;
  allowUnsignedBundled?: boolean;
}): StoreSignatureVerifyResult {
  const warnings: string[] = [];
  const contentSha256 = computeContentSha256(params.content);
  const payload = buildSignaturePayload(
    params.author,
    params.name,
    params.version,
    contentSha256,
  );

  if (!params.signature) {
    if (params.allowUnsignedBundled && params.verified) {
      warnings.push('Pacchetto bundled verificato senza firma — trust locale');
      return { ok: true, warnings };
    }
    if (params.verified) {
      const key = resolveSigningKey(params.author);
      if (!key) {
        warnings.push('Nessuna chiave firma configurata — accettato per flag verified');
        return { ok: true, warnings };
      }
    }
    return {
      ok: false,
      reason: 'Firma autore mancante sul pacchetto store',
      warnings,
    };
  }

  const key = resolveSigningKey(params.author);
  if (!key) {
    return {
      ok: false,
      reason: `Nessuna chiave firma per autore "${params.author}" (env AIA_STORE_SIGNING_KEY)`,
      warnings,
    };
  }

  const expected = signStorePayload(payload, key);
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'Firma autore non valida', warnings };
  }

  return { ok: true, warnings };
}
