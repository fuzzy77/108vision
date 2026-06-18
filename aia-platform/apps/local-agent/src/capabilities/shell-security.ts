/**
 * Shared shell command validation — used by execute and stream paths.
 */

import { resolve, normalize } from 'node:path';
import { existsSync } from 'node:fs';

import type { AgentConfig } from '../config.js';
import { validatePath } from '../security.js';

const SAFE_PIPE_TARGETS = new Set([
  'grep', 'head', 'tail', 'wc', 'sort', 'uniq',
  'less', 'more', 'cat', 'tee', 'awk', 'sed', 'cut', 'tr',
]);

const BLOCKED_PATTERNS: RegExp[] = [
  /\brm\s+(-rf?|--recursive)\s+[/\\]/i,
  /\bdel\s+\/s\s+\/q/i,
  /\bformat\s+[a-z]:/i,
  /\brmdir\s+\/s/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bkill\s+-9\s+1\b/,
  /\bkillall\b/i,
  /\btaskkill\s+\/f\s+\/im\s+(explorer|csrss|svchost)/i,
  /\breg\s+(delete|add)\s+hklm/i,
  /\bchmod\s+777\s+\//i,
  /\biptables\s+-F/i,
  /\bnetsh\s+advfirewall\s+reset/i,
  /\bopenssl\s+enc\b.*-in\s+\//i,
  /\bpowershell\b/i,
  /\bpwsh\b/i,
  /\bcmd\.exe\b/i,
  /\bcmd\s+\/c\b/i,
  /\bbash\s+-c\b/i,
  /\bsh\s+-c\b/i,
  /\bpython3?\s+-c\b/i,
  /\bnode\s+-e\b/i,
  /\bperl\s+-e\b/i,
  /\bruby\s+-e\b/i,
];

export interface ValidatedShellContext {
  command: string;
  cwd: string;
  timeout: number;
}

export function resolveShellCwd(cwd: string | undefined, config: AgentConfig): string {
  const base = cwd ?? config.allowedDirectories[0];
  if (!base) {
    throw new Error('No working directory specified and no allowedDirectories configured');
  }

  const resolvedCwd = resolve(normalize(base));
  const validatedCwd = validatePath(resolvedCwd, config.allowedDirectories);
  if (!validatedCwd) {
    throw new Error(`Working directory "${base}" is outside allowed directories`);
  }

  if (!existsSync(validatedCwd)) {
    throw new Error(`Working directory does not exist: ${validatedCwd}`);
  }

  return validatedCwd;
}

export function assertShellEnabled(config: AgentConfig): void {
  if (config.shellEnabled === false) {
    throw new Error(
      'Shell execution is disabled. Set shellEnabled: true in ~/.108ai/config.json',
    );
  }
}

export function validateShellCommand(
  command: string,
  config: AgentConfig,
): void {
  if (!command || command.trim().length === 0) {
    throw new Error('Command cannot be empty');
  }

  for (const pattern of config.shellBlocklist ?? []) {
    if (pattern && new RegExp(pattern, 'i').test(command)) {
      throw new Error('Command blocked by user shellBlocklist');
    }
  }

  if (/[;`]|\$\(/.test(command)) {
    throw new Error(
      'Command blocked by security policy. Command chaining and substitution (;, `, $()) are not allowed.',
    );
  }

  if (/&&|\|\|/.test(command)) {
    throw new Error(
      'Command blocked by security policy. Logical chaining operators (&& and ||) are not allowed.',
    );
  }

  if (/\|/.test(command)) {
    const pipeSegments = command.split('|').slice(1);
    const hasUnsafePipe = pipeSegments.some((segment) => {
      const firstWord = segment.trim().split(/\s+/)[0] ?? '';
      return !SAFE_PIPE_TARGETS.has(firstWord);
    });
    if (hasUnsafePipe) {
      throw new Error(
        'Command blocked by security policy. Piping to an unsafe command is not allowed.',
      );
    }
  }

  const blocked = BLOCKED_PATTERNS.find((pat) => pat.test(command));
  if (blocked) {
    throw new Error(
      'Command blocked by security policy. Destructive or dangerous commands are not allowed.',
    );
  }
}

export function resolveShellTimeout(
  timeout: number | undefined,
  config: AgentConfig,
): number {
  const defaultTimeout = config.shellDefaultTimeout ?? 30_000;
  const maxTimeout = 600_000;
  return Math.min(timeout ?? defaultTimeout, maxTimeout);
}

export function resolveMaxOutputBytes(config: AgentConfig): number {
  return config.shellMaxOutputSize ?? 1024 * 1024;
}
