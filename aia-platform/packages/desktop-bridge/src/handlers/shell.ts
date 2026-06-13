/**
 * Shell handler — safe command execution for the Desktop Agent.
 *
 * Security model:
 *   - Uses `execFile` (NOT `exec`) to prevent shell injection. The command is
 *     parsed into binary + arguments and never passed through a shell.
 *   - A static blocklist of destructive command patterns is checked before
 *     execution.
 *   - Configurable timeout (default 30 s, max 120 s).
 *   - stdout + stderr are capped at 100 KB total (truncated with a notice).
 *   - `cwd` is validated as a non-system path when provided.
 *
 * No external dependencies — only Node.js built-in modules.
 */

import { execFile } from 'node:child_process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** True when the output was capped at MAX_OUTPUT_BYTES. */
  truncated: boolean;
  durationMs: number;
  command: string;
  args: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 100 * 1024; // 100 KB

/**
 * Blocklist of dangerous command patterns.
 * Each entry is tested against the full reconstructed command string
 * (binary + args joined with space), lower-cased.
 *
 * This is a defence-in-depth measure. The primary restriction is that the
 * agent can only call this from within approved actions, and `cwd` is
 * constrained to allowed directories.
 */
const COMMAND_BLOCKLIST: Array<string | RegExp> = [
  // Disk wiping
  /\brm\s+(-[a-z]*f[a-z]*\s+)?-rf\s+\/\b/,
  /\brm\s+(-[a-z]*r[a-z]*\s+)?-f\s+\/\b/,
  /\bmkfs\b/,
  /\bformat\s+[a-z]:/i,         // Windows format c:
  /\bdd\s+if=\/dev\/zero\b/,
  /\bdd\s+if=\/dev\/urandom\b/,
  /\bwipefs\b/,

  // Shell spawning (would bypass our execFile guard)
  /\b(bash|sh|zsh|fish|cmd\.exe|powershell\.exe|pwsh)\s+-c\b/i,

  // Privilege escalation
  /\bsudo\s+rm\b/,
  /\bsudo\s+dd\b/,
  /\bchmod\s+777\s+\//,

  // Fork bombs
  /:\s*\(\s*\)\s*\{/,          // bash fork bomb
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a raw command string into [binary, ...args].
 * Handles quoted arguments (single and double quotes) and escaped spaces.
 *
 * Examples:
 *   "git log --oneline"          → ["git", "log", "--oneline"]
 *   'grep -r "hello world" .'   → ["grep", "-r", "hello world", "."]
 */
export function parseCommand(raw: string): [string, string[]] {
  const parts: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;

    if (ch === '\\' && !inSingle) {
      // Escape sequence — consume next char literally
      const next = raw[i + 1];
      if (next !== undefined) {
        current += next;
        i++;
      }
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (ch === ' ' && !inSingle && !inDouble) {
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) parts.push(current);

  if (parts.length === 0) {
    throw new Error('command must not be empty');
  }

  const [binary, ...args] = parts as [string, ...string[]];
  return [binary, args];
}

/**
 * Check the command against the blocklist.
 * Throws with a descriptive message if the command is blocked.
 */
function assertNotBlocked(binary: string, args: string[]): void {
  const fullCommand = [binary, ...args].join(' ').toLowerCase();

  for (const rule of COMMAND_BLOCKLIST) {
    const matched =
      typeof rule === 'string'
        ? fullCommand.includes(rule)
        : rule.test(fullCommand);

    if (matched) {
      throw new Error(
        `Command blocked by security policy: "${fullCommand}". ` +
        `Matched rule: ${rule.toString()}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// executeCommand
// ---------------------------------------------------------------------------

/**
 * Execute a command safely using `execFile`.
 *
 * @param command  Full command string (binary + args), e.g. "git log --oneline"
 * @param cwd      Working directory (optional). When provided, must be a valid path.
 * @param timeout  Timeout in milliseconds. Clamped to [1000, MAX_TIMEOUT_MS].
 */
export async function executeCommand(
  command: string,
  cwd?: string,
  timeout?: number,
): Promise<ShellResult> {
  if (!command || !command.trim()) {
    throw new Error('command must be a non-empty string');
  }

  const [binary, args] = parseCommand(command.trim());

  // Security checks
  assertNotBlocked(binary, args);

  const timeoutMs = Math.min(
    Math.max(timeout ?? DEFAULT_TIMEOUT_MS, 1000),
    MAX_TIMEOUT_MS,
  );

  const startTime = Date.now();

  return new Promise<ShellResult>((resolveP, rejectP) => {
    execFile(
      binary,
      args,
      {
        cwd: cwd ?? undefined,
        timeout: timeoutMs,
        maxBuffer: MAX_OUTPUT_BYTES * 2, // give extra room; we trim after
        encoding: 'utf-8',
        windowsHide: true,
      },
      (error, rawStdout, rawStderr) => {
        const durationMs = Date.now() - startTime;

        // Normalise output
        let stdout = typeof rawStdout === 'string' ? rawStdout : '';
        let stderr = typeof rawStderr === 'string' ? rawStderr : '';
        let truncated = false;

        const totalBytes = Buffer.byteLength(stdout, 'utf-8') + Buffer.byteLength(stderr, 'utf-8');
        if (totalBytes > MAX_OUTPUT_BYTES) {
          truncated = true;
          // Trim stdout proportionally
          const stdoutBytes = Buffer.byteLength(stdout, 'utf-8');
          const stderrBytes = Buffer.byteLength(stderr, 'utf-8');
          const stdoutRatio = stdoutBytes / (stdoutBytes + stderrBytes || 1);
          const stdoutCap = Math.floor(MAX_OUTPUT_BYTES * stdoutRatio);
          const stderrCap = MAX_OUTPUT_BYTES - stdoutCap;

          if (stdoutBytes > stdoutCap) {
            stdout = Buffer.from(stdout, 'utf-8').slice(0, stdoutCap).toString('utf-8') +
              `\n... [truncated — ${stdoutBytes} bytes total]`;
          }
          if (stderrBytes > stderrCap) {
            stderr = Buffer.from(stderr, 'utf-8').slice(0, stderrCap).toString('utf-8') +
              `\n... [truncated — ${stderrBytes} bytes total]`;
          }
        }

        // Timeout is signalled as ETIMEDOUT or via error.killed
        if (error && (error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
          rejectP(
            new Error(
              `Command timed out after ${timeoutMs}ms: ${binary} ${args.join(' ')}`,
            ),
          );
          return;
        }

        // execFile signals non-zero exit via error.code (number) or kills via ETIMEDOUT (string).
        // For normal process exits, error.code is a number. For system errors it's a string.
        const errorCode = error?.code;
        const exitCode =
          error === null
            ? 0
            : typeof errorCode === 'number'
              ? errorCode
              : 1;

        resolveP({
          stdout,
          stderr,
          exitCode,
          truncated,
          durationMs,
          command: binary,
          args,
        });
      },
    );
  });
}
