import { existsSync, renameSync, statSync } from 'node:fs';

import { getAuditLogPath } from '../config.js';

const MAX_AUDIT_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Rotate audit log when it exceeds max size (append-only → archived copy).
 */
export function rotateAuditLogIfNeeded(): void {
  const logPath = getAuditLogPath();
  if (!existsSync(logPath)) return;

  try {
    const size = statSync(logPath).size;
    if (size < MAX_AUDIT_BYTES) return;

    const rotated = `${logPath}.${Date.now()}.jsonl`;
    renameSync(logPath, rotated);
  } catch {
    // non-fatal
  }
}
