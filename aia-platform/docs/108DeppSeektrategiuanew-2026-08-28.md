# 108 DeepSeek — Strategia Nuova: Control Plane su runtime esistenti (OMP)

**Versione:** 1.0
**Data:** 2026-08-28
**Stato:** Re-analisi — ricalibrata sul codice reale in `aia-platform/`
**Riferimento:** `108 AI — Control Plane sopra OMP - Pi.md` (v0.1, "doc 0.1")
**Owner:** Elios Scoglio

---

# 0. Rischio in apertura

Prima della conclusione, i due worst-case:

- **Worst-case "sostituisci il Desktop Agent con OMP"** — buttare via ~241h di lavoro differenziato già costruito (triage, token-saving, desktop 6-level, PEC/Fatture in Cloud, messaging). Queste capacità **non esistono in OMP** e il doc 0.1 non le quantifica.
- **Worst-case "non fare nulla"** — mantenere un runtime proprietario duplicato mentre il mercato converge su MCP + runtime commodity, diventando un "me-too desktop agent" senza posizionamento.

La strategia corretta evita entrambi: **108 si espone come control plane, OMP diventa un runtime tra tanti, il local-agent non viene rimosso.**

---

# 1. Sintesi esecutiva (il reframe)

Il doc 0.1 ha la tesi giusta (108 = control plane, runtime = commodity) ma è scritto "al buio": assume che il Desktop Agent sia ancora da costruire. Il codice mostra il contrario.

La domanda vera **non è** "OMP sostituisce 108", ma:

> **108 si espone come control plane e OMP (o Claude Code / Codex / OpenCode) diventa uno dei runtime consumabili.**

I due componenti "nuovi" proposti dal doc 0.1 — il **108 MCP Server** (context/knowledge/memory) e il **Local Bridge MCP** (desktop/integrations) — **sono già implementati**. Il control plane è già al ~70%. Il delta net-new è piccolo e si concentra sulle primitive di governance deterministiche.

---

# 2. Evidenze dal codice [verificato]

| Componente nel doc 0.1 | Stato nel codice | Path |
|---|---|---|
| 108 AI MCP Server (SSE/HTTP, tenant-scoped via API key) | ✅ esiste | `apps/gateway/src/routes/mcp/` |
| Tool `108_search_knowledge` | ✅ `search_knowledge` (hybrid RAG + graph) | `routes/mcp/tools.ts` |
| Tool `108_get_memory` | ✅ `get_memories` + `store_memory` | `routes/mcp/tools.ts` |
| Tool `108_get_context` | ❌ manca | — |
| Tool `108_policy_check` | ❌ manca (esiste `middleware/permissions.ts`, non esposto come tool) | `gateway/src/middleware/permissions.ts` |
| Tool `108_request_approval` | ❌ manca (esiste il gate `_approved` nel local-agent) | `local-agent/src/security.ts` |
| Local Bridge MCP (desktop/triage/integrations, stdio) | ✅ esiste | `apps/local-agent/src/mcp-server/` |
| Runtime agentico proprietario | ✅ local-agent v0.5.1 + OpenCode SDK + E2B + LSP | `apps/local-agent/src/` |
| Model routing via LiteLLM | ✅ `model-router.service` + `@aia/ai-client` | `gateway/src/services/model-router.service.ts` |
| MCP client (consuma MCP community) | ✅ stdio + SSE client | `local-agent/src/extensions/mcp/` |

**Conclusione:** il "control plane" è già costruito. Il lavoro net-new sono le tre primitive governance (`get_context`, `policy_check`, `request_approval`) e il namespace coerente `108_*`.

---

# 3. Gap analysis — cosa il doc 0.1 sbaglia o omette

### 3.1 Governance probabilistica vs deterministica

Il doc 0.1 ammette (sez. 7) che in MCP-first (Approach A) "il recupero del contesto dipende dal comportamento dell'agente" e lo classifica come limite. Ma per le **azioni high-risk** questo non è un limite accettabile: è un **buco di sicurezza**.

Il codice ha già enforcement deterministico:
- `local-agent/src/security.ts` — risk classifier + gate `_approved`;
- `gateway/src/middleware/permissions.ts` — RBAC.

**Corollario:** il Session Gateway (Fase 4) non è "opzionale". È il punto dove la governance smette di essere un suggerimento nel system prompt e diventa un gate deterministico. **Ma** può essere un proxy RPC/HTTP sottile davanti a OMP — non un runtime completo.

### 3.2 Tenant isolation del Local Bridge

Il gateway MCP risolve il tenant dall'API key (`resolveApiKeyTenant`). Il local-agent MCP (stdio) è **single-user, senza tenant**: se OMP chiama il Local Bridge direttamente via stdio, la multi-tenancy si perde.

**Flusso corretto:** OMP → gateway MCP (tenant-scoped) → gateway → local-agent WS (tenant-scoped). Il Local Bridge stdio serve solo per azioni OS locali, sempre sotto l'identità di un tenant.

### 3.3 Sunk cost non contabilizzato

Il doc 0.1 propone di "ridurre drasticamente" il Desktop Agent. Ma le parti differenzianti — triage, token-saving, desktop automation a 6 livelli, integrazioni PMI (PEC, Fatture in Cloud, WhatsApp/Telegram) — **non sono commodity e non esistono in OMP**. Sostituirle = buttare via valore, non debito.

### 3.4 Leak LLM diretti

`local-agent/src/llm/ai-sdk-direct.ts` + `@ai-sdk/anthropic/openai/google` permettono chiamate provider **dirette**, in violazione della regola "tutto via LiteLLM". La tesi "provider sostituibili" regge solo se chiudiamo questo leak — incluso quando il runtime è OMP.

### 3.5 Pi Desktop è ridondante

108 ha già shell + web dashboard (`127.0.0.1:7891`). Pi Desktop è opzionale, non un prerequisito del control plane.

---

# 4. Architettura ricalibrata

```text
        ┌──────────────────────────────────────────────┐
        │  RUNTIME SOSTITUIBILE                        │
        │  OMP · Claude Code · Codex · OpenCode ·      │
        │  local-agent (default)                       │
        └───────────────────┬──────────────────────────┘
                            │ MCP (HTTPS/SSE + stdio)
                            ▼
        ┌──────────────────────────────────────────────┐
        │  108 SESSION GATEWAY (gate deterministico)   │
        │  identity · tenant · policy · approval ·     │
        │  audit · token budget · model restrictions   │
        └───────┬───────────────────┬──────────────────┘
                │ RPC/HTTP          │ MCP
                ▼                   ▼
   ┌────────────────────┐   ┌──────────────────────────┐
   │ 108 AI CLOUD       │   │ 108 LOCAL BRIDGE         │
   │ PostgreSQL·Qdrant· │   │ desktop · office · mail  │
   │ Neo4j·Redis        │   │ filesystem · browser     │
   │ RAG·memory·graph   │   │ (via local-agent WS)     │
   │ policy·audit       │   │                          │
   └────────────────────┘   └──────────────────────────┘
```

**Regola di boundary (invariata dal doc 0.1):** nessuna business logic critica vive nell'adapter runtime. Adapter = solo protocol translation, session mapping, auth. Core 108 = knowledge, memory, policy, approval, audit, tenant isolation.

---

# 5. Le strategie (opzioni con trade-off)

| # | Strategia | Effort | Rischio | Reversibilità | Verdetto |
|---|---|---|---|---|---|
| **A** | **MCP-first control plane (incrementale)** | 2-4 gg | Basso | Totale | ✅ **RACCOMANDATA** |
| **B** | **Runtime abstraction (`AgentRuntime` adapter)** | 2-3 sett | Medio | Media | Deferire (solo con 2+ runtime) |
| **C** | **Sostituzione integrale local-agent → OMP** | Alto a medio termine | **ALTO** | Bassa | ❌ Non fare |
| **D** | **Status quo (agente proprietario, OMP ignorato)** | 0 | Medio (posizionamento) | Totale | Fallback se POC fallisce |

### A — MCP-first control plane (incrementale)
Pubblicare i due MCP server già esistenti, aggiungere i 3 tool governance mancanti con namespace `108_*`, far consumare a OMP. Il local-agent resta Local Bridge + runtime di fallback.

### B — Runtime abstraction
Interfaccia `AgentRuntime` con adapter `OmpRuntime` / `ClaudeCodeRuntime` / `CodexRuntime` / `OpenCodeRuntime` / `LocalAgentRuntime` (doc 0.1 Fase 5). Necessaria solo quando ci sono **2+ runtime reali in produzione**. Prima è over-engineering.

### C — Sostituzione integrale
La lettura letterale del doc 0.1: stop alla shell/loop proprietari, OMP = runtime, Pi = UI, 108 = solo control plane. **Butta via i differenziatori** (triage, token-saving, desktop, PMI) che OMP non ha. Alto rischio di regressione senza guadagno reale.

### D — Status quo
Continuare sul local-agent. Valido solo se i differenziatori PMI sono il prodotto e OMP non aggiunge utenti. Rischio: perdere la finestra MCP/commodity.

---

# 6. Strategia consigliata (la migliore)

> **A ora. B gated dietro domanda reale. C mai. D come fallback se il POC fallisce.**

Concretamente: **"108 governa, il runtime è un dettaglio"** — ma il runtime di default **resta il local-agent** finché OMP non dimostra di coprire ≥80% dei casi **senza regressione** su triage/desktop/PMI.

Perché A e non B o C:
- A capitalizza il 70% già costruito, con delta net-new minimo.
- B è speculativo finché un solo runtime è in uso (YAGNI).
- C distrugge valore differenziato irrecuperabile.

---

# 7. Piano d'azione prioritizzato

| # | Azione | Effort | Verificabile |
|---|---|---|---|
| 1 | Aggiungere `108_get_context`, `108_policy_check`, `108_request_approval` al gateway MCP (dietro `permissions` + audit) | 2 gg | tool visibili via `ListTools`, tenant-scoped, audit log |
| 2 | POC OMP: collegare OMP al gateway MCP (SSE) + local MCP (stdio); eseguire le 5 domande del doc 0.1 | 2 gg | 5/5 domande con esito registrato |
| 3 | Chiudere il leak LiteLLM: ogni chiamata LLM (incl. OpenCode/E2B/Vercel AI SDK) via gateway/LiteLLM | 1-2 gg | `grep ai-sdk-direct` → nessun provider diretto |
| 4 | Multi-tenancy Local Bridge: azioni OS via gateway→local-agent WS (tenant-scoped), non stdio diretto | 2-3 gg | azioni OS tracciate per tenant |
| 5 | ADR-002 (Type-1): "runtime agnostico + control plane 108", boundary adapter/core | 0.5 gg | ADR in `docs/` |

Ordine: 1 → 2 (POC) → 3 (sblocca governance vera) → 4 → 5.

---

# 8. Criterio Go/No-Go (rivisto)

Riutilizzare le 5 domande del doc 0.1 (Context, Knowledge, Memory, Governance, UX) **più** una sesta:

> **6. Regressione:** il POC non ha introdotto regressioni su triage, desktop automation, integrazioni PMI.

**GO** solo se ≥80% dei casi d'uso è gestito **e** nessuna regressione sui differenziatori. In quel caso: ridurre la *duplicazione* del runtime, non eliminare il local-agent.

---

# 9. Decisioni irreversibili da non prendere ora

- Non rimuovere il local-agent (il Local Bridge e i differenziatori ci vivono).
- Non cambiare schema DB / API MCP senza ADR.
- Non esporre provider diretti a runtime esterni (il modello resta LiteLLM-only).

---

# 10. Principio guida (riformulato)

> **108 AI governa.**
> **Il runtime — OMP, local-agent, o altro — ragiona ed esegue sotto governance.**
> **MCP collega.**
> **Il Local Bridge esegue le azioni OS, sempre sotto l'identità di un tenant.**

Il valore proprietario resta: conoscenza, memoria, policy, approval, audit, integrazioni, tenant isolation. Il reasoning e l'agent loop sono commodity sostituibili — ma **non si butta via il runtime che già li possiede finché il sostituto non è provato equivalente.**

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
