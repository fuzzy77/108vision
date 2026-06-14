/**
 * Interactive Shell — 108 AI REPL (like Claude Code).
 *
 * Launched with: `108ai` (no arguments, TTY detected)
 *
 * Features:
 * - Persistent conversation history (~/.108ai/history/)
 * - Local execution for simple commands (P0 router)
 * - Cache hits shown transparently
 * - Slash commands (/help, /clear, /scripts, /stats, /config, /exit)
 * - Markdown rendering in terminal
 * - Session memory (context carries across messages)
 */

import { createInterface, type Interface } from 'node:readline';
import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadConfig, saveConfig, getDefaultGatewayUrl, type AgentConfig } from './config.js';
import { performBrowserLogin } from './auth.js';
import { tryLocalExecution } from './local-router.js';
import { initCache, getCached, setCached, getCacheStats, flushToDisk } from './local-cache.js';
import { findScript, executeScript, updateUsage, listScripts, saveScript } from './script-store.js';
import { initClipboardHistory, stopClipboardHistory, getHistory as getClipHistory, searchHistory as searchClip, pinEntry, clearHistory as clearClip, getStats as getClipStats } from './clipboard-history.js';
import { getCurrentVersion } from './updater.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  source: 'local' | 'cache' | 'llm' | 'script';
  tokens?: number;
}

interface Session {
  id: string;
  startedAt: number;
  messages: SessionMessage[];
  totalTokens: number;
  tokensSaved: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHELL_DIR = join(homedir(), '.108ai');
const HISTORY_DIR = join(SHELL_DIR, 'history');
const SESSIONS_DIR = join(SHELL_DIR, 'sessions');
const PROMPT = '\x1b[32m108ai\x1b[0m \x1b[90m>\x1b[0m ';
const PROMPT_CONTINUE = '\x1b[90m  ...\x1b[0m ';

// ---------------------------------------------------------------------------
// Shell State
// ---------------------------------------------------------------------------

let rl: Interface;
let config: AgentConfig;
let session: Session;
let gatewayHttp: string;
let multilineBuffer: string[] = [];
let inMultiline = false;

// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------

export async function startShell(): Promise<void> {
  initCache();
  initClipboardHistory();

  // Ensure directories exist
  for (const dir of [SHELL_DIR, HISTORY_DIR, SESSIONS_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  // Load config
  const loaded = loadConfig();
  config = loaded ?? createDefaultConfig();
  gatewayHttp = config.gatewayHttpUrl ?? getDefaultGatewayUrl();

  // Auth if needed
  if (!config.authToken || isTokenExpired(config)) {
    process.stdout.write('\n  \x1b[33m[!]\x1b[0m Autenticazione necessaria -- apertura browser...\n\n');
    try {
      const authResult = await performBrowserLogin(gatewayHttp);
      config.authToken = authResult.token;
      config.tenantId = authResult.tenantId;
      config.tokenExpiresAt = authResult.expiresAt;
      config.gatewayHttpUrl = gatewayHttp;
      saveConfig(config);
    } catch (err) {
      process.stdout.write(`  \x1b[31m[ERR]\x1b[0m Autenticazione fallita: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  }

  // Start session
  session = {
    id: `session_${Date.now()}`,
    startedAt: Date.now(),
    messages: [],
    totalTokens: 0,
    tokensSaved: 0,
  };

  // Print banner
  printShellBanner();

  // Create readline interface
  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT,
    historySize: 500,
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();

    // Multiline mode: triple backtick to start/end
    if (trimmed === '```' || trimmed === '"""') {
      if (inMultiline) {
        inMultiline = false;
        const content = multilineBuffer.join('\n');
        multilineBuffer = [];
        await processInput(content);
      } else {
        inMultiline = true;
        multilineBuffer = [];
        process.stdout.write(PROMPT_CONTINUE);
        return;
      }
      rl.prompt();
      return;
    }

    if (inMultiline) {
      multilineBuffer.push(line);
      process.stdout.write(PROMPT_CONTINUE);
      return;
    }

    // Empty line
    if (!trimmed) {
      rl.prompt();
      return;
    }

    await processInput(trimmed);
    rl.prompt();
  });

  rl.on('close', () => {
    stopClipboardHistory();
    saveSession();
    flushToDisk();
    process.stdout.write('\n  \x1b[90mSessione salvata. A presto!\x1b[0m\n\n');
    process.exit(0);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    stopClipboardHistory();
    saveSession();
    flushToDisk();
    process.stdout.write('\n');
    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Input Processing
// ---------------------------------------------------------------------------

async function processInput(input: string): Promise<void> {
  // Slash commands
  if (input.startsWith('/')) {
    await handleSlashCommand(input);
    return;
  }

  // Add user message to session
  session.messages.push({
    role: 'user',
    content: input,
    timestamp: Date.now(),
    source: 'llm',
  });

  // --- Pipeline: local → script → cache → LLM ---

  // 1. Local execution
  const localResult = await tryLocalExecution(input, config);
  if (localResult) {
    process.stdout.write('\n');
    process.stdout.write(localResult.content);
    process.stdout.write('\n');
    printSource('local', 0);
    session.messages.push({ role: 'assistant', content: localResult.content, timestamp: Date.now(), source: 'local' });
    session.tokensSaved += 500; // estimated
    return;
  }

  // 2. Saved scripts
  const script = findScript(input);
  if (script) {
    process.stdout.write(`\n  \x1b[36m>\x1b[0m Script: ${script.name}\n\n`);
    const result = await executeScript(script.id);
    updateUsage(script.id);
    const output = result.stdout || result.stderr || '(nessun output)';
    process.stdout.write(output);
    if (!output.endsWith('\n')) process.stdout.write('\n');
    printSource('script', 0);
    session.messages.push({ role: 'assistant', content: output, timestamp: Date.now(), source: 'script' });
    session.tokensSaved += 2000;
    return;
  }

  // 3. Cache
  const cached = getCached(input);
  if (cached) {
    process.stdout.write('\n');
    process.stdout.write(cached.response);
    process.stdout.write('\n');
    printSource('cache', cached.tokens);
    session.messages.push({ role: 'assistant', content: cached.response, timestamp: Date.now(), source: 'cache', tokens: 0 });
    session.tokensSaved += cached.tokens;
    return;
  }

  // 4. LLM call (with conversation context)
  process.stdout.write('\n');
  await callLLM(input);
}

// ---------------------------------------------------------------------------
// LLM Call
// ---------------------------------------------------------------------------

async function callLLM(input: string): Promise<void> {
  // TODO: pass session.messages.slice(-10) as conversation context when gateway supports it

  try {
    const response = await fetch(`${gatewayHttp}/api/chat/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        'X-Tenant-ID': config.tenantId,
      },
      body: JSON.stringify({ message: input }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      if (response.status === 401) {
        process.stdout.write('  \x1b[33m[!]\x1b[0m Token scaduto. Rinnovo...\n');
        try {
          const authResult = await performBrowserLogin(gatewayHttp);
          config.authToken = authResult.token;
          config.tenantId = authResult.tenantId;
          config.tokenExpiresAt = authResult.expiresAt;
          saveConfig(config);
          // Retry
          await callLLM(input);
          return;
        } catch {
          process.stdout.write('  \x1b[31m[ERR]\x1b[0m Autenticazione fallita.\n');
          return;
        }
      }
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      const detail = (errorData as { detail?: string }).detail ?? `HTTP ${response.status}`;
      process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${detail}\n`);
      return;
    }

    // Handle response
    let fullResponse = '';

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as { content?: string; text?: string };
              const text = parsed.content ?? parsed.text ?? '';
              if (text) {
                process.stdout.write(text);
                fullResponse += text;
              }
            } catch {
              process.stdout.write(data);
              fullResponse += data;
            }
          } else if (line.trim() && !line.startsWith('event:') && !line.startsWith(':')) {
            process.stdout.write(line);
            fullResponse += line;
          }
        }
      }
    } else {
      const data = await response.json() as { content?: string; model?: string; tokens?: number };
      fullResponse = data.content ?? '';
      process.stdout.write(fullResponse);

      const tokens = data.tokens ?? 0;
      session.totalTokens += tokens;
      setCached(input, fullResponse, data.model ?? 'fast-cheap', tokens);
    }

    if (!fullResponse.endsWith('\n')) process.stdout.write('\n');
    printSource('llm', session.totalTokens);

    session.messages.push({
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
      source: 'llm',
    });

    // Cache for next time
    if (fullResponse) {
      setCached(input, fullResponse, 'fast-cheap', 0);
    }

  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      process.stdout.write('  \x1b[31m[ERR]\x1b[0m Timeout (120s)\n');
    } else {
      process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

// ---------------------------------------------------------------------------
// Slash Commands
// ---------------------------------------------------------------------------

async function handleSlashCommand(input: string): Promise<void> {
  const parts = input.slice(1).split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? '';
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
    case 'h':
      printHelp();
      break;

    case 'clear':
    case 'cls':
      process.stdout.write('\x1b[2J\x1b[H');
      break;

    case 'exit':
    case 'quit':
    case 'q':
      saveSession();
      flushToDisk();
      process.stdout.write('  \x1b[90mA presto!\x1b[0m\n');
      process.exit(0);
      break;

    case 'stats':
      printStats();
      break;

    case 'scripts':
      printScripts();
      break;

    case 'save-script': {
      if (args.length < 1) {
        process.stdout.write('  Uso: /save-script <nome> [tag1,tag2,...]\n');
        break;
      }
      const lastAssistant = [...session.messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistant) {
        process.stdout.write('  Nessuna risposta da salvare come script.\n');
        break;
      }
      // Detect code blocks in the response
      const codeMatch = lastAssistant.content.match(/```(\w+)?\n([\s\S]*?)```/);
      if (!codeMatch) {
        process.stdout.write('  Nessun blocco di codice trovato nell\'ultima risposta.\n');
        break;
      }
      const lang = (codeMatch[1] ?? 'bash') as 'python' | 'bash' | 'powershell' | 'node';
      const code = codeMatch[2] ?? '';
      const name = args[0] ?? 'unnamed-script';
      const tags = args[1]?.split(',') ?? [];
      const saved = saveScript({
        name,
        description: `Generato dalla sessione ${session.id}`,
        language: lang,
        code,
        tags,
        triggerPatterns: [],
      });
      process.stdout.write(`  \x1b[32m[OK]\x1b[0m Script salvato: ${saved.name} (${saved.id})\n`);
      break;
    }

    case 'history':
      printHistory();
      break;

    case 'session':
      printSessionInfo();
      break;

    case 'config':
      printConfig();
      break;

    case 'new':
      saveSession();
      session = {
        id: `session_${Date.now()}`,
        startedAt: Date.now(),
        messages: [],
        totalTokens: 0,
        tokensSaved: 0,
      };
      process.stdout.write('  \x1b[32m[OK]\x1b[0m Nuova sessione iniziata.\n');
      break;

    case 'clipboard':
    case 'clip': {
      const clipHistory = getClipHistory(10);
      if (clipHistory.length === 0) {
        process.stdout.write('  Clipboard vuota.\n');
        break;
      }
      process.stdout.write('\n  \x1b[1mClipboard History (ultime 10):\x1b[0m\n\n');
      clipHistory.forEach((entry, i) => {
        const pin = entry.pinned ? ' \x1b[33m[pinned]\x1b[0m' : '';
        const preview = entry.content.slice(0, 60).replace(/\n/g, ' ');
        const time = new Date(entry.timestamp).toLocaleTimeString('it-IT');
        process.stdout.write(`  ${i}) \x1b[90m${time}\x1b[0m ${preview}${entry.content.length > 60 ? '...' : ''}${pin}\n`);
      });
      process.stdout.write('\n');
      break;
    }

    case 'clip-search': {
      const searchQuery = args.join(' ');
      if (!searchQuery) {
        process.stdout.write('  Uso: /clip-search <testo>\n');
        break;
      }
      const results = searchClip(searchQuery);
      if (results.length === 0) {
        process.stdout.write(`  Nessun risultato per "${searchQuery}".\n`);
        break;
      }
      process.stdout.write(`\n  \x1b[1mRisultati clipboard per "${searchQuery}":\x1b[0m\n\n`);
      results.slice(0, 5).forEach((entry, i) => {
        const preview = entry.content.slice(0, 80).replace(/\n/g, ' ');
        process.stdout.write(`  ${i}) ${preview}${entry.content.length > 80 ? '...' : ''}\n`);
      });
      process.stdout.write('\n');
      break;
    }

    case 'clip-pin': {
      const pinIdx = parseInt(args[0] ?? '', 10);
      if (isNaN(pinIdx)) {
        process.stdout.write('  Uso: /clip-pin <indice>\n');
        break;
      }
      const pinned = pinEntry(pinIdx);
      process.stdout.write(pinned ? '  \x1b[32m[OK]\x1b[0m Pin toggled.\n' : '  Indice non valido.\n');
      break;
    }

    case 'clip-clear':
      clearClip();
      process.stdout.write('  \x1b[32m[OK]\x1b[0m Clipboard history cancellata (pin mantenuti).\n');
      break;

    case 'connect': {
      const service = args[0]?.toLowerCase();
      if (!service) {
        process.stdout.write('  Uso: /connect <servizio>\n');
        process.stdout.write('  Servizi: gmail, calendar, imap, chrome\n');
        break;
      }
      await handleConnect(service);
      break;
    }

    case 'integrations': {
      await printIntegrations();
      break;
    }

    default:
      process.stdout.write(`  Comando sconosciuto: /${cmd}. Scrivi /help per la lista.\n`);
  }
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

function printShellBanner(): void {
  const version = getCurrentVersion();
  const stats = getCacheStats();
  process.stdout.write('\n');
  process.stdout.write('  \x1b[32m+========================================+\x1b[0m\n');
  process.stdout.write('  \x1b[32m|\x1b[0m                                        \x1b[32m|\x1b[0m\n');
  process.stdout.write('  \x1b[32m|\x1b[0m   \x1b[1m108 AI\x1b[0m — Shell Interattiva           \x1b[32m|\x1b[0m\n');
  process.stdout.write(`  \x1b[32m|\x1b[0m   v${version.padEnd(36)}\x1b[32m|\x1b[0m\n`);
  process.stdout.write('  \x1b[32m|\x1b[0m                                        \x1b[32m|\x1b[0m\n');
  process.stdout.write('  \x1b[32m+========================================+\x1b[0m\n');
  process.stdout.write('\n');
  process.stdout.write('  \x1b[90mScrivi una domanda o un comando. /help per i comandi.\x1b[0m\n');
  process.stdout.write('  \x1b[90mUsa ``` per scrivere testo multi-riga. Ctrl+C per uscire.\x1b[0m\n');
  if (stats.entries > 0) {
    process.stdout.write(`  \x1b[90mCache: ${stats.entries} risposte | Token risparmiati: ${stats.savedTokens}\x1b[0m\n`);
  }
  process.stdout.write('\n');
}

function printSource(source: string, tokens: number): void {
  const labels: Record<string, string> = {
    local: '\x1b[32m[local]\x1b[0m',
    script: '\x1b[36m[script]\x1b[0m',
    cache: '\x1b[33m[cache]\x1b[0m',
    llm: '\x1b[35m[llm]\x1b[0m',
  };
  const label = labels[source] ?? `[${source}]`;
  const tokenStr = tokens > 0 ? ` \x1b[90m(${tokens} token)\x1b[0m` : ' \x1b[90m(0 token)\x1b[0m';
  process.stdout.write(`  ${label}${tokenStr}\n\n`);
}

function printHelp(): void {
  process.stdout.write(`
  \x1b[1mComandi disponibili:\x1b[0m

  /help, /h          Mostra questo messaggio
  /clear, /cls       Pulisci lo schermo
  /exit, /quit, /q   Esci dalla shell
  /stats             Statistiche sessione e cache
  /scripts           Lista script salvati
  /save-script <n>   Salva ultimo codice come script riusabile
  /history           Cronologia messaggi sessione
  /session           Info sessione corrente
  /config            Mostra configurazione attuale
  /new               Inizia nuova sessione (salva la precedente)

  \x1b[1mClipboard:\x1b[0m

  /clipboard, /clip  Mostra ultimi 10 elementi clipboard
  /clip-search <q>   Cerca nella clipboard history
  /clip-pin <i>      Pinna/spinna elemento per indice
  /clip-clear        Cancella history (mantiene pin)

  \x1b[1mIntegrazioni:\x1b[0m

  /connect <srv>     Collega un servizio (gmail, calendar, imap, chrome)
  /integrations      Mostra servizi collegati

  \x1b[1mScorciatoie:\x1b[0m

  \`\`\`                  Inizia/termina input multi-riga
  Ctrl+C             Esci

  \x1b[1mCome funziona:\x1b[0m

  Ogni domanda passa per una pipeline di risparmio token:
  1. Esecuzione locale (file, git, sistema) -> 0 token
  2. Script salvati (gia' generati prima) -> 0 token
  3. Cache locale (domanda gia' fatta) -> 0 token
  4. LLM via gateway (solo se necessario)

`);
}

function printStats(): void {
  const stats = getCacheStats();
  const clipStats = getClipStats();
  const duration = Date.now() - session.startedAt;
  const minutes = Math.floor(duration / 60000);

  process.stdout.write(`
  \x1b[1mStatistiche Sessione:\x1b[0m
  Durata:          ${minutes} min
  Messaggi:        ${session.messages.length}
  Token usati:     ${session.totalTokens}
  Token risparmiati: ${session.tokensSaved}

  \x1b[1mCache Locale:\x1b[0m
  Entries:         ${stats.entries}
  Cache hits:      ${stats.hits}
  Cache misses:    ${stats.misses}
  Token salvati:   ${stats.savedTokens}
  Hit rate:        ${stats.hits + stats.misses > 0 ? Math.round(stats.hits / (stats.hits + stats.misses) * 100) : 0}%

  \x1b[1mClipboard:\x1b[0m
  Totale:          ${clipStats.total}
  Pinnati:         ${clipStats.pinned}

`);
}

function printScripts(): void {
  const scripts = listScripts();
  if (scripts.length === 0) {
    process.stdout.write('  Nessuno script salvato. Usa /save-script dopo una risposta con codice.\n');
    return;
  }

  process.stdout.write('\n  \x1b[1mScript salvati:\x1b[0m\n\n');
  for (const s of scripts) {
    const used = s.usageCount > 0 ? `\x1b[32m${s.usageCount}x\x1b[0m` : '\x1b[90m0x\x1b[0m';
    process.stdout.write(`  ${used}  \x1b[1m${s.name}\x1b[0m (${s.language})\n`);
    process.stdout.write(`       \x1b[90m${s.description}\x1b[0m\n`);
    if (s.tags.length > 0) {
      process.stdout.write(`       \x1b[90mTags: ${s.tags.join(', ')}\x1b[0m\n`);
    }
    process.stdout.write('\n');
  }
}

function printHistory(): void {
  if (session.messages.length === 0) {
    process.stdout.write('  Nessun messaggio in questa sessione.\n');
    return;
  }

  process.stdout.write('\n');
  for (const msg of session.messages.slice(-20)) {
    const role = msg.role === 'user' ? '\x1b[36mTu\x1b[0m' : '\x1b[32mAI\x1b[0m';
    const source = msg.source !== 'llm' ? ` \x1b[90m[${msg.source}]\x1b[0m` : '';
    const preview = msg.content.slice(0, 80).replace(/\n/g, ' ');
    process.stdout.write(`  ${role}${source}: ${preview}${msg.content.length > 80 ? '...' : ''}\n`);
  }
  process.stdout.write('\n');
}

function printSessionInfo(): void {
  const duration = Date.now() - session.startedAt;
  const minutes = Math.floor(duration / 60000);
  const localCount = session.messages.filter(m => m.source === 'local').length;
  const cacheCount = session.messages.filter(m => m.source === 'cache').length;
  const llmCount = session.messages.filter(m => m.source === 'llm' && m.role === 'assistant').length;

  process.stdout.write(`
  \x1b[1mSessione:\x1b[0m ${session.id}
  Iniziata:      ${new Date(session.startedAt).toLocaleString('it-IT')}
  Durata:        ${minutes} min
  Messaggi:      ${session.messages.length} (${localCount} local, ${cacheCount} cache, ${llmCount} LLM)
  Token usati:   ${session.totalTokens}
  Token salvati: ${session.tokensSaved}

`);
}

function printConfig(): void {
  process.stdout.write(`
  \x1b[1mConfigurazione:\x1b[0m
  Gateway:    ${gatewayHttp}
  Tenant:     ${config.tenantId || '(non configurato)'}
  Token:      ${config.authToken ? config.authToken.slice(0, 12) + '...' : '(nessuno)'}
  Scadenza:   ${config.tokenExpiresAt ? new Date(config.tokenExpiresAt).toLocaleString('it-IT') : '(n/a)'}
  Directories: ${config.allowedDirectories.length > 0 ? config.allowedDirectories.join(', ') : '(nessuna)'}
  Desktop:    ${config.desktopEnabled ? 'attivo' : 'disattivo'}

`);
}

// ---------------------------------------------------------------------------
// Session Persistence
// ---------------------------------------------------------------------------

function saveSession(): void {
  if (session.messages.length === 0) return;

  const sessionFile = join(SESSIONS_DIR, `${session.id}.json`);
  const sessionData = {
    ...session,
    endedAt: Date.now(),
    summary: session.messages
      .filter(m => m.role === 'user')
      .slice(0, 3)
      .map(m => m.content.slice(0, 50))
      .join(' | '),
  };

  try {
    writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2), 'utf-8');
  } catch {
    // Non-critical
  }

  // Also append to readline history file
  const historyFile = join(HISTORY_DIR, 'readline_history.txt');
  const userMessages = session.messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  try {
    appendFileSync(historyFile, userMessages + '\n', 'utf-8');
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultConfig(): AgentConfig {
  return {
    gatewayUrl: '',
    authToken: '',
    tenantId: '',
    allowedDirectories: [],
    autoStart: false,
    riskPreferences: {
      autoApproveReadOnly: true,
      autoApproveLowRisk: true,
      requireApprovalHighRisk: true,
    },
    maxActionsPerMinute: 10,
    desktopEnabled: false,
    desktopVisionEnabled: true,
    screenshotBeforeAction: true,
  };
}

function isTokenExpired(cfg: AgentConfig): boolean {
  if (!cfg.tokenExpiresAt) return false;
  return Date.now() > cfg.tokenExpiresAt - 5 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Integration Commands
// ---------------------------------------------------------------------------

async function handleConnect(service: string): Promise<void> {
  switch (service) {
    case 'gmail':
    case 'google':
    case 'calendar': {
      process.stdout.write('  Avvio autenticazione Google...\n');
      try {
        const { authenticateGoogle, DEFAULT_GOOGLE_SCOPES, saveGoogleTokens } = await import('./integrations/google-auth.js');
        const clientId = process.env['GOOGLE_CLIENT_ID'];
        const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
        if (!clientId || !clientSecret) {
          process.stdout.write('  \x1b[31m[ERR]\x1b[0m Imposta GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nelle env vars.\n');
          process.stdout.write('  Crea un progetto su console.cloud.google.com > API & Services > Credentials > OAuth 2.0 Client (Desktop)\n');
          break;
        }
        const tokens = await authenticateGoogle({ clientId, clientSecret, scopes: DEFAULT_GOOGLE_SCOPES });
        saveGoogleTokens(tokens);
        process.stdout.write(`  \x1b[32m[OK]\x1b[0m Google connesso (${tokens.email})\n`);
        process.stdout.write('  Servizi attivi: Gmail, Google Calendar\n');
      } catch (err) {
        process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`);
      }
      break;
    }

    case 'imap':
    case 'pec': {
      process.stdout.write('  Configurazione IMAP/PEC\n');
      process.stdout.write('  Provider disponibili: aruba-pec, legalmail, register, postecert, custom\n');
      process.stdout.write('  Imposta in ~/.108ai/integrations/imap.json:\n');
      process.stdout.write('  { "host": "imaps.pec.aruba.it", "port": 993, "user": "...", "password": "...", "tls": true }\n');
      try {
        const { loadImapConfig, testImapConnection } = await import('./integrations/imap-client.js');
        const imapCfg = loadImapConfig();
        if (imapCfg) {
          process.stdout.write('  Testo connessione...\n');
          const result = await testImapConnection(imapCfg);
          process.stdout.write(result.success
            ? `  \x1b[32m[OK]\x1b[0m IMAP connesso (${imapCfg.user})\n`
            : `  \x1b[31m[ERR]\x1b[0m ${result.error}\n`);
        } else {
          process.stdout.write('  \x1b[33m[!]\x1b[0m Nessuna configurazione trovata.\n');
        }
      } catch (err) {
        process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`);
      }
      break;
    }

    case 'chrome':
    case 'browser': {
      process.stdout.write('  Connessione a Chrome DevTools Protocol...\n');
      process.stdout.write('  Assicurati che Chrome sia avviato con: --remote-debugging-port=9222\n');
      try {
        const { connectCdp, listTabs, disconnectCdp } = await import('./integrations/chrome-cdp.js');
        const connected = await connectCdp();
        if (connected) {
          const tabs = await listTabs();
          process.stdout.write(`  \x1b[32m[OK]\x1b[0m Chrome connesso (${tabs.length} tab aperti)\n`);
          disconnectCdp();
        } else {
          process.stdout.write('  \x1b[31m[ERR]\x1b[0m Chrome non raggiungibile. Avvialo con:\n');
          process.stdout.write('  chrome.exe --remote-debugging-port=9222\n');
        }
      } catch (err) {
        process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`);
      }
      break;
    }

    default:
      process.stdout.write(`  Servizio "${service}" non riconosciuto.\n`);
      process.stdout.write('  Disponibili: gmail, calendar, imap, pec, chrome\n');
  }
}

async function printIntegrations(): Promise<void> {
  process.stdout.write('\n  \x1b[1mIntegrazioni:\x1b[0m\n\n');

  // Google
  try {
    const { loadGoogleTokens, isGoogleTokenExpired } = await import('./integrations/google-auth.js');
    const tokens = loadGoogleTokens();
    if (tokens) {
      const status = isGoogleTokenExpired(tokens) ? '\x1b[33mscaduto\x1b[0m' : '\x1b[32mattivo\x1b[0m';
      process.stdout.write(`  Google (${tokens.email}): ${status}\n`);
      process.stdout.write('    Gmail, Calendar\n');
    } else {
      process.stdout.write('  Google: \x1b[90mnon connesso\x1b[0m (/connect gmail)\n');
    }
  } catch {
    process.stdout.write('  Google: \x1b[90mnon disponibile\x1b[0m\n');
  }

  // IMAP
  try {
    const { loadImapConfig } = await import('./integrations/imap-client.js');
    const imapCfg = loadImapConfig();
    if (imapCfg) {
      process.stdout.write(`  IMAP (${imapCfg.user}): \x1b[32mconfigurato\x1b[0m\n`);
    } else {
      process.stdout.write('  IMAP/PEC: \x1b[90mnon configurato\x1b[0m (/connect imap)\n');
    }
  } catch {
    process.stdout.write('  IMAP/PEC: \x1b[90mnon disponibile\x1b[0m\n');
  }

  // Chrome
  process.stdout.write('  Chrome CDP: \x1b[90mconnessione on-demand\x1b[0m (/connect chrome)\n');

  process.stdout.write('\n');
}
