# 108ai Coding Engine — Guida Setup Completa

**Versione:** 1.1
**Data:** 2026-06-19
**Stato:** Implementato e verificato (tsc 0 errori, 81/81 test pass)

---

## Indice

0. [Quick Start — Avvio completo in locale](#0-quick-start)
1. [Overview architettura](#1-overview-architettura)
2. [Prerequisiti](#2-prerequisiti)
3. [Setup ambiente](#3-setup-ambiente)
4. [Componente 1: Fuzzy Edit Engine](#4-fuzzy-edit-engine)
5. [Componente 2: AI SDK Direct](#5-ai-sdk-direct)
6. [Componente 3: Provider Transform](#6-provider-transform)
7. [Componente 4: Coding Tools](#7-coding-tools)
8. [Componente 5: Coding Agent](#8-coding-agent)
9. [Componente 6: LSP Integration](#9-lsp-integration)
10. [Componente 7: MCP Server](#10-mcp-server)
11. [Componente 8: Cloud Sandbox (E2B)](#11-cloud-sandbox)
12. [Configurazione agente](#12-configurazione-agente)
13. [Test e verifica](#13-test-e-verifica)
14. [Troubleshooting](#14-troubleshooting)
15. [Costi e billing](#15-costi-e-billing)

---

## 0. Quick Start — Avvio completo in locale

### Cosa serve installato sulla macchina

| Software | Versione min. | Verifica |
|----------|--------------|----------|
| Node.js | 20+ | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Docker Desktop | 4+ | `docker --version` |
| Docker Compose | 2+ | `docker compose version` |
| Git | 2+ | `git --version` |

### Step 1 — Clone e setup iniziale (una sola volta)

```bash
# Clone
git clone <repo-url> aia-platform
cd aia-platform

# Crea .env dalle variabili di esempio
cp .env.example .env
```

### Step 2 — Configura le API key nel file `.env`

Apri `.env` e inserisci **almeno UNA** API key LLM:

```bash
# MINIMO per funzionare (scegli uno):
DEEPSEEK_API_KEY=sk-xxx              # DeepSeek (piu' economico)
# oppure
ANTHROPIC_API_KEY=sk-ant-api03-xxx   # Anthropic (migliore qualita')

# CONSIGLIATO per piattaforma completa:
DEEPSEEK_API_KEY=sk-xxx              # Provider primario (economico)
ANTHROPIC_API_KEY=sk-ant-xxx         # Provider premium
POSTGRES_PASSWORD=una-password-sicura
JWT_SECRET=stringa-casuale-min-32-caratteri
LITELLM_MASTER_KEY=sk-108ai-master-xxx
```

### Step 3 — Avvia TUTTO con un comando

```bash
# Avvia infrastruttura Docker + applicazioni (tutto insieme)
make dev
```

Questo comando fa in sequenza:
1. Avvia Docker containers (PostgreSQL, Redis, Qdrant, LiteLLM, Traefik)
2. Aspetta che siano healthy
3. Avvia le app Node.js (gateway, dashboard, client)

### Step 4 — Verifica che tutto sia up

```bash
make dev-status
```

Output atteso:

```
[ OK ] PostgreSQL        → localhost:5432 (healthy)
[ OK ] Redis             → localhost:6379 (healthy)
[ OK ] Qdrant            → localhost:6333 (healthy)
[ OK ] LiteLLM Gateway   → localhost:4000 (healthy)
[ OK ] API Gateway       → localhost:3000
[ OK ] Dashboard         → localhost:5173
```

### Step 5 — Testa il coding engine (indipendente dalla piattaforma)

Il coding engine **non richiede Docker** — funziona standalone con solo una API key:

```bash
cd apps/local-agent

# Verifica compilazione
./node_modules/.bin/tsc --noEmit

# Esegui tutti i test (quelli senza API key passano sempre)
npx vitest run

# Test coding agent con LLM reale (~$0.02)
ANTHROPIC_API_KEY=sk-ant-... npx vitest run src/llm/coding-agent.test.ts
```

### Step 6 — Usa il coding agent da codice

```typescript
// Crea un file test-local.mjs nella root di apps/local-agent:
import { runCodingAgent } from './src/llm/coding-agent.js';

const result = await runCodingAgent({
  task: 'Create a file hello.ts with a function that adds two numbers',
  config: {
    allowedDirectories: ['/tmp/108ai-test'],
    shellEnabled: true,
    desktopEnabled: false,
    desktopVisionEnabled: false,
  },
  tier: 'fast-cheap',  // usa Haiku (~$0.005 per task)
});

console.log('Response:', result.response);
console.log('Tools used:', result.toolCalls.map(t => t.name));
console.log('Tokens:', result.usage.totalTokens);
```

### Comandi utili quotidiani

| Comando | Cosa fa |
|---------|---------|
| `make dev` | Avvia tutto (infra + app) |
| `make dev-skip` | Avvia solo app (Docker gia' running) |
| `make dev-stop` | Ferma tutto |
| `make dev-status` | Mostra stato con health check |
| `make logs` | Segui log Docker in tempo reale |
| `make psql` | Apri shell PostgreSQL |
| `make redis` | Apri shell Redis |
| `make llm-health` | Verifica LiteLLM |
| `make llm-models` | Lista modelli disponibili |
| `make llm-test` | Invia richiesta test al gateway AI |

### Fermare tutto

```bash
# Ferma app + infrastruttura
make dev-stop

# Oppure solo Docker (app si fermano da sole)
make down

# Pulizia totale (CANCELLA DATI locali — volumes Docker)
make clean
```

### Modalita' "solo coding engine" (senza Docker)

Se vuoi usare **solo** il coding agent (senza gateway, DB, ecc.):

```bash
cd aia-platform/apps/local-agent

# Non serve Docker. Non serve make dev. Solo la API key:
export ANTHROPIC_API_KEY="sk-ant-..."

# E poi usa direttamente:
npx vitest run                                    # test
npx tsx src/llm/coding-agent.test.ts             # test singolo
```

Il coding engine e' **completamente autonomo**: chiama LLM direttamente (Vercel AI SDK), opera sul filesystem locale, non dipende dal gateway ne' da Docker.

---

## 1. Overview architettura

```
┌───────────────────────────────────────────────────────────────────┐
│  108ai Coding Engine                                              │
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐  │
│  │ Coding Agent │────▶│ AI SDK Direct│────▶│ Provider Transform│  │
│  │ (orchestr.)  │     │ (LLM calls)  │     │ (normalizzazione) │  │
│  └──────┬───────┘     └──────────────┘     └──────────────────┘  │
│         │                                                         │
│         │ tool calls                                              │
│         ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Coding Tools (6 tool nativi)                            │     │
│  │  readFile │ writeFile │ editFile │ listDir │ grep │ shell│     │
│  └──────┬──────────┬────────────────────────────────────────┘     │
│         │          │                                              │
│         ▼          ▼                                              │
│  ┌────────────┐  ┌─────────┐     ┌───────────────┐               │
│  │Fuzzy Edit  │  │  LSP    │     │  MCP Server   │               │
│  │(9 strategy)│  │(diagnos)│     │(10 tool ext.) │               │
│  └────────────┘  └─────────┘     └───────────────┘               │
│                                                                   │
│  ────── CLOUD MODE ──────                                         │
│  ┌──────────────────────────────────────┐                         │
│  │  Session Manager → E2B Sandbox       │                         │
│  │  (stessa logica, execution remota)   │                         │
│  └──────────────────────────────────────┘                         │
└───────────────────────────────────────────────────────────────────┘
```

**Principio fondamentale:** il coding agent usa gli **stessi tool** sia in locale che in cloud. Cambia solo il backend di esecuzione (filesystem locale vs sandbox E2B).

---

## 2. Prerequisiti

| Requisito | Versione | Note |
|-----------|----------|------|
| Node.js | 20+ | Runtime |
| pnpm | 9+ | Package manager del monorepo |
| TypeScript | 5.5+ | Installato come devDependency |
| Git | 2.x | Per clone repo in sandbox |

**API Key (almeno una obbligatoria per LLM):**

| Provider | Env Variable | Dove ottenerla |
|----------|-------------|----------------|
| Anthropic | `ANTHROPIC_API_KEY` | console.anthropic.com |
| OpenAI | `OPENAI_API_KEY` | platform.openai.com |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` | aistudio.google.com |
| DeepSeek | `DEEPSEEK_API_KEY` | platform.deepseek.com |
| E2B (cloud) | `E2B_API_KEY` | e2b.dev |
| Ollama (local) | nessuna | ollama.com (run locale) |

---

## 3. Setup ambiente

```bash
# 1. Clone monorepo (se non hai gia')
git clone <repo-url> aia-platform
cd aia-platform

# 2. Installa dipendenze
pnpm install --config.blockExoticSubdeps=false

# 3. Posizionati nel local-agent
cd apps/local-agent

# 4. Verifica compilazione
./node_modules/.bin/tsc --noEmit
# Output atteso: nessun errore

# 5. Verifica test
npx vitest run
# Output atteso: 27 file pass, 81 test OK (11 skipped senza API key)

# 6. Configura API key
export ANTHROPIC_API_KEY="sk-ant-api03-..."
# oppure in ~/.108ai/config.json (vedi sezione 12)
```

---

## 4. Fuzzy Edit Engine

**File:** `src/capabilities/fuzzy-edit.ts`
**Test:** `src/capabilities/fuzzy-edit.test.ts` (14 test)

### Cosa fa

Risolve il problema #1 degli LLM code editors: il modello genera `oldString` con whitespace/indent leggermente diversi dal file reale. Invece di fallire, prova 9 strategie in cascata:

| # | Strategia | Quando serve |
|---|-----------|-------------|
| 1 | `simpleReplacer` | Match esatto (baseline) |
| 2 | `lineTrimmedReplacer` | Differenze trailing whitespace |
| 3 | `blockAnchorReplacer` | Prima/ultima riga OK, mezzo approssimato |
| 4 | `whitespaceNormalizedReplacer` | Spazi vs tab, multipli spazi |
| 5 | `indentationFlexibleReplacer` | Indent diverso (2 vs 4 spaces) |
| 6 | `escapeNormalizedReplacer` | Escape sequences diverse |
| 7 | `trimmedBoundaryReplacer` | Righe vuote in piu'/meno ai bordi |
| 8 | `contextAwareReplacer` | Usa contesto circostante per disambiguare |
| 9 | `multiOccurrenceReplacer` | Gestisce match multipli |

### Come usarlo

```typescript
import { fuzzyReplace, FuzzyEditError } from './capabilities/fuzzy-edit.js';

const result = fuzzyReplace(fileContent, oldString, newString);
// result.content  → contenuto aggiornato
// result.strategy → quale strategia ha matchato

// Con opzioni
const result2 = fuzzyReplace(content, old, new, { replaceAll: true });
```

### Errori possibili

- `FuzzyEditError` con code `NOT_FOUND` — nessuna strategia ha trovato il testo
- `FuzzyEditError` con code `MULTIPLE_MATCHES` — ambiguita', serve oldString piu' preciso

### Verifica

```bash
npx vitest run src/capabilities/fuzzy-edit.test.ts
# 14 test, tutti pass
```

---

## 5. AI SDK Direct

**File:** `src/llm/ai-sdk-direct.ts`

### Cosa fa

Chiamate LLM dirette via Vercel AI SDK v6 (bypassando il gateway per task locali). Supporta:
- Multi-turn tool-use loop nativo (`stopWhen: stepCountIs(N)`)
- 5 provider (Anthropic, OpenAI, Google, Ollama, DeepSeek)
- Model routing per tier
- Token tracking automatico

### Tier disponibili

| Tier | Provider | Modello | Costo/1M token |
|------|----------|---------|----------------|
| `fast-cheap` | Anthropic | claude-haiku-4-5 | ~$0.25/$1.25 |
| `balanced` | Anthropic | claude-sonnet-4-6 | ~$3/$15 |
| `powerful` | Anthropic | claude-opus-4-8 | ~$15/$75 |
| `coding` | Anthropic | claude-sonnet-4-6 | ~$3/$15 |
| `local` | Ollama | qwen2.5-coder:7b | $0 (locale) |

### Come usarlo

```typescript
import { callDirectLlm, streamDirectLlm } from './llm/ai-sdk-direct.js';

// Chiamata singola
const result = await callDirectLlm({
  messages: [{ role: 'user', content: 'Explain this code...' }],
  system: 'You are a code reviewer.',
  tier: 'fast-cheap',
  maxTokens: 4096,
});

// Streaming
for await (const chunk of streamDirectLlm({ messages, tier: 'balanced' })) {
  process.stdout.write(chunk);
}
```

### Configurazione provider alternativi

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Google Gemini
export GOOGLE_GENERATIVE_AI_API_KEY="..."

# DeepSeek
export DEEPSEEK_API_KEY="..."

# Ollama (deve essere in esecuzione)
export OLLAMA_BASE_URL="http://localhost:11434/v1"  # default
ollama pull qwen2.5-coder:7b
```

### Uso con modello specifico

```typescript
// Override del tier con modello esplicito
const result = await callDirectLlm({
  messages,
  model: 'openai/gpt-4o',        // provider/modelId
  // oppure: 'google/gemini-2.0-flash'
  // oppure: 'ollama/qwen2.5-coder:7b'
});
```

---

## 6. Provider Transform

**File:** `src/llm/provider-transform.ts`

### Cosa fa

Normalizza i messaggi per evitare errori silenti provider-specifici:

| Provider | Problema | Fix |
|----------|----------|-----|
| Anthropic | Content block vuoti → 400 | Filtra automaticamente |
| Anthropic | Niente caching → costo doppio | Applica `ephemeral` cache hints |
| OpenAI | Tool call ID con caratteri invalidi | Scrub a `[a-zA-Z0-9_-]` |
| Gemini | Integer enum, type array, const | Sanitizza schema JSON |
| Tutti | Lone surrogate characters → crash | Replace con U+FFFD |

### Wiring

E' **gia' integrato** in `ai-sdk-direct.ts` — ogni chiamata LLM passa automaticamente per il transform. Non serve azione manuale.

### Uso standalone (per tool schema Gemini)

```typescript
import { sanitizeGeminiSchema } from './llm/provider-transform.js';

const cleanSchema = sanitizeGeminiSchema(myToolSchema);
```

---

## 7. Coding Tools

**File:** `src/llm/coding-tools.ts`

### Cosa fa

6 tool nativi che il coding-agent passa all'LLM per operare sul filesystem:

| Tool | Operazione | Note |
|------|-----------|------|
| `readFile` | Legge file (con range righe) | Line numbers in output |
| `writeFile` | Crea nuovi file | Crea parent dirs |
| `editFile` | Modifica chirurgica | Usa fuzzy-edit + LSP post-edit |
| `listDirectory` | Lista contenuto dir | Con tipi e dimensioni |
| `grep` | Cerca regex nei file | Limita a 50 match |
| `shell` | Esegue comando shell | Sandboxed a allowedDirectories |

### LSP Post-Edit Diagnostics

Dopo ogni `editFile`, il tool automaticamente:
1. Rileva il linguaggio dal file extension
2. Avvia il language server appropriato (se disponibile)
3. Invia il file modificato per analisi
4. Ritorna eventuali errori al LLM

Questo permette all'LLM di **auto-correggersi** nel turno successivo.

### Sicurezza

- `readFile`/`editFile`/`writeFile` validano il path contro `config.allowedDirectories`
- `shell` esegue solo nella directory radice consentita, con timeout 60s e buffer 1MB
- Nessun tool puo' accedere fuori dal perimetro configurato

---

## 8. Coding Agent

**File:** `src/llm/coding-agent.ts`
**Test:** `src/llm/coding-agent.test.ts` (5 test, richiede ANTHROPIC_API_KEY)

### Cosa fa

Orchestratore multi-turn: invia task all'LLM, l'LLM usa i tool, ripete fino a completamento (max N roundtrip).

### Come usarlo

```typescript
import { runCodingAgent } from './llm/coding-agent.js';
import { loadConfig } from './config.js';

const config = loadConfig()!;

const result = await runCodingAgent({
  task: 'Fix the type error in src/auth.ts line 42',
  config,
  tier: 'coding',           // default: 'coding' (Sonnet)
  maxRoundtrips: 15,        // default: 15
  context: 'This is a Node.js Express app using TypeScript',  // opzionale
});

console.log(result.response);      // Spiegazione finale dell'LLM
console.log(result.toolCalls);     // Array di tool chiamati
console.log(result.usage);         // { inputTokens, outputTokens, totalTokens }
console.log(result.model);         // es. "anthropic/claude-sonnet-4-6"
console.log(result.roundtrips);    // Quanti turni ha usato
```

### Parametri

| Param | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `task` | string | (obbligatorio) | Cosa deve fare l'agente |
| `config` | AgentConfig | (obbligatorio) | Configurazione con allowedDirectories |
| `tier` | ModelTier | `'coding'` | Modello da usare |
| `model` | string | — | Override esplicito (es. `'openai/gpt-4o'`) |
| `maxRoundtrips` | number | 15 | Max turni tool-use |
| `systemPrompt` | string | (built-in) | Override system prompt |
| `context` | string | — | Contesto aggiuntivo pre-task |

### Test locale

```bash
ANTHROPIC_API_KEY=sk-ant-... npx vitest run src/llm/coding-agent.test.ts
# 5 test: crea file, legge, edita, shell, grep
# Costo: ~$0.02-0.03
# Durata: ~30-60s
```

---

## 9. LSP Integration

**File:**
- `src/lsp/servers.ts` — Registry di 8 language server
- `src/lsp/client.ts` — Client JSON-RPC con Content-Length framing
- `src/lsp/manager.ts` — Manager singleton (lazy-start, auto-detect)
- `src/lsp/index.ts` — Barrel exports

### Language server supportati

| Linguaggio | Server | Comando | Root markers |
|-----------|--------|---------|--------------|
| TypeScript/JS | typescript-language-server | `typescript-language-server --stdio` | tsconfig.json, package.json |
| Python | pyright | `pyright-langserver --stdio` | pyrightconfig.json, setup.py |
| Rust | rust-analyzer | `rust-analyzer` | Cargo.toml |
| Go | gopls | `gopls serve` | go.mod |
| C# | csharp-ls | `csharp-ls` | *.sln, *.csproj |
| JSON | vscode-json-languageserver | `vscode-json-languageserver --stdio` | package.json |
| HTML | vscode-html-languageserver | `vscode-html-languageserver --stdio` | index.html |
| CSS | vscode-css-languageserver | `vscode-css-languageserver --stdio` | — |

### Prerequisiti per LSP

I language server devono essere installati globalmente:

```bash
# TypeScript
npm install -g typescript-language-server typescript

# Python
pip install pyright

# Rust
rustup component add rust-analyzer

# Go
go install golang.org/x/tools/gopls@latest

# C#
dotnet tool install --global csharp-ls
```

### Come usarlo (standalone)

```typescript
import { getDiagnostics, getDefinition, getHover, stopAll } from './lsp/index.js';

// Diagnostiche dopo edit
const errors = await getDiagnostics('/path/to/file.ts', fileContent, 5000);
// errors = [{ range, severity, message, source }]

// Go to definition
const locations = await getDefinition('/path/to/file.ts', 10, 5);

// Hover info
const info = await getHover('/path/to/file.ts', 10, 5);

// Cleanup
await stopAll();
```

### Note

- Il manager avvia i server **on-demand** (la prima richiesta per un linguaggio avvia il server)
- I server restano attivi per richieste successive (stesso progetto)
- Se un server non e' installato, le API ritornano array vuoti (non bloccano)
- L'integrazione in `coding-tools.ts` editFile e' **non-bloccante** — se LSP fallisce, l'edit viene comunque applicato

---

## 10. MCP Server

**File:**
- `src/mcp-server/index.ts` — Entry point (Server + StdioServerTransport)
- `src/mcp-server/tools.ts` — 10 tool definitions + dispatch

### Cosa fa

Espone le capability **uniche** di 108ai come server MCP standard, consumabile da qualsiasi client MCP (Claude Desktop, Cursor, Zed, ecc.).

### Tool esposti

| Tool | Categoria | Descrizione |
|------|-----------|-------------|
| `desktop_screenshot` | Desktop | Screenshot schermo/finestra |
| `desktop_click` | Desktop | Click a coordinate |
| `desktop_type` | Desktop | Digitazione testo |
| `desktop_keypress` | Desktop | Shortcut tastiera |
| `triage_daily_brief` | Triage | Brief giornaliero email+calendar |
| `triage_classify_email` | Triage | Classificazione urgenza (rule-based) |
| `pec_send` | Integrations | Invio PEC |
| `fatture_in_cloud_invoices` | Integrations | Lettura fatture |
| `local_execute` | Token-saving | Esecuzione locale senza LLM |

### Come avviare il server MCP

```typescript
import { startMcpServer } from './mcp-server/index.js';
await startMcpServer();
// Il server ascolta su stdio (standard MCP)
```

### Configurazione in Claude Desktop

Aggiungi in `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "108ai": {
      "command": "node",
      "args": ["path/to/aia-platform/apps/local-agent/dist/mcp-server/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### Configurazione in Cursor / Zed

```json
{
  "mcp": {
    "servers": {
      "108ai": {
        "command": "node",
        "args": ["path/to/dist/mcp-server/index.js"]
      }
    }
  }
}
```

---

## 11. Cloud Sandbox (E2B)

**File:**
- `src/cloud/sandbox.ts` — Interfaccia astratta
- `src/cloud/e2b-provider.ts` — Provider E2B
- `src/cloud/sandbox-tools.ts` — Tool per sandbox remota
- `src/cloud/session-manager.ts` — Lifecycle manager
- `src/cloud/index.ts` — Barrel exports
- `src/cloud/cloud-coding.test.ts` — Test E2E

### Cosa fa

Stessa esperienza del coding agent locale, ma eseguita in una **VM Linux effimera** (E2B, basato su Firecracker). Ogni sessione e' isolata. Boot ~300ms.

### Setup

```bash
# 1. Registrati su e2b.dev e copia la API key
export E2B_API_KEY="e2b_..."

# 2. (Opzionale) Crea template custom con tool preinstallati
# Altrimenti usa il default di E2B
```

### Come usarlo

```typescript
import {
  createCloudSession,
  runCloudCodingTask,
  destroySession,
  getActiveSessions,
} from './cloud/index.js';

// 1. Crea sessione (boot sandbox ~300ms)
const sessionId = await createCloudSession({
  tenantId: 'my-company',
  repoUrl: 'https://github.com/user/repo.git',  // opzionale: clona repo
  branch: 'feature/xyz',                         // opzionale
  timeoutMs: 600_000,                            // 10 min (default)
});

// 2. Esegui coding task
const result = await runCloudCodingTask(
  sessionId,
  'Add input validation to the POST /users endpoint',
  {
    tier: 'coding',       // Sonnet 4.6
    maxRoundtrips: 10,
    context: 'This is an Express.js + Zod app',
  },
);

// 3. Monitora sessioni attive
const active = getActiveSessions('my-company');
console.log(active); // [{ sessionId, sandboxId, ageMs, idleMs }]

// 4. Distruggi quando finito (o aspetta idle timeout automatico)
await destroySession(sessionId);
```

### Idle cleanup automatico

Le sessioni inattive per piu' di 10 minuti vengono distrutte automaticamente. Il timer parte alla creazione della prima sessione e si ferma quando non ci sono piu' sessioni attive.

### Test E2E

```bash
E2B_API_KEY=e2b_... ANTHROPIC_API_KEY=sk-ant-... npx vitest run src/cloud/cloud-coding.test.ts
# 6 test: create, write file, read file, edit file, shell, destroy
# Costo: ~$0.03 (sandbox + LLM)
# Durata: ~30-60s
```

---

## 12. Configurazione agente

**Path:** `~/.108ai/config.json`

```json
{
  "gatewayUrl": "ws://localhost:3000/ws",
  "authToken": "your-jwt-token",
  "tenantId": "your-tenant-id",
  "allowedDirectories": [
    "/home/user/projects",
    "/home/user/Documents"
  ],
  "autoStart": false,
  "desktopEnabled": false,
  "desktopVisionEnabled": true,
  "screenshotBeforeAction": true,
  "shellEnabled": true,
  "shellBlocklist": ["rm -rf /", "format"],
  "shellDefaultTimeout": 120000,
  "gitEnabled": true,
  "gitAllowPush": false,
  "gitAllowDestructive": false,
  "riskPreferences": {
    "autoApproveReadOnly": true,
    "autoApproveLowRisk": true,
    "requireApprovalHighRisk": true
  },
  "maxActionsPerMinute": 10
}
```

### Campi chiave

| Campo | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `allowedDirectories` | string[] | ~/Documents, ~/Desktop | Directory accessibili ai tool |
| `shellEnabled` | boolean | false | Abilita tool shell |
| `desktopEnabled` | boolean | false | Abilita desktop automation |
| `desktopVisionEnabled` | boolean | true | LLM analysis su screenshot |
| `gitAllowPush` | boolean | false | Permetti git push |
| `maxActionsPerMinute` | number | 10 | Rate limit azioni |

### Variabili d'ambiente

| Env | Priorita' | Descrizione |
|-----|-----------|-------------|
| `ANTHROPIC_API_KEY` | — | API key Anthropic (Sonnet/Haiku/Opus) |
| `OPENAI_API_KEY` | — | API key OpenAI |
| `GOOGLE_GENERATIVE_AI_API_KEY` | — | API key Google AI |
| `DEEPSEEK_API_KEY` | — | API key DeepSeek |
| `OLLAMA_BASE_URL` | http://localhost:11434/v1 | URL Ollama locale |
| `E2B_API_KEY` | — | API key E2B (solo cloud) |
| `AIA_GATEWAY_URL` | http://localhost:3000 | Override gateway URL |

---

## 13. Test e verifica

### Test rapidi (nessuna API key)

```bash
cd aia-platform/apps/local-agent

# Type-check completo
./node_modules/.bin/tsc --noEmit

# Test unitari
npx vitest run src/capabilities/fuzzy-edit.test.ts     # 14 test
npx vitest run                                          # 81 test (11 skipped)
```

### Test con LLM (richiede API key)

```bash
export ANTHROPIC_API_KEY="sk-ant-..."

# Coding agent locale
npx vitest run src/llm/coding-agent.test.ts            # 5 test, ~$0.02

# Coding agent cloud
export E2B_API_KEY="e2b_..."
npx vitest run src/cloud/cloud-coding.test.ts          # 6 test, ~$0.03
```

### Verifica manuale (REPL)

```bash
# Avvia Node REPL con ESM
node --loader ts-node/esm

# Poi:
import { runCodingAgent } from './src/llm/coding-agent.js'
import { loadConfig } from './src/config.js'
const config = loadConfig()
const r = await runCodingAgent({ task: 'List files in /tmp', config, tier: 'fast-cheap' })
console.log(r.response)
```

---

## 14. Troubleshooting

### "Cannot find module 'ai'"

```bash
pnpm install --config.blockExoticSubdeps=false
```

### "ANTHROPIC_API_KEY not set"

I test LLM si **skippano** senza API key (non falliscono). Per eseguirli:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### "LSP server not found" (warning, non errore)

I language server sono opzionali. Se non installati, le diagnostiche post-edit semplicemente non vengono fornite. L'edit funziona comunque.

### "E2B timeout" nei test cloud

E2B richiede connessione internet. Verifica che `E2B_API_KEY` sia valida su e2b.dev/dashboard.

### TypeScript errori dopo modifica

```bash
./node_modules/.bin/tsc --noEmit
# Se errori in fuzzy-edit: le assertions ! sono intenzionali (noUncheckedIndexedAccess + loop bounds)
# Se errori in coding-tools/sandbox-tools: il @ts-nocheck e' necessario (AI SDK v6 generics)
```

### pnpm "Exotic subdeps" error

```bash
pnpm install --config.blockExoticSubdeps=false
# Causato da @whiskeysockets/baileys (dep di whatsapp integration)
```

---

## 15. Costi e billing

### LLM (per milione di token)

| Tier | Input | Output | Task tipico |
|------|-------|--------|-------------|
| fast-cheap (Haiku) | $0.25 | $1.25 | Comandi semplici, grep |
| coding (Sonnet) | $3.00 | $15.00 | Edit, refactoring |
| powerful (Opus) | $15.00 | $75.00 | Architettura, analisi |
| local (Ollama) | $0 | $0 | Offline, qualita' ridotta |

### Task tipici

| Operazione | Token stimati | Costo (Sonnet) |
|-----------|---------------|----------------|
| Fix bug singolo file | ~2K in + 1K out | ~$0.02 |
| Refactoring 3 file | ~5K in + 3K out | ~$0.06 |
| Crea file da zero | ~1K in + 2K out | ~$0.03 |
| Analisi codebase | ~10K in + 2K out | ~$0.06 |

### Sandbox E2B

| Risorsa | Costo |
|---------|-------|
| Sandbox attiva | ~$0.10/ora |
| Boot | incluso |
| Storage (snapshot) | ~$0.01/GB/mese |

### Token tracking

Ogni chiamata LLM traccia automaticamente il consumo via `trackTokens()`. Il totale e' disponibile nel risultato:

```typescript
result.usage.inputTokens   // token inviati
result.usage.outputTokens  // token ricevuti
result.usage.totalTokens   // somma
```

---

## Mappa file completa

```
src/
├── capabilities/
│   ├── fuzzy-edit.ts          ← [4] Fuzzy Edit Engine (9 strategie)
│   ├── fuzzy-edit.test.ts     ← Test (14/14)
│   └── filesystem.ts          ← editFile() usa fuzzyReplace internamente
├── llm/
│   ├── ai-sdk-direct.ts      ← [5] Chiamate LLM dirette (5 provider)
│   ├── provider-transform.ts ← [6] Normalizzazione messaggi per provider
│   ├── coding-tools.ts       ← [7] 6 tool per il coding agent
│   ├── coding-agent.ts       ← [8] Orchestratore multi-turn
│   ├── coding-agent.test.ts  ← Test E2E locale (5 test)
│   └── index.ts              ← Barrel exports
├── lsp/
│   ├── servers.ts            ← [9] Registry 8 language server
│   ├── client.ts             ← Client JSON-RPC (Content-Length framing)
│   ├── manager.ts            ← Manager singleton (lazy-start)
│   └── index.ts              ← Barrel exports
├── mcp-server/
│   ├── index.ts              ← [10] Entry point MCP server (stdio)
│   └── tools.ts              ← 10 tool definitions
└── cloud/
    ├── sandbox.ts            ← [11] Interfaccia astratta
    ├── e2b-provider.ts       ← Provider E2B (Firecracker VM)
    ├── sandbox-tools.ts      ← Tool identici al locale, eseguiti in sandbox
    ├── session-manager.ts    ← Lifecycle: create/run/destroy/cleanup
    ├── cloud-coding.test.ts  ← Test E2E cloud (6 test)
    └── index.ts              ← Barrel exports
```
