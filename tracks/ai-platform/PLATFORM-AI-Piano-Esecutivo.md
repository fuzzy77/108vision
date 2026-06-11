# Piano Esecutivo: Piattaforma AI Assistente Aziendale (AIA)

> **Versione**: 1.0 — 7 giugno 2026
> **Autore**: Elios Scoglio
> **Stato**: In esecuzione (Fase 0-3 completate, Fase 3.5 in corso)

---

## Executive Summary

Piattaforma AI multi-tenant per PMI italiane. Il consulente gestisce N clienti da una dashboard centrale, ciascuno con agenti AI personalizzati, knowledge base aziendale, e integrazioni operative (email, file, calendario). Due modelli di vendita: progetto chiuso (A CORPO) e retainer continuativo (A FACTORY).

**Budget infrastruttura**: ~50 EUR/mese (Hetzner CX41)
**Break-even stimato**: 3 clienti FACTORY o 2 progetti A CORPO
**Timeline sviluppo**: ~10 settimane part-time

---

## Struttura Progetto

```
Vision/aia-platform/
├── docker-compose.yml          # Stack produzione (Traefik, PG, Redis, Qdrant, LiteLLM)
├── docker-compose.dev.yml      # Override dev (porte esposte, no SSL)
├── .env.example                # Variabili ambiente documentate
├── Makefile                    # 25+ target operativi
├── CLAUDE.md                   # Istruzioni per AI coding assistant
├── infrastructure/
│   ├── traefik/                # Reverse proxy + SSL Let's Encrypt
│   ├── postgres/init/          # Extensions (pgvector, pg_trgm) + schema multi-tenant
│   ├── redis/                  # AOF persistence, 512MB LRU
│   ├── qdrant/                 # Vector DB config
│   ├── litellm/config.yaml     # 3 tier modelli (DeepSeek/Haiku/Sonnet)
│   └── backups/                # Script backup automatico
├── packages/
│   ├── shared/                 # Types, Result pattern, AppError, costanti
│   └── ai-client/              # LiteLLM client wrapper con retry/backoff
├── apps/
│   ├── gateway/                # Hono API (22 file) — il cervello
│   ├── dashboard/              # React SPA consulente (Fase 2)
│   ├── client/                 # React PWA utente finale (37 file)
│   └── local-agent/            # Micro-agent OS (Fase 3)
├── templates/                  # Agent templates YAML
├── scripts/                    # Setup VPS, deploy, seed, migrate
└── docs/                       # Manuali per fase
```

---

## Stack Tecnologico

| Layer | Tecnologia | Motivo |
|---|---|---|
| API Framework | **Hono** | 10x Express, TypeScript-native, Bun-ready |
| ORM | **Drizzle** | Type-safe, leggero, escape hatch SQL raw |
| Frontend | **React 19 + Vite 6 + Tailwind 4** | Velocissimo, moderno |
| UI Components | **shadcn/ui** | Owned, Tailwind-native |
| Auth | **Better Auth** | Flessibile, Hono-compatible |
| State | **Zustand + TanStack Query** | Server state separato |
| Router | **TanStack Router** | Type-safe |
| LLM Proxy | **LiteLLM** (Docker) | Multi-model, cost tracking built-in |
| Vector DB | **Qdrant** (Docker) | Veloce, HNSW, filtering avanzato |
| Graph DB | **Neo4j Community** (Fase 4) | Standard de facto |
| Queue/Jobs | **BullMQ** (Redis) | Retry, concurrency, dead-letter |
| DB | **PostgreSQL 16 + pgvector** | Multi-tenant, estendibile |
| Hosting | **Hetzner CX41** | EU, 4 vCPU, 16GB RAM, ~40 EUR/mese |
| Website | **Astro 5 + TinaCMS + Vercel** | Statico, SEO, editing online, gratis |

---

## Modello Multi-Tenancy

| Componente | Strategia isolamento |
|---|---|
| PostgreSQL | Shared DB, `tenant_id` su ogni riga (row-level) |
| Qdrant | Collection `kb_{tenant_id}` per tenant |
| Redis | Prefix `aia:{tenant_id}:` per chiavi |
| Risoluzione | Header `X-Tenant-ID` (dashboard) o subdomain (client) |

---

## Fasi di Implementazione

### FASE 0 — Infrastruttura [COMPLETATA]

- Docker Compose completo (PostgreSQL+pgvector, Redis, Qdrant, LiteLLM, Traefik)
- Schema DB multi-tenant con triggers e indici
- LiteLLM configurato con 3 tier di costo
- Script provisioning VPS Hetzner + backup automatico
- Packages condivisi (shared types, AI client)
- Manuale: `docs/phase-0-infrastructure.md`

**Verifica**: `docker compose up -d && docker compose ps` — tutti healthy

---

### FASE 1 — MVP Client + Chat [COMPLETATA]

**Gateway API** (22 file):
- `POST /api/chat` — SSE streaming con RAG
- `POST /api/knowledge/upload` — ingest documenti asincrono (BullMQ)
- `GET /api/knowledge/search` — ricerca semantica Qdrant
- CRUD conversazioni, agenti, documenti
- Middleware: JWT auth, tenant resolution, RFC 7807 errors
- Service layer con Result pattern
- Chunking ricorsivo (1000 chars, 200 overlap)

**Client PWA** (37 file):
- Chat UI con streaming SSE in tempo reale
- Selezione agente e modello
- Upload documenti in knowledge base (drag & drop)
- Dark mode, responsive, installabile come app
- TanStack Router + Query, Zustand store

**Verifica**: Upload PDF → fai domanda → risposta usa contenuto del PDF

---

### FASE 2 — Dashboard Consulente (10-14 giorni) [PROSSIMA]

**Obiettivo**: Gestire tutti i clienti da remoto.

| Pagina | Funzione |
|---|---|
| `/` Overview | Grid tenant cards (nome, agenti attivi, costo mese, ultima attivita) |
| `/tenants/:id` | Dettaglio tenant con tabs |
| `/tenants/:id/agents` | Editor agenti: system prompt, model, KB bindings, test inline |
| `/tenants/:id/kb` | Upload docs, status, ricerca semantica, re-index |
| `/tenants/:id/usage` | Grafici costo per modello/giorno, budget alert |
| `/tenants/:id/conversations` | Browser conversazioni (read-only), export |
| `/onboarding` | Wizard 6 step per nuovo cliente |
| `/billing` | Breakdown costi cross-tenant, export CSV |
| `/marketplace` | Libreria template agenti |
| `/settings` | Config piattaforma, chiavi LLM, backup |

**Flusso onboarding nuovo cliente**:
1. Wizard → info azienda, settore, dimensione
2. Seleziona use case → auto-suggerisce agenti template
3. Sistema crea: tenant DB, collection Qdrant, utenti invitati
4. Upload documenti iniziali (o crawl URL sito)
5. Configura agenti (pre-compilati, modificabili)
6. Attiva → cliente riceve email con link PWA

---

### FASE 3 — Integrazioni (7-10 giorni)

- Email: IMAP (Aruba, Register) + Microsoft Graph (M365)
- Browser automation: Playwright (scraping, azioni web)
- Local micro-agent: Node + WebSocket, file system sandboxed, system tray
- 3 livelli rischio azioni: read-only / low-risk / high-risk (con conferma)
- Dashboard: config OAuth, IMAP, test connessione

---

### FASE 3.5 — Desktop Bridge (7-10 giorni) [IN CORSO]

**Obiettivo**: L'agente locale puo leggere e interagire con tutte le finestre aperte sul computer del cliente (come Claude Desktop / ChatGPT Desktop, ma con knowledge base aziendale e approvazione remota).

**Architettura Hybrid**:
- Layer 1 (Accessibility API): legge UI tree nativo (UIA su Windows, AX su Mac)
- Layer 2 (Vision): screenshot + LLM multimodale come fallback
- Layer 3 (Input): keyboard/mouse simulation via nut-tree

**Componenti creati**:
- `packages/desktop-bridge/` — Pacchetto cross-platform (Windows first, Mac ready)
  - Window enumeration (Win32 EnumWindows via koffi FFI)
  - UI tree reading (PowerShell + System.Windows.Automation)
  - Screenshot per-window (screenshot-desktop + sharp)
  - OCR fallback (Tesseract.js)
  - Vision analysis (LLM via @aia/ai-client)
  - Input simulation (nut-tree)
  - Safety layer: risk classification + window guard + pre/post screenshot
- `apps/local-agent/src/capabilities/desktop.ts` — 12 nuove azioni desktop
- `apps/dashboard/src/components/desktop/` — UI approvazione + monitor live

**Modello sicurezza a 3 livelli**:
| Rischio | Azioni | Approvazione |
|---|---|---|
| read-only | listWindows, readWindow, screenshot, analyzeScreen, getUITree | Auto |
| low-risk | focusWindow, scrollWindow, clipboard read | Auto + log |
| high-risk | typeText, clickElement, pressHotkey, mouseClick | Richiede conferma consulente |

**Differenziatore vs Claude/ChatGPT Desktop**:
- Consulente approva da remoto (non serve utente davanti allo schermo)
- Agente conosce il contesto aziendale (RAG + graph KB)
- Azioni persistite e auditabili
- Funziona in background (agent always-on)

**Verifica**: Agent connesso → listWindows → screenshot finestra → analyzeScreen → risposta contestuale

---

### FASE 4 — Knowledge Base a Grafo (5-7 giorni)

- Neo4j Community in docker-compose
- Entity extraction pipeline (LLM estrae entita durante ingest)
- Graph-enhanced RAG (Qdrant + Neo4j in parallelo, risultati fusi)
- Dashboard: visualizzazione grafo per tenant

---

### FASE 5 — Funzionalita SaaS (7-10 giorni)

- Subscription plans con limiti (conversazioni/mese, KB size, modelli)
- Stripe o fatturazione manuale per PMI italiane
- Agent marketplace (template gallery, install, rating)
- Self-service signup (opzionale, per fase franchising)
- Weekly report automatico (PDF) per consulente

---

### FASE 6 — Documenti Commerciali [COMPLETATA]

| File | Status | Righe |
|---|---|---|
| `AIA-Playbook-Piattaforma.md` | Completato | ~1450 |
| `AIA-Manuale-Piattaforma.md` | Completato | ~1057 |
| `AIA-Sito-Piattaforma.md` | Completato | ~800 |
| `STUDY-AIA-Piattaforma.md` | In completamento | ~1300 |

---

### FASE 7 — Sito Web Promozionale [IN CORSO]

**Stack**: Astro 5 + TinaCMS + Vercel (costo: 0 EUR/mese)

**Pagine**:
- Home (hero + grid 9 servizi + stats + testimonial + CTA)
- 9 landing page servizi (AI Platform, AI Adoption, FCTO, DIGI, ARCH, LEAD, AGILE, WELL, PA)
- Chi sono, Risorse (lead magnet), Contatti (form + Calendly), Blog

**Componenti**: Header, Footer, Hero, ServiceCard, FeatureGrid, PricingTable, Testimonial, CTASection, ContactForm, CalendlyEmbed, BlogCard, LeadMagnetCard

**Lead generation**: form → Resend webhook, download manuali gated, Calendly per discovery call, Plausible analytics

---

### FASE 8 — Client macOS (10-14 giorni) [PIANIFICATA]

**Obiettivo**: Portare il local-agent + desktop-bridge su macOS con supporto nativo.

**Componenti**:
- `packages/desktop-bridge/src/providers/macos.ts` — Provider nativo macOS:
  - Accessibility API via `@aspect-build/accessibility` o subprocess `osascript`
  - AppleScript per interazione con app native (Mail, Finder, Safari, Calendar)
  - CoreGraphics screen capture (via `screencapture` CLI o Swift companion)
  - CGEvent per input simulation (keyboard/mouse)
- `apps/local-agent-macos/` — Electron app per macOS con:
  - Menu bar icon (equivalente system tray)
  - Accessibility permission request UI (System Preferences → Privacy)
  - Auto-update via Sparkle
  - DMG installer con notarization Apple
  - Sandboxing: entitlements per screen recording + accessibility + file access

**Sfide macOS specifiche**:
| Sfida | Soluzione |
|---|---|
| Accessibility permission obbligatoria | First-run wizard che guida l'utente in System Preferences |
| Screen Recording permission separata | Richiesta solo se vision/screenshot abilitati |
| Apple notarization per distribuzione | Signing con Developer ID + notarytool |
| App-specific automation (es. Mail.app) | AppleScript bridge per app Apple native |
| Electron security restrictions | nodeIntegration solo in preload, context isolation |

**Stack**:
- Electron 30+ (cross-platform shell)
- `@aspect-build/accessibility` o subprocess `swift` companion per AX API
- `osascript` per AppleScript (automazione app Apple)
- `screencapture` CLI per screenshot (evita dipendenze native)
- Sparkle per auto-update
- electron-builder per DMG/PKG

**Verifica**: Install su Mac → permission granted → listWindows → read Safari tab content → screenshot → analyzeScreen

---

## Modello di Business

### A CORPO (progetto chiuso)

| Elemento | Dettaglio |
|---|---|
| Cosa include | Audit processi + KB + agenti + integrazioni + training |
| Timeline | 4-8 settimane |
| Pricing | 5.000-15.000 EUR |
| Post-progetto | Hosting + manutenzione: 300-800 EUR/mese |
| Target | PMI che vogliono prodotto finito, budget definito |

### A FACTORY (retainer continuo)

| Elemento | Dettaglio |
|---|---|
| Cosa include | Piattaforma + governance + evoluzione mensile |
| Cadenza | Retainer mensile continuo |
| Pricing | 1.500-4.000 EUR/mese |
| Include | Nuovi agenti, KB update, integrazioni, report ROI |
| Target | Medie imprese, partner AI continuativo |

### Unit Economics

| Voce | Costo/mese per tenant |
|---|---|
| Infra (quota) | ~5-10 EUR |
| Token LLM (media) | ~20-80 EUR |
| Supporto (tempo) | ~2-4 ore |
| **Totale costo** | **~50-150 EUR** |
| **Revenue FACTORY** | **1.500-4.000 EUR** |
| **Margine** | **~90%** |

**Break-even**: 3 clienti FACTORY coprono costi fissi + margine

---

## Timeline con Parallelismo

```
Settimana 1-2:   [FATTO]
  Fase 0 (infra) + Fase 6 (documenti) + inizio Fase 1

Settimana 2-3:   [FATTO]
  Fase 1 (gateway + client PWA) + Fase 7 (sito web)

Settimana 3-5:   [FATTO]
  Fase 2 (dashboard consulente)

Settimana 5-7:   [FATTO]
  Fase 3 (integrazioni email/browser/local agent)

Settimana 7-8:   [IN CORSO]
  Fase 3.5 (desktop bridge — Windows)

Settimana 8-9:
  Fase 4 (graph KB + Neo4j)

Settimana 9-11:
  Fase 5 (SaaS features + marketplace)

Settimana 11-13:
  Fase 8 (client macOS — Electron + native AX)
```

---

## Risorse Riusabili (dal progetto MCP esistente)

| File sorgente | Riuso per |
|---|---|
| `AI/Germania/mcp/services/msgraph/mail.ts` | Integrazione email M365 |
| `AI/Germania/mcp/services/msgraph/calendar.ts` | Integrazione calendario |
| `AI/Germania/mcp/services/msgraph/auth.ts` | OAuth MSAL flow |
| `AI/Germania/mcp/services/xenon-knowledge/tools.ts` | Pattern CRUD knowledge |
| `AI/Germania/mcp/services/memgraph/tools.ts` | Pattern query graph DB (migrato a Neo4j + Cypher) |

---

## Criteri di Successo

| Fase | Criterio "done" |
|---|---|
| Fase 0 | `docker compose ps` — tutti i container healthy |
| Fase 1 | Upload PDF → domanda → risposta con contenuto PDF |
| Fase 2 | Login dashboard → crea tenant → configura agente → client lo vede |
| Fase 3 | Configura email → agente legge inbox → propone risposta |
| Fase 3.5 | Agent connesso → listWindows → screenshot finestra → analyzeScreen → risposta contestuale |
| Fase 4 | Documenti con entita correlate → grafo migliora risposte |
| Fase 5 | Secondo tenant → isolamento OK → tracking costi funziona |
| Fase 6 | 4 documenti commerciali completi (>800 righe ciascuno) |
| Fase 7 | Sito live su Vercel, modificabile da TinaCMS |
| Fase 8 | Install su Mac → permission granted → listWindows → read Safari tab → screenshot → analyzeScreen |

---

## Branding & Marketing

### Identita aziendale

L'azienda e il prodotto si chiamano **108 Vision AI**. Il numero 108 e sacro in molteplici tradizioni (buddhismo, induismo, arti marziali, astronomia) e rappresenta completezza, connessione e trasformazione. "Vision" comunica la capacita di vedere il futuro tecnologico dei clienti e progettarlo oggi. "AI" posiziona immediatamente nel dominio dell'intelligenza artificiale. Il team include competenze in architettura software, AI engineering, leadership tecnica e consulenza strategica.

**Brand architecture**:
- **108 Vision AI** = nome azienda (il team, la consulenza, il partner)
- **108 Vision AI** = anche il prodotto/piattaforma (brand unificato — semplifica comunicazione)
- Abbreviazione informale: "108" o "Vision AI"

**Tono comunicativo**: "noi", "il nostro team", "la nostra visione" — mai prima persona singolare. Posizionamento: partner tecnologico di fiducia, non freelancer. Esempio: "In 108 Vision AI aiutiamo le PMI a..." non "Aiuto le PMI a..."

---

### Proposte nome azienda: 108 + estensione

| Proposta | Significato | Dominio suggerito | Note |
|---|---|---|---|
| **108 Labs** | Laboratorio di innovazione — R&D applicata, sperimentazione | 108labs.it | Moderno, tech, evoca Silicon Valley senza essere derivativo |
| **108 Vision** | Visione chiara del futuro tecnologico | 108vision.it | Direttamente legato alla cartella Vision del portfolio |
| **108 Digital** | Trasformazione digitale come core | 108digital.it | Ampio, riconoscibile, ma forse generico |
| **108 Minds** | Menti al lavoro — intelligenza collettiva (umana + AI) | 108minds.it | Forte legame con AI, evoca pensiero e strategia |
| **108 Forward** | Andare avanti, progresso, next step | 108forward.it | Dinamico, orientato al futuro |
| **108 Studio** | Atelier di consulenza premium, artigianato tech | 108studio.it | Posizionamento alto, boutique |
| **108 Nexus** | Punto di connessione tra business e tecnologia | 108nexus.it | Potente, ma forse troppo corporate |
| **108 Arc** | Arco = architettura + percorso (arc of transformation) | 108arc.it | Elegante, breve, evoca costruzione |

**Decisione**: **108 Vision AI** — brand unificato azienda+prodotto. Combina il numero sacro (completezza, trasformazione), la visione strategica e l'AI come core competence. Funziona sia come nome azienda ("108 Vision AI") sia come prodotto che il cliente usa. Dominio target: `108visionai.it` / `108vision.ai` (verificare disponibilita).

---

### Proposte marchio prodotto: Piattaforma AI per PMI

Il prodotto (la piattaforma) ha bisogno di un nome proprio, separato dall'azienda. L'azienda (108 X) e il fornitore; il prodotto e quello che il cliente usa ogni giorno.

| Nome prodotto | Claim | Registro | Note |
|---|---|---|---|
| **Menti** | "L'intelligenza che la tua azienda merita" | Caldo, italiano, accessibile | Richiama "mente" (AI) + "menti" (team), facile da ricordare |
| **Prisma** | "Ogni angolo del tuo business, illuminato" | Elegante, sfaccettato | Evoca chiarezza, multi-prospettiva, analisi |
| **Atlante** | "La mappa intelligente della tua azienda" | Solido, autorevole | Knowledge base = atlante di conoscenza aziendale |
| **Synapse** | "Connetti sapere e azione" | Tech, internazionale | Connessione neurale = AI che collega info a decisioni |
| **Lumina** | "Luce sui tuoi processi" | Luminoso, femminile, premium | AI che illumina, chiarisce, rende visibile l'invisibile |
| **Nodi** | "Dove la conoscenza si incontra" | Minimale, italiano | Grafo, connessioni, knowledge base = nodi |
| **Onda** | "L'AI che muove la tua azienda" | Dinamico, italiano | Movimento, propagazione, trasformazione progressiva |
| **Copernico** | "Una nuova prospettiva per il tuo business" | Autorevolezza, rivoluzione | Cambio di paradigma, come la rivoluzione copernicana |
| **108 AI** | "Intelligenza artificiale, competenza reale" | Diretto, brand-linked | Semplice, lega prodotto e azienda |
| **Tessera** | "Ogni pezzo al suo posto" | Costruzione, completezza | Mosaico di conoscenza, ogni documento e una tessera |

---

### Claim principali (indipendenti dal nome prodotto)

**Per la piattaforma AI:**

| Claim | Target | Registro |
|---|---|---|
| "L'AI che capisce la tua azienda" | PMI generalista | Chiaro, benefit-oriented |
| "Il tuo team invisibile, sempre operativo" | PMI con poche risorse | Emotivo, evoca supporto costante |
| "Intelligenza artificiale, competenza reale" | PMI scettica verso AI | Rassicurante, bilancia tech e human |
| "Dal documento alla decisione, in secondi" | Manager operativi | Specifico, orientato all'efficienza |
| "L'AI su misura. Non un chatbot qualsiasi." | PMI che ha provato ChatGPT | Differenziante, posizionamento premium |
| "Conosce i tuoi processi. Risponde come un collega." | Dipendenti end-user | Familiare, bassa barriera d'ingresso |
| "Meno tempo a cercare. Piu tempo a decidere." | C-level / imprenditori | ROI implicito, dolore reale |
| "La memoria della tua azienda, potenziata dall'AI" | Aziende con knowledge loss | Evoca continuita, anti-turnover |

**Per l'azienda 108:**

| Claim | Posizionamento |
|---|---|
| "Tecnologia che trasforma. Persone che accompagnano." | Partnership umana + tech |
| "Dal codice alla strategia. Un team, ogni risposta." | Full-stack consulting |
| "108 modi di far crescere il tuo business." | Gioco sul numero, ampiezza servizi |
| "Architettura, AI, leadership. Un partner, zero complessita." | Semplificazione per il cliente |
| "Il futuro tech della tua azienda, progettato oggi." | Vision + concretezza |
| "Non vendiamo tecnologia. Costruiamo capacita." | Differenziazione da vendor/software house |

---

### Strategia Marketing (primi 90 giorni)

**Settimana 1-4: Fondamenta**

| Azione | Canale | Obiettivo |
|---|---|---|
| Sito live su Vercel con tutte le landing | Web | Presenza professionale, SEO |
| Profilo LinkedIn aziendale "108 [X]" | LinkedIn | Autorevolezza, contenuti |
| 3 manuali PDF come lead magnet | Web + LinkedIn | Raccolta email, posizionamento |
| 12 post LinkedIn programmati (dal Content Calendar) | LinkedIn | Visibilita organica |
| Google Business Profile | Google | Local SEO (se rilevante) |

**Settimana 5-8: Trazione**

| Azione | Canale | Obiettivo |
|---|---|---|
| Webinar gratuito "AI per PMI: da dove partire" | Zoom + LinkedIn Event | Lead generation qualificata |
| 3 case study (anche simulati/anonimi) pubblicati | Blog sito | Social proof |
| Outreach diretto a 50 PMI target (email + LinkedIn) | Direct | Pipeline commerciale |
| Partnership con 2-3 commercialisti/consulenti lavoro | Referral | Canale inbound indiretto |
| Newsletter settimanale (Brevo/Resend) | Email | Nurturing |

**Settimana 9-12: Conversione**

| Azione | Canale | Obiettivo |
|---|---|---|
| Discovery call gratuite (target: 10) | Calendly | Conversione prospect |
| Prima proposta A CORPO inviata | Direct | Revenue |
| Primo cliente FACTORY attivato | Direct | Revenue ricorrente |
| Testimonial video dal primo cliente | LinkedIn + sito | Social proof reale |
| Iterazione landing page basata su dati | Web | Ottimizzazione conversione |

**Budget marketing primi 90 giorni**: 0-500 EUR (LinkedIn ads opzionali, tutto il resto organico)

**KPI da tracciare**:
- Visite sito / settimana
- Lead (email raccolte) / settimana
- Discovery call prenotate / mese
- Proposte inviate / mese
- Conversion rate proposta → cliente
- Revenue MRR (Monthly Recurring Revenue)

---

## Prossimi Passi Immediati

1. [x] Completare STUDY-AIA-Piattaforma.md
2. [x] Completare sito web Astro
3. [x] Aggiornare PORTFOLIO-INDEX.md con track AIA
4. [ ] Scegliere nome azienda (108 + X) e nome prodotto
5. [ ] Registrare dominio e creare profilo LinkedIn aziendale
6. [ ] Iniziare Fase 2: Dashboard consulente
7. [ ] Primo deploy su VPS Hetzner per test end-to-end
8. [ ] Preparare 3 case study per il sito
