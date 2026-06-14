/**
 * Script Store — Reusable script cache for the 108 AI Desktop Agent.
 *
 * When the LLM generates a script (Python, Bash, Node, PowerShell) to solve a
 * user's problem, the agent saves it here so it can be re-executed without
 * calling the LLM again.
 *
 * Storage layout under ~/.108ai/scripts/:
 *   index.json          — metadata for all scripts (array of SavedScript minus `code`)
 *   {id}.py             — Python script source
 *   {id}.sh             — Bash script source
 *   {id}.ps1            — PowerShell script source
 *   {id}.js             — Node.js script source
 *
 * findScript(query) strategy:
 *   1. Test every triggerPatterns regex against the query string.
 *   2. If no regex match, fuzzy-score against name + description + tags and
 *      return the best match above a minimum threshold.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { execFile, execFileSync, type ExecFileException } from 'node:child_process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedScript {
  id: string;               // unique slug, e.g. "find-large-files"
  name: string;             // human-readable label
  description: string;      // what the script does
  language: 'python' | 'bash' | 'powershell' | 'node';
  code: string;             // the actual script source (not stored in index.json)
  createdAt: string;        // ISO 8601
  lastUsedAt: string;       // ISO 8601
  usageCount: number;
  tags: string[];           // search keywords, e.g. ["file", "git", "convert"]
  triggerPatterns: string[]; // regex strings that should route to this script
}

/** Script record as stored in index.json (no `code` field). */
type ScriptMeta = Omit<SavedScript, 'code'>;

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Returns the directory where scripts are stored: ~/.108ai/scripts/ */
export function getScriptsDir(): string {
  return join(homedir(), '.108ai', 'scripts');
}

function getIndexPath(): string {
  return join(getScriptsDir(), 'index.json');
}

function getExtension(language: SavedScript['language']): string {
  switch (language) {
    case 'python':     return '.py';
    case 'bash':       return '.sh';
    case 'powershell': return '.ps1';
    case 'node':       return '.js';
  }
}

function getScriptFilePath(id: string, language: SavedScript['language']): string {
  return join(getScriptsDir(), `${id}${getExtension(language)}`);
}

// ---------------------------------------------------------------------------
// Index helpers (read / write metadata only)
// ---------------------------------------------------------------------------

function ensureScriptsDirExists(): void {
  const dir = getScriptsDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readIndex(): ScriptMeta[] {
  const indexPath = getIndexPath();
  if (!existsSync(indexPath)) {
    return [];
  }
  try {
    const raw = readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as ScriptMeta[];
  } catch {
    // Corrupt index — start fresh rather than crashing
    return [];
  }
}

function writeIndex(metas: ScriptMeta[]): void {
  ensureScriptsDirExists();
  writeFileSync(getIndexPath(), JSON.stringify(metas, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List all saved scripts, including their source code read from disk.
 * Returns an empty array if the store has never been written.
 */
export function listScripts(): SavedScript[] {
  const metas = readIndex();
  return metas.map((meta) => loadScriptWithCode(meta));
}

/**
 * Find a script by query string.
 *
 * Matching priority:
 *   1. Exact triggerPattern regex match against the query.
 *   2. Fuzzy score across name + description + tags (best match above threshold).
 *
 * Returns null if nothing matches well enough.
 */
export function findScript(query: string): SavedScript | null {
  const metas = readIndex();
  if (metas.length === 0) return null;

  const normalizedQuery = query.toLowerCase();

  // --- Phase 1: regex trigger patterns ---
  for (const meta of metas) {
    for (const pattern of meta.triggerPatterns) {
      try {
        const re = new RegExp(pattern, 'i');
        if (re.test(query)) {
          return loadScriptWithCode(meta);
        }
      } catch {
        // Malformed regex in the store — skip silently
      }
    }
  }

  // --- Phase 2: fuzzy match on name / description / tags ---
  const FUZZY_THRESHOLD = 0.2; // 0–1, higher = stricter

  let bestMeta: ScriptMeta | null = null;
  let bestScore = -1;

  for (const meta of metas) {
    const score = fuzzyScore(normalizedQuery, meta);
    if (score > bestScore) {
      bestScore = score;
      bestMeta = meta;
    }
  }

  if (bestMeta !== null && bestScore >= FUZZY_THRESHOLD) {
    return loadScriptWithCode(bestMeta);
  }

  return null;
}

/**
 * Save a new script.  Generates a unique ID from the script name.
 * Returns the full SavedScript including the generated id and timestamps.
 */
export function saveScript(
  script: Omit<SavedScript, 'id' | 'createdAt' | 'lastUsedAt' | 'usageCount'>,
): SavedScript {
  ensureScriptsDirExists();

  const metas = readIndex();
  const existingIds = new Set(metas.map((m) => m.id));

  const id = generateUniqueId(script.name, existingIds);
  const now = new Date().toISOString();

  const newMeta: ScriptMeta = {
    id,
    name: script.name,
    description: script.description,
    language: script.language,
    createdAt: now,
    lastUsedAt: now,
    usageCount: 0,
    tags: script.tags,
    triggerPatterns: script.triggerPatterns,
  };

  // Persist the script source file
  const filePath = getScriptFilePath(id, script.language);
  writeFileSync(filePath, script.code, 'utf-8');

  // Append to index
  metas.push(newMeta);
  writeIndex(metas);

  return { ...newMeta, code: script.code };
}

/**
 * Execute a saved script by id.
 * The script is called with the optional args array appended to the invocation.
 * cwd is set to the user's home directory.
 * Hard timeout: 30 seconds.
 */
export function executeScript(
  id: string,
  args: string[] = [],
): Promise<ExecuteResult> {
  const TIMEOUT_MS = 30_000;

  const metas = readIndex();
  const meta = metas.find((m) => m.id === id);
  if (!meta) {
    return Promise.reject(new Error(`Script "${id}" not found in store`));
  }

  const filePath = getScriptFilePath(id, meta.language);
  if (!existsSync(filePath)) {
    return Promise.reject(new Error(`Script file missing: ${filePath}`));
  }

  const { cmd, cmdArgs } = resolveInterpreter(meta.language, filePath, args);

  return new Promise<ExecuteResult>((resolve, reject) => {
    execFile(
      cmd,
      cmdArgs,
      {
        cwd: homedir(),
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024, // 10 MB
        encoding: 'utf-8',
        env: {
          ...process.env,
          // Prevent interactive prompts
          PYTHONDONTWRITEBYTECODE: '1',
          CI: '1',
        },
      },
      (err: ExecFileException | null, stdout, stderr) => {
        if (err !== null && !isExitCodeError(err)) {
          // Genuine spawn / timeout error (ENOENT, ETIMEDOUT, etc.) — reject
          reject(err);
          return;
        }

        const exitCode = getExitCode(err);
        resolve({
          stdout: typeof stdout === 'string' ? stdout : '',
          stderr: typeof stderr === 'string' ? stderr : '',
          exitCode,
        });
      },
    );
  });
}

/**
 * Delete a saved script (metadata + source file).
 * Returns true if the script was found and removed, false if it did not exist.
 */
export function deleteScript(id: string): boolean {
  const metas = readIndex();
  const idx = metas.findIndex((m) => m.id === id);
  if (idx === -1) return false;

  const meta = metas[idx];
  if (meta === undefined) return false;

  // Remove source file (best-effort — do not throw if already gone)
  const filePath = getScriptFilePath(id, meta.language);
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch {
      // Ignore — file may have been removed externally
    }
  }

  metas.splice(idx, 1);
  writeIndex(metas);
  return true;
}

/**
 * Bump usageCount and update lastUsedAt for a script.
 * Silently does nothing if the id is not found.
 */
export function updateUsage(id: string): void {
  const metas = readIndex();
  const meta = metas.find((m) => m.id === id);
  if (meta === undefined) return;

  meta.usageCount += 1;
  meta.lastUsedAt = new Date().toISOString();
  writeIndex(metas);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Load a script meta record plus its code from disk. */
function loadScriptWithCode(meta: ScriptMeta): SavedScript {
  const filePath = getScriptFilePath(meta.id, meta.language);
  let code = '';
  try {
    if (existsSync(filePath)) {
      code = readFileSync(filePath, 'utf-8');
    }
  } catch {
    // Missing file is non-fatal — caller can decide what to do
  }
  return { ...meta, code };
}

/**
 * Slugify a name and ensure uniqueness within the existing set.
 * Example: "Find Large Files" → "find-large-files"
 *          (if taken) → "find-large-files-2", "find-large-files-3", ...
 */
function generateUniqueId(name: string, existingIds: Set<string>): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric runs with dash
    .replace(/^-+|-+$/g, '')      // trim leading/trailing dashes
    .slice(0, 60);                // max length

  const slug = base.length > 0 ? base : 'script';

  if (!existingIds.has(slug)) {
    return slug;
  }

  // Collision: append a numeric suffix
  for (let i = 2; i <= 9999; i++) {
    const candidate = `${slug}-${i}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  // Extremely unlikely — fall back to timestamp suffix
  return `${slug}-${Date.now()}`;
}

/**
 * Determine the interpreter command and argument list for a given language.
 *
 * On Windows we probe for `python` synchronously to detect the real interpreter
 * vs. the Microsoft Store stub (which prints nothing and exits with code 9009).
 */
function resolveInterpreter(
  language: SavedScript['language'],
  filePath: string,
  extraArgs: string[],
): { cmd: string; cmdArgs: string[] } {
  const isWindows = platform() === 'win32';

  switch (language) {
    case 'python': {
      const pythonCmd = resolvePythonCmd(isWindows);
      return { cmd: pythonCmd, cmdArgs: [filePath, ...extraArgs] };
    }

    case 'bash': {
      // On Windows, prefer Git-Bash's sh; otherwise use bash.
      const bashCmd = isWindows ? 'sh' : 'bash';
      return { cmd: bashCmd, cmdArgs: [filePath, ...extraArgs] };
    }

    case 'powershell': {
      // pwsh (PowerShell 7+) is cross-platform; older Windows only has powershell.exe.
      return {
        cmd: 'pwsh',
        cmdArgs: ['-NonInteractive', '-NoProfile', '-File', filePath, ...extraArgs],
      };
    }

    case 'node': {
      return { cmd: 'node', cmdArgs: [filePath, ...extraArgs] };
    }
  }
}

/**
 * Resolve the correct Python executable name.
 *
 * On Windows:
 *   - Probe `python --version` synchronously (3-second timeout).
 *   - If it prints "Python X.Y.Z" the real interpreter is present → use `python`.
 *   - If it fails or produces no output (Microsoft Store stub) → fall back to `python3`.
 *
 * On non-Windows:
 *   - Use `python3` (standard on modern Linux/macOS).
 */
function resolvePythonCmd(isWindows: boolean): string {
  if (!isWindows) {
    return 'python3';
  }

  try {
    const out = execFileSync('python', ['--version'], {
      encoding: 'utf-8',
      timeout: 3_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // A real CPython prints "Python 3.x.y" (or "Python 2.x.y")
    if (typeof out === 'string' && /^Python \d/i.test(out.trim())) {
      return 'python';
    }
  } catch {
    // `python` not found or returned a non-zero exit — fall through
  }

  return 'python3';
}

/**
 * Return true if the error was produced by a non-zero exit code (expected path),
 * rather than a spawn-level error like ENOENT or ETIMEDOUT.
 *
 * execFile sets `error.code` to a number for exit-code errors and to a string
 * (e.g. 'ENOENT') for spawn errors.  `ExecFileException.code` is typed as
 * `string | number | null | undefined` — we specifically check for `number`.
 */
function isExitCodeError(error: ExecFileException): boolean {
  return typeof error.code === 'number';
}

/** Extract the numeric exit code from an execFile error, or return 1 as fallback. */
function getExitCode(error: ExecFileException | null): number {
  if (error === null) return 0;
  if (typeof error.code === 'number') return error.code;
  return 1;
}

/**
 * Simple token-overlap fuzzy score between a query string and a script record.
 * Returns a value in [0, 1].
 *
 * Algorithm:
 *   - Tokenize the query and the combined searchable text of the script.
 *   - score = matched_tokens / total_query_tokens
 *   - 1.5× bonus when the full query appears as a substring in the name.
 */
function fuzzyScore(normalizedQuery: string, meta: ScriptMeta): number {
  const queryTokens = tokenize(normalizedQuery);
  if (queryTokens.length === 0) return 0;

  const corpus = [
    meta.name.toLowerCase(),
    meta.description.toLowerCase(),
    ...meta.tags.map((t) => t.toLowerCase()),
  ].join(' ');

  const corpusTokens = new Set(tokenize(corpus));

  let matched = 0;
  for (const token of queryTokens) {
    if (corpusTokens.has(token)) {
      matched++;
    }
  }

  let score = matched / queryTokens.length;

  // Bonus: full query is a substring of the script name
  if (meta.name.toLowerCase().includes(normalizedQuery)) {
    score = Math.min(1, score * 1.5);
  }

  return score;
}

/** Split text into lowercase word tokens, discarding very short noise words. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/\\.,;:!?()[\]{}]+/)
    .filter((t) => t.length >= 2);
}
