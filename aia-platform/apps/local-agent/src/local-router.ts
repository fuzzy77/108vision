/**
 * Local Intent Router — Detect and execute queries that can be answered
 * locally without calling the LLM, saving tokens and latency.
 *
 * Each category uses regex + keyword pattern matching (NOT an LLM).
 * Patterns work in both Italian and English.
 *
 * If the intent is ambiguous or execution fails, returns null so the
 * caller falls through to the LLM pipeline.
 *
 * Categories handled:
 *   1. File Operations  — read, write, list, copy, move, delete, mkdir
 *   2. Git Operations   — status, log, diff, branch
 *   3. System Info      — time/date, disk space, memory/CPU, processes
 *   4. Search / Grep    — grep file contents
 *   5. Calculations     — arithmetic expressions, date arithmetic
 *   6. File Format      — JSON↔YAML, CSV→JSON conversions
 */

import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { AgentConfig } from './config.js';
import { validatePath } from './security.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LocalResult = {
  content: string;
  source: 'local';
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Try to answer a query locally without calling the LLM.
 *
 * @returns A LocalResult if the query was handled, or null if the LLM is needed.
 */
export async function tryLocalExecution(
  query: string,
  config: AgentConfig,
): Promise<LocalResult | null> {
  const q = query.trim();
  if (!q) return null;

  // Try each category in priority order.
  // Each handler returns LocalResult | null.
  return (
    tryFileOperation(q, config) ??
    tryGitOperation(q, config) ??
    trySystemInfo(q) ??
    tryGrep(q, config) ??
    tryCalculation(q) ??
    tryFormatConversion(q, config) ??
    null
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function local(content: string): LocalResult {
  return { content, source: 'local' };
}

/** Run a shell command with a 10-second timeout and return trimmed stdout. */
function shell(cmd: string): string {
  return execSync(cmd, { timeout: 10_000, encoding: 'utf-8' }).trim();
}

/**
 * Extract the first path-like token from a query string.
 * Accepts quoted paths (single or double), or bare tokens containing / or \.
 * Returns null if nothing convincing is found.
 */
function extractPath(q: string): string | null {
  // Quoted path — highest confidence
  const quoted = q.match(/["']([^"']+)["']/);
  if (quoted?.[1]) return quoted[1];

  // Token that looks like a path (contains separator or extension)
  const tokens = q.split(/\s+/);
  for (const token of tokens) {
    if (token.includes('/') || token.includes('\\') || /\.\w{2,5}$/.test(token)) {
      return token;
    }
  }

  return null;
}

/**
 * Extract two path-like tokens (source + destination) from a query.
 * Used for copy / move / rename.
 */
function extractTwoPaths(q: string): [string, string] | null {
  // Quoted forms: "src" in/to/in "dst"  or  src dest
  const twoQuoted = q.match(/["']([^"']+)["']\s+(?:in|a|verso|to|come|->)\s+["']([^"']+)["']/i);
  if (twoQuoted?.[1] && twoQuoted?.[2]) return [twoQuoted[1], twoQuoted[2]];

  // Two path-like bare tokens
  const tokens = q.split(/\s+/).filter(
    (t) => t.includes('/') || t.includes('\\') || /\.\w{2,5}$/.test(t),
  );
  if (tokens.length >= 2 && tokens[0] && tokens[1]) return [tokens[0], tokens[1]];

  return null;
}

// ---------------------------------------------------------------------------
// Category 1 — File Operations
// ---------------------------------------------------------------------------

// Patterns ordered from most-specific to least-specific within each action.
const FILE_PATTERNS = {
  write: [
    /\b(crea|crea il file|create file|scrivi|write|crea file)\b/i,
  ],
  read: [
    /\b(leggi(?: il)? file|read file|mostrami|mostra(?: il)? file|apri(?: il)? file|visualizza(?: il)? file|show file|open file|cat )\b/i,
    /\b(leggi|mostra|apri|read|show|open)\b.*\.\w{2,5}/i,
  ],
  list: [
    /\b(lista(?: i)? file(?: in)?|elenca(?: i)? file|ls\b|dir\b|list files?|lista cartella|cosa c['’][\xE8e] in|list directory|ls )\b/i,
  ],
  copy: [
    /\b(copia|copy)\b.*\b(in|to|verso|a)\b/i,
  ],
  move: [
    /\b(sposta|muovi|move|rinomina|rename)\b.*\b(in|to|verso|a|come)\b/i,
  ],
  delete: [
    /\b(elimina(?: il)? file|cancella(?: il)? file|rimuovi(?: il)? file|delete file|remove file|unlink)\b/i,
    /\b(elimina|cancella|delete)\b.*\.\w{2,5}/i,
  ],
  mkdir: [
    /\b(crea(?: la)? cartella|crea(?: la)? directory|mkdir\b|make dir(?:ectory)?|nuova cartella)\b/i,
  ],
};

function tryFileOperation(q: string, config: AgentConfig): LocalResult | null {
  // --- write ---
  if (FILE_PATTERNS.write.some((r) => r.test(q))) {
    const filePath = extractPath(q);
    if (!filePath) return null;

    // Extract content after "con contenuto", "with content", "containing", ":"
    const contentMatch = q.match(
      /(?:con contenuto|with content|containing|contenuto:|content:)\s*([\s\S]+)/i,
    );
    const content = contentMatch?.[1]?.trim() ?? '';

    const validated = validatePath(filePath, config.allowedDirectories);
    if (!validated) return null;

    try {
      const dir = path.dirname(validated);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(validated, content, 'utf-8');
      const size = fs.statSync(validated).size;
      return local(`File creato: ${validated} (${size} byte)`);
    } catch {
      return null;
    }
  }

  // --- read ---
  if (FILE_PATTERNS.read.some((r) => r.test(q))) {
    const filePath = extractPath(q);
    if (!filePath) return null;

    const validated = validatePath(filePath, config.allowedDirectories);
    if (!validated) return null;

    try {
      if (!fs.existsSync(validated)) return null;
      const stats = fs.statSync(validated);
      if (stats.isDirectory()) return null;
      const MAX_READ = 100 * 1024; // 100 KB
      if (stats.size > MAX_READ) {
        return local(
          `File troppo grande per la lettura locale (${stats.size} byte). Usa un editor o chiedi all'AI di analizzarlo in modo selettivo.`,
        );
      }
      const content = fs.readFileSync(validated, 'utf-8');
      return local(content);
    } catch {
      return null;
    }
  }

  // --- list ---
  if (FILE_PATTERNS.list.some((r) => r.test(q))) {
    // Prefer an explicit path; fall back to first allowed directory
    const rawPath = extractPath(q) ?? config.allowedDirectories[0];
    if (!rawPath) return null;

    const validated = validatePath(rawPath, config.allowedDirectories);
    if (!validated) return null;

    try {
      if (!fs.existsSync(validated)) return null;
      const stats = fs.statSync(validated);
      if (!stats.isDirectory()) return null;

      const entries = fs.readdirSync(validated, { withFileTypes: true });
      const lines = entries
        .filter((e) => !e.name.startsWith('.'))
        .sort((a, b) => {
          if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map((e) => {
          const icon = e.isDirectory() ? '[DIR]' : '[FILE]';
          let extra = '';
          if (e.isFile()) {
            try {
              const s = fs.statSync(path.join(validated, e.name));
              extra = ` (${formatBytes(s.size)})`;
            } catch { /* skip */ }
          }
          return `  ${icon} ${e.name}${extra}`;
        });

      const summary = `Contenuto di ${validated} — ${lines.length} elementi:\n\n${lines.join('\n')}`;
      return local(summary);
    } catch {
      return null;
    }
  }

  // --- copy ---
  if (FILE_PATTERNS.copy.some((r) => r.test(q))) {
    const paths = extractTwoPaths(q);
    if (!paths) return null;
    const [src, dst] = paths;

    const validSrc = validatePath(src, config.allowedDirectories);
    const validDst = validatePath(dst, config.allowedDirectories);
    if (!validSrc || !validDst) return null;

    try {
      if (!fs.existsSync(validSrc)) return null;
      const destDir = path.dirname(validDst);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(validSrc, validDst);
      return local(`File copiato: ${validSrc} → ${validDst}`);
    } catch {
      return null;
    }
  }

  // --- move / rename ---
  if (FILE_PATTERNS.move.some((r) => r.test(q))) {
    const paths = extractTwoPaths(q);
    if (!paths) return null;
    const [src, dst] = paths;

    const validSrc = validatePath(src, config.allowedDirectories);
    const validDst = validatePath(dst, config.allowedDirectories);
    if (!validSrc || !validDst) return null;

    try {
      if (!fs.existsSync(validSrc)) return null;
      const destDir = path.dirname(validDst);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.renameSync(validSrc, validDst);
      return local(`File spostato/rinominato: ${validSrc} → ${validDst}`);
    } catch {
      return null;
    }
  }

  // --- delete ---
  if (FILE_PATTERNS.delete.some((r) => r.test(q))) {
    const filePath = extractPath(q);
    if (!filePath) return null;

    const validated = validatePath(filePath, config.allowedDirectories);
    if (!validated) return null;

    try {
      if (!fs.existsSync(validated)) return null;
      const stats = fs.statSync(validated);
      if (stats.isDirectory()) {
        // Refuse to delete directories locally for safety
        return local(
          `Non elimino directory localmente per sicurezza. Usa il terminale: rm -rf "${validated}"`,
        );
      }
      fs.unlinkSync(validated);
      return local(
        `File eliminato: ${validated}\n\nNota: l'operazione non è reversibile. Assicurati di avere un backup se necessario.`,
      );
    } catch {
      return null;
    }
  }

  // --- mkdir ---
  if (FILE_PATTERNS.mkdir.some((r) => r.test(q))) {
    const dirPath = extractPath(q);
    if (!dirPath) return null;

    const validated = validatePath(dirPath, config.allowedDirectories);
    if (!validated) return null;

    try {
      fs.mkdirSync(validated, { recursive: true });
      return local(`Cartella creata: ${validated}`);
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Category 2 — Git Operations
// ---------------------------------------------------------------------------

const GIT_PATTERNS = {
  status: /\b(git status|stato del repo|stato repo|cosa ho modificato|modifiche in sospeso|file modificati|what('s| is) (modified|changed)|uncommitted)\b/i,
  log:    /\b(git log|ultimi commit|storia commit|commit recenti|last commits?|commit history|recent commits?)\b/i,
  diff:   /\b(git diff|le modifiche|i cambiamenti|cosa e'? cambiato|what changed|show diff|diff --stat)\b/i,
  branch: /\b(git branch|su quale branch|che branch|current branch|quale branch sono|which branch)\b/i,
};

function tryGitOperation(q: string, config: AgentConfig): LocalResult | null {
  // Use first allowed directory as cwd for git operations; fall back to cwd
  const cwd = config.allowedDirectories[0] ?? process.cwd();

  if (GIT_PATTERNS.status.test(q)) {
    try {
      const out = shell(`git -C "${cwd}" status`);
      return local(out || 'Nessuna modifica rilevata.');
    } catch {
      return null;
    }
  }

  if (GIT_PATTERNS.log.test(q)) {
    try {
      const out = shell(`git -C "${cwd}" log --oneline -10`);
      return local(out || 'Nessun commit trovato.');
    } catch {
      return null;
    }
  }

  if (GIT_PATTERNS.diff.test(q)) {
    try {
      const out = shell(`git -C "${cwd}" diff --stat`);
      return local(out || 'Nessuna differenza rilevata (working tree pulito).');
    } catch {
      return null;
    }
  }

  if (GIT_PATTERNS.branch.test(q)) {
    try {
      const out = shell(`git -C "${cwd}" branch --show-current`);
      return local(out ? `Branch corrente: ${out}` : 'Impossibile determinare il branch corrente.');
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Category 3 — System Info
// ---------------------------------------------------------------------------

const SYS_PATTERNS = {
  datetime:  /\b(che ore sono|ora|orario|data(?: di oggi)?|oggi(?:\s+che giorno)?|giorno|what time|current time|current date|today)\b/i,
  disk:      /\b(spazio disco|spazio(?: su)? disco|disk space|storage|spazio libero|free space|quanto spazio)\b/i,
  memory:    /\b(ram|memoria|memory|quanta ram|quanta memoria|memori[ae] disponibil[ie])\b/i,
  cpu:       /\b(cpu|processore|processor|core[s]?|quanti core|velocita'?(?: del)? processore)\b/i,
  processes: /\b(processi|cosa gira|processi(?: in)? esecuzione|process(?:es)?|running processes?|tasklist|ps aux|cosa sta girando)\b/i,
};

function trySystemInfo(q: string): LocalResult | null {
  if (SYS_PATTERNS.datetime.test(q)) {
    const now = new Date();
    return local(
      `Data e ora: ${now.toLocaleString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`,
    );
  }

  if (SYS_PATTERNS.disk.test(q)) {
    try {
      const cmd =
        os.platform() === 'win32'
          ? 'wmic logicaldisk get caption,freespace,size /format:list'
          : 'df -h';
      const out = shell(cmd);
      return local(`Spazio disco:\n\n${out}`);
    } catch {
      // Fallback: statfsSync on home dir
      try {
        const stats = fs.statfsSync(os.homedir());
        const totalGb = (stats.bsize * stats.blocks) / 1e9;
        const freeGb = (stats.bsize * stats.bavail) / 1e9;
        const usedPct = Math.round((1 - stats.bavail / stats.blocks) * 100);
        return local(
          `Spazio disco (home):\n  Totale: ${totalGb.toFixed(1)} GB\n  Libero: ${freeGb.toFixed(1)} GB\n  Usato: ${usedPct}%`,
        );
      } catch {
        return null;
      }
    }
  }

  if (SYS_PATTERNS.memory.test(q) || SYS_PATTERNS.cpu.test(q)) {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedPct = Math.round((usedMem / totalMem) * 100);
    const cpuInfo = os.cpus();
    const cpuModel = cpuInfo[0]?.model ?? 'N/A';
    const cpuCores = cpuInfo.length;

    return local(
      [
        `Memoria RAM:`,
        `  Totale: ${formatBytes(totalMem)}`,
        `  Usata:  ${formatBytes(usedMem)} (${usedPct}%)`,
        `  Libera: ${formatBytes(freeMem)}`,
        ``,
        `CPU:`,
        `  Modello: ${cpuModel}`,
        `  Core:    ${cpuCores}`,
      ].join('\n'),
    );
  }

  if (SYS_PATTERNS.processes.test(q)) {
    try {
      const cmd =
        os.platform() === 'win32' ? 'tasklist /fo table /nh' : 'ps aux --sort=-%cpu | head -20';
      const out = shell(cmd);
      return local(`Processi in esecuzione:\n\n${out}`);
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Category 4 — Search / Grep
// ---------------------------------------------------------------------------

// Matches: "cerca X in Y", "grep X in Y", "trova X in Y", "find X in Y"
const GREP_PATTERN =
  /\b(?:cerca|grep|trova|find|search for|look for)\s+["']?(.+?)["']?\s+(?:in|dentro|inside|nel(?:la)?(?: cartella)?|in the directory)\s+["']?(.+?)["']?\s*$/i;

function tryGrep(q: string, config: AgentConfig): LocalResult | null {
  const match = q.match(GREP_PATTERN);
  if (!match?.[1] || !match?.[2]) return null;

  const pattern = match[1].trim();
  const dirRaw = match[2].trim();

  if (!pattern || !dirRaw) return null;

  const validated = validatePath(dirRaw, config.allowedDirectories);
  if (!validated) return null;

  try {
    if (!fs.existsSync(validated)) return null;

    // Use grep/findstr directly — fast native implementation
    let cmd: string;
    if (os.platform() === 'win32') {
      cmd = `findstr /s /i /n "${escapeShellArg(pattern)}" "${validated}\\*"`;
    } else {
      cmd = `grep -rn --include="*" -i "${escapeShellArg(pattern)}" "${validated}" 2>/dev/null | head -50`;
    }

    const out = shell(cmd);
    return local(
      out
        ? `Risultati per "${pattern}" in ${validated}:\n\n${out}`
        : `Nessun risultato per "${pattern}" in ${validated}.`,
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Category 5 — Calculations & Date Arithmetic
// ---------------------------------------------------------------------------

// Detects: optional leading whitespace, numbers + operators (including parens)
const MATH_PATTERN = /^[\d\s+\-*/().^%,]+$/;

// Detects date offset queries like "tra 30 giorni", "in 30 days", "30 days ago", "30 giorni fa"
const DATE_OFFSET_PATTERN =
  /\b(?:tra|in|fra)\s+(\d+)\s*(giorni?|settimane?|mesi?|anni?|days?|weeks?|months?|years?)\b|\b(\d+)\s*(giorni?|settimane?|mesi?|anni?|days?|weeks?|months?|years?)\s+(?:fa|ago)\b/i;

function tryCalculation(q: string): LocalResult | null {
  const trimmed = q.trim();

  // --- Date offset ---
  const dateMatch = trimmed.match(DATE_OFFSET_PATTERN);
  if (dateMatch) {
    const amount = parseInt(dateMatch[1] ?? dateMatch[3] ?? '0', 10);
    const unit = (dateMatch[2] ?? dateMatch[4] ?? '').toLowerCase();
    const isPast = /\b(fa|ago)\b/i.test(trimmed);

    const date = new Date();
    const multiplier = isPast ? -1 : 1;

    if (/giorn|day/i.test(unit)) {
      date.setDate(date.getDate() + multiplier * amount);
    } else if (/settiman|week/i.test(unit)) {
      date.setDate(date.getDate() + multiplier * amount * 7);
    } else if (/mes|month/i.test(unit)) {
      date.setMonth(date.getMonth() + multiplier * amount);
    } else if (/ann|year/i.test(unit)) {
      date.setFullYear(date.getFullYear() + multiplier * amount);
    } else {
      return null;
    }

    const formatted = date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return local(`${isPast ? amount + ' ' + unit + ' fa' : 'Tra ' + amount + ' ' + unit}: ${formatted}`);
  }

  // --- Simple arithmetic ---
  // Only handle queries that look like pure math expressions, not sentences
  // containing numbers (e.g. "leggi il file fattura123.pdf" should not trigger)
  if (MATH_PATTERN.test(trimmed) && /\d/.test(trimmed) && /[+\-*/]/.test(trimmed)) {
    try {
      // Safe eval via Function — avoids arbitrary code execution by restricting
      // the expression to the characters matched by MATH_PATTERN
      const safeExpr = trimmed.replace(/\^/g, '**').replace(/,/g, '.');
      // eslint-disable-next-line no-new-func
      const result = new Function(`"use strict"; return (${safeExpr});`)() as unknown;
      if (typeof result !== 'number' || !isFinite(result)) return null;
      return local(`= ${result}`);
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Category 6 — File Format Conversions
// ---------------------------------------------------------------------------

const FORMAT_PATTERNS = {
  jsonToYaml: /\b(?:converti|convert|trasforma)\s+["']?(\S+\.json)["']?\s+(?:in|to|a)\s+(?:yaml|yml)\b/i,
  yamlToJson: /\b(?:converti|convert|trasforma)\s+["']?(\S+\.ya?ml)["']?\s+(?:in|to|a)\s+json\b/i,
  csvToJson:  /\b(?:converti|convert|trasforma)\s+["']?(\S+\.csv)["']?\s+(?:in|to|a)\s+json\b/i,
};

function tryFormatConversion(q: string, config: AgentConfig): LocalResult | null {
  // JSON → YAML
  const j2y = q.match(FORMAT_PATTERNS.jsonToYaml);
  if (j2y?.[1]) {
    const srcPath = j2y[1];
    const validated = validatePath(srcPath, config.allowedDirectories);
    if (!validated) return null;

    try {
      const raw = fs.readFileSync(validated, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      const yaml = jsonToYaml(parsed, 0);
      const dstPath = validated.replace(/\.json$/i, '.yaml');
      fs.writeFileSync(dstPath, yaml, 'utf-8');
      return local(`Convertito JSON → YAML: ${dstPath}\n\n${yaml.slice(0, 2000)}${yaml.length > 2000 ? '\n... [troncato]' : ''}`);
    } catch {
      return null;
    }
  }

  // YAML → JSON
  const y2j = q.match(FORMAT_PATTERNS.yamlToJson);
  if (y2j?.[1]) {
    const srcPath = y2j[1];
    const validated = validatePath(srcPath, config.allowedDirectories);
    if (!validated) return null;

    try {
      const raw = fs.readFileSync(validated, 'utf-8');
      const parsed = parseYaml(raw);
      const json = JSON.stringify(parsed, null, 2);
      const dstPath = validated.replace(/\.ya?ml$/i, '.json');
      fs.writeFileSync(dstPath, json, 'utf-8');
      return local(`Convertito YAML → JSON: ${dstPath}\n\n${json.slice(0, 2000)}${json.length > 2000 ? '\n... [troncato]' : ''}`);
    } catch {
      return null;
    }
  }

  // CSV → JSON
  const c2j = q.match(FORMAT_PATTERNS.csvToJson);
  if (c2j?.[1]) {
    const srcPath = c2j[1];
    const validated = validatePath(srcPath, config.allowedDirectories);
    if (!validated) return null;

    try {
      const raw = fs.readFileSync(validated, 'utf-8');
      const parsed = parseCsv(raw);
      const json = JSON.stringify(parsed, null, 2);
      const dstPath = validated.replace(/\.csv$/i, '.json');
      fs.writeFileSync(dstPath, json, 'utf-8');
      return local(`Convertito CSV → JSON: ${dstPath}\n\n${json.slice(0, 2000)}${json.length > 2000 ? '\n... [troncato]' : ''}`);
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Minimal YAML serializer (no external deps)
// ---------------------------------------------------------------------------

function jsonToYaml(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);

  if (typeof value === 'string') {
    // Multiline string
    if (value.includes('\n')) return `|\n${value.split('\n').map((l) => `${pad}  ${l}`).join('\n')}`;
    // Strings needing quotes: empty, start with special chars, or contain : #
    if (
      value === '' ||
      /^[:\-#\[\]{}&*!|>'"%@`]/.test(value) ||
      /[:#]/.test(value) ||
      /^\s|\s$/.test(value)
    ) {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((item) => `${pad}- ${jsonToYaml(item, indent + 1).trimStart()}`)
      .join('\n');
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return keys
      .map((k) => {
        const v = obj[k];
        const valStr = jsonToYaml(v, indent + 1);
        // Scalar → same line; complex → next line indented
        if (typeof v === 'object' && v !== null) {
          return `${pad}${k}:\n${valStr}`;
        }
        return `${pad}${k}: ${valStr}`;
      })
      .join('\n');
  }

  return String(value);
}

// ---------------------------------------------------------------------------
// Minimal YAML parser — supports key: value, lists, strings, numbers, booleans
// Intentionally limited; falls back via exception for complex YAML.
// ---------------------------------------------------------------------------

// TypeScript requires an interface (not a type alias) for recursive types.
interface YamlObject extends Record<string, YamlValue> {}
interface YamlArray extends Array<YamlValue> {}
type YamlValue = string | number | boolean | null | YamlArray | YamlObject;

function parseYaml(text: string): Record<string, YamlValue> {
  const lines = text.split('\n');
  const root: Record<string, YamlValue> = {};
  const stack: Array<{ obj: Record<string, YamlValue> | YamlValue[]; indent: number; key?: string }> = [
    { obj: root, indent: -1 },
  ];

  for (const rawLine of lines) {
    if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) continue;

    const indent = rawLine.search(/\S/);
    const line = rawLine.trim();

    // List item
    if (line.startsWith('- ')) {
      const val = parseYamlScalar(line.slice(2).trim());
      // Find current array context
      const top = stack[stack.length - 1];
      if (top && Array.isArray(top.obj)) {
        top.obj.push(val);
      }
      continue;
    }

    // Key: value
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    // Pop stack to correct indent level
    while (stack.length > 1) {
      const top = stack[stack.length - 1];
      if (top && top.indent >= indent) {
        stack.pop();
      } else {
        break;
      }
    }

    const parent = stack[stack.length - 1];
    if (!parent || Array.isArray(parent.obj)) continue;

    if (rest === '' || rest === '~') {
      // Next lines will be child
      parent.obj[key] = {};
      stack.push({ obj: parent.obj[key] as Record<string, YamlValue>, indent, key });
    } else if (rest === '[]') {
      parent.obj[key] = [];
      stack.push({ obj: parent.obj[key] as YamlValue[], indent, key });
    } else {
      parent.obj[key] = parseYamlScalar(rest);
    }
  }

  return root;
}

function parseYamlScalar(s: string): YamlValue {
  if (s === 'true' || s === 'yes') return true;
  if (s === 'false' || s === 'no') return false;
  if (s === 'null' || s === '~' || s === '') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  // Unquote
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Minimal CSV parser
// ---------------------------------------------------------------------------

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  const separator = detectCsvSeparator(lines[0] ?? '');
  const headers = parseCsvLine(lines[0] ?? '', separator);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i] ?? '', separator);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j] ?? `col${j}`;
      row[header] = values[j] ?? '';
    }
    result.push(row);
  }

  return result;
}

function detectCsvSeparator(line: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  for (const ch of line) {
    if (ch in counts) counts[ch]!++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',';
}

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function escapeShellArg(s: string): string {
  // Escape double quotes for use inside a double-quoted shell argument
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
