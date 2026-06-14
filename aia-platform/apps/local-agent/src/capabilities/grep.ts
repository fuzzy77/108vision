/**
 * Grep Capability — Search file contents with regex patterns.
 *
 * Provides content-level search across files within allowed directories.
 * Supports regex patterns, file type filtering, context lines, and result limits.
 *
 * Limits:
 * - Max 500 matches returned
 * - Max 50MB total scanned content per query
 * - Max depth 10 directories
 * - Skips binary files and node_modules
 */

import { readdirSync, readFileSync, statSync, type Dirent } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { validatePath } from '../security.js';
import type { AgentConfig } from '../config.js';

const MAX_RESULTS = 500;
const MAX_SCAN_BYTES = 50 * 1024 * 1024; // 50MB total scan budget
const MAX_DEPTH = 10;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // Skip files > 2MB

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
  '__pycache__', '.next', '.nuxt', 'target', 'bin', 'obj',
  'vendor', '.terraform', 'coverage',
]);

const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.zip', '.tar', '.gz', '.7z', '.rar', '.bz2',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.woff', '.woff2', '.ttf', '.eot',
  '.class', '.jar', '.pyc', '.pyo',
]);

export interface GrepMatch {
  file: string;
  relativePath: string;
  line: number;
  column: number;
  content: string;
  contextBefore: string[];
  contextAfter: string[];
}

export interface GrepResult {
  matches: GrepMatch[];
  filesSearched: number;
  totalMatches: number;
  truncated: boolean;
  durationMs: number;
}

export interface GrepOptions {
  pattern: string;
  directory: string;
  /** File extension filter (e.g., ".ts", ".js") */
  fileTypes?: string[];
  /** Lines of context before match */
  contextBefore?: number;
  /** Lines of context after match */
  contextAfter?: number;
  /** Case insensitive search */
  ignoreCase?: boolean;
  /** Max results (capped at 500) */
  maxResults?: number;
  /** Include hidden files */
  includeHidden?: boolean;
}

/**
 * Search file contents using regex pattern.
 */
export function grepFiles(options: GrepOptions, config: AgentConfig): GrepResult {
  const startTime = Date.now();

  const validatedDirOrNull = validatePath(options.directory, config.allowedDirectories);
  if (!validatedDirOrNull) {
    throw new Error(`Access denied: path "${options.directory}" is outside allowed directories`);
  }
  const validatedDir: string = validatedDirOrNull;

  // Build regex
  let regex: RegExp;
  try {
    const flags = options.ignoreCase ? 'gi' : 'g';
    regex = new RegExp(options.pattern, flags);
  } catch (error) {
    throw new Error(`Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
  }

  const maxResults = Math.min(options.maxResults ?? MAX_RESULTS, MAX_RESULTS);
  const contextBefore = Math.min(options.contextBefore ?? 0, 5);
  const contextAfter = Math.min(options.contextAfter ?? 0, 5);
  const fileTypeFilter = options.fileTypes
    ? new Set(options.fileTypes.map((t) => t.startsWith('.') ? t : `.${t}`))
    : null;

  const matches: GrepMatch[] = [];
  let filesSearched = 0;
  let totalMatches = 0;
  let bytesScanned = 0;

  function walkAndSearch(dir: string, depth: number): void {
    if (depth > MAX_DEPTH || matches.length >= maxResults || bytesScanned >= MAX_SCAN_BYTES) {
      return;
    }

    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
    } catch {
      return;
    }

    for (const entry of entries) {
      if (matches.length >= maxResults || bytesScanned >= MAX_SCAN_BYTES) break;

      const name = String(entry.name);

      // Skip hidden files/dirs unless requested
      if (!options.includeHidden && name.startsWith('.')) continue;

      const fullPath = join(dir, name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(name)) continue;
        walkAndSearch(fullPath, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;

      // Extension filter
      const ext = extname(name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;
      if (fileTypeFilter && !fileTypeFilter.has(ext)) continue;

      // Size check
      let stats;
      try {
        stats = statSync(fullPath);
      } catch {
        continue;
      }
      if (stats.size > MAX_FILE_SIZE || stats.size === 0) continue;

      // Read and search
      let content: string;
      try {
        content = readFileSync(fullPath, 'utf-8');
      } catch {
        continue;
      }

      bytesScanned += stats.size;
      filesSearched++;

      const lines = content.split('\n');
      regex.lastIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        regex.lastIndex = 0;
        const match = regex.exec(line);

        if (match) {
          totalMatches++;

          if (matches.length < maxResults) {
            matches.push({
              file: fullPath,
              relativePath: relative(validatedDir, fullPath),
              line: i + 1,
              column: match.index + 1,
              content: line.trimEnd(),
              contextBefore: lines.slice(Math.max(0, i - contextBefore), i).map((l) => l.trimEnd()),
              contextAfter: lines.slice(i + 1, i + 1 + contextAfter).map((l) => l.trimEnd()),
            });
          }
        }
      }
    }
  }

  walkAndSearch(validatedDir, 0);

  return {
    matches,
    filesSearched,
    totalMatches,
    truncated: totalMatches > maxResults || bytesScanned >= MAX_SCAN_BYTES,
    durationMs: Date.now() - startTime,
  };
}
