---
title: "Agile & DevOps per la Tua Azienda: Senza Certificazioni Inutili e Senza Buttare Via 6 Mesi"
author: "108 Vision | Elios Scoglio"
type: "manuale-omaggio"
track: "agile-devops"
version: "2.0"
date: "2026-06-11"
---

# Agile & DevOps per la Tua Azienda: Senza Certificazioni Inutili e Senza Buttare Via 6 Mesi

**Guida pratica per manager, CTO e CEO di PMI italiane**

*di Elios Scoglio — 108 Vision*

---

Era un martedi sera, ore 21:30. Il team era ancora in call. Guardavo una board Jira con 47 ticket "In Progress" aperti da tre settimane. Nessuno era davvero in avanzamento: tutti bloccati su un'approvazione, una dipendenza irrisolta, una specifica che nessuno aveva scritto. Avevamo fatto Agile alla lettera — cerimonie, board, punti storia, standup quotidiani — e il software non usciva. Il team era esausto. I clienti aspettavano.

Quello che ho imparato dopo oltre 20 anni su sistemi critici — gestendo team fino a 20 persone, portando aziende da zero a delivery funzionante — è che la differenza tra Agile che funziona e Agile che è teatro si misura in tre cose: chiarezza sullo scopo, disciplina nelle basi, e coraggio di cambiare quello che non funziona invece di continuare a fare le cerimonie.

Questo manuale è il distillato di quel percorso. In queste pagine troverai metodi applicabili da subito, i numeri reali di trasformazioni riuscite, e un piano operativo per i tuoi prossimi 90 giorni.

---

## 1. I Numeri che Contano

Prima della teoria, i risultati. Queste sono metriche misurate su team reali, sistemi in produzione, con pressioni di business vere.

| Azienda | Metrica | Prima | Dopo |
|---|---|---|---|
| Aruba | Bug rate in produzione | baseline | -98% in 4 mesi |
| Aruba | Frequenza di deployment | baseline | +400% |
| Toscano Immobiliare | Lead time to deploy | baseline | -60% |
| TicketOne | Velocita di sviluppo | baseline | +30% |
| TicketOne | Soddisfazione del team | baseline | +50% |

Questi numeri non vengono da un libro. Vengono da aziende con sistemi in produzione, scadenze reali, e nessuno spazio per esperimenti accademici. Alcuni di questi sistemi gestivano vendita di biglietti per eventi sportivi con obbligo di compliance verso la Polizia di Stato. Non c'era spazio per il fallimento.

Non ho una certificazione Agile da mostrare. Ho i numeri.

> **Insight 108 Vision** — Un team che deploya quattro volte piu spesso di prima non ha acquistato un tool migliore. Ha cambiato il modo in cui pensa alla consegna del valore. La tecnologia segue la mentalita, non il contrario.

---

## 2. Cos'e Agile Davvero (e Cosa Non E')

Nel 2001, diciassette sviluppatori software scrissero un documento di mezza pagina che cambio il modo in cui il software viene costruito. Il Manifesto Agile. Quattro valori, dodici principi. In vent'anni, il mondo delle aziende li ha trasformati in qualcosa di irriconoscibile.

Ecco i quattro valori tradotti in italiano operativo per il 2026.

**Individui e interazioni sopra processi e strumenti.** Due persone che si parlano per 15 minuti risolvono piu problemi di cinque ticket su Jira lasciati aperti per una settimana. Quando il processo entra in conflitto con una conversazione utile, vince la conversazione. Se nel tuo team tutto passa per ticket, approvazioni formali e catene di email, hai un problema di collaborazione che nessun tool risolve.

**Software funzionante sopra documentazione esaustiva.** L'obiettivo e consegnare qualcosa che funziona. La documentazione serve quando serve: per decisioni architetturali rilevanti, per API pubbliche, per compliance. Non come rito burocratico per dimostrare che si e "fatto correttamente". Il software funzionante e la prova che hai fatto il tuo lavoro.

**Collaborazione col cliente sopra negoziazione dei contratti.** Mostra qualcosa di funzionante ogni due settimane, raccogli feedback, aggiusta la rotta. Il cliente non aspetta sei mesi per scoprire che il prodotto non va bene. Questo funziona solo se il cliente e disponibile a collaborare durante il processo — e' un cambiamento culturale anche per lui.

**Rispondere al cambiamento sopra seguire un piano.** Il piano e uno strumento, non un contratto con l'universo. I team che consegnano puntualmente il prodotto sbagliato non stanno pianificando — stanno recitando. Pianifica in orizzonte breve con alta confidenza, in orizzonte lungo con alta flessibilita.

### Le tre bugie che ti hanno raccontato

**"Agile significa fare standup ogni mattina."** Lo standup mattutino e la cerimonia piu abusata. In molte aziende e diventato un rito di aggiornamento di stato dove ciascuno dice cosa ha fatto ieri, con tutti gli altri che aspettano il proprio turno. Non e uno standup Agile — e una riunione di status in piedi. Il Daily Standup serve per sincronizzare il team e far emergere blocchi, non per aggiornare il manager.

**"Agile significa niente documentazione."** E la scusa piu usata per non documentare nulla. Il Manifesto dice "sopra", non "invece di". La documentazione esaustiva non serve. La documentazione essenziale — Architecture Decision Record, contratti API, README utili — e fondamentale. Un team che non documenta le decisioni architetturali accumula debito cognitivo. Sei mesi dopo, nessuno ricorda perche una scelta e stata fatta.

**"Agile significa niente pianificazione."** Esattamente il contrario. Agile richiede pianificazione continua e di alta qualita su orizzonti brevi. Pianifichi due settimane, esegui, misuri, pianifichi di nuovo. E piu disciplinato del waterfall, non meno.

> **Insight 108 Vision** — La distinzione che conta di piu non e tra Scrum e Kanban. E tra Agile come processo (cerimonie da seguire) e Agile come mentalita (un modo di prendere decisioni). Puoi seguire tutte le cerimonie alla lettera e avere un team disfunzionale. Puoi non avere nessuna cerimonia formale e fare Agile eccellente.

---

## 3. Perche le Trasformazioni Agile Falliscono in Italia

Ho visto queste dinamiche molte volte. I pattern si ripetono.

**Pattern 1: si agilizza il software ma non cambia niente intorno.** Un team fa sprint, tiene gli standup, usa Jira. Ma il CEO continua a chiamare direttamente gli sviluppatori con richieste urgenti che saltano il backlog. Le priorita cambiano ogni settimana. Il Product Owner non ha autorita per dire no. Ogni sprint si conclude con il 40% delle storie spostate al successivo. Il problema non era tecnico — era di governance.

**Pattern 2: il project manager diventa Scrum Master senza cambiare ruolo.** Lo Scrum Master continua ad assegnare task, decidere priorita, gestire dipendenze in modo centralizzato. Il team non si auto-organizza mai. La retrospective e gestita come check-in di stato. Scrum Master non e project manager con un nome diverso.

**Pattern 3: si fa Scrum ma si gestisce come waterfall.** Le storie vengono scritte all'inizio del progetto come nel waterfall, messe in backlog nell'ordine in cui "devono" essere sviluppate. Non c'e nessuna prioritizzazione basata sul valore. Non c'e feedback loop con il cliente. La struttura temporale e iterativa ma la mentalita e lineare.

**Pattern 4: il team fa Agile ma i manager no.** Il team lavora in sprint, ma i processi aziendali intorno sono tutti waterfall: approvazioni che richiedono settimane, budget annuali fissi, richieste di pianificazione a 18 mesi, change management con lead time di sei settimane. L'Agile transformation del solo team, senza toccare la governance, produce frustrazione.

**Pattern 5: si adotta SAFe perche "Scrum non scala".** SAFe e un framework per organizzazioni grandi con molte squadre che devono coordinarsi. Richiede una maturita Agile di base che spesso non c'e. In mancanza di quella maturita, SAFe aggiunge complessita senza aggiungere valore. La regola pratica: prima fai funzionare un team con Scrum. Poi, quando hai dimostrato che il problema e il coordinamento tra team, valuta un framework di scaling.

### La checklist del rischio prima di iniziare

| Rischio | Domanda diagnostica | Segnale verde | Segnale rosso |
|---|---|---|---|
| Sponsor senza autorita | Chi ha approvato questa trasformazione? | CEO o VP con budget | Responsabile IT senza leva organizzativa |
| Middle management non allineato | I manager intermedi sono stati coinvolti? | Si, dall'inizio | No, riceveranno comunicazione |
| PO senza autorita reale | Chi decide le priorita del backlog? | Una persona con autorita e disponibilita | Un comitato o un manager gia sovraccarico |
| Aspettative irrealistiche | Cosa si aspetta il management dopo 3 mesi? | Baseline + prime retrospective | Software perfetto e velocita raddoppiata |
| Processi di rilascio lenti | Quanto ci vuole per deployare in produzione? | Ore o giorni | Settimane o mesi |
| Cultura del fallimento punitiva | Come vengono gestiti gli errori? | Come opportunita di apprendimento | Come prove di incompetenza |

Se hai tre o piu segnali rossi, la trasformazione fallira senza affrontare prima queste cause radice.

---

## 4. Scrum in Due Pagine: Guida Operativa

### I tre ruoli

**Product Owner** — Decide cosa costruire e in quale ordine. Gestisce il backlog, definisce le priorita, rappresenta il business e gli utenti. Ha l'ultima parola sulle priorita; il team ha l'ultima parola sul come. L'errore piu comune: il PO come passacarte tra il CEO e il team, senza autorita reale.

**Scrum Master** — Facilita il processo e rimuove gli ostacoli. Non e il project manager, non assegna task, non controlla il lavoro. Il suo compito e rendere il team piu efficace: gestisce le cerimonie, identifica impedimenti, promuove il miglioramento continuo. L'errore piu comune: comportarsi da project manager centralizzando decisioni che andrebbero delegate.

**Development Team** — Il gruppo che costruisce il prodotto. Cross-funzionale: include tutte le competenze necessarie per consegnare un incremento funzionante. Si auto-organizza. Dimensione ideale: 3-9 persone. L'errore piu comune: il team come esecutori di istruzioni, non come collaboratori nella pianificazione.

### Le quattro cerimonie

**Sprint Planning (2-4 ore)** — Il team e il PO decidono quali storie portare nel prossimo sprint. Si definisce lo Sprint Goal: un obiettivo condiviso che da senso allo sprint oltre alla lista di ticket. Segnale positivo: il team esce con chiarezza e confidenza. Segnale negativo: il team accetta storie senza capirle per compiacere il PO.

**Daily Standup (15 minuti)** — Tre domande: cosa ho fatto ieri verso lo Sprint Goal? Cosa faccio oggi? Ci sono impedimenti? Non e un report di stato. Segnale positivo: emergono blocchi e il team collabora per risolverli. Segnale negativo: tutti riferiscono al manager, nessuno parla agli altri.

**Sprint Review (1-2 ore)** — Il team mostra agli stakeholder quello che ha costruito. Non e una presentazione formale — e una conversazione. Segnale positivo: il feedback cambia le priorita del prossimo sprint. Segnale negativo: e una formalita, le decisioni erano gia prese.

**Sprint Retrospective (1-1,5 ore)** — Il team riflette su come ha lavorato. Tre domande: cosa e andato bene? Cosa puo migliorare? Cosa facciamo nel prossimo sprint per migliorarlo? Si identificano 1-3 azioni concrete con responsabile e scadenza. Ogni retrospective senza almeno un'azione concreta e una retrospective fallita.

### La Definition of Done

La Definition of Done e l'accordo del team su cosa significa "finito". Non "sviluppato" — finito. Senza DoD, ogni membro ha una definizione diversa di "completato". Questo crea confusione, bug in produzione e storie che riemergono sprint dopo sprint.

**Template minimo:**

```
Una storia e DONE quando:
[ ] Il codice implementa i criteri di accettazione della storia
[ ] Il codice e stato revisionato da almeno un altro membro del team
[ ] I test automatizzati passano
[ ] Non introduce regressioni evidenti sulle funzionalita esistenti
[ ] La funzionalita e deployata e verificata in ambiente di staging
[ ] Nessuna credenziale o secret nel codice
[ ] Nessun dato personale in log o output di debug
```

Come costruirla: riunisci il team in 60 minuti, chiedi "Cosa deve essere vero affinche questa storia non ritorni nel backlog?", tieni quello che e non negoziabile. Appendila visibile a tutti. Aggiorna in retrospective.

---

## 5. DevOps per PMI: Deployare Piu Veloce Senza un Team da 30 Ingegneri

### Cos'e DevOps davvero

DevOps non e un ruolo. Non e la persona che gestisce i server e fa anche un po' di sviluppo. E una pratica — un modo di organizzare il lavoro che abbatte il muro tra chi sviluppa il software e chi lo gestisce in produzione.

Nel modello tradizionale, gli sviluppatori scrivono il codice e lo "lanciano oltre il muro" alle operations. Quando qualcosa va storto, inizia la fase degli accusati reciproci. Nel modello DevOps, gli sviluppatori sono responsabili del codice in produzione. Il feedback loop e rapido: un bug torna allo sviluppatore che l'ha introdotto nel giro di ore, non settimane.

Tre principi:

**Shift left** — Porta i controlli di qualita il piu vicino possibile all'inizio del processo. Test automatizzati, linting, analisi di sicurezza — nel momento in cui il codice viene scritto, non alla fine quando e costoso correggere.

**Automazione come default** — Ogni processo ripetibile deve essere automatizzato. Non perche gli umani siano incapaci, ma perche gli umani fanno errori sotto pressione, e la pressione e massima quando si deploya in produzione.

**Feedback loops veloci** — Il tempo tra "ho scritto questo codice" e "so se funziona in produzione" deve essere il piu breve possibile. Feedback lento significa correzioni tardive e costo alto.

### I tre livelli di maturita DevOps per PMI

**Livello 1 — Manuale Strutturato.** I deploy avvengono manualmente ma esiste un processo documentato. Segnali: il deploy richiede ore di lavoro manuale, esiste una "finestra di deployment" il venerdi sera, solo una o due persone sanno come deployare. Obiettivo: riduci il rischio umano. Documenta tutto. Crea runbook per ogni operazione ricorrente.

**Livello 2 — Semi-automatizzato.** La build e automatizzata. I test girano su ogni commit. Il deploy in staging e automatico. Il deploy in produzione e ancora manuale ma standardizzato. Segnali: hai una pipeline CI, il deploy in staging richiede meno di 30 minuti, chiunque nel team puo deployare. Obiettivo: ridurre il lead time da "codice pronto" a "codice in produzione".

**Livello 3 — CI/CD Completo.** Ogni commit su branch main, dopo aver superato i test automatici, viene deployato automaticamente in produzione. Il team deploya piu volte al giorno. Il monitoring e proattivo. Segnali: deployment frequency piu volte al giorno, lead time in minuti, MTTR sotto un'ora.

### La pipeline CI/CD minima che ogni team dovrebbe avere

Una pipeline minima funzionale ha quattro fasi. Non serve di piu per partire.

```
FASE 1: BUILD
  - Compila il codice (o verifica la sintassi)
  - Installa le dipendenze
  - Tempo target: < 2 minuti

FASE 2: TEST AUTOMATIZZATI
  - Unit test: verifica che la logica di business funzioni
  - Integration test: verifica che i componenti si parlino
  - Linting: verifica lo stile del codice
  - Sicurezza: scan delle dipendenze vulnerabili
  - Tempo target: < 10 minuti

FASE 3: BUILD ARTEFATTO
  - Crea l'artefatto deployabile (Docker image, pacchetto)
  - Taggalo con il numero di commit o versione
  - Caricalo nel registry
  - Tempo target: < 5 minuti

FASE 4: DEPLOY
  - Deploy automatico in staging su ogni push al branch main
  - Deploy in produzione manuale (Livello 2) o automatico (Livello 3)
  - Notifica il team del risultato
  - Tempo target: < 5 minuti
```

Tempo totale pipeline: obiettivo sotto i 20 minuti. Una pipeline che dura piu di 30 minuti viene aggirata dagli sviluppatori — non aspettano il risultato, pushano e dimenticano.

> **Insight 108 Vision** — Deployare manualmente in produzione nel 2026 non e un problema tecnico: e un problema di rischio. I dati DORA sono chiari: i team con deploy automatizzati hanno un change failure rate fino a 7 volte inferiore rispetto ai team con deploy manuali. Il motivo e semplice: il processo automatizzato e identico ogni volta. Non dimentica passaggi, non omette check sotto pressione.

### Esempio pratico: pipeline GitHub Actions

```yaml
name: Build, Test and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Security audit
        run: npm audit --audit-level=high

  deploy-staging:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: echo "Deploying to staging..."

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
    steps:
      - name: Deploy to production
        run: echo "Deploying to production..."
```

Questa pipeline esegue build e test su ogni push, deploya automaticamente in staging, e richiede approvazione manuale per la produzione. E un punto di partenza — puoi aggiungere notifiche Slack, report di coverage, scan di sicurezza piu approfonditi.

---

## 6. I 5 Quick Win che Puoi Iniziare Questa Settimana

Questi cinque interventi non richiedono budget, non richiedono approvazioni, non richiedono una trasformazione organizzativa. Ognuno produce un risultato misurabile entro 30 giorni.

**Quick Win 1: La Retrospective di 30 Minuti.**
La retrospective e il meccanismo di miglioramento continuo piu potente per un team. L'unico momento in cui il team si ferma, guarda come sta lavorando, e decide di cambiare qualcosa.

Struttura base: 5 minuti di check-in (una parola su come ti senti), 10 minuti su cosa e andato bene, 10 minuti su cosa puo migliorare, 5 minuti per identificare 1-2 azioni concrete con responsabile e scadenza. Regola fondamentale: ogni retrospective deve produrre almeno un'azione concreta. Una retrospective che produce solo liste di problemi e una retrospective fallita.

**Quick Win 2: Il Backlog Visibile a Tutto il Team.**
La trasparenza sulle priorita riduce il "lavoro sommerso": attivita non tracciate, richieste informali, side project che consumano capacita senza comparire nelle pianificazioni. Regola critica: se un'attivita non e sulla board, non esiste. Qualsiasi richiesta — dal CEO, dal cliente, dall'account — deve passare per il backlog. Nessuna eccezione. Questa regola da sola riduce significativamente il caos operativo.

**Quick Win 3: La Definition of Done Condivisa.**
Sessione di 60 minuti con il team. Risultato atteso entro 30 giorni: riduzione delle storie che "tornano indietro" e dei bug post-deploy che avrebbero potuto essere catturati prima.

**Quick Win 4: Un Deploy Automatizzato, Anche se Piccolo.**
Non serve automatizzare tutto subito. Inizia con il passo piu piccolo possibile. Se non hai nessuna automazione, inizia con i test automatizzati prima del deploy. Anche solo "i test devono passare prima di deployare" e un miglioramento rispetto al nulla. Se il deploy e completamente manuale, crea uno script che esegue tutti i passi in sequenza — anche se lo esegui ancora manualmente, elimina gli errori di memoria.

**Quick Win 5: Le Metriche DORA su Carta.**
Crea una tabella con queste colonne: data deploy, versione, ambiente, durata deploy, problemi, MTTR. Dopo 4-6 settimane hai la tua baseline. Non puoi migliorare quello che non misuri.

---

## 7. Come Misurare se Sta Funzionando: Le 4 Metriche DORA

Le metriche DORA (DevOps Research and Assessment) sono quattro numeri che predicono meglio di qualsiasi altra metrica la qualita del processo di delivery.

**Deployment Frequency** — Quanto spesso il team deploya in produzione? Per una PMI italiana, l'obiettivo realistico nel primo anno e passare da "una volta al mese" a "una o piu volte alla settimana". Deploy frequenti significano modifiche piccole, rischio basso, errori facili da isolare.

**Lead Time for Changes** — Quanto tempo passa dal commit del codice al deploy in produzione? Se scopri un bug critico e ci vuole una settimana per deployare la correzione, hai un problema di lead time. Se ci vogliono 20 minuti, hai un vantaggio competitivo concreto.

**Change Failure Rate** — Che percentuale dei deploy causa problemi in produzione? Un CFR alto non significa che il team e incompetente — spesso significa che i test automatizzati sono insufficienti o che l'ambiente di staging non e rappresentativo della produzione. Target: sotto il 15%.

**Mean Time to Recovery** — Quando c'e un problema in produzione, quanto ci metti in media a risolverlo? Un MTTR basso richiede monitoring che rileva il problema rapidamente, processo di rollback ben definito e testato, team con le competenze per diagnosticare velocemente. Non puoi evitare tutti i problemi — ma puoi decidere quanto velocemente li risolvi.

**Benchmark realistici per PMI:**

| Metrica | Punto di partenza tipico | Obiettivo 6 mesi | Obiettivo 12 mesi |
|---|---|---|---|
| Deployment Frequency | 1 volta al mese o meno | 1-2 volte a settimana | Piu volte a settimana |
| Lead Time | 2-8 settimane | 1-5 giorni | Meno di 1 giorno |
| Change Failure Rate | 40-60% | Sotto il 30% | Sotto il 20% |
| MTTR | Giorni o settimane | Meno di 1 giorno | Meno di 4 ore |

### I segnali qualitativi che la trasformazione sta funzionando

Le metriche DORA sono necessarie ma non sufficienti. Questi segnali indicano che il cambiamento sta avvenendo a livello culturale:

Segnali positivi: il team solleva i problemi in retrospective prima che diventino crisi; gli sviluppatori sono entusiasti di mostrare il loro lavoro nella Sprint Review; i deployment avvengono senza stress — sono eventi ordinari, non emergenze; il team parla del "perche" di una storia, non solo del "cosa"; si fanno domande come "ha senso fare questo adesso?" invece di eseguire ciecamente.

Segnali di allarme: le retrospective producono sempre le stesse azioni senza mai risolvere nulla; il team evita di sollevare problemi perche "tanto non cambia niente"; la velocity viene usata come obiettivo invece che come strumento di pianificazione; le storie vengono stimate sistematicamente in modo ottimistico per compiacere il management.

> **Insight 108 Vision** — Il "silenzio nella retrospective" e uno dei segnali piu preoccupanti. Se nessuno porta problemi, non e che tutto va bene: e quasi sempre che le persone non si sentono sicure di parlare. Il passo successivo non e un tool migliore — e costruire un ambiente in cui gli errori siano informazioni, non condanne.

---

## 8. Il Piano d'Azione 30/60/90 Giorni

Questo piano presuppone un team di 3-15 persone, esperienza Agile minima o nulla, e un punto di riferimento — leader tecnico, engineering manager, o consulente — che guidi il processo.

### Giorni 1-30: Fondamenta

**Checklist operativa:**

- [ ] Intervista ogni membro del team (30 minuti ciascuno): quali sono i pain point reali?
- [ ] Misura le metriche DORA baseline su un foglio di calcolo
- [ ] Identifica il Product Owner reale: una persona con nome e autorita
- [ ] Crea e prioritizza il backlog iniziale (20-30 storie)
- [ ] Costruisci la Definition of Done in sessione condivisa di 60 minuti
- [ ] Scegli la board (Trello, GitHub Projects, Jira, post-it fisici — va bene qualsiasi)
- [ ] Definisci il ritmo delle cerimonie con un calendario ricorrente
- [ ] Fai il primo Sprint Planning tenendo le aspettative basse: e un esperimento
- [ ] Conduci la prima retrospective con almeno 1 azione concreta implementata

### Giorni 31-60: Automazione e Ritmo

**Checklist operativa:**

- [ ] Fai l'audit del processo di deploy attuale: documenta come deployate adesso
- [ ] Scegli la piattaforma CI/CD (GitHub Actions, GitLab CI)
- [ ] Implementa la pipeline fase 1: build + test automatici su ogni push
- [ ] Testa la pipeline su un branch non critico prima di applicarla al main
- [ ] Conduci tre retrospective con azioni implementate
- [ ] Verifica che il backlog sia regolarmente curato dal PO
- [ ] Il team conosce le proprie metriche DORA e capisce i numeri

### Giorni 61-90: Ownership e Ottimizzazione

**Checklist operativa:**

- [ ] Aggiungi scan di sicurezza alla pipeline (dipendenze, secret)
- [ ] Implementa alerting base su produzione (uptime, error rate)
- [ ] Testa e documenta il processo di rollback
- [ ] Misura il lead time end-to-end con precisione
- [ ] Rivedi e aggiorna la Definition of Done basandoti sull'esperienza dei due mesi precedenti
- [ ] Confronta le metriche DORA post-trasformazione con la baseline
- [ ] Il team organizza le cerimonie senza bisogno di essere ricordato
- [ ] Il backlog e pulito: meno di 50 storie aperte, tutte prioritizzate

**Tabella riassuntiva:**

| Periodo | Focus | Obiettivo misurabile |
|---|---|---|
| 0-30 giorni | Fondamenta | Baseline DORA + DoD + prime cerimonie |
| 31-60 giorni | Automazione e ritmo | Pipeline CI/CD + 3 retrospective con azioni |
| 61-90 giorni | Ownership e ottimizzazione | Team autonomo + metriche DORA migliorate |

---

## 9. Glossario Rapido

| Termine | Significato |
|---|---|
| **Agile** | Approccio allo sviluppo basato su consegne frequenti, feedback continuo, adattamento al cambiamento |
| **Scrum** | Framework Agile con sprint, ruoli definiti e cerimonie cadenzate |
| **Kanban** | Metodo visuale per gestire il flusso di lavoro continuo, senza sprint fissi |
| **Sprint** | Iterazione temporale fissa (solitamente 2 settimane) verso uno Sprint Goal |
| **Definition of Done** | Accordo condiviso su cosa significa che un'attivita e davvero completata |
| **Velocity** | Quantita di lavoro completata in uno sprint. Strumento di pianificazione, non obiettivo |
| **DevOps** | Pratica che abbatte il confine tra sviluppo e operations per accelerare il delivery |
| **CI/CD** | Continuous Integration / Continuous Delivery — pipeline automatizzata di build, test, deploy |
| **Lead Time** | Tempo dal commit del codice al deploy in produzione |
| **DORA** | DevOps Research and Assessment — le 4 metriche chiave del delivery |
| **Change Failure Rate** | Percentuale di deploy che causano problemi in produzione |
| **MTTR** | Mean Time to Recovery — tempo medio per risolvere un problema in produzione |
| **ADR** | Architecture Decision Record — documento che traccia una decisione architetturale |

---

## 10. Risorse per Andare Piu in Profondo

**Libri con il miglior rapporto tra tempo investito e impatto pratico:**

*Accelerate* — Nicole Forsgren, Jez Humble, Gene Kim. Il libro che ha reso famose le metriche DORA. Basato su ricerca empirica su migliaia di team. Se leggi un solo libro su DevOps, leggi questo.

*The Phoenix Project* — Gene Kim, Kevin Behr, George Spafford. Romanzo di business che spiega DevOps attraverso una storia. Utile per convincere i non tecnici.

*Team Topologies* — Matthew Skelton, Manuel Pais. Come organizzare i team per ridurre il cognitive load e migliorare il flusso di lavoro.

*Continuous Delivery* — Jez Humble, David Farley. Il riferimento tecnico su pipeline CI/CD e deployment automation.

*Empowered* — Marty Cagan, Chris Jones. Come costruire team di prodotto con ownership reale. Per chi vuole andare oltre Scrum.

---

## Vuoi Andare Oltre?

Vuoi applicare questo metodo alla tua azienda? Prenota 30 minuti con noi su 108vision.it — gratuito, senza impegno.

In quella conversazione: capiamo dove sei oggi, identifichiamo i 2-3 interventi ad alto impatto per il tuo contesto specifico, e ti diamo una valutazione onesta di cosa puoi fare in autonomia con questo manuale e dove un supporto esterno accelererebbe i risultati.

*108 Vision — Costruiamo la direzione, non solo il codice.*
