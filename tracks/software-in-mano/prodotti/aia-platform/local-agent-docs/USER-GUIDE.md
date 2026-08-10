# Guida Utente — 108 AI Desktop Agent

> Versione agente: 0.3.x · Percorso dati: `~/.108ai/`

## Avvio

```bash
cd aia-platform/apps/local-agent
pnpm dev          # sviluppo
pnpm start        # build compilata
```

Alla prima esecuzione l'agent apre il browser per l'autenticazione OAuth verso il gateway 108 AI. Il token viene salvato in `~/.108ai/config.json`.

## Shell interattiva

Dopo l'avvio entri nella shell REPL. Puoi:

- Scrivere domande in linguaggio naturale (risposta LLM via gateway)
- Usare comandi con prefisso `/`
- Usare `@nome-agent domanda` per one-shot verso un persona agent
- Incollare codice multilinea con triple backtick

### Comandi essenziali

| Comando | Descrizione |
|---------|-------------|
| `/help` | Elenco completo comandi |
| `/ui dashboard` | Panoramica extensions in terminale |
| `/ui web` | Dashboard web locale (`http://127.0.0.1:7891`) |
| `/palette [q]` | Cerca ed esegui command custom |
| `/triage` | Briefing email/calendario/PEC/sistema |
| `/agent use <nome>` | Imposta persona agent per la sessione |
| `/command list` | Command YAML in `~/.108ai/commands/` |
| `/skill list` | Skill installate |
| `/mcp list` | Server MCP configurati |
| `/export backup` | Backup extensions |
| `/model [tier]` | Imposta modello sessione (`fast-cheap`, `balanced`, `powerful`) |

## Extensions

### Commands (`~/.108ai/commands/*.yml`)

Template riusabili con variabili. Esempio: `/summarize-email`.

### Skills (`~/.108ai/skills/<nome>/`)

Workflow multi-step (es. `email-writer`). Invocabili con `/skill run <nome>` o trigger in linguaggio naturale.

### Persona Agents (`~/.108ai/agents/*.yml`)

Assistenti con system prompt, modello e restrizioni dedicati. Cronologia per-agent in `~/.108ai/agents/history/`.

Strategie `context_window`:

- `sliding` — ultimi N messaggi (default)
- `full` — intera cronologia (attenzione token)
- `summarize` — riepilogo messaggi vecchi + finestra recente

### MCP (`~/.108ai/mcp.yml`)

Server Model Context Protocol (stdio). Avvio: `/mcp start <nome>`, tool: `/mcp tools <nome>`.

Install rapido (presets/npm/git):

```text
/mcp install everything-demo
/mcp install npm @modelcontextprotocol/server-everything --name everything-demo
/mcp install git https://github.com/org/repo --command node --args dist/index.js
```

## Dashboard Web UI

```text
/ui web [porta]    # default 7891
/ui web-stop
```

Solo **localhost** (`127.0.0.1`). Tab: Commands, Skills, Agents, MCP, Store. Shortcut `Ctrl+K` per ricerca. Refresh automatico ogni 15s.

### Store (install)

Da terminale:

```text
/ui store install <item-id>
```

Da Web UI: tab **Store** → **Installa**.

Nota: i pacchetti store possono essere verificati via firma autore (HMAC) in base alla policy (vedi `SECURITY-RUNBOOK.md`).

## Triage giornaliero

```text
/triage      # report completo
/morning     # briefing mattutino
/schedule on # cron automatico (es. 07:00 lun-ven)
```

Fonti: Gmail, Google Calendar, Outlook, PEC (IMAP), metriche sistema.

## Job Engine

Job schedulati in `~/.108ai/jobs/`. Vedi `/job list`, `/job run <nome>`, `/job budget`.

## Cache risposte

Le query ripetute o semanticamente simili possono essere servite da cache locale (`~/.108ai/cache/`) per risparmiare token. Query time-sensitive (es. "oggi", "adesso") hanno TTL breve (5 min).

## Risoluzione problemi

| Sintomo | Azione |
|---------|--------|
| Token scaduto | L'agent tenta rinnovo browser; se fallisce, riavvia e rifai login |
| MCP non parte | Verifica `command` in `mcp.yml` e PATH |
| Triage vuoto | Controlla integrazioni Gmail/Outlook e token OAuth provider |
| Web UI non raggiungibile | Solo `127.0.0.1`; verifica firewall locale |

## Percorsi utili

```text
~/.108ai/config.json
~/.108ai/commands/
~/.108ai/skills/
~/.108ai/agents/
~/.108ai/mcp.yml
~/.108ai/jobs/
~/.108ai/cache/
~/.108ai/audit.log
~/.108ai/indexes/              # Local RAG indexes (index.*)
```

Per dettagli sicurezza vedi [SECURITY-RUNBOOK.md](./SECURITY-RUNBOOK.md).
