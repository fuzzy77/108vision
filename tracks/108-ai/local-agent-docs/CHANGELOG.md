# Changelog — 108 AI Desktop Agent

## [0.3.1] — 2026-06-15

### Added

- **Sprint 11 UI**: pannelli terminale (`/ui dashboard`, `/palette`) e dashboard web locale (`/ui web` su `127.0.0.1:7891`)
- Catalogo store locale per command/skill/agent (`/ui store`)
- API snapshot JSON per web UI (`/api/snapshot`)

### Sprint 6 Hardening (wiring)

- Lazy-load integrazioni nel triage engine (Gmail, Calendar, Outlook, IMAP)
- Strategia `context_window: summarize` per persona agents con compressione cronologia
- Semantic cache lite (Jaccard su token) oltre cache esatta
- Rinnovo JWT preventivo prima della scadenza (`ensureAuthFresh`)

### Added (continued)

- **Command hooks**: `hooks.before` / `hooks.after` in YAML → esecuzione command collegati (`commands/hooks.ts`)
- **Agent MCP loop**: tool `mcp:server:tool` nel system prompt + parsing blocchi ` ```mcp ` + follow-up LLM (`agents/mcp-tools.ts`)
- Fix syntax TS: `office-outlook.ts`, `jobs/templates.ts`, `triage/scheduler.ts`
- Fix import `extensions/router.ts`, `extensions/lock.ts`, `extensions/gateway-llm.ts`

### Added (batch 2)

- **MCP SSE/HTTP**: `SseMcpClient` per `transport: sse` + `url` in `mcp.yml`
- **Knowledge loader**: `knowledge:` path su agent/skill (RAG-lite + structured)
- **Command wizard**: `/command create <nome> [desc]`
- **Import**: `/import n8n`, `/import chatgpt`, `/import restore`
- **Export restore**: `/export restore <dir>`
- **LLM coalescing**: dedup richieste concorrenti identiche (`llm-coalesce.ts`)
- **Response compress**: troncamento output lunghi prima di cache
- **Docs**: ADR-001, MULTI-AGENT-PLAYBOOK, `extensions/CLAUDE.md`, `docs/INTEGRATIONS-API.md`

### Sprint 5 entry (Business Italia)

- **Fatture in Cloud**: adapter `fatture-in-cloud.ts` + triage `billing` source (fatture scadute)

### Documentation (Sprint 7 min)

- `docs/USER-GUIDE.md` (IT)
- `docs/SECURITY-RUNBOOK.md`

## [0.3.0] — precedente

- Extensions: commands, skills, persona agents, MCP stdio
- Triage engine, job engine, multi-agent orchestration
- Security: sanitize, PII guard, key vault, audit rotation
