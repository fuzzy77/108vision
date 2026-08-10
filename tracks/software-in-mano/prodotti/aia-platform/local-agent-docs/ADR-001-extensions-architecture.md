# ADR-001 — Extensions Architecture (108 AI Desktop Agent)

**Stato:** Accettato · **Data:** 2026-06-16

## Contesto

Il Desktop Agent deve estendersi senza modificare il core shell per ogni nuova automazione PMI (email, fiscalità, MCP, multi-agent).

## Decisione

Adottiamo un **modular monolith** in `src/extensions/` con quattro primitive:

| Primitive | Storage | Esecuzione |
|-----------|---------|------------|
| Commands | `~/.108ai/commands/*.yml` | Template + gateway LLM / handler builtin |
| Skills | `~/.108ai/skills/<name>/` | Manifest YAML + system prompt file |
| Agents | `~/.108ai/agents/*.yml` | Persona + history per-agent + MCP tool loop |
| MCP | `~/.108ai/mcp.yml` | stdio o SSE/HTTP JSON-RPC |

**Fuori dal perimetro ADR-001 (ma integrato in runtime):**

| Primitive | Storage | Esecuzione |
|-----------|---------|------------|
| Local Index (`index.*`) | `~/.108ai/indexes/<project>/index.json` | Build/search locale + embeddings cache |
| Context assembly (`context.assemble`) | — | Restituisce snippet top-K al gateway |

**Router unico:** `extensions/router.ts` → shell REPL (`/command`, `/skill`, `/agent`).

## Conseguenze

- ✅ Estensione senza rebuild per la maggior parte dei casi
- ✅ Lock file + permissions.yml per governance
- ✅ Builtin migrate: `/triage`, `/job`, `/morning`, `/standup`, `/schedule` sono YAML commands con `builtin:` (fallback seed)
- ⚠️ MCP SSE dipende da gateway remoto compatibile MCP-over-HTTP

## Alternative scartate

- **Microservizio extensions separato:** overhead operativo eccessivo per PMI
- **Plugin WASM:** complessità build chain non giustificata in fase beta
