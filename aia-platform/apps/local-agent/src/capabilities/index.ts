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
import * as code from './code.js';
import * as git from './git.js';
import * as search from './search.js';
import * as web from './web.js';
import * as processCap from './process.js';
import * as indexer from './indexer.js';
import * as context from './context.js';
import { desktopHandlers } from './desktop.js';
import { triageJobsHandlers } from './triage-jobs.js';

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

handlers.set('shell.executeStream', (params, config) => {
  const command = requireString(params, 'command');
  return shell.executeCommandStream(command, {
    cwd: params['cwd'] as string | undefined,
    timeout: params['timeout'] as number | undefined,
    env: params['env'] as Record<string, string> | undefined,
  }, config);
});

handlers.set('shell.terminate', (params) => {
  const processId = requireString(params, 'processId');
  return shell.terminateCommand(processId);
});

handlers.set('shell.getRunning', () => shell.getRunningCommands());

// Shell: get info
handlers.set('shell.getInfo', () => {
  return shell.getShellInfo();
});

// Code namespace
handlers.set('code.readRange', (params, config) => {
  const filePath = requireString(params, 'filePath');
  return code.codeReadRange({
    filePath,
    startLine: params['startLine'] as number | undefined,
    endLine: params['endLine'] as number | undefined,
  }, config);
});

handlers.set('code.write', (params, config) => {
  const filePath = requireString(params, 'filePath');
  const content = requireString(params, 'content');
  return code.codeWrite({ filePath, content }, config);
});

handlers.set('code.edit', (params, config) => {
  const filePath = requireString(params, 'filePath');
  const oldString = requireString(params, 'oldString');
  const newString = requireString(params, 'newString');
  return code.codeEdit({
    filePath,
    oldString,
    newString,
    replaceAll: params['replaceAll'] as boolean | undefined,
  }, config);
});

handlers.set('code.editMulti', (params, config) => {
  const filePath = requireString(params, 'filePath');
  const edits = params['edits'] as Array<{ oldString: string; newString: string; replaceAll?: boolean }>;
  if (!Array.isArray(edits) || edits.length === 0) {
    throw new Error('Required parameter "edits" must be a non-empty array');
  }
  return code.codeEditMulti({ filePath, edits }, config);
});

// Git namespace
handlers.set('git.status', (params, config) => {
  return git.gitStatus({ cwd: params['cwd'] as string | undefined }, config);
});

handlers.set('git.diff', (params, config) => {
  return git.gitDiff({
    cwd: params['cwd'] as string | undefined,
    staged: params['staged'] as boolean | undefined,
    file: params['file'] as string | undefined,
  }, config);
});

handlers.set('git.log', (params, config) => {
  return git.gitLog({
    cwd: params['cwd'] as string | undefined,
    count: params['count'] as number | undefined,
    format: params['format'] as string | undefined,
  }, config);
});

handlers.set('git.commit', (params, config) => {
  const message = requireString(params, 'message');
  return git.gitCommit({
    message,
    files: params['files'] as string[] | undefined,
    cwd: params['cwd'] as string | undefined,
  }, config);
});

handlers.set('git.branch', (params, config) => {
  const action = requireString(params, 'action');
  return git.gitBranch({
    action,
    name: params['name'] as string | undefined,
    cwd: params['cwd'] as string | undefined,
  }, config);
});

handlers.set('git.stash', (params, config) => {
  const action = requireString(params, 'action');
  return git.gitStash({
    action,
    cwd: params['cwd'] as string | undefined,
  }, config);
});

handlers.set('git.blame', (params, config) => {
  const filePath = requireString(params, 'filePath');
  return git.gitBlame({
    filePath,
    startLine: params['startLine'] as number | undefined,
    endLine: params['endLine'] as number | undefined,
    cwd: params['cwd'] as string | undefined,
  }, config);
});

handlers.set('git.push', (params, config) => {
  return git.gitPush({
    remote: params['remote'] as string | undefined,
    branch: params['branch'] as string | undefined,
    force: params['force'] as boolean | undefined,
    cwd: params['cwd'] as string | undefined,
    _approved: params['_approved'] as boolean | undefined,
  }, config);
});

handlers.set('git.reset', (params, config) => {
  return git.gitReset({
    mode: params['mode'] as string | undefined,
    ref: params['ref'] as string | undefined,
    cwd: params['cwd'] as string | undefined,
    _approved: params['_approved'] as boolean | undefined,
  }, config);
});

// Search namespace
handlers.set('search.grep', (params, config) => {
  const pattern = requireString(params, 'pattern');
  const path = requireString(params, 'path');
  return search.searchGrep({
    pattern,
    path,
    glob: params['glob'] as string | undefined,
    contextLines: params['contextLines'] as number | undefined,
    maxResults: params['maxResults'] as number | undefined,
  }, config);
});

handlers.set('search.glob', (params, config) => {
  const pattern = requireString(params, 'pattern');
  return search.searchGlob({
    pattern,
    path: params['path'] as string | undefined,
  }, config);
});

handlers.set('search.find', (params, config) => {
  const path = requireString(params, 'path');
  return search.searchFind({
    path,
    name: params['name'] as string | undefined,
    type: params['type'] as 'file' | 'directory' | undefined,
    maxDepth: params['maxDepth'] as number | undefined,
  }, config);
});

// Web namespace
handlers.set('web.fetch', async (params, config) => {
  const url = requireString(params, 'url');
  return web.webFetch({
    url,
    method: params['method'] as string | undefined,
    headers: params['headers'] as Record<string, string> | undefined,
    body: params['body'] as string | undefined,
    maxSize: params['maxSize'] as number | undefined,
  }, config);
});

handlers.set('web.search', async (params, config) => {
  const query = requireString(params, 'query');
  return web.webSearch({
    query,
    count: params['count'] as number | undefined,
  }, config);
});

// Process namespace
handlers.set('process.start', (params, config) => {
  const command = requireString(params, 'command');
  return processCap.processStart({
    command,
    cwd: params['cwd'] as string | undefined,
    detached: params['detached'] as boolean | undefined,
  }, config);
});

handlers.set('process.stop', (params, config) => {
  const processId = requireString(params, 'processId');
  return processCap.processStop({ processId }, config);
});

handlers.set('process.list', (params, config) => {
  return processCap.processList(params as Record<string, never>, config);
});

handlers.set('process.logs', (params, config) => {
  const processId = requireString(params, 'processId');
  return processCap.processLogs({
    processId,
    tail: params['tail'] as number | undefined,
  }, config);
});

// Local RAG: index.*
handlers.set('index.status', (params, config) => {
  return indexer.indexStatus({ directory: params['directory'] as string | undefined }, config);
});

handlers.set('index.clear', (params, config) => {
  return indexer.indexClear({ directory: params['directory'] as string | undefined }, config);
});

handlers.set('index.build', async (params, config) => {
  const directory = requireString(params, 'directory');
  return indexer.indexBuild({
    directory,
    maxFiles: params['maxFiles'] as number | undefined,
    maxFileBytes: params['maxFileBytes'] as number | undefined,
    maxChunkChars: params['maxChunkChars'] as number | undefined,
  }, config);
});

handlers.set('index.search', async (params, config) => {
  const directory = requireString(params, 'directory');
  const query = requireString(params, 'query');
  return indexer.indexSearch({
    directory,
    query,
    topK: params['topK'] as number | undefined,
  }, config);
});

// Local RAG: context.*
handlers.set('context.assemble', async (params, config) => {
  const directory = requireString(params, 'directory');
  const query = requireString(params, 'query');
  return context.contextAssemble({
    directory,
    query,
    topK: params['topK'] as number | undefined,
  }, config);
});

// Desktop handlers (registered from desktop.ts)
for (const [action, handler] of desktopHandlers) {
  handlers.set(action, handler);
}

// Triage & Jobs (dashboard / gateway proxy)
for (const [action, handler] of triageJobsHandlers) {
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
