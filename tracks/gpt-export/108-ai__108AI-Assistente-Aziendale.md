# Piattaforma AI Assistente Aziendale — Studio di Fattibilita e Architettura

**Autore**: Elios Scoglio
**Data**: 2026-06-07
**Versione**: 1.0 — Studio esplorativo
**Status**: Draft per discussione

---

## Executive Summary

Questo documento esplora la fattibilita di costruire una **piattaforma AI personalizzabile per PMI** che integri:
- Client desktop/web con multi-agente e multi-modello
- Knowledge base aziendale ibrida (Qdrant vector + Neo4j graph)
- Interazione con strumenti aziendali (email, browser, file, ERP)
- Dashboard di gestione per consulente (multi-cliente)

Il modello di business e: **consulenza + piattaforma proprietaria**. Arrivi in azienda, capisci i processi, costruisci KB e agenti, consegni un sistema funzionante. La piattaforma e il veicolo tecnico del servizio CAIO-aaS.

**Evoluzione prevista**: PMI (servizio diretto) -> SaaS multi-tenant -> Franchising/licenza per altri consulenti.

---

## PARTE 1 — Valutazione dell'idea

### Perche e una buona idea [verificato]

1. **Il mercato c'e**: il 73% delle PMI italiane non ha adottato AI (Osservatorio PoliMI 2024). Quelle che provano si perdono tra tool sparsi senza governance.

2. **Il gap reale**: non mancano i modelli AI — manca chi **assembla il sistema** (KB + agenti + integrazioni) calato sul contesto aziendale specifico.

3. **Il tuo vantaggio competitivo**: sei uno dei pochissimi in Italia che ha gia costruito agenti AI in produzione (Agente-TO-EliosArch, Agente-TO-EliosAnalista), conosce MCP, e ha un framework consulenziale completo (portfolio Vision).

4. **Timing**: i costi dei modelli stanno crollando (Qwen/DeepSeek/Llama gratis o quasi). Chi costruisce l'infrastruttura di orchestrazione ADESSO avra un moat quando il mercato esplode.

5. **Lock-in positivo**: la KB aziendale e gli agenti personalizzati creano retention altissima. Il cliente non puo "portarsi via" facilmente il sistema configurato.

### Rischi principali [da mitigare]

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Mercato affollato di tool generici (ChatGPT Teams, Copilot, etc.) | Alto | Differenziarsi su personalizzazione + KB + agenti specifici, non sul "chat generico" |
| Tempi di sviluppo troppo lunghi prima del primo euro | Alto | MVP minimale in 4-6 settimane, non piattaforma completa |
| Dipendenza da API di terzi (OpenAI, Anthropic) | Medio | Multi-model fin dal giorno 1, includere modelli self-hosted |
| Cliente PMI non capisce il valore e compara con "ChatGPT gratis" | Alto | Vendere risultati (ore risparmiate), non tecnologia |
| Complessita di manutenzione multi-cliente | Medio | Architettura multi-tenant dal giorno 1, automazione deploy |

### Sfida critica

**Il peggior outcome se sbagli**: investi 6+ mesi a costruire una piattaforma troppo complessa che nessun cliente usa perche troppo tecnica o troppo generica. Il rischio non e tecnico — e di product-market fit.

**Mitigazione**: costruisci per UN cliente reale, con UN problema specifico, poi generalizza.

---

## PARTE 2 — Architettura della Soluzione

### 2.1 — Componenti principali

```
+------------------------------------------------------------------+
|                    DASHBOARD CONSULENTE (Web)                      |
|  - Gestione clienti/tenant                                        |
|  - Configurazione agenti per cliente                              |
|  - Gestione KB per cliente                                        |
|  - Monitoring: usage, costi, efficacia                            |
|  - Billing / subscription                                         |
+------------------------------------------------------------------+
         |                              |
         v                              v
+-------------------+     +----------------------------+
|   KB ENGINE       |     |   AGENT ORCHESTRATOR       |
| - Ingest docs     |     | - Multi-agent routing      |
| - Graph/Vector    |     | - Tool/MCP management      |
| - RAG pipeline    |     | - Model selection          |
| - Per-tenant      |     | - Memory/context           |
+-------------------+     +----------------------------+
         |                              |
         v                              v
+-------------------+     +----------------------------+
|   MODEL ROUTER    |     |   INTEGRATION LAYER        |
| - Claude/OpenAI   |     | - Email (IMAP/SMTP/Graph)  |
| - Qwen/DeepSeek   |     | - Browser (puppeteer)      |
| - Ollama (local)  |     | - File system              |
| - Cost routing    |     | - Calendar                 |
| - Fallback chain  |     | - ERP/CRM connectors       |
+-------------------+     +----------------------------+
         |                              |
         v                              v
+------------------------------------------------------------------+
|                     CLIENT (Desktop / Web)                         |
|  - Chat multi-agente                                              |
|  - Selezione agente / KB                                          |
|  - Azioni autonome + conferma utente                              |
|  - Alimentazione KB                                               |
+------------------------------------------------------------------+
```

### 2.2 — Stack Tecnologico Raccomandato

#### Backend / Orchestrator

| Componente | Opzione raccomandata | Alternative | Costo |
|---|---|---|---|
| **Linguaggio backend** | TypeScript (Node/Bun) | Python (FastAPI) | Free |
| **Framework agenti** | LangGraph (open source) | CrewAI, AutoGen, Haystack | Free |
| **Orchestrazione LLM** | LiteLLM (proxy multi-model) | OpenRouter, portkey.ai | Free (self-hosted) |
| **Knowledge Base vector** | Qdrant (self-hosted) | ChromaDB, Weaviate, Milvus | Free |
| **Knowledge Base graph** | Neo4j 5 Community + Cypher | Memgraph (scartato), FalkorDB, Apache AGE | Free (vedi ADR-001) |
| **RAG pipeline** | LlamaIndex | LangChain, Haystack | Free |
| **DB applicativo** | PostgreSQL + Drizzle ORM | SQLite (MVP), Supabase | Free |
| **Auth** | Lucia Auth o Better Auth | Clerk ($), Auth.js | Free |
| **Queue/Jobs** | BullMQ (Redis) | Inngest, Trigger.dev | Free |
| **Hosting** | Hetzner VPS (CX31: ~15 EUR/mese) | Contabo, OVH, self-hosted | 15-50 EUR/mese |

#### Modelli AI (costo per 1M token output)

| Provider | Modello | Costo output/1M | Note |
|---|---|---|---|
| **Alibaba Qwen** | Qwen2.5-72B (via Together/Fireworks) | ~$0.90 | Ottimo rapporto qualita/prezzo |
| **DeepSeek** | DeepSeek-V3 | ~$0.28 | Economicissimo, buona qualita |
| **Meta Llama** | Llama 3.3 70B (self-hosted Ollama) | $0 (solo compute) | Gratis su hardware proprio |
| **Google** | Gemini 2.0 Flash | ~$0.30 | Veloce, economico, context lungo |
| **Anthropic** | Claude Sonnet 4 | ~$15 | Qualita top, costoso — usare per task critici |
| **OpenAI** | GPT-4o-mini | ~$0.60 | Buon compromesso |
| **Mistral** | Mistral Large | ~$2.40 | EU-based, GDPR friendly |

**Strategia costi**: routing intelligente. Il 90% dei task (risposta FAQ, riassunti, classificazione) va su DeepSeek/Qwen. Solo il 10% (analisi complesse, decisioni critiche) va su Claude/GPT-4o.

#### Client Desktop

| Opzione | Pro | Contro | Costo |
|---|---|---|---|
| **Electron + React** | Massima flessibilita, accesso completo a OS, ecosistema ricco | Pesante (~100MB), memoria alta | Free |
| **Tauri + React/Svelte** | Leggero (~5MB), nativo, Rust backend sicuro | Ecosistema piu giovane, meno plugin | Free |
| **Progressive Web App (PWA)** | Zero install, funziona su tutti i device, aggiornamenti istantanei | Accesso OS limitato (no file system completo, no email diretta) | Free |
| **Web app + Agent locale** | Web app per chat + un piccolo agent installato per azioni OS | Best of both worlds, piu complesso da deployare | Free |

**La mia opinione [probabile]**:

Per il tuo caso raccomando: **Web app (PWA) + Agent locale leggero (opzionale)**.

Ragionamento:
- La **web app** e piu facile da aggiornare, non richiede installazione, funziona su qualsiasi device, e piu semplice da mantenere per un singolo sviluppatore.
- Per l'interazione con PC/email/browser: un **agent locale leggero** (un piccolo servizio Node/Python che gira in background) puo fare il bridge. Il cliente installa un .exe/.msi e quello fa da proxy locale.
- Alternativa: per l'email puoi usare OAuth + Microsoft Graph / Google API senza agent locale.
- Per il file system: un servizio locale e quasi obbligatorio se vuoi accesso a file locali del cliente.

**Evoluzione**: parti solo con web app (settimane 1-8), aggiungi l'agent locale quando hai il primo cliente che lo richiede.

---

## PARTE 3 — Cosa Esiste sul Mercato (Build vs Buy vs Integrate)

### 3.1 — Piattaforme complete (competitor/ispirazioni)

| Piattaforma | Cosa fa | Prezzo | Open Source? | Valutazione per te |
|---|---|---|---|---|
| **Dify.ai** | AI workflow builder, RAG, agenti, multi-model | Free self-hosted, cloud da $59/mese | Si (Apache 2.0) | **Candidato #1 come base** — piu vicino a cio che vuoi |
| **Langflow** | Visual agent builder, RAG, multi-model | Free self-hosted | Si (MIT) | Buono per prototipazione veloce |
| **n8n + AI nodes** | Workflow automation con nodi AI | Free self-hosted | Si (Fair-code) | Ottimo per integrazioni, meno per chat |
| **OpenWebUI** | Frontend ChatGPT-like per Ollama/OpenAI | Free | Si (MIT) | **Candidato #1 come client** |
| **AnythingLLM** | Workspace AI con RAG, agenti, multi-model | Free self-hosted | Si (MIT) | Buon all-in-one per PMI |
| **Flowise** | Low-code LLM orchestration + RAG | Free self-hosted | Si (Apache 2.0) | Alternativa visual a Dify |
| **LobeChat** | Client AI multi-model con plugin | Free self-hosted | Si (MIT) | Bello come client, meno come piattaforma |
| **LibreChat** | Clone ChatGPT multi-provider | Free | Si (MIT) | Solo chat, no KB/agenti custom |
| **Khoj** | AI assistant personale con RAG | Free self-hosted | Si (AGPL) | Piccolo ma interessante per personal use |
| **Quivr** | "Second brain" con RAG | Free self-hosted | Si | Buono per KB, limitato come agenti |

### 3.2 — Tool specializzati per componenti singoli

| Componente | Tool open source | Note |
|---|---|---|
| **Knowledge Base a grafo** | Neo4j + LlamaIndex GraphRAG | Microsoft ha rilasciato GraphRAG open source |
| **RAG** | LlamaIndex, LangChain, Haystack | LlamaIndex e il piu maturo per RAG enterprise |
| **Multi-model routing** | LiteLLM, OpenRouter | LiteLLM e il migliore per self-hosted |
| **Agenti** | LangGraph, CrewAI, AutoGen | LangGraph = piu flessibile; CrewAI = piu semplice |
| **MCP Server** | @modelcontextprotocol/sdk | Tu gia lo conosci |
| **Browser automation** | Playwright, Puppeteer, Browser-Use | Browser-Use e specifico per AI |
| **Email** | Microsoft Graph API, Gmail API | OAuth, no password |
| **Desktop agent** | Tauri sidecar, Electron | Tauri piu leggero |
| **Vector DB** | Qdrant, ChromaDB, Milvus | Qdrant = miglior rapporto funzionalita/performance |

### 3.3 — La raccomandazione: Integrate, non costruire da zero

**[probabile] L'approccio migliore per te e un "platform assembly" — non un build from scratch.**

```
ARCHITETTURA RACCOMANDATA — MVP (4-8 settimane)
================================================

Layer 1 — Client:        OpenWebUI (fork o white-label)
                          + customizzazione per multi-tenant
                          + branding per cliente

Layer 2 — Backend:       Dify.ai (self-hosted)
                          + workflow/agenti custom per cliente
                          + RAG con documenti aziendali

Layer 3 — KB:            Qdrant (vector) + Neo4j (graph, fase 2)
                          + ingest pipeline (PDF, email, web)

Layer 4 — Models:        LiteLLM proxy
                          + routing per costo/qualita
                          + Ollama per modelli locali

Layer 5 — Integrazioni:  n8n per workflow
                          + MCP server custom per tool aziendali

Layer 6 — Dashboard:     Custom (Next.js o SvelteKit)
                          + multi-tenant management
                          + billing (Stripe)
```

**Cosa costruisci TU da zero (il tuo valore aggiunto):**
1. La **dashboard consulente** multi-tenant (gestione clienti, agenti, KB)
2. I **template di agenti** per casi d'uso PMI (customer service, documentazione, reportistica)
3. La **metodologia di onboarding** (come mappare processi aziendali -> agenti)
4. I **connettori specifici** per tool italiani (fatturazione, PEC, SPID?)
5. Il **model router intelligente** (quale modello per quale task, ottimizzando costi)

**Cosa NON costruisci (usi open source):**
- Il motore di chat (OpenWebUI/LobeChat)
- Il RAG engine (LlamaIndex/Dify)
- Il vector store (Qdrant)
- L'orchestratore LLM (LiteLLM)
- Le integrazioni standard (n8n)

---

## PARTE 4 — Roadmap di Sviluppo

### Fase 0 — Validazione (Settimane 1-2) [CRITICA]

**Obiettivo**: confermare che un cliente reale pagherebbe per questo.

- [ ] Identifica 2-3 PMI dal tuo network che hanno gia provato ChatGPT ma non l'hanno integrato
- [ ] Fai una demo con Dify + OpenWebUI (esistenti, zero sviluppo) su un caso d'uso specifico loro
- [ ] Se dicono "quanto costa?", hai validato. Se dicono "carino ma...", approfondisci cosa manca
- [ ] Raccogli i 3 use case piu richiesti

**Investimento**: 0 EUR, 2-3 giorni del tuo tempo.

### Fase 1 — MVP (Settimane 3-8)

**Obiettivo**: primo cliente pagante con un sistema funzionante.

| Settimana | Cosa | Deliverable |
|---|---|---|
| 3-4 | Setup infrastruttura base | VPS Hetzner + Dify + LiteLLM + Qdrant |
| 4-5 | Configurazione per 1 cliente pilota | KB caricata, 2-3 agenti configurati |
| 5-6 | Client web personalizzato | OpenWebUI customizzato o semplice web app React |
| 6-7 | Integrazioni base | Email (OAuth), calendario, 1-2 tool del cliente |
| 7-8 | Test con utenti reali del cliente | Feedback, fix, stabilizzazione |

**Costo infrastruttura MVP**: ~50-80 EUR/mese (VPS + dominio + email transazionale)

**Pricing per primo cliente**: 1.500-3.000 EUR setup + 300-500 EUR/mese hosting e manutenzione

### Fase 2 — Multi-tenant (Mesi 3-6)

**Obiettivo**: 3-5 clienti attivi, dashboard consulente.

- [ ] Dashboard gestione clienti (Next.js/SvelteKit custom)
- [ ] Onboarding semi-automatizzato (template agenti per settore)
- [ ] Knowledge base a grafo (Neo4j) per relazioni complesse
- [ ] Agent locale per interazione PC (Tauri sidecar)
- [ ] Billing automatizzato (Stripe)
- [ ] Libreria di 10+ agenti template per casi d'uso comuni

**Costo infrastruttura**: ~150-300 EUR/mese (scaling con clienti)

**Revenue target**: 5 clienti x 400 EUR/mese = 2.000 EUR/mese ricorrente + setup

### Fase 3 — Prodotto (Mesi 6-12)

**Obiettivo**: SaaS stabile, onboarding self-service per altri consulenti.

- [ ] Onboarding self-service (il consulente si registra e configura il suo tenant)
- [ ] Marketplace agenti (template condivisibili/vendibili)
- [ ] API pubblica per integrazioni
- [ ] Documentazione completa
- [ ] White-label per partner
- [ ] Modello franchising: consulente paga licenza piattaforma + revenue share

**Pricing SaaS/Franchising [probabile]:**
- Licenza base consulente: 99-199 EUR/mese (include fino a 5 clienti)
- Per-client add-on: 30-50 EUR/mese/cliente
- Enterprise (>20 clienti): custom
- Revenue share su AI usage: 10-20% del costo modelli

---

## PARTE 5 — Confronto con Alternative di Mercato

### 5.1 — "Perche non uso semplicemente Dify/AnythingLLM e basta?"

**Puoi farlo.** Per i primi 1-2 clienti, Dify self-hosted e sufficiente. Ma il problema e:

1. **Non e multi-tenant**: ogni cliente richiede un'istanza separata o configurazione manuale
2. **Non ha la dashboard consulente**: non puoi gestire 10 clienti efficientemente
3. **Non ha i tuoi agenti specializzati**: il valore aggiunto e la tua metodologia
4. **Non e brandizzabile**: il cliente vede "Dify", non il tuo brand
5. **Non ha billing integrato**: gestisci fatture manualmente

Quindi: **Dify e il motore sotto il cofano, ma tu costruisci la carrozzeria**.

### 5.2 — "Perche non uso ChatGPT Teams / Copilot per Microsoft 365?"

| Criterio | ChatGPT Teams / Copilot | La tua piattaforma |
|---|---|---|
| Personalizzazione | Limitata (GPTs, prompt) | Totale (agenti, KB, workflow) |
| Knowledge base | Upload file (limitato) | RAG enterprise + grafo |
| Modello AI | Solo OpenAI / Solo Microsoft | Qualsiasi (routing per costo) |
| Costi per PMI 10p | ~$250-$500/mese | ~300-500 EUR/mese (tutto incluso) |
| Integrazioni | Solo ecosistema proprio | Qualsiasi (MCP, n8n) |
| Controllo dati | Cloud USA | Self-hosted EU / on-prem |
| Agenti specifici | No | Si, costruiti sui processi del cliente |

**Il tuo pitch**: "ChatGPT e generico. Io ti costruisco un assistente che conosce la TUA azienda, parla con i TUOI sistemi, e costa meno."

### 5.3 — Alternative SaaS esistenti per consulenti AI

| Piattaforma | Cosa offre | Prezzo | Limit |
|---|---|---|---|
| **CustomGPT.ai** | White-label chatbot con RAG | Da $89/mese | Solo chat, no agenti |
| **Botpress** | Agent builder visual | Free tier | Complesso, orientato chatbot |
| **Voiceflow** | Conversational AI builder | Da $50/mese | Orientato voice/chat, no agenti generici |
| **Stack AI** | No-code AI workflow per enterprise | Da $199/mese | Costoso, orientato enterprise |
| **Relevance AI** | AI workforce/agents | Da $99/mese | Buono ma costoso per PMI |

**Nessuno di questi** offre il pacchetto completo: KB a grafo + multi-model + agenti custom + integrazioni PC + dashboard consulente + white-label. Questo e il tuo spazio.

---

## PARTE 6 — Modello Economico

### Costi fissi mensili (stimati)

| Voce | MVP (mese 1-3) | Growth (mese 4-12) |
|---|---|---|
| VPS Hetzner (CX31 + storage) | 30 EUR | 80-150 EUR |
| Dominio + SSL | 5 EUR | 5 EUR |
| Email transazionale (Resend) | 0 (free tier) | 20 EUR |
| API AI (LiteLLM -> providers) | 50-100 EUR | 200-500 EUR (ribaltato su clienti) |
| Monitoring (Grafana Cloud free) | 0 | 0 |
| Backup (Hetzner Storage Box) | 5 EUR | 15 EUR |
| **Totale** | **~90-140 EUR/mese** | **~320-690 EUR/mese** |

### Revenue model

| Servizio | Prezzo | Tipo |
|---|---|---|
| **Setup iniziale** (audit + configurazione KB + agenti) | 1.500-5.000 EUR | Una tantum |
| **Hosting + manutenzione** | 300-800 EUR/mese | Ricorrente |
| **Aggiunta agenti/integrazioni** | 500-2.000 EUR cadauno | Una tantum |
| **Training team cliente** | 500-1.000 EUR | Una tantum |
| **CAIO-aaS** (governance + piattaforma) | 1.500-4.000 EUR/mese | Ricorrente premium |

### Proiezione revenue (conservativa)

| Mese | Clienti | MRR | Costo infra | Margine |
|---|---|---|---|---|
| 3 | 1 | 500 EUR | 100 EUR | 400 EUR |
| 6 | 3 | 1.500 EUR | 200 EUR | 1.300 EUR |
| 9 | 5 | 3.000 EUR | 350 EUR | 2.650 EUR |
| 12 | 8 | 5.000 EUR | 500 EUR | 4.500 EUR |
| 18 | 12 + 2 consulenti | 8.000 EUR | 700 EUR | 7.300 EUR |

A questo si aggiungono i setup una tantum: 3-5 setup/mese x 2.500 EUR = 7.500-12.500 EUR/mese aggiuntivi a regime.

---

## PARTE 7 — Knowledge Base a Grafo: Si o No?

### Perche un grafo (e non solo vettori)

I vettori (embedding + ricerca semantica) funzionano bene per:
- "Trova documenti simili a questa domanda"
- Ricerca per significato in documenti non strutturati

Il **grafo** aggiunge:
- Relazioni esplicite: "Questo prodotto e venduto da questo reparto che e gestito da questa persona"
- Ragionamento multi-hop: "Chi e responsabile del processo che genera questo report?"
- Contesto strutturato: organigrammi, processi, dipendenze, workflow

### Quando serve il grafo

| Caso d'uso | Solo vettori | Vettori + Grafo |
|---|---|---|
| FAQ/documentazione | Sufficiente | Overkill |
| Processi aziendali con ruoli | Limitato | Necessario |
| Relazioni clienti/prodotti/persone | Limitato | Necessario |
| Troubleshooting con dipendenze | Limitato | Necessario |
| Onboarding nuovi dipendenti | Sufficiente | Migliore |

### Decisione implementata (ADR-001)

**Architettura ibrida Neo4j 5 Community + Qdrant:**
- **Qdrant** per vector search (embedding 1536d, HNSW, filtering avanzato, quantization)
- **Neo4j** per graph traversal (Cypher, entity relations, professional knowledge graph)
- **Fusion layer** combina entrambi i contesti nel prompt LLM

**Perche non Memgraph:** Cypher incompleto (~80%), richiede 4-6GB RAM per dataset medio, ecosystem piccolo, no full-text index nativo.

**Perche non solo Neo4j vector (v5.11+):** no HNSW tuning, no quantization, no hybrid scoring, ordini di grandezza piu lento di Qdrant su >100K vettori.

**Perche non solo Qdrant:** impossibile modellare relazioni (ENABLES, CONTRADICTS, MITIGATES), nessun reasoning chain, knowledge graph professionale perde struttura.

Il pattern GraphRAG (entity extraction + graph traversal + vector search) e implementato nativamente nella piattaforma (Phase 4). Vedi `aia-platform/docs/ADR-001-neo4j-graph-vector.md` per analisi comparativa completa.

---

## PARTE 8 — Client: Opinione Tecnica Approfondita

### Opzione A: Solo Web App (PWA)

```
PRO:
+ Zero installazione
+ Aggiornamenti istantanei (deploy = tutti aggiornati)
+ Funziona su mobile/tablet/PC
+ Manutenzione minima (un solo codebase)
+ Tempo di sviluppo: 3-4 settimane per MVP

CONTRO:
- No accesso file system locale (senza agent)
- No interazione diretta con app desktop
- Limitato su notifiche push (dipende da OS)
- Percepito come "meno serio" di un'app installata (bias psicologico)
```

### Opzione B: App Desktop (Tauri/Electron)

```
PRO:
+ Accesso completo a file system
+ Puo lanciare processi, leggere email locali
+ Tray icon, hotkey globali, always-on
+ Percepito come "prodotto vero"
+ Offline mode possibile (con Ollama locale)

CONTRO:
- Doppia manutenzione (web + desktop)
- Installazione richiesta (barrier)
- Aggiornamenti da gestire (auto-updater)
- Cross-platform (Win + Mac) = piu lavoro
- Tempo di sviluppo: 6-8 settimane per MVP
```

### Opzione C: Web App + Micro-Agent locale [RACCOMANDATA]

```
PRO:
+ Chat/KB/agenti via web (zero installazione per quelli)
+ Micro-agent locale (20MB, tray icon) solo per azioni OS
+ Il micro-agent espone un server MCP locale che la web app chiama
+ Separa le responsabilita: UI online, azioni offline
+ Aggiornamenti UI istantanei, agent locale aggiornato raramente
+ Puo partire SENZA agent locale e aggiungerlo dopo

CONTRO:
- Due codebase (web + agent), ma agent e piccolo e stabile
- L'utente deve installare l'agent per funzionalita avanzate
```

**Perche Opzione C**: parti con la web app (settimane 1-4), la rendi funzionale per chat/KB/agenti. Quando un cliente chiede "ma puo leggere i miei file Excel?" -> sviluppi il micro-agent. Non prima.

Il micro-agent in Tauri (Rust + webview) pesa ~5MB e puo:
- Monitorare cartelle locali (nuovi file -> ingest in KB)
- Leggere/scrivere file su richiesta dell'agente (con conferma utente)
- Inviare email via client locale (Outlook COM, Thunderbird)
- Aprire URL nel browser
- Eseguire script/comandi (con conferma)

---

## PARTE 9 — Interazione Autonoma vs Conferma

### Modello a 3 livelli

| Livello | Azione | Conferma? | Esempio |
|---|---|---|---|
| **Read-only** | Leggere file, cercare in KB, consultare email | Mai | "Cerca nel CRM il cliente X" |
| **Low-risk write** | Creare bozza email, generare report, annotare | Opzionale (configurabile) | "Prepara la risposta a questa email" |
| **High-risk action** | Inviare email, modificare file, pubblicare | Sempre | "Invia questa email al cliente" |

L'utente (o il consulente in fase di setup) configura per ogni agente quali azioni richiedono conferma. Default: tutto in conferma tranne read-only.

**UX suggerita**: 
- L'agente propone l'azione in chat: "Vorrei inviare questa email a mario@cliente.it. [Approva] [Modifica] [Rifiuta]"
- Per azioni batch: "Ho trovato 5 fatture da classificare. [Mostra anteprima] [Esegui tutte] [Una alla volta]"

---

## PARTE 10 — Nome, Posizionamento, Integrazione con Portfolio

### Come si integra nel tuo portfolio esistente

```
PORTFOLIO ATTUALE                    PIATTAFORMA
================                    ===========

AI Quick Start (1.500-3.500 EUR)    Include: setup piattaforma base
    |                                        + 2-3 agenti
    v                                        + KB iniziale
AI Strategico (4.000-15.000 EUR)    Include: piattaforma completa
    |                                        + 5-7 agenti
    v                                        + integrazioni
CAIO-aaS (1.500-4.000 EUR/mese)     Include: piattaforma + governance
                                             + evoluzione continua
                                             + nuovi agenti/mese
```

La piattaforma diventa il **deliverable tangibile** che il cliente riceve. Non piu "ti ho fatto consulenza e ti lascio un PDF". Ma "ti lascio un SISTEMA funzionante che continua a produrre valore anche dopo che me ne vado".

### Naming (suggerimenti)

| Nome | Pro | Contro |
|---|---|---|
| **MindForge** | Evocativo, "forgiare la mente aziendale" | Forse troppo generico |
| **CortexAI** | Tecnico ma comprensibile | Tanti "Cortex" in giro |
| **FlowMind** | Flow = flusso di lavoro + mente | Carino |
| **AziendAI** | Italianissimo, chiaro | Limita a mercato italiano |
| **OracleDesk** | Oracle = sapienza + Desk = scrivania | Oracle e un trademark |
| **NeuronDesk** | Neurone + desk (assistente) | Tecnico |

Nota: il nome non e urgente per il MVP. Scegli dopo aver validato.

---

## PARTE 11 — Checklist Decisioni da Prendere

Prima di iniziare lo sviluppo, conferma:

- [ ] **Primo cliente pilota**: chi e? quale settore? quale problema specifico?
- [ ] **Linguaggio backend**: TypeScript (piu veloce per te?) o Python (piu ecosistema AI)?
- [ ] **Base platform**: Dify (piu completo) o build custom su LangGraph (piu controllo)?
- [ ] **Client base**: OpenWebUI fork o custom React/Next.js?
- [ ] **Hosting iniziale**: Hetzner (EU, economico) o DigitalOcean (piu semplice)?
- [ ] **Modelli default**: Quale mix? Suggerisco: DeepSeek per routine, Claude per complesso
- [ ] **Grafo KB**: subito (settimana 1) o solo vettori e poi aggiungi (mese 3)?
- [ ] **Branding**: nome provvisorio per il MVP?
- [ ] **Pricing primo cliente**: quanto chiedi per il pilota? (Suggerisco: 50% sconto in cambio di case study)

---

## PARTE 12 — Prossimi Passi Concreti

### Questa settimana

1. **Installa e testa Dify** self-hosted su un VPS di test (o Docker locale)
2. **Installa OpenWebUI** e collegalo a LiteLLM con 2-3 modelli
3. **Carica una KB di test** (documenti di una PMI che conosci) e testa il RAG
4. **Identifica 1 cliente pilota** dal tuo network

### Prossime 2 settimane

5. **Fai una demo live** al cliente pilota (anche se grezza)
6. **Definisci 3 agenti specifici** per il suo caso d'uso
7. **Valida il pricing**: "Pagheresti 300 EUR/mese per questo?"

### Mese 1

8. **Costruisci il MVP** con l'approccio scelto
9. **Deploy per il primo cliente** con monitoraggio attivo
10. **Documenta tutto**: sara la base per il secondo cliente

---

## TOKEN & COSTO STIMATO

| Voce | Valore |
|---|---|
| Lunghezza documento | ~550 righe |
| Token input stimati | ~15.000 (contesto + documenti letti) |
| Token output stimati | ~8.000 |
| Modello | Claude (Bedrock) |
| Costo output stimato | ~$0.60 |
| Costo totale sessione | ~$0.85 |

---

*v1.0 — 2026-06-07 — Studio esplorativo iniziale. Da aggiornare dopo validazione con primo cliente.*
