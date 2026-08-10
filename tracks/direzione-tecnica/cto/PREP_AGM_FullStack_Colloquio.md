# Colloquio AGM Solutions — Senior Full Stack Engineer

**Azienda:** AGM Solutions srl — ICT Governance, ICT Security & GDPR Compliance, certified Great Place To Work
**Ruolo:** Senior Full Stack Engineer (cliente di AGM)
**Modalità:** remoto
**Riferimento stack:** Python, Kafka, MongoDB, Lakebase, Next.js/TypeScript, Agentic coding, Testing >90%, Observability

---

## 1. Obiettivo del colloquio

La domanda implicita di chi assume un Senior Full Stack in questo stack:

> Questa persona sa costruire sistemi event-driven robusti, mantenerli in produzione con ownership reale, e lavorare bene in team distribuiti con metodi moderni (AI-assisted dev, spec-based testing)?

Non è una verifica teorica. Cercano prove concrete di:
- Sistemi che hanno funzionato sotto pressione
- Testing reale (non coverage gonfiata)
- Autonomia in ambienti ambigui
- Familiarità pratica con agentic coding (non solo awareness)

---

## 2. Mappatura competenze richieste → esperienze

### Python — solida capacità di scrivere e revisionare codice

**Esperienza da portare:**
- `[verificato]` Sviluppo backend Python su AIA Platform (monorepo TS con bridge Python)
- `[verificato]` Integrazione LLM pipeline con gestione errori, retry, fallback
- `[verificato]` Uso di Pydantic per validazione dati LLM output e API boundary

**Cosa dimostrare:**
- Pattern: dependency injection, result pattern (no exception-as-control-flow), async/await corretto
- Code review: "Come rivedi il codice di un collega? Cosa cerchi primo?" → risposta: naming, SRP, error handling, testabilità
- Python specifico: asyncio, type hints strict, mypy, ruff

**Domanda probabile:** *"Qual è un bug sottile che hai trovato in codice Python altrui?"*

Risposta preparata:
> In un servizio di integrazione ho trovato un `asyncio.run()` chiamato dentro una funzione già in un loop async — causava `RuntimeError: This event loop is already running` solo sotto certi load pattern. Il sintomo era un crash intermittente in produzione che non si riproduceva in test. L'ho risolto refactoring per usare `asyncio.create_task()` e aggiungendo un integration test che simulava il concurrency pattern reale.

---

### Kafka — pattern di integrazione, architetture event-driven

**Esperienza da portare:**
- `[verificato]` AIA Platform usa un event bus interno — collegamento naturale a Kafka
- `[probabile]` Architettura event-driven su TicketOne per sincronizzazione SPORT↔SETA (non Kafka, ma stesso pattern)
- `[verificato]` Studio approfondito di Event Sourcing, CQRS, Saga pattern

**Cosa dimostrare:**
- Differenza at-most-once / at-least-once / exactly-once e quando scegliere quale
- Idempotency come requisito di design, non come afterthought
- Consumer group come meccanismo di scaling
- Dead Letter Queue per messaggi non processabili

**Domanda probabile:** *"Come gestiresti un consumer che fallisce su certi messaggi?"*

Risposta preparata:
> Pattern DLQ in tre livelli: primo un retry con exponential backoff (3-5 tentativi), poi se ancora fallisce mando il messaggio su un topic `.retry` con un header `retry-count`, infine dopo MAX_RETRIES sul topic `.dlq`. Il DLQ viene monitorato con alert su Prometheus e processato manualmente o con un worker dedicato. L'importante è che il consumer principale non si blocchi su messaggi "poison pill" — va avanti e registra il fallimento.

**Domanda probabile:** *"Hai usato Kafka in produzione?"*

Se non hai esperienza diretta:
> Ho esperienza con architetture event-driven equivalenti — su TicketOne gestiamo la sincronizzazione tra sistemi via eventi (SPORT→SETA per emissione biglietti) con gli stessi pattern: ordering per partizione, idempotency, saga choreography. Ho studiato Kafka a fondo e costruito prototype con `confluent-kafka` e `aiokafka`. Sono confident nel design dei contratti e nella gestione degli errori.

---

### MongoDB + Lakebase — data flows e database

**Esperienza da portare:**
- `[verificato]` AIA Platform usa PostgreSQL + pgvector + Neo4j — conoscenza schema design NoSQL
- `[verificato]` Design di schemi per multi-tenancy, data isolation, aggregazioni
- `[probabile]` Familiarità con Change Streams come pattern CDC

**Cosa dimostrare:**
- Quando usare embedded vs reference (con ragionamento, non dogma)
- Aggregation pipeline per report e analytics
- Indexing strategy con regola ESR (Equality → Sort → Range)
- Change streams per event-driven senza polling

**Domanda probabile:** *"Progetta lo schema per un sistema di ordini e-commerce in MongoDB"*

Risposta preparata:
> Prima chiederei: qual è il pattern di accesso? Se leggo sempre ordine+items insieme, embedded. Se gli items condividono dati tra più ordini (prodotto con descrizione che cambia), reference. Per gli ordini in sé: embedded items (1-to-few, stabilità), reference per customer (dati che cambiano, accesso indipendente). Aggiungerei indici su `customer_id` e su `(customer_id, created_at)` per la query più comune. Per il reporting userei aggregation pipeline con `$match` su range di date (con indice su `created_at`) poi `$group` per categorie.

**Su Lakebase:** È nuovo (annunciato 2025), `[non verificato]` direttamente. Ma è Postgres-compatibile, quindi l'interfaccia è identica a qualsiasi Postgres. Il valore specifico: branching del DB per dev/test, sync bidirezionale con Delta Lake per analytics, e use case come memoria per AI agent.

---

### Next.js + TypeScript — UI semplici

**Esperienza da portare:**
- `[verificato]` AIA Platform include frontend React + Vite (non Next.js, ma stesso ecosistema)
- `[verificato]` TypeScript strict mode su tutto il codebase AIA
- `[verificato]` Hono per API backend TypeScript — stesso pattern dei Route Handler Next.js

**Cosa dimostrare:**
- Differenza App Router vs Pages Router — sai spiegare perché App Router è default ora
- Server vs Client Component — quando e perché
- Route Handler come backend API (è un FastAPI per TypeScript)

**Il ruolo chiede "semplici UI"** — non è un frontend role. Il messaggio corretto:
> "Non sono un frontend specialist, ma so costruire interfacce funzionali e mantenibili con Next.js. La mia forza è il backend, le integrazioni, e il dato — ma posso costruire l'UI necessaria per far funzionare un prodotto senza dipendere da un frontend dedicato."

---

### Agentic coding — sviluppo assistito da AI

**Esperienza da portare:**
- `[verificato]` Uso quotidiano di Claude Code per sviluppo AIA Platform e consulenza 108 Vision
- `[verificato]` CLAUDE.md configurato, hooks, subagent pattern, plan mode
- `[verificato]` Workflow strutturato: Explore → Plan → Implement → Verify

**Cosa dimostrare:**
- Non solo "uso GitHub Copilot" — sai strutturare un workflow agentico
- Pattern test-driven con AI: una sessione scrive i test, un'altra implementa
- Come gestisci la context window e quando usare `/clear`
- CLAUDE.md come documentazione vivente per il team

**Domanda probabile:** *"Come usi l'AI nel tuo workflow quotidiano di sviluppo?"*

Risposta preparata:
> Uso Claude Code come copilota agentico, non come autocomplete avanzato. Il workflow che ho adottato è in 4 fasi: prima faccio esplorare all'AI il codebase in modalità read-only per capire il contesto senza modificare nulla, poi costruiamo insieme il piano prima di toccare il codice, poi implemento con verifica continua tramite la test suite, e infine review del diff prima del commit. Uso anche il pattern Writer/Reviewer: una sessione scrive, un'altra sessione con contesto fresco fa code review senza bias. Per i test, spesso scrivo prima lo spec in linguaggio naturale, l'AI lo traduce in test cases, e poi implementiamo il codice per farli passare. Questo mi ha dato un >90% di coverage di fatto, non gonfiato.

---

### Testing — >90% coverage, spec-based

**Esperienza da portare:**
- `[verificato]` Coverage >90% su AIA Platform per design
- `[verificato]` Test parametrizzati con pytest per edge cases
- `[verificato]` Integration test con testcontainers (no mocking del DB)
- `[verificato]` Filosofia: test il comportamento, non l'implementazione

**Cosa dimostrare:**
- La differenza tra coverage alto e coverage significativo
- Spec-based testing: i test come documentazione vivente delle specifiche
- Quando mockare è giusto e quando è sbagliato (mock troppo = test dell'implementazione)
- Testcontainers per integration test veloci su DB reale

**Domanda trabocchetto:** *"Come raggiungi il 90% di coverage in modo sostenibile?"*

Risposta preparata:
> Non parto dalla coverage come obiettivo — parto dalle specifiche. Per ogni funzione scrivo prima: qual è l'output atteso per questo input? Quali sono gli edge cases dichiarati nelle specifiche? Cosa succede se il servizio downstream fallisce? Questo approccio spec-based copre naturalmente il codice significativo. La coverage alta è un sottoprodotto, non il target. Il coverage gonfiato — test che passano sempre perché fanno solo `assert service.create() is not None` — è peggio di nessun test.

---

### Ownership in produzione + Observability

**Esperienza da portare:**
- `[verificato]` TicketOne: sistemi revenue-critical, on-call, incident management
- `[verificato]` Golden signals su ogni servizio (latency, traffic, errors, saturation)
- `[verificato]` Logging JSON strutturato, OpenTelemetry, Prometheus

**Cosa dimostrare:**
- Hai definito alert, non solo metriche
- Conosci la differenza tra readiness probe e liveness probe
- Sai cos'è un Kafka consumer lag e perché è un segnale critico
- "Mentalità di ownership" = non finisce quando il ticket è chiuso

**Domanda probabile:** *"Dimmi di un incidente in produzione di cui sei stato responsabile"*

Risposta preparata:
> Su TicketOne abbiamo avuto un incidente durante un on-sale (vendita biglietti live) dove il circuit breaker del servizio di fiscal compliance (MAI-Fiscale) non si apriva correttamente — continuava a tentare anche con tutti i server irraggiungibili, causando timeout a cascata verso il checkout. La root cause era una configurazione del threshold troppo alta. L'abbiamo risolto in 8 minuti tramite feature flag che bypassava il controllo fiscal in modalità degradata (con coda di recupero). Post-mortem: ho aggiunto un alert su consumer lag della coda di retry e ridotto il threshold del breaker. La lezione: circuit breaker senza alert sul suo stato di apertura è invisibile.

---

## 3. Domande da fare tu

Queste domande dimostrano mentalità di ownership, non curiosità generica:

1. **Sul progetto concreto:**
   > "Qual è il principale pain point tecnico del sistema che andrei a supportare oggi — non in teoria, ma quello che si è manifestato nell'ultimo mese?"

2. **Sul testing:**
   > "Qual è la coverage attuale e com'è gestita la suite di test? Ci sono aree dove si evita di scrivere test perché è 'troppo difficile'?"

3. **Su Kafka e Lakebase:**
   > "È Kafka gestito (Confluent Cloud, MSK) o self-hosted? Lakebase è già in produzione o nella roadmap?"

4. **Sul team e AI adoption:**
   > "Come è strutturato il team? L'agentic coding è già nel workflow o è una competenza che state costruendo?"

5. **Sull'ambiguità (requirement del ruolo):**
   > "Cosa intendete con 'a proprio agio con l'ambiguità'? C'è un esempio recente di una situazione che richiedeva questa caratteristica?"

---

## 4. Posizionamento strategico

### Il messaggio centrale

> "Sono un ingegnere che costruisce sistemi che funzionano in produzione sotto pressione. Il mio background su sistemi revenue-critical (ticketing, fiscal compliance, real-time) mi ha insegnato che il codice è il mezzo, non il fine. Il fine è che il sistema sia affidabile, osservabile, e comprensibile per chiunque lo debba mantenere — incluso il me del futuro."

### Forza differenziante rispetto ad altri Senior Full Stack

La maggior parte dei candidati con questo stack viene da startup tech o da ambienti data engineering. Il vantaggio:
- **Sistemi con SLA stringenti**: non "proviamo e vediamo", ma "questo deve funzionare o perdiamo vendite"
- **Integration complexity**: gestione di sistemi legacy, dipendenze esterne, concorrenza — non solo API interne
- **Ownership reale**: on-call, incident, post-mortem — non solo "ho scritto il codice"
- **AI Engineering pratico**: non "ho sentito parlare di agenti", ma "ho un workflow strutturato e documentato"

### Come gestire i gap

**Kafka in produzione diretta:**
> "Ho esperienza con architetture equivalenti e studio approfondito del pattern. Sono confident nel design e negli errori comuni. La curva per una codebase Kafka esistente è la conoscenza del topic naming, la configurazione di produzione, e i pattern specifici del team — non il paradigma."

**Lakebase (nuovo, poca esperienza generale):**
> "È un prodotto nuovo per tutti — annunciato nel 2025. La mia familiarità con PostgreSQL e con l'ecosistema Databricks/Delta Lake è la base. Sono abituato a onboardarmi velocemente su sistemi nuovi."

---

## 5. Ricerca su AGM Solutions

**Stato:** `[non verificato]` — sito ufficiale non raggiungibile durante la ricerca.

**Cosa si sa con confidenza:**
- Certificata Great Place To Work (bestworkplaces.it)
- Settore: ICT Governance, ICT Security & GDPR Compliance
- Cerca un Senior Full Stack per un **cliente** (non posizione interna) → AGM è una società di consulenza/staffing tecnico
- Modalità: remoto

**Da chiedere al colloquio:**
- "Questo ruolo è direttamente in AGM o in uno dei vostri clienti? Qual è il progetto?"
- "Com'è strutturato il team? Sono già in produzione con Kafka/Lakebase o è stack di greenfield?"
- "Qual è il settore del cliente finale?"

**Implicazione:** se AGM è consulenza/staffing, il colloquio potrebbe essere un primo screening prima di essere presentato al cliente finale. Chiedere esplicitamente come funziona il processo.

---

## 6. Red flag da evitare

- Non scendere in dettagli di TicketOne che non puoi condividere (NDA implicito)
- Non presentare Lakebase come se avessi esperienza diretta in produzione — `[non verificato]`
- Non sopravvalutare la conoscenza Kafka se non hai esperienza diretta — l'honesty è preferita
- Non minimizzare la UI/Next.js skill: "non sono un frontend" è OK, "non so fare UI" non lo è

---

## 7. Colloquio HR — Human & Soft Skills

### Cosa valuta l'HR in questo colloquio

L'HR non verifica competenze tecniche. Valuta tre cose:

1. **Fit culturale**: sei compatibile con il modo di lavorare di AGM e del cliente finale?
2. **Segnali di rischio**: comportamenti passati che indicano problemi (instabilità, conflitti, scarsa autonomia)?
3. **Comunicazione e chiarezza**: sai spiegare chi sei, cosa hai fatto, e perché vuoi questo ruolo — senza gergo?

Nota specifica su AGM come consulenza/staffing: cercano persone che sappiano gestire relazioni con il cliente finale, non solo eseguire task. La soft skill principale è **credibilità professionale in contesti nuovi**.

---

### Mappa competenze soft → ruolo Senior Full Stack remoto in consulenza

| Competenza | Perché conta qui | Segnale positivo |
|---|---|---|
| **Ownership e responsabilità** | Remoto = nessuno ti controlla; devi consegnare senza supervisione | "Seguo un incident anche fuori orario perché il sistema è mio" |
| **Comunicazione asincrona** | Team distribuiti, client remoti, documentazione come canale primario | ADR, commit message, PR description come comunicazione |
| **Comfort con l'ambiguità** | Il job posting lo cita esplicitamente; consulenza = requisiti incompleti | "Quando i requisiti sono vaghi, chiedo le domande giuste anziché aspettare" |
| **Collaborazione senza ego** | Senior = moltiplicatore del team, non lone wolf | Code review costruttiva, RFC, ADR condivisi |
| **Adattabilità tecnica rapida** | Stack nuovo (Lakebase), cliente nuovo, contesto nuovo | Onboarding rapido su sistemi legacy in TicketOne |
| **Feedback in entrambe le direzioni** | Cultura GptW → psychological safety dichiarata | Sai dare feedback difficile E riceverlo senza difensività |
| **Gestione del conflitto tecnico** | Decisioni di design in ambienti multi-stakeholder | "Separare le persone dal problema — discuto il trade-off, non la persona" |
| **Proattività** | Senior non aspetta task assegnati: vede problemi e propone | Post-mortem + miglioramento sistemico, non solo fix del sintomo |

---

### Domande comportamentali HR — risposte preparate (formato STAR)

**"Dimmi di una volta che hai dovuto lavorare con requisiti poco chiari."**

> **Situazione:** Su TicketOne dovevamo integrare un sistema di verifica identità pre-vendita (VRO) con documentazione solo parziale dal fornitore istituzionale.
> **Task:** Progettare l'integrazione senza poter bloccare la roadmap di rilascio.
> **Azione:** Ho mappato gli scenari certi (happy path, errore 5xx), documentato esplicitamente le assunzioni su quelli incerti in un ADR, e costruito un adapter con circuit breaker che degradava gracefully se il sistema esterno non rispondeva secondo attese. Ho schedulato una review con il team una volta ottenuta la documentazione completa.
> **Risultato:** L'integrazione è andata in produzione nei tempi, e l'ADR ci ha evitato un regressione quando la documentazione reale differiva dalle assunzioni su due scenari edge.

---

**"Hai mai avuto un conflitto con un collega su una scelta tecnica? Come l'hai gestito?"**

> **Situazione:** Discordanza con un collega sull'approccio di caching — lui voleva Redis su tutto, io volevo valutare FusionCache (L1+L2) per ridurre la pressione su Redis in scenari di read-heavy.
> **Task:** Arrivare a una decisione senza creare tensione nel team.
> **Azione:** Ho proposto di separare il "cosa" (quale performance vogliamo) dal "come" (quale strumento). Abbiamo scritto insieme un spike tecnico con benchmark su entrambi gli approcci nei nostri pattern di accesso reali. Ho poi prodotto un ADR con i trade-off espliciti, lasciando a lui la firma come reviewer.
> **Risultato:** Abbiamo adottato FusionCache per i casi read-heavy e Redis puro per i casi con TTL critico. Il collega ha proposto lui stesso l'ADR nel meeting di review del mese successivo come esempio di processo.

---

**"Come ti organizzi lavorando in remoto su un progetto complesso?"**

> Tre strumenti: **struttura**, **comunicazione in anticipo**, e **documentazione come default**.
> Struttura: divido ogni obiettivo grande in task con criteri di "fatto" chiari — non "lavoro su X" ma "X è fatto quando il test passa e la PR è approvata".
> Comunicazione in anticipo: se vedo un rischio o un blocco, lo segnalo prima di essere bloccato — non aspetto il daily stand-up.
> Documentazione come default: ogni decisione non ovvia finisce in un ADR o nei commit message. Non costruisco "conoscenza tacita" che dipende da me per essere trasferita. In ambienti remoti, la documentazione è il collega che non c'è.

---

**"Perché vuoi lasciare il tuo ruolo attuale?"**

> Non è insoddisfazione — il ruolo in TicketOne mi ha dato una base tecnica solida su sistemi enterprise. Sto cercando un contesto dove posso applicare queste competenze su stack più moderni (event-driven, Python, AI-assisted dev) e lavorare su prodotti dove il dato e l'automazione sono al centro. Questa opportunità combina entrambe le direzioni che sto sviluppando.

*Nota: risposta da calibrare in base al contesto del colloquio — mantienila forward-looking, non backward-critical.*

---

**"Dove ti vedi tra 3 anni?"**

> Voglio essere il punto di riferimento tecnico su architetture event-driven e AI-assisted engineering in un team dove l'ownership è reale. Non necessariamente un manager — ma la persona a cui il team porta i problemi architetturali complessi perché sa che riceve chiarezza, non burocrazia.

---

**"Cosa ti motiva in un progetto?"**

> La combinazione di complessità reale e impatto misurabile. Non mi interessa la difficoltà tecnica per se stessa — mi interessa quando la difficoltà tecnica è il vincolo che separa un sistema che funziona da uno che fallisce sotto pressione. Il momento in cui un sistema che hai progettato regge un on-sale con 50.000 utenti concorrenti senza degradare: quello è il feedback che mi motiva.

---

**"Come reagisci al feedback negativo su codice tuo?"**

> Il codice non è io. Cerco di rispondere con una domanda: "Cosa ti aspettavi invece e perché?" Non per difendermi — per capire se il mio ragionamento era sbagliato o se c'è un contesto che non avevo. Se il feedback è corretto, aggiorno e ringrazio esplicitamente: i feedback esatti e diretti sono rari e preziosi. Se il feedback è vago, lo faccio diventare specifico — "puoi indicarmi la riga o il pattern che ti preoccupa?" — prima di rispondere nel merito.

---

### Domande da fare all'HR

Queste domande segnalano che valuti la fit in entrambe le direzioni, non che accetti passivamente:

1. > "Come è strutturato il processo di onboarding per chi lavora su un cliente? C'è un periodo affiancato prima di operare autonomamente?"

2. > "Qual è il principale motivo per cui qualcuno ha lasciato un ruolo simile in AGM nell'ultimo anno, se lo sapete?"

3. > "Com'è gestito il feedback tra AGM e il cliente finale? Esiste un meccanismo strutturato o è informale?"

4. > "La certificazione Great Place To Work — su cosa si basa? Quali aspetti del lavoro quotidiano la riflettono concretamente?"

---

### Red flag da evitare nel colloquio HR

- Non criticare Eventim/TicketOne come azienda — il messaggio è sempre "sto cercando nuove sfide", non "sto scappando"
- Non usare gergo tecnico senza tradurre — l'HR non sa cosa è un circuit breaker, usa la metafora
- Non rispondere "non ho debolezze" alla domanda sui punti di miglioramento — scegli una debolezza reale su cui stai lavorando attivamente (es. "tendo a voler capire tutto prima di delegare — sto imparando a delegare anche con informazioni incomplete")
- Non essere monosillabico: ogni risposta deve avere una storia concreta, non una dichiarazione astratta

---

## 8. Checklist pre-colloquio

- [ ] Rileggere COMPETENZE_TECNICHE_AGM_FullStack.md — sezioni Kafka, MongoDB, Lakebase
- [ ] Preparare 2 esempi concreti di incident management + root cause analysis
- [ ] Preparare 1 esempio di codebase Python ben testato con coverage >90%
- [ ] Verificare LinkedIn AGM Solutions Italia per contesto aggiornato
- [ ] Preparare un mini-demo mentale del workflow agentic coding (Explore → Plan → Implement)
- [ ] Controllare se Lakebase ha documentazione pubblica aggiornata su databricks.com/product/lakebase
- [ ] Ripassare le 3 risposte STAR (ambiguità, conflitto tecnico, remote working)
- [ ] Preparare la risposta "perché lasci" — forward-looking, non backward-critical
- [ ] Scegliere la debolezza da dichiarare all'HR (reale + con piano di miglioramento attivo)

---

*Documento di preparazione colloquio — aggiornare con data/ora e feedback post-colloquio.*
