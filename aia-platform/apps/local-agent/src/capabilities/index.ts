/**
 * Capability Registry — Maps action names to handler functions.
 *
 * Each capability is registered with:
 * - Action name (e.g., 'filesystem.readFile')
 * - Handler function that executes the action
 * - Required params validation
 *
 * The registry validates permissions before execution and logs all actions.
 */

import type { AgentConfig } from '../config.js';
import { performSecurityCheck, auditLog, getAllowedActions } from '../security.js';
import * as filesystem from './filesystem.js';
import * as clipboard from './clipboard.js';
import * as system from './system.js';
import * as shell from './shell.js';
import * as grep from './grep.js';
import { desktopHandlers } from './desktop.js';

export type ActionHandler = (
  params: Record<string, unknown>,
  config: AgentConfig,
) => Promise<unknown> | unknown;

// --- Handler Registry ---

const handlers = new Map<string, ActionHandler>();

// Filesystem handlers
handlers.set('filesystem.readFile', (params, config) => {
  const path = requireString(params, 'path');
  return filesystem.readFile(path, config);
});

handlers.set('filesystem.writeFile', (params, config) => {
  const path = requireString(params, 'path');
  const content = requireString(params, 'content');
  return filesystem.writeFile(path, content, config);
});

handlers.set('filesystem.listDirectory', (params, config) => {
  const path = requireString(params, 'path');
  return filesystem.listDirectory(path, config);
});

handlers.set('filesystem.searchFiles', (params, config) => {
  const directory = requireString(params, 'directory');
  const pattern = requireString(params, 'pattern');
  return filesystem.searchFiles(directory, pattern, config);
});

handlers.set('filesystem.watchDirectory', (params, config) => {
  const path = requireString(params, 'path');
  // For WebSocket-based watch, we start the watcher and emit events
  // The onChange callback will be wired up by the caller
  const onChange = params['_onChange'] as ((event: string, filePath: string) => void) | undefined;
  if (!onChange) {
    throw new Error('watchDirectory requires an onChange callback (internal error)');
  }
  return filesystem.watchDirectory(path, config, onChange);
});

handlers.set('filesystem.getFileInfo', (params, config) => {
  const path = requireString(params, 'path');
  return filesystem.getFileInfo(path, config);
});

// Clipboard handlers
handlers.set('clipboard.read', async () => {
  return clipboard.readClipboard();
});

handlers.set('clipboard.write', async (params) => {
  const text = requireString(params, 'text');
  return clipboard.writeClipboard(text);
});

// System handlers
handlers.set('system.openUrl', async (params) => {
  const url = requireString(params, 'url');
  return system.openUrl(url);
});

handlers.set('system.openFile', async (params) => {
  const path = requireString(params, 'path');
  return system.openFile(path);
});

handlers.set('system.showNotification', async (params) => {
  const title = requireString(params, 'title');
  const body = (params['body'] as string) ?? '';
  return system.showNotification(title, body);
});

handlers.set('system.getSystemInfo', () => {
  return system.getSystemInfo();
});

// Filesystem: editFile
handlers.set('filesystem.editFile', (params, config) => {
  const path = requireString(params, 'path');
  const edits = params['edits'] as Array<{ oldText: string; newText: string; replaceAll?: boolean }>;
  if (!Array.isArray(edits) || edits.length === 0) {
    throw new Error('Required parameter "edits" must be a non-empty array of {oldText, newText} objects');
  }
  return filesystem.editFile(path, edits, config);
});

// Filesystem: grep
handlers.set('filesystem.grep', (params, config) => {
  const pattern = requireString(params, 'pattern');
  const directory = requireString(params, 'directory');
  return grep.grepFiles({
    pattern,
    directory,
    fileTypes: params['fileTypes'] as string[] | undefined,
    contextBefore: params['contextBefore'] as number | undefined,
    contextAfter: params['contextAfter'] as number | undefined,
    ignoreCase: params['ignoreCase'] as boolean | undefined,
    maxResults: params['maxResults'] as number | undefined,
    includeHidden: params['includeHidden'] as boolean | undefined,
  }, config);
});

// Shell: execute command
handlers.set('shell.execute', (params, config) => {
  const command = requireString(params, 'command');
  return shell.executeCommand(command, {
    cwd: params['cwd'] as string | undefined,
    timeout: params['timeout'] as number | undefined,
    env: params['env'] as Record<string, string> | undefined,
  }, config);
});

// Shell: get info
handlers.set('shell.getInfo', () => {
  return shell.getShellInfo();
});

// Desktop handlers (registered from desktop.ts)
for (const [action, handler] of desktopHandlers) {
  handlers.set(action, handler);
}

// --- Public API ---

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
}

/**
 * Execute an action by name with the given parameters.
 * Performs security checks, rate limiting, and audit logging.
 */
export async function executeAction(
  action: string,
  params: Record<string, unknown>,
  config: AgentConfig,
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Security check
  const secCheck = performSecurityCheck(action, params, config);
  if (!secCheck.allowed) {
    auditLog({
      timestamp: new Date().toISOString(),
      action,
      params,
      result: 'denied',
      reason: secCheck.reason,
    });

    return {
      success: false,
      error: secCheck.reason ?? 'Action denied by security policy',
      durationMs: Date.now() - startTime,
    };
  }

  // Find handler
  const handler = handlers.get(action);
  if (!handler) {
    auditLog({
      timestamp: new Date().toISOString(),
      action,
      params,
      result: 'denied',
      reason: 'Unknown action',
    });

    return {
      success: false,
      error: `Unknown action: ${action}`,
      durationMs: Date.now() - startTime,
    };
  }

  // Execute
  try {
    const result = await handler(params, config);
    const durationMs = Date.now() - startTime;

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      params,
      result: 'allowed',
      durationMs,
    });

    return {
      success: true,
      result,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      params,
      result: 'error',
      reason: errorMessage,
      durationMs,
    });

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Get the list of all registered action names (for capability registration).
 */
export function getRegisteredActions(): string[] {
  return getAllowedActions();
}

// --- Helpers ---

function requireString(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Required parameter "${key}" must be a non-empty string`);
  }
  return value;
}
