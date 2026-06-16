/**
 * Filesystem Capability — Sandboxed file system operations.
 *
 * All operations are restricted to explicitly allowed directories.
 * Path traversal (../) is prevented by resolving to absolute paths
 * and checking against the allowlist.
 *
 * Limits:
 * - readFile: text only, max 10MB
 * - writeFile: only within allowed directories
 * - searchFiles: glob patterns, max 1000 results
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { watch } from 'chokidar';
import { validatePath } from '../security.js';
import type { AgentConfig } from '../config.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_SEARCH_RESULTS = 1000;

// Track active watchers for cleanup
const activeWatchers = new Map<string, ReturnType<typeof watch>>();

/**
 * Read a text file's content.
 * Validates path, checks size, and returns content.
 */
export function readFile(
  path: string,
  config: AgentConfig,
): { content: string; size: number; encoding: string } {
  const validatedPath = validatePath(path, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${path}" is outside allowed directories`);
  }

  if (!existsSync(validatedPath)) {
    throw new Error(`File not found: ${validatedPath}`);
  }

  const stats = statSync(validatedPath);

  if (stats.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${validatedPath}`);
  }

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE} bytes / 10MB)`,
    );
  }

  // Detect if file is likely binary
  const ext = extname(validatedPath).toLowerCase();
  const binaryExtensions = new Set([
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
    '.mp3', '.mp4', '.avi', '.mov', '.wav',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  ]);

  if (binaryExtensions.has(ext)) {
    throw new Error(`Cannot read binary file: ${validatedPath} (extension: ${ext})`);
  }

  const content = readFileSync(validatedPath, 'utf-8');

  return {
    content,
    size: stats.size,
    encoding: 'utf-8',
  };
}

/**
 * Write content to a file. Creates parent directories if needed.
 */
export function writeFile(
  path: string,
  content: string,
  config: AgentConfig,
): { written: boolean; path: string; size: number } {
  const validatedPath = validatePath(path, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${path}" is outside allowed directories`);
  }

  // Ensure parent directory exists
  const dir = dirname(validatedPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(validatedPath, content, 'utf-8');

  const stats = statSync(validatedPath);

  return {
    written: true,
    path: validatedPath,
    size: stats.size,
  };
}

/**
 * List files and directories at a given path.
 */
export function listDirectory(
  path: string,
  config: AgentConfig,
): { entries: DirectoryEntry[] } {
  const validatedPath = validatePath(path, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${path}" is outside allowed directories`);
  }

  if (!existsSync(validatedPath)) {
    throw new Error(`Directory not found: ${validatedPath}`);
  }

  const stats = statSync(validatedPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${validatedPath}`);
  }

  const items = readdirSync(validatedPath, { withFileTypes: true });
  const entries: DirectoryEntry[] = [];

  for (const item of items) {
    // Skip hidden files (starting with .)
    if (item.name.startsWith('.')) continue;

    try {
      const fullPath = join(validatedPath, item.name);
      const itemStats = statSync(fullPath);

      entries.push({
        name: item.name,
        path: fullPath,
        type: item.isDirectory() ? 'directory' : 'file',
        size: item.isFile() ? itemStats.size : 0,
        modifiedAt: itemStats.mtime.toISOString(),
      });
    } catch {
      // Skip items we cannot stat (permission issues)
      continue;
    }
  }

  // Sort: directories first, then by name
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { entries };
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string;
}

/**
 * Search for files matching a glob-like pattern within a directory.
 * Simple pattern matching: supports * and ? wildcards.
 */
export function searchFiles(
  directory: string,
  pattern: string,
  config: AgentConfig,
): { results: string[]; count: number; truncated: boolean } {
  const validatedPath = validatePath(directory, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${directory}" is outside allowed directories`);
  }

  if (!existsSync(validatedPath)) {
    throw new Error(`Directory not found: ${validatedPath}`);
  }

  const results: string[] = [];
  const regex = globToRegex(pattern);

  function walk(dir: string, depth: number): void {
    if (depth > 10 || results.length >= MAX_SEARCH_RESULTS) return;

    let items: import('node:fs').Dirent[];
    try {
      items = readdirSync(dir, { withFileTypes: true, encoding: 'utf8' });
    } catch {
      return;
    }

    for (const item of items) {
      const name = String(item.name);
      if (name.startsWith('.') || name === 'node_modules') continue;

      const fullPath = join(dir, name);

      if (item.isFile() && regex.test(name)) {
        results.push(fullPath);
      }

      if (item.isDirectory()) {
        walk(fullPath, depth + 1);
      }

      if (results.length >= MAX_SEARCH_RESULTS) break;
    }
  }

  walk(validatedPath, 0);

  return {
    results,
    count: results.length,
    truncated: results.length >= MAX_SEARCH_RESULTS,
  };
}

/**
 * Watch a directory for file changes. Returns a watch ID for stopping.
 */
export function watchDirectory(
  path: string,
  config: AgentConfig,
  onChange: (event: string, filePath: string) => void,
): { watchId: string } {
  const validatedPath = validatePath(path, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${path}" is outside allowed directories`);
  }

  if (!existsSync(validatedPath)) {
    throw new Error(`Directory not found: ${validatedPath}`);
  }

  const watchId = `watch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const watcher = watch(validatedPath, {
    persistent: true,
    ignoreInitial: true,
    depth: 3,
    ignored: /(^|[/\\])\.|node_modules/,
  });

  watcher.on('add', (filePath) => onChange('added', filePath));
  watcher.on('change', (filePath) => onChange('changed', filePath));
  watcher.on('unlink', (filePath) => onChange('removed', filePath));

  activeWatchers.set(watchId, watcher);

  return { watchId };
}

/**
 * Stop a file watcher.
 */
export function stopWatch(watchId: string): void {
  const watcher = activeWatchers.get(watchId);
  if (watcher) {
    watcher.close();
    activeWatchers.delete(watchId);
  }
}

/**
 * Stop all active watchers (cleanup on shutdown).
 */
export function stopAllWatchers(): void {
  for (const [id, watcher] of activeWatchers) {
    watcher.close();
    activeWatchers.delete(id);
  }
}

/**
 * Get file metadata without reading content.
 */
export function getFileInfo(
  path: string,
  config: AgentConfig,
): {
  name: string;
  path: string;
  size: number;
  type: string;
  extension: string;
  modifiedAt: string;
  createdAt: string;
  isDirectory: boolean;
} {
  const validatedPath = validatePath(path, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${path}" is outside allowed directories`);
  }

  if (!existsSync(validatedPath)) {
    throw new Error(`Path not found: ${validatedPath}`);
  }

  const stats = statSync(validatedPath);
  const ext = extname(validatedPath).toLowerCase();

  return {
    name: basename(validatedPath),
    path: validatedPath,
    size: stats.size,
    type: stats.isDirectory() ? 'directory' : getMimeType(ext),
    extension: ext,
    modifiedAt: stats.mtime.toISOString(),
    createdAt: stats.birthtime.toISOString(),
    isDirectory: stats.isDirectory(),
  };
}

/**
 * Edit a file by applying find-and-replace operations.
 * More surgical than writeFile — doesn't require sending the entire file content.
 */
export function editFile(
  path: string,
  edits: Array<{ oldText: string; newText: string; replaceAll?: boolean }>,
  config: AgentConfig,
): { applied: number; path: string; size: number } {
  const validatedPath = validatePath(path, config.allowedDirectories);
  if (!validatedPath) {
    throw new Error(`Access denied: path "${path}" is outside allowed directories`);
  }

  if (!existsSync(validatedPath)) {
    throw new Error(`File not found: ${validatedPath}`);
  }

  const stats = statSync(validatedPath);
  if (stats.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${validatedPath}`);
  }

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large for editing: ${stats.size} bytes`);
  }

  let content = readFileSync(validatedPath, 'utf-8');
  let applied = 0;

  for (const edit of edits) {
    if (!edit.oldText) {
      throw new Error('Each edit must have a non-empty oldText');
    }

    if (edit.replaceAll) {
      const before = content;
      content = content.split(edit.oldText).join(edit.newText);
      if (content !== before) applied++;
    } else {
      const idx = content.indexOf(edit.oldText);
      if (idx === -1) {
        throw new Error(
          `oldText not found in file. First 50 chars of search: "${edit.oldText.slice(0, 50)}"`,
        );
      }
      content = content.slice(0, idx) + edit.newText + content.slice(idx + edit.oldText.length);
      applied++;
    }
  }

  writeFileSync(validatedPath, content, 'utf-8');
  const newStats = statSync(validatedPath);

  return {
    applied,
    path: validatedPath,
    size: newStats.size,
  };
}

// --- Helpers ---

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.xml': 'text/xml',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.rb': 'text/x-ruby',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.sh': 'text/x-shellscript',
    '.sql': 'text/x-sql',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
  };
  return types[ext] ?? 'application/octet-stream';
}
