/**
 * Context Assembly — context.* namespace (Local RAG output for gateway).
 */

import type { AgentConfig } from '../config.js';
import { validatePath } from '../security.js';
import { indexSearch } from './indexer.js';

export interface ContextChunk {
  filePath: string;
  relativePath: string;
  score: number;
  snippet: string;
  chunkId: string;
}

export interface ContextAssembleResult {
  directory: string;
  query: string;
  topK: number;
  chunks: ContextChunk[];
  markdown: string;
}

const MAX_MARKDOWN_CHARS = 12_000;

export async function contextAssemble(
  params: { directory: string; query: string; topK?: number },
  config: AgentConfig,
): Promise<ContextAssembleResult> {
  const validated = validatePath(params.directory, config.allowedDirectories);
  if (!validated) throw new Error('directory is outside allowedDirectories');

  const res = await indexSearch(
    { directory: validated, query: params.query, topK: params.topK },
    config,
  );

  const chunks: ContextChunk[] = res.results.map((r) => ({
    filePath: r.filePath,
    relativePath: r.relativePath,
    score: r.score,
    snippet: r.snippet,
    chunkId: r.chunkId,
  }));

  const parts: string[] = [];
  parts.push('---');
  parts.push(`Local context (index): ${validated}`);
  parts.push(`Query: ${params.query}`);
  parts.push('---');
  parts.push('');

  for (const c of chunks) {
    parts.push(`### ${c.relativePath} (score=${c.score})`);
    parts.push('```');
    parts.push(c.snippet.trim());
    parts.push('```');
    parts.push('');
  }

  let markdown = parts.join('\n');
  if (markdown.length > MAX_MARKDOWN_CHARS) {
    markdown = markdown.slice(0, MAX_MARKDOWN_CHARS) + '\n\n... [truncated]\n';
  }

  return {
    directory: validated,
    query: params.query,
    topK: res.topK,
    chunks,
    markdown,
  };
}

