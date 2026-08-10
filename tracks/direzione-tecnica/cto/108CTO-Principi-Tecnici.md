---
title: "Principi Tecnici Fondamentali per il Fractional CTO"
subtitle: "Teoria e pratica — tutto cio' che devi padroneggiare prima di sederti al tavolo"
author: "Elios Scoglio"
track: "108-cto"
type: "studio-tecnico"
version: "1.0"
date: "2026-06-19"
brand: "108 Vision"
---

# Principi Tecnici Fondamentali per il Fractional CTO

**Studio tecnico completo — teoria e pratica operativa**

---

> Un Fractional CTO non scrive codice. Ma deve capirlo meglio di chi lo scrive. Deve vedere i pattern dove gli altri vedono file. Deve sentire il rischio dove gli altri vedono "funziona". Questo documento e' il tuo arsenale intellettuale.

---

## Indice

1. [Principi architetturali](#1-principi-architetturali)
2. [Design di sistema](#2-design-di-sistema)
3. [Qualita' del software](#3-qualita-del-software)
4. [Testing e affidabilita'](#4-testing-e-affidabilita)
5. [Delivery e CI/CD](#5-delivery-e-cicd)
6. [Osservabilita' e operativita'](#6-osservabilita-e-operativita)
7. [Sicurezza](#7-sicurezza)
8. [Dati e persistenza](#8-dati-e-persistenza)
9. [Scalabilita' e performance](#9-scalabilita-e-performance)
10. [Team e organizzazione tecnica](#10-team-e-organizzazione-tecnica)
11. [Debito tecnico](#11-debito-tecnico)
12. [AI Engineering](#12-ai-engineering)
13. [Decisioni e governance](#13-decisioni-e-governance)
14. [Costi e sostenibilita'](#14-costi-e-sostenibilita)
15. [Comunicazione tecnica](#15-comunicazione-tecnica)

---

## 1. Principi architetturali

### 1.1 L'architettura e' un insieme di trade-off, non di dogmi

Non esiste architettura "giusta". Esiste architettura **adatta al contesto**. La domanda corretta non e' "dovremmo fare microservizi?" ma:

- Quale problema specifico stiamo risolvendo?
- Quale qualita' vogliamo migliorare? (scalabilita', deployability, resilienza, sviluppo indipendente)
- Quale costo siamo disposti a pagare? (complessita' operativa, latenza di rete, consistenza eventuale)

**Principio:** ogni decisione architetturale e' un trade-off tra almeno due qualita' desiderabili. Un FCTO rende questi trade-off *espliciti* — non li nasconde dietro buzzword.

### 1.2 Fitness functions — principi verificabili

Un principio architetturale che non puo' essere verificato automaticamente tende a diventare decorazione. Le fitness functions lo rendono una regola viva.

**Esempi concreti:**

| Principio | Fitness function |
|-----------|-----------------|
| "I servizi devono essere indipendenti" | CI fallisce se un servizio importa codice da un altro |
| "La latenza P99 deve restare sotto 200ms" | Alert automatico se P99 > 200ms per 5 minuti |
| "Nessun accoppiamento su DB condiviso" | Static analysis che detecta query cross-schema |
| "Max 500 LOC per classe" | Linter rule in CI |

**Pratica:** il primo deliverable in un nuovo engagement e' spesso definire 3-5 fitness functions sui principi piu' violati. Non servono 50. Servono quelle che proteggono dove il team sta gia' sbagliando.

### 1.3 ADR — Architecture Decision Records

Un'architettura senza ADR diventa folklore. Dopo sei mesi nessuno ricorda piu' il "perche'".

**Formato minimo:**

```
# ADR-NNN: Titolo decisione

## Status: Accepted | Deprecated | Superseded by ADR-XXX
## Date: YYYY-MM-DD
## Context: Cosa stava succedendo che ha richiesto una decisione
## Decision: Cosa abbiamo deciso
## Consequences: Cosa cambia — positivo E negativo
```

**Quando scrivere un ADR:** qualsiasi decisione che:
- Non e' facilmente reversibile (< 1 giorno di lavoro per tornare indietro)
- Impatta piu' di un team/servizio
- Vincola scelte future

**Il FCTO non scrive tutti gli ADR.** Insegna al team a scriverli e ne revisiona i piu' critici.

### 1.4 Bounded Context — il concetto piu' importante del DDD

Non progettare sistemi partendo dalle tabelle. Progettali partendo dai **linguaggi del business**.

Un Bounded Context e' una zona dove una parola ha un significato preciso e coerente. "Ordine" significa una cosa in Sales, un'altra in Fulfillment, un'altra in Finance. Se provi a usare un unico modello "Ordine" per tutti, costruisci un monolite concettuale — anche se il deploy e' distribuito.

**Regola pratica:** se due team usano la stessa parola con significati diversi, hai trovato un confine. Quel confine deve essere rispettato nel codice (moduli separati, contratti espliciti, anticorruption layer).

### 1.5 Conway's Law — prima di cambiare architettura, cambia la comunicazione

> "Le organizzazioni che progettano sistemi sono vincolate a produrre architetture che replicano la struttura di comunicazione dell'organizzazione." — Melvin Conway, 1967

**Implicazione pratica:** se vuoi microservizi ma hai un unico team che comunica su tutto → otterrai un distributed monolith. Se vuoi un monolite modulare ma hai team isolati che non si parlano → otterrai moduli disconnessi.

**Il FCTO opera su entrambi i livelli:** influenza la struttura organizzativa E l'architettura del sistema. Uno senza l'altro non funziona.

### 1.6 Modular Monolith — la strategia che nessuno considera

Un monolite modulare ben governato e' **spesso piu' moderno** di microservizi accoppiati male.

**Quando preferire un modular monolith:**
- Team < 10 developer
- Dominio non ancora stabilizzato (i confini cambieranno)
- Non c'e' necessita' di deploy indipendente
- Non c'e' competenza operativa per gestire sistemi distribuiti

**Quando estrarre microservizi:**
- Il confine esiste GIA' nel codice, nel dominio, nei dati E nel team
- Serve scalare indipendentemente un componente specifico
- Serve deployare indipendentemente (team diversi, cadenze diverse)
- Il costo operativo dei microservizi e' sostenibile

**Regola:** non estrarre un microservizio finche' non hai dimostrato che il confine esiste gia'.

---

## 2. Design di sistema

### 2.1 I 4 principi del design distribuito

**Principio 1 — Ogni chiamata remota fallira'.**
Non e' questione di "se" ma di "quando". Mai progettare un flusso critico assumendo che il provider esterno risponda subito e correttamente.

**Principio 2 — L'idempotenza e' un salvavita.**
Ogni operazione critica soggetta a retry deve essere idempotente: chiamarla 1 volta o 5 volte produce lo stesso risultato. L'alternativa e' corruzione dati, doppi pagamenti, inconsistenza.

**Principio 3 — Preferisci asincrono dove possibile.**
Le operazioni sincrone bloccanti sono il nemico della scalabilita'. Se una risposta non serve *immediatamente* all'utente, mettila su una coda.

**Principio 4 — Il fallback non e' opzionale.**
Cosa succede quando il servizio X e' down? Se la risposta e' "tutto si blocca", hai un single point of failure.

### 2.2 Pattern di resilienza — il trio fondamentale

| Pattern | Cosa risolve | Come funziona |
|---------|-------------|---------------|
| **Timeout** | Attese infinite | Limita il tempo massimo di ogni chiamata esterna |
| **Retry con exponential backoff** | Errori transienti | Riprova con pause crescenti (1s, 2s, 4s...) |
| **Circuit Breaker** | Cascade failure | Dopo N errori, smette di chiamare per un periodo |

**Ordine di composizione:** Bulkhead → Timeout → Retry → Circuit Breaker (dal piu' esterno al piu' interno).

**Regola FCTO:** se un team non ha almeno Timeout + Circuit Breaker su ogni chiamata esterna, la prima domanda e' *perche' no* — non *come aggiungerlo*.

### 2.3 CAP Theorem — capirlo davvero

In un sistema distribuito puoi avere al massimo 2 di questi 3:
- **Consistency:** ogni lettura restituisce il dato piu' recente
- **Availability:** ogni richiesta riceve una risposta
- **Partition tolerance:** il sistema funziona anche se la rete si partiziona

**In pratica** la rete SI partiziona sempre (Partition tolerance non e' opzionale). Quindi la scelta reale e' tra CP (consistenza forte, possibili timeout) e AP (sempre disponibile, possibile stale data).

**Per il FCTO:** la domanda da fare al team e' "cosa succede quando il DB secondario e' 3 secondi indietro? Il business lo tollera?"

### 2.4 Event-Driven Architecture — quando ha senso

**Usa eventi quando:**
- L'emittente non ha bisogno di sapere chi ascolta
- L'ordine esatto non e' critico (o puoi garantirlo per partizione)
- Vuoi disaccoppiare team che rilasciano a cadenze diverse
- Il dominio ha una semantica naturalmente temporale ("e' successo X")

**NON usare eventi quando:**
- Serve una risposta sincrona immediata
- La logica richiede orchestrazione stretta (usa saga/orchestrator)
- Il team non ha esperienza con sistemi eventually consistent
- Non hai osservabilita' sulle code (dead letter, lag, replay)

### 2.5 API Design — principi non negoziabili

- **API-First:** il contratto si progetta PRIMA del codice. OpenAPI spec reviewata prima di implementare.
- **Versioning esplicito:** major version nel path (`/v1/`, `/v2/`). Mai breaking change senza nuova versione.
- **Error format standard:** RFC 7807 (`application/problem+json`). Mai errori generici.
- **Nessun PII in URL:** path e query param finiscono nei log, nei CDN, nei browser history.
- **Paginazione server-driven:** il client non decide quanti record vedere (DoS vector).

---

## 3. Qualita' del software

### 3.1 SOLID — i principi che contano davvero

Non serve recitare l'acronimo. Servono i due che impattano piu':

**SRP (Single Responsibility Principle):**
Una classe/modulo cambia per un solo motivo. Se devi modificare lo stesso file per feature diverse, hai SRP violato.

**Test pratico:** prova a descrivere cosa fa la classe in una frase SENZA usare "e" o "oppure". Se non riesci, ha troppe responsabilita'.

**DIP (Dependency Inversion Principle):**
Le classi di business dipendono da interfacce, mai da implementazioni concrete.

**Perche' conta:** se il repository SQL e' hard-coded nella business logic, non puoi testare senza DB, non puoi cambiare DB, non puoi mockare. Il DIP e' il prerequisito della testabilita'.

### 3.2 Clean Architecture — il concetto, non il dogma

Il nucleo: **le dipendenze puntano verso l'interno**. La business logic non sa nulla del framework, del database, dell'HTTP. Sa solo del dominio.

```
┌────────────────────────────────────────────┐
│  Frameworks / Drivers (HTTP, DB, UI)       │  ← cambia spesso
├────────────────────────────────────────────┤
│  Interface Adapters (Controllers, Repos)   │
├────────────────────────────────────────────┤
│  Use Cases / Application Logic             │
├────────────────────────────────────────────┤
│  Entities / Domain Logic                   │  ← cambia raramente
└────────────────────────────────────────────┘
```

**Per il FCTO:** non imporre Clean Architecture ovunque. Ma se il team non riesce a testare la business logic senza avviare l'intero framework → la direzione delle dipendenze e' invertita, e quello e' il problema da risolvere.

### 3.3 Coupling e Cohesion

**Alto accoppiamento:** un cambiamento in A richiede cambiamenti in B, C, D. Costo elevato per ogni modifica.

**Bassa coesione:** un modulo fa tante cose non correlate. Difficile da capire, testare, evolvere.

**L'obiettivo:** basso coupling tra moduli, alta coesione dentro il modulo.

**Red flag per il FCTO:** se ogni feature tocca 8+ file in 4+ directory, l'accoppiamento e' fuori controllo.

### 3.4 KISS e YAGNI — nemici dell'over-engineering

**KISS (Keep It Simple, Stupid):** la soluzione piu' semplice che soddisfa i requisiti ATTUALI.

**YAGNI (You Ain't Gonna Need It):** non costruire per requisiti futuri ipotizzati. Il costo di una astrazione prematura e' piu' alto del costo di un refactoring mirato quando serve davvero.

**Pratica FCTO:** quando il team propone "costruiamo un framework generico per...", la risposta e' "quale problema SPECIFICO risolvete oggi?" Se la risposta e' "potremmo aver bisogno in futuro" → YAGNI.

---

## 4. Testing e affidabilita'

### 4.1 La piramide dei test — e perche' molti la invertono

```
         /\
        /  \       E2E (pochi, stabili, business-critical)
       /    \
      /------\     Integration (medi, testano confini reali)
     /        \
    /----------\   Unit (molti, veloci, logica di dominio)
   /            \
  /--------------\ Contratti (obbligatori tra team indipendenti)
```

**Errore comune:** team che hanno 500 unit test su getter/setter e zero integration test sulla comunicazione con il DB. Coverage alto, fiducia zero.

### 4.2 Principi fondamentali

**Coverage alto ≠ fiducia alta.**
Il coverage misura quanto codice e' stato *eseguito*, non quanta fiducia hai costruito. Un test che esegue il codice ma non verifica il risultato ha coverage 100% e valore 0.

**Testa il comportamento, non l'implementazione.**
Se il test si rompe quando refactorizzi senza cambiare comportamento → il test e' accoppiato all'implementazione. Mockare troppo produce questo.

**Integration test > unit test superficiali in sistemi business-critical.**
Un integration test che verifica l'intero flusso ordine→pagamento→conferma vale piu' di 50 unit test su singoli metodi.

**Contract test obbligatori se team diversi rilasciano indipendentemente.**
Altrimenti scopri l'incompatibilita' solo in staging. O peggio, in produzione.

### 4.3 Testabilita' come proprieta' architetturale

Se testare una logica e' difficile, spesso la logica e' **nel posto sbagliato**. Non e' un problema di test — e' un problema di architettura.

**Esempio:** logica di pricing dentro il controller HTTP? Per testarla devi simulare una request completa. Logica di pricing in un domain service con DIP? Basta passare i dati.

**Il FCTO verifica:** "posso testare questa logica senza avviare l'intero sistema?" Se la risposta e' no, c'e' un problema strutturale.

### 4.4 TDD — quando ha senso

TDD non e' dogma. E' utile quando:
- La logica e' complessa e non ovvia
- Vuoi un design migliore (TDD forza interfacce pulite)
- Stai lavorando su codice critico (pagamenti, compliance)

Non serve per:
- CRUD semplice
- Glue code
- Prototipi usa-e-getta

---

## 5. Delivery e CI/CD

### 5.1 Il principio fondamentale

> Deploy e' un evento tecnico noioso. Release e' una decisione di prodotto.

Separare deploy da release significa poter deployare codice in produzione SENZA che sia visibile agli utenti (feature flags, canary, dark launch). Questo riduce il rischio a quasi zero.

### 5.2 Pipeline ideale

```
Commit → Lint → Test → Build → Security Scan → Deploy Staging → Deploy Prod
   │                                                       │
   └── Feedback in < 10 minuti ─────────────────────────────┘
```

**Il tempo di feedback e' tutto.** Una pipeline che impiega 45 minuti educa il team ad aggirarla. Una pipeline che impiega 8 minuti educa il team a fidarsi.

### 5.3 Principi non negoziabili

- **Trunk-based development (o short-lived branches):** branch che durano piu' di 3 giorni sono debito.
- **Green build = deployable.** Se il main non e' sempre deployable, hai un problema fondamentale.
- **Niente deploy manuali.** Se un deploy richiede SSH e comandi a mano → fallira' nel momento peggiore.
- **Rollback < 5 minuti.** Se non puoi tornare indietro rapidamente, non puoi deployare frequentemente.
- **Scansioni automatiche:** SAST, dependency vulnerabilities, secret detection — tutto in CI, non come afterthought.

### 5.4 Feature Flags

Permettono di:
- Deployare codice incompleto (sempre green, mai branch lunghi)
- Rilasciare gradualmente (1% → 10% → 50% → 100%)
- Kill switch istantaneo senza rollback
- A/B testing senza infrastruttura dedicata

**Attenzione:** i feature flag devono avere una data di scadenza. Flag dimenticati diventano debito.

---

## 6. Osservabilita' e operativita'

### 6.1 Il principio

In produzione non hai il debugger. Log, metriche e trace sono i tuoi **unici strumenti reali**.

### 6.2 I tre pilastri

| Pilastro | Risponde a | Tool tipici |
|----------|-----------|-------------|
| **Log** | "Cosa e' successo?" | ELK, Loki, CloudWatch |
| **Metriche** | "Come sta andando?" | Prometheus, Datadog, Grafana |
| **Trace** | "Dove e' il bottleneck?" | Jaeger, Tempo, X-Ray |

### 6.3 Golden Signals (Google SRE)

Ogni servizio deve esporre almeno questi 4:

| Signal | Misura | Alert se |
|--------|--------|----------|
| **Latency** | Tempo di risposta (P50, P95, P99) | P99 > SLO per 5 min |
| **Traffic** | Request rate | Drop improvviso > 50% |
| **Errors** | % risposte 5xx | Error rate > 1% |
| **Saturation** | CPU, memoria, connessioni DB | > 80% per 10 min |

### 6.4 Principi di logging

- **JSON strutturato su stdout.** Non file, non syslog, non formati custom.
- **Livello WARN/ERROR in produzione.** DEBUG solo in dev.
- **Mai PII nei log.** Email, nomi, numeri carta → MAI. Solo ID entita'.
- **Correlation ID obbligatorio.** Ogni richiesta ha un trace_id che la segue attraverso tutti i servizi.
- **Log il perche', non il cosa.** "Payment failed: insufficient_funds for order 12345" >> "Error in processPayment()"

### 6.5 SLA / SLO / SLI

| Concetto | Significato | Esempio |
|----------|------------|---------|
| **SLI** (Indicator) | Metrica misurata | Latenza P99 del checkout |
| **SLO** (Objective) | Target interno | P99 < 500ms per il 99.5% del tempo |
| **SLA** (Agreement) | Promessa contrattuale al cliente | 99.9% uptime mensile |

**Regola FCTO:** definisci gli SLO PRIMA di un incidente. Dopo e' troppo tardi — le decisioni vengono prese in emergenza.

---

## 7. Sicurezza

### 7.1 Security by Design — i principi operativi

Non aggiungere sicurezza alla fine. Progettala dall'inizio. I principi chiave:

**Least Privilege:** ogni componente ha solo i permessi minimi necessari. Un servizio che legge ordini non ha accesso ai dati di pagamento.

**Defense in Depth:** non affidarti a un singolo layer di difesa. Firewall + autenticazione + autorizzazione + validazione input + encryption.

**Zero Trust:** non fidarti di nessuna rete, nessun servizio, nessun utente per default. Verifica sempre, anche all'interno del perimetro.

**Fail Secure:** quando qualcosa va storto, il default e' negare accesso — non concederlo.

### 7.2 OWASP Top 10 — la checklist minima

| # | Vulnerabilita' | Contromisura |
|---|---------------|-------------|
| 1 | Broken Access Control | RBAC/ABAC, test autorizzazione su ogni endpoint |
| 2 | Cryptographic Failures | TLS everywhere, hash password con bcrypt/argon2 |
| 3 | Injection (SQL, NoSQL, OS) | Prepared statements, ORM, input validation |
| 4 | Insecure Design | Threat modeling, abuse cases |
| 5 | Security Misconfiguration | Hardening automatizzato, no default credentials |
| 6 | Vulnerable Components | Dependency scanning in CI (Snyk, Trivy) |
| 7 | Auth/Identity Failures | MFA, session timeout, rate limiting su login |
| 8 | Integrity Failures | Signed artifacts, verify provenance |
| 9 | Logging/Monitoring Failures | Log di sicurezza, alerting su anomalie |
| 10 | SSRF | Whitelist URL, no user-controlled redirects |

### 7.3 Per il FCTO

Non devi essere un security expert. Devi assicurarti che:
1. Il team faccia threat modeling su feature critiche
2. La CI includa SAST + dependency scanning + secret detection
3. Esista un processo di incident response documentato
4. Le credenziali non siano nel codice, nei log, o nelle variabili d'ambiente del laptop

---

## 8. Dati e persistenza

### 8.1 Scelta del database — framework decisionale

| Criterio | SQL (PostgreSQL) | Document (MongoDB) | Key-Value (Redis) | Graph (Neo4j) |
|----------|-----------------|-------------------|-------------------|---------------|
| Schema fisso, relazioni complesse | ✓✓✓ | ✗ | ✗ | ✓ (relazioni) |
| Schema flessibile, evoluzione rapida | ✓ | ✓✓✓ | ✗ | ✓ |
| Read-heavy, bassa latenza | ✓ | ✓ | ✓✓✓ | ✓ |
| Transazioni ACID obbligatorie | ✓✓✓ | ✓ (limitato) | ✗ | ✓ |
| Navigazione relazioni N-hop | ✗ (JOIN costosi) | ✗ | ✗ | ✓✓✓ |

**Regola:** se non hai un motivo specifico per un DB diverso, parti con PostgreSQL. E' il default ragionevole per il 90% dei casi PMI.

### 8.2 Migrazioni

- **Versionare sempre** lo schema. Mai modificare in produzione a mano.
- **Forward-only:** le migrazioni non si rollbackano (si scrivono migrazioni inverse dedicate se serve).
- **Backward-compatible:** una migrazione non deve rompere la versione precedente dell'applicazione (deploy blue/green).
- **Separare schema change da data migration:** DDL veloce in un deploy, DML pesante in un batch separato.

### 8.3 N+1 e performance

Il killer silenzioso delle performance:

```
# N+1 problem:
ordini = db.query("SELECT * FROM orders LIMIT 100")
for ordine in ordini:
    items = db.query(f"SELECT * FROM items WHERE order_id = {ordine.id}")  # 100 query!
```

**Fix:** `JOIN` o eager loading. Sempre. Il FCTO verifica che i log mostrino il numero di query per request — se > 10, c'e' un N+1 nascosto.

---

## 9. Scalabilita' e performance

### 9.1 Scalabilita' orizzontale vs verticale

| Tipo | Cosa fai | Quando |
|------|---------|--------|
| **Verticale** | Server piu' grosso (piu' CPU/RAM) | Prima opzione, semplice, ha un tetto |
| **Orizzontale** | Piu' istanze dello stesso servizio | Quando il verticale non basta, richiede statelessness |

**Regola:** scala verticalmente finche' costa meno dell'engineering per scalare orizzontalmente. Per una PMI con 1000 utenti, un server piu' grosso costa 50€/mese in piu'. L'engineering per lo scale-out costa settimane.

### 9.2 Caching — la leva piu' potente

| Layer | Dove | Cosa cachare | Invalidazione |
|-------|------|-------------|---------------|
| Browser | Client | Asset statici, API response | Cache-Control headers |
| CDN | Edge | HTML, immagini, API read-only | TTL + purge manuale |
| Application | Server | Risultati query, session, computazioni | TTL + evento di invalidazione |
| Database | Query cache | Query frequenti identiche | Automatica (write invalida) |

**Regola 80/20:** il 20% delle query genera l'80% del traffico. Cachare quelle riduce il carico del 60-80%.

**Attenzione:** la cache e' la causa #1 di bug in produzione ("perche' mostra il dato vecchio?"). Ogni cache deve avere una strategia di invalidazione chiara.

### 9.3 Load testing — prima del lancio, non dopo

**Minimum viable load test:**
1. Identifica il picco atteso (es. 500 utenti concorrenti)
2. Testa a 2x quel carico (1000 concorrenti)
3. Misura: latency P99, error rate, CPU/RAM
4. Se P99 > SLO al 2x → hai un problema da risolvere PRIMA del lancio

**Tool:** k6, Gatling, Locust. Non serve niente di costoso.

---

## 10. Team e organizzazione tecnica

### 10.1 Team Topologies — i 4 tipi fondamentali

| Tipo | Responsabilita' | Esempio |
|------|----------------|---------|
| **Stream-aligned** | Delivera valore al business direttamente | Team Checkout, Team Search |
| **Enabling** | Aiuta altri team a migliorare | Team DevOps, Team Architecture |
| **Platform** | Fornisce servizi self-service | Team Infrastruttura, Team Auth |
| **Complicated subsystem** | Gestisce complessita' specifica | Team ML, Team Payments |

**Per il FCTO:** la struttura dei team DEVE seguire l'architettura (Conway's Law inverso). Se vuoi 3 microservizi indipendenti, hai bisogno di 3 team indipendenti.

### 10.2 Cognitive Load — la metrica invisibile

Il team ha una **capacita' cognitiva finita**. Se il sistema e' troppo complesso per essere tenuto in testa, la qualita' crolla — indipendentemente dalla bravura individuale.

**Segnali di sovraccarico:**
- Il team chiede continuamente "chi sa come funziona X?"
- Le code review prendono giorni perche' nessuno capisce il contesto
- I nuovi arrivati impiegano mesi per essere autonomi
- Bug ricorrenti nelle stesse aree ("nessuno tocca quel modulo")

**Contromisura:** semplifica il sistema, non aggiungere documentazione. La documentazione compensa; la semplificazione risolve.

### 10.3 Developer Experience (DX)

La produttivita' del team dipende dalla frizione quotidiana:

| Frizione | Impatto | Fix |
|----------|---------|-----|
| Setup locale > 30 min | Ogni nuovo dev perde mezza giornata | Docker compose / devcontainer |
| CI/CD > 20 min | Team evita di committare spesso | Parallelizza, cache aggressiva |
| Code review > 48h | Branch si accumulano, merge hell | Regola: review entro 4 ore lavorative |
| Deploy manuale | Paura di rilasciare | Automatizza al 100% |
| Nessun ambiente di test stabile | Si testa in produzione | Staging automatico per PR |

### 10.4 Hiring tecnico — i principi del FCTO

- **Non assumere per skills attuali.** Assumi per capacita' di apprendere e cultura.
- **Il miglior predictor di performance futura e' performance passata.** Reference check > whiteboard interview.
- **Trial period strutturato.** Obiettivi chiari a 30/60/90 giorni, valutati formalmente.
- **Diversity non e' PR.** Team omogenei producono soluzioni omogenee (blind spot).

---

## 11. Debito tecnico

### 11.1 Non tutto il debito e' uguale

| Tipo | Causa | Strategia |
|------|-------|-----------|
| **Deliberato-prudente** | "Sappiamo di tagliare qui, rilasciamo e sistemiamo nel prossimo sprint" | Accettabile. Traccia e ripaga entro 2 sprint |
| **Deliberato-imprudente** | "Non abbiamo tempo per i test" | Pericoloso. Il costo cresce esponenzialmente |
| **Inavvertito-prudente** | "Ora che abbiamo capito il dominio, faremmo diversamente" | Naturale. Refactoring progressivo |
| **Inavvertito-imprudente** | "Non sapevamo che fosse un problema" | Il piu' costoso. Richiede formazione del team |

### 11.2 Il quadrante del debito (Martin Fowler)

```
              Deliberato          Inavvertito
           ┌────────────────┬────────────────┐
  Prudente │ "Sappiamo, lo  │ "Ora sappiamo  │
           │  facciamo dopo"│  come farlo    │
           │                │  meglio"       │
           ├────────────────┼────────────────┤
Imprudente │ "Non abbiamo   │ "Cos'e' il     │
           │  tempo per X"  │  layering?"    │
           └────────────────┴────────────────┘
```

### 11.3 Gestione pratica del debito

**Regola del 15%:** riserva il 15% della capacita' di ogni sprint al debito tecnico. Non e' negoziabile — e' manutenzione, come cambiare l'olio della macchina.

**Come prioritizzare:**
1. **Debito che blocca feature** → risolvi subito (e' gia' nel critical path)
2. **Debito in codice modificato spesso** → alto ROI (meno frizione ad ogni modifica)
3. **Debito in codice stabile** → lascia stare (non giustifica il rischio del refactoring)

**Come comunicarlo al business:**
Non dire "abbiamo debito tecnico". Di' "se non facciamo questa manutenzione, la prossima feature costera' 3x e avra' il 40% di rischio di incidente".

---

## 12. AI Engineering

### 12.1 AI come sistema, non come demo

Una demo AI mostra possibilita'. Un sistema AI produttivo gestisce i **fallimenti**. La differenza:

| Aspetto | Demo | Produzione |
|---------|------|-----------|
| Input | Pulito, preparato | Rumoroso, imprevedibile |
| Output validation | "Sembra giusto" | Schema enforcement + guardrail |
| Fallback | Non esiste | Obbligatorio |
| Costo | Irrilevante | Critico (10x il budget se non controllato) |
| Evaluation | "Provalo tu" | Golden dataset + metriche automatiche |
| Privacy | Non considerata | GDPR, no PII nel prompt |

### 12.2 Principi non negoziabili

**Evaluation prima dell'entusiasmo.** Senza evaluation, non sai se hai un sistema AI o una slot machine elegante. Golden dataset obbligatorio PRIMA della produzione.

**Cost routing.** Non usare il modello piu' potente per ogni task. Il 90% dei task funziona con modelli 10x piu' economici.

| Tier | Uso | Costo relativo |
|------|-----|---------------|
| Haiku/Mini | Classificazione, routing, tool call semplici | 1x |
| Sonnet/Medium | Generazione, analisi, coding | 10x |
| Opus/Large | Decisioni architetturali, ragionamento complesso | 50x |

**RAG: retrieval prima di generazione.** Non aggiungere testo infinito al prompt sperando che il modello capisca. Recupera il contesto rilevante con precisione.

**Human-in-the-loop per decisioni ad alto rischio.** L'AI raccomanda, l'umano decide. Mai delegare decisioni irreversibili senza supervisione.

### 12.3 Rischi specifici AI

- **Prompt injection:** input utente che manipola il comportamento del sistema
- **Data leakage:** il modello rivela dati del training o del contesto
- **Hallucination:** output plausibile ma falso, presentato con sicurezza
- **Cost explosion:** loop infiniti, retry senza backoff, modello sbagliato
- **Over-trust:** il team si fida dell'output AI senza validazione

---

## 13. Decisioni e governance

### 13.1 Il framework per decidere

```
       Reversibile          Irreversibile
   ┌─────────────────┬─────────────────────┐
   │                 │                     │
B  │   DECIDI ORA    │   DOCUMENTA (ADR)   │
a  │   e itera       │   + DECIDI CON DATI │
s  │                 │                     │
s  ├─────────────────┼─────────────────────┤
o  │                 │                     │
   │   DECIDI ORA    │   DECIDI CON       │
A  │   delega al     │   CONSULTO +       │
l  │   team          │   CONFERMA CEO     │
t  │                 │                     │
o  └─────────────────┴─────────────────────┘
       ← Impatto basso    Impatto alto →
```

### 13.2 Decisioni reversibili vs irreversibili

**Reversibili (Type 2 — Jeff Bezos):**
- Scelta di un library/framework interno
- Formato dei log
- Struttura delle directory
- Tool di CI/CD

→ Decidi rapidamente. Se sbagli, cambi in 1-2 sprint.

**Irreversibili (Type 1):**
- Scelta del database primario
- Linguaggio di programmazione principale
- Architettura (monolith vs microservices)
- Contratti API verso l'esterno
- Provider cloud

→ Analisi strutturata, ADR, confronto con stakeholder.

### 13.3 Come il FCTO governa

1. **Non decide tutto.** Decide le Type 1 e delega le Type 2 al team.
2. **Crea framework decisionali.** Il team sa COME decidere anche quando il FCTO non c'e'.
3. **Documenta.** ADR per le irreversibili. Meeting notes per le reversibili significative.
4. **Revisiona.** Ogni quarter, revoca le decisioni che non funzionano piu'.

---

## 14. Costi e sostenibilita'

### 14.1 Il vero costo del software

| Voce | % del TCO totale | Note |
|------|-----------------|------|
| Sviluppo iniziale | 20-30% | Il costo piu' visibile ma meno rilevante |
| Manutenzione e evoluzione | 50-60% | Dove si spende davvero |
| Infrastruttura | 10-20% | Cloud, licenze, tool |
| Incidenti e down | 5-15% | Costo invisibile finche' non succede |

**Implicazione:** ottimizzare il costo di sviluppo iniziale a scapito della manutenibilita' e' la decisione piu' costosa possibile.

### 14.2 Build vs Buy — framework decisionale

| Criterio | Build | Buy |
|----------|-------|-----|
| Core differenziante del business | ✓ | ✗ |
| Problema generico gia' risolto | ✗ | ✓ |
| Team ha competenza specifica | ✓ | ✗ |
| Time-to-market critico | ✗ | ✓ |
| Personalizzazione estrema richiesta | ✓ | ✗ |
| Budget limitato per maintenance | ✗ | ✓ |

**Regola FCTO:** Build il core domain. Buy tutto il resto. L'ego tecnico del team non e' un criterio valido.

### 14.3 FinOps — governare i costi cloud

- **Tag everything:** ogni risorsa ha un tag team/progetto/ambiente
- **Budget alert:** notifica al 50%, 80%, 100% del budget mensile
- **Right-sizing mensile:** il 30-50% delle istanze cloud e' oversized
- **Spot/preemptible per workload non-critico:** 60-90% di risparmio
- **Reserved instances per carico stabile:** 30-60% di risparmio

---

## 15. Comunicazione tecnica

### 15.1 Tradurre per il business

Il FCTO e' un **traduttore**. Il business non capisce "latenza P99" ma capisce "i clienti aspettano troppo". Le conversioni:

| Tecnico | Business |
|---------|---------|
| Debito tecnico | "Le modifiche costano il doppio e hanno piu' rischio di bug" |
| Microservizi | "Ogni team rilascia indipendentemente senza aspettare gli altri" |
| Test automatizzati | "Sappiamo in 8 minuti se un cambiamento rompe qualcosa" |
| CI/CD | "Rilasciamo in 20 minuti senza rischio, non in 2 giorni con paura" |
| Observability | "Quando qualcosa va storto, lo sappiamo in 30 secondi" |
| Scalabilita' orizzontale | "Se i clienti raddoppiano, il sistema regge senza intervento umano" |
| Feature flag | "Possiamo accendere/spegnere una funzione istantaneamente senza rilascio" |

### 15.2 Report al CEO — formato mensile

```
## Stato Tecnico — [Mese Anno]

### Health Score: 7/10 (era 6/10)

### Cosa e' migliorato
- [1-2 punti concreti con metriche]

### Cosa e' peggiorato / rischi emergenti
- [1-2 punti con impatto business stimato]

### Decisioni che richiedono input business
- [Decisione]: [Opzione A] vs [Opzione B]
  - A: costo X, tempo Y, rischio Z
  - B: costo X', tempo Y', rischio Z'
  - Raccomandazione: [A/B perche'...]

### Prossimo mese
- [2-3 priorita' tecniche allineate a obiettivi business]
```

### 15.3 Le 3 regole della comunicazione FCTO

1. **Mai sorprese.** Il CEO non deve scoprire un problema tecnico da un'email di un cliente. Comunica PRIMA.
2. **Sempre opzioni.** Non portare problemi senza almeno 2 soluzioni con trade-off.
3. **Quantifica.** "E' un problema" non serve. "Costa 30K/anno in velocity persa" si'.

---

## Appendice — Fonti e approfondimenti

| Libro | Concetti chiave |
|-------|----------------|
| *Fundamentals of Software Architecture* (Richards, Ford) | Fitness functions, architecture characteristics, trade-off analysis |
| *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani) | Decomposition, data mesh, saga patterns |
| *Building Microservices* (Newman) | Bounded context, service boundaries, migration patterns |
| *Team Topologies* (Skelton, Pais) | Cognitive load, 4 team types, interaction modes |
| *Accelerate* (Forsgren, Humble, Kim) | DORA metrics, elite teams, deployment frequency |
| *The Phoenix Project* (Kim) | DevOps mindset, three ways, bottleneck theory |
| *Designing Data-Intensive Applications* (Kleppmann) | CAP, consistency, replication, partitioning |
| *Clean Architecture* (Martin) | Dependency rule, use cases, boundaries |
| *Domain-Driven Design* (Evans) | Bounded context, ubiquitous language, aggregates |
| *The Manager's Path* (Fournier) | Tech lead → CTO progression, 1-1s, feedback |
| *An Elegant Puzzle* (Larson) | Engineering management, organizational design |
| *Staff Engineer* (Larson) | Technical leadership without management |
| *AI Engineering* (Huyen) | LLM systems, evaluation, RAG, agents |

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
