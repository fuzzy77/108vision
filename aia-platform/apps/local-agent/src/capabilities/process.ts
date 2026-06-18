/**
 * Process management — long-running dev servers via shell-process registry.
 */

import type { AgentConfig } from '../config.js';
import {
  getShellProcessLogs,
  listRunningShellProcesses,
  startShellProcess,
  terminateShellProcess,
} from './shell-process.js';
import { assertShellEnabled } from './shell-security.js';

export function processStart(
  params: { command: string; cwd?: string; detached?: boolean },
  config: AgentConfig,
): ReturnType<typeof startShellProcess> {
  assertShellEnabled(config);
  return startShellProcess(
    params.command,
    {
      cwd: params.cwd,
      timeout: config.shellDefaultTimeout ?? 600_000,
    },
    config,
  );
}

export function processStop(
  params: { processId: string },
  _config: AgentConfig,
): ReturnType<typeof terminateShellProcess> {
  return terminateShellProcess(params.processId);
}

export function processList(_params: Record<string, never>, _config: AgentConfig) {
  return { processes: listRunningShellProcesses() };
}

export function processLogs(
  params: { processId: string; tail?: number },
  _config: AgentConfig,
) {
  const logs = getShellProcessLogs(params.processId, params.tail);
  if (!logs) {
    throw new Error(`Process not found: ${params.processId}`);
  }
  return logs;
}
