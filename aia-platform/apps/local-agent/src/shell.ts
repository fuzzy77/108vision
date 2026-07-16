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
import { AgentConnection, type AgentMessage } from './connection.js';
import { handleToolCall } from '@aia/desktop-bridge';
import { tryLocalExecution } from './local-router.js';
import { initCache, getCached, getSemanticCached, setCached, getCacheStats, flushToDisk } from './local-cache.js';
import { findScript, executeScript, updateUsage, listScripts, saveScript } from './script-store.js';
import { initClipboardHistory, stopClipboardHistory, getHistory as getClipHistory, searchHistory as searchClip, pinEntry, clearHistory as clearClip, getStats as getClipStats } from './clipboard-history.js';
import { startHotkeyListener, stopHotkeyListener, onHotkey, renderClipboardSelector, selectAndPasteEntry } from './clipboard-hotkey.js';
import { listProviders, addProvider, removeProvider, testProvider, getProviderTemplates } from './provider-keys.js';
import { startTriageScheduler, stopTriageScheduler } from './triage/scheduler.js';
import { startJobScheduler, stopJobScheduler } from './jobs/scheduler.js';
import { handleTelegramCommand, handleWhatsAppCommand, handleNotifyCommand } from './integrations/messaging-cli.js';
import { handleResourceCommand, handleHealthCommand } from './resources/cli.js';
import { startResourceMonitor, stopResourceMonitor } from './resources/monitor.js';
import { runAutoHealing } from './resources/auto-healer.js';
import { isLLMBlocked, isModelDowngraded } from './resources/auto-healer.js';
import { trackTokens } from './resources/config.js';
import { getCurrentVersion } from './updater.js';
import { renderToolStart, renderToolDone, renderToolError } from './ui/markdown-render.js';
import { getRegisteredActions } from './capabilities/index.js';
import { nanoid } from 'nanoid';
import {
  initExtensions,
  tryExecuteCustomCommand,
  tryExecuteSkillExplicit,
  tryExecuteSkillImplicit,
  handleCommandCli,
  handleSkillCli,
  handleAgentCli,
  handleMcpCli,
  handleExtCli,
  handleImportCli,
  handleExportCli,
  handleUiCli,
  tryExecutePersonaOneShot,
  getActivePersona,
  formatActivePersonaLabel,
  type ExtensionShellContext,
} from './extensions/index.js';
import {
  appendPersonaHistory,
} from './extensions/agents/history.js';
import {
  applyPersonaRestrictions,
  buildPersonaUserMessage,
  getPersonaLlmOptions,
} from './extensions/agents/context.js';
import { sanitizeLlmInput } from './hardening/llm-sanitize.js';
import { scanAndRedactPii, formatPiiNotice } from './hardening/pii-guard.js';
import { readSseTextStream } from './hardening/sse-stream.js';
import { rotateAuditLogIfNeeded } from './hardening/audit-rotation.js';
import { ensureAuthFresh } from './hardening/token-refresh.js';
import { compressAssistantOutput } from './hardening/response-compress.js';
import { checkRateLimit } from './security.js';

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
let sessionModel: string | undefined;
let shellCwd: string = process.cwd();

function getPrompt(): string {
  const home = homedir();
  let display = shellCwd;
  if (display.startsWith(home)) {
    display = '~' + display.slice(home.length);
  }
  // Shorten if too long
  if (display.length > 40) {
    const parts = display.split(/[\\/]/);
    display = parts.length > 3 ? `.../${parts.slice(-2).join('/')}` : display;
  }
  return `\x1b[32m108ai\x1b[0m \x1b[90m${display}\x1b[0m \x1b[90m>\x1b[0m `;
}

// --- WebSocket Connection State ---
let wsConnection: AgentConnection | null = null;
let wsConnected = false;
let gatewayAgents: Array<{ id: string; name: string; description: string | null; model: string | null }> = [];
let activeAgentId: string | undefined;
let sessionConversationId: string | undefined;
interface PendingChat {
  resolve: () => void;
  content: string;
  tokens: number;
}
let pendingChatResolvers = new Map<string, PendingChat>();

// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------

export async function startShell(): Promise<void> {
  initCache();
  initClipboardHistory();
  startHotkeyListener();
  startTriageScheduler();
  startJobScheduler();
  startResourceMonitor(async (snapshot, changed) => {
    if (changed && snapshot.overall !== 'normal') {
      await runAutoHealing(snapshot);
    }
  });
  onHotkey(() => {
    process.stdout.write('\n' + renderClipboardSelector(10) + '\n');
    rl.prompt();
  });

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

  // Connect to gateway via WebSocket (for tool-capable chat)
  connectToGateway();

  // Start session
  session = {
    id: `session_${Date.now()}`,
    startedAt: Date.now(),
    messages: [],
    totalTokens: 0,
    tokensSaved: 0,
  };

  const extInit = initExtensions();
  rotateAuditLogIfNeeded();
  if (
    extInit.commandsLoaded > 0 ||
    extInit.skillsLoaded > 0 ||
    extInit.agentsLoaded > 0 ||
    extInit.mcpLoaded > 0
  ) {
    process.stdout.write(
      `  \x1b[90mExtensions: ${extInit.commandsLoaded} command, ${extInit.skillsLoaded} skill, ${extInit.agentsLoaded} agent, ${extInit.mcpLoaded} mcp (~/.108ai/)\x1b[0m\n`,
    );
  }
  for (const warning of extInit.warnings) {
    process.stdout.write(`  \x1b[33m[!]\x1b[0m Extension load: ${warning}\n`);
  }

  // Print banner
  printShellBanner();

  // Create readline interface
  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(),
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
    wsConnection?.disconnect();
    stopResourceMonitor();
    stopJobScheduler();
    stopTriageScheduler();
    stopHotkeyListener();
    stopClipboardHistory();
    saveSession();
    flushToDisk();
    process.stdout.write('\n  \x1b[90mSessione salvata. A presto!\x1b[0m\n\n');
    process.exit(0);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    wsConnection?.disconnect();
    stopResourceMonitor();
    stopJobScheduler();
    stopTriageScheduler();
    stopHotkeyListener();
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

  // One-shot @agent query (e.g. @accountant qual è l'IVA al 10%?)
  const personaShot = await tryExecutePersonaOneShot(input, getExtensionShellContext());
  if (personaShot.handled) {
    session.messages.push({
      role: 'user',
      content: input,
      timestamp: Date.now(),
      source: 'llm',
    });
    process.stdout.write('\n');
    if (personaShot.agentName) {
      process.stdout.write(`  \x1b[36m>\x1b[0m Agent: @${personaShot.agentName}\n\n`);
    }
    if (personaShot.output) {
      process.stdout.write(personaShot.output);
      if (!personaShot.output.endsWith('\n')) process.stdout.write('\n');
    }
    if (personaShot.tokens && personaShot.tokens > 0) {
      printSource('llm', personaShot.tokens);
    } else {
      process.stdout.write('  \x1b[35m[agent]\x1b[0m\n\n');
    }
    session.messages.push({
      role: 'assistant',
      content: personaShot.output ?? '',
      timestamp: Date.now(),
      source: 'llm',
      tokens: personaShot.tokens,
    });
    if (personaShot.tokens) session.totalTokens += personaShot.tokens;
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

  // 1. Local execution (pass shellCwd as first allowed directory for git/file ops)
  const localConfig = { ...config, allowedDirectories: [shellCwd, ...(config.allowedDirectories ?? [])] };
  const localResult = await tryLocalExecution(input, localConfig);
  if (localResult) {
    process.stdout.write('\n');
    process.stdout.write(localResult.content);
    process.stdout.write('\n');
    printSource('local', 0);
    session.messages.push({ role: 'assistant', content: localResult.content, timestamp: Date.now(), source: 'local' });
    session.tokensSaved += 500; // estimated
    return;
  }

  // 1b. Implicit skill match (e.g. "scrivi una email a Mario")
  const skillResult = await tryExecuteSkillImplicit(input, getExtensionShellContext());
  if (skillResult.handled && skillResult.output) {
    process.stdout.write('\n');
    if (skillResult.skillName) {
      process.stdout.write(`  \x1b[36m>\x1b[0m Skill: ${skillResult.skillName}\n\n`);
    }
    process.stdout.write(skillResult.output);
    if (!skillResult.output.endsWith('\n')) process.stdout.write('\n');
    if (skillResult.tokens && skillResult.tokens > 0) {
      printSource('llm', skillResult.tokens);
    } else {
      process.stdout.write('  \x1b[35m[skill]\x1b[0m\n\n');
    }
    session.messages.push({
      role: 'assistant',
      content: skillResult.output,
      timestamp: Date.now(),
      source: 'llm',
      tokens: skillResult.tokens,
    });
    if (skillResult.tokens) session.totalTokens += skillResult.tokens;
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

  // 3. Cache (exact + semantic lite)
  const cached = getCached(input) ?? getSemanticCached(input);
  if (cached) {
    process.stdout.write('\n');
    process.stdout.write(cached.response);
    process.stdout.write('\n');
    printSource('cache', cached.tokens);
    session.messages.push({ role: 'assistant', content: cached.response, timestamp: Date.now(), source: 'cache', tokens: 0 });
    session.tokensSaved += cached.tokens;
    return;
  }

  // 4. LLM call — route via WebSocket (tool-capable) or fallback to HTTP
  process.stdout.write('\n');
  if (wsConnected) {
    await processInputViaGateway(input);
  } else {
    await callLLM(input);
  }
}

// ---------------------------------------------------------------------------
// WebSocket Gateway Connection
// ---------------------------------------------------------------------------

function connectToGateway(): void {
  if (!config.authToken || !config.tenantId) return;

  // Determine WS URL
  let wsUrl = config.gatewayUrl;
  if (!wsUrl) {
    wsUrl = gatewayHttp
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://') + '/ws/local-agent';
  }

  const capabilities = getRegisteredActions();

  wsConnection = new AgentConnection({
    gatewayUrl: wsUrl,
    authToken: config.authToken,
    tenantId: config.tenantId,
    capabilities,
    onMessage: (message: AgentMessage) => {
      handleGatewayMessage(message);
    },
    onConnect: () => {
      wsConnected = true;
    },
    onDisconnect: () => {
      wsConnected = false;
    },
  });

  wsConnection.connect();
}

function handleGatewayMessage(message: AgentMessage): void {
  const raw = message as unknown as Record<string, unknown>;
  const msgType = message.type;
  const msgId = message.id;

  // Config message: agents list from gateway
  if (msgType === 'config') {
    const msg = raw as { agents?: Array<{ id: string; name: string; description: string | null; model: string | null }>; models?: string[] };
    if (msg.agents) gatewayAgents = msg.agents;
    return;
  }

  // Token streaming for chat responses
  if (msgType === 'token') {
    const content = raw.content as string;
    const pending = pendingChatResolvers.get(msgId);
    if (pending) {
      pending.content += content;
      process.stdout.write(content);
    }
    return;
  }

  // Tool call from gateway (LLM wants to use a tool on our machine)
  if (msgType === 'tool_call') {
    executeToolCallLocally(message);
    return;
  }

  // Chat done
  if (msgType === 'done') {
    const usage = raw.usage as { totalTokens?: number; model?: string; conversationId?: string } | undefined;
    if (usage?.conversationId && !sessionConversationId) {
      sessionConversationId = usage.conversationId;
    }
    const pending = pendingChatResolvers.get(msgId);
    if (pending) {
      pending.tokens = usage?.totalTokens ?? 0;
      pending.resolve();
    }
    return;
  }

  // Chat error
  if (msgType === 'error') {
    const errorMsg = raw.message as string | undefined;
    const pending = pendingChatResolvers.get(msgId);
    if (pending) {
      process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${errorMsg ?? 'Unknown error'}\n`);
      pending.resolve();
    }
    return;
  }
}

async function executeToolCallLocally(message: AgentMessage): Promise<void> {
  const tool = message.tool ?? '';
  const params = message.params ?? {};
  // Inject shellCwd as default cwd for shell commands
  if (tool === 'shell.execute' && !(params as { cwd?: string }).cwd) {
    (params as { cwd?: string }).cwd = shellCwd;
  }
  const detail = (params as { path?: string; command?: string }).path ?? (params as { command?: string }).command;

  process.stdout.write(renderToolStart(tool, detail) + '\n');

  const startTime = Date.now();
  const result = await handleToolCall(tool, params, { allowedPaths: [shellCwd, ...(config.allowedDirectories ?? [])] });
  const duration = Date.now() - startTime;

  if (result.ok) {
    process.stdout.write('\x1b[1A\r' + renderToolDone(tool, detail, duration) + '\n');
    // Send as tool_result so the gateway WS handler routes it correctly
    wsConnection?.sendRaw({
      id: message.id,
      type: 'tool_result',
      toolCallId: message.id,
      result: result.result,
    });
  } else {
    process.stdout.write('\x1b[1A\r' + renderToolError(tool, result.error) + '\n');
    wsConnection?.sendRaw({
      id: message.id,
      type: 'tool_result',
      toolCallId: message.id,
      error: result.error,
    });
  }
}

/**
 * Send a chat message via WebSocket to the gateway. The gateway handles RAG,
 * knowledge base, model routing, and streams tokens + tool_calls back.
 */
async function processInputViaGateway(input: string): Promise<void> {
  const sanitize = sanitizeLlmInput(input);
  if (!sanitize.safe) {
    process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${sanitize.warnings[0] ?? 'Input bloccato'}\n`);
    return;
  }

  if (!checkRateLimit(config)) {
    process.stdout.write(`  \x1b[31m[ERR]\x1b[0m Rate limit exceeded\n`);
    return;
  }

  if (isLLMBlocked()) {
    process.stdout.write('  \x1b[33m[!]\x1b[0m LLM bloccato per emergenza token (auto-healer).\n');
    return;
  }

  if (!wsConnection?.isConnected()) {
    process.stdout.write('  \x1b[33m[!]\x1b[0m Connessione WS persa, fallback a HTTP...\n');
    await callLLM(input);
    return;
  }

  const chatId = nanoid(21);
  const effectiveModel = isModelDowngraded() ? 'fast-cheap' : sessionModel ?? 'balanced';

  let chatResolve: () => void;
  const responsePromise = new Promise<void>((resolve) => { chatResolve = resolve; });
  const pending: PendingChat = { resolve: chatResolve!, content: '', tokens: 0 };
  pendingChatResolvers.set(chatId, pending);

  try {
    wsConnection.sendRaw({
      id: chatId,
      type: 'chat',
      message: sanitize.sanitized,
      model: effectiveModel,
      agentId: activeAgentId,
      conversationId: sessionConversationId,
    });
  } catch {
    pendingChatResolvers.delete(chatId);
    process.stdout.write('  \x1b[33m[!]\x1b[0m Invio fallito, fallback a HTTP...\n');
    await callLLM(input);
    return;
  }

  await responsePromise;

  const content = pending.content;
  const tokens = pending.tokens;
  pendingChatResolvers.delete(chatId);

  if (!content.endsWith('\n')) process.stdout.write('\n');

  session.totalTokens += tokens;
  if (tokens > 0) trackTokens(tokens);
  printSource('llm', tokens);

  session.messages.push({
    role: 'assistant',
    content,
    timestamp: Date.now(),
    source: 'llm',
    tokens,
  });
}

// ---------------------------------------------------------------------------
// LLM Call (HTTP fallback)
// ---------------------------------------------------------------------------

async function callLLM(input: string): Promise<void> {
  const sanitize = sanitizeLlmInput(input);
  if (!sanitize.safe) {
    process.stdout.write(`  \x1b[31m[ERR]\x1b[0m ${sanitize.warnings[0] ?? 'Input bloccato'}\n`);
    return;
  }

  if (!checkRateLimit(config)) {
    process.stdout.write(
      `  \x1b[31m[ERR]\x1b[0m Rate limit exceeded (max ${config.maxActionsPerMinute} actions/minute)\n`,
    );
    return;
  }

  if (isLLMBlocked()) {
    process.stdout.write('  \x1b[33m[!]\x1b[0m LLM bloccato per emergenza token (auto-healer).\n');
    return;
  }

  await ensureAuthFresh(config, gatewayHttp, (auth) => {
    config.authToken = auth.token;
    config.tenantId = auth.tenantId;
    config.tokenExpiresAt = auth.expiresAt;
    saveConfig(config);
  });

  const persona = getActivePersona();
  const llmMessage = persona
    ? buildPersonaUserMessage(persona, sanitize.sanitized, true)
    : sanitize.sanitized;
  const llmOpts = persona ? getPersonaLlmOptions(persona) : undefined;

  const effectiveModel = isModelDowngraded()
    ? 'fast-cheap'
    : sessionModel ?? llmOpts?.model ?? 'fast-cheap';

  const requestBody: Record<string, unknown> = { message: llmMessage };
  if (llmOpts?.systemPrompt) requestBody['system_prompt'] = llmOpts.systemPrompt;
  requestBody['model'] = effectiveModel;
  if (llmOpts?.maxTokens) requestBody['max_tokens'] = llmOpts.maxTokens;

  try {
    const response = await fetch(`${gatewayHttp}/api/chat/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        'X-Tenant-ID': config.tenantId,
      },
      body: JSON.stringify(requestBody),
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
    let tokensUsed = 0;
    const isStreaming = response.body !== null;

    if (isStreaming) {
      const res = await readSseTextStream(response, (t) => process.stdout.write(t));
      fullResponse = res.content;
      tokensUsed = res.tokensUsed;
    } else {
      const data = await response.json() as { content?: string; model?: string; tokens?: number };
      fullResponse = data.content ?? '';
      process.stdout.write(fullResponse);

      tokensUsed = data.tokens ?? 0;
      session.totalTokens += tokensUsed;
      if (tokensUsed > 0) trackTokens(tokensUsed);
      if (!persona) {
        setCached(input, fullResponse, data.model ?? llmOpts?.model ?? 'fast-cheap', tokensUsed);
      }
    }

    if (isStreaming) {
      session.totalTokens += tokensUsed;
      if (tokensUsed > 0) trackTokens(tokensUsed);
    }

    if (!fullResponse.endsWith('\n')) process.stdout.write('\n');

    let finalResponse = fullResponse;
    if (persona) {
      const restricted = applyPersonaRestrictions(persona, fullResponse);
      if (restricted.output !== fullResponse) {
        const extra = restricted.output.slice(fullResponse.length);
        if (extra) process.stdout.write(extra);
        finalResponse = restricted.output;
      }
      appendPersonaHistory(persona.definition.name, sanitize.sanitized, finalResponse);
      if (persona.definition.name !== 'assistant') {
        process.stdout.write(`  \x1b[36m[agent:${persona.definition.name}]\x1b[0m`);
      }
    }

    const piiScan = scanAndRedactPii(
      finalResponse,
      persona?.definition.restrictions?.no_pii_in_output === true,
    );
    if (piiScan.hasPii) {
      const notice = formatPiiNotice(piiScan.types);
      if (persona?.definition.restrictions?.no_pii_in_output) {
        finalResponse = piiScan.redacted;
      }
      if (notice && !finalResponse.includes('PII')) {
        process.stdout.write(notice);
        finalResponse += notice;
      }
    }

    printSource('llm', session.totalTokens);

    session.messages.push({
      role: 'assistant',
      content: finalResponse,
      timestamp: Date.now(),
      source: 'llm',
    });

    // Cache for next time (generic input only when no persona context)
    if (finalResponse && !persona) {
      setCached(input, compressAssistantOutput(finalResponse), effectiveModel, tokensUsed);
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

function getExtensionShellContext(): ExtensionShellContext {
  return {
    gatewayHttp,
    authToken: config.authToken,
    tenantId: config.tenantId,
    config,
  };
}

async function handleSlashCommand(input: string): Promise<void> {
  const parts = input.slice(1).split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? '';
  const args = parts.slice(1);

  if (cmd === 'command' || cmd === 'commands') {
    const output = await handleCommandCli(args);
    process.stdout.write(output);
    return;
  }

  if (cmd === 'skill' || cmd === 'skills') {
    const output = await handleSkillCli(args, getExtensionShellContext());
    process.stdout.write(output);
    return;
  }

  if (cmd === 'agent' || cmd === 'agents') {
    // Handle gateway agent commands first
    if (args[0] === 'list' && gatewayAgents.length > 0) {
      process.stdout.write('\n  \x1b[1mGateway Agents\x1b[0m (dalla dashboard)\n\n');
      for (const a of gatewayAgents) {
        const marker = a.id === activeAgentId ? '\x1b[32m*\x1b[0m' : ' ';
        const model = a.model ? `\x1b[90m[${a.model}]\x1b[0m` : '';
        process.stdout.write(`  ${marker} \x1b[1m${a.name}\x1b[0m ${model}\n`);
        if (a.description) process.stdout.write(`      \x1b[90m${a.description}\x1b[0m\n`);
      }
      if (activeAgentId) {
        const active = gatewayAgents.find(a => a.id === activeAgentId);
        process.stdout.write(`\n  Attivo: \x1b[1m${active?.name ?? activeAgentId}\x1b[0m\n`);
      }
      process.stdout.write(`\n  Usa: /agent use <nome>\n\n`);
      // Also show local agents
      const output = await handleAgentCli(args, getExtensionShellContext());
      process.stdout.write(output);
      return;
    }
    if (args[0] === 'use' && args[1]) {
      const name = args.slice(1).join(' ').toLowerCase();
      const match = gatewayAgents.find(a => a.name.toLowerCase() === name || a.id === name);
      if (match) {
        activeAgentId = match.id;
        process.stdout.write(`  \x1b[32m[OK]\x1b[0m Agent attivo: \x1b[1m${match.name}\x1b[0m (gateway)\n`);
        return;
      }
      // Fall through to local agents handler
    }
    if (args[0] === 'reset' || args[0] === 'none') {
      if (activeAgentId) {
        activeAgentId = undefined;
        process.stdout.write('  \x1b[32m[OK]\x1b[0m Agent gateway disattivato\n');
        return;
      }
    }
    const output = await handleAgentCli(args, getExtensionShellContext());
    process.stdout.write(output);
    return;
  }

  if (cmd === 'mcp') {
    const output = await handleMcpCli(args);
    process.stdout.write(output);
    return;
  }

  if (cmd === 'ext' || cmd === 'extensions') {
    const output = await handleExtCli(args, getExtensionShellContext());
    process.stdout.write(output);
    return;
  }

  if (cmd === 'import') {
    const output = await handleImportCli(args);
    process.stdout.write(output);
    return;
  }

  if (cmd === 'export') {
    const output = await handleExportCli(args);
    process.stdout.write(output);
    return;
  }

  if (cmd === 'ui') {
    const output = await handleUiCli(args);
    process.stdout.write(output);
    return;
  }

  if (cmd === 'palette') {
    const output = await handleUiCli(['palette', ...args]);
    process.stdout.write(output);
    return;
  }

  const skillExplicit = await tryExecuteSkillExplicit(
    cmd,
    args,
    args.join(' '),
    getExtensionShellContext(),
  );
  if (skillExplicit.handled) {
    if (skillExplicit.output) {
      process.stdout.write('\n');
      process.stdout.write(skillExplicit.output);
      if (!skillExplicit.output.endsWith('\n')) process.stdout.write('\n');
    }
    return;
  }

  const custom = await tryExecuteCustomCommand(cmd, args, getExtensionShellContext());
  if (custom.handled) {
    if (custom.output) {
      process.stdout.write('\n');
      process.stdout.write(custom.output);
      if (!custom.output.endsWith('\n')) process.stdout.write('\n');
      if (custom.tokens !== undefined && custom.tokens > 0) {
        printSource('llm', custom.tokens);
      }
    }
    return;
  }

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

    case 'status': {
      const connStatus = wsConnected ? '\x1b[32mConnesso\x1b[0m' : '\x1b[31mDisconnesso\x1b[0m';
      process.stdout.write(`\n  Gateway WS: ${connStatus}\n`);
      process.stdout.write(`  Gateway HTTP: ${gatewayHttp}\n`);
      process.stdout.write(`  CWD: ${shellCwd}\n`);
      process.stdout.write(`  Agents disponibili: ${gatewayAgents.length}\n`);
      if (activeAgentId) {
        const active = gatewayAgents.find(a => a.id === activeAgentId);
        process.stdout.write(`  Agent attivo: ${active?.name ?? activeAgentId}\n`);
      }
      process.stdout.write(`  Modalita\': ${wsConnected ? 'WS (tool-capable)' : 'HTTP (text-only)'}\n\n`);
      break;
    }

    case 'logout': {
      config.authToken = '';
      config.tenantId = '';
      config.tokenExpiresAt = undefined;
      saveConfig(config);
      wsConnection?.disconnect();
      wsConnected = false;
      gatewayAgents = [];
      activeAgentId = undefined;
      process.stdout.write('  Logout completato. Riavvia per ri-autenticarti.\n');
      break;
    }

    case 'cd': {
      if (args.length === 0) {
        shellCwd = homedir();
      } else {
        const target = args.join(' ');
        const resolved = target.startsWith('/') || target.startsWith('~') || /^[A-Z]:/i.test(target)
          ? target.replace(/^~/, homedir())
          : join(shellCwd, target);
        if (existsSync(resolved)) {
          shellCwd = resolved;
        } else {
          process.stdout.write(`  \x1b[31m[ERR]\x1b[0m Directory non trovata: ${resolved}\n`);
          break;
        }
      }
      rl.setPrompt(getPrompt());
      process.stdout.write(`  ${shellCwd}\n`);
      break;
    }

    case 'model': {
      if (args.length === 0) {
        const current = sessionModel ?? '(default gateway / persona)';
        process.stdout.write(`  Modello sessione: ${current}\n`);
        process.stdout.write('  Tier: fast-cheap | balanced | powerful\n');
        process.stdout.write('  Uso: /model <tier>\n');
        break;
      }
      sessionModel = args[0];
      process.stdout.write(`  Modello impostato: ${sessionModel}\n`);
      break;
    }

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
      sessionConversationId = undefined;
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

    case 'clip-pick': {
      const pickIdx = parseInt(args[0] ?? '', 10);
      if (isNaN(pickIdx)) {
        process.stdout.write(renderClipboardSelector(10).rendered);
        process.stdout.write('\n  Uso: /clip-pick <indice>\n');
        break;
      }
      const picked = await selectAndPasteEntry(pickIdx);
      if (picked) {
        process.stdout.write(`  \x1b[32m[OK]\x1b[0m Copiato in clipboard: ${picked.slice(0, 60)}${picked.length > 60 ? '...' : ''}\n`);
      } else {
        process.stdout.write('  Indice non valido.\n');
      }
      break;
    }

    case 'clip-clear':
      clearClip();
      process.stdout.write('  \x1b[32m[OK]\x1b[0m Clipboard history cancellata (pin mantenuti).\n');
      break;

    case 'providers': {
      await handleProviders(args);
      break;
    }

    case 'telegram': {
      const output = await handleTelegramCommand(args);
      process.stdout.write(output);
      break;
    }

    case 'whatsapp':
    case 'wa': {
      const output = await handleWhatsAppCommand(args);
      process.stdout.write(output);
      break;
    }

    case 'notify':
    case 'notification': {
      const output = await handleNotifyCommand(args);
      process.stdout.write(output);
      break;
    }

    case 'resources':
    case 'risorse': {
      const output = await handleResourceCommand(args);
      process.stdout.write(output);
      break;
    }

    case 'health': {
      const output = await handleHealthCommand(args);
      process.stdout.write(output);
      break;
    }

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
// Provider Management
// ---------------------------------------------------------------------------

async function handleProviders(args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === 'list') {
    const providers = listProviders();
    if (providers.length === 0) {
      process.stdout.write('  Nessun provider configurato. Usa /providers add\n');
      return;
    }
    process.stdout.write('\n  \x1b[1mProvider LLM configurati:\x1b[0m\n\n');
    for (const p of providers) {
      const status = p.enabled ? '\x1b[32m●\x1b[0m' : '\x1b[90m○\x1b[0m';
      const key = p.apiKey ? `${p.apiKey.slice(0, 8)}...` : '(nessuna)';
      process.stdout.write(`  ${status} ${p.name} \x1b[90m(${p.type})\x1b[0m prio:${p.priority} key:${key}\n`);
    }
    process.stdout.write('\n');
    return;
  }

  if (sub === 'add') {
    const typeName = args[1];
    const apiKey = args[2];
    if (!typeName) {
      const templates = getProviderTemplates();
      process.stdout.write('  Uso: /providers add <tipo> [api_key]\n');
      process.stdout.write(`  Tipi: ${templates.map(t => t.type).join(', ')}\n`);
      return;
    }
    const templates = getProviderTemplates();
    const template = templates.find(t => t.type === typeName);
    if (!template) {
      process.stdout.write(`  Tipo "${typeName}" non riconosciuto.\n`);
      return;
    }
    const newProvider = addProvider({
      ...template,
      apiKey: apiKey ?? '',
      enabled: !!apiKey,
    });
    process.stdout.write(`  \x1b[32m[OK]\x1b[0m Provider aggiunto: ${newProvider.name} (${newProvider.id})\n`);
    if (!apiKey) {
      process.stdout.write('  \x1b[33m[!]\x1b[0m Nessuna API key — provider disabilitato. Usa /providers key <id> <key>\n');
    }
    return;
  }

  if (sub === 'remove') {
    const id = args[1];
    if (!id) { process.stdout.write('  Uso: /providers remove <id>\n'); return; }
    const removed = removeProvider(id);
    process.stdout.write(removed ? '  \x1b[32m[OK]\x1b[0m Rimosso.\n' : '  ID non trovato.\n');
    return;
  }

  if (sub === 'test') {
    const id = args[1];
    if (!id) { process.stdout.write('  Uso: /providers test <id>\n'); return; }
    process.stdout.write('  Testing...');
    const result = await testProvider(id);
    if (result.ok) {
      process.stdout.write(`\r  \x1b[32m[OK]\x1b[0m Connesso (${result.latencyMs}ms)\n`);
    } else {
      process.stdout.write(`\r  \x1b[31m[ERR]\x1b[0m ${result.error}\n`);
    }
    return;
  }

  process.stdout.write('  Sub-comandi: list, add, remove, test\n');
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
  const connLabel = wsConnected ? '\x1b[32mConnesso\x1b[0m' : '\x1b[90min connessione...\x1b[0m';
  process.stdout.write(`  Gateway: ${connLabel}  \x1b[90m(/status per dettagli)\x1b[0m\n`);
  process.stdout.write('  \x1b[90mScrivi una domanda o un comando. /help per i comandi.\x1b[0m\n');
  process.stdout.write('  \x1b[90mUsa ``` per scrivere testo multi-riga. Ctrl+C per uscire.\x1b[0m\n');
  const activeAgent = formatActivePersonaLabel();
  if (activeAgent) {
    process.stdout.write(`  \x1b[90mAgent attivo: ${activeAgent} — /agent list | @nome domanda\x1b[0m\n`);
  }
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
  /clip-pick <i>     Seleziona e copia in clipboard per indice
  /clip-search <q>   Cerca nella clipboard history
  /clip-pin <i>      Pinna/spinna elemento per indice
  /clip-clear        Cancella history (mantiene pin)
                     Hotkey: Ctrl+Shift+V (mostra selettore)

  \x1b[1mProvider LLM:\x1b[0m

  /providers         Lista provider configurati
  /providers add <t> Aggiungi provider (deepseek, openai, anthropic...)
  /providers test <i>Testa connessione provider
  /providers remove  Rimuovi provider
  /model [tier]      Imposta modello LLM per la sessione (fast-cheap, balanced, powerful)

  \x1b[1mExtensions (Commands):\x1b[0m

  /command list      Lista command (~/.108ai/commands/)
  /command create <n> Crea scaffold YAML command
  /command info <n>  Dettaglio command (prompt o builtin)
  /command reload    Ricarica command + skill da disco
  /summarize-email   Riassunto email (alias /se)
  /triage            Triage giornaliero (YAML builtin)
  /morning           Morning briefing (alias /mattina)
  /standup           Formato standup team
  /schedule          Scheduler triage (on|off|set|status)
  /job               Job engine (list|run|status|… alias /jobs)

  \x1b[1mExtensions (Skills):\x1b[0m

  /skill list        Lista skill installate
  /skill run <nome>  Esegui skill con messaggio
  /skill info <nome> Dettaglio skill
  /write-email       Skill email-writer (alias /email)
  Linguaggio naturale: "scrivi una email a..."

  \x1b[1mExtensions (Agents):\x1b[0m

  /agent list        Lista persona agents (~/.108ai/agents/)
  /agent use <nome>  Imposta agent attivo per la sessione
  /agent info <nome> Dettaglio agent (model, history, restrictions)
  /agent test <n>    Test rapido senza persistere history
  /agent ask a,b "q" Query multi-agent parallela
  /agent clone s t   Clona definizione YAML
  @accountant ...    One-shot verso un agent specifico

  \x1b[1mExtensions (MCP):\x1b[0m

  /mcp list          Server MCP configurati (~/.108ai/mcp.yml)
  /mcp start <nome>  Avvia server stdio
  /mcp tools <nome>  Lista tool esposti
  /mcp test <s> <t>  Invoca tool (args JSON)
  /mcp add <nome> --command "..."  Aggiungi server

  \x1b[1mExtensions (Import/Export):\x1b[0m

  /ext status        Overview commands/skills/agents/mcp
  /import claude <path>  Import da .claude/ o settings.json
  /import n8n <path>     Import workflow n8n → command stub
  /import chatgpt <path> Import GPT export → agent YAML
  /import restore <dir>  Ripristina backup extensions
  /export backup     Backup ~/.108ai extensions
  /export restore <dir>  Alias restore backup

  \x1b[1mExtensions (UI):\x1b[0m

  /ui dashboard      Panoramica commands/skills/agents/mcp
  /ui commands [q]   Palette command (terminale)
  /palette [q]       Alias palette command
  /ui agents         Lista persona agents
  /ui mcp            Stato server MCP
  /ui store [tipo]   Catalogo locale (command/skill/agent)
  /ui web [porta]    Dashboard web su 127.0.0.1:7891
  /ui web-stop       Ferma server web UI

  \x1b[1mMessaging & Notifiche:\x1b[0m

  /telegram          Stato bot Telegram
  /telegram setup <t>Configura token bot
  /telegram test     Invia messaggio di test
  /whatsapp          Stato connessioni WA
  /whatsapp connect  Connetti via Baileys (QR)
  /whatsapp business Setup WA Business API
  /notify            Stato canali notifica
  /notify test <ch>  Testa un canale
  /notify quiet on/off  Ore silenziose

  \x1b[1mRisorse & Health:\x1b[0m

  /resources         Dashboard risorse (RAM, disco, token)
  /resources memory  Dettaglio memoria (--gc per force GC)
  /resources disk    Dettaglio disco (--clean / --purge)
  /resources tokens  Budget token (--today / --month / --top)
  /resources config  Mostra configurazione soglie
  /resources reset   Reset downgrade modello / blocco LLM
  /health            Health check compatto
  /health --fix      Auto-healing immediato

  \x1b[1mIntegrazioni:\x1b[0m

  /connect <srv>     Collega un servizio (gmail, calendar, imap, chrome)
  /integrations      Mostra servizi collegati

  \x1b[1mNavigazione & Connessione:\x1b[0m

  /cd <path>         Cambia directory di lavoro
  /status            Stato connessione gateway + info sessione
  /logout            Disconnetti e cancella token (richiede riavvio)

  \x1b[1mScorciatoie:\x1b[0m

  \`\`\`                  Inizia/termina input multi-riga
  Ctrl+C             Esci

  \x1b[1mCome funziona:\x1b[0m

  Ogni domanda passa per una pipeline di risparmio token:
  1. Esecuzione locale (file, git, sistema) -> 0 token
  2. Script salvati (gia' generati prima) -> 0 token
  3. Cache locale (domanda gia' fatta) -> 0 token
  4. LLM via gateway WS (tool-capable, RAG, knowledge base)
     Fallback: HTTP se WS non connesso

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
