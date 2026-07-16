# STUDY-AIA-Piattaforma.md
## Il Manuale di Studio per la Piattaforma AI Assistente Aziendale

**Track:** AIA — Piattaforma AI per PMI
**Autore:** Elios Scoglio — per uso personale, studio, delivery e formazione futuri partner
**Versione:** 1.0 — Giugno 2026
**Tono:** Tecnico-operativo. Niente teoria senza pratica. Ogni sezione deve farti piu capace di ieri.

---

> *"Il futuro non appartiene a chi costruisce l'AI migliore. Appartiene a chi la porta nel posto giusto, alle persone giuste, nel modo giusto."*

---

## Come usare questo manuale

Questo manuale e diviso in 10 Parti + 4 Appendici. E pensato per essere letto in due modi:

1. **Sequenziale** — dalla Parte 1 alla 10, per costruire comprensione completa
2. **Per consultazione** — ogni Parte e autonoma, saltaci quando serve

Ogni Parte contiene:
- La spiegazione del concetto (senza giri di parole)
- Il perche conta per il tuo business e per il cliente
- Numeri reali (costi, margini, ore, percentuali)
- Box **Attenzione!** per rischi critici
- Box **Pro tip** per insight operativi che si imparano solo sul campo
- Tabelle di confronto dove servono

Non e un documento teorico. E un manuale per FARE. Se dopo averlo letto non sai come agire, ho fallito.

---

## PARTE 1 — Fondamenti: Perche una Piattaforma AI per PMI

### 1.1 Il landscape di mercato

Il mercato italiano delle PMI e composto da circa 4.4 milioni di imprese. Di queste, circa 200.000 hanno tra 10 e 250 dipendenti — il nostro segmento target primario. Dati Osservatorio Politecnico Milano 2025:

- 78% delle PMI italiane non ha ancora implementato AI nei processi operativi
- 45% ha "provato" strumenti AI generici (ChatGPT, Copilot) senza integrazione
- Solo il 12% ha un progetto AI strutturato con governance
- Il mercato AI per PMI in Italia vale circa 1.2 miliardi EUR nel 2026, in crescita del 35% annuo

Le PMI hanno bisogno di AI ma non possono costruirsela da sole perche:
- Non hanno team AI interni (troppo costosi: un ML engineer costa 60-80K/anno)
- Non hanno il tempo di sperimentare (il core business viene prima)
- Non sanno da dove partire (il mercato e confuso, pieno di hype)
- Non sanno distinguere tra strumenti utili e mode costose
- Hanno paura dei costi incontrollabili (il "quanto mi costa al mese?" terrorizza)

### 1.2 Il gap tra enterprise AI e consumer AI

Esiste un vuoto enorme nel mercato:

| Segmento | Costo | Tempo | Risultato |
|---|---|---|---|
| **Enterprise AI** (McKinsey, Accenture, custom dev) | 200K-2M EUR | 6-18 mesi | Potente ma accessibile solo a grandi aziende |
| **Consumer AI** (ChatGPT, Copilot, Gemini) | 20-30 EUR/utente/mese | Immediato | Generico, no knowledge aziendale, no integrazioni vere |
| **IL GAP** | 5K-15K EUR + 300-800/mese | 4-6 settimane | Personalizzato, integrato, governato — PER LE PMI |

Questo gap e la tua opportunita. Non competi con McKinsey (troppo caro per il tuo target) ne con ChatGPT (troppo generico per i problemi reali). Competi nel mezzo, dove nessuno ha ancora vinto.

### 1.3 L'opportunita "AI as a Service" per consulenti

Il modello "piattaforma + consulenza" ha 5 vantaggi strutturali:

1. **Revenue ricorrente.** Il setup paga le bollette. Il retainer costruisce il business. Un cliente FACTORY a 2.500 EUR/mese per 12 mesi = 30.000 EUR da un singolo cliente.

2. **Moat crescente.** La KB del cliente diventa piu ricca ogni mese. Gli agenti diventano piu precisi. Il valore cresce col tempo — e con esso la difficolta di sostituirti.

3. **Scalabilita.** A differenza della consulenza pura (vendi ore), qui vendi un sistema che lavora 24/7. Le ore necessarie per gestire un cliente FACTORY calano dopo il primo trimestre (da 20h/mese a 12-15h/mese).

4. **Differenziazione forte.** Il consulente generico vende slide e workshop. Tu consegni un sistema operativo che produce risultati misurabili. E un posizionamento molto piu difendibile.

5. **Upsell naturale.** Dal sistema AI si apre la porta a consulenza architetturale, trasformazione digitale, CAIO-aaS. La piattaforma e il cavallo di Troia per relazioni consulenziali piu ampie.

### 1.4 Confronto competitivo: chi c'e gia sul mercato

| Competitor | Modello | Forza | Debolezza | Come li batti |
|---|---|---|---|---|
| **Dify** | Open-source, self-hosted | Gratuito, flessibile, community attiva | Richiede competenze tech, no supporto, no consulenza | Tu offri il sistema GIA configurato + la competenza consulenziale |
| **FlowiseAI** | Open-source, visual builder | UI drag-and-drop, facile per prototipi | Limitato per produzione seria, no multi-tenant nativo | Tu offri produzione enterprise-grade con governance |
| **n8n + AI** | Automazione + LLM nodes | Potente per workflow, auto-hostable | Non e una piattaforma AI nativa, KB limitata | Tu offri RAG serio, agenti specializzati, KB strutturata |
| **LangFlow** | Visual LangChain | Prototipazione rapida | Instabile in produzione, no governance | Tu offri stabilita, SLA, monitoring |
| **CustomGPT / Chatbase** | SaaS chatbot con upload docs | Veloce da setup, basso costo entry | Solo chatbot, no integrazioni, no agenti multipli, no governance | Tu offri sistema completo, non un chatbot |
| **Software house custom** | Sviluppo su commessa | Puo fare qualsiasi cosa | 50-100K EUR, 6-12 mesi, no garanzia qualita AI | Tu offri time-to-value 10x piu rapido a 1/10 del costo |
| **Copilot / ChatGPT Teams** | SaaS enterprise | Brand trust, facile da comprare | Generico, costoso per user, no KB vera, no governance | Tu offri personalizzazione profonda a costo inferiore totale |

### 1.5 Perche "piattaforma + consulting" batte la consulenza pura e il software puro

**Solo consulenza (vendo tempo):**
- Revenue lineare: piu guadagni = piu lavori
- Nessun asset che cresce nel tempo
- Cliente ti sostituisce appena impara
- Niente lock-in positivo

**Solo software (vendo licenze):**
- Richiede investimento enorme in sviluppo
- Supporto e onboarding costano
- Churn alto se il cliente non capisce come usarlo
- Nessuna relazione umana

**Piattaforma + Consulting (il nostro modello):**
- Revenue ricorrente dal software (hosting/retainer)
- Valore cresce nel tempo (KB, agenti, integrazioni)
- Relazione umana che riduce churn
- Lock-in positivo: il sistema diventa indispensabile
- Differenziazione: nessuno offre esattamente la stessa cosa

> **Attenzione!** Il lock-in positivo e etico SOLO se il cliente puo andarsene portando via i suoi dati. Mai creare lock-in tecnico (formati proprietari, dati non esportabili). Il lock-in deve essere di valore: "resto perche il sistema mi serve", non "resto perche non posso andarmene".

> **Pro tip** Il tuo primo cliente in assoluto dovrebbe essere un cliente "amico" — qualcuno che ti conosce, si fida, e accetta di essere il tuo caso pilota in cambio di un prezzo ridotto (50-60% del listino). Da quel caso costruisci case study, referenze, e confidenza operativa. Non vendere mai a prezzo pieno qualcosa che non hai ancora consegnato almeno una volta.

---

## PARTE 2 — Architettura Tecnica Approfondita

### 2.1 Architettura a 7 livelli

```
[Internet/Cliente]
       |
       v
+-------------------------------+
| L1 - REVERSE PROXY (Traefik) |  SSL termination, rate limiting, routing
+-------------------------------+
       |
       v
+-------------------------------+
| L2 - API GATEWAY (Hono)      |  Auth JWT, tenant resolution, rate limit per-tenant
+-------------------------------+
       |
       v
+-------------------------------+
| L3 - SERVICES LAYER          |  Agent Orchestrator, KB Service, Integration Service
+-------------------------------+
       |
       v
+-------------------------------+
| L4 - LLM ROUTER (LiteLLM)   |  Model selection, cost tracking, fallback, caching
+-------------------------------+
       |
       v
+-------------------------------+
| L5 - AI MODELS               |  Claude API, OpenAI API, DeepSeek, Ollama (local)
+-------------------------------+

+-------------------------------+
| L6 - DATA LAYER              |  PostgreSQL+pgvector, Qdrant, Redis, Neo4j
+-------------------------------+

+-------------------------------+
| L7 - MONITORING              |  Prometheus, Grafana, alerting, cost dashboard
+-------------------------------+
```

**L1 — Traefik (Reverse Proxy):**
- SSL/TLS termination con Let's Encrypt automatico
- Routing basato su hostname (tenant1.piattaforma.it, tenant2.piattaforma.it)
- Rate limiting globale (protezione DDoS base)
- Health check automatici sui servizi backend

**L2 — API Gateway (Hono su Bun/Node):**
- Autenticazione JWT (validazione firma, iss, aud, exp)
- Risoluzione tenant dal token o dall'header
- Rate limiting per-tenant (evita che un cliente monopolizzi le risorse)
- Request logging strutturato (JSON, no PII)
- CORS management

**L3 — Services Layer:**
- `AgentOrchestrator`: riceve la richiesta, seleziona l'agente, gestisce il flusso conversazionale
- `KBService`: gestisce ingestione documenti, chunking, embedding, retrieval
- `IntegrationService`: connessioni con sistemi esterni (email, file, calendario)
- `AdminService`: gestione utenti, permessi, configurazioni

**L4 — LiteLLM Router:**
- Routing multi-modello basato su regole (costo, qualita, latenza)
- Fallback automatico se il provider primario non risponde
- Token counting e cost tracking per-tenant
- Response caching per query frequenti identiche
- Budget cap con alert automatico

**L5 — AI Models:**
- Tier 1 (Fast/Cheap): Claude Haiku, GPT-4o-mini, DeepSeek → FAQ, classificazione, riassunti
- Tier 2 (Balanced): Claude Sonnet, GPT-4o → analisi documenti, generazione contenuti
- Tier 3 (Powerful): Claude Opus → ragionamento complesso, analisi contratti, strategia
- Tier 4 (Self-hosted): Ollama + Qwen/Llama → dati ultra-sensibili che non devono uscire

**L6 — Data Layer:**
- PostgreSQL + pgvector: dati strutturati + embeddings (per setup semplici)
- Qdrant: vector DB dedicato (per setup con >1000 documenti o requisiti di performance)
- Redis: cache sessioni, cache risposte frequenti, pub/sub per eventi
- Neo4j: knowledge graph per relazioni tra entita (opzionale, per setup avanzati)

**L7 — Monitoring:**
- Prometheus: metriche (latenza, error rate, token usage, costi)
- Grafana: dashboard per consulente e per cliente
- Alerting: notifiche su anomalie (accuracy drop, costi fuori budget, downtime)

### 2.2 Multi-tenancy design

Ogni cliente e un "tenant" isolato. L'isolamento avviene a tre livelli:

| Componente | Strategia di isolamento | Perche |
|---|---|---|
| **PostgreSQL** | Schema condiviso con `tenant_id` su ogni tabella (Row-Level Security) | Semplicita, costo basso, backup unico |
| **Qdrant** | Collection separata per tenant (`tenant_{id}_kb`) | Isolamento forte delle embeddings, nessun rischio di cross-contamination |
| **Redis** | Prefix per tenant (`tenant:{id}:cache:*`) | Semplicita, possibilita di flush per-tenant |
| **Neo4j** | Label per tenant o database separato (se >10 clienti) | Isolamento grafo relazioni |
| **File storage** | Directory per tenant (`/data/tenants/{id}/`) | Isolamento documenti sorgente |
| **LiteLLM** | API key e budget per tenant | Controllo costi granulare |

**Row-Level Security in PostgreSQL:**
```sql
-- Policy RLS su ogni tabella
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Ogni request setta il tenant
SET app.current_tenant = 'uuid-del-tenant';
```

> **Attenzione!** Il RLS e una protezione a livello database, ma NON e sufficiente da solo. Il gateway deve validare il tenant dal JWT PRIMA di passare la richiesta al servizio. Mai fidarsi solo di un livello di protezione.

### 2.3 Model routing strategy

Il routing multi-modello e cio che rende la piattaforma economicamente sostenibile. Senza routing, i costi LLM esplodono.

**Regole di routing:**

| Tipo di task | Modello | Costo stimato/1K token | Latenza media |
|---|---|---|---|
| Classificazione email (urgenza, categoria) | Haiku / GPT-4o-mini | $0.0003 input, $0.001 output | 0.5-1s |
| FAQ dalla KB (risposta diretta) | Haiku / GPT-4o-mini | $0.0003 input, $0.001 output | 0.8-1.5s |
| Generazione bozze (email, contenuti) | Sonnet / GPT-4o | $0.003 input, $0.015 output | 2-4s |
| Analisi documenti complessi | Sonnet / GPT-4o | $0.003 input, $0.015 output | 3-6s |
| Ragionamento multi-step, strategia | Opus | $0.015 input, $0.075 output | 5-15s |
| Dati ultra-sensibili | Ollama (locale) | Solo costo server | 3-10s |

**Impatto economico del routing:**

Senza routing (tutto su Sonnet): ~250 EUR/mese per 5.000 query
Con routing ottimizzato: ~80 EUR/mese per 5.000 query

Risparmio: **68%** — differenza tra un business profittevole e uno che brucia margine.

**Configurazione LiteLLM (esempio semplificato):**
```yaml
model_list:
  - model_name: fast
    litellm_params:
      model: anthropic/claude-3-haiku-20240307
      api_key: ${ANTHROPIC_API_KEY}
  - model_name: balanced
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: ${ANTHROPIC_API_KEY}
  - model_name: powerful
    litellm_params:
      model: anthropic/claude-opus-4-20250514
      api_key: ${ANTHROPIC_API_KEY}
  - model_name: fallback
    litellm_params:
      model: openai/gpt-4o
      api_key: ${OPENAI_API_KEY}

router_settings:
  routing_strategy: "cost-optimized"
  fallback_models: ["fallback"]
  budget_limit: 500  # EUR/mese per tenant
```

### 2.4 RAG Pipeline in dettaglio

Il RAG (Retrieval Augmented Generation) e il cuore della piattaforma. E cio che trasforma un chatbot generico in un sistema che "conosce" l'azienda.

**Pipeline completa:**

```
[Documento] → [Preprocessing] → [Chunking] → [Embedding] → [Storage in Vector DB]
                                                                      |
[Query utente] → [Query Embedding] → [Retrieval] → [Reranking] → [Context Assembly] → [LLM Generation]
```

**Step 1 — Preprocessing:**
- Estrazione testo da PDF (PyMuPDF o pdfplumber)
- Estrazione da DOCX (python-docx)
- Estrazione da email (.eml parsing)
- Pulizia: rimozione header/footer ripetitivi, normalizzazione whitespace
- Metadata extraction: titolo, data, autore, tipo documento

**Step 2 — Chunking:**
Strategie diverse per tipi di documento diversi:

| Tipo documento | Strategia chunking | Dimensione chunk | Overlap |
|---|---|---|---|
| Procedure operative | Per sezione/heading | 500-800 token | 100 token |
| Contratti legali | Per clausola/articolo | 300-500 token | 50 token |
| FAQ | Una FAQ = un chunk | Variabile | 0 |
| Email | Per messaggio | Intero messaggio | 0 |
| Manuali tecnici | Per paragrafo con heading parent | 600-1000 token | 150 token |
| Tabelle/listini | Riga per riga con header ripetuto | Variabile | Header ripetuto |

**Step 3 — Embedding:**
- Modello: `text-embedding-3-small` (OpenAI) o `voyage-3` (Voyage AI)
- Dimensione: 1536 (OpenAI) o 1024 (Voyage)
- Costo: ~$0.02 per 1M token (~500 pagine di documenti per $0.02)
- Batch processing: embeddings in batch da 100 chunks per ridurre latenza

**Step 4 — Storage:**
```sql
-- In pgvector (per setup semplici)
CREATE TABLE chunks (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Step 5 — Retrieval:**
```typescript
// Query embedding + ricerca per similarita
const queryEmbedding = await embed(userQuery);
const results = await vectorDB.search({
  collection: `tenant_${tenantId}_kb`,
  vector: queryEmbedding,
  limit: 10,  // top-10 chunks piu simili
  filter: { documentType: 'procedure' },  // filtri opzionali
  scoreThreshold: 0.7  // minimo di similarita
});
```

**Step 6 — Reranking:**
Dopo il retrieval iniziale, un secondo modello (piu preciso ma piu lento) riordina i risultati:
- Cross-encoder model (es. `ms-marco-MiniLM-L-6-v2` o Cohere Rerank)
- Input: query + chunk candidato
- Output: score di rilevanza 0-1
- Mantieni solo i top-5 dopo reranking

**Step 7 — Context Assembly:**
```typescript
const contextWindow = assembleContext({
  systemPrompt: agentPrompt,           // ~500 token
  conversationHistory: lastNMessages,   // ~1000 token
  retrievedChunks: rerrankedTop5,       // ~2500 token
  userQuery: currentQuery,              // ~100 token
  // Totale: ~4100 token input
});
```

**Step 8 — Generation:**
Il modello LLM genera la risposta usando il contesto assemblato, con istruzione esplicita di:
- Citare la fonte per ogni informazione dalla KB
- Dichiarare quando non ha informazioni sufficienti
- Non inventare mai fatti non presenti nel contesto

### 2.5 Knowledge Base: vector vs graph vs hybrid

| Approccio | Quando usarlo | Pro | Contro |
|---|---|---|---|
| **Solo Vector** | KB < 2000 doc, query semplici | Semplice, economico, veloce | Non cattura relazioni tra entita |
| **Solo Graph** | Relazioni complesse (organigrammi, supply chain) | Ottimo per "chi e collegato a chi" | Non gestisce bene testo lungo |
| **Hybrid (Vector + Graph)** | KB grande, relazioni importanti | Best of both worlds | Piu complesso da gestire, costo piu alto |

**Quando aggiungere Neo4j:**
- Il cliente ha > 100 entita con relazioni significative (clienti, fornitori, prodotti, persone)
- Le query includono spesso "chi", "quale relazione", "percorso tra A e B"
- Esempio: "Chi e il referente per il contratto con Rossi Srl?" → graph query
- Esempio: "Quali fornitori hanno contratti in scadenza entro 60 giorni e sono collegati al progetto Gamma?" → graph + vector

**Per l'80% dei clienti PMI: solo vector e sufficiente.** Neo4j si aggiunge come upsell dopo 3-6 mesi quando la complessita lo richiede.

### 2.6 Security model

| Layer | Meccanismo | Dettaglio |
|---|---|---|
| **Transport** | TLS 1.3 everywhere | Certificati Let's Encrypt, auto-renewal |
| **Authentication** | JWT (RS256) | Token short-lived (15 min), refresh token (7 giorni) |
| **Authorization** | RBAC per tenant | Ruoli: admin, user, readonly |
| **Tenant isolation** | RLS + collection separation | Impossibile accedere a dati di un altro tenant |
| **Data at rest** | Encryption AES-256 | Dischi cifrati (LUKS su Hetzner) |
| **Secrets** | Environment variables + vault | Mai in codice, mai in log |
| **Audit** | Log ogni accesso critico | Chi ha fatto cosa, quando (retention 90 giorni) |
| **Backup** | Giornaliero, cifrato, off-site | Retention 30 giorni, test restore mensile |

### 2.7 Scalability path

| Fase | Clienti | Infrastruttura | Costo infra/mese |
|---|---|---|---|
| **MVP** | 1-5 | 1 VPS Hetzner (CX41: 8 vCPU, 16GB RAM, 160GB SSD) | ~40 EUR |
| **Growth** | 5-15 | 2 VPS (app + DB) + object storage | ~100 EUR |
| **Scale** | 15-30 | 3 VPS + managed DB + CDN | ~250 EUR |
| **Enterprise** | 30-50+ | Kubernetes cluster (Hetzner Cloud) o AWS EKS | ~500-1000 EUR |

> **Pro tip** Non partire da Kubernetes. Parti da un singolo VPS ben configurato. Docker Compose gestisce tranquillamente 5-10 clienti su una macchina da 40 EUR/mese. Kubernetes aggiunge complessita operativa che non ti serve finche non hai almeno 20 clienti. Il premature scaling e uno spreco di tempo e denaro.

---

## PARTE 3 — Il Modello di Business

### 3.1 Unit economics: costo per tenant

**Costo infrastrutturale per tenant (media su 10 clienti):**

| Voce | Small (5-15 pers.) | Medium (15-50 pers.) | Large (50-200 pers.) |
|---|---|---|---|
| Quota server (shared) | 8 EUR/mese | 15 EUR/mese | 30 EUR/mese |
| Storage vector DB | 3 EUR/mese | 8 EUR/mese | 20 EUR/mese |
| LLM API (media) | 40 EUR/mese | 120 EUR/mese | 300 EUR/mese |
| Backup + storage | 3 EUR/mese | 5 EUR/mese | 10 EUR/mese |
| Monitoring (quota) | 2 EUR/mese | 3 EUR/mese | 5 EUR/mese |
| **Totale costo infra** | **56 EUR/mese** | **151 EUR/mese** | **365 EUR/mese** |

**Costo del tuo tempo (governance FACTORY):**

| Attivita | Small | Medium | Large |
|---|---|---|---|
| Monitoring settimanale | 2h/mese | 3h/mese | 5h/mese |
| KB maintenance | 2h/mese | 4h/mese | 6h/mese |
| Tuning e nuovi agenti | 2h/mese | 4h/mese | 6h/mese |
| Report + call mensile | 1.5h/mese | 2h/mese | 2h/mese |
| Supporto | 1h/mese | 2h/mese | 3h/mese |
| **Totale ore/mese** | **8.5h** | **15h** | **22h** |

Se valorizzi il tuo tempo a 80 EUR/ora:

| Voce | Small | Medium | Large |
|---|---|---|---|
| Costo infra | 56 EUR | 151 EUR | 365 EUR |
| Costo tempo (@ 80 EUR/h) | 680 EUR | 1.200 EUR | 1.760 EUR |
| **Costo totale/mese** | **736 EUR** | **1.351 EUR** | **2.125 EUR** |

### 3.2 Revenue per tenant

**Modello A CORPO:**

| Pacchetto | Setup (una tantum) | Hosting/mese | Revenue anno 1 |
|---|---|---|---|
| Small | 5.000 EUR | 300 EUR | 5.000 + 3.600 = **8.600 EUR** |
| Medium | 8.000 EUR | 500 EUR | 8.000 + 6.000 = **14.000 EUR** |
| Large | 15.000 EUR | 800 EUR | 15.000 + 9.600 = **24.600 EUR** |

**Modello FACTORY:**

| Tier | Retainer/mese | Revenue anno 1 |
|---|---|---|
| Starter (1.500 EUR/mese) | 1.500 EUR | **18.000 EUR** |
| Growth (2.500 EUR/mese) | 2.500 EUR | **30.000 EUR** |
| Scale (4.000 EUR/mese) | 4.000 EUR | **48.000 EUR** |

### 3.3 Break-even analysis

**Scenario: inizio con 0 clienti, obiettivo profittabilita.**

Costi fissi personali (ipotesi):
- Infrastruttura base (VPS + tool): 100 EUR/mese
- Strumenti (LiteLLM, domini, email, tool vari): 50 EUR/mese
- Formazione e aggiornamento: 100 EUR/mese
- Marketing minimo (LinkedIn, contenuti): 100 EUR/mese
- **Totale costi fissi: 350 EUR/mese**

**Break-even con modello FACTORY:**
- 1 cliente Starter (1.500 EUR/mese): margine netto ~414 EUR/mese (dopo costi infra + tempo)
- Gia con 1 solo cliente copri i costi fissi e hai margine positivo

**Break-even con modello A CORPO:**
- 1 cliente Medium: 8.000 EUR setup = copre 5 mesi di costi + le ore di delivery
- Servono ~2 progetti A CORPO/trimestre per sostenibilita

### 3.4 Proiezioni margine per numero clienti

**Scenario FACTORY (retainer puro):**

| Clienti | Revenue/mese | Costi/mese (infra+tempo) | Margine lordo | Margine % |
|---|---|---|---|---|
| 3 (1S+1G+1Sc) | 8.000 | 4.212 | 3.788 | 47% |
| 5 (2S+2G+1Sc) | 12.000 | 6.914 | 5.086 | 42% |
| 10 (4S+4G+2Sc) | 24.000 | 13.828 | 10.172 | 42% |
| 20 (8S+8G+4Sc) | 48.000 | 27.656 | 20.344 | 42% |
| 50 (*) | 120.000 | ~65.000 | ~55.000 | 46% |

(*) A 50 clienti hai bisogno di almeno 1-2 collaboratori. Il margine migliora perche i costi infra hanno economia di scala ma il costo personale cresce.

> **Attenzione!** Questi numeri assumono churn 0%. In realta, aspettati un churn del 10-15% annuo. Ogni cliente perso va rimpiazzato. A 10 clienti, significa acquisire 1-2 nuovi clienti/anno solo per mantenere il livello attuale. Pianifica di conseguenza.

### 3.5 Pricing psychology per PMI italiane

Le PMI italiane hanno pattern di acquisto specifici:

1. **Soglia psicologica setup:** 5.000 EUR e "un progetto". 15.000 EUR e "un investimento serio che richiede approvazione". Sopra 20.000 EUR ci sono gare e comparazioni.

2. **Soglia psicologica mensile:** 500 EUR/mese e "un servizio". 2.500 EUR/mese e "uno stipendio part-time" (confronto immediato col costo dipendente). Sopra 4.000 EUR devi dimostrare valore eccezionale.

3. **L'ancoraggio funziona.** Presenta sempre 3 opzioni. L'opzione media verra scelta nel 60% dei casi. L'opzione alta serve per far sembrare la media ragionevole.

4. **Il ROI deve essere ovvio.** "Costa 500/mese e risparmia 1.500/mese di lavoro" si vende da solo. "Costa 500/mese e migliora l'efficienza" non si vende.

5. **Pagamento anticipato trimestrale** riduce il churn e migliora il tuo cash flow. Offri 10% di sconto per pagamento semestrale.

### 3.6 Churn prevention

| Strategia | Come | Quando |
|---|---|---|
| **Monthly value report** | Report con ore risparmiate e ROI | Ogni mese |
| **Evoluzione continua** | Aggiungi almeno 1 miglioramento/mese | Ongoing |
| **Check-in proattivo** | Chiama se l'uso cala (< 10 interazioni/settimana) | Entro 2 settimane dal calo |
| **Champion nurturing** | Mantieni forte la relazione col champion interno | Ongoing |
| **KB growing value** | Mostra quanto la KB e cresciuta (N documenti, accuracy) | Trimestralmente |
| **New use case discovery** | Proponi nuovi use case basati sull'uso effettivo | Ogni 3 mesi |

### 3.7 Upselling path

```
Base (2 agenti, KB small)         → Entry point
    |
    v dopo 3 mesi
Full Integration (+CRM, +ERP)    → +1.000-3.000 EUR add-on
    |
    v dopo 6 mesi
Graph KB (Neo4j, relazioni)       → +500-1.000 EUR/mese
    |
    v dopo 9 mesi
Custom Agents (+3 agenti avanzati) → upgrade tier
    |
    v dopo 12 mesi
Multi-department rollout           → secondo contratto o upgrade Scale
```

> **Pro tip** Non proporre mai l'upsell nella stessa call in cui risolvi un problema. Prima chiudi il problema, poi (in una call separata o nel report mensile) suggerisci l'evoluzione. Il timing sbagliato trasforma una proposta legittima in pressione commerciale.

---

## PARTE 4 — Discovery e Assessment

### 4.1 Le 20 domande di discovery (e perche ciascuna conta)

**Area 1 — Processi e Operativita**

| # | Domanda | Perche conta |
|---|---|---|
| 1 | "Descrivi la tua giornata tipo. Cosa fai nei primi 30 minuti?" | Rivela le priorita reali, non quelle dichiarate. Il primo task del mattino e spesso il piu doloroso. |
| 2 | "Qual e l'attivita che ti porta via piu tempo e che consideri a basso valore?" | Identifica il use case a massimo impatto. Se risponde subito, il dolore e forte. |
| 3 | "Quante email ricevi al giorno? Quante richiedono una risposta elaborata?" | Quantifica il volume. Piu di 50/giorno = email triage e quasi certamente il primo use case. |
| 4 | "Quando cerchi un'informazione aziendale, dove vai? Quanto ci metti?" | Se la risposta e "dipende" o "chiedo al collega", la KB ha valore enorme. |
| 5 | "C'e un'attivita che fai regolarmente seguendo sempre la stessa procedura?" | Task proceduralizzati = candidati perfetti per automazione AI. |

**Area 2 — Informazione e Conoscenza**

| # | Domanda | Perche conta |
|---|---|---|
| 6 | "Se un dipendente chiave lasciasse domani, quale conoscenza andrebbe persa?" | Rivela quanto la conoscenza e nelle teste vs nei documenti. Alto rischio = alto valore della KB. |
| 7 | "Le procedure aziendali sono documentate? Dove? Quanto aggiornate?" | Se si = KB facile da costruire. Se no = prima serve documentare (e la piattaforma aiuta anche a questo). |
| 8 | "Come gestite l'onboarding di un nuovo dipendente?" | Onboarding lungo = alta opportunita. Se >2 mesi, l'AI puo dimezzarlo. |
| 9 | "Ci sono domande che ricevete continuamente da clienti/fornitori/dipendenti?" | FAQ = use case a bassissimo effort e altissimo impatto. Quick win garantito. |
| 10 | "Dove sono i documenti critici? Chi vi accede?" | Mappa dove costruire la KB e quali permessi servono. |

**Area 3 — Tecnologia e Strumenti**

| # | Domanda | Perche conta |
|---|---|---|
| 11 | "Quali strumenti digitali usate quotidianamente?" | Determina le integrazioni possibili e la maturita digitale. |
| 12 | "Avete provato strumenti AI? Come e andata?" | Se hanno provato e fallito: il dolore e gia educato. Se mai provato: serve piu educazione. |
| 13 | "Quanto siete preoccupati per la privacy dei dati aziendali?" | Se molto: prevedi opzione self-hosted o comunque data residency EU. Costa di piu ma chiude la vendita. |
| 14 | "Avete requisiti normativi specifici?" | GDPR, settoriali, fiscali. Determina vincoli tecnici non negoziabili. |
| 15 | "Il vostro provider email/cloud ha API disponibili?" | Senza API non ci sono integrazioni. Se usano email POP3 su server proprio anni '90, le integrazioni saranno limitate. |

**Area 4 — Obiettivi e Aspettative**

| # | Domanda | Perche conta |
|---|---|---|
| 16 | "Se la piattaforma funzionasse perfettamente, cosa cambierebbe tra 3 mesi?" | Rivela la definizione di successo del cliente. Se non sa rispondere, non ha un obiettivo chiaro — rischio alto. |
| 17 | "Come misurerete il successo di questo investimento?" | Se dice "lo sentiro" = devi tu proporre metriche. Se dice "ore risparmiate" = gia allineati. |
| 18 | "C'e qualcuno in azienda che sara il champion del progetto?" | Senza champion = progetto morto. E un prerequisito, non un nice-to-have. |
| 19 | "Qual e il budget realistico per questa iniziativa?" | Qualifica immediatamente. Se dice < 3K: non e il modello giusto per lui. |
| 20 | "Avete gia provato altre soluzioni? Cosa non ha funzionato?" | Rivela obiezioni nascoste, delusioni passate, e aspettative calibrate (o distorte). |

### 4.2 Come mappare processi a opportunita AI

**Framework RACI-AI:**

Per ogni processo identificato, determina:
- **R** (Responsabile): chi lo esegue oggi?
- **A** (Accountable): chi ne risponde?
- **C** (Consulted): chi viene consultato durante?
- **I** (Informed): chi viene informato dopo?
- **AI**: quale parte puo fare l'AI? (classificare, cercare, generare, notificare)

**Matrice Impatto/Sforzo rapida:**

```
IMPATTO
  ^
  |  [BASSA PRIORITA]  |  [FARE SUBITO]
  |  Sforzo alto        |  Sforzo basso
  |  Impatto alto       |  Impatto alto
  |---------------------|-------------------
  |  [NON FARE]         |  [NICE TO HAVE]
  |  Sforzo alto        |  Sforzo basso
  |  Impatto basso      |  Impatto basso
  +-----------------------------------------> SFORZO (inverso)
```

### 4.3 AI Readiness scoring

Score su 5 dimensioni (1-5 ciascuna, totale 5-25):

| Dimensione | Score 1 | Score 3 | Score 5 |
|---|---|---|---|
| **Infrastruttura** | Solo email base | Cloud (Google/MS365), qualche SaaS | Stack integrato con API |
| **Dati** | Documenti sparsi, carta | Repository documentale | Dati strutturati, ricercabili |
| **Processi** | Informali, nella testa | Procedure scritte ma datate | Documentati, misurati |
| **Cultura** | Resistenza al cambiamento | Apertura ma passiva | Team proattivo su innovazione |
| **Governance** | Zero controllo | Policy base GDPR | Governance strutturata |

**Interpretazione:**
- 5-10: **STOP.** Non pronto. Serve digitalizzazione base prima.
- 11-15: **CAUTELA.** Partire con 1-2 use case semplici, aspettative basse.
- 16-20: **VIA LIBERA.** Candidato ideale per piattaforma completa.
- 21-25: **FAST TRACK.** Candidato per FACTORY da subito.

### 4.4 Red flags: quando dire NO

| Red flag | Segnale concreto | Conseguenza se ignori |
|---|---|---|
| Vuole sostituire persone | "Con l'AI licenzio 3 dipendenti" | Ambiente ostile, sabotaggio interno, reputazione a rischio |
| Budget insufficiente | "Possiamo fare tutto con 2.000 EUR?" | Consegni qualcosa di mediocre, cliente insoddisfatto |
| Zero maturita digitale | Non usano email regolarmente | Non possono usare la piattaforma, soldi buttati |
| Aspettative magiche | "L'AI fara tutto da sola" | Delusione garantita al primo errore |
| Nessun champion | Nessuno in azienda spinge l'adozione | Sistema installato e mai usato |
| Urgenza irrealistica | "Operativo in una settimana" | Delivery scadente, relazione bruciata |
| Decision maker assente | Il decisore non partecipa mai | Progetto bloccato per settimane ad ogni approvazione |

> **Attenzione!** Dire NO a un prospect non e perdere un cliente. E proteggere la tua reputazione. Un progetto fallito ti costa molto piu del revenue mancato: case study negativo, referral negativo, tempo bruciato, morale basso. Meglio 0 clienti che 1 cliente sbagliato.

### 4.5 Framework di stima ore

**Ore per fase (range per dimensione):**

| Fase | Small | Medium | Large |
|---|---|---|---|
| Discovery | 8-12h | 12-20h | 20-30h |
| Setup infra + piattaforma | 4-6h | 6-8h | 8-12h |
| KB ingestione + tuning | 8-16h | 16-32h | 32-60h |
| Configurazione agenti | 4-8h (2 agenti) | 8-16h (4 agenti) | 16-24h (6+ agenti) |
| Integrazioni | 4-8h | 8-16h | 16-30h |
| Testing + tuning | 4-8h | 8-12h | 12-20h |
| Training + go-live | 4-6h | 6-8h | 8-12h |
| **Totale** | **36-64h** | **64-112h** | **112-188h** |

**Conversione a prezzo:**

Se la tua tariffa obiettivo e 100-120 EUR/ora:
- Small: 36-64h * 110 = 3.960-7.040 → prezzo 5.000 EUR
- Medium: 64-112h * 110 = 7.040-12.320 → prezzo 8.000 EUR
- Large: 112-188h * 110 = 12.320-20.680 → prezzo 15.000 EUR

I pacchetti sono calcolati sulla mediana del range, con margine di sicurezza.

### 4.6 Struttura della proposta commerciale

```
1. Contesto e Obiettivi (cosa ho capito dalla discovery)
2. Problemi Identificati (con quantificazione: ore/mese, costi)
3. Soluzione Proposta
   - Use case prioritari (top 3, con ROI stimato ciascuno)
   - Agenti inclusi (ruolo e funzione di ciascuno)
   - Integrazioni previste
4. Piano di Lavoro (settimana per settimana)
5. Investimento (3 opzioni: Essential / Professional / Enterprise)
6. ROI Atteso (calcolo conservativo)
7. Condizioni (pagamento, SLA, proprieta dati, exit)
8. Prossimi Passi (cosa serve per partire)
```

**Regola d'oro:** la proposta deve contenere le PAROLE del cliente. Se durante la discovery ha detto "perdiamo un sacco di tempo a cercare le fatture", nella proposta scrivi esattamente: "Il team perde attualmente [X] ore/mese nella ricerca fatture e documentazione correlata".

---

## PARTE 5 — Delivery: Progetto A CORPO

### 5.1 Piano di esecuzione settimana per settimana

**Settimana 1 — Discovery**

| Giorno | Attivita | Output | Durata |
|---|---|---|---|
| Lun | Kick-off con sponsor + stakeholder chiave | Allineamento scope e aspettative | 1.5h |
| Lun-Mar | Interviste 1:1 con 3-5 ruoli operativi | Mappa processi, pain point | 3h totali |
| Mar-Mer | Assessment maturita digitale | Score 5 dimensioni | 2h |
| Mer-Gio | Raccolta documenti: procedure, template, FAQ, email tipo | Corpus per KB | 4h |
| Gio-Ven | Mappatura use case + matrice impatto/sforzo | Lista prioritizzata | 3h |
| Ven | Presentazione findings + proposta scope fasi successive | Documento approvato | 1.5h |

**Settimana 2 — Setup Infrastruttura + KB (parte 1)**

| Giorno | Attivita | Output | Durata |
|---|---|---|---|
| Lun | Provisioning VPS, DNS, SSL, Docker setup | Server pronto | 3h |
| Lun-Mar | Installazione stack (PostgreSQL, Redis, Qdrant, app) | Piattaforma base attiva | 4h |
| Mar-Mer | Preprocessing documenti (pulizia, formattazione) | Documenti pronti per ingestione | 4h |
| Mer-Gio | Ingestione batch 1 (documenti prioritari) nella KB | KB parziale | 4h |
| Gio-Ven | Test qualita batch 1 (10 domande campione) | Report accuracy iniziale | 2h |
| Ven | Tuning chunking/embedding se necessario | Parametri ottimizzati | 2h |

**Settimana 3 — KB (parte 2) + Agenti + Integrazioni**

| Giorno | Attivita | Output | Durata |
|---|---|---|---|
| Lun | Ingestione batch 2 (documenti restanti) | KB completa | 4h |
| Lun-Mar | Configurazione agente 1 (il piu critico) | Agente operativo | 3h |
| Mar-Mer | Configurazione agenti 2-3 | Agenti operativi | 4h |
| Mer | Setup integrazione email (IMAP/SMTP o API) | Email connessa | 3h |
| Gio | Setup integrazione file system / cloud storage | File connessi | 2h |
| Gio-Ven | Test end-to-end integrazioni | Flussi verificati | 3h |
| Ven | Setup dashboard monitoring | Cruscotto attivo | 2h |

**Settimana 4 — Test di Qualita + Tuning**

| Giorno | Attivita | Output | Durata |
|---|---|---|---|
| Lun-Mar | Test qualita completo (30 domande campione) | Report accuracy | 4h |
| Mar-Mer | Tuning prompt, parametri retrieval, threshold | Ottimizzazione | 4h |
| Mer-Gio | Test scenari di errore (cosa succede quando fallisce) | Piano errori | 3h |
| Gio | Fix e secondo round di test | Validazione | 3h |
| Ven | Preparazione materiale training | Slide + guida utente | 2h |

**Settimana 5 — Go-Live**

| Giorno | Attivita | Output | Durata |
|---|---|---|---|
| Lun | Training utenti (sessione 1.5h, max 10 persone) | Team formato | 2h (prep+session) |
| Lun-Ven | Periodo affiancamento (disponibile per domande async) | Supporto attivo | 1h/giorno |
| Lun-Ven | Monitoring attivo: log, metriche, qualita risposte | Controllo | 1h/giorno |
| Ven | Tuning finale basato su feedback utenti reali | Aggiustamenti | 3h |

**Settimana 6 — Handoff**

| Giorno | Attivita | Output | Durata |
|---|---|---|---|
| Lun | Preparazione handoff package (documentazione) | Documento tecnico | 3h |
| Mar | Presentazione risultati + metriche allo sponsor | Report go-live | 1.5h |
| Mar | Firma contratto hosting/manutenzione | Contratto | 0.5h |
| Mer | Ultimo check: tutto funziona, documenti consegnati | Chiusura | 1h |

### 5.2 Critical path e dipendenze

```
Discovery (S1)
    |
    +--> [GATE 1: Scope approvato?]
    |         |
    |         NO → Rinegozia o chiudi
    |         SI ↓
Setup Infra (S2, giorno 1-2) ─────────┐
    |                                   |
KB Ingestione (S2-S3) ─── dipende da: documenti ricevuti dal cliente
    |                                   |
Agenti Config (S3) ─── dipende da: KB pronta
    |                                   |
Integrazioni (S3) ─── dipende da: credenziali ricevute dal cliente
    |                                   |
    +--> [GATE 2: Accuracy >= 80%?]
    |         |
    |         NO → Tuning aggiuntivo (max 1 settimana extra)
    |         SI ↓
Training + Go-Live (S5)
    |
    +--> [GATE 3: Sistema stabile per 5 giorni?]
              |
              NO → Fix e extend monitoring
              SI → Handoff
```

**Dipendenze critiche dal CLIENTE:**
1. Documenti per la KB (serve entro fine S1)
2. Credenziali per integrazioni (serve entro inizio S3)
3. Disponibilita persone per training (serve in S5)

Se una di queste manca, il progetto slitta. Comunicarlo chiaramente nel kick-off.

### 5.3 Quality gates

| Gate | Criterio | Azione se non passa |
|---|---|---|
| **Gate 1** (fine S1) | Scope approvato dal cliente, documenti in consegna | Fermati. Non procedere senza scope chiaro. |
| **Gate 2** (fine S4) | Accuracy >= 80% su 30 domande campione | Tuning extra (max 5 giorni). Se non migliora: scope reduction. |
| **Gate 3** (fine S5) | Sistema stabile 5 giorni, zero crash, <= 2 errori critici | Estendi monitoring. Non fare handoff su sistema instabile. |

### 5.4 Errori comuni e come evitarli

| Errore | Conseguenza | Prevenzione |
|---|---|---|
| Iniziare senza documenti dal cliente | KB vuota, nessun valore al go-live | Clausola contrattuale: "delivery dipende da ricezione documenti entro S1" |
| Non testare con domande REALI | Accuracy artificialmente alta, crolla in produzione | Coinvolgi il team del cliente nel test (S4): fai fare a LORO le domande |
| Sottostimare il tuning dei prompt | Agenti che danno risposte generiche o sbagliate | Prevedi SEMPRE 4-8h di tuning post-primo-test. Non e opzionale. |
| Training troppo breve | Team non sa usare il sistema, abbandono | Minimo 1.5h di training PRATICO (non slides, ma esercitazione hands-on) |
| Handoff senza documentazione | Cliente bloccato al primo problema | Handoff package completo: architettura, credenziali, procedure, contatti |

### 5.5 Cadenza di comunicazione col cliente

| Momento | Formato | Contenuto |
|---|---|---|
| Fine S1 (Discovery) | Call 30 min | Findings, proposta scope, next step |
| Meta S3 (mid-project) | Email con update | "Siamo a buon punto, ecco cosa abbiamo fatto" |
| Fine S4 (pre-go-live) | Call 15 min | "Sistema pronto, ecco le metriche di test" |
| Fine S5 (post-training) | Email | "Training completato, ecco i prossimi 5 giorni" |
| Fine S6 (handoff) | Call 30 min | Presentazione risultati, firma hosting, next step |

### 5.6 Checklist di handoff

- [ ] Documento tecnico con architettura della piattaforma consegnato
- [ ] Credenziali e accessi (admin, utenti, API keys) consegnati in modo sicuro
- [ ] Procedura di aggiornamento KB documentata
- [ ] Procedura di riavvio/manutenzione base documentata
- [ ] Contatto di supporto e condizioni post-vendita chiari
- [ ] Metriche baseline del primo periodo di utilizzo presentate
- [ ] Contratto hosting/manutenzione mensile firmato
- [ ] Prossimo check-in schedulato (30 giorni)

### 5.7 Post-delivery: opzioni SLA

| SLA | Include | Prezzo/mese |
|---|---|---|
| **Base** (incluso nell'hosting) | Risposta 24h, fix bug critici entro 72h | Incluso |
| **Standard** | Risposta 8h lavorative, fix entro 48h, 1 check-in/trimestre | +150 EUR/mese |
| **Premium** | Risposta 4h, fix entro 24h, tuning mensile, 1 nuovo agente/trim | +400 EUR/mese |

> **Pro tip** Il SLA Premium e il ponte naturale verso il modello FACTORY. Se un cliente A CORPO prende il Premium, dopo 6 mesi spesso ha senso proporre la conversione a FACTORY (costo simile, servizio piu completo). E una vendita molto piu facile perche ha gia visto il valore.

---

## PARTE 6 — Delivery: Modello FACTORY

### 6.1 Il ritmo mensile

**Settimana 1 (inizio mese):**
- Monitoring metriche settimana precedente
- Identificazione problemi di qualita
- Prioritizzazione attivita del mese

**Settimana 2:**
- KB maintenance: aggiunta nuovi documenti, pulizia obsoleti
- Tuning agenti basato su feedback e metriche

**Settimana 3:**
- Evoluzione: nuovo agente, nuova integrazione, o miglioramento significativo
- Test e validazione modifiche

**Settimana 4 (fine mese):**
- Preparazione report mensile
- Call con sponsor (30 min): review risultati + planning mese successivo
- Aggiornamento roadmap trimestrale

### 6.2 Governance framework

**Meeting cadence:**

| Meeting | Frequenza | Durata | Partecipanti | Contenuto |
|---|---|---|---|---|
| Monthly Review | Mensile | 30 min | Sponsor + te | Metriche, problemi, piano prossimo mese |
| Quarterly Roadmap | Trimestrale | 60 min | Sponsor + stakeholder | Strategia AI 90 giorni, nuovi use case, budget |
| Annual Strategy | Annuale | 90 min | Management + te | Bilancio annuale, roadmap 12 mesi, rinegoziazione |

**Documento di governance (da consegnare all'inizio):**
- Definizione ruoli: chi decide cosa (tu vs cliente)
- SLA e tempi di risposta
- Processo di change request (cosa e incluso vs cosa e extra)
- Criteri di escalation
- Metriche di successo concordate
- Calendario meeting

### 6.3 Come gestire lo scope creep

Lo scope creep nel modello FACTORY e insidioso perche non c'e un contratto a scope fisso. Il cliente tende a pensare "pago 2.500/mese, quindi puo fare tutto".

**Regola:** nel contratto definisci chiaramente cosa e INCLUSO e cosa e EXTRA.

| Incluso nel retainer | Extra (add-on prezzato separatamente) |
|---|---|
| Governance e monitoring (fino a X ore/mese) | Integrazioni con nuovi sistemi complessi (ERP, legacy) |
| KB maintenance (aggiornamento documenti esistenti) | Migrazione a self-hosted |
| Tuning agenti esistenti | Custom development (funzionalita non standard) |
| 1-2 nuovi agenti per trimestre | Training aggiuntivi oltre 1/trimestre |
| 1 integrazione minore per mese | Audit di sicurezza/compliance approfondito |
| Report mensile + call | Workshop per nuovi dipartimenti |
| Supporto standard (24h response) | Supporto prioritario 4h |

**Script per gestire la richiesta fuori scope:**

"Ottima idea. Questa funzionalita e al di fuori dello scope attuale del retainer, ma possiamo assolutamente farla. Ti preparo una mini-proposta con tempi e costi entro domani. Intanto, vuoi che la inserisca nella roadmap del prossimo trimestre o e urgente?"

### 6.4 Escalation e SLA management

**Livelli di severita:**

| Livello | Definizione | Tempo risposta | Tempo risoluzione |
|---|---|---|---|
| **P1 - Critico** | Piattaforma down, nessun utente puo usarla | 1h | 4h |
| **P2 - Alto** | Funzionalita core degradata (es. accuracy crollata) | 4h | 24h |
| **P3 - Medio** | Problema non bloccante (es. una integrazione disconnessa) | 24h | 72h |
| **P4 - Basso** | Miglioramento richiesto, bug cosmetico | 48h | Prossimo ciclo mensile |

**Processo escalation:**
1. Cliente segnala via email/chat dedicato
2. Classifica la severita (tu, non il cliente — il cliente spesso sovrastima)
3. Conferma ricezione entro il tempo indicato
4. Comunica piano di azione e ETA
5. Risolvi
6. Post-mortem per P1 e P2 (cosa e successo, come prevenire)

### 6.5 Quando fare upgrade di tier

Segnali che il cliente ha bisogno di un tier superiore:

| Segnale | Da | A | Trigger |
|---|---|---|---|
| Query/mese > limite | Starter | Growth | > 3.000 query/mese per 2 mesi consecutivi |
| Richiesta nuovi agenti frequente | Starter | Growth | > 2 richieste nuovi agenti in 1 trimestre |
| Necessita integrazioni multiple | Growth | Scale | > 3 integrazioni richieste in 6 mesi |
| Necessita multi-dipartimento | Growth | Scale | Espansione a > 3 team diversi |
| Necessita SLA con penali | Qualsiasi | Scale | Il sistema diventa business-critical |

**Come proporre l'upgrade:**

Nel report mensile, sezione "Raccomandazioni": "Negli ultimi 2 mesi l'utilizzo e cresciuto del 40% e ha superato costantemente i limiti del tier Starter. Vi consiglio di valutare l'upgrade a Growth per [benefici specifici]. Il costo aggiuntivo di 1.000 EUR/mese si ripaga in [X] ore di valore aggiuntivo."

### 6.6 Come uscire gracefully da un FACTORY

A volte devi chiudere un contratto FACTORY. Motivi possibili:
- Il cliente non usa il sistema (nonostante tentativi di rilancio)
- Il cliente e tossico (richieste continue fuori scope, mancanza di rispetto)
- Non e piu economicamente sostenibile per te
- Il cliente vuole internalizzare

**Processo di exit (2 settimane):**

1. **Comunicazione formale** (con 30 giorni di preavviso come da contratto)
2. **Export completo**: documenti KB, configurazioni agenti, prompt, storico conversazioni
3. **Documentazione**: tutto cio che serve per gestire il sistema autonomamente
4. **Handoff call**: passaggio a team interno o nuovo fornitore
5. **Data deletion**: dopo 30 giorni cancelli tutti i dati del cliente dai tuoi sistemi

> **Attenzione!** Non uscire mai da un FACTORY lasciando il cliente nei guai. Anche se il rapporto si e deteriorato, l'exit deve essere professionale. La tua reputazione vale piu di quel singolo contratto. Un ex-cliente trattato bene nell'exit puo comunque darti referral positive.

---

## PARTE 7 — Costruzione della Knowledge Base

### 7.1 Tipi di documento e strategie di ingestione

| Tipo documento | Formato tipico | Strategia di ingestione | Note |
|---|---|---|---|
| **Procedure operative** | DOCX, PDF, Wiki | Per sezione/heading, preservando gerarchia | Aggiornare frequentemente |
| **Contratti** | PDF (spesso scansionati) | Per clausola/articolo, OCR se necessario | Metadata: scadenza, parti, valore |
| **FAQ** | DOCX, Excel, pagine web | Una FAQ = un chunk atomico | Massima precision nel retrieval |
| **Email archives** | .EML, .MSG, MBOX | Per messaggio, metadata: data, mittente, oggetto | Filtrare spam/irrilevanti prima |
| **CRM exports** | CSV, Excel | Strutturato in record, linkare a entita | Attenzione PII: anonimizzare se necessario |
| **Manuali tecnici** | PDF, DOCX | Per paragrafo con heading parent come contesto | Preservare tabelle e figure |
| **Presentazioni** | PPTX | Per slide, con note presenter | Spesso bassa qualita informativa |
| **Registrazioni meeting** | Audio/video → trascrizione | Per blocco tematico (5-10 min) | Servono buoni tool di trascrizione |

### 7.2 Strategie di chunking per tipo di documento

**Principio generale:** il chunk deve contenere abbastanza contesto per essere comprensibile da solo, ma essere abbastanza piccolo per non diluire la rilevanza nel retrieval.

**Contratti legali:**
```
Chunk = [Numero articolo] + [Titolo articolo] + [Testo completo articolo]
Overlap = 0 (articoli sono unita autonome)
Metadata = {tipo: "contratto", parte: "Rossi Srl", scadenza: "2026-12-31", articolo: 8}
```

**FAQ:**
```
Chunk = [Domanda] + [Risposta completa]
Overlap = 0
Metadata = {tipo: "faq", categoria: "resi", ultimo_aggiornamento: "2026-03-15"}
```

**Procedure operative:**
```
Chunk = [Heading livello 2] + [Testo sotto quel heading] (max 800 token)
Overlap = 100 token (ripetere l'heading del livello superiore come contesto)
Metadata = {tipo: "procedura", dipartimento: "logistica", versione: "3.1"}
```

**Email:**
```
Chunk = [Da: ...] + [A: ...] + [Oggetto: ...] + [Data: ...] + [Corpo email]
Overlap = 0
Metadata = {tipo: "email", da: "mario@azienda.it", data: "2026-05-20", thread_id: "xyz"}
```

### 7.3 Embedding model: selezione e costi

| Modello | Dimensione | Costo/1M token | Qualita italiano | Note |
|---|---|---|---|---|
| `text-embedding-3-small` (OpenAI) | 1536 | $0.02 | Buona | Default consigliato per costo/qualita |
| `text-embedding-3-large` (OpenAI) | 3072 | $0.13 | Ottima | Quando serve massima precisione |
| `voyage-3` (Voyage AI) | 1024 | $0.06 | Molto buona | Ottimo per multilingua |
| `voyage-3-lite` (Voyage AI) | 512 | $0.02 | Buona | Alternativa economica |
| `multilingual-e5-large` (open-source) | 1024 | Gratuito (self-hosted) | Buona | Se serve zero costo embedding |

**Stima costi per KB tipiche:**

| Dimensione KB | Documenti | Token stimati | Costo embedding (OpenAI small) |
|---|---|---|---|
| Small | 100-500 | 500K-2.5M | $0.01-0.05 |
| Medium | 500-2.000 | 2.5M-10M | $0.05-0.20 |
| Large | 2.000-10.000 | 10M-50M | $0.20-1.00 |

L'embedding si fa una volta (alla ingestione). Il costo e trascurabile. Il costo reale e nel retrieval (query embedding) e nella generazione (LLM tokens).

### 7.4 Metriche di qualita della KB

| Metrica | Come misurarla | Target | Azione se sotto target |
|---|---|---|---|
| **Precision** | % risposte corrette sul campione | >= 85% | Tuning prompt, migliorare chunking |
| **Recall** | % domande a cui il sistema SA rispondere | >= 75% | Aggiungere documenti, gap analysis |
| **Relevance** | Score medio dei chunk recuperati (0-1) | >= 0.75 | Migliorare embedding, reranking |
| **Latenza retrieval** | Tempo dalla query alla lista di chunk | < 500ms | Ottimizzare indice, ridurre collection size |
| **Hallucination rate** | % risposte con info inventate | < 5% | Rafforzare istruzione "cita fonte o di' che non sai" |

**Metodo di valutazione (campionamento settimanale):**
1. Prepara 20-30 domande di test con risposta corretta nota
2. Fai le domande al sistema
3. Classifica ogni risposta: corretta / parziale / errata / hallucination
4. Calcola le metriche
5. Identifica pattern negli errori
6. Tuning mirato

### 7.5 Manutenzione KB: quando e come

| Attivita | Frequenza | Trigger | Chi |
|---|---|---|---|
| Aggiunta nuovi documenti | Continua | Cliente fornisce nuovi doc | Consulente (FACTORY) o cliente (A CORPO) |
| Rimozione documenti obsoleti | Mensile | Procedura aggiornata, contratto scaduto | Consulente |
| Re-indicizzazione | Trimestrale | Cambio modello embedding, performance degradata | Consulente |
| Gap analysis | Trimestrale | Analisi domande senza risposta | Consulente |
| Aggiornamento metadata | Mensile | Cambio organigramma, nuovi ruoli | Consulente/Cliente |

### 7.6 Sfide domain-specific

| Dominio | Sfida principale | Soluzione |
|---|---|---|
| **Legale** | Linguaggio tecnico, interpretazione necessaria | Disclaimer obbligatorio "non sostituisce parere legale", prompt restrittivo |
| **Medico/Healthcare** | Rischio alto per errori, normativa stringente | Self-hosted obbligatorio, supervisione umana SEMPRE, no AI Act high-risk |
| **Finanziario** | Dati sensibili, CONSOB, precisione numerica | Cifre mai inventate, fonte sempre citata, validazione numerica |
| **Manifattura** | Terminologia specialistica, schede tecniche | Glossario aziendale in KB, embedding specializzato |
| **PA** | Normativa complessa, cautela istituzionale | Risposte conservative, escalation rapida, trasparenza AI |

> **Pro tip** Per il dominio legale: il trucco migliore e includere nel system prompt dell'agente la frase: "Non fornire MAI interpretazioni legali. Se ti viene chiesta un'interpretazione, rispondi con il testo esatto della clausola/norma e aggiungi: 'Per un'interpretazione autorevole, consultare un professionista legale'." Questo protegge te e il cliente.

---

## PARTE 8 — Agent Design Patterns

### 8.1 Anatomia di un system prompt efficace

Un system prompt ben strutturato ha 6 sezioni:

```
1. IDENTITA (chi sei, per chi lavori)
2. OBIETTIVO (cosa devi fare)
3. REGOLE (cosa NON devi fare, limiti, vincoli)
4. FORMATO (come devi rispondere)
5. TOOL/FUNZIONI (quali strumenti hai a disposizione)
6. ESCALATION (quando chiedere un umano)
```

**Esempio strutturato:**

```
# IDENTITA
Sei l'assistente email di [Azienda]. Ti chiami [Nome]. Sei professionale,
conciso, e preciso.

# OBIETTIVO
Il tuo compito e:
1. Classificare ogni email per urgenza (alta/media/bassa) e categoria
2. Per email con risposta standard in KB: preparare bozza di risposta
3. Per email urgenti senza risposta standard: notificare il responsabile

# REGOLE
- Non inviare MAI email autonomamente. Solo bozze.
- Se non sei sicuro della classificazione, marca come "review necessaria"
- Non inventare MAI informazioni non presenti nella KB
- Se ti viene chiesto qualcosa fuori dal tuo ruolo, rispondi:
  "Non posso aiutarti con questo. Contatta [referente]."
- Includi SEMPRE il motivo della classificazione

# FORMATO
Per ogni email classificata, rispondi con:
- Urgenza: [alta/media/bassa] — Motivo: [perche]
- Categoria: [commerciale/supporto/admin/spam]
- Responsabile suggerito: [nome/ruolo]
- Bozza risposta (se applicabile): [testo]

# TOOL
Hai accesso a:
- KB aziendale (per cercare risposte standard)
- Rubrica aziendale (per identificare il responsabile)
- Calendario (per verificare disponibilita)

# ESCALATION
Escala a un umano quando:
- La richiesta riguarda un reclamo formale
- Ci sono implicazioni legali
- Il mittente e un ente pubblico o autorita
- Non trovi informazioni sufficienti nella KB
```

### 8.2 I 10 archetipi di agente

**1. General Assistant (Knowledge Finder)**
- **Funzione:** Punto di accesso unico alla KB. Risponde a qualsiasi domanda cercando nei documenti.
- **Modello:** Haiku/GPT-4o-mini (query semplici) → Sonnet (query complesse)
- **KB:** Tutta
- **Complessita di setup:** Bassa (2-3h)
- **Prompt chiave:** "Cerca nella KB e rispondi SOLO con informazioni trovate. Cita sempre la fonte."

**2. Document Analyzer**
- **Funzione:** Estrae informazioni strutturate da documenti caricati.
- **Modello:** Sonnet/GPT-4o (documenti complessi)
- **KB:** Template di estrazione, checklist
- **Complessita di setup:** Media (4-6h)
- **Prompt chiave:** "Estrai le informazioni secondo il template [X]. Se un campo non e presente nel documento, scrivi 'NON TROVATO'."

**3. Email Manager**
- **Funzione:** Classifica, prioritizza, prepara bozze di risposta.
- **Modello:** Haiku (classificazione) → Sonnet (bozze elaborate)
- **KB:** FAQ, template risposte, organigramma
- **Complessita di setup:** Media (4-6h con integrazione email)
- **Prompt chiave:** "Classifica per urgenza e categoria. Per email ricorrenti, usa i template nella KB."

**4. Meeting Summarizer**
- **Funzione:** Riceve trascrizioni di meeting, produce riassunto strutturato con action items.
- **Modello:** Sonnet
- **KB:** Template riassunti, ruoli team
- **Complessita di setup:** Bassa (2-3h)
- **Prompt chiave:** "Produci: 1) Riassunto (max 5 bullet), 2) Decisioni prese, 3) Action item con owner e deadline."

**5. Customer Support**
- **Funzione:** Risponde a FAQ clienti, escalation per casi complessi.
- **Modello:** Haiku (FAQ) → Sonnet (casi complessi)
- **KB:** FAQ prodotto/servizio, procedure assistenza, limiti autonomia
- **Complessita di setup:** Media (4-6h)
- **Prompt chiave:** "Rispondi in modo empatico e conciso. Non promettere MAI rimborsi o sconti. Se non sai: escala."

**6. Sales Assistant**
- **Funzione:** Qualifica lead, prepara materiale commerciale, suggerisce next step.
- **Modello:** Sonnet
- **KB:** Catalogo, tariffario, case study, obiezioni frequenti
- **Complessita di setup:** Media-alta (5-8h)
- **Prompt chiave:** "Qualifica secondo i criteri [X]. Prepara materiale personalizzato. Mai inventare prezzi."

**7. Compliance Checker**
- **Funzione:** Verifica documenti/processi contro checklist normative.
- **Modello:** Sonnet/Opus (ragionamento preciso richiesto)
- **KB:** Normativa settoriale, checklist, storico audit
- **Complessita di setup:** Alta (6-10h)
- **Prompt chiave:** "Verifica contro la checklist [X]. Per ogni punto: CONFORME / NON CONFORME / NON VERIFICABILE. Cita la fonte normativa."

**8. Data Analyst**
- **Funzione:** Analizza dati strutturati, produce report, identifica anomalie.
- **Modello:** Sonnet/Opus (analisi complesse)
- **KB:** Template report, definizioni KPI, storico
- **Complessita di setup:** Alta (6-10h, richiede integrazione dati)
- **Prompt chiave:** "Analizza i dati secondo il template [X]. Segnala anomalie > [soglia]. Mai inventare numeri."

**9. Content Writer**
- **Funzione:** Genera bozze per social, newsletter, blog nel tono del brand.
- **Modello:** Sonnet
- **KB:** Brand guidelines, storico contenuti, calendario editoriale
- **Complessita di setup:** Bassa-media (3-5h)
- **Prompt chiave:** "Scrivi nel tono [X]. Usa le brand guidelines. Ogni contenuto deve avere una CTA. Non copiare competitor."

**10. Process Automation Agent**
- **Funzione:** Esegue workflow multi-step (es: ricevi email → classifica → cerca in CRM → prepara risposta → notifica).
- **Modello:** Sonnet (orchestrazione multi-tool)
- **KB:** Procedure workflow, regole di business
- **Complessita di setup:** Alta (8-12h, richiede tool multipli)
- **Prompt chiave:** "Segui il workflow [X] step by step. Ad ogni step, verifica il risultato prima di procedere al successivo."

### 8.3 Come testare e iterare sugli agenti

**Metodo A/B per prompt:**
1. Crea due versioni del prompt (A = attuale, B = variante)
2. Prepara 20 domande di test con risposta attesa
3. Sottoponi le stesse 20 domande ad entrambi
4. Valuta: accuracy, completezza, tono, aderenza alle regole
5. Scegli il vincitore, iterazione successiva

**Metodo feedback loop:**
1. Ogni risposta ha un bottone "corretta / non corretta"
2. Le risposte "non corrette" finiscono in una coda di review
3. Analisi settimanale: pattern negli errori?
4. Tuning mirato (prompt, KB, o parametri retrieval)

**Metriche per agente:**

| Metrica | Come | Target |
|---|---|---|
| Accuracy | Campionamento manuale (20/settimana) | >= 85% |
| User satisfaction | Feedback esplicito (thumbs up/down) | >= 80% positive |
| Task completion | % conversazioni che risolvono il problema | >= 70% |
| Escalation rate | % conversazioni che richiedono umano | 10-30% (troppo basso = troppo permissivo) |
| Hallucination rate | Review risposte senza citazione fonte | < 5% |

### 8.4 Pattern di orchestrazione multi-agente

**Pattern 1 — Sequential (pipeline):**
```
Input → Agente 1 (classifica) → Agente 2 (elabora) → Agente 3 (formatta) → Output
```
Uso: email processing (classifica → genera risposta → formatta)

**Pattern 2 — Parallel (fan-out):**
```
Input → [Agente 1 (analisi A)] + [Agente 2 (analisi B)] + [Agente 3 (analisi C)] → Merge → Output
```
Uso: analisi documento da piu prospettive (legale + finanziario + operativo)

**Pattern 3 — Supervisor (router):**
```
Input → Supervisor Agent → route to:
  - Agente Email (se e una email)
  - Agente Documenti (se e un documento)
  - Agente KB (se e una domanda)
  - Escalation (se non sa come classificare)
```
Uso: interfaccia unica per l'utente, routing automatico all'agente giusto

Per le PMI, il **Pattern 3 (Supervisor)** e quasi sempre la scelta giusta. L'utente non deve sapere quale agente sta usando — fa la domanda e il sistema decide.

---

## PARTE 9 — Operativita e Scaling

### 9.1 Checklist operativa

**Giornaliera (5 min):**
- [ ] Check alert Grafana: nessun errore critico nelle ultime 24h
- [ ] Costi LLM nel budget (nessun spike anomalo)
- [ ] Tutti i servizi UP (health check verde)

**Settimanale (30 min):**
- [ ] Review metriche di accuracy (campione 10 domande random)
- [ ] Check costi LLM per tenant (nessuno fuori budget)
- [ ] Review errori nel log (pattern ricorrenti?)
- [ ] Verifica integrazioni attive (nessuna disconnessa)
- [ ] Backup verificato (restore test 1x/mese)

**Mensile (2-4h per cliente FACTORY):**
- [ ] Preparazione report mensile
- [ ] Call con sponsor
- [ ] KB maintenance (aggiunte/pulizia)
- [ ] Tuning agenti basato su feedback
- [ ] Aggiornamento roadmap
- [ ] Fatturazione

### 9.2 Monitoring: cosa osservare

**Dashboard Grafana con 4 pannelli:**

1. **System Health:** uptime, error rate, latenza per servizio
2. **Usage:** interazioni/giorno per tenant, utenti attivi, peak usage times
3. **Quality:** accuracy stimata, hallucination events, escalation rate
4. **Costs:** costo LLM/giorno per tenant, costo per query, proiezione mensile

**Alert configurati:**

| Alert | Condizione | Azione |
|---|---|---|
| Servizio down | Health check fail > 2 min | Restart automatico + notifica |
| Latenza alta | p95 > 15 sec per > 5 min | Investigare (modello lento? DB?) |
| Error rate | > 5% per > 10 min | Investigare (API key scaduta? modello down?) |
| Costo spike | > 2x media giornaliera | Check: uso anomalo? attacco? bug? |
| Disk full | > 85% disco | Pulizia log/cache o upgrade storage |

### 9.3 Incident management

**Quando l'AI da risposte sbagliate (hallucination):**

1. **Identifica:** il feedback dell'utente o il monitoring rileva una risposta errata
2. **Classifica:** errore di retrieval (chunk sbagliato) o errore di generazione (LLM inventa)?
3. **Mitiga:** se grave, disabilita temporaneamente l'agente o la funzionalita
4. **Fix:**
   - Se retrieval: tuning parametri, aggiunta documenti, miglior chunking
   - Se generazione: tuning prompt (rafforzare "non inventare"), cambiare modello
5. **Verifica:** test con le stesse domande, conferma fix
6. **Comunica:** se il cliente ha visto l'errore, comunica il fix

**Quando un provider LLM va down:**

1. Fallback automatico (LiteLLM gestisce il routing)
2. Se anche il fallback e down: modalita "solo retrieval" (mostra i documenti, senza generazione)
3. Notifica te + notifica cliente se > 15 minuti
4. Post-mortem dopo il ripristino

### 9.4 Backup e disaster recovery

| Componente | Strategia backup | Frequenza | Retention | Tempo recovery |
|---|---|---|---|---|
| PostgreSQL | pg_dump + replica streaming | Giornaliero + continuous | 30 giorni | < 1h |
| Qdrant | Snapshot API | Giornaliero | 14 giorni | < 2h |
| Redis | RDB + AOF | Ogni 15 min | 7 giorni | < 5 min |
| File storage | Rsync verso off-site | Giornaliero | 30 giorni | < 1h |
| Configurazioni | Git repository | Ad ogni modifica | Illimitato | < 30 min |

**Test di restore:** 1 volta al mese, ripristina un backup su ambiente di test e verifica che tutto funzioni.

### 9.5 Scaling playbook: da 5 a 50 clienti

| Milestone | Clienti | Azione chiave |
|---|---|---|
| **1-5** | Proof of concept | Tutto su 1 VPS. Focus su qualita e case study. |
| **5-10** | Primo scaling | Separa DB dal server app. Object storage per documenti. |
| **10-15** | Automazione | Automatizza provisioning nuovi tenant. Dashboard self-service base. |
| **15-20** | Primo collaboratore | Assumi un tecnico part-time per supporto L1 e KB maintenance. |
| **20-30** | Cluster | Migra a 3+ server o managed services. Redis Cluster. Qdrant replica. |
| **30-50** | Team strutturato | 1-2 tecnici full-time + 1 sales/account. Processi documentati. |

### 9.6 Quando e chi assumere

| Milestone revenue | Ruolo da assumere | Perche | Costo |
|---|---|---|---|
| 8-10K/mese | Tecnico part-time (20h/sett) | Supporto L1, KB maintenance, monitoring | 1.500-2.000/mese |
| 15-20K/mese | Tecnico full-time | Gestione operativa completa, libera il tuo tempo per vendita | 2.500-3.500/mese |
| 25-30K/mese | Account manager / commerciale | Acquisizione clienti, check-in, upsell | 2.000-3.000/mese + commissioni |
| 40-50K/mese | Secondo tecnico | Redundancy, specializzazione, SLA migliori | 2.500-3.500/mese |

### 9.7 Modello franchising (replica)

Quando hai stabilizzato il modello (15+ clienti, margine > 40%, processi documentati), puoi replicarlo:

**Cosa dai al franchisee:**
- Accesso alla piattaforma tecnica (multi-instance)
- Playbook completo di vendita e delivery
- Formazione iniziale (2 settimane)
- Supporto tecnico L2/L3 (tu gestisci l'infrastruttura)
- Brand e materiale marketing

**Cosa prendi:**
- Fee iniziale: 3.000-5.000 EUR
- Revenue share: 15-25% del fatturato del franchisee
- Controllo qualita: review periodiche dei delivery

**Requisiti per il franchisee:**
- Competenze tecniche base (sa installare e configurare)
- Competenze consulenziali (sa fare discovery e gestire il cliente)
- Rete commerciale nel suo territorio
- Impegno minimo: 20h/settimana

> **Pro tip** Non fare franchising troppo presto. Prima devi avere: un processo ripetibile testato almeno 10 volte, documentazione completa, margini sufficienti per condividere revenue, e la capacita di supportare un franchisee senza che ti assorba tutto il tempo. Target realistico: dopo 18-24 mesi di attivita e 15+ clienti serviti personalmente.

---

## PARTE 10 — Legal, Privacy, AI Act

### 10.1 GDPR compliance per AI

**Il GDPR si applica quando:**
- Nella KB ci sono dati personali (nomi, email, telefoni di clienti/dipendenti)
- Le conversazioni contengono dati personali
- Le integrazioni accedono a sistemi con dati personali (email, CRM)

**Obblighi principali:**

| Obbligo | Cosa fare | Quando |
|---|---|---|
| **Base legale** | Legittimo interesse (art. 6.1.f) o esecuzione contratto (art. 6.1.b) | Prima di raccogliere dati |
| **Informativa** | Informare dipendenti/utenti che i dati transitano nel sistema AI | Prima dell'avvio |
| **Minimizzazione** | Ingerire nella KB solo dati necessari, non "tutto" | In fase di setup KB |
| **Retention** | Definire per quanto tempo i dati restano nella KB | Nel DPA |
| **DPA** | Firmare Data Processing Agreement con il cliente | Prima dell'avvio |
| **Registro trattamenti** | Aggiornare il registro del cliente con il nuovo trattamento | Prima dell'avvio |
| **DPIA** | Valutazione d'impatto se dati sensibili o decisioni automatizzate | Se applicabile |

**Template clausole DPA essenziali:**

1. Natura del trattamento: conservazione e ricerca semantica di documenti aziendali
2. Finalita: assistenza operativa ai dipendenti del Titolare
3. Categorie di dati: documenti aziendali, corrispondenza, procedure (specifare se PII)
4. Durata: per tutta la durata del contratto + 30 giorni per cancellazione
5. Sub-responsabili: LLM provider (specificare: Anthropic, OpenAI), hosting provider (Hetzner)
6. Misure di sicurezza: encryption, access control, backup, audit log
7. Diritto di audit: il cliente puo verificare le misure in ogni momento
8. Data residency: tutti i dati in UE (specificare paese)
9. Restituzione/cancellazione: alla fine del contratto, export completo + cancellazione entro 30 giorni

### 10.2 EU AI Act: dove cade questa piattaforma?

**Classificazione per use case:**

| Use case | Classificazione AI Act | Obblighi |
|---|---|---|
| Ricerca documenti, FAQ interne | Rischio minimo | Nessuno specifico |
| Chatbot che interagisce con clienti finali | Rischio limitato | Informare che e un'AI (art. 50) |
| Classificazione email, generazione contenuti | Rischio minimo | Nessuno specifico |
| Screening CV, valutazione dipendenti | **Rischio alto** | Supervisione umana, documentazione, test bias, registro |
| Analisi contratti (assistiva) | Rischio minimo | Nessuno (non prende decisioni) |
| Scoring creditizio clienti | **Rischio alto** | Come sopra |

**Per il 90% dei use case delle PMI: rischio minimo o limitato.** L'unico obbligo concreto e la trasparenza: se un chatbot interagisce con l'esterno, deve dichiarare di essere un'AI.

> **Attenzione!** Se un cliente vuole usare la piattaforma per **decisioni automatizzate su persone** (screening CV, valutazione performance, scoring credito): fermati. Serve una DPIA, supervisione umana obbligatoria documentata, test per bias, e conformita al Titolo III dell'AI Act. Non e impossibile, ma richiede lavoro aggiuntivo significativo (add-on di compliance: 2.000-5.000 EUR).

### 10.3 Liability: chi e responsabile se l'AI sbaglia?

**Principio fondamentale:** l'AI e uno strumento, non un decisore. La responsabilita della decisione resta in capo all'umano che agisce sulla base del suggerimento AI.

**Clausole contrattuali di protezione:**

1. "La piattaforma fornisce assistenza informativa. Non sostituisce il giudizio professionale."
2. "Le risposte generate dall'AI devono essere verificate dall'utente prima di qualsiasi azione."
3. "Il fornitore non e responsabile per decisioni prese dall'utente sulla base delle risposte AI."
4. "Il fornitore garantisce la diligenza tecnica nella configurazione. Non garantisce l'assenza assoluta di errori nelle risposte generate."

**Scenario di rischio concreto:** l'agente legale suggerisce che una clausola e standard, il cliente non verifica, firma il contratto, la clausola lo danneggia.

**Mitigazione:**
- Disclaimer in ogni risposta dell'agente legale: "Questa analisi non sostituisce il parere di un avvocato"
- Prompt restrittivo: "Non interpretare MAI. Solo confronta con template."
- Supervisione umana obbligatoria per decisioni critiche

### 10.4 Proprieta intellettuale

| Asset | Chi lo possiede | Note |
|---|---|---|
| Dati e documenti del cliente | Il cliente | Sempre, senza eccezioni |
| KB costruita (embeddings) | Il cliente | E derivata dai suoi documenti |
| Prompt degli agenti | Tu (il consulente) | E il tuo know-how, non e del cliente |
| Piattaforma tecnica (codice) | Tu (il consulente) | Il cliente usa, non possiede |
| Conversazioni e output generati | Il cliente | Sono sue interazioni |
| Modelli AI (LLM) | Provider (Anthropic, OpenAI) | Nessuno "possiede" il modello |

**Clausola contrattuale consigliata:**
"La piattaforma tecnica resta di proprieta del fornitore, concessa in licenza d'uso per la durata del contratto. I dati, la knowledge base, le conversazioni e tutti gli output generati sono e restano di proprieta esclusiva del cliente. I prompt e le configurazioni degli agenti sono proprieta intellettuale del fornitore."

### 10.5 Assicurazione

| Tipo | Perche | Costo indicativo |
|---|---|---|
| **RC Professionale** | Copre errori di consulenza che causano danno al cliente | 300-800 EUR/anno |
| **Cyber Insurance** | Copre data breach e incidenti informatici | 500-1.500 EUR/anno |
| **RC prodotto (opzionale)** | Se consideri la piattaforma un "prodotto" | 400-1.000 EUR/anno |

**Raccomandazione:** RC Professionale e obbligatoria moralmente (anche se non legalmente per tutti). Cyber Insurance e fortemente consigliata quando gestisci dati di terzi. Prendi entrambe dal primo cliente serio.

> **Pro tip** Quando compri l'assicurazione RC Professionale, verifica che copra esplicitamente "consulenza su sistemi di intelligenza artificiale" e "gestione dati di terzi in hosting". Alcune polizze generiche per consulenti non coprono questi rischi specifici. Chiedi esplicitamente al broker.

---

## APPENDICE A — Confronto Competitivo Dettagliato

| Dimensione | Dify | FlowiseAI | n8n + AI | LangFlow | CustomGPT | La mia piattaforma |
|---|---|---|---|---|---|---|
| **Tipo** | Open-source platform | Open-source builder | Workflow automation | Visual LangChain | SaaS chatbot | Custom platform + consulting |
| **Self-hosted** | Si | Si | Si | Si | No | Si |
| **Multi-tenant nativo** | Parziale | No | No | No | Si (SaaS) | Si |
| **RAG avanzato** | Buono | Base | Limitato | Buono | Base | Ottimo (custom pipeline) |
| **Multi-modello** | Si | Si | Si | Si | Solo OpenAI | Si (LiteLLM routing) |
| **Integrazioni native** | ~20 | ~10 | 400+ | ~15 | ~5 | Custom (illimitate) |
| **Graph KB** | No | No | No | No | No | Si (Neo4j opzionale) |
| **Governance/monitoring** | Base | No | Base | No | Base | Avanzato (Grafana custom) |
| **Agent orchestration** | Si | Base | Si (workflow) | Si | No | Si (pattern custom) |
| **Supporto italiano** | Community | No | No | No | No | Diretto, personalizzato |
| **Configurazione da non-tecnico** | Media | Alta (visual) | Media | Alta (visual) | Alta | N/A (lo fai tu) |
| **Stabilita produzione** | Media | Bassa | Alta | Bassa | Alta | Alta (custom, testato) |
| **Costo entry** | Gratis (self-host) | Gratis (self-host) | Gratis (self-host) | Gratis | $99/mese | 5K setup + 300/mese |
| **Time to value** | 2-4 sett. (se tecnico) | 1-2 sett. (se tecnico) | 2-4 sett. | 1-2 sett. | 1 giorno | 4-6 sett. (chiavi in mano) |
| **Chi lo gestisce** | Il cliente (serve tecnico) | Il cliente (serve tecnico) | Il cliente (serve tecnico) | Il cliente (serve tecnico) | Self-service | Tu (il consulente) |

**Il tuo posizionamento nel confronto:**
"I tool open-source sono potenti ma richiedono competenze tecniche che il cliente non ha. I SaaS sono semplici ma limitati. Io offro la potenza del custom con il comfort del servizio gestito."

---

## APPENDICE B — Glossario Tecnico per il Consulente

| Termine | Spiegazione | Quando ne parli col cliente |
|---|---|---|
| **RAG** (Retrieval Augmented Generation) | Tecnica che recupera documenti rilevanti dalla KB e li usa come contesto per generare la risposta | "Il sistema cerca nei tuoi documenti prima di rispondere" |
| **Embedding** | Rappresentazione matematica (vettore numerico) del significato di un testo | "Il modo in cui il sistema capisce il significato dei documenti" |
| **Vector Database** | Database specializzato per cercare per similarita semantica tra vettori | "Il cervello che trova documenti simili alla tua domanda" |
| **Chunking** | Processo di dividere documenti lunghi in pezzi piu piccoli e gestibili | "Tagliamo i documenti in pezzi piccoli cosi il sistema trova la parte giusta" |
| **Fine-tuning** | Addestramento aggiuntivo di un modello AI su dati specifici | "Addestriamo il modello sul tuo linguaggio specifico" (raramente necessario per PMI) |
| **LoRA** (Low-Rank Adaptation) | Tecnica di fine-tuning efficiente che modifica solo una piccola parte del modello | Non parlarne col cliente. E un dettaglio tecnico. |
| **Prompt Engineering** | L'arte di scrivere istruzioni efficaci per l'AI | "Le istruzioni precise che diamo all'assistente" |
| **Hallucination** | Quando l'AI genera informazioni false presentandole come vere | "Quando il sistema inventa — per questo serve la supervisione" |
| **Token** | Unita di testo (circa 3/4 di parola) usata dal modello per elaborare | "Le unita di misura dei costi: piu testo elabori, piu costa" |
| **Context Window** | Quantita massima di testo che il modello puo elaborare in una volta | "Quanti documenti puo leggere contemporaneamente" |
| **Temperature** | Parametro che controlla la creativita/randomness delle risposte | Non parlarne. Configura tu. |
| **Reranking** | Secondo passaggio di ordinamento dei risultati per migliorare la precisione | Non parlarne col cliente. Dici solo "doppia verifica". |
| **System Prompt** | Le istruzioni permanenti che definiscono il comportamento dell'agente | "Le regole che l'assistente segue sempre" |
| **Multi-tenant** | Architettura che serve piu clienti sulla stessa infrastruttura, isolati tra loro | "Ogni azienda ha il suo spazio separato e sicuro" |
| **LiteLLM** | Router che gestisce il traffico verso diversi provider AI | "Il sistema che sceglie il modello giusto per ogni domanda" |
| **Qdrant** | Database vettoriale open-source per ricerca semantica | Non nominare il prodotto. Dici "il motore di ricerca intelligente". |
| **pgvector** | Estensione di PostgreSQL per gestire vettori | Non nominare. E un dettaglio implementativo. |
| **Redis** | Cache in-memory per risposte veloci | "La memoria veloce per risposte istantanee" |
| **Neo4j** | Database a grafo per relazioni tra entita | "Il sistema che capisce chi e collegato a chi" |
| **Hono** | Framework web ultraleggero per TypeScript | Mai nominare al cliente. |
| **Traefik** | Reverse proxy per gestire traffico e SSL | Mai nominare al cliente. |
| **Docker** | Container per pacchettizzare e distribuire software | "La tecnologia che rende il sistema portatile e affidabile" |
| **JWT** (JSON Web Token) | Standard per autenticazione sicura | "Il sistema di accesso sicuro" |
| **RBAC** (Role-Based Access Control) | Permessi basati sul ruolo dell'utente | "Ognuno vede solo quello che deve vedere" |
| **Semantic Search** | Ricerca basata sul significato, non sulle parole esatte | "Cerca per concetto, non per parola" |
| **Cross-encoder** | Modello che valuta la rilevanza di un documento rispetto a una query | Non nominare. E il "doppio controllo" del retrieval. |
| **Cosine Similarity** | Metrica matematica per misurare quanto due vettori sono simili | Non nominare. Dici "quanto il documento e pertinente". |
| **Batch Processing** | Elaborazione di molti elementi insieme (anziche uno alla volta) | "Elaborazione veloce di molti documenti in parallelo" |
| **Graceful Degradation** | Il sistema funziona (in modo ridotto) anche quando un componente fallisce | "Se qualcosa si rompe, il sistema non crolla — funziona con meno funzioni" |
| **Idempotenza** | Un'operazione che produce lo stesso risultato anche se ripetuta | Non nominare. E un principio tecnico interno. |
| **Rate Limiting** | Limite al numero di richieste per evitare abusi | "Protezione contro l'uso eccessivo" |
| **Webhook** | Notifica automatica quando succede qualcosa in un sistema | "Avviso automatico quando cambia qualcosa" |
| **OCR** (Optical Character Recognition) | Estrazione testo da immagini/scan | "Lettura automatica di documenti cartacei scansionati" |
| **API** (Application Programming Interface) | Interfaccia per far comunicare due sistemi | "Il modo in cui i tuoi sistemi parlano tra loro" |
| **SLA** (Service Level Agreement) | Accordo sui livelli di servizio garantiti | "La garanzia su quanto funziona bene il servizio" |
| **NPS** (Net Promoter Score) | Metrica di soddisfazione (0-10) | "Quanto i tuoi utenti sono contenti del sistema" |

---

## APPENDICE C — Risorse e Formazione Continua

### Libri fondamentali

| Libro | Autore | Perche leggerlo |
|---|---|---|
| *AI Engineering* | Chip Huyen | Il manuale pratico per costruire sistemi AI in produzione |
| *Designing Machine Learning Systems* | Chip Huyen | Fondamenti di progettazione sistemi ML |
| *Building LLM Apps* | Valentino Gagliardi | Pratico, code-first, TypeScript oriented |
| *LLM Engineer's Handbook* | Paul Iusztin | Reference completo per ingegneria LLM |
| *The Mom Test* | Rob Fitzpatrick | Come fare discovery senza mentire a se stessi |
| *Obviously Awesome* | April Dunford | Posizionamento prodotto — fondamentale per differenziarti |
| *$100M Offers* | Alex Hormozi | Come costruire offerte irresistibili |

### Newsletter da seguire (tempo: 30 min/settimana)

| Newsletter | Focus | Frequenza |
|---|---|---|
| **The Batch** (deeplearning.ai) | Aggiornamenti AI settimanali, accessibili | Settimanale |
| **AI Insider** (newsletter italiana) | Focus su AI applicata al business italiano | Settimanale |
| **Ben's Bites** | Overview rapida novita AI | Giornaliera (5 min) |
| **Turing Post** | Deep dive tecnici su architetture AI | Settimanale |
| **Lenny's Newsletter** | Product management e pricing (non AI-specifico ma fondamentale) | Settimanale |

### Community e confronto

| Community | Dove | Perche |
|---|---|---|
| **AI Italia** (LinkedIn group) | LinkedIn | Rete italiana di professionisti AI |
| **Indie Hackers** | indiehackers.com | Confronto con altri solopreneur tech |
| **Hacker News** | news.ycombinator.com | Trend tecnologici first-hand |
| **r/LocalLLaMA** | Reddit | Community modelli self-hosted |
| **Discord LangChain / LlamaIndex** | Discord | Supporto tecnico su framework RAG |

### Conferenze e eventi

| Evento | Dove | Quando | Perche |
|---|---|---|---|
| **AI Week** | Milano/Online | Annuale (autunno) | Networking italiano AI |
| **WMF** (We Make Future) | Bologna | Giugno | Fiera tech italiana piu grande |
| **Smau** | Milano | Ottobre | PMI + innovazione, ottimo per prospect |
| **Confindustria eventi AI** | Varie citta | Vari | Dove sono i tuoi clienti target |
| **AI Engineer Summit** | San Francisco/Online | Annuale | Stato dell'arte tecnico (segui online) |

### Certificazioni utili (non obbligatorie ma differenzianti)

| Certificazione | Provider | Costo | Tempo | Valore |
|---|---|---|---|---|
| AWS Machine Learning Specialty | AWS | $300 | 2-3 mesi studio | Credibilita enterprise |
| Google Cloud AI/ML | Google | $200 | 1-2 mesi studio | Alternativa AWS |
| deeplearning.ai courses | Coursera | $49/mese | Ongoing | Fondamenti solidi, credibilita |

---

## APPENDICE D — Template Documentali

### D.1 Skeleton proposta commerciale

```markdown
---
PROPOSTA COMMERCIALE — PIATTAFORMA AI ASSISTENTE AZIENDALE
Cliente: [Nome Azienda]
Referente: [Nome Cognome, Ruolo]
Data: [GG/MM/AAAA]
Validita: 30 giorni dalla data
Versione: 1.0
---

## 1. Contesto e Obiettivi

[2-3 paragrafi che dimostrano di aver CAPITO il cliente.
Usa le sue parole dalla discovery. Quantifica i problemi.]

## 2. Problemi Identificati

| # | Problema | Impatto quantificato |
|---|---|---|
| 1 | [Problema specifico] | [X ore/mese, Y EUR/mese] |
| 2 | [...] | [...] |
| 3 | [...] | [...] |

## 3. Soluzione Proposta

### Use case prioritari:
1. [Use case 1] — Risparmio stimato: [X] ore/mese
2. [Use case 2] — Risparmio stimato: [X] ore/mese
3. [Use case 3] — Risparmio stimato: [X] ore/mese

### Agenti inclusi:
- [Agente 1]: [funzione in 1 riga]
- [Agente 2]: [funzione in 1 riga]

### Integrazioni:
- [Sistema 1]: [tipo]
- [Sistema 2]: [tipo]

## 4. Piano di Lavoro

| Settimana | Focus | Deliverable |
|---|---|---|
| 1 | Discovery | Assessment + matrice use case |
| 2-3 | Setup + KB + Agenti | Piattaforma funzionante |
| 4 | Integrazioni + Test | Sistema completo e validato |
| 5 | Go-Live + Training | Team operativo |

## 5. Investimento

### Opzione A — Essential: [X.000] EUR + [X00] EUR/mese
### Opzione B — Professional (raccomandata): [X.000] EUR + [X00] EUR/mese
### Opzione C — Enterprise: [XX.000] EUR + [X00] EUR/mese

[Dettaglio cosa include ciascuna]

## 6. ROI Atteso

Valore generato stimato: [X] EUR/mese
Costo mensile: [X] EUR/mese
ROI: [X.X]x
Payback: [X] mesi

## 7. Condizioni

- Pagamento: 50% alla firma, 50% al go-live
- SLA: [livello]
- Proprieta dati: il cliente mantiene la proprieta completa
- Exit: export dati in qualsiasi momento

## 8. Prossimi Passi

1. Approvazione proposta
2. Firma contratto + DPA
3. Kick-off settimana [X]
```

### D.2 Clausole DPA essenziali

```markdown
## DATA PROCESSING AGREEMENT (Clausole chiave)

Art. 1 — Oggetto
Il Responsabile tratta dati personali per conto del Titolare al solo fine
di fornire il servizio di piattaforma AI assistente aziendale.

Art. 2 — Tipologie di dati
- Dati identificativi (nome, email, telefono) contenuti nei documenti aziendali
- Dati di navigazione/utilizzo della piattaforma
- [Specificare se dati particolari ex art. 9 GDPR]

Art. 3 — Durata
Il trattamento dura per tutta la vigenza del contratto di servizio.
Alla cessazione: restituzione + cancellazione entro 30 giorni.

Art. 4 — Misure di sicurezza
- Cifratura dati in transito (TLS 1.3) e a riposo (AES-256)
- Controllo accessi con autenticazione forte
- Backup giornaliero cifrato
- Audit log con retention 90 giorni
- Test di vulnerabilita annuale

Art. 5 — Sub-responsabili
Il Responsabile si avvale dei seguenti sub-responsabili:
- [Hetzner Online GmbH] — Hosting (Germania, UE)
- [Anthropic] — Elaborazione AI (DPA Anthropic, clausole contrattuali standard)
- [OpenAI] — Elaborazione AI backup (DPA OpenAI, data processing in EU)

Art. 6 — Trasferimenti extra-UE
I dati NON vengono trasferiti al di fuori dello Spazio Economico Europeo.
[Oppure: il trasferimento avviene sulla base di clausole contrattuali standard
ex art. 46.2.c GDPR - specificare verso quale sub-responsabile]

Art. 7 — Diritto di audit
Il Titolare ha diritto di verificare il rispetto del presente accordo
con preavviso di 15 giorni lavorativi.

Art. 8 — Notifica violazioni
In caso di violazione dei dati personali, il Responsabile notifica il Titolare
entro 48 ore dalla scoperta, fornendo tutte le informazioni necessarie.
```

### D.3 Template SLA

```markdown
## SERVICE LEVEL AGREEMENT

### Uptime
- Target: 99.5% mensile (= max 3.6h downtime/mese)
- Misurazione: monitoring automatico ogni 60 secondi
- Esclusioni: manutenzione programmata (comunicata con 48h anticipo)

### Tempi di risposta supporto

| Severita | Definizione | Prima risposta | Risoluzione |
|---|---|---|---|
| P1 Critica | Servizio non disponibile | 1h | 4h |
| P2 Alta | Funzionalita core degradata | 4h | 24h |
| P3 Media | Problema non bloccante | 24h | 72h |
| P4 Bassa | Richiesta di miglioramento | 48h | Prossimo ciclo |

### Penali (solo per tier Scale/Premium)
- Uptime < 99% per 2 mesi consecutivi: sconto 20% sul mese successivo
- Mancata risposta P1 entro SLA per 2 occorrenze/trimestre: sconto 10%

### Orari di copertura
- Lun-Ven 9:00-18:00 (CET) per P2-P4
- 24/7 solo per P1 (via alert automatico + reperibilita)
```

### D.4 Template report mensile

```markdown
---
REPORT MENSILE — PIATTAFORMA AI [NOME AZIENDA]
Periodo: [Mese Anno]
Preparato da: Elios Scoglio
Data: [GG/MM/AAAA]
---

## Executive Summary
[2-3 frasi: il sistema funziona bene / ci sono problemi / 
il valore generato questo mese e di X EUR]

## Metriche del Periodo

| Metrica | Valore | Trend vs mese prec. | Target |
|---|---|---|---|
| Interazioni totali | [N] | [+/-X%] | — |
| Utenti attivi | [N/Tot] | [X%] | >= 70% |
| Accuracy misurata | [X%] | [+/-] | >= 85% |
| Tempo medio risposta | [X.X sec] | [+/-] | < 8 sec |
| Uptime | [XX.X%] | | >= 99.5% |
| Costo LLM | [EUR X] | [+/-X%] | <= [budget] |
| Ore risparmiate stimate | [Xh] | [+/-X%] | — |
| Valore generato stimato | [EUR X] | [+/-X%] | — |

## Attivita Completate Questo Mese
- [Attivita 1]
- [Attivita 2]
- [Attivita 3]

## Problemi Riscontrati e Risolti

| Problema | Severita | Causa | Risoluzione | Prevenzione |
|---|---|---|---|---|
| [Desc] | [P1-P4] | [Root cause] | [Come risolto] | [Come evitare in futuro] |

## Roadmap Prossimo Mese
1. [Priorita 1]
2. [Priorita 2]
3. [Priorita 3]

## Raccomandazioni
- [Suggerimento per aumentare il valore: nuovo use case, nuova integrazione, etc.]

## ROI Cumulativo

| Voce | Valore |
|---|---|
| Investimento totale ad oggi | [EUR X] |
| Valore generato cumulativo | [EUR X] |
| ROI cumulativo | [X.X]x |
| Payback raggiunto | [Si/No — se no: stima mesi rimanenti] |
```

---

## TOKEN & COSTO STIMATO

| Voce | Valore |
|---|---|
| Lunghezza documento | ~1.450 righe, ~17.000 parole |
| Token input stimati | ~8.000 (contesto + reference files) |
| Token output stimati | ~20.000 |
| Modello | Claude Opus 4 (Bedrock) |
| Costo output stimato | ~$1.50 |
| Costo totale sessione | ~$1.80 |

*I costi sono stime basate su tariffe pubbliche Anthropic/AWS Bedrock a giugno 2026.*
