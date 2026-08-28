# 108 AI — Strategia: Control Plane sopra OMP / Pi (riesame)

**Versione:** 1.0
**Data:** 2026-08-28
**Stato:** Analisi + raccomandazione
**Sostituisce/aggiorna:** `108 AI — Control Plane sopra OMP - Pi.md` (v0.1, proposta non verificata contro il codice)
**Metodo:** ricognizione reale su `tracks/` (documenti) e `aia-platform/` (codice). Ogni claim marcato: `[verified]` = letto nel codice/doc citato, `[probable]` = inferenza ragionata, `[unverified]` = da confermare.

---

# 1. Verdetto in tre righe

Il documento v0.1 tratta il Control Plane come da costruire. **Esiste già, in gran parte, dentro `aia-platform`.** [verified]

La scelta non è "sostituire il Desktop Agent con OMP", ma **aprire il control plane già implementato a runtime esterni via MCP**, senza demolire il local-agent.

Strategia raccomandata: **Ibrido convergente (Opzione C, §5)** — MCP-first sugli asset esistenti, local-agent declassato a *primo cliente* del control plane, non più prodotto centrale.

---

# 2. Stato reale: cosa dice il codice

## 2.1 Già implementato (la v0.1 chiedeva di costruirlo)

| Concetto v0.1 | Realtà nel repo | Stato |
|---|---|---|
| `108 MCP Server` | `apps/gateway/src/routes/mcp/` — server MCP HTTP/SSE, JSON-RPC, auth API key tenant-scoped | [verified] esiste |
| `108_search_knowledge` | tool `search_knowledge` → `hybridRagService.retrieveHybridContext` (vettori Qdrant + grafo Neo4j) | [verified] esiste |
| `108_get_memory` | tool `get_memories` + `store_memory`; REST `/api/memory` (CRUD+search) | [verified] esiste |
| `108_request_approval` | tabella `action_requests` + REST `/api/admin/actions` (pending/approve/reject/batch) | [verified] flusso esiste, **non esposto come tool MCP** |
| `108_policy_check` | policy + audit **locali** in `apps/local-agent/src/security.ts` (3 livelli rischio) | [verified] solo lato client; nessun tool server-side |
| `108_get_context` | route `/api/tenant`, `/api/agents` | [probable] dati presenti, nessun tool MCP aggregante |
| Modelli via LiteLLM | `infrastructure/litellm/config.yaml`: 6 tier + router fallback + budget $500/30g | [verified] |
| Multi-tenancy | `infrastructure/postgres/init/02-schemas.sql` + 7 migration Drizzle | [verified] |
| Local Bridge desktop | `packages/desktop-bridge/src/providers/windows.ts` (UIAutomation, screenshot, input) — **macOS è stub** | [verified] Windows-only |
| Office/Mail | `apps/local-agent/src/integrations/` (excel, outlook/word, gmail, calendar, whatsapp, PEC, fatture-in-cloud) | [verified] vivono nel local-agent, **non nel bridge** |
| Secondo MCP server | `apps/local-agent/src/mcp-server/` (stdio: desktop, triage, PEC, `local_execute`) | [verified] |

## 2.2 Decisioni documentate in conflitto con la v0.1

- `platform-docs/PLAN-integration-opencode-goose-mcp.md` (2026-06-19): decisione finale **Opzione B "Embed"** — coding engine integrato (fuzzy-edit + Vercel AI SDK Direct + LSP + MCP server), **niente subprocess esterni**. [verified]
- La v0.1 "Control Plane sopra OMP" non è mai stata confrontata con quella decisione: sono **due direzioni incompatibili sulla stessa componente** (chi possiede l'agent loop). [verified dai testi]
- `108AI-Assistente-Aziendale.md` consiglia "integrate, don't build" (Dify/OpenWebUI); `108AI-PLATFORM-AI-Piano-Esecutivo.md` impone stack custom. Contraddizione mai risolta. [verified]
- Prezzi incoerenti tra playbook (A CORPO 5–15K + 300–800/mese; A FACTORY 1.5–4K/mese) e assistenzuale (1.5–3K + 300–500/mese). [verified]
- Roadmap desktop: Sprint 1–4b/6/8–11 chiusi, **Sprint 5 "Business Italia" non iniziato**, ~40% del prodotto installabile; security backlog P0 ancora aperto (prompt injection, execSync, key vault, MIME) in `security-hardening-backlog.md`. [verified dai docs]

## 2.3 Contesto business (da `tracks/`)

- 108 Vision = 2 canali (Direzione Tecnica, Software in Mano). AIA Platform è **prodotto-prova**, non SaaS con clienti. [verified `brand/riposizionamento-partner-tecnico.md`, `registro-claim-e-prove.md`]
- Capacità dichiarata consulente: 8–12 h/settimana sul prodotto. [verified]
- Il runtime "OMP" citato nella v0.1 non compare in nessun altro documento dei tracks: è un'ipotesi esterna, non un indirizzo di portfolio consolidato. [verified via ricerca: 0 hit]

---

# 3. Rilettura dell'ipotesi Control Plane alla luce dei fatti

## 3.1 Cosa è giusto nella v0.1

1. **La separazione RPC / MCP / dominio è corretta** e il repo la sostiene già: il gateway è di fatto un MCP server multi-tenant. [verified]
2. **Runtime come commodity**: vero, e a costo zero per noi — OMP/Claude Code/Codex non li manteniamo noi.
3. **Bootstrap di sessione (§6 v0.1)**: il vero buco architecturale. Oggi `108_get_context` non esiste: un runtime esterno che si collega al MCP non sa chi è l'utente, quale tenant, quali policy. Senza bootstrap, la governance dipende dalla buona volontà del modello — esattamente il limite che la v0.1 (§7) denunciava. [probable]
4. **Defense in depth (§13 v0.1)**: oggi la policy vive **solo** nel client (`security.ts`). Un runtime diverso da local-agent la bypassa interamente. La policy deve stare (anche) server-side, nel gateway, esposta come tool e come enforcement. [verified]

## 3.2 Cosa è sbagliato o costoso nella v0.1

1. **Framing distruttivo** ("sostituire il Desktop Agent"): butta via l'unico asset dimostrabile del prodotto-prova (integrations ITA, PEC, bridge Windows, approval flow) e smentisce la decisione Embed del 2026-06-19 senza nuovi argomenti. [verified]
2. **Session Gateway + AgentRuntime abstraction (§8, §15, Fase 4–5)**: due astrazioni per le quali non esiste oggi un secondo cliente. Con 8–12 h/settimana è la strada per non finire nulla. Contro il principio del repo: *"Do not create a new service/package until the boundary is demonstrated."* [verified AGENTS.md]
3. **Nessun caso d'uso commerciale agganciato**: AIA vende come prova di competenza, non come SaaS. Una strategia control-plane ha senso **solo** se diventa anche offerta consulenziale (governance AI per clienti), altrimenti è ingegneria fine a se stessa. [probable]
4. **Approval non richiudibile via MCP**: oggi l'approvazione passa da REST admin/dashboard. Se il consumatore diventa OMP/Claude Code, serve un canale tool + notifica; altrimenti l'agente resta bloccato senza percorso di sblocco. [verified gap]

---

# 4. Le tre strategie possibili

## Opzione A — Control Plane puro (v0.1 com'è scritta)
Abbandonare local-agent, costruire MCP "nuovo" + Pi Desktop + Session Gateway.

- Beneficio: visione pulita, zero manutenzione agent loop.
- Rischio: **critico per capacità 8–12h** — riscrive ciò che esiste, sospende il prodotto-prova, nessuno ricava fino a fine ricostruzione. Contraddice roadmap e decisione Embed.
- Verdetto: **respingere**.

## Opzione B — Continuare dritti (ignorare OMP)
Completare local-agent (Sprint 5, phases D–F), MCP resta interno.

- Beneficio: finisce un prodotto installabile.
- Rischio: il mercato agentico si standardizza su MCP fuori dal nostro perimetro; ogni mese speso sul loop proprietario è maintenance cost che la v0.1 giustamente contesta. Il local-agent become il differenziatore *e* il debito.
- Verdetto: **insufficiente** come direzione, **utile** come sotto-traccia (vedere C).

## Opzione C — Ibrido convergente (RACCOMANDATA)
Il control plane esiste già: **completarlo come superficie standard** e renderlo consumabile da runtime esterni, mentre il local-agent diventa un *reference client* (e il ponte per desktop/PEC dove MCP pubblico non arriva).

Tre principi:
1. **MCP-first, non gateway-first**: niente Session Gateway, niente AgentRuntime abstraction. Il protocollo comune È MCP + le convenzioni dei tool 108.
2. **Il loop è sostituibile, la policy no**: policy/approval/audit migrano (anche) server-side nel gateway. Ogni runtime — OMP, Claude Code, il nostro local-agent — passa di lì.
3. **Un deliverable = un caso d'uso demo**: ogni fase deve produrre una demo visibile (video + repo) usabile dal playbook commerciale SiM/AI-adozione.

---

# 5. Piano operativo (Opzione C)

## Fase 1 — Chiudi il control plane (≈2–3 settimane, effort reale)
Rendere il MCP del gateway conforme alla visione v0.1, senza new infra:

- `108_get_context` (tool): tenant, utente, ruolo, permessi, policy attive, preferenze → bootstrap di sessione replicabile in qualunque runtime (OMP `AGENTS.md`/system prompt, Claude Code `CLAUDE.md`).
- `108_policy_check` (tool server-side): sposta la classificazione rischio da `local-agent/src/security.ts` a un servizio gateway (tabella policy + valutazione azione); il client mantiene solo il veto locale.
- `108_request_approval` (tool): incapsula il flusso `action_requests` esistente; risposta bloccante con timeout + notifica (push/dashboard) — l'agente non resta appeso.
- Definire **convenzione di risposta** (`allow | deny | require_approval`) identica al contratto della v0.1 §5.
- **Gate P0 sicurezza prima di esporre a runtime terzi**: chiudere nel backlog `security-hardening-backlog.md` prompt-injection e key-vault; un MCP raggiungibile da OMP esterni allarga la superficie.

Accettazione: OMP collegato al MCP del gateway con una sola API key tenant completa i 5 test della v0.1 §18 (context, knowledge, memory, governance, approval round-trip) senza installare il local-agent.

## Fase 2 — Local Bridge come MCP locale (esistente, da completare)
- Il bridge Windows attuale + `apps/local-agent/src/mcp-server` (stdio) **sono già** il "108 Local Bridge" della v0.1 §11. [verified]
- Da fare: allineare i tool stdio ai nomi/contratti 108, documentare il protocollo, rendere il local-agent **configurabile come MCP server di OMP/Claude Code** (office/mail/PEC/desktop restano qui: nessun runtime general le ha).
- macOS: resta stub → fuori scope finché non c'è un cliente Mac. [probable: non prioritario per PMI italiane]

## Fase 3 — Demo e riposizionamento commerciale
- Una demo pubblica: "OMP + 108 MCP = agente aziendale governato" (approve/deny a video, audit trail visibile).
- Allineare i docs dei tracks: il Playbook AIA oggi vende "assistente aziendale desktop"; il posizionamento diventa **"control plane di governance AI" come metodo vendibile nel canale consulenza (AI-adozione: readiness, policy, approval)**; il prodotto resta prova.
- Unificare il pricing (playbook vs assistenzuale) e registrare i claim in `registro-claim-e-prove.md`.

## Fase 4 — (condizionale) Session Gateway
Solo se e quando: ≥2 runtime diversi consumano il MCP E si misura un tasso di violazione di policy da parte di un runtime non governato. Allora il gateway (pre-processing deterministico) è giustificato. Fino ad allora: **non costruirlo**.

## Deferite senza data
- AgentRuntime abstraction multi-provider (v0.1 Fase 5) — YAGNI fino a cliente reale n.2.
- Sostituzione del coding loop interno: la decisione Embed 2026-06-19 resta valida; l'apertura a OMP è *additiva*, non sostitutiva.

---

# 6. Rischi e mitigazioni (worst case prima della conclusione)

| Rischio | Impatto | Mitigazione |
|---|---|---|
| **Esporre il MCP prima dei fix P0 = gateway attaccabile con chiave tenant** (worst case: esfiltrazione KB cliente) | Alto, irreversibile (compliance) | Gate Fase 1: no demo esterna prima di prompt-injection + key-vault + rate-limit |
| Cannibalizzazione: tempo tolto a Sprint 5/completamento local-agent | Medio | Le Fasi 1–2 riusano route/servizi esistenti; il bridge non viene riscritto |
| Inseguire l'ecosistema OMP/Pi che evolve fuori controllo | Medio | Contratto solo su MCP standard + tool 108; adapter sottili (regola v0.1 §16: zero business logic nell'adapter) |
| Strategia disancorata dal business (ingegneria per la prova) | Alto (costo opportunità) | Ogni fase finisce con deliverable dimostrabile nel playbook SiM/AI-adozione |
| Approval asincrona mai usata davvero | Basso-Medio | Misurare in Fase 1 il tasso di azioni `require_approval` su casi reali prima diinvestire in notifiche |

---

# 7. Decisione proposta (formato ADR-lite)

- **Decisione**: adottare Opzione C. Il control plane 108 AI = gateway MCP esistente + 3 tool mancanti (`get_context`, `policy_check`, `request_approval`) + policy server-side; local-agent e bridge declassati a client/adapter; OMP è il primo runtime esterno di validazione, non un vincolo.
- **Perché**: l'80% dell'infrastruttura della v0.1 è già nel codice [verified]; il costo marginale della versione credibile è basso, quello della v0.1 integrale (Opzione A) è fuori scala per 8–12 h/settimana.
- **Alternative considerate**: A (respingere: riscrive l'esistente), B (insufficiente: non capitalizza lo standard MCP).
- **Rischio principale**: superficie di sicurezza del gateway prima dei fix P0 → mitigato come gate duro.
- **Type-1 (irreversibile)?** No: tutto reversibile eccetto l'esposizione pubblica del MCP → che infatti avviene solo dopo il gate e con API key tenant-scoped già in uso. [verified auth esistente]

**Principio aggiornato (sostituisce v0.1 §22):**

> 108 AI governa. Il runtime ragiona. MCP collega. Il Bridge esegue. Il Gateway decide il permesso.

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
