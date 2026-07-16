# Know-How Completo — Veralab / Re-Forme SRL (Fractional CTO)

**Scopo**: Documento di riferimento per la call con Veralab. Tutto quello che devi sapere per rispondere a qualsiasi domanda con autorità e profondità.  
**Come usarlo**: Leggilo prima della call. Non devi ripetere tutto — è il tuo "arsenale mentale" da cui pescare quando la conversazione lo richiede.

---

## LIVELLO 1 — PRINCIPI FONDAMENTALI DEL FRACTIONAL CTO

### 1.1 Cos'è un Fractional CTO

Un **Chief Technology Officer a tempo parziale** (tipicamente 2-12 giorni/mese) che porta la stessa visione strategica, leadership tecnica e responsabilità decisionale di un CTO full-time — senza il costo di un'assunzione senior permanente.

**"Fractional" = frazionato nel tempo, non nella qualità.**

Non è:
- Un consulente che scrive un report e sparisce
- Un senior developer "economico"
- Un project manager
- Un babysitter per il team

È:
- Un leader tecnico che si siede al tavolo delle decisioni
- Una guida strategica con responsabilità continuativa
- Un ponte tra business e tecnologia
- Un acceleratore di maturità tecnica organizzativa

### 1.2 Perché il Modello Fractional Funziona

| Modello tradizionale | Modello Fractional |
|---------------------|-------------------|
| CTO full-time: 120-180K EUR/anno + benefit | FCTO: 84-96K EUR/anno (3gg/sett) |
| Rischio hiring: 6 mesi per capire se funziona | Trial via Tech Assessment — zero rischio |
| Prospettiva solo interna | Prospettiva esterna + interna |
| Un settore = visione limitata | Multi-settore = cross-pollination |
| Se esce = panico + 6 mesi di vuoto | Exit pianificata = team autonomo come deliverable |

### 1.3 Chi ha Bisogno di un FCTO

**5 profili ideali:**

1. **PMI tech in crescita** (10-50 dipendenti) — team cresciuto, manca governance
2. **Azienda con prodotto stabile ma debito tecnico** — funziona ma rallenta
3. **Azienda senza CTO** — il "dev senior" decide tutto, nessuno pensa alla strategia
4. **Azienda in transizione** — da ERP legacy a nuova piattaforma, da canale unico a omnichannel
5. **Bridge** — stanno cercando un CTO, serve qualcuno nel frattempo

**Veralab è probabilmente un mix di 2+4**: e-commerce + retail fisico su stack eterogeneo (Shopify + Dynamics NAV), decisione ERP in sospeso, lancio secondo brand Overskin in corso.

---

## LIVELLO 2 — IL MODELLO OPERATIVO

### 2.1 Le 4 Responsabilità del FCTO

| Responsabilità | Cosa fai concretamente |
|----------------|----------------------|
| **1. Strategy** | Roadmap tecnica, decisioni architetturali, allineamento business-tech |
| **2. Architecture** | Decisioni strutturali con trade-off espliciti: NAV vs Business Central, Shopify Plus vs headless, CDP vs soluzioni puntali |
| **3. Team** | Sviluppo del Tech Lead interno. Costruisco autonomia, non dipendenza da me |
| **4. Stakeholder** | CEO sync, traduco il tecnico in linguaggio business — dashboard di rischio con impatto in EUR, non slide con buzzword |

**Cosa NON fai (mai):**
- Scrivere codice di produzione
- Gestire ticket/sprint/backlog quotidianamente
- Fare il PM del team
- Risolvere bug in autonomia

### 2.2 I Deliverable Mensili

Ogni mese il cliente ha:

1. **Report Mensile** (1-2 pagine) — cosa è stato fatto, decisioni prese, stato roadmap, rischi
2. **Roadmap Tecnica Aggiornata** — documento vivo con stato iniziative
3. **ADR** — Architecture Decision Records per ogni scelta significativa (NAV migration, Overskin stack, inventory sync approach)
4. **Team 1:1** — almeno 2 sessioni con lead/senior
5. **CEO Sync** — 30-60 min: stato tecnico, rischi, decisioni da prendere
6. **Metriche** — deployment frequency, lead time, error rate, uptime

### 2.3 Il Ritmo Settimanale (per 3 gg/settimana)

**Giorno 1 — Governance + Team**
| Ora | Attività |
|-----|----------|
| 09:00-09:30 | Standup tecnico col team |
| 09:30-10:30 | 1:1 con Tech Lead / senior |
| 10:30-12:30 | Review decisioni architetturali pendenti / ADR |
| 14:00-15:30 | Sessione su iniziativa prioritaria (Filone 1) |
| 15:30-16:00 | Comunicazione scritta CEO (stato + next) |

**Giorno 2 — Strategia + Stakeholder**
| Ora | Attività |
|-----|----------|
| 09:00-10:30 | CEO sync (bisettimanale) |
| 10:30-12:00 | Revisione metriche + roadmap update |
| 14:00-15:30 | 1:1 con 2 developer |
| 15:30-16:30 | Documentazione decisioni (ADR) |

**Giorno 3 — Deep Work + Roadmap**
| Ora | Attività |
|-----|----------|
| 09:00-12:00 | Lavoro su iniziativa strategica (Filone 2: NAV assessment, Overskin arch, inventory design) |
| 14:00-15:30 | Review PR critiche |
| 15:30-17:00 | Report + pianificazione settimana successiva |

**Nei giorni in cui NON sei presente:**
- Canale async dedicato (Slack/Teams) — risposta entro 4h in giornata lavorativa
- Urgenze vere (sistema down, errori critici checkout): risposta entro 2h
- Lista scritta "Decisioni che il team può prendere senza di me"

### 2.4 I Primi 90 Giorni

| Fase | Durata | Obiettivo | Output |
|------|--------|-----------|--------|
| **Tech Assessment** | 3 giorni | Capire lo stato attuale | Report "State of the Stack" |
| **Mese 1 — Ascolto** | 4 settimane | Capire tutto, non cambiare nulla | Stato dell'Arte + baseline KPI + fix Magazine |
| **Mese 2 — Decisioni** | 4 settimane | Prime decisioni critiche (NAV, inventory, Overskin) | ADR per le prime 5 decisioni + primo prototipo inventory sync |
| **Mese 3 — Esegui** | 4 settimane | Primo risultato misurabile | Quick win consegnata + retrospettiva |

### 2.5 L'Output del Tech Assessment: "State of the Stack"

Documento strutturato:
1. **Executive Summary** — 3-5 righe: stato generale, messaggio chiave
2. **Stack completo** — Shopify, NAV, CRM, WMS, POS, loyalty, integrazioni
3. **Integration Map** — dove i dati si rompono tra sistemi (Shopify ↔ NAV ↔ loyalty ↔ store)
4. **Top 5 Rischi** — con impatto stimato in EUR
5. **Decisione NAV→Business Central** — go/no-go con dati, non opinioni
6. **Piano Azione 90 Giorni** — 3 priorità Filone 1 + 3 priorità Filone 2

---

## LIVELLO 3 — COMPETENZA TECNICA SPECIFICA

### 3.1 Architettura Software (cosa sai fare)

| Area | Profondità | Esempi concreti |
|------|-----------|----------------|
| **Sistemi omnichannel** | Pattern noti dall'interno | Inventory concorrente, single source of truth, POS integration |
| **Integrazione ERP** | Migrazione legacy in produzione | SETA/CORBA → Java gRPC (stessa dinamica NAV → Business Central) |
| **API design** | Enterprise-grade | OpenAPI 3.1, RFC 7807, versioning, anticorruption layer |
| **Event-driven** | Design + implementazione | Inventory sync via eventi, eventual consistency |
| **Multi-tenant** | Governance daily | Config per-tenant, isolation critica, dati separati |
| **Cloud + CDN** | Kubernetes, Cloudflare, AWS | Caching strategy, resilienza picchi, WAF |
| **Database** | SQL Server, Oracle, PostgreSQL | Schema design, migration strategy, performance tuning |

### 3.2 Processi e DevOps

| Area | Cosa porto |
|------|-----------|
| **CI/CD** | Pipeline GitLab/GitHub Actions, deploy stabile, zero-downtime |
| **Monitoring** | Log JSON strutturati, metriche Prometheus, 4 Golden Signals, alert su 5xx |
| **Incident management** | Playbook, runbook, post-mortem, root cause analysis |
| **Testing strategy** | Piramide dei test, integration test su flussi critici (checkout, inventory sync) |
| **Security** | OWASP Top 10, SAST/DAST in CI, security headers, Cloudflare WAF |
| **Resilienza** | Circuit breaker, retry + backoff, timeout su ogni chiamata esterna |

### 3.3 Team e Leadership

| Area | Esperienza |
|------|-----------|
| **Mentoring** | 1:1 strutturati, growth plan, feedback costruttivo |
| **Cultura** | ADR, blameless post-mortem, code review costruttiva |
| **Metriche** | DORA metrics (deploy frequency, lead time, MTTR, change failure rate) |
| **Cognitive load** | Ridurre complessità per il team, ownership chiara |
| **Hiring tecnico** | Job description, screening, technical interview |

### 3.4 AI e Innovazione (differenziatore)

| Area | Cosa porto |
|------|-----------|
| **AI adoption pragmatica** | Non hype. ROI dimostrabile. Dove AI serve vs dove è spreco |
| **AI nel ciclo dev** | Code review AI, analisi automatica, generazione documentazione |
| **Cost routing** | Model selection: modello economico per bulk, potente per critico |
| **ROI dimostrato** | 98% riduzione costi sviluppo su task specifici — con numeri reali |

### 3.5 Shopify — Cosa so e cosa no

**Cosa conosco:**
- Come si comporta Shopify sotto carico (stessa dinamica degli on-sale ticketing)
- Limitazioni della piattaforma (Storefront API, cache, headless vs temi)
- Architettura multi-brand su Shopify Plus
- App di terze parti come vettori di rischio (XSS, performance, data leakage)
- Cloudflare come layer di security e performance sopra Shopify

**Cosa non conosco di prima mano** `[non verificato]`:
- Il pannello Shopify admin dall'interno
- Configurazione specifica dei temi Liquid di Veralab
- L'architettura esatta dell'integrazione Shopify-NAV di Re-Forme

**Come lo dico in call se chiedono**: "Non ho gestito un negozio Shopify dall'admin — ma i problemi architetturali che emergono da un e-commerce a questa scala (spike, inventory, multi-brand, integrazioni) sono identici a quelli che gestisco ogni giorno. Il dominio specifico Shopify lo approfondisco nel Tech Assessment; la governance tecnica la porto subito."

---

## LIVELLO 4 — VERALAB: PROFILO COMPLETO

### 4.1 L'Azienda — Dati Verificati [da sito web, luglio 2026]

| Dato | Valore |
|------|--------|
| **Ragione sociale** | Re-Forme SRL |
| **Brand principale** | Veralab |
| **Secondo brand** | Overskin (dominio registrato, sito non live — placeholder Aruba) |
| **Settore** | Beauty e-commerce + retail fisico |
| **Store fisici** | 14 |
| **Piattaforma e-commerce** | Shopify |
| **CDN** | Cloudflare attivo |
| **ERP** | Microsoft Dynamics NAV |
| **Loyalty** | Programma VERABILIA (cross-channel) |
| **App Shopify rilevanti** | Jebbit (quiz), Klaviyo (email marketing), pixel Meta/Google, Trustpilot |
| **JD aperta** | Tech Lead full-time |

### 4.2 Stack Tecnico — Analisi da Site Audit [verificato luglio 2026]

| Componente | Stato verificato |
|-----------|------------------|
| **Shopify** | E-commerce principale, confermato dai pattern HTTP |
| **Cloudflare** | CDN attivo, Brotli compression attiva, HSTS corretto (max-age=31536000) |
| **Jebbit** | Quiz interattivo caricato come script di terze parti |
| **Klaviyo** | Email marketing — script inline nella pagina |
| **Trustpilot** | Recensioni — widget caricato |
| **Dynamics NAV** | ERP fisico — NON visibile dall'esterno, inferito dalla JD |
| **Overskin** | Dominio registrato su Aruba, sito non live [verificato] |

### 4.2b Dynamics NAV — Cos'è e perché conta `[non verificato — inferito dalla JD]`

**Cos'è Microsoft Dynamics NAV**

NAV (ora rinominato **Microsoft Dynamics 365 Business Central**) è un ERP (Enterprise Resource Planning) mid-market di Microsoft. È il gestionale "di famiglia" per PMI europee con fatturati tra 5M e 500M EUR: gestisce contabilità, magazzino, acquisti, vendite, produzione, logistica.

Per Veralab, quasi certamente gestisce:
- **Inventario fisico** dei 14 store (giacenze, movimenti di magazzino, trasferimenti inter-store)
- **Gestione ordini B2B** (grossisti, rivenditori, se esiste questo canale)
- **Contabilità e fatturazione** (ciclo attivo/passivo)
- **Logistica e spedizioni** (integrazione con corrieri)

**Il problema: NAV è legacy**

Microsoft ha smesso di sviluppare Dynamics NAV come prodotto standalone nel 2018, quando ha lanciato **Business Central** come successore cloud-native. Le versioni NAV esistenti continuano a ricevere patch di sicurezza fino al 2028 circa (dipende dalla versione), ma non ricevono nuove funzionalità.

| Versione NAV | Nome commerciale | Fine mainstream support |
|---|---|---|
| NAV 2016 | Dynamics NAV 2016 | 2021 (già scaduto) |
| NAV 2017 | Dynamics NAV 2017 | 2022 (già scaduto) |
| NAV 2018 | Dynamics NAV 2018 | 2023 (già scaduto) |
| BC 14 (2019) | Business Central 2019 | 2024 (già scaduto) |
| BC Wave 2024+ | Business Central cloud | Continuo (SaaS) |

`[non verificato]` Non so quale versione usa Veralab — è una domanda da fare in discovery.

**Il vero problema: l'integrazione con Shopify**

NAV è nato negli anni '90 come software desktop/on-premise. Non ha API REST native decenti. Per integrarlo con Shopify esistono tre approcci:

| Approccio | Come funziona | Rischi |
|---|---|---|
| **Sync batch notturno** | Un job esporta/importa file CSV o DB dump ogni notte | Stock sempre sfasato di 24h — overselling garantito sui lanci |
| **Middleware custom** | Un servizio intermedio (spesso scritto internamente) chiama le API NAV (OData/SOAP) e le API Shopify | Fragile, non documentato, "lo sa solo Mario" |
| **Connettore di terze parti** | App Shopify come Celigo, Patchworks, Alumio | Costo mensile, ma manutenuto — riduce debito tecnico interno |

La probabilità che Veralab usi il **sync batch notturno** o un **middleware custom** è alta — è quello che fanno il 90% delle PMI italiane con NAV. `[non verificato]`

**Perché la migrazione a Business Central è la decisione da prendere**

Business Central cloud ha:
- API REST native (Microsoft Graph API)
- Connettori Shopify ufficiali (Microsoft ha rilasciato un'integrazione nativa nel 2022)
- SaaS — nessuna infrastruttura da gestire
- Aggiornamenti automatici Microsoft ogni 6 mesi

La migrazione NAV → Business Central non è banale:
- **Durata**: 6-18 mesi a seconda della complessità delle customizzazioni
- **Costo**: 50-400K EUR (dipende fortemente da quante personalizzazioni esistono su NAV — e su NAV si personalizza tantissimo)
- **Rischio principale**: le customizzazioni NAV sono scritte in AL/C/SIDE — non migrano automaticamente

**Come lo usi in call**

Non presentarlo come "dovete migrare". Presentarlo come "è una decisione che arriva comunque — la differenza è se la prendete con dati o in emergenza".

> "La decisione NAV → Business Central non è un se, è un quando. Ogni trimestre che passa senza una valutazione informata aumenta il rischio che la decisione venga presa sotto pressione — quando costa di più e si sbaglia più facilmente. La prima cosa che faccio nel Tech Assessment è darvi un go/no-go con numeri reali, non opinioni."

### 4.3 Finding Tecnici — Risultati Audit [verificati live luglio 2026]

| Finding | Severity | Stato | Fonte |
|---------|----------|-------|-------|
| `/blogs/news` HTTP 500 | **CRITICO** | Confermato in produzione | Script live |
| Nessun alerting su 5xx | **ALTO** | Non configurato | Inferito dal 500 non rilevato |
| Structured data JSON-LD assente | **MEDIO** | Confermato | Script live |
| Content-Security-Policy assente | **ALTO** | Confermato | Script live |
| Homepage 765KB — LCP stimato 3-4s | **MEDIO** | Confermato | Script live |
| X-Frame-Options assente | **MEDIO** | Confermato | Script live |
| Cache-Control assente | **BASSO** | Confermato | Script live |
| HSTS corretto | **OK** | max-age=31536000 | Script live |
| X-Content-Type-Options: nosniff | **OK** | Corretto | Script live |
| Brotli compression | **OK** | Attiva via Cloudflare | Script live |
| Storefront API 404 (`/products.json`, `/cart.js`) | **DA CHIARIRE** | Intenzionale o bug? | Script live |

**Nota importante**: i gap architetturali (inventory sync, NAV come SPOF, multi-brand Overskin) sono **inferiti** dalla struttura del business — non misurabili dall'esterno. Vanno verificati in onboarding. Presentarli come "probabili", non come certi.

### 4.4 Gap Architetturali — Analisi `[probabile — da verificare]`

#### Gap #1 — Inventory non unificato `[probabile]`

Shopify gestisce lo stock e-commerce. Dynamics NAV gestisce l'inventario fisico (14 store + B2B). Su questo tipo di architettura, quasi certamente non esiste un single source of truth real-time.

**Possibili conseguenze**:
- Click & collect complesso senza inventory sync
- Overselling sui lanci prodotto (stesso pattern degli on-sale ticketing — conosco questo problema)
- Loyalty VERABILIA cross-channel limitata se il POS non è connesso a Shopify in real-time

**Come presentarlo in call**: "Dalla struttura del business — 14 store fisici + e-commerce su piattaforme separate — immagino che la sincronizzazione inventory sia uno dei punti di frizione. È così?"

#### Gap #2 — Decisione ERP non presa `[probabile]`

Dynamics NAV: versioni pre-2018 sono fuori mainstream support. Migrazione a Business Central: 6-18 mesi di progetto, 100-400K EUR di investimento. Ogni trimestre senza una decisione informata aumenta il rischio di doverla prendere in emergenza.

**Come presentarlo**: "La decisione NAV → Business Central è aperta? È il tipo di scelta che costa molto se fatta in ritardo o in fretta."

#### Gap #3 — Architettura multi-brand non definita `[probabile]`

Veralab + Overskin condividono infrastruttura ma sono brand separati. Catalogo, pricing, loyalty, logistica — tutto deve essere separato o condivisibile per design, non per accidente. Su Shopify standard non è possibile senza Shopify Plus o scelta architetturale esplicita.

**Come presentarlo**: "Overskin — avete già deciso lo stack? Se va su Shopify, serve una decisione esplicita su Shopify Plus o multi-store, prima che si accumuli debito impossibile da sciogliere."

#### Gap #4 — Monitoring assente `[verificato]`

Il 500 del Magazine non è nei loro alert. È il segnale di un problema sistemico: non hanno visibilità su cosa succede in produzione.

**Come presentarlo**: "Il 500 sul Magazine non è nei vostri alert — lo so perché se ci fosse sarebbe già risolto. Questo è il gap più semplice da chiudere e il più importante: se non sai quando il sito si rompe, ogni altro problema arriva in ritardo."

### 4.5 Punti di Contatto col Mio Background

| Il mio background | Match specifico con Veralab |
|-------------------|------------------------------|
| **30M transazioni/anno, spike prevedibili** | Lanci prodotto con copertura influencer — stesso pattern on-sale |
| **Inventory real-time e concorrente** | Inventory multi-canale Shopify + 14 store fisici + B2B NAV |
| **Integrazioni esterne con circuit breaker** | Shopify ↔ NAV ↔ loyalty ↔ POS — ogni integrazione è un potenziale punto di rottura |
| **Migrazione legacy in produzione** | NAV → Business Central: stessa dinamica CORBA → microservizi (modernizzazione senza fermare) |
| **Multi-tenant su larga scala** | Config e dati separati per brand: Veralab vs Overskin |
| **GDPR daily** | Dati cliente e-commerce — profili, acquisti, loyalty — dati personali non banali |
| **Monitoring e observability** | 4 Golden Signals, alert su 5xx, log strutturati — nulla di questo è presente oggi |
| **Security headers e hardening** | CSP, X-Frame, Referrer-Policy — tutti mancanti su veralab.it |
| **Cloudflare come strumento** | Già presente — posso usarlo per CSP, cache rules, WAF, senza toccare Shopify |

### 4.6 I Due Filoni Applicati a Veralab

#### FILONE 1 — Presente: Ottimizzare

| Area | Intervento concreto | KPI |
|------|---------------------|-----|
| **Fix Magazine** | Identificare causa HTTP 500, chiuderlo | Magazine online in <1 settimana |
| **Monitoring 5xx** | Alert su errori critici (Cloudflare + Shopify) | Zero errori non rilevati |
| **Security headers** | CSP, X-Frame-Options, Referrer-Policy via Cloudflare | Security score migliorato |
| **Structured data** | JSON-LD via app Shopify (30 min) | Rich results su prodotti in SERP |
| **Homepage performance** | Audit app, lazy loading, image optimization | LCP < 2.5s |
| **CI/CD deploy** | Pipeline stabile, alert su deploy falliti | Deploy frequency baseline → misurata |
| **Incident playbook** | "Cosa fare quando il checkout va giù durante un lancio influencer" | MTTR baseline → misurato |

#### FILONE 2 — Visione: Evolvere

| Area | Intervento strategico | Outcome |
|------|----------------------|---------|
| **Inventory unificato** | Design single source of truth Shopify ↔ NAV | Click & collect + zero oversell su lanci |
| **NAV → Business Central** | Assessment go/no-go con dati — timing, costi, rischi, alternative | Decisione informata — non in emergenza |
| **Architettura Overskin** | Stack decision (Shopify Plus? Multi-store? Headless?) con ADR | Overskin va live su architettura scalabile |
| **Loyalty cross-channel** | VERABILIA: punti guadagnati online visibili in store e viceversa | Loyalty davvero omnichannel |
| **Profilo cliente unificato** | CRM/CDP che aggrega dati da tutti i touchpoint | Segmentazione e personalizzazione reale |
| **AI nel business** | Use case concreti: predizione stock, personalizzazione prodotti, chatbot post-vendita | AI Strategy con ROI per use case |

---

## LIVELLO 5 — DETTAGLI OPERATIVI

### 5.1 Struttura Contrattuale

| Elemento | Standard |
|----------|----------|
| **Tipo** | Collaborazione professionale (P.IVA) |
| **Durata minima** | Tech Assessment → poi 6 mesi |
| **Rinnovo** | Trimestrale dal mese 7, senza vincoli |
| **Preavviso exit** | 30 giorni (entrambe le parti) |
| **Pagamento** | Retainer mensile fisso, fattura a fine mese |
| **Urgenze** | Definite in contratto; fuori scope = extra (200 EUR/h) |
| **Proprietà intellettuale** | Il codice è del cliente; metodologie/framework restano del FCTO |
| **NDA** | Standard, reciproco |
| **Non-compete** | No (il FCTO lavora per più clienti per definizione) |

### 5.2 Cosa serve dal cliente (prerequisiti)

- Accesso read al codebase (GitHub/GitLab)
- Accesso read al pannello Shopify e analytics
- Accesso al sistema di monitoring (se esiste)
- Canale comunicazione team (Slack/Teams)
- Calendario condiviso per i giorni di presenza
- 1 ora/settimana del CEO per i sync
- Apertura al feedback onesto (anche scomodo)

### 5.3 KPI proposti (baseline → obiettivo 6 mesi)

| KPI | Cosa misura | Come si migliora | Target 6 mesi |
|-----|-------------|------------------|---------------|
| **Uptime Magazine** | `/blogs/news` disponibile | Fix 500 + monitoring | 100% (da broken) |
| **Error rate 5xx** | Errori critici / settimana | Monitoring + alert | 0 non rilevati |
| **LCP homepage** | Core Web Vitals — velocità | App audit, lazy load, CDN cache | < 2.5s (da 3-4s) |
| **Deploy frequency** | Quante volte rilasciate | CI/CD, processi | Baseline → misurata → +100% |
| **Lead time** | Da ticket a produzione | Ridurre handoff | Baseline → -40% |
| **MTTR** | Tempo risoluzione incidenti | Playbook, monitoring | Baseline → -50% |
| **Inventory accuracy** | % discrepanze Shopify vs NAV | Sync design | Baseline → misurata |

### 5.4 Gli Errori da NON Fare

1. **Mai toccare il codice** — appena lo fai, diventi "il dev senior" nel cervello del cliente
2. **Mai promettere tempi** — "risolvo il debito in 3 mesi" è impossibile. "Inizio a ridurlo visibilmente" è onesto
3. **Mai decidere senza ascoltare il team** — sanno cose che tu non sai
4. **Mai diventare il collo di bottiglia** — se tutto passa da te, hai fallito
5. **Mai abbassare il prezzo** — cambia il tier, non la daily rate
6. **Mai ignorare la cultura** — pratiche enterprise in una PMI creano paralisi
7. **Mai sopravvalutare la tua comprensione del loro business** — ascolta più di quanto parli nei primi 60 giorni

### 5.5 Exit: Come Finisce (e perché è un successo)

**3 modalità di uscita:**

1. **Exit naturale** — l'azienda assume un Tech Lead/CTO full-time (successo: tu l'hai resa pronta)
   - 3 mesi preavviso, aiuti nell'hiring, onboarding del successore (1 mese overlap)

2. **Exit pianificata** — obiettivo raggiunto (Overskin lanciato, NAV migrato, team autonomo)
   - Documento di passaggio, retrospettiva, offerta di advisory trimestrale

3. **Exit difficile** — il rapporto non funziona
   - 30 giorni preavviso, lettera di chiusura con stato + raccomandazioni
   - MAI bruciare ponti

---

## LIVELLO 6 — QUICK REFERENCE IN CALL

### Se ti chiedono "Come lavori concretamente?"

> "Il mio approccio si basa su due filoni paralleli. Il primo è immediato: ottimizzare i vostri flussi — come il team lavora, come rilasciate, come gestite gli incidenti. Best practice operative che portano risultati in settimane, non mesi. Il secondo è strategico: dove va l'architettura nei prossimi 12-24 mesi, come risolviamo l'inventory sync, quando ha senso migrare da NAV.
>
> Il primo mese è tutto ascolto — capisco come funzionate oggi, misuro la baseline. Poi definiamo insieme obiettivi concreti con tempi e KPI. Ogni mese consegno un report con numeri: cosa è migliorato, cosa no, e perché."

### Se ti chiedono "Che risultati hai ottenuto?"

> "Nell'ultimo anno ho portato una piattaforma da deploy ogni 6 settimane a deploy settimanali — +400% di frequenza. Ho ridotto del 91% il tempo di deploy. Con l'AI integrata nel processo, ho dimostrato risparmi del 77-82% sui costi di sviluppo su task specifici. Ma il risultato più importante: team più autonomo, che sa prendere decisioni anche quando non ci sono."

### Se ti chiedono "Perché non il full-time?"

> "Perché non vi servono 5 giorni di CTO a settimana. Vi servono le decisioni giuste, non le ore. Con 3 giorni di alta qualità avete la stessa seniority che paghereste 180K l'anno full-time — a metà del costo, zero rischio, con la possibilità di scalare su o giù. E con un vantaggio: la prospettiva esterna permanente."

### Se ti chiedono "Conosci il nostro settore?"

> "Conosco i vostri problemi: inventory sync su canali eterogenei, spike di traffico sui lanci, integrazione ERP legacy, secondo brand da architettare, monitoring assente. Il settore beauty nel dettaglio lo apprendo nel primo mese — ma i problemi architetturali, di scaling, di team, di compliance sono identici a quelli che gestisco ogni giorno su 30 milioni di transazioni/anno."

### Se ti chiedono "Hai esperienza con Shopify?"

> "Non ho gestito un negozio Shopify dall'admin — ma ho gestito sistemi con la stessa complessità tecnica: checkout sotto pressione, inventory concorrente, logistica distribuita. E Cloudflare lo conosco bene — posso intervenire subito su CSP, cache rules, e WAF senza aspettare modifiche al tema Shopify. Il dominio Shopify specifico lo approfondisco nel Tech Assessment."

### Se ti chiedono "Cosa fai il primo mese?"

> "Ascolto. Codifico. Misuro. Il primo mese non cambio NIENTE — capisco come funzionate, mappo lo stack (Shopify, NAV, integrazioni, POS, loyalty), parlo con ogni persona del team, misuro la baseline dei KPI. A fine mese vi consegno 'State of the Stack' con: dove siete, dove potete andare, cosa rischia, e un piano per i 90 giorni successivi. Plus: chiudo il 500 del Magazine il primo giorno."

### Se ti chiedono "Come gestisci il conflitto con il tuo lavoro principale?"

> "Il modello fractional per definizione prevede più clienti. Non c'è conflitto di interesse perché operate in settori completamente diversi — ticketing sportivo e beauty retail. La mia agenda è strutturata: giorni dedicati con focus totale su un solo cliente per giorno. Nessuna condivisione di informazioni tra clienti."

---

*Documento: v1.0 | 2026-07-14*  
*Companion: `PREP_Call_Veralab_FCTO.md` (call script completo)*  
*Presentazione: `PRES_Veralab_EliosScoglio.md`*  
*Analisi tecnica: `ANALISI_Tecnica_Veralab_SiteAudit.md`*
