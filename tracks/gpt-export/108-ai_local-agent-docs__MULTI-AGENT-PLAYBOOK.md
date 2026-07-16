# Multi-Agent Playbook — 108 AI Desktop Agent

## Quando usare multi-agent

| Scenario | Pattern | CLI |
|----------|---------|-----|
| Parere incrociato (legal + tech) | Parallel ask | `/agent ask accountant,assistant "domanda"` |
| Specialista one-shot | `@agent` | `@accountant Quale scadenza IVA?` |
| Sessione persistente | Active persona | `/agent use accountant` |
| Sintesi orchestrata | Orchestrator summarize | Usato internamente da `ask` |

## Setup minimo

1. Definisci agent in `~/.108ai/agents/*.yml`
2. `skills.allow_llm: true` e `agents.allow_multi_agent: true` in `permissions.yml`
3. Per MCP tools: `tools: [mcp:server:tool]` nell'agent YAML

## Best practice

- **Temperature bassa** (0.2–0.4) per agent normativi/fiscali
- **`disclaimer_required: true`** su agent che toccano compliance
- **`context_window: summarize`** per conversazioni lunghe (>15 messaggi)
- **Non** duplicare system prompt tra agent — usa `knowledge:` path condivisi

## Anti-pattern

- Catene agent > 2 hop senza eval → latenza e costo esplosi
- Stesso agent per task operativi e creativi → contaminazione contesto
- MCP write tools senza `tools_exposed` whitelist → superficie attacco

## Troubleshooting

| Sintomo | Fix |
|---------|-----|
| `Agent non trovato` | `/agent list` + verifica nome file YAML |
| Risposte generiche | Aggiungi `knowledge:` o riduci `max_messages` |
| MCP non invocato | Verifica blocco ` ```mcp ` in risposta e tool in whitelist agent |
