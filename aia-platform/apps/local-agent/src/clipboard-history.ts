/**
 * Clipboard History — Tracks clipboard changes over time.
 *
 * Polls the clipboard every 2 seconds and stores unique entries.
 * Provides search, pin, and recall by index.
 *
 * Storage: ~/.108ai/clipboard-history.json (last 50 entries)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClipboardEntry {
  content: string;
  timestamp: number;
  source: string;
  pinned: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 50;
const POLL_INTERVAL_MS = 2000;
const MAX_ENTRY_LENGTH = 50_000;
const HISTORY_FILE = join(homedir(), '.108ai', 'clipboard-history.json');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let history: ClipboardEntry[] = [];
let lastContent = '';
let pollTimer: ReturnType<typeof setInterval> | null = null;
let clipboardModule: typeof import('clipboardy') | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initClipboardHistory(): void {
  loadFromDisk();
  startPolling();
}

export function stopClipboardHistory(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  saveToDisk();
}

export function getHistory(limit?: number): ClipboardEntry[] {
  const entries = history.slice(-(limit ?? MAX_ENTRIES));
  return entries.reverse(); // newest first
}

export function searchHistory(query: string): ClipboardEntry[] {
  const lower = query.toLowerCase();
  return history
    .filter(e => e.content.toLowerCase().includes(lower))
    .reverse();
}

export function getEntry(index: number): ClipboardEntry | null {
  const reversed = [...history].reverse();
  return reversed[index] ?? null;
}

export function pinEntry(index: number): boolean {
  const reversed = [...history].reverse();
  const entry = reversed[index];
  if (!entry) return false;
  entry.pinned = !entry.pinned;
  saveToDisk();
  return true;
}

export function clearHistory(): void {
  history = history.filter(e => e.pinned);
  saveToDisk();
}

export function getStats(): { total: number; pinned: number; oldest: number | null } {
  return {
    total: history.length,
    pinned: history.filter(e => e.pinned).length,
    oldest: history[0]?.timestamp ?? null,
  };
}

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

async function startPolling(): Promise<void> {
  try {
    clipboardModule = await import('clipboardy');
    // Read initial content
    lastContent = await clipboardModule.default.read();
  } catch {
    // Clipboard not available (headless) — skip polling
    return;
  }

  pollTimer = setInterval(async () => {
    try {
      if (!clipboardModule) return;
      const current = await clipboardModule.default.read();

      if (current && current !== lastContent && current.length <= MAX_ENTRY_LENGTH) {
        lastContent = current;
        addEntry(current);
      }
    } catch {
      // Ignore polling errors
    }
  }, POLL_INTERVAL_MS);
}

function addEntry(content: string): void {
  // Don't add duplicates of the last entry
  const last = history[history.length - 1];
  if (last && last.content === content) return;

  history.push({
    content,
    timestamp: Date.now(),
    source: 'clipboard',
    pinned: false,
  });

  // Trim non-pinned entries if over limit
  while (history.length > MAX_ENTRIES) {
    const firstNonPinned = history.findIndex(e => !e.pinned);
    if (firstNonPinned === -1) break;
    history.splice(firstNonPinned, 1);
  }

  saveToDisk();
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadFromDisk(): void {
  try {
    if (existsSync(HISTORY_FILE)) {
      const raw = readFileSync(HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        history = parsed;
      }
    }
  } catch {
    history = [];
  }
}

function saveToDisk(): void {
  try {
    const dir = join(homedir(), '.108ai');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(HISTORY_FILE, JSON.stringify(history), 'utf-8');
  } catch {
    // Non-critical
  }
}
