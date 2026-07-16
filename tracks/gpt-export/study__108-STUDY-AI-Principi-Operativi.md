# Principi di AI Engineering & Governance

> Guida operativa per chi usa AI come strumento di lavoro quotidiano — non come giocattolo, non come oracolo.
>
> Questo documento e' pensato per essere condiviso con il team come fondamento di cultura AI.
>
> **Ultimo aggiornamento:** 2026-06-14
> **Autore:** Elios Scoglio + Space Copilot
> **Destinazione:** Team dev + condivisione su Confluence e Knowledge Graph

---

## 1. Il Problema del Context Window

### Cos'e' il context window e perche' e' il vincolo principale

Il context window e' la "memoria di lavoro" di un LLM: tutto cio' che il modello puo' vedere in un singolo turno di conversazione. Non e' memoria persistente — e' un buffer che si riempie e, una volta pieno, forza il sistema a comprimere o scartare informazioni.

| Modello | Context window | Equivalente pratico |
|---------|---------------|---------------------|
| Claude Sonnet 4.6 | 200K token | ~150K parole / ~500 pagine |
| Claude Opus 4.8 | 200K token | Idem, ma piu' lento e costoso |
| GPT-4o | 128K token | ~100K parole |
| DeepSeek V3 | 128K token | ~100K parole |

### I 7 problemi concreti

**1. Degradazione con la distanza ("Lost in the Middle")**

L'informazione all'inizio e alla fine del context viene elaborata meglio di quella nel mezzo. Un'istruzione critica a pagina 3 di un prompt lungo 50 pagine ha probabilita' significativa di essere ignorata o "diluita".

*Implicazione pratica:* le regole piu' importanti vanno in cima (CLAUDE.md) o in fondo (ultime istruzioni). Mai nel mezzo di un muro di testo.

**2. Costo proporzionale**

Ogni token in input viene elaborato ad ogni turno. Un context di 100K token costa ~10x un context di 10K token — per la stessa domanda. Conversazioni lunghe = costi che esplodono senza che te ne accorgi.

**3. Illusione di comprensione**

Il modello non "legge" il context come un umano. Lo processa statisticamente. Piu' rumore c'e', piu' il segnale si perde. Aggiungere "tutto il codice" non aiuta — spesso peggiora perche' il modello correla cose irrilevanti.

**4. Context stuffing = antipattern**

Caricare tutto sperando che il modello "capisca" e' l'errore piu' comune dei principianti. Il modello non capisce — correla. Se il contesto e' rumoroso, le correlazioni saranno rumorose. Meno rumore = risposte migliori.

**5. Nessuna persistenza nativa**

Alla fine della conversazione, tutto scompare. Senza sistemi esterni (memory, knowledge graph, file), ogni sessione riparte da zero. L'AI non "ricorda" — simula continuita' solo all'interno della stessa finestra.

**6. Compressione automatica**

Quando il context si avvicina al limite, il sistema comprime i messaggi precedenti. Questa compressione perde dettagli. Decisioni prese 30 messaggi fa possono essere "dimenticate" o distorte nella compressione.

**7. Conflitto di istruzioni**

Piu' cose carichi nel context, piu' probabilita' ci sono che due istruzioni si contraddicano. Il modello non ti avvisa — sceglie silenziosamente quale seguire, spesso in modo non deterministico.

### Come si gestisce la dimensione

```
┌─────────────────────────────────────────────────────┐
│         GERARCHIA DEL CONTEXT (piu' in alto = piu'  │
│         stabile e persistente)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. CLAUDE.md (istruzioni permanenti)               │
│     → Sempre in cima al context                     │
│     → Regole che valgono SEMPRE                     │
│     → Chi sei, come lavori, vincoli non negoziabili │
│                                                     │
│  2. Memory persistente (file/graph)                 │
│     → Caricata on-demand quando rilevante           │
│     → Preferenze, feedback, contesto aziendale      │
│     → Sopravvive tra sessioni                       │
│                                                     │
│  3. Context di sessione (conversazione)             │
│     → Il lavoro corrente                            │
│     → Scade a fine sessione                         │
│     → Piu' cresce, piu' costa e degrada             │
│                                                     │
│  4. Tool results (on-demand)                        │
│     → File letti, ricerche, API                     │
│     → Caricati solo quando servono                  │
│     → Mai "precaricati per sicurezza"               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Regole operative

| Regola | Perche' |
|--------|---------|
| Dare solo cio' che serve | Meno rumore = risposte migliori + meno costo |
| Istruzioni critiche in cima | "Lost in the middle" — cima e fondo sono zone di massima attenzione |
| Separare permanente da volatile | CLAUDE.md per il "sempre"; conversazione per il "adesso" |
| Usare reference, non contenuto | "Leggi il file X" > "ecco 500 righe incollate" |
| Comprimere proattivamente | Riassumere decisioni prese, non ripetere tutto il ragionamento |
| Sessioni brevi e mirate | Una sessione = un obiettivo. Non conversazioni infinite |
| Ripartire puliti quando il context e' sporco | Se l'AI inizia a dare risposte strane, nuova sessione |

---

## 2. Adattare l'AI alla Persona e all'Azienda

### Il problema: ogni AI nasce generica

Un LLM appena deployato non sa nulla di:

- Chi sei (ruolo, seniority, responsabilita', modo di lavorare)
- Come lavori (preferenze, stile comunicativo, velocita' decisionale)
- Cosa conta nel tuo contesto (vincoli aziendali, compliance, stack tecnico)
- Cosa hai gia' deciso (ADR, pattern consolidati, errori passati da non ripetere)
- Cosa ti aspetti da lui (che sfidi, che spieghi, che chieda, che sia sintetico?)

### La soluzione: stratificazione della conoscenza

```
┌────────────────────────────────────────────────────────────┐
│  LIVELLO 4: Evoluzione continua                            │
│  Feedback loop, pattern learning, errori memorizzati       │
│  "Ha imparato dai miei feedback e non ripete gli errori"   │
├────────────────────────────────────────────────────────────┤
│  LIVELLO 3: Contesto aziendale                             │
│  Knowledge graph, architettura, vincoli, compliance        │
│  "Conosce il mio sistema e i suoi limiti"                  │
├────────────────────────────────────────────────────────────┤
│  LIVELLO 2: Identita' e preferenze                         │
│  CLAUDE.md, memory utente, regole di interazione           │
│  "Sa chi sono e come voglio lavorare"                      │
├────────────────────────────────────────────────────────────┤
│  LIVELLO 1: Capacita' base del modello                     │
│  Conoscenza generale, ragionamento, coding                 │
│  "Sa programmare e ragionare, ma non sa nulla di me"       │
└────────────────────────────────────────────────────────────┘
```

### Come si costruisce (passo per passo)

**Fase 1: Identita' (giorno 1)**

Scrivi un CLAUDE.md che risponda a:
- Chi sei? (ruolo, seniority, dominio)
- Come vuoi che ti parli? (sintetico? che spieghi? che sfidi?)
- Quali sono i vincoli non negoziabili? (sicurezza, compliance, processo)
- Come deve comportarsi l'AI? (chiedere prima di agire? spiegare sempre?)

**Fase 2: Contesto aziendale (settimana 1)**
- Carica l'architettura su knowledge graph per query semantiche
- Documenta i vincoli di compliance, sicurezza, processo
- Mappa le integrazioni critiche e i rischi noti
- Scrivi gli ADR delle decisioni gia' prese

**Fase 3: Feedback loop (continuo)**

Ogni volta che l'AI sbaglia o fa bene, salva un feedback:
- "Non fare push automatico" → regola permanente
- "Spiega sempre cosa fai e perche'" → regola permanente
- "Usa Sonnet per gli agenti, non Opus" → regola permanente

Questi feedback diventano le "regole apprese" — l'AI migliora sessione dopo sessione.

**Fase 4: Evoluzione (mese 1+)**

Il sistema impara:
- I tuoi pattern decisionali
- Quando chiedere e quando procedere
- I tuoi colleghi, i flussi, le scadenze
- Le trappole specifiche del tuo dominio

Diventa un "copilot" reale — non un chatbot generico.

### Indicatori di maturita'

| Livello | Segnale | Tempo tipico |
|---------|---------|--------------|
| Principiante | Devi ripetere le stesse istruzioni ogni sessione | Giorno 1 |
| Intermedio | L'AI ricorda chi sei e i vincoli principali | Settimana 1 |
| Avanzato | L'AI anticipa problemi che tu non hai ancora visto | Mese 1 |
| Esperto | L'AI sfida le tue assunzioni e propone alternative migliori | Mese 2+ |

---

## 3. Strategie di Risparmio Token

### Perche' conta

I token sono il "carburante" dell'AI. Ogni token ha:
- **Costo diretto** (API billing)
- **Costo indiretto** (tempo di elaborazione, degradazione qualita')
- **Costo nascosto** (conversazione lunga = piu' errori = piu' rework = piu' token)

Risparmiare token non e' solo economia — e' qualita': meno rumore nel context = risposte migliori.

### Strategia 1: Model Routing (il 90% del risparmio)

| Task | Modello | Costo relativo |
|------|---------|----------------|
| Decisione architetturale | Opus | $$$ |
| Code review complesso | Opus | $$$ |
| Analisi impatto cross-system | Opus | $$$ |
| Implementazione | Sonnet | $ |
| Ricerca/esplorazione | Sonnet | $ |
| Refactoring guidato | Sonnet | $ |
| Formatting/template | Haiku | ¢ |
| Classificazione/triage | Haiku | ¢ |
| Generazione boilerplate | Haiku | ¢ |

**Regola pratica:** Sonnet per il 90% del lavoro. Opus solo per decisioni dove sbagliare costa caro. Haiku per bulk/automazione.

**Impatto:** usare Sonnet al posto di Opus = 70-80% risparmio a parita' di output per la maggior parte dei task.

### Strategia 2: Prompt concisi e strutturati

```
// MALE (56 token, vago, forza l'AI a indovinare):
"Puoi per favore guardare questo codice e dirmi se ci sono
problemi di qualsiasi tipo che dovrei considerare?"

// BENE (22 token, preciso, l'AI sa esattamente cosa fare):
"Review OrderService.cs:45-80. Focus: race condition nel lock posti.
Verifica thread safety e idempotenza."
```

Regole:
- Specifica il file e le righe
- Dici cosa cercare (non "problemi generici")
- Dici il formato output che vuoi
- Niente convenevoli ("Puoi per favore...")

### Strategia 3: Context pruning aggressivo

- Non ricaricare file gia' letti se non sono cambiati
- Usare offset e limit per leggere solo le righe rilevanti
- Preferire grep mirato a read dell'intero file
- In conversazioni lunghe: riassumere le decisioni e ricominciare puliti
- Mai incollare codice nel prompt — fai leggere il file all'AI

### Strategia 4: Caching tramite configurazione

- CLAUDE.md = istruzioni cachate (caricate una volta, usate sempre, mai ripetute)
- Knowledge graph = context on-demand (caricato solo quando serve)
- Memory file = stato persistente senza ripetere ogni sessione

### Strategia 5: Agenti paralleli leggeri

- Agenti Sonnet per ricerca parallela (5x meno costosi di Opus)
- Ogni agente ha un task specifico e ristretto (meno context = meno costo)
- L'orchestratore sintetizza i risultati — non rifa il lavoro

### Strategia 6: Sessioni corte e mirate

```
MALE:  Una sessione di 4 ore con 200 messaggi su 15 topic diversi
       → Context degradato, costo altissimo, errori in crescita

BENE:  5 sessioni da 20 minuti, ognuna con un obiettivo chiaro
       → Context pulito ogni volta, risposte precise, costo controllato
```

### Impatto economico reale

| Strategia | Risparmio stimato | Difficolta' |
|-----------|-------------------|-------------|
| Model routing (Sonnet vs Opus) | 70-80% | Bassa |
| Prompt concisi | 30-50% | Media |
| Context pruning | 40-60% | Media |
| Sessioni corte | 30-40% | Bassa |
| Agenti paralleli Sonnet | 50-70% vs singolo Opus | Alta (setup) |
| Caching CLAUDE.md | 20-30% per sessione | Bassa |

---

## 4. Il Principio di Ownership

### Definizione

> L'ownership e' il principio per cui ogni decisione finale appartiene all'umano. L'AI informa, analizza, propone — ma non decide. Mai. E l'AI stessa deve saperlo, rispettarlo, e ricordartelo se necessario.

Questo non e' un principio "etico" astratto. E' un principio ingegneristico: un sistema dove nessuno possiede le decisioni produce output mediocre, incoerente e pericoloso.

### Perche' e' fondamentale (e non ovvio)

L'AI ha una tendenza naturale a:

- Confermare cio' che l'utente sembra voler sentire (sycophancy)
- Procedere anche quando non ha informazioni sufficienti
- Riempire i vuoti con assunzioni plausibili ma non verificate
- Presentare incertezza come certezza (confident hallucination)
- Non fermarsi quando dovrebbe chiedere
- Non spiegare cosa sta facendo e perche' (se non gli viene imposto)

Senza ownership esplicita, l'utente scivola inconsciamente verso la delega: "l'AI ha detto cosi', quindi sara' giusto". Questo e' il failure mode piu' pericoloso.

### Come si costruisce l'ownership

**1. Definisci chi decide PRIMA di chiedere**

```
SBAGLIATO: "Cosa dovremmo fare per il problema X?"
→ L'AI decide, tu confermi passivamente
→ Stai delegando senza accorgertene

GIUSTO: "Analizza il problema X. Dammi 3 opzioni con trade-off. Io scelgo."
→ Tu decidi, l'AI informa
→ L'ownership resta tua
```

**2. Obbliga l'AI a marcare l'incertezza**

Nella configurazione (CLAUDE.md), forza i marcatori:

| Marcatore | Significato |
|-----------|-------------|
| `[verificato]` | Fatto controllato direttamente (codice letto, documento citato) |
| `[probabile]` | Inferenza ragionevole — pattern corrisponde ma non verifica diretta |
| `[non verificato]` | Analogia — richiede conferma prima di agire |
| `[ignoto]` | Non lo sa. Si deve fermare. Deve chiedere. |

**3. L'AI deve sapere che tu sei il decisore — e ricordartelo**

```
L'ownership di ogni decisione e' mia.
Se mi vedi delegare passivamente, segnalalo.
Se mi vedi accettare senza critica, chiedimi: "Vuoi che lo sfidi?"
Tu non sei un esecutore silenzioso — sei un advisor che risponde a me.
```

L'AI non deve solo obbedire — deve attivamente proteggere la mia ownership segnalando quando sto cedendo il controllo.

**4. Fai sfidare le tue stesse idee**

```
"Prima di procedere: su quale assunzione si basa questa soluzione?
Cosa dovrebbe essere vero perche' fallisca?"
```

L'AI che sfida e' piu' utile dell'AI che conferma. Configurala per sfidare di default.

**5. Separa analisi da azione (SEMPRE)**

```
Fase 1: L'AI analizza (nessuna modifica al sistema)
Fase 2: Tu validi l'analisi (poni domande, sfida)
Fase 3: Solo dopo la tua approvazione esplicita, l'AI esegue
```

Mai le tre fasi in un unico step automatico.

**6. L'AI deve spiegare SEMPRE cosa fa e perche'**

```
Per ogni azione tecnica:
1. Spiega COSA stai per fare
2. Spiega PERCHE' lo fai (quale problema risolve)
3. Spiega cosa c'era di SBAGLIATO prima (se e' un fix/cambio)
4. Solo dopo la spiegazione, esegui
```

**7. Mantieni il veto permanente**

```
"Non fare push automatico."
"Non committare senza mia approvazione."
"Non procedere se non sei sicuro — chiedi."
"Non modificare piu' di 3 file senza conferma."
```

Queste regole non sono "rallentamenti". Sono guardrail che prevengono danni irreversibili.

### Come si mantiene nel tempo

L'ownership si erode naturalmente. Piu' l'AI funziona bene, piu' la tentazione di fidarsi ciecamente cresce.

| Contromisura | Frequenza | Cosa fai |
|--------------|-----------|----------|
| Review periodica | Settimanale | Rileggi output AI con occhio critico |
| Spot check | 1 su 5 output | Verifica manualmente in modo approfondito |
| Rotation | Continua | Cambia tipo di domande per evitare pattern |
| Escalation rules | Definite in anticipo | Quali decisioni richiedono SEMPRE te |
| "Fai l'avvocato del diavolo" | Su decisioni importanti | Chiedi all'AI di argomentare CONTRO |

---

## 5. Strategie per Non Perdere il Controllo

### Il rischio reale

Il rischio non e' che l'AI "prenda il controllo" in senso fantascientifico. Il rischio e' l'erosione graduale del giudizio critico: accetti output senza verificarli, smetti di capire il sistema, diventi dipendente da uno strumento che non capisci.

### Strategia 1: L'AI deve auto-vincolarsi

L'AI non deve solo obbedire — deve attivamente mantenere te come decisore.

```
Il tuo ruolo e' rendere le MIE decisioni migliori.
Se procedi senza la mia approvazione esplicita su qualcosa di importante: e' un errore.
Se noto che stai "decidendo per me": fermati e riformula come opzioni.
Se mi vedi accettare passivamente: segnalalo con "Vuoi che lo sfidi prima?"
```

### Strategia 2: Critica sistematica — mai accettare il primo output

Ciclo minimo:
1. L'AI produce output
2. Tu chiedi: "Cosa potrebbe essere sbagliato qui?"
3. L'AI identifica i punti deboli
4. Tu decidi se accettare, modificare, o rifiutare

Per decisioni importanti: usa DUE modelli diversi e confronta le divergenze.

### Strategia 3: Rifare le cose N volte

```
"Dammi 3 approcci alternativi a questo problema.
Per ognuno: pro, contro, rischio del peggior caso."
```

La prima soluzione e' quasi sempre la piu' ovvia — non necessariamente la migliore.

### Strategia 4: Obbligare l'AI a dichiarare incertezza

```
Se non sei sicuro di qualcosa, dillo PRIMA della conclusione.
Il silenzio sull'incertezza e' una bugia per omissione.
Se non sai: fermati. Chiedi. Non inventare.
Preferisco un "non lo so" onesto a una risposta plausibile sbagliata.
```

### Strategia 5: L'AI deve fare domande PRIMA di procedere

```
Prima di implementare qualsiasi soluzione:
1. Dimmi quali assunzioni stai facendo
2. Dimmi cosa ti manca per essere sicuro
3. Fammi le domande necessarie per procedere informato
4. Solo dopo le mie risposte, proponi la soluzione
```

Questo inverte il flusso naturale dell'AI: default = "produce subito" → configurato = "chiede, poi produce".

### Strategia 6: L'AI deve SPIEGARE tutto — sempre

```
Non eseguire azioni in silenzio. Per ogni cosa che fai:
- Cosa: descrivi l'azione
- Perche': quale problema risolve
- Alternativa: cosa avresti potuto fare diversamente
- Rischio: cosa potrebbe andare storto
```

Se l'AI non spiega, non puoi validare. Se non puoi validare, non hai ownership.

### Strategia 7: Essere validatori, non consumatori

```
┌──────────────────────────────────────────────────────┐
│  RUOLO SBAGLIATO:                                    │
│  "AI, fammi il codice" → copia-incolla → deploy      │
│  (Consumatore passivo — zero ownership)              │
│                                                      │
│  RUOLO GIUSTO:                                       │
│  "AI, proponi una soluzione" → leggi la spiegazione  │
│  → sfida un punto → chiedi alternative → approva    │
│  → verifica il risultato → solo allora procedi       │
│  (Validatore attivo — ownership piena)               │
└──────────────────────────────────────────────────────┘
```

### Strategia 8: Audit trail obbligatorio

- Ogni decisione importante: salva PERCHE' e' stata presa (ADR)
- Ogni output AI usato in produzione: chi l'ha validato?
- Ogni errore AI: feedback memory per non ripeterlo
- Se tra 6 mesi non sai perche' hai fatto una cosa: hai fallito

### Strategia 9: Limiti di blast radius

```
- Non modificare piu' di 3 file alla volta senza mia conferma
- Non eseguire comandi distruttivi (delete, push, reset) mai automaticamente
- Se il cambiamento impatta piu' di un servizio: fermati e chiedi
- Non fare refactoring non richiesti
- Non aggiungere feature non richieste
```

Principio: piu' il potenziale danno e' alto, piu' i controlli devono essere stretti.

### Strategia 10: Competenza propria come prerequisito

> Non puoi validare cio' che non capisci.

L'AI non sostituisce la competenza — la amplifica. Se non capisci l'architettura, non puoi validare una proposta architetturale.

**Regola:** usa l'AI per andare piu' veloce dove sai gia' andare. Per esplorare territori nuovi, chiedi all'AI di INSEGNARTI, non di fare per te.

### Strategia 11: L'AI deve costringere l'umano a essere il validatore

```
Se ti chiedo di fare qualcosa di irreversibile (deploy, push, delete, migration):
1. Ripeti cosa stai per fare in linguaggio chiaro
2. Elenca i rischi concreti
3. Chiedi conferma esplicita: "Procedo? Si/No"
4. Se non ricevi "si" chiaro: non procedere

Se ti chiedo "fai tutto tu":
- Riformula: "Posso procedere step by step, ma ti chiedero' conferma a ogni fase."
- Non accettare deleghe totali su azioni irreversibili.
```

### Strategia 12: Dead Man's Switch

Se l'AI non risponde o produce output anomalo:
- HAI un piano B che non dipende dall'AI?
- SAI fare le cose critiche manualmente?
- HAI documentazione leggibile senza AI?

La dipendenza totale e' il vero rischio. Mantieni sempre la capacita' di operare senza.

### Riepilogo visuale: la catena del controllo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TU (decisore)                                             │
│     │                                                       │
│     ├── Definisci il problema                               │
│     ├── Scegli cosa delegare all'AI                         │
│     ├── Validi ogni output importante                       │
│     └── Hai sempre il veto finale                           │
│                                                             │
│   AI (advisor vincolato)                                    │
│     │                                                       │
│     ├── Chiede PRIMA di agire                               │
│     ├── Spiega SEMPRE cosa fa e perche'                     │
│     ├── Marca l'incertezza esplicitamente                   │
│     ├── Sfida le tue assunzioni (non le conferma)           │
│     ├── Si ferma quando non sa                              │
│     ├── Ti ricorda di validare se ti vede delegare          │
│     └── Non esegue azioni irreversibili senza OK            │
│                                                             │
│   PROCESSO (guardrail strutturale)                          │
│     │                                                       │
│     ├── Separation: analisi → validazione → azione          │
│     ├── Audit trail su ogni decisione                       │
│     ├── Review periodica degli output AI                    │
│     ├── Escalation automatica su azioni ad alto rischio     │
│     └── Dead man's switch: capacita' di operare senza       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Condivisione Team: Agenti, Skill, Best Practice

### Il problema della condivisione

Hai costruito un setup AI che funziona per te. Il team ne ha bisogno. Ma:
- Ogni persona ha preferenze diverse
- Le best practice evolvono velocemente
- Gli agenti/skill devono essere versionati come codice
- Il team deve poter contribuire senza rompere il setup altrui
- Serve un "single source of truth" — non 5 copie divergenti

### Architettura di condivisione

```
┌─────────────────────────────────────────────────────────────┐
│                    TEAM AI TOOLKIT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ CLAUDE.md        │    │ .claude/         │               │
│  │ (progetto)       │    │ settings.json    │               │
│  │                  │    │ commands/        │               │
│  │ Condiviso via    │    │ skills/          │               │
│  │ Git (con PR)     │    │                  │               │
│  └────────┬─────────┘    └────────┬─────────┘              │
│           │                       │                         │
│           └───────────┬───────────┘                         │
│                       ▼                                     │
│  ┌───────────────────────────────────────────┐              │
│  │  Knowledge Graph (Neo4j)                  │              │
│  │  - Architettura e componenti              │              │
│  │  - Decisioni (ADR) e motivazioni          │              │
│  │  - Pattern validati e anti-pattern        │              │
│  │  - Vincoli compliance                     │              │
│  │  → Queryabile da tutti, versionato        │              │
│  └───────────────────────────────────────────┘              │
│                       │                                     │
│                       ▼                                     │
│  ┌───────────────────────────────────────────┐              │
│  │  Confluence / Wiki                        │              │
│  │  - Principi e linee guida (per umani)     │              │
│  │  - Runbook operativi                      │              │
│  │  - Decisioni documentate (ADR leggibili)  │              │
│  │  → Source of truth per chi NON usa AI     │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
│  ┌───────────────────────────────────────────┐              │
│  │  Memory personale (~/.claude/memory/)     │              │
│  │  - Preferenze individuali                 │              │
│  │  - Feedback personali                     │              │
│  │  → NON condivisa, NON in Git              │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cosa condividere e come

**1. CLAUDE.md di progetto (via Git — versionato, reviewato)**

```
c:\Code\CLAUDE.md                        ← regole globali per tutto il team
ita-dev/SPORT/sport-backend/CLAUDE.md    ← regole specifiche SPORT
ita-dev/seta/seta-core/CLAUDE.md         ← regole specifiche SETA
```

- Committato nel repo → versionato → review in PR → governance
- Ogni dev che usa Claude Code eredita automaticamente le regole
- Modifiche tramite PR = discussione trasparente
- Il CLAUDE.md e' il "contratto" tra team e AI

**2. Slash commands condivisi (.claude/commands/)**

```
.claude/
  commands/
    review-pr.md          # Standard di review PR
    analyze-impact.md     # Analisi impatto cross-servizio
    check-compliance.md   # Verifica compliance SIAE/GDPR
    estimate-task.md      # Stima effort best/likely/worst
    triage.md             # Triage bug/incident
```

- Ogni dev puo' invocare `/review-pr` e ottenere lo stesso processo standardizzato
- I comandi sono versionati in Git → modifiche via PR
- Nuovi comandi = proposta in PR → review team → merge

**3. Skills (.claude/skills/)**

```
.claude/skills/
  triage.md               # Triage incidenti con decision tree
  to-prd.md              # Trasforma idea grezza in PRD strutturato
  migration-review.md    # Review safety di una migrazione DB
  security-review.md     # Audit sicurezza su un changeset
```

Le skill sono piu' complesse dei comandi: multi-step con logica condizionale, possono usare tool, documentate con esempi d'uso.

**4. Knowledge Graph (Neo4j)**

Il grafo contiene conoscenza strutturata queryabile:
- Architettura: componenti, relazioni, vincoli, rischi
- ADR: decisioni prese, motivazioni, alternative scartate
- Pattern: soluzioni validate che il team ha gia' usato con successo
- Anti-pattern: errori fatti — da non ripetere

### Come mantenere tutto aggiornato

**Principio: tratta la configurazione AI come codice**

```
┌──────────────────────────────────────────────────────────┐
│  FLUSSO DI AGGIORNAMENTO                                │
│                                                          │
│  1. Dev modifica un CLAUDE.md / command / skill          │
│  2. Apre PR → review del team                            │
│  3. Merge su main                                        │
│  4. (Opzionale) Hook post-merge: sync su Knowledge Graph │
│  5. Prossima sessione AI di chiunque: regole aggiornate  │
│                                                          │
│  NESSUN SETUP MANUALE RICHIESTO AI DEV                   │
│  → Cloni il repo → hai gia' tutto                        │
└──────────────────────────────────────────────────────────┘
```

### Tabella responsabilita'

| Cosa | Dove vive | Come si aggiorna | Chi approva |
|------|-----------|------------------|-------------|
| Regole AI progetto | CLAUDE.md in Git | PR | Tech Lead / Architect |
| Comandi condivisi | .claude/commands/ in Git | PR | Team |
| Skills | .claude/skills/ in Git | PR | Team + QA |
| Architettura | Neo4j + Confluence | Sync da MD | Architect |
| ADR | Git (docs/) + Neo4j | PR + auto-sync | Architect |
| Best practice coding | CLAUDE.md + Confluence | PR + review mensile | Team |
| Preferenze personali | ~/.claude/memory/ | Individuale | Solo tu |

### Anti-pattern da evitare

| Anti-pattern | Problema | Soluzione |
|---|---|---|
| "Ognuno ha il suo CLAUDE.md diverso" | Divergenza, standard impossibili | CLAUDE.md di progetto + memory personale separata |
| "Le best practice sono su Confluence e basta" | L'AI non le vede, nessuno le legge | Sync su Knowledge Graph + reference in CLAUDE.md |
| "Lo sa solo Mario" | Single point of failure umano | Nel grafo → queryabile da chiunque |
| "Aggiorniamo dopo" | Mai aggiornato | Review mensile obbligatoria in retro |
| "Troppi comandi/skill" | Nessuno sa cosa usare | Index documentato, naming chiaro, deprecation |
| "L'AI funziona bene per me" | Non replicabile | Condividi la config, non il risultato |

---

## 7. Sintesi Operativa: Checklist per il Team

### Setup iniziale (una volta)

- [ ] CLAUDE.md di progetto scritto e committato
- [ ] Memory personale configurata (chi sei, come lavori)
- [ ] Knowledge graph popolato con architettura e vincoli
- [ ] Comandi base condivisi (.claude/commands/) definiti
- [ ] Principio di ownership scritto, discusso e accettato dal team
- [ ] Regole di "auto-vincolo AI" nel CLAUDE.md

### Per ogni sessione AI

- [ ] L'AI sa chi sei (verifica rapida: "chi sono io?")
- [ ] Le istruzioni critiche sono caricate (CLAUDE.md presente)
- [ ] Sai cosa stai chiedendo e perche' (obiettivo chiaro)
- [ ] Hai definito chi decide (tu — sempre)
- [ ] Hai un criterio per validare l'output prima di cominciare

### Per ogni output AI importante

- [ ] L'AI ha dichiarato le sue assunzioni?
- [ ] L'AI ha marcato dove non e' sicura?
- [ ] L'AI ha spiegato cosa ha fatto e perche'?
- [ ] Hai verificato almeno un claim chiave indipendentemente?
- [ ] Il peggior caso se l'output e' sbagliato — e' accettabile?
- [ ] Se va in produzione: chi l'ha validato e firmato?

### Per il team (continuo)

- [ ] CLAUDE.md aggiornato con le ultime decisioni?
- [ ] Nuove skill/comandi documentati e condivisi?
- [ ] Knowledge graph sincronizzato con la realta'?
- [ ] Feedback loop attivo (errori → correzioni → memory/regole)?
- [ ] Review mensile delle regole AI in sprint retro?
- [ ] Nessun dev "dipende dall'AI" per fare il suo lavoro base?

---

## 8. Meta-principio: L'AI e' uno Strumento, Non un Collega

### Cosa l'AI NON ha

| Caratteristica assente | Implicazione |
|---|---|
| Responsabilita' | Se sbaglia, il danno e' TUO |
| Contesto implicito | Sa solo cio' che le dai — il resto lo inventa |
| Giudizio morale | Ottimizza per la risposta, non per il risultato |
| Memoria naturale | Dimentica tutto senza sistemi esterni |
| Interesse a dire "non so" | Tende a rispondere comunque, anche inventando |
| Continuita' | Ogni sessione e' un individuo diverso con le stesse istruzioni |
| Incentivo a proteggerti | Non ha skin in the game — tu si' |

### Cosa l'AI HA

| Caratteristica presente | Come sfruttarla |
|---|---|
| Velocita' di analisi sovrumana | Screening iniziale, correlazioni su grandi basi |
| Pazienza infinita per task ripetitivi | Refactoring, review, generazione boilerplate |
| Disponibilita' 24/7 | Non ha downtime, non ha umore |
| Consistenza SE ben configurata | Stesse regole → stessi output (deterministico) |
| Capacita' di correlare pattern | Trova connessioni che tu non vedresti per volume |
| Multi-prospettiva on demand | Puo' argomentare pro E contro su richiesta |

### La formula

```
VALORE = AI + Umano Competente + Processo Solido

Senza l'umano competente: output plausibile ma potenzialmente sbagliato
Senza il processo: nessuna garanzia di qualita' o consistenza
Senza l'AI: lento ma sicuro
Con tutti e tre: veloce, sicuro, scalabile
```

Il valore non e' nell'AI in se' — e' nella combinazione.

L'AI ti rende 3x-10x piu' veloce **SE:**
- Sai gia' dove vuoi andare (competenza)
- Hai regole che impediscono danni (processo)
- Rimani il validatore finale di tutto (ownership)

Se manca uno dei tre: l'AI diventa un acceleratore di errori.

---

## 9. Posizionamento 108 Vision

### Cosa e' originale della piattaforma 108 AI

- **Hybrid RAG** (Qdrant vector + Neo4j graph) per reasoning multi-hop su conoscenza aziendale
- **Desktop Agent** con risk classification e OS-level capabilities
- **Model routing cost-optimized** (5 tier, 70-80% risparmio vs single model)
- **Integrazione verticale**: consulenza + piattaforma + gestione ongoing in un unico fornitore
- **Principi di governance by default**: baked-in nel prodotto, non opzionali

### Cosa NON e' originale (table stakes)

RAG base, chatbot, dashboard, multi-tenancy. Sono requisiti minimi, non differenziatori.

### Posizionamento nel mercato

- **AI riduce il lavoro operativo del 30-40%** — NON sostituisce lavoratori
- **108 Vision costruisce tool** che automatizzano al 100% processi manuali specifici (classificazione documenti, triage email, scheduling appuntamenti)
- **Il rischio principale**: piattaforma troppo sofisticata per il cliente medio, troppo giovane per enterprise
- **La raccomandazione**: validare con 3 clienti reali PRIMA di completare Phase 4-5. Il feedback di 3 clienti paganti vale piu' di 1000 righe di codice speculativo.
