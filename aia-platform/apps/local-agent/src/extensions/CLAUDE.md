# Extensions Module — Agent Notes

Path: `aia-platform/apps/local-agent/src/extensions/`

## Layout

```
extensions/
├── commands/     # YAML commands + hooks + create wizard
├── skills/       # Skill manifests + executor
├── agents/       # Persona agents + MCP tool loop
├── mcp/          # stdio + SSE HTTP clients, manager
├── knowledge/    # RAG-lite + structured file loader
├── import/       # claude, n8n, chatgpt
├── export/       # backup + restore
└── ui/           # terminal panels + web dashboard :7891
```

## Regole

- Validazione Zod su ogni boundary (`schemas.ts`)
- Audit log su command/skill/agent/MCP (`security.ts`)
- Mai loggare PII o secret
- Import path: file in `extensions/` root usano `./`, subdir usano `../`

## Comandi shell rilevanti

```
/command create <nome> [desc] [--force]
/import n8n workflow.json
/import chatgpt export.json
/import restore ~/.108ai/backups/<stamp>
/export restore ~/.108ai/backups/<stamp>
/mcp add ... transport sse + url
```

## Test

```bash
node ./node_modules/vitest/vitest.mjs run
```
