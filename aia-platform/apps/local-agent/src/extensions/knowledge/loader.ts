import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';

import type { PersonaKnowledgeRef } from '../types.js';
import { cosineSimilarity, getTextEmbedding, initEmbeddingsCache } from '../../embeddings-cache.js';

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.yml', '.yaml', '.json']);
const MAX_RAG_FILES = 8;
const MAX_RAG_CHARS = 6_000;
const MAX_FILE_CHARS = 2_000;

let embeddingsReady = false;
function ensureEmbeddingsCache(): void {
  if (embeddingsReady) return;
  initEmbeddingsCache();
  embeddingsReady = true;
}

export function expandKnowledgePath(path: string): string {
  if (path.startsWith('~/')) return join(homedir(), path.slice(2));
  if (path === '~') return homedir();
  return path;
}

function readTextFile(path: string, limit = MAX_FILE_CHARS): string {
  const raw = readFileSync(path, 'utf-8');
  return raw.length > limit ? `${raw.slice(0, limit)}…` : raw;
}

function loadStructuredPath(absPath: string): string {
  if (!existsSync(absPath)) return '';

  const stat = statSync(absPath);
  if (stat.isFile()) {
    const ext = extname(absPath).toLowerCase();
    if (ext === '.json') {
      try {
        return JSON.stringify(JSON.parse(readFileSync(absPath, 'utf-8')), null, 2).slice(0, MAX_RAG_CHARS);
      } catch {
        return readTextFile(absPath, MAX_RAG_CHARS);
      }
    }
    if (ext === '.yml' || ext === '.yaml') {
      try {
        const doc = parseYaml(readFileSync(absPath, 'utf-8'));
        return JSON.stringify(doc, null, 2).slice(0, MAX_RAG_CHARS);
      } catch {
        return readTextFile(absPath, MAX_RAG_CHARS);
      }
    }
    return readTextFile(absPath, MAX_RAG_CHARS);
  }

  if (!stat.isDirectory()) return '';

  const parts: string[] = [];
  for (const name of readdirSync(absPath).slice(0, MAX_RAG_FILES)) {
    const full = join(absPath, name);
    if (!statSync(full).isFile()) continue;
    if (!TEXT_EXTENSIONS.has(extname(name).toLowerCase())) continue;
    parts.push(`### ${name}\n${readTextFile(full)}`);
  }
  return parts.join('\n\n').slice(0, MAX_RAG_CHARS);
}

async function loadRagLitePath(absPath: string, query?: string): Promise<string> {
  if (!existsSync(absPath)) return '';
  const stat = statSync(absPath);
  if (stat.isFile()) return readTextFile(absPath, MAX_RAG_CHARS);

  const files: Array<{ name: string; full: string; score: number; preview: string }> = [];
  for (const name of readdirSync(absPath)) {
    const full = join(absPath, name);
    if (!statSync(full).isFile()) continue;
    if (!TEXT_EXTENSIONS.has(extname(name).toLowerCase())) continue;
    const text = readTextFile(full, MAX_FILE_CHARS);
    let score = 0;
    if (query) {
      const q = query.toLowerCase();
      const lower = text.toLowerCase();
      for (const token of q.split(/\s+/).filter((t) => t.length > 2)) {
        if (lower.includes(token)) score++;
      }
    } else {
      score = 1;
    }
    if (score > 0) files.push({ name, full, score, preview: text });
  }

  // If we have a query AND an embedding model configured, rank by semantic similarity.
  // Fallback remains the original token-match score.
  if (query) {
    try {
      ensureEmbeddingsCache();
      const qEmb = await awaitMaybeEmbedding(query);
      if (qEmb) {
        const scored = await Promise.all(
          files.map(async (f) => {
            const docEmb = await awaitMaybeEmbedding(f.preview);
            const sim = docEmb ? cosineSimilarity(qEmb, docEmb) : 0;
            return { ...f, semanticScore: sim };
          }),
        );
        scored.sort((a, b) => (b.semanticScore - a.semanticScore) || (b.score - a.score));
        return scored
          .slice(0, MAX_RAG_FILES)
          .map((f) => `### ${f.name}\n${readTextFile(f.full)}`)
          .join('\n\n')
          .slice(0, MAX_RAG_CHARS);
      }
    } catch {
      // best-effort
    }
  }

  files.sort((a, b) => b.score - a.score);
  return files
    .slice(0, MAX_RAG_FILES)
    .map((f) => `### ${f.name}\n${readTextFile(f.full)}`)
    .join('\n\n')
    .slice(0, MAX_RAG_CHARS);
}

async function awaitMaybeEmbedding(text: string): Promise<number[] | null> {
  // Keep embeddings input bounded to avoid accidental cost explosions
  const bounded = text.length > 2_000 ? text.slice(0, 2_000) : text;
  return getTextEmbedding(bounded);
}

export async function loadKnowledgeBlock(
  refs: PersonaKnowledgeRef[] | undefined,
  query?: string,
): Promise<string> {
  if (!refs?.length) return '';

  const blocks: string[] = [];
  for (const ref of refs) {
    const abs = expandKnowledgePath(ref.path);
    const type = ref.type ?? (abs.endsWith('.yml') || abs.endsWith('.json') ? 'structured' : 'rag');
    const body = type === 'structured' ? loadStructuredPath(abs) : await loadRagLitePath(abs, query);
    if (!body.trim()) continue;
    blocks.push(`[Knowledge: ${ref.path}]\n${body}`);
  }

  if (blocks.length === 0) return '';
  return `\n\n---\nContesto knowledge base:\n${blocks.join('\n\n')}\n---\n`;
}
