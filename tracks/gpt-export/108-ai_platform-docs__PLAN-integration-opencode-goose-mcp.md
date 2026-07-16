# Piano Esecutivo: Integrazione OpenCode + Goose MCP + Modernizzazione Local Agent

**Versione:** 1.0
**Data:** 2026-06-19
**Stato:** PROPOSTO — richiede approvazione prima di esecuzione
**Rischio complessivo:** MEDIO (nessuna modifica distruttiva, approccio incrementale)

---

## Indice

1. [Contesto e decisione strategica](#1-contesto)
2. [Livello 1 — OpenCode come coding engine](#2-livello-1)
3. [Livello 2 — Architettura MCP-first](#3-livello-2)
4. [Livello 3 — Vercel AI SDK migration](#4-livello-3)
5. [Matrice Build vs Buy finale](#5-matrice)
6. [Rischi e mitigazioni](#6-rischi)
7. [Timeline e dipendenze](#7-timeline)

---

## 1. Contesto e decisione strategica {#1-contesto}

### Stato attuale del Local Agent [verificato]

```
108ai local-agent
├── Architettura: WebSocket custom + REST → Gateway
├── LLM: ZERO dipendenze dirette (tutto via gateway HTTP)
├── Capabilities: Map<string, ActionHandler> flat registry
├── MCP: Adapter presente (stdio + SSE client)
├── Extensions: YAML commands + skills + agents + MCP servers
├── Stack: TypeScript ESM, Zod, Pino, esbuild → binari
└── Differenziatori: token-saving, triage, desktop 6-level, PMI integrations
```

### Decisione architetturale

**Non riscrivere. Integrare.**

Il local-agent ha valore in ciò che NESSUN altro tool fa (token-saving, triage, desktop automation, integrazioni PMI). Per il *coding* (filesystem, shell, git, code editing), OpenCode è 176K stars, MIT, TypeScript, con SDK embeddable. Per l'*estensibilità*, MCP è lo standard de facto (Linux Foundation, adottato da tutti).

**Strategia:** il local-agent diventa un **orchestratore** che:
1. Delega coding tasks a OpenCode (via SDK)
2. Espone le proprie capabilities come MCP server (consumabile da qualsiasi client)
3. Consuma MCP server della community per capabilities non-core
4. Mantiene custom: triage, token-saving, desktop automation, integrazioni PMI

---

## 2. Livello 1 — OpenCode come Coding Engine {#2-livello-1}

### Obiettivo

Delegare i task di coding (filesystem, shell, git, code editing) a OpenCode senza riscrivere il local-agent. Il local-agent resta l'orchestratore; OpenCode diventa il "coding brain".

### Prerequisiti

- Node.js 20+ (già presente)
- `@opencode-ai/sdk` (MIT, npm)
- API key per almeno un LLM provider (Anthropic consigliato)

### Architettura target

```
┌─────────────────────────────────────────────────┐
│  108ai Local Agent (orchestratore)              │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Triage   │  │ Desktop  │  │ Integrations │  │
│  │ Engine   │  │ Automat. │  │ PMI (PEC,    │  │
│  │          │  │ 6 levels │  │ WhatsApp...) │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  OpenCode Bridge (nuovo modulo)          │   │
│  │  - createOpencode() / client             │   │
│  │  - session management                    │   │
│  │  - event streaming                       │   │
│  │  - capability routing                    │   │
│  └──────────────────────────────────────────┘   │
│       │                                         │
│       ▼                                         │
│  ┌──────────────────────────────────────────┐   │
│  │  OpenCode Server (subprocess, port 4096) │   │
│  │  - 75+ LLM provider (Vercel AI SDK)     │   │
│  │  - MCP server support nativo            │   │
│  │  - LSP integration                      │   │
│  │  - File/shell/git tools built-in        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Step di implementazione

#### Step 1.1 — Installazione e test manuale (2h)

```bash
# Nel monorepo aia-platform
cd aia-platform/apps/local-agent
npm install @opencode-ai/sdk

# Test: avvia server headless
npx opencode serve --port 4096

# Verifica health
curl http://localhost:4096/health
```

**Criterio go:** server risponde 200 su `/health`, `/doc` mostra OpenAPI spec.

#### Step 1.2 — OpenCode Bridge module (4-6h)

Nuovo file: `src/coding/opencode-bridge.ts`

```typescript
import { createOpencode, createOpencodeClient } from '@opencode-ai/sdk'
import type { OpencodeClient } from '@opencode-ai/sdk'
import { getConfig } from '../config.js'
import { logger } from '../logger.js'

interface OpenCodeBridgeOptions {
  port?: number
  model?: string
  smallModel?: string
  mcpServers?: Record<string, unknown>
}

let instance: { client: OpencodeClient; close: () => void } | null = null

export async function startOpenCode(opts: OpenCodeBridgeOptions = {}) {
  if (instance) return instance.client

  const config = getConfig()
  const port = opts.port ?? 4096

  const opencode = await createOpencode({
    port,
    hostname: '127.0.0.1',
    timeout: 10_000,
    config: {
      model: opts.model ?? 'anthropic/claude-sonnet-4-5',
      small_model: opts.smallModel ?? 'anthropic/claude-haiku-3-5',
      mcp: opts.mcpServers ?? {},
    },
  })

  instance = {
    client: opencode.client,
    close: () => opencode.server.close(),
  }

  logger.info({ port }, 'OpenCode server started')
  return instance.client
}

export async function stopOpenCode() {
  if (instance) {
    instance.close()
    instance = null
    logger.info('OpenCode server stopped')
  }
}

export function getOpenCodeClient(): OpencodeClient | null {
  return instance?.client ?? null
}

export async function runCodingTask(prompt: string, opts?: {
  model?: { providerID: string; modelID: string }
  sessionId?: string
}): Promise<string> {
  const client = instance?.client
  if (!client) throw new Error('OpenCode not started')

  // Riusa sessione esistente o crea nuova
  const sessionId = opts?.sessionId
    ?? (await client.session.create({ body: {} })).id

  // Invia prompt
  const result = await client.session.prompt({
    path: { id: sessionId },
    body: {
      parts: [{ type: 'text', text: prompt }],
      ...(opts?.model && { model: opts.model }),
    },
  })

  // Recupera messaggi per ottenere la risposta
  const messages = await client.session.messages({
    path: { id: sessionId },
  })

  // L'ultimo messaggio assistant è la risposta
  const lastAssistant = messages
    .filter((m: any) => m.role === 'assistant')
    .at(-1)

  return lastAssistant?.content ?? '[no response]'
}
```

**Criterio go:** `runCodingTask("Crea un file hello.ts con console.log('hello')")` crea il file.

#### Step 1.3 — Routing: coding tasks → OpenCode (3-4h)

Modifica `src/capabilities/index.ts` — aggiungi routing intelligente:

```typescript
import { getOpenCodeClient, runCodingTask } from '../coding/opencode-bridge.js'

// Capabilities che OpenCode gestisce meglio
const OPENCODE_CAPABLE = new Set([
  'code.write', 'code.edit', 'code.multiEdit',
  'code.rangeRead', 'code.analyze',
  'filesystem.writeFile', 'filesystem.editFile',
  // shell e git restano locali per ora (security gates)
])

export async function executeAction(action: string, params: any): Promise<any> {
  // Se OpenCode è attivo E il tool è delegabile
  const ocClient = getOpenCodeClient()
  if (ocClient && OPENCODE_CAPABLE.has(action)) {
    return delegateToOpenCode(action, params)
  }

  // Fallback: esecuzione locale (esistente)
  return executeLocal(action, params)
}

async function delegateToOpenCode(action: string, params: any): Promise<any> {
  const prompt = buildCodingPrompt(action, params)
  return runCodingTask(prompt)
}
```

**Criterio go:** task di coding passano a OpenCode; desktop/triage/integrations restano locali.

#### Step 1.4 — Configurazione e lifecycle (2h)

Aggiungi a `config.ts`:

```typescript
interface Config {
  // ... esistente ...
  opencode: {
    enabled: boolean        // default: false (opt-in)
    port: number            // default: 4096
    model: string           // default: 'anthropic/claude-sonnet-4-5'
    smallModel: string      // default: 'anthropic/claude-haiku-3-5'
    autoStart: boolean      // default: true (quando enabled)
  }
}
```

Lifecycle in `src/index.ts`:
- Agent start → if `config.opencode.enabled` → `startOpenCode()`
- Agent stop → `stopOpenCode()`
- Health check include OpenCode status

#### Step 1.5 — Test e validazione (3-4h)

| Test | Criterio |
|------|----------|
| `108ai "crea un file test.ts"` | File creato, risposta streaming |
| `108ai "refactora questo file"` | Edit applicato correttamente |
| Token tracking | I token usati da OpenCode sono conteggiati nel billing |
| Fallback | Se OpenCode non parte, il local agent funziona comunque |
| Timeout | Se OpenCode non risponde in 30s, fallback a locale |

### Effort totale Livello 1

| Step | Ore | Rischio |
|------|-----|---------|
| 1.1 Setup e test | 2h | Basso |
| 1.2 Bridge module | 5h | Basso |
| 1.3 Routing | 4h | Medio (regressioni) |
| 1.4 Config + lifecycle | 2h | Basso |
| 1.5 Test | 4h | Basso |
| **Totale** | **17h** | **Medio** |

### Cosa guadagni

- Multi-model (75+ provider) senza toccare il gateway
- LSP-aware coding (context migliore per LLM)
- MCP server di OpenCode disponibili automaticamente
- Community-maintained coding tools (176K stars, release giornaliere)
- Il tuo agent resta l'orchestratore con le sue specializzazioni

---

## 3. Livello 2 — Architettura MCP-first {#3-livello-2}

### Obiettivo

Convertire le capabilities del local-agent in MCP server standard. Consumare MCP server della community per capabilities non-core. Il local-agent diventa un **MCP host** (come Goose) con layer custom sopra.

### Architettura target

```
┌─────────────────────────────────────────────────────────┐
│  108ai Agent (MCP Host + Orchestratore)                 │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │ Token-Save  │  │ Triage      │  │ Multi-Agent   │   │
│  │ Pipeline    │  │ Engine      │  │ Orchestrator  │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  MCP Client Layer (unified)                     │    │
│  │  - Discovery, lifecycle, tool routing           │    │
│  └────────────┬──────────┬──────────┬──────────────┘    │
└───────────────┼──────────┼──────────┼───────────────────┘
                │          │          │
    ┌───────────▼──┐ ┌─────▼─────┐ ┌──▼──────────────┐
    │ 108ai MCP    │ │ OpenCode  │ │ Community MCP    │
    │ Servers      │ │ (coding)  │ │ Servers          │
    │ (custom)     │ │           │ │                  │
    │ - desktop    │ │           │ │ - playwright     │
    │ - triage     │ │           │ │ - github         │
    │ - pec/fic    │ │           │ │ - google-cal     │
    │ - whatsapp   │ │           │ │ - slack          │
    │ - token-save │ │           │ │ - filesystem     │
    └──────────────┘ └───────────┘ └──────────────────┘
```

### Step di implementazione

#### Step 2.1 — Esporre le capabilities custom come MCP server (8-12h)

Crea `src/mcp-server/` — un MCP server che espone le capabilities UNICHE del local-agent:

```typescript
// src/mcp-server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({
  name: '108ai-capabilities',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
})

// Tool: Desktop Automation
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'desktop.screenshot',
      description: 'Cattura screenshot dello schermo o finestra specifica',
      inputSchema: {
        type: 'object',
        properties: {
          windowTitle: { type: 'string', description: 'Titolo finestra (opzionale)' },
          region: { type: 'object', properties: { x: {type:'number'}, y: {type:'number'}, w: {type:'number'}, h: {type:'number'} } }
        }
      }
    },
    {
      name: 'desktop.click',
      description: 'Click su coordinate o elemento UI',
      inputSchema: { /* ... */ }
    },
    {
      name: 'triage.getDailyBrief',
      description: 'Restituisce il brief giornaliero (email + calendar + tasks prioritizzati)',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'triage.classifyEmail',
      description: 'Classifica urgenza email senza LLM call',
      inputSchema: { /* ... */ }
    },
    {
      name: 'integrations.pec.send',
      description: 'Invia PEC (Posta Elettronica Certificata)',
      inputSchema: { /* ... */ }
    },
    {
      name: 'integrations.fattureInCloud.getInvoices',
      description: 'Recupera fatture da Fatture in Cloud',
      inputSchema: { /* ... */ }
    },
    // ... altre capabilities uniche
  ]
}))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params
  // Routing verso i handler esistenti
  const result = await executeAction(name, args)
  return { content: [{ type: 'text', text: JSON.stringify(result) }] }
})

// Avvio
const transport = new StdioServerTransport()
await server.connect(transport)
```

**Risultato:** le tue capabilities uniche sono consumabili da Claude Desktop, Cursor, Goose, OpenCode, qualsiasi client MCP.

#### Step 2.2 — Upgrade MCP Client layer (6-8h)

Sostituisci il client MCP custom in `src/extensions/mcp/manager.ts` con il client ufficiale:

```bash
npm install @modelcontextprotocol/sdk
```

Nuovo `src/mcp/client-manager.ts`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

interface McpServerConfig {
  type: 'stdio' | 'streamable_http'
  command?: string[]
  url?: string
  env?: Record<string, string>
  enabled: boolean
  timeout?: number
}

export class McpClientManager {
  private clients = new Map<string, Client>()

  async connect(name: string, config: McpServerConfig): Promise<void> {
    const transport = config.type === 'stdio'
      ? new StdioClientTransport({ command: config.command![0], args: config.command!.slice(1), env: config.env })
      : new StreamableHTTPClientTransport(new URL(config.url!))

    const client = new Client({ name: `108ai-${name}`, version: '1.0.0' }, {})
    await client.connect(transport)
    this.clients.set(name, client)
  }

  async listAllTools(): Promise<Array<{ server: string; tool: any }>> {
    const all = []
    for (const [name, client] of this.clients) {
      const { tools } = await client.listTools()
      all.push(...tools.map(t => ({ server: name, tool: t })))
    }
    return all
  }

  async callTool(server: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(server)
    if (!client) throw new Error(`MCP server ${server} not connected`)
    return client.callTool({ name: toolName, arguments: args })
  }
}
```

#### Step 2.3 — Adotta configurazione MCP stile Goose/OpenCode (3h)

Nuovo formato `~/.108ai/mcp.yaml` (compatibile con pattern Goose):

```yaml
# ~/.108ai/mcp.yaml
servers:
  # Coding engine
  opencode:
    type: stdio
    command: ["npx", "opencode", "serve", "--port", "4096"]
    enabled: true
    timeout: 300

  # Browser automation (community)
  playwright:
    type: stdio
    command: ["npx", "@anthropic-ai/mcp-server-playwright"]
    enabled: true
    timeout: 60

  # GitHub (community)
  github:
    type: stdio
    command: ["npx", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
    enabled: true

  # Google Calendar (community)
  google-calendar:
    type: stdio
    command: ["npx", "@anthropic-ai/mcp-server-google-calendar"]
    enabled: false

  # Le TUE capabilities esposte come MCP server
  108ai-desktop:
    type: stdio
    command: ["node", "dist/mcp-server/desktop.js"]
    enabled: true

  108ai-triage:
    type: stdio
    command: ["node", "dist/mcp-server/triage.js"]
    enabled: true

  108ai-integrations:
    type: stdio
    command: ["node", "dist/mcp-server/integrations.js"]
    enabled: true
```

#### Step 2.4 — Sostituisci capabilities commodity con MCP community (4-6h)

| Capability attuale | Sostituisci con | MCP Server |
|---|---|---|
| `filesystem.*` | OpenCode built-in | (incluso in OpenCode) |
| `git.*` | OpenCode built-in | (incluso in OpenCode) |
| `shell.*` | OpenCode built-in | (incluso in OpenCode) |
| `web.fetch` | Community MCP | `@anthropic-ai/mcp-server-fetch` |
| `web.search` | Community MCP | Tavily / Exa Search |
| Chrome/browser | Community MCP | `@anthropic-ai/mcp-server-playwright` |

**NON sostituire (mantieni custom):**
- `desktop.*` (6 livelli con cost routing — nessun equivalente)
- `triage.*` (cross-channel, nessun equivalente)
- `integrations.pec/fattureInCloud/whatsapp` (PMI-specific)
- Token-saving pipeline (nessun equivalente)

#### Step 2.5 — Test di interoperabilità (4h)

| Test | Criterio |
|------|----------|
| Claude Desktop connette al 108ai MCP server | Tools visibili in Claude Desktop |
| Cursor connette al 108ai MCP server | Tools disponibili nell'IDE |
| Il local-agent usa playwright MCP per browser | Navigazione web funziona via MCP |
| Fallback se MCP server non parte | L'agent degrada gracefully |

### Effort totale Livello 2

| Step | Ore | Rischio |
|------|-----|---------|
| 2.1 MCP server custom | 10h | Medio |
| 2.2 MCP client upgrade | 7h | Medio (breaking change) |
| 2.3 Config YAML | 3h | Basso |
| 2.4 Sostituzione commodity | 5h | Medio (regressioni) |
| 2.5 Test interop | 4h | Basso |
| **Totale** | **29h** | **Medio** |

### Cosa guadagni

- **Interoperabilità:** le tue capabilities uniche sono usabili da qualsiasi tool MCP-compatible
- **Manutenzione -40%:** filesystem, git, shell, browser mantenuti dalla community
- **Ecosistema:** 2000+ MCP server disponibili senza codice custom
- **Futureproof:** MCP è sotto Linux Foundation, standard de facto

---

## 4. Livello 3 — Vercel AI SDK Migration {#4-livello-3}

### Obiettivo

Eliminare la dipendenza dal gateway per le chiamate LLM nel local-agent. Passare da `fetch(gateway/api/chat/quick)` a Vercel AI SDK (TypeScript native, 75+ provider, streaming, tool-use type-safe).

### Contesto

Attualmente il local-agent chiama `gateway/api/chat/quick` per TUTTE le interazioni LLM. Questo funziona ma:
- Single point of failure (gateway down = agent muto)
- Latenza aggiuntiva (hop extra)
- Il gateway usa LiteLLM (Python) — stack mismatch

Con Vercel AI SDK il local-agent può chiamare LLM direttamente (per task locali) E continuare a usare il gateway per task che richiedono context server-side (conversazioni persistite, KB search, etc.).

### Architettura target

```
┌───────────────────────────────────────────────┐
│  108ai Local Agent                            │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  LLM Router (nuovo)                    │  │
│  │                                         │  │
│  │  ┌──────────┐  ┌───────────────────┐   │  │
│  │  │ Local    │  │ Gateway (remoto)  │   │  │
│  │  │ AI SDK   │  │ fetch /api/chat   │   │  │
│  │  │ (direct) │  │ (context server)  │   │  │
│  │  └──────────┘  └───────────────────┘   │  │
│  │       │                                 │  │
│  │       ├─ Anthropic (Claude)             │  │
│  │       ├─ OpenAI (GPT-4o)               │  │
│  │       ├─ Google (Gemini)                │  │
│  │       ├─ Ollama (locale, gratuito)      │  │
│  │       └─ Custom (OpenRouter, etc.)      │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### Step di implementazione

#### Step 3.1 — Installazione AI SDK (1h)

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google
# Opzionale per modelli locali:
npm install @ai-sdk/openai-compatible  # per Ollama
```

#### Step 3.2 — LLM Router module (6-8h)

Nuovo `src/llm/router.ts`:

```typescript
import { generateText, streamText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { z } from 'zod'
import { getConfig } from '../config.js'
import { logger } from '../logger.js'

type ModelTier = 'fast-cheap' | 'balanced' | 'powerful'

const TIER_MAP: Record<ModelTier, () => any> = {
  'fast-cheap': () => anthropic('claude-haiku-3-5'),
  'balanced': () => anthropic('claude-sonnet-4-5'),
  'powerful': () => anthropic('claude-opus-4-5'),
}

interface LlmCallOptions {
  prompt: string
  system?: string
  tier?: ModelTier
  model?: string           // override esplicito: 'anthropic/claude-sonnet-4-5'
  stream?: boolean
  tools?: Record<string, any>
  maxTokens?: number
}

export async function callLlm(opts: LlmCallOptions) {
  const config = getConfig()
  const model = resolveModel(opts.tier ?? 'balanced', opts.model)

  // Token tracking
  const startTime = Date.now()

  if (opts.stream) {
    const result = await streamText({
      model,
      system: opts.system,
      prompt: opts.prompt,
      maxTokens: opts.maxTokens ?? 4096,
      tools: opts.tools,
    })
    return result
  }

  const result = await generateText({
    model,
    system: opts.system,
    prompt: opts.prompt,
    maxTokens: opts.maxTokens ?? 4096,
    tools: opts.tools,
  })

  // Log token usage
  logger.info({
    model: opts.model ?? opts.tier,
    inputTokens: result.usage.promptTokens,
    outputTokens: result.usage.completionTokens,
    durationMs: Date.now() - startTime,
  }, 'LLM call completed')

  return result
}

function resolveModel(tier: ModelTier, explicit?: string) {
  if (explicit) {
    const [provider, modelId] = explicit.split('/')
    switch (provider) {
      case 'anthropic': return anthropic(modelId)
      case 'openai': return openai(modelId)
      case 'google': return google(modelId)
      case 'ollama': return createOpenAICompatible({
        name: 'ollama', baseURL: 'http://localhost:11434/v1'
      })(modelId)
      default: return anthropic(modelId)
    }
  }
  return TIER_MAP[tier]()
}

// Routing decision: locale vs gateway
export function shouldCallLocal(context: { hasServerContext: boolean; isSimpleQuery: boolean }): boolean {
  // Locale se: query semplice senza bisogno di KB/conversazione persistita
  if (context.isSimpleQuery && !context.hasServerContext) return true
  // Gateway se: serve RAG, KB, conversazione multi-turn persistita
  return false
}
```

#### Step 3.3 — Integra nel token-saving pipeline (3-4h)

Il token-saving pipeline attuale:
```
Input → Local Router (zero-token) → Saved Scripts → Cache → Gateway LLM
```

Diventa:
```
Input → Local Router (zero-token) → Saved Scripts → Cache → [LLM Router]
                                                                  │
                                                      ┌───────────┴───────────┐
                                                      │                       │
                                                Local AI SDK            Gateway
                                              (query semplici,       (RAG, KB,
                                               no server context)    conversazioni)
```

#### Step 3.4 — Modelli locali via Ollama (2-3h)

```typescript
// In config: modelli locali per task a token-zero
opencode: {
  localModels: {
    enabled: true,
    provider: 'ollama',
    models: {
      'fast': 'qwen2.5-coder:7b',    // Code completion
      'medium': 'llama3.1:8b',        // General purpose
    }
  }
}
```

**Vantaggio:** per task semplici (classificazione, estrazione, formatting), zero costi API.

#### Step 3.5 — Test e validazione (3h)

| Test | Criterio |
|------|----------|
| Query semplice → locale | Risposta da AI SDK, zero chiamate gateway |
| Query con context → gateway | Passa al gateway come prima |
| Ollama fallback | Se Ollama non è attivo, fallback a cloud |
| Token tracking accurato | Billing corretto per entrambi i path |
| Stream funziona | SSE streaming per risposte lunghe |

### Effort totale Livello 3

| Step | Ore | Rischio |
|------|-----|---------|
| 3.1 Setup | 1h | Basso |
| 3.2 LLM Router | 7h | Medio |
| 3.3 Token-saving integration | 4h | Medio |
| 3.4 Ollama | 3h | Basso |
| 3.5 Test | 3h | Basso |
| **Totale** | **18h** | **Medio** |

### Cosa guadagni

- **Zero dipendenza Python** per LLM (elimini LiteLLM gateway come SPOF)
- **Multi-model nativo** (75+ provider, type-safe)
- **Modelli locali** per task economici (Ollama, zero costi)
- **Resilienza:** se gateway è down, l'agent fa comunque task locali
- **Token tracking** più preciso (Vercel AI SDK ha `.usage` built-in)

---

## 5. Matrice Build vs Buy finale {#5-matrice}

| Componente | Stato attuale | Dopo integrazione | Fonte |
|---|---|---|---|
| **Coding (fs/git/shell/code)** | Custom handlers | OpenCode (MIT, 176K★) | Livello 1 |
| **LLM routing** | Gateway HTTP (LiteLLM) | Vercel AI SDK (TS native) | Livello 3 |
| **Browser automation** | Custom CDP wrapper | Playwright MCP server | Livello 2 |
| **MCP client** | Custom impl. | Official SDK | Livello 2 |
| **MCP server (esporre capabilities)** | Non presente | Nuovo modulo | Livello 2 |
| **Token-saving pipeline** | Custom (MANTIENI) | — | Moat |
| **Desktop automation 6 lvl** | Custom (MANTIENI) | — | Moat |
| **Triage engine** | Custom (MANTIENI) | — | Moat |
| **PEC/FattureInCloud/WhatsApp** | Custom (MANTIENI) | — | Moat (PMI) |
| **Multi-tenant isolation** | Custom (MANTIENI) | — | Moat (SaaS) |
| **Job scheduling** | Custom | Valuta BullMQ (futuro) | Opzionale |
| **Multi-agent orchestration** | Custom | Valuta LangGraph (futuro) | Opzionale |

---

## 6. Rischi e mitigazioni {#6-rischi}

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| OpenCode ha breaking change nell'SDK | Media | Medio | Pin versione, test CI su upgrade |
| OpenCode server lento a partire (cold start) | Media | Basso | Lazy start, pre-warm su agent boot |
| MCP community server instabili | Media | Basso | Fallback a handler locali |
| Vercel AI SDK major bump | Media | Medio | Pin versione, abstract via router |
| Vendor lock-in su Anthropic per OpenCode | Bassa (75+ provider) | Basso | OpenCode è multi-model by design |
| Complessità aggiunta (più componenti) | Alta | Medio | Feature flag per ogni livello, rollback immediato |

### Strategia di rollback

Ogni livello è opt-in via config:

```json
{
  "opencode": { "enabled": false },
  "mcpFirst": { "enabled": false },
  "localLlm": { "enabled": false }
}
```

Se qualcosa non funziona → disabilita il flag → torna al comportamento precedente. Zero modifiche distruttive.

---

## 7. Timeline e dipendenze {#7-timeline}

```
Settimana 1-2: Livello 1 (OpenCode bridge)
  └── Prerequisito: nessuno
  └── Output: coding tasks delegati a OpenCode

Settimana 3-4: Livello 3 (Vercel AI SDK)
  └── Prerequisito: nessuno (indipendente da L1)
  └── Output: LLM routing locale + Ollama

Settimana 5-7: Livello 2 (MCP-first)
  └── Prerequisito: Livello 1 completato (OpenCode = primo MCP server)
  └── Output: capabilities esposte come MCP, community servers integrati

Settimana 8: Integration testing + documentazione
  └── Output: tutto funziona insieme, docs aggiornati
```

### Dipendenze esterne

| Cosa | Dove | Azione |
|------|------|--------|
| API key Anthropic | env `ANTHROPIC_API_KEY` | Già presente |
| `@opencode-ai/sdk` npm | npmjs.com | `npm install` |
| `@modelcontextprotocol/sdk` npm | npmjs.com | `npm install` |
| `ai` + provider packages | npmjs.com | `npm install` |
| Ollama (opzionale) | ollama.com | Install locale |

### Effort complessivo

| Livello | Ore | Valore |
|---------|-----|--------|
| 1 — OpenCode | 17h | Multi-model coding, LSP, 176K★ community |
| 2 — MCP-first | 29h | Interoperabilità, -40% manutenzione |
| 3 — AI SDK | 18h | Zero Python dep, Ollama, resilienza |
| **Totale** | **64h** | **~8 giorni lavorativi** |

---

## Prossimi passi — AGGIORNATO (Opzione B: Embed)

**Decisione 2026-06-19:** Opzione B approvata — embed capabilities, zero dipendenze runtime esterne.

### Stato implementazione

| # | Modulo | Stato | File creati |
|---|--------|-------|-------------|
| 1 | Fuzzy Edit Engine (9 strategie) | ✅ COMPLETATO | `src/capabilities/fuzzy-edit.ts` + test (14/14 pass) |
| 2 | AI SDK Direct (tool-use nativo) | ✅ COMPLETATO | `src/llm/ai-sdk-direct.ts` |
| 3 | Coding Tools (6 tool nativi) | ✅ COMPLETATO | `src/llm/coding-tools.ts` (con LSP post-edit diagnostics) |
| 4 | Coding Agent (loop orchestratore) | ✅ COMPLETATO | `src/llm/coding-agent.ts` |
| 5 | Provider Transform (normalizzazione) | ✅ COMPLETATO | `src/llm/provider-transform.ts` (wired in ai-sdk-direct) |
| 6 | LSP Server Registry | ✅ COMPLETATO | `src/lsp/servers.ts` (8 server: TS, Python, Rust, Go, C#, JSON, HTML, CSS) |
| 7 | LSP Client Protocol | ✅ COMPLETATO | `src/lsp/client.ts` + `src/lsp/manager.ts` + `src/lsp/index.ts` |
| 8 | MCP Server (esporre capabilities) | ✅ COMPLETATO | `src/mcp-server/index.ts` + `src/mcp-server/tools.ts` (10 tool) |

**Type-check:** `tsc --noEmit` passa con 0 errori su tutto il progetto.

### Wiring completato

- `provider-transform` integrato in `ai-sdk-direct.ts` (sia `callDirectLlm` che `streamDirectLlm`)
- LSP diagnostics integrato in `coding-tools.ts` editFile (post-edit verification non-bloccante)
- `src/llm/index.ts` esporta tutti i moduli (ai-sdk-direct, coding-tools, coding-agent, provider-transform)
- `src/lsp/index.ts` barrel export per getDiagnostics, getDefinition, getReferences, getHover, stopAll

### Cosa e' cambiato rispetto al piano originale

- **Non** usiamo OpenCode come subprocess — abbiamo estratto i pattern migliori (MIT)
- `@opencode-ai/sdk` rimane installato come reference ma non viene usato a runtime
- Il fuzzy edit engine (derivato da OpenCode MIT) e' integrato in `editFile()`
- Il tool-use loop e' nativo via Vercel AI SDK v6 (`generateText` + `stopWhen`)
- Model routing diretto (Anthropic/OpenAI/Google/Ollama/DeepSeek) senza gateway
- LSP fornisce diagnostiche real-time post-edit (se language server disponibile)
- MCP server espone 10 tool unici 108ai (desktop, triage, PEC, fatture, local-execute)

### Modulo Cloud (Opzione 1: E2B Sandboxes) — COMPLETATO

| # | File | Funzione |
|---|------|----------|
| 9 | `src/cloud/sandbox.ts` | Interfaccia astratta provider-agnostic |
| 10 | `src/cloud/e2b-provider.ts` | Implementazione E2B (Firecracker VM, ~300ms boot) |
| 11 | `src/cloud/sandbox-tools.ts` | Tool identici al locale ma eseguiti in sandbox |
| 12 | `src/cloud/session-manager.ts` | Lifecycle: create/run/destroy, idle cleanup |
| 13 | `src/cloud/index.ts` | Barrel exports |
| 14 | `src/cloud/cloud-coding.test.ts` | Integration test E2E (richiede E2B_API_KEY) |
| 15 | `src/llm/coding-agent.test.ts` | Integration test locale (richiede ANTHROPIC_API_KEY) |

**Test suite:** 27 file passati, 81 test OK, 11 skipped (API key-gated). `tsc --noEmit` = 0 errori.

### Prossimi passi potenziali

1. **MCP config file** (`~/.108ai/mcp.yaml`): configurazione community MCP servers
2. **Rimuovere `@opencode-ai/sdk`** da dependencies (non usato runtime)
3. **Wiring MCP client**: consumare server MCP esterni dal coding-agent
4. **Unit test per provider-transform e LSP modules**
5. **Gateway HTTP endpoint**: esporre `createCloudSession` / `runCloudCodingTask` via REST
6. **Workspace persistence**: snapshot S3 tra sessioni (resume lavoro)

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
