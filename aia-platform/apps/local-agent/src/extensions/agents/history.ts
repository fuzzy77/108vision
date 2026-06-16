import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { AGENTS_DIR } from '../paths.js';
import type { PersonaHistoryMessage } from '../types.js';

const ACTIVE_AGENT_FILE = join(AGENTS_DIR, '..', 'active-agent.json');

function historyPath(agentName: string): string {
  return join(AGENTS_DIR, agentName, 'history.json');
}

function ensureAgentDir(agentName: string): void {
  const dir = join(AGENTS_DIR, agentName);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function loadActiveAgentName(): string {
  if (!existsSync(ACTIVE_AGENT_FILE)) return 'assistant';
  try {
    const raw = JSON.parse(readFileSync(ACTIVE_AGENT_FILE, 'utf-8')) as { name?: string };
    return raw.name ?? 'assistant';
  } catch {
    return 'assistant';
  }
}

export function saveActiveAgentName(name: string): void {
  writeFileSync(
    ACTIVE_AGENT_FILE,
    JSON.stringify({ name, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  );
}

export function loadPersonaHistory(agentName: string): PersonaHistoryMessage[] {
  const path = historyPath(agentName);
  if (!existsSync(path)) return [];
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as PersonaHistoryMessage[];
    if (!Array.isArray(raw)) return [];
    return raw;
  } catch {
    return [];
  }
}

export function savePersonaHistory(agentName: string, messages: PersonaHistoryMessage[]): void {
  ensureAgentDir(agentName);
  writeFileSync(historyPath(agentName), JSON.stringify(messages, null, 2), 'utf-8');
}

export function appendPersonaHistory(
  agentName: string,
  userContent: string,
  assistantContent: string,
  maxMessages = 100,
): PersonaHistoryMessage[] {
  const history = loadPersonaHistory(agentName);
  const now = Date.now();

  history.push({ role: 'user', content: userContent, timestamp: now });
  history.push({ role: 'assistant', content: assistantContent, timestamp: now + 1 });

  const trimmed = history.slice(-maxMessages);
  savePersonaHistory(agentName, trimmed);
  return trimmed;
}

export function clearPersonaHistory(agentName: string): void {
  savePersonaHistory(agentName, []);
}
