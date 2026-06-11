/**
 * Encryption utilities for storing credentials at rest.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * Key source: ENCRYPTION_KEY environment variable (64-char hex = 32 bytes).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt plaintext using AES-256-GCM.
 * Output format: base64(iv + ciphertext + authTag)
 *
 * @param plaintext - The string to encrypt
 * @param key - 32-byte key as hex string (64 hex chars)
 * @returns Base64-encoded encrypted payload
 */
export function encrypt(plaintext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters)');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Pack: iv (12) + ciphertext (variable) + authTag (16)
  const packed = Buffer.concat([iv, encrypted, authTag]);
  return packed.toString('base64');
}

/**
 * Decrypt a previously encrypted payload.
 *
 * @param ciphertext - Base64-encoded encrypted payload (from encrypt())
 * @param key - 32-byte key as hex string (64 hex chars)
 * @returns Decrypted plaintext string
 */
export function decrypt(ciphertext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters)');
  }

  const packed = Buffer.from(ciphertext, 'base64');

  if (packed.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Invalid ciphertext: payload too short');
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(packed.length - TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Get encryption key from environment.
 * Throws a clear error if not configured.
 */
export function getEncryptionKey(): string {
  const key = process.env['ENCRYPTION_KEY'];
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Must be 64 hex characters (32 bytes).'
    );
  }
  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).'
    );
  }
  return key;
}

/**
 * Encrypt a config object (serialized as JSON).
 */
export function encryptConfig(config: Record<string, unknown>, key: string): string {
  return encrypt(JSON.stringify(config), key);
}

/**
 * Decrypt a config object.
 */
export function decryptConfig<T = Record<string, unknown>>(encrypted: string, key: string): T {
  const json = decrypt(encrypted, key);
  return JSON.parse(json) as T;
}
