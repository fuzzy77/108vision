/**
 * Shell process registry — long-running commands with streaming events.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { platform } from 'node:os';
import { nanoid } from 'nanoid';

import type { AgentConfig } from '../config.js';
import {
  assertShellEnabled,
  resolveMaxOutputBytes,
  resolveShellCwd,
  resolveShellTimeout,
  validateShellCommand,
} from './shell-security.js';

export interface ShellStreamEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  processId: string;
  data?: string;
  exitCode?: number;
  message?: string;
}

export type ShellStreamHandler = (event: ShellStreamEvent) => void;

interface RunningProcess {
  id: string;
  command: string;
  cwd: string;
  startedAt: number;
  child: ChildProcess;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  finished: boolean;
}

const registry = new Map<string, RunningProcess>();
let streamHandler: ShellStreamHandler | null = null;

export function setShellStreamHandler(handler: ShellStreamHandler | null): void {
  streamHandler = handler;
}

function emit(event: ShellStreamEvent): void {
  streamHandler?.(event);
}

function truncateBuffer(text: string, maxBytes: number): { text: string; truncated: boolean } {
  if (Buffer.byteLength(text, 'utf-8') <= maxBytes) {
    return { text, truncated: false };
  }
  let slice = text;
  while (Buffer.byteLength(slice, 'utf-8') > maxBytes && slice.length > 0) {
    slice = slice.slice(0, Math.floor(slice.length * 0.9));
  }
  return { text: `${slice}\n... [output truncated]`, truncated: true };
}

export function startShellProcess(
  command: string,
  params: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  },
  config: AgentConfig,
): { processId: string; command: string; cwd: string } {
  assertShellEnabled(config);
  validateShellCommand(command, config);

  const cwd = resolveShellCwd(params.cwd, config);
  const timeout = resolveShellTimeout(params.timeout, config);
  const maxOutput = resolveMaxOutputBytes(config);
  const isWindows = platform() === 'win32';
  const shell = isWindows ? 'cmd.exe' : '/bin/sh';
  const shellFlag = isWindows ? '/c' : '-c';

  const processId = nanoid(10);
  const child = spawn(shell, [shellFlag, command], {
    cwd,
    env: {
      ...process.env,
      ...params.env,
      GIT_TERMINAL_PROMPT: '0',
      CI: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const entry: RunningProcess = {
    id: processId,
    command,
    cwd,
    startedAt: Date.now(),
    child,
    stdout: '',
    stderr: '',
    exitCode: null,
    finished: false,
  };

  registry.set(processId, entry);

  const append = (stream: 'stdout' | 'stderr', chunk: string): void => {
    const merged = (stream === 'stdout' ? entry.stdout : entry.stderr) + chunk;
    const capped = truncateBuffer(merged, maxOutput);
    if (stream === 'stdout') entry.stdout = capped.text;
    else entry.stderr = capped.text;
    emit({ type: stream, processId, data: chunk });
  };

  child.stdout?.on('data', (buf: Buffer) => {
    append('stdout', buf.toString('utf-8'));
  });

  child.stderr?.on('data', (buf: Buffer) => {
    append('stderr', buf.toString('utf-8'));
  });

  const finish = (exitCode: number): void => {
    if (entry.finished) return;
    entry.finished = true;
    entry.exitCode = exitCode;
    emit({ type: 'exit', processId, exitCode });
    setTimeout(() => registry.delete(processId), 5 * 60_000);
  };

  child.on('error', (err) => {
    emit({ type: 'error', processId, message: err.message });
    finish(1);
  });

  child.on('close', (code) => {
    finish(code ?? 1);
  });

  const timer = setTimeout(() => {
    if (!entry.finished) {
      child.kill('SIGTERM');
      append('stderr', '\n... [process killed: timeout]\n');
      finish(124);
    }
  }, timeout);
  timer.unref();

  return { processId, command, cwd };
}

export function terminateShellProcess(processId: string): { terminated: boolean } {
  const entry = registry.get(processId);
  if (!entry || entry.finished) {
    return { terminated: false };
  }
  entry.child.kill('SIGTERM');
  return { terminated: true };
}

export function listRunningShellProcesses(): Array<{
  processId: string;
  command: string;
  cwd: string;
  startedAt: number;
  finished: boolean;
  exitCode: number | null;
}> {
  return [...registry.values()].map((entry) => ({
    processId: entry.id,
    command: entry.command,
    cwd: entry.cwd,
    startedAt: entry.startedAt,
    finished: entry.finished,
    exitCode: entry.exitCode,
  }));
}

export function getShellProcessLogs(
  processId: string,
  tail?: number,
): { stdout: string; stderr: string; exitCode: number | null; finished: boolean } | null {
  const entry = registry.get(processId);
  if (!entry) return null;

  const sliceTail = (text: string): string => {
    if (!tail || tail <= 0) return text;
    const lines = text.split('\n');
    return lines.slice(-tail).join('\n');
  };

  return {
    stdout: sliceTail(entry.stdout),
    stderr: sliceTail(entry.stderr),
    exitCode: entry.exitCode,
    finished: entry.finished,
  };
}

/** Test helper */
export function clearShellProcessRegistry(): void {
  for (const entry of registry.values()) {
    if (!entry.finished) entry.child.kill('SIGTERM');
  }
  registry.clear();
}
