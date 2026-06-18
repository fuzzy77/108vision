/**
 * Local Indexer — index.* namespace (Local RAG “vero”, file-based).
 *
 * Goals:
 * - Build an on-disk index per project directory
 * - Incremental updates (mtime + size heuristic)
 * - Semantic retrieval using embedding endpoint (cached) when available
 * - Cheap fallback scoring (token overlap) when embeddings are unavailable
 *
 * NOTE: This uses the existing embeddings client (`getTextEmbedding`) which may call
 * a remote endpoint depending on provider config. Storage + retrieval are local.
 */
 
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve, normalize, extname } from 'node:path';
 
import type { AgentConfig } from '../config.js';
import { validatePath } from '../security.js';
import { cosineSimilarity, getTextEmbedding, initEmbeddingsCache } from '../embeddings-cache.js';
import { smartChunk } from '../smart-chunk.js';
 
const INDEX_ROOT = join(homedir(), '.108ai', 'indexes');
const INDEX_VERSION = 1;
 
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.turbo']);
const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.yml', '.yaml',
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.java', '.cs', '.rs', '.php',
  '.html', '.css',
]);
 
const DEFAULT_MAX_FILES = 1500;
const DEFAULT_MAX_FILE_BYTES = 512 * 1024; // 512KB
const DEFAULT_MAX_CHUNK_CHARS = 3_500;
const DEFAULT_TOPK = 8;
 
let embeddingsReady = false;
function ensureEmbeddings(): void {
  if (embeddingsReady) return;
  initEmbeddingsCache();
  embeddingsReady = true;
}
 
export interface IndexChunk {
  id: string;
  filePath: string;
  relativePath: string;
  mtimeMs: number;
  sizeBytes: number;
  language: string;
  content: string; // reduced, bounded
  embedding?: number[]; // optional
}
 
export interface ProjectIndex {
  version: number;
  directory: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  chunkCount: number;
  chunks: IndexChunk[];
}
 
export interface IndexBuildResult {
  directory: string;
  indexPath: string;
  created: boolean;
  updatedChunks: number;
  skippedFiles: number;
  totalFilesSeen: number;
  chunkCount: number;
  embeddingEnabled: boolean;
}
 
export interface IndexSearchResultItem {
  filePath: string;
  relativePath: string;
  score: number;
  snippet: string;
  chunkId: string;
}
 
export interface IndexSearchResult {
  directory: string;
  query: string;
  topK: number;
  embeddingEnabled: boolean;
  results: IndexSearchResultItem[];
}
 
function sha1(text: string): string {
  return createHash('sha1').update(text, 'utf-8').digest('hex');
}
 
function projectIdFromDirectory(directory: string): string {
  return sha1(directory).slice(0, 12);
}
 
function indexDir(directory: string): string {
  const id = projectIdFromDirectory(directory);
  return join(INDEX_ROOT, id);
}
 
function indexFilePath(directory: string): string {
  return join(indexDir(directory), 'index.json');
}
 
function ensureIndexDir(directory: string): void {
  const dir = indexDir(directory);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
 
function readTextSafe(path: string, maxBytes: number): string | null {
  try {
    const stat = statSync(path);
    if (!stat.isFile()) return null;
    if (stat.size > maxBytes) return null;
    const raw = readFileSync(path, 'utf-8');
    return raw;
  } catch {
    return null;
  }
}
 
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter((t) => t.length >= 3 && t.length <= 40);
}
 
function overlapScore(query: string, doc: string): number {
  const q = new Set(tokenize(query));
  if (q.size === 0) return 0;
  const d = new Set(tokenize(doc));
  let hit = 0;
  for (const t of q) if (d.has(t)) hit++;
  return hit / q.size;
}
 
function languageFromExt(p: string): string {
  const ext = extname(p).toLowerCase();
  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.mjs') return 'typescript';
  if (ext === '.py') return 'python';
  if (ext === '.go') return 'go';
  if (ext === '.java') return 'java';
  if (ext === '.cs') return 'csharp';
  if (ext === '.rs') return 'rust';
  if (ext === '.md') return 'markdown';
  if (ext === '.json') return 'json';
  if (ext === '.yml' || ext === '.yaml') return 'yaml';
  return ext.replace('.', '') || 'text';
}
 
function walkFiles(root: string, maxFiles: number): string[] {
  const results: string[] = [];
  const stack: string[] = [root];
 
  while (stack.length > 0 && results.length < maxFiles) {
    const dir = stack.pop();
    if (!dir) break;
 
    let entries: Array<{ name: string; full: string; isDir: boolean; isFile: boolean }> = [];
    try {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        let st;
        try {
          st = statSync(full);
        } catch {
          continue;
        }
        entries.push({ name, full, isDir: st.isDirectory(), isFile: st.isFile() });
      }
    } catch {
      continue;
    }
 
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      if (e.isDir) {
        if (SKIP_DIRS.has(e.name)) continue;
        stack.push(e.full);
      } else if (e.isFile) {
        const ext = extname(e.name).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;
        results.push(e.full);
        if (results.length >= maxFiles) break;
      }
    }
  }
 
  return results;
}
 
function loadIndex(directory: string): ProjectIndex | null {
  const file = indexFilePath(directory);
  if (!existsSync(file)) return null;
  try {
    const doc = JSON.parse(readFileSync(file, 'utf-8')) as ProjectIndex;
    if (doc.version !== INDEX_VERSION || doc.directory !== directory || !Array.isArray(doc.chunks)) {
      return null;
    }
    return doc;
  } catch {
    return null;
  }
}
 
function saveIndex(directory: string, index: ProjectIndex): void {
  ensureIndexDir(directory);
  const file = indexFilePath(directory);
  writeFileSync(file, JSON.stringify(index, null, 2), 'utf-8');
}
 
export function indexStatus(
  params: { directory?: string },
  config: AgentConfig,
): { directory: string; indexPath: string; exists: boolean; chunkCount: number; updatedAt?: string } {
  const directory = resolve(normalize(params.directory ?? config.allowedDirectories[0] ?? ''));
  const validated = validatePath(directory, config.allowedDirectories);
  if (!validated) throw new Error('directory is outside allowedDirectories');
 
  const idx = loadIndex(validated);
  return {
    directory: validated,
    indexPath: indexFilePath(validated),
    exists: idx !== null,
    chunkCount: idx?.chunks.length ?? 0,
    updatedAt: idx?.updatedAt,
  };
}
 
export function indexClear(
  params: { directory?: string },
  config: AgentConfig,
): { directory: string; cleared: boolean } {
  const directory = resolve(normalize(params.directory ?? config.allowedDirectories[0] ?? ''));
  const validated = validatePath(directory, config.allowedDirectories);
  if (!validated) throw new Error('directory is outside allowedDirectories');
 
  const file = indexFilePath(validated);
  if (!existsSync(file)) return { directory: validated, cleared: false };
  unlinkSync(file);
  return { directory: validated, cleared: true };
}
 
export async function indexBuild(
  params: {
    directory: string;
    maxFiles?: number;
    maxFileBytes?: number;
    maxChunkChars?: number;
  },
  config: AgentConfig,
): Promise<IndexBuildResult> {
  const validated = validatePath(params.directory, config.allowedDirectories);
  if (!validated) throw new Error('directory is outside allowedDirectories');
 
  ensureIndexDir(validated);
 
  const prev = loadIndex(validated);
  const created = prev === null;
  const now = new Date().toISOString();
 
  const maxFiles = Math.min(params.maxFiles ?? DEFAULT_MAX_FILES, 5000);
  const maxFileBytes = Math.min(params.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES, 2 * 1024 * 1024);
  const maxChunkChars = Math.min(params.maxChunkChars ?? DEFAULT_MAX_CHUNK_CHARS, 8000);
 
  const allFiles = walkFiles(validated, maxFiles);
  const chunks: IndexChunk[] = prev?.chunks ? [...prev.chunks] : [];
 
  const byFile = new Map<string, IndexChunk[]>();
  for (const c of chunks) {
    const list = byFile.get(c.filePath) ?? [];
    list.push(c);
    byFile.set(c.filePath, list);
  }
 
  let updatedChunks = 0;
  let skippedFiles = 0;
 
  ensureEmbeddings();
  // Avoid hard-failing build when embedding provider is not configured.
  let embeddingEnabled = false;
  try {
    embeddingEnabled = (await getTextEmbedding('ping')) !== null;
  } catch {
    embeddingEnabled = false;
  }
 
  const nextChunks: IndexChunk[] = [];
 
  for (const filePath of allFiles) {
    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      skippedFiles++;
      continue;
    }
    if (!stat.isFile()) continue;
    if (stat.size > maxFileBytes) {
      skippedFiles++;
      continue;
    }
 
    const previousChunks = byFile.get(filePath) ?? [];
    const unchanged = previousChunks.length > 0 && previousChunks[0]?.mtimeMs === stat.mtimeMs && previousChunks[0]?.sizeBytes === stat.size;
    if (unchanged) {
      for (const c of previousChunks) nextChunks.push(c);
      continue;
    }
 
    const raw = readTextSafe(filePath, maxFileBytes);
    if (raw === null) {
      skippedFiles++;
      continue;
    }
 
    const relativePath = filePath.startsWith(validated) ? filePath.slice(validated.length).replace(/^[/\\]/, '') : filePath;
    const language = languageFromExt(filePath);
    const reduced = smartChunk(raw, 'index', maxChunkChars).content;
    const chunkId = sha1(`${relativePath}:${stat.mtimeMs}:${stat.size}`).slice(0, 12);
 
    let embedding: number[] | undefined;
    if (embeddingEnabled) {
      const emb = await getTextEmbedding(reduced.slice(0, 2000));
      if (emb) embedding = emb;
    }
 
    nextChunks.push({
      id: chunkId,
      filePath,
      relativePath,
      mtimeMs: stat.mtimeMs,
      sizeBytes: stat.size,
      language,
      content: reduced,
      embedding,
    });
    updatedChunks++;
  }
 
  // Drop chunks for files no longer present
  const present = new Set(allFiles);
  const filtered = nextChunks.filter((c) => present.has(c.filePath));
 
  const next: ProjectIndex = {
    version: INDEX_VERSION,
    directory: validated,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    fileCount: allFiles.length,
    chunkCount: filtered.length,
    chunks: filtered,
  };
 
  saveIndex(validated, next);
 
  return {
    directory: validated,
    indexPath: indexFilePath(validated),
    created,
    updatedChunks,
    skippedFiles,
    totalFilesSeen: allFiles.length,
    chunkCount: filtered.length,
    embeddingEnabled,
  };
}
 
export async function indexSearch(
  params: { directory: string; query: string; topK?: number },
  config: AgentConfig,
): Promise<IndexSearchResult> {
  const validated = validatePath(params.directory, config.allowedDirectories);
  if (!validated) throw new Error('directory is outside allowedDirectories');
  if (!params.query?.trim()) throw new Error('query is required');
 
  const idx = loadIndex(validated);
  if (!idx) {
    throw new Error('Index not found. Run index.build first.');
  }
 
  ensureEmbeddings();
  const qEmb = await getTextEmbedding(params.query.slice(0, 2000));
  const embeddingEnabled = qEmb !== null;
  const topK = Math.min(Math.max(params.topK ?? DEFAULT_TOPK, 1), 25);
 
  const scored = idx.chunks.map((c) => {
    const lexical = overlapScore(params.query, c.content);
    const semantic = qEmb && c.embedding ? cosineSimilarity(qEmb, c.embedding) : 0;
    const score = (semantic * 0.85) + (lexical * 0.15);
    return { c, score };
  });
 
  scored.sort((a, b) => b.score - a.score);
 
  const results: IndexSearchResultItem[] = [];
  for (const { c, score } of scored.slice(0, topK)) {
    const snippet = smartChunk(c.content, params.query, 900).content;
    results.push({
      filePath: c.filePath,
      relativePath: c.relativePath,
      score: Number(score.toFixed(4)),
      snippet,
      chunkId: c.id,
    });
  }
 
  return {
    directory: validated,
    query: params.query,
    topK,
    embeddingEnabled,
    results,
  };
}

