/**
 * Code editing capabilities — code.* namespace (Phase 5).
 */

import type { AgentConfig } from '../config.js';
import { editFile, readFile, writeFile } from './filesystem.js';

export interface CodeLine {
  line: number;
  text: string;
}

export function codeReadRange(
  params: { filePath: string; startLine?: number; endLine?: number },
  config: AgentConfig,
): { path: string; lines: CodeLine[]; totalLines: number } {
  const { content } = readFile(params.filePath, config);
  const allLines = content.split('\n');
  const start = Math.max(1, params.startLine ?? 1);
  const end = Math.min(allLines.length, params.endLine ?? allLines.length);

  if (start > end) {
    throw new Error(`Invalid line range: ${start}-${end}`);
  }

  const lines: CodeLine[] = [];
  for (let i = start; i <= end; i++) {
    lines.push({ line: i, text: allLines[i - 1] ?? '' });
  }

  return {
    path: params.filePath,
    lines,
    totalLines: allLines.length,
  };
}

export function codeWrite(
  params: { filePath: string; content: string },
  config: AgentConfig,
): ReturnType<typeof writeFile> {
  return writeFile(params.filePath, params.content, config);
}

export function codeEdit(
  params: {
    filePath: string;
    oldString: string;
    newString: string;
    replaceAll?: boolean;
  },
  config: AgentConfig,
): ReturnType<typeof editFile> {
  return editFile(
    params.filePath,
    [{ oldText: params.oldString, newText: params.newString, replaceAll: params.replaceAll }],
    config,
  );
}

export function codeEditMulti(
  params: {
    filePath: string;
    edits: Array<{ oldString: string; newString: string; replaceAll?: boolean }>;
  },
  config: AgentConfig,
): ReturnType<typeof editFile> {
  return editFile(
    params.filePath,
    params.edits.map((e) => ({
      oldText: e.oldString,
      newText: e.newString,
      replaceAll: e.replaceAll,
    })),
    config,
  );
}
