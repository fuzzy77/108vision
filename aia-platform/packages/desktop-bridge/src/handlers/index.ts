/**
 * Tool dispatcher — routes incoming `tool_call` messages to the correct handler.
 *
 * Tool name convention: `<namespace>.<operation>`
 *   filesystem.readFile
 *   filesystem.writeFile
 *   filesystem.listDirectory
 *   filesystem.searchFiles
 *   filesystem.fileInfo
 *   shell.execute
 *   clipboard.read
 *   clipboard.write
 *   screen.capture
 *   screen.activeWindow
 *
 * Each handler performs its own input validation and throws on invalid params.
 * The dispatcher wraps every call in a try/catch and returns a typed result
 * so callers never receive an unhandled rejection.
 */

import * as fs from './filesystem.js';
import * as shell from './shell.js';
import * as clipboard from './clipboard.js';
import * as screen from './screen.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCallSuccess<T = unknown> {
  ok: true;
  result: T;
}

export interface ToolCallError {
  ok: false;
  error: string;
  /** Human-readable context for debugging. */
  tool: string;
}

export type ToolCallResult<T = unknown> = ToolCallSuccess<T> | ToolCallError;

/**
 * Context passed into handleToolCall so handlers can enforce access policies.
 */
export interface ToolCallContext {
  /** Filesystem paths the agent is allowed to access. */
  allowedPaths: string[];
}

// ---------------------------------------------------------------------------
// Param extraction helpers (no Zod — built-in types only)
// ---------------------------------------------------------------------------

function requireString(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Required parameter "${key}" must be a non-empty string`);
  }
  return v;
}

function optionalString(params: Record<string, unknown>, key: string): string | undefined {
  const v = params[key];
  return typeof v === 'string' ? v : undefined;
}

function optionalNumber(params: Record<string, unknown>, key: string): number | undefined {
  const v = params[key];
  return typeof v === 'number' ? v : undefined;
}

function optionalBoolean(params: Record<string, unknown>, key: string): boolean {
  const v = params[key];
  return v === true;
}

// ---------------------------------------------------------------------------
// handleToolCall
// ---------------------------------------------------------------------------

/**
 * Main dispatcher. Invoked by the Desktop Agent when it receives a
 * `tool_call` WebSocket message from the gateway.
 *
 * @param tool    Tool identifier, e.g. `"filesystem.readFile"`
 * @param params  Arbitrary parameter bag from the gateway (validated here)
 * @param ctx     Security context (allowed paths, etc.)
 */
export async function handleToolCall(
  tool: string,
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolCallResult> {
  try {
    const result = await dispatch(tool, params, ctx);
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      tool,
    };
  }
}

async function dispatch(
  tool: string,
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<unknown> {
  switch (tool) {
    // ------------------------------------------------------------------
    // Filesystem
    // ------------------------------------------------------------------

    case 'filesystem.readFile': {
      const path = requireString(params, 'path');
      return fs.readFile(path, ctx.allowedPaths);
    }

    case 'filesystem.writeFile': {
      const path = requireString(params, 'path');
      const content = requireString(params, 'content');
      const approved = optionalBoolean(params, 'approved');
      return fs.writeFile(path, content, ctx.allowedPaths, approved);
    }

    case 'filesystem.listDirectory': {
      const path = requireString(params, 'path');
      return fs.listDirectory(path, ctx.allowedPaths);
    }

    case 'filesystem.searchFiles': {
      const rootPath = requireString(params, 'rootPath');
      const pattern = requireString(params, 'pattern');
      return fs.searchFiles(rootPath, pattern, ctx.allowedPaths);
    }

    case 'filesystem.fileInfo': {
      const path = requireString(params, 'path');
      return fs.fileInfo(path, ctx.allowedPaths);
    }

    // ------------------------------------------------------------------
    // Shell
    // ------------------------------------------------------------------

    case 'shell.execute': {
      const command = requireString(params, 'command');
      const cwd = optionalString(params, 'cwd');
      const timeout = optionalNumber(params, 'timeout');
      return shell.executeCommand(command, cwd, timeout);
    }

    // ------------------------------------------------------------------
    // Clipboard
    // ------------------------------------------------------------------

    case 'clipboard.read': {
      return clipboard.readClipboard();
    }

    case 'clipboard.write': {
      const text = requireString(params, 'text');
      return clipboard.writeClipboard(text);
    }

    // ------------------------------------------------------------------
    // Screen
    // ------------------------------------------------------------------

    case 'screen.capture': {
      return screen.captureScreen();
    }

    case 'screen.activeWindow': {
      return screen.getActiveWindow();
    }

    // ------------------------------------------------------------------
    // Unknown
    // ------------------------------------------------------------------

    default:
      throw new Error(
        `Unknown tool: "${tool}". ` +
        'Available tools: filesystem.readFile, filesystem.writeFile, ' +
        'filesystem.listDirectory, filesystem.searchFiles, filesystem.fileInfo, ' +
        'shell.execute, clipboard.read, clipboard.write, ' +
        'screen.capture, screen.activeWindow',
      );
  }
}

// ---------------------------------------------------------------------------
// Re-export individual handlers for callers that need direct access
// ---------------------------------------------------------------------------

export { fs as filesystemHandlers, shell as shellHandlers, clipboard as clipboardHandlers, screen as screenHandlers };
