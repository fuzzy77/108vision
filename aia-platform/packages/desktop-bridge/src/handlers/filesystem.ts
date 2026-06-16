/**
 * Filesystem handler — sandboxed file system operations for the Desktop Agent.
 *
 * Security model:
 *   - Every path is resolved to absolute and checked against `allowedPaths`.
 *   - writeFile returns an ActionRequest (pending approval) rather than
 *     executing immediately. The gateway must re-call with `approved: true`.
 *   - readFile hard-cap: 1 MB.
 *   - listDirectory hard-cap: 100 entries.
 *   - searchFiles uses recursive walk with a depth limit of 8.
 *   - No external dependencies — only Node.js built-in modules.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { resolve, normalize, join, basename, extname, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  /** Bytes. 0 for directories. */
  size: number;
  /** ISO 8601 UTC */
  modified: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  mimeType: string;
  isDirectory: boolean;
  /** ISO 8601 UTC */
  modified: string;
  /** ISO 8601 UTC */
  created: string;
}

/**
 * Sentinel returned by writeFile when the operation needs gateway approval.
 * The caller must re-invoke with `approved: true` to actually write.
 */
export interface ActionRequest {
  actionRequest: true;
  action: 'writeFile';
  path: string;
  /** Byte-length of the content to be written. */
  contentLength: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_READ_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_LIST_ENTRIES = 100;
const MAX_SEARCH_RESULTS = 100;
const MAX_SEARCH_DEPTH = 8;

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a raw path and verify it falls under one of the allowed paths.
 * Throws on violation rather than returning null — callers get a clear error.
 */
function assertAllowedPath(rawPath: string, allowedPaths: string[]): string {
  if (!rawPath) throw new Error('path must be a non-empty string');

  // Null-byte injection guard
  if (rawPath.includes('\0')) {
    throw new Error('path contains invalid null byte');
  }

  const resolved = resolve(normalize(rawPath));

  for (const allowed of allowedPaths) {
    const normalizedAllowed = resolve(normalize(allowed));
    const rLower = resolved.toLowerCase();
    const aLower = normalizedAllowed.toLowerCase();

    if (
      rLower === aLower ||
      rLower.startsWith(aLower + '/') ||
      rLower.startsWith(aLower + '\\')
    ) {
      return resolved;
    }
  }

  throw new Error(
    `Access denied: "${resolved}" is outside the allowed paths. ` +
    `Allowed: ${allowedPaths.join(', ')}`,
  );
}

// ---------------------------------------------------------------------------
// readFile
// ---------------------------------------------------------------------------

export function readFile(
  path: string,
  allowedPaths: string[],
): { content: string; size: number; encoding: 'utf-8' } {
  const resolvedPath = assertAllowedPath(path, allowedPaths);

  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const stats = statSync(resolvedPath);

  if (stats.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${resolvedPath}`);
  }

  if (stats.size > MAX_READ_BYTES) {
    throw new Error(
      `File too large: ${stats.size} bytes (max ${MAX_READ_BYTES} / 1 MB). Use a range query.`,
    );
  }

  // Block binary extensions that would produce unreadable output
  const ext = extname(resolvedPath).toLowerCase();
  const BINARY_EXTS = new Set([
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
    '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.wasm', '.node',
  ]);

  if (BINARY_EXTS.has(ext)) {
    throw new Error(
      `Cannot read binary file "${ext}": ${resolvedPath}. ` +
      'Only text files are supported.',
    );
  }

  const content = readFileSync(resolvedPath, 'utf-8');

  return { content, size: stats.size, encoding: 'utf-8' };
}

// ---------------------------------------------------------------------------
// writeFile
// ---------------------------------------------------------------------------

/**
 * Write a file.
 *
 * If `approved` is false (default), returns an ActionRequest that must be
 * forwarded to the gateway for user confirmation. The gateway re-calls with
 * `approved: true` to actually write.
 */
export function writeFile(
  path: string,
  content: string,
  allowedPaths: string[],
  approved: boolean,
): { written: true; path: string; size: number } | ActionRequest {
  const resolvedPath = assertAllowedPath(path, allowedPaths);

  if (!approved) {
    return {
      actionRequest: true,
      action: 'writeFile',
      path: resolvedPath,
      contentLength: Buffer.byteLength(content, 'utf-8'),
      reason: `Write ${Buffer.byteLength(content, 'utf-8')} bytes to "${resolvedPath}"`,
    };
  }

  // Ensure parent directory exists
  const dir = dirname(resolvedPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(resolvedPath, content, 'utf-8');
  const stats = statSync(resolvedPath);

  return { written: true, path: resolvedPath, size: stats.size };
}

// ---------------------------------------------------------------------------
// listDirectory
// ---------------------------------------------------------------------------

export function listDirectory(
  path: string,
  allowedPaths: string[],
): { entries: FileEntry[]; total: number; truncated: boolean } {
  const resolvedPath = assertAllowedPath(path, allowedPaths);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Directory not found: ${resolvedPath}`);
  }

  const stat = statSync(resolvedPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolvedPath}`);
  }

  const items = readdirSync(resolvedPath, { withFileTypes: true });
  const entries: FileEntry[] = [];
  let totalCount = 0;

  for (const item of items) {
    totalCount++;
    if (entries.length >= MAX_LIST_ENTRIES) continue;

    // Skip hidden entries
    if (item.name.startsWith('.')) continue;

    try {
      const fullPath = join(resolvedPath, item.name);
      const itemStat = statSync(fullPath);

      entries.push({
        name: item.name,
        path: fullPath,
        type: item.isDirectory() ? 'directory' : 'file',
        size: item.isFile() ? itemStat.size : 0,
        modified: itemStat.mtime.toISOString(),
      });
    } catch {
      // Permission error on a single entry — skip it
    }
  }

  // Sort: directories first, then alphabetically
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    entries,
    total: totalCount,
    truncated: entries.length < totalCount,
  };
}

// ---------------------------------------------------------------------------
// searchFiles
// ---------------------------------------------------------------------------

/**
 * Recursively search for files whose name matches a glob-style pattern.
 * Supports `*` (any sequence of chars) and `?` (single char) wildcards.
 */
export function searchFiles(
  rootPath: string,
  pattern: string,
  allowedPaths: string[],
): { results: string[]; truncated: boolean } {
  const resolvedRoot = assertAllowedPath(rootPath, allowedPaths);

  if (!existsSync(resolvedRoot)) {
    throw new Error(`Root path not found: ${resolvedRoot}`);
  }

  const regex = globToRegex(pattern);
  const results: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > MAX_SEARCH_DEPTH) return;
    if (results.length >= MAX_SEARCH_RESULTS) return;

    let items: import('node:fs').Dirent[];
    try {
      items = readdirSync(dir, { withFileTypes: true, encoding: 'utf8' });
    } catch {
      return; // Permission denied
    }

    for (const item of items) {
      if (results.length >= MAX_SEARCH_RESULTS) break;

      const name = String(item.name);
      if (name.startsWith('.') || name === 'node_modules') continue;

      const fullPath = join(dir, name);

      if (item.isFile() && regex.test(name)) {
        results.push(fullPath);
      }

      if (item.isDirectory()) {
        walk(fullPath, depth + 1);
      }
    }
  }

  walk(resolvedRoot, 0);

  return {
    results,
    truncated: results.length >= MAX_SEARCH_RESULTS,
  };
}

// ---------------------------------------------------------------------------
// fileInfo
// ---------------------------------------------------------------------------

export function fileInfo(
  path: string,
  allowedPaths: string[],
): FileInfo {
  const resolvedPath = assertAllowedPath(path, allowedPaths);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${resolvedPath}`);
  }

  const stats = statSync(resolvedPath);
  const ext = extname(resolvedPath).toLowerCase();

  return {
    name: basename(resolvedPath),
    path: resolvedPath,
    size: stats.size,
    extension: ext,
    mimeType: getMimeType(ext),
    isDirectory: stats.isDirectory(),
    modified: stats.mtime.toISOString(),
    created: stats.birthtime.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function getMimeType(ext: string): string {
  const TYPES: Record<string, string> = {
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
    '.toml': 'text/x-toml',
    '.env': 'text/plain',
    '.log': 'text/plain',
  };
  return TYPES[ext] ?? 'application/octet-stream';
}
