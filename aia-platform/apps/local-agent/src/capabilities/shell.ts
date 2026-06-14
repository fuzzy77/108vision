/**
 * Shell Capability — Execute commands in a sandboxed shell.
 *
 * Security model:
 * - Working directory must be within allowedDirectories
 * - Blocklist of destructive commands
 * - Hard timeout (default 30s, max 120s)
 * - Output truncated to 100KB
 * - high-risk classification (requires gateway approval)
 */

import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import { resolve, normalize } from 'node:path';
import { existsSync } from 'node:fs';
import { validatePath } from '../security.js';
import type { AgentConfig } from '../config.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 100 * 1024; // 100KB

const BLOCKED_PATTERNS: RegExp[] = [
  // Destructive filesystem ops
  /\brm\s+(-rf?|--recursive)\s+[/\\]/i,
  /\bdel\s+\/s\s+\/q/i,
  /\bformat\s+[a-z]:/i,
  /\brmdir\s+\/s/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  // System-level danger
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bkill\s+-9\s+1\b/,
  /\bkillall\b/i,
  /\btaskkill\s+\/f\s+\/im\s+(explorer|csrss|svchost)/i,
  // Registry / system config
  /\breg\s+(delete|add)\s+hklm/i,
  /\bchmod\s+777\s+\//i,
  // Network danger
  /\biptables\s+-F/i,
  /\bnetsh\s+advfirewall\s+reset/i,
  // Crypto / ransom patterns
  /\bopenssl\s+enc\b.*-in\s+\//i,
];

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  truncated: boolean;
  durationMs: number;
  command: string;
  cwd: string;
}

/**
 * Execute a shell command with sandboxing.
 */
export function executeCommand(
  command: string,
  params: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  },
  config: AgentConfig,
): ShellResult {
  if (!command || command.trim().length === 0) {
    throw new Error('Command cannot be empty');
  }

  // Validate working directory
  const cwd = params.cwd ?? config.allowedDirectories[0];
  if (!cwd) {
    throw new Error('No working directory specified and no allowedDirectories configured');
  }

  const resolvedCwd = resolve(normalize(cwd));
  const validatedCwd = validatePath(resolvedCwd, config.allowedDirectories);
  if (!validatedCwd) {
    throw new Error(`Working directory "${cwd}" is outside allowed directories`);
  }

  if (!existsSync(validatedCwd)) {
    throw new Error(`Working directory does not exist: ${validatedCwd}`);
  }

  // Check blocklist
  const blocked = BLOCKED_PATTERNS.find((pat) => pat.test(command));
  if (blocked) {
    throw new Error(
      `Command blocked by security policy. Destructive or dangerous commands are not allowed.`,
    );
  }

  // Timeout
  const timeout = Math.min(params.timeout ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

  // Determine shell
  const isWindows = platform() === 'win32';
  const shell = isWindows ? 'cmd.exe' : '/bin/sh';

  const startTime = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let timedOut = false;

  try {
    const output = execSync(command, {
      cwd: validatedCwd,
      timeout,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: 'utf-8',
      shell,
      env: {
        ...process.env,
        ...params.env,
        // Prevent interactive prompts
        GIT_TERMINAL_PROMPT: '0',
        CI: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    stdout = output ?? '';
  } catch (error: unknown) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
      killed?: boolean;
      signal?: string;
    };

    stdout = err.stdout ?? '';
    stderr = err.stderr ?? '';
    exitCode = err.status ?? 1;
    timedOut = err.killed === true || err.signal === 'SIGTERM';
  }

  const durationMs = Date.now() - startTime;

  // Truncate output if needed
  let truncated = false;
  if (stdout.length > MAX_OUTPUT_BYTES) {
    stdout = stdout.slice(0, MAX_OUTPUT_BYTES) + '\n... [output truncated]';
    truncated = true;
  }
  if (stderr.length > MAX_OUTPUT_BYTES) {
    stderr = stderr.slice(0, MAX_OUTPUT_BYTES) + '\n... [output truncated]';
    truncated = true;
  }

  return {
    stdout,
    stderr,
    exitCode,
    timedOut,
    truncated,
    durationMs,
    command,
    cwd: validatedCwd,
  };
}

/**
 * Get the default shell info for context.
 */
export function getShellInfo(): { shell: string; platform: string } {
  const isWindows = platform() === 'win32';
  return {
    shell: isWindows ? 'cmd.exe' : '/bin/sh',
    platform: platform(),
  };
}
