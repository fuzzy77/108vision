/**
 * Shell Capability — Execute commands in a sandboxed shell.
 */

import { execSync } from 'node:child_process';
import { platform } from 'node:os';

import type { AgentConfig } from '../config.js';
import {
  assertShellEnabled,
  resolveMaxOutputBytes,
  resolveShellCwd,
  resolveShellTimeout,
  validateShellCommand,
} from './shell-security.js';
import {
  getShellProcessLogs,
  listRunningShellProcesses,
  startShellProcess,
  terminateShellProcess,
} from './shell-process.js';

export type { ShellStreamEvent, ShellStreamHandler } from './shell-process.js';
export { setShellStreamHandler } from './shell-process.js';

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

export function executeCommand(
  command: string,
  params: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  },
  config: AgentConfig,
): ShellResult {
  assertShellEnabled(config);
  validateShellCommand(command, config);

  const validatedCwd = resolveShellCwd(params.cwd, config);
  const timeout = resolveShellTimeout(params.timeout, config);
  const maxOutput = resolveMaxOutputBytes(config);

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
      maxBuffer: maxOutput,
      encoding: 'utf-8',
      shell,
      env: {
        ...process.env,
        ...params.env,
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

  let truncated = false;
  if (stdout.length > maxOutput) {
    stdout = stdout.slice(0, maxOutput) + '\n... [output truncated]';
    truncated = true;
  }
  if (stderr.length > maxOutput) {
    stderr = stderr.slice(0, maxOutput) + '\n... [output truncated]';
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

export function executeCommandStream(
  command: string,
  params: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  },
  config: AgentConfig,
): ReturnType<typeof startShellProcess> {
  return startShellProcess(command, params, config);
}

export function terminateCommand(processId: string): ReturnType<typeof terminateShellProcess> {
  return terminateShellProcess(processId);
}

export function getRunningCommands() {
  return { processes: listRunningShellProcesses() };
}

export function getCommandLogs(processId: string, tail?: number) {
  const logs = getShellProcessLogs(processId, tail);
  if (!logs) {
    throw new Error(`Process not found: ${processId}`);
  }
  return logs;
}

export function getShellInfo(): { shell: string; platform: string } {
  const isWindows = platform() === 'win32';
  return {
    shell: isWindows ? 'cmd.exe' : '/bin/sh',
    platform: platform(),
  };
}
