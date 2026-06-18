/**
 * Unified search capabilities — search.* namespace.
 */

import { readdirSync, type Dirent } from 'node:fs';
import { join } from 'node:path';

import type { AgentConfig } from '../config.js';
import { validatePath } from '../security.js';
import { grepFiles } from './grep.js';
import { searchFiles } from './filesystem.js';

const MAX_FIND_RESULTS = 500;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next']);

export function searchGrep(
  params: {
    pattern: string;
    path: string;
    glob?: string;
    contextLines?: number;
    maxResults?: number;
  },
  config: AgentConfig,
): ReturnType<typeof grepFiles> {
  const fileTypes = params.glob
    ? params.glob
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)
        .map((g) => (g.startsWith('.') ? g : `.${g.replace(/^\*\./, '')}`))
    : undefined;

  return grepFiles(
    {
      pattern: params.pattern,
      directory: params.path,
      fileTypes,
      contextBefore: params.contextLines,
      contextAfter: params.contextLines,
      maxResults: params.maxResults,
    },
    config,
  );
}

export function searchGlob(
  params: { pattern: string; path?: string },
  config: AgentConfig,
): ReturnType<typeof searchFiles> {
  const directory = params.path ?? config.allowedDirectories[0];
  if (!directory) {
    throw new Error('path is required when allowedDirectories is empty');
  }
  return searchFiles(directory, params.pattern, config);
}

export function searchFind(
  params: { path: string; name?: string; type?: 'file' | 'directory'; maxDepth?: number },
  config: AgentConfig,
): { results: string[]; count: number; truncated: boolean } {
  const validated = validatePath(params.path, config.allowedDirectories);
  if (!validated) {
    throw new Error(`path "${params.path}" is outside allowed directories`);
  }

  const maxDepth = Math.min(params.maxDepth ?? 8, 15);
  const namePattern = params.name ? globToRegex(params.name) : null;
  const results: string[] = [];

  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth || results.length >= MAX_FIND_RESULTS) return;

    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true, encoding: 'utf8' });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = String(entry.name);
      if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;

      const fullPath = join(dir, name);
      const isDir = entry.isDirectory();
      const isFile = entry.isFile();

      if (params.type === 'directory' && !isDir) continue;
      if (params.type === 'file' && !isFile) continue;

      if (!namePattern || namePattern.test(name)) {
        results.push(fullPath);
      }

      if (isDir) walk(fullPath, depth + 1);
      if (results.length >= MAX_FIND_RESULTS) break;
    }
  };

  walk(validated, 0);

  return {
    results,
    count: results.length,
    truncated: results.length >= MAX_FIND_RESULTS,
  };
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}
