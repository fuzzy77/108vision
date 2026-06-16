import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { homedir, hostname } from 'node:os';

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';

function deriveKey(): Buffer {
  const material = `${homedir()}|${hostname()}|108ai-local`;
  return scryptSync(material, '108ai-salt-v1', 32);
}

export function encryptSecret(plain: string): string {
  if (!plain || plain.startsWith(PREFIX)) return plain;
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64');
  return `${PREFIX}${payload}`;
}

export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}
