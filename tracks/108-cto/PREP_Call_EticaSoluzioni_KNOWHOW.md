# Know-How Completo — Fractional CTO

**Scopo**: Documento di riferimento per la call con Etica Soluzioni. Tutto quello che devi sapere per rispondere a qualsiasi domanda con autorita e profondita.  
**Struttura**: Dai principi fondamentali ai dettagli operativi.  
**Come usarlo**: Leggilo prima della call. Non devi ripetere tutto — e il tuo "arsenale mentale" da cui pescare quando la conversazione lo richiede.

---

## LIVELLO 1 — PRINCIPI FONDAMENTALI

### 1.1 Cos'e un Fractional CTO

Un **Chief Technology Officer a tempo parziale** (tipicamente 2-12 giorni/mese) che porta la stessa visione strategica, leadership tecnica e responsabilita decisionale di un CTO full-time — senza il costo di un'assunzione senior permanente.

**"Fractional" = frazionato nel tempo, non nella qualita.**

Non e:
- Un consulente che scrive un report e sparisce
- Un senior developer "economico"
- Un project manager
- Un babysitter per il team

E:
- Un leader tecnico che si siede al tavolo delle decisioni
- Una guida strategica con responsabilita continuativa
- Un ponte tra business e tecnologia
- Un acceleratore di maturita tecnica organizzativa

### 1.2 Il Principio di Direzione

> "Il valore non e nel codice scritto — e nella capacita di vedere dove andare."

Un FCTO non produce righe di codice. Produce **decisioni corrette**. Una singola decisione architetturale giusta vale piu di 10.000 righe di codice scritte in fretta nella direzione sbagliata.

**Esempio concreto**: scegliere se il modulo X deve essere un microservizio o restare nel monolite. Se sbagli, paghi 6-12 mesi di rework. Se indovini, il team e produttivo per anni.

### 1.3 Perche il Modello Fractional Funziona

| Modello tradizionale | Modello Fractional |
|---------------------|-------------------|
| CTO full-time: 120-180K EUR/anno + benefit | FCTO: 40-100K EUR/anno |
| Rischio hiring: 6 mesi per capire se funziona | Trial di 3 mesi, zero rischio |
| Prospettiva interna (rischio "boiled frog") | Prospettiva esterna + interna |
| Un settore, una azienda | Multi-settore = cross-pollination |
| Se esce, panico | Exit pianificato = successo |

**L'argomento economico killer:**
Un CTO senior in Italia costa all'azienda 160.000-220.000 EUR/anno (RAL + contributi + benefit). Con un FCTO Standard (2 gg/settimana), il costo e ~85.000-100.000 EUR/anno — circa il 50% — per la stessa seniority nelle ore che contano davvero.

### 1.4 Chi ha Bisogno di un FCTO

**5 profili ideali:**

1. **PMI tech in crescita** (10-50 dipendenti) — team cresciuto, manca governance
2. **Azienda con prodotto stabile ma debito tecnico** — funziona ma rallenta
3. **Azienda senza CTO** — il "dev senior" decide tutto, nessuno pensa alla strategia
4. **Azienda in transizione** — da prodotto custom a piattaforma, da on-prem a cloud
5. **Bridge** — stanno cercando un CTO, serve qualcuno nel frattempo (6-12 mesi)

**Etica Soluzioni e probabilmente un mix di 1+3**: 15 anni di prodotto, team stabile, cercano ora un "Direttore Tecnico" = probabilmente il fondatore tecnico sta uscendo o il team e cresciuto senza governance strutturata.

---

## LIVELLO 2 — IL MODELLO OPERATIVO

### 2.1 Le 4 Responsabilita del FCTO

| Responsabilita | Cosa fai concretamente |
|----------------|----------------------|
| **1. Strategy** | Roadmap tecnica, decisioni architetturali, allineamento business-tech |
| **2. Architecture** | Review design, ADR, standard tecnici, debito tecnico, scelte build/buy |
| **3. Team** | Hiring, 1:1, mentoring, cultura ingegneristica, performance |
| **4. Stakeholder** | CEO sync, report mensile, comunicazione tecnica al board/clienti |

**Cosa NON fai (mai):**
- Scrivere codice di produzione
- Gestire ticket/sprint/backlog quotidianamente
- Fare il PM del team
- "Risolvere i bug difficili"

### 2.2 I Deliverable Mensili (cosa il cliente riceve)

Ogni mese il cliente ha:

1. **Report Mensile** (1-2 pagine) — cosa e stato fatto, decisioni prese, stato roadmap, rischi
2. **Roadmap Tecnica Aggiornata** — documento vivo con stato iniziative
3. **ADR** — Architecture Decision Records per ogni scelta significativa
4. **Team 1:1** — almeno 2 sessioni con lead/senior
5. **CEO/Board Sync** — 30-60 min: stato tecnico, rischi, decisioni da prendere
6. **Metriche** — deployment frequency, lead time, bug rate, team satisfaction

### 2.3 Il Ritmo Settimanale (per 2 gg/settimana)

**Giorno 1 — Governance + Team**
| Ora | Attivita |
|-----|----------|
| 09:00-09:30 | Standup tecnico col team |
| 09:30-10:30 | 1:1 con Tech Lead / senior |
| 10:30-12:30 | Review PR critiche / decisioni architetturali pendenti |
| 14:00-15:30 | Sessione lavoro su iniziativa prioritaria |
| 15:30-16:00 | Comunicazione scritta CEO (stato + next) |

**Giorno 2 — Strategia + Stakeholder**
| Ora | Attivita |
|-----|----------|
| 09:00-10:30 | CEO/CPO sync (bisettimanale) |
| 10:30-12:00 | Revisione metriche + roadmap update |
| 14:00-15:30 | 1:1 con 2 developer |
| 15:30-16:30 | Documentazione decisioni (ADR) |
| 16:30-17:00 | Report/pianificazione prossima settimana |

**Nei giorni in cui NON sei presente:**
- Canale async dedicato (Slack/Teams) — risposta entro 4h in giornata lavorativa
- Urgenze vere (sistema down, vulnerabilita critica): risposta entro 2h
- Lista scritta "Decisioni che il team puo prendere senza di me"

### 2.4 I Primi 90 Giorni (Onboarding)

| Fase | Durata | Obiettivo | Output |
|------|--------|-----------|--------|
| **Tech Assessment** | 2 giorni | Capire lo stato attuale | Report "State of the Stack" |
| **Mese 1 — Ascolto** | 4 settimane | Capire tutto, non cambiare nulla | Stato dell'Arte + baseline KPI |
| **Mese 2 — Stabilizza** | 4 settimane | Prime quick win + roadmap | Roadmap 6 mesi + prima iniziativa |
| **Mese 3 — Esegui** | 4 settimane | Primo risultato misurabile | Quick win consegnata + retrospettiva |

**Le 4 settimane di onboarding nel dettaglio:**

- **Settimana 1 — Tech Assessment**: architettura, codebase, CI/CD, documentazione, dipendenze
- **Settimana 2 — Architecture Review**: top 5 rischi, top 3 opportunita, draft condiviso
- **Settimana 3 — Team Assessment**: 1:1 con ogni developer (45 min ciascuno), leader informale, rischio turnover
- **Settimana 4 — Strategic Alignment**: workshop CEO + Tech Lead, obiettivi 6/12 mesi, priorita condivise

### 2.5 L'Output delle 4 Settimane: "State of the Stack"

Documento strutturato:
1. **Executive Summary** — 3-5 righe: stato generale, messaggio chiave
2. **Team** — struttura, forze, gap, rischio turnover
3. **Architettura e Sistema** — stack, CI/CD, observability, top 5 rischi, top 3 opportunita
4. **Processo** — come lavora il team, inefficienze, raccomandazioni
5. **Allineamento Strategico** — obiettivi business, roadmap tecnica, decisioni pendenti
6. **Piano Azione 90 Giorni** — 3 priorita con owner e scadenza
7. **KPI Baseline** — deployment frequency, lead time, MTTR, team satisfaction

---

## LIVELLO 3 — COMPETENZA TECNICA SPECIFICA

### 3.1 Architettura Software (cosa sai fare)

| Area | Profondita | Esempi concreti |
|------|-----------|----------------|
| **Microservizi** | 10+ anni su piattaforme mission-critical | SETA: 6 microservizi Java gRPC, 30M+ transazioni/anno |
| **Modular monolith** | Governance daily | SPORT: monorepo .NET 8, 15+ progetti, clean architecture |
| **Event-driven** | Design + implementazione | Kafka, RabbitMQ, pattern CQRS, eventual consistency |
| **API design** | Enterprise-grade | OpenAPI 3.1, RFC 7807, versioning, API-First |
| **DDD** | Bounded context, aggregati | Separazione SPORT/SETA, anticorruption layer |
| **Legacy modernization** | Piano + esecuzione | CORBA → gRPC (migrazione in corso), strategia strangler fig |
| **Database** | SQL Server, Oracle, PostgreSQL | Schema design, performance tuning, migration strategy |
| **Cloud** | Kubernetes, AWS EKS, Docker | Deploy, scaling, IaC, FinOps |

### 3.2 Processi e DevOps

| Area | Cosa porto |
|------|-----------|
| **CI/CD** | Pipeline GitLab/GitHub Actions, deploy via tag, zero-downtime |
| **Git workflow** | GitFlow ibrido, branching strategy per team misti |
| **Testing strategy** | Piramide dei test, contract testing, E2E mirato |
| **Observability** | Log JSON strutturati, metriche Prometheus, trace OpenTelemetry, 4 Golden Signals |
| **Incident management** | Root cause analysis, post-mortem, playbook |
| **Security** | OWASP Top 10, SAST/DAST in CI, threat modeling, secret management |
| **Resilienza** | Circuit breaker, retry + backoff, timeout, idempotenza |

### 3.3 Team e Leadership

| Area | Esperienza |
|------|-----------|
| **Hiring tecnico** | Job description, screening, technical interview, panel |
| **Team structure** | Team Topologies, platform team, stream-aligned |
| **Mentoring** | 1:1 strutturati, growth plan, feedback costruttivo |
| **Cultura** | ADR, blameless post-mortem, code review costruttiva, psychological safety |
| **Metriche** | DORA metrics (deploy frequency, lead time, MTTR, change failure rate) |
| **Cognitive load** | Ridurre complessita per il team, ownership chiara |

### 3.4 AI e Innovazione (differenziatore)

| Area | Cosa porto |
|------|-----------|
| **AI adoption pragmatica** | Non hype. ROI dimostrabile. Dove AI serve vs dove e spreco |
| **LLM in produzione** | Prompt engineering, RAG, evaluation, guardrail, costi |
| **AI nel ciclo dev** | Code review AI, analisi automatica, generazione documentazione |
| **Cost routing** | Model selection: Haiku per bulk, Sonnet per standard, Opus per critico |
| **Security AI** | Prompt injection, data leakage, over-trust — rischi reali |
| **ROI dimostrato** | FORE-165: 98% riduzione costi sviluppo, 4.4x-7.6x ROI reale |

### 3.5 Compliance e Settori Regolamentati

| Esperienza | Dettaglio |
|-----------|-----------|
| **Fiscale (SIAE)** | Sistema MAI-Fiscale: 30 smart card, sigilli fiscali, compliance continua |
| **Polizia di Stato** | VRO: SOAP/VPN verso Questura per autorizzazione accessi sportivi |
| **GDPR** | PII minimization, audit, data protection by design |
| **PA** | Vincoli normativi, gare d'appalto, certificazioni |
| **PCI DSS** | Payment gateway integration (KPS/Adyen/PayPal) |

---

## LIVELLO 4 — RISULTATI DIMOSTRABILI

### 4.1 Numeri da citare (dal tuo track record)

| Metrica | Prima | Dopo | Miglioramento |
|---------|-------|------|---------------|
| **Team satisfaction** | — | — | +50% |
| **Deployment frequency** | Ogni 6 settimane | Ogni settimana | +400% |
| **Deploy time** | 4 ore | 22 minuti | -91% |
| **Bug rate** | Baseline | -98% | (caso specifico con AI) |
| **Velocita team** | Baseline | +30% | Velocity sprint |
| **Costo sviluppo (con AI)** | 5.880-9.240 EUR | 1.344-1.664 EUR | -77% a -82% |
| **Tempo analisi** | 2-3 giorni | 2 ore | -92% |

### 4.2 Case Studies da raccontare (anonimizzati)

**Case 1 — "Piattaforma ticketing nazionale" (il tuo lavoro attuale)**
- 30M+ transazioni/anno, 93 componenti, 7 livelli architetturali
- Modernizzazione da legacy CORBA a microservizi Java gRPC
- Governance architetturale su 3 team (SPORT, SETA, MAI)
- Risultato: standard architetturali implementati, 12 pilastri, ADR obbligatori

**Case 2 — "Analisi FORE-165" (AI-assisted development)**
- Ticket bloccato in "Detail Analysis" da mesi
- AI ha prodotto: analisi funzionale + ADR + brief sviluppo + sub-task in 2 ore
- Implementazione completa (BE+FE) in 12 minuti AI + 30 min review
- ROI reale: 4.4x - 7.6x (845 EUR investiti → 3.717-6.437 EUR risparmiati)

**Case 3 — "Compliance fiscale mission-critical"**
- Cluster 10 server, 30 smart card, ~5 sigilli/sec
- Ogni errore = multa SIAE + blocco vendite
- Soluzione: circuit breaker, retry intelligente, monitoring real-time
- Risultato: zero incidenti in N mesi

**Come raccontarli in call (60 secondi ciascuno):**
> "Gestisco l'architettura di una piattaforma che processa 30 milioni di transazioni l'anno. Non scrivo codice — definisco gli standard, guido le scelte architetturali, e mi assicuro che 3 team diversi vadano nella stessa direzione. Il risultato concreto: deploy piu frequenti, meno incidenti, team piu autonomo."

### 4.3 Frasi d'Impatto (da avere pronte)

**Sul valore:**
> "Il mio lavoro e fare in modo che le prossime 100 decisioni tecniche del vostro team siano migliori. Una sola decisione architetturale sbagliata costa 6-12 mesi di rework."

**Sulla differenza con un dev senior:**
> "Un dev senior risolve i problemi di oggi. Io prevengo i problemi di domani."

**Sulla continuita:**
> "Non sono un consulente che scrive un report e sparisce. Sono al tavolo delle decisioni ogni settimana. Conosco il vostro codice, il vostro team, i vostri vincoli. Dopo 3 mesi sono parte del sistema."

**Sul modello fractional:**
> "Non vi servono 5 giorni di CTO a settimana. Ve ne servono 2 — ma di alta qualita, con 10 anni di esperienza enterprise alle spalle."

**Sull'AI:**
> "Porto l'AI dove ha senso — non come hype ma come strumento che riduce i costi del 70-80% su task specifici. Ve lo dimostro con numeri reali, non con slide."

**Sul rischio:**
> "Il rischio non e provare il fractional. Il rischio e continuare senza direzione tecnica per altri 12 mesi."

---

## LIVELLO 5 — DETTAGLI OPERATIVI

### 5.1 Struttura Contrattuale

| Elemento | Standard |
|----------|----------|
| **Tipo** | Collaborazione professionale (P.IVA) |
| **Durata minima** | 3 mesi |
| **Rinnovo** | Mensile dal mese 4, senza vincoli |
| **Preavviso exit** | 30 giorni (entrambe le parti) |
| **Pagamento** | Retainer mensile fisso, fattura a fine mese |
| **Urgenze** | Definite in contratto; fuori scope = extra-orario (200 EUR/h) |
| **Proprieta intellettuale** | Il codice e del cliente; metodologie/framework restano del FCTO |
| **NDA** | Standard, reciproco |
| **Non-compete** | No (il FCTO lavora per piu clienti per definizione) |

### 5.2 Cosa serve dal cliente (prerequisiti)

- Accesso read al codebase (GitLab/GitHub)
- Accesso read al sistema di monitoring (se esiste)
- Accesso al canale comunicazione team (Slack/Teams)
- Calendario condiviso per i giorni di presenza
- 1 ora/settimana del CEO/founder per i sync
- Apertura al feedback onesto (anche scomodo)

### 5.3 Come gestisci piu clienti

**Regola fondamentale**: un giorno = un cliente. Mai mischiare contesti nella stessa giornata.

**Configurazione tipo con TicketOne + 1 cliente:**
- Lun-Mer-Ven: TicketOne (3 gg/sett)
- Mar-Gio: Etica Soluzioni (2 gg/sett)

O se parti con 1 gg/sett:
- Lun-Mar-Mer-Ven: TicketOne
- Gio: Etica Soluzioni

**Protezione qualita:**
- Context document per ogni cliente (1 pagina: persone, progetti, decisioni recenti)
- Rileggilo 30 min prima di ogni sessione
- Nessuna condivisione di informazioni tra clienti
- Mai piu di 3 clienti attivi in contemporanea (qualita crolla)

### 5.4 KPI che proponi (baseline → obiettivo 6 mesi)

| KPI | Cosa misura | Come si migliora |
|-----|-------------|-----------------|
| **Deployment frequency** | Quante volte rilasciate | CI/CD, feature flags, trunk-based |
| **Lead time** | Da idea a produzione | Ridurre handoff, automatizzare |
| **MTTR** | Tempo per risolvere incidenti | Observability, playbook, on-call |
| **Change failure rate** | % deploy che causano incidenti | Test, review, canary deploy |
| **Team satisfaction** | Survey trimestrale | 1:1, ascolto, azioni concrete |
| **Bug rate** | Bug per sprint/release | Test strategy, code review |

### 5.5 Gli Errori da NON Fare (memorizzali)

1. **Mai toccare il codice** — appena lo fai, diventi "il dev senior" nel cervello del cliente
2. **Mai promettere tempi** — "risolvo il debito in 3 mesi" e impossibile. "Inizio a ridurlo visibilmente" e onesto
3. **Mai decidere senza ascoltare il team** — sanno cose che tu non sai
4. **Mai diventare il collo di bottiglia** — se tutto passa da te, hai fallito
5. **Mai accettare "urgenze" false** — definisci in anticipo cosa e urgenza vera
6. **Mai abbassare il prezzo** — cambia il tier, non la daily rate
7. **Mai dire si a tutto** — "puoi anche fare X?" → definisci i confini dal giorno 1
8. **Mai ignorare la cultura** — pratiche enterprise in una PMI creano paralisi
9. **Mai sparire senza preavviso** — anche se il rapporto va male
10. **Mai sopravvalutare la tua comprensione del loro business** — ascolta piu di quanto parli nei primi 60 giorni

### 5.6 Le 7 Obiezioni e Come Rispondere

| Obiezione | Risposta |
|-----------|----------|
| "Non ho bisogno di un CTO — il mio dev senior gestisce tutto" | "Ottimo. Ma chi pensa all'architettura tra 18 mesi? Chi gestisce il suo sviluppo? Chi parla con il board di roadmap? Se fa 'anche quello', lo state bruciando." |
| "Costa troppo" | "Un CTO full-time costa 180K/anno all inclusive. Io costo 85K per la stessa seniority nelle ore che contano. La domanda e: quanto vi costa NON averlo?" |
| "Come fai a capire il nostro business in 2 giorni a settimana?" | "Non lo capiro in 2 giorni — lo capiro in 2 mesi. Il vantaggio: porto prospettiva esterna con continuita. Non sono dentro il bosco — vedo la foresta." |
| "E se hai un'emergenza con un altro cliente?" | "Priorita definite in contratto. Sistema down = risposta entro 2h sempre. Il resto e pianificato." |
| "Come facciamo a sapere che funzionera?" | "Non lo sappiamo finche non iniziamo. Per questo: Tech Assessment di 2 giorni (deliverable concreto, zero vincolo), poi 3 mesi. Se non vedete valore, non rinnoviamo." |
| "Preferiamo un full-time" | "Lo capisco. Posso aiutarvi a cercarlo — scrivo il job description, faccio i technical interview. Nel frattempo (6-12 mesi), il team non resta senza guida." |
| "Possiamo fare un mese di prova?" | "Il Tech Assessment E il mese di prova: 2 giorni, output concreto, potete valutarmi. Ma un mese solo non basta per risultati reali — il minimo e 3." |

### 5.7 Exit: Come Finisce (e perche e un successo)

**3 modalita di uscita:**

1. **Exit naturale** — l'azienda assume un CTO full-time (successo! tu l'hai resa pronta)
   - 3 mesi preavviso, aiuti nell'hiring, onboarding del successore (1 mese overlap)

2. **Exit pianificata** — obiettivo raggiunto (CI/CD implementata, team riorganizzato)
   - Documento di passaggio, retrospettiva, offerta di advisory trimestrale

3. **Exit difficile** — il rapporto non funziona
   - 30 giorni preavviso, lettera di chiusura con stato + raccomandazioni
   - MAI bruciare ponti — il CEO di oggi e il referral di domani

---

## LIVELLO 6 — ADATTAMENTO A ETICA SOLUZIONI

### 6.1 Il Settore: Ristorazione Collettiva

**Cosa devi sapere:**
- Mercato enorme e stabile (mense scolastiche, ospedali, aziende, PA)
- Alta regolamentazione (PA = gare, HACCP, tracciabilita, normative regionali)
- Clienti conservativi (enti pubblici = decisioni lente, budget fissi, SLA rigidi)
- Competizione: Elior, Sodexo, Compass Group — ma il software e il differenziatore
- Trend: digitalizzazione prenotazioni, allergie, sprechi alimentari, portale genitori

**Implicazioni per il tuo ruolo:**
- Stack probabilmente stabile/conservativo (non vogliono "l'ultima tecnologia")
- Priorita: affidabilita > innovazione > velocita
- Compliance forte (dati personali minori se scolastico, dati sanitari se ospedaliero)
- Integration heavy (sistemi PA, fatturazione elettronica, SPID/CIE)

### 6.2 Punti di Contatto col Tuo Background

| Il tuo background | Rilevanza per Etica Soluzioni |
|-------------------|-------------------------------|
| Compliance fiscale (SIAE, GDPR) | Loro: compliance PA, dati personali, normative food |
| Piattaforma mission-critical (ticketing) | Loro: mense devono funzionare ogni giorno, zero downtime |
| Multi-tenancy (organizzatori diversi) | Loro: clienti PA diversi, multi-ente |
| Integration esterne (Polizia, SIAE) | Loro: integrazioni PA, fatturazione, SPID |
| Team 10-15 dev governance | Loro: probabilmente team simile da governare |
| Legacy modernization (CORBA → micro) | Loro: 15 anni di prodotto = sicuramente legacy da evolvere |

### 6.3 Cosa potresti portare (primi 6 mesi)

**Quick win potenziali (mese 1-2):**
- Setup CI/CD se non c'e (impatto immediato sulla qualita)
- Code review strutturata (se non esiste)
- Monitoring base (se non c'e)
- Documentazione architetturale (se manca)

**Iniziative strategiche (mese 3-6):**
- Roadmap tecnica allineata al business
- Riduzione debito tecnico critico (1-2 aree prioritarie)
- Hiring strategy (se team deve crescere)
- AI adoption dove ha senso (es: classificazione automatica richieste, analisi sprechi)

### 6.4 Domande Specifiche per Capire il Loro Pain

> "Il vostro software gestisce le prenotazioni mensa? O anche la produzione/logistica?"

→ Scope del prodotto = complessita del ruolo

> "I vostri clienti PA richiedono certificazioni specifiche (AgID, SPID, fatturazione elettronica)?"

→ Livello di compliance = tipo di governance necessaria

> "Quante installazioni/clienti gestite in parallelo? E multi-tenant o deploy separati?"

→ Architettura = sfida di scala

> "Avete mai avuto un incidente serio in produzione? Cosa e successo?"

→ Maturita operativa = dove servono guardrail

---

## APPENDICE — QUICK REFERENCE IN CALL

### Se ti chiedono "Come lavori concretamente?"

> "Dedico 2 giorni a settimana alla vostra azienda. Un giorno e governance e team — standup, 1:1, review architetturali. L'altro e strategia e stakeholder — sync col CEO, roadmap, metriche. Nei giorni in cui non ci sono, rispondo in 4 ore su Teams per le cose urgenti. Ogni mese consegno un report scritto con decisioni, stato, rischi."

### Se ti chiedono "Che risultati hai ottenuto?"

> "Nell'ultimo anno ho portato una piattaforma da deploy ogni 6 settimane a deploy settimanali. Ho ridotto del 91% il tempo di deploy. Con l'AI integrata nel processo, ho dimostrato risparmi del 77-82% sui costi di sviluppo su task specifici. Ma il risultato piu importante: team piu autonomo, che sa prendere decisioni anche quando non ci sono."

### Se ti chiedono "Perche non il full-time?"

> "Perche non vi serve un CTO 5 giorni a settimana. Vi servono le decisioni giuste, non le ore. Con 2 giorni di alta qualita avete la stessa seniority che paghereste 180K l'anno full-time — a meta del costo, zero rischio, con la possibilita di scalare up o down."

### Se ti chiedono "Come gestisci il conflitto con TicketOne?"

> "Il modello fractional per definizione prevede piu clienti. Non c'e conflitto di interesse perche operate in settori completamente diversi. La mia agenda e strutturata per dare a ciascun cliente giorni dedicati e focus totale."

### Se ti chiedono "Conosci il nostro settore?"

> "Non conosco la ristorazione collettiva nel dettaglio — ma conosco i problemi che affronta un'azienda software con 15 anni di prodotto, clienti enterprise, e un team che deve evolvere. Il settore lo imparo nelle prime settimane; la governance tecnica, l'architettura, e la leadership di team sono le stesse ovunque."

---

*Documento companion di: PREP_Call_EticaSoluzioni_20260616.md*  
*v1.0 | 2026-06-16*
