# STUDIO — Fractional CTO
**Autore:** Elios Scoglio | **Data:** 2026-05-27 | **Versione:** 1.0

> *"Il CTO che non puoi permetterti? Forse puoi."*
> Questo manuale è il tuo campo di addestramento per diventare il CTO part-time che le aziende cercano senza saperlo.

---

## Come usare questo manuale

Leggilo come un corso. Ogni parte ha:
- La spiegazione di **cosa** e **perché**
- Un **esempio pratico** con personaggio inventato (ma situazione reale)
- Un box **Attenzione!** con le trappole
- Un box **Tip da campo** con i consigli che funzionano
- **Domande di verifica** — rispondile prima di andare avanti

---

## Parte 1 — Cos'è un Fractional CTO (e cosa NON è)

### La definizione semplice

Un **Fractional CTO** è un Chief Technology Officer che lavora per un'azienda a tempo parziale — tipicamente 2, 4 o 8 giorni al mese — portando la stessa visione strategica e leadership tecnica di un CTO interno, ma senza il costo di un full-time.

"Fractional" = "frazionato". Non è uno stagista. Non è un consulente che ti scrive un report e sparisce. È un leader tecnico che si siede al tavolo delle decisioni, capisce il business, e guida le scelte tecnologiche con responsabilità continuativa.

### Cosa FA un Fractional CTO

- Definisce la strategia tecnologica allineata al business
- Guida le scelte architetturali (non le implementa lui stesso)
- Gestisce e sviluppa il team tecnico (hiring, performance, cultura)
- Parla con investitori, board, clienti enterprise quando serve autorevolezza tecnica
- Identifica e riduce il debito tecnico
- Supervisiona vendor, outsourcing, contratti tecnici
- Costruisce processi di delivery affidabili

### Cosa NON FA un Fractional CTO

- Non scrive codice (o se lo fa, è un segnale di allarme)
- Non è il senior developer che "risolve i bug difficili"
- Non è il project manager del team
- Non è un consulente che produce slide e se ne va

> **Attenzione!** La confusione più comune: il cliente pensa di assumere "il developer più bravo a meno soldi". Tu devi chiarire subito che il valore è nella DIREZIONE, non nell'esecuzione. Se il cliente vuole qualcuno che scriva codice, non è il tuo cliente giusto (o almeno non per questo track).

> **Tip da campo** — Nei primi 30 giorni, non toccare il codice. Nemmeno per "dare un'occhiata veloce". Appena lo fai, diventi il developer senior nel cervello del cliente, non il CTO.

### La distinzione con il consulente tecnico classico

| Consulente tecnico | Fractional CTO |
|---|---|
| Progetto delimitato nel tempo | Relazione continuativa |
| Deliverable specifico (report, architettura) | Responsabilità ongoing |
| Lavora su un problema definito | Lavora sul sistema nel suo complesso |
| Non gestisce persone | Spesso gestisce il team direttamente |
| Si vende a giornata | Si vende a retainer mensile |
| Entrata ed uscita chiara | Fa parte del management team |

### Domande di verifica

1. Qual è la differenza pratica tra un FCTO e un senior developer a contratto?
2. Se un cliente ti chiede di "dare un'occhiata al codice legacy e sistemarlo", che risposta dai?
3. Un FCTO ha senso per un'azienda con già un CTO interno? In quali circostanze?

---

## Parte 2 — Chi ha davvero bisogno di un FCTO

### Il profilo ideale del cliente FCTO

Non tutte le aziende sono clienti FCTO. Il profilo perfetto è uno di questi:

**1. La startup post-seed / pre-Serie A**
Ha 5-15 developer, un CTO fondatore che ora è diventato CEO de facto, e non c'è nessuno che pensi davvero alla direzione tecnica. Il prodotto cresce ma l'architettura no.

**2. La startup Serie A/B senza CTO**
Ha investito, ha soldi, deve scalare il team da 10 a 30+ persone in 12 mesi, ma non sa come. Assumere un CTO senior costa 150.000-200.000€/anno + equity. Non è pronta. Ha bisogno di una guida ora.

**3. La scale-up con debito tecnico critico**
L'azienda ha 50+ persone, il prodotto funziona ma rallenta. Gli sviluppatori passano più tempo a combattere il codice che a fare feature. Serve qualcuno che dica ad alta voce "dobbiamo fermarci e sistemare" e abbia l'autorità per farlo.

**4. La PMI tech in transizione**
Un'azienda manifatturiera o di servizi che sta diventando una software company. Ha comprato un prodotto in-house, ha assunto 3 developer, non sa come gestirli e dove andare.

**5. L'azienda che deve assumere un CTO**
Ha bisogno di un CTO, lo sta cercando, ma il processo durerà 6-12 mesi. Nel frattempo, chi tiene il timone? Il FCTO fa il bridge.

### I segnali che un'azienda ha bisogno di te

Questi sono i campanelli d'allarme che senti durante la discovery call:

- "Il nostro senior developer decide tutto da solo e abbiamo paura di perderlo"
- "Le release sono una sofferenza — ogni deploy è un evento"
- "Non sappiamo quanto ci costa fare una nuova feature"
- "Abbiamo tantissimo codice legacy che nessuno capisce più"
- "Il team è cresciuto ma non siamo diventati più veloci"
- "Gli investitori ci chiedono della roadmap tecnica e non sappiamo cosa rispondere"
- "Vogliamo assumere developer ma non sappiamo come valutarli"
- "Ogni integrazione con sistemi esterni diventa un progetto"

**Esempio — Startup "CloudFarm" (agricoltura di precisione)**

Marco, CEO di CloudFarm (Serie A, 8M€ raccolti), ha assunto 12 developer in 18 mesi. Il CTO fondatore Andrea è esaurito: passa metà del tempo in call con gli investitori, l'altra metà a "sistemare cose" perché il team non riesce a procedere senza di lui. L'architettura del prodotto è quella scritta in un weekend nel 2021. Marco ha capito che serve qualcuno. Cerca un CTO ma non riesce ad assumerne uno senior perché non sa valutarli. Entra il FCTO.

> **Attenzione!** Il cliente che NON vuoi: l'imprenditore che vuole un FCTO per "controllare" il team tecnico di cui non si fida. Questo non è un problema tecnico — è un problema di fiducia e di organizzazione. Il FCTO non è il babysitter degli sviluppatori. Se questa è la richiesta, diagnostica il problema reale prima di accettare.

> **Tip da campo** — Chiedi sempre: "Se tra 12 mesi tutto è andato bene, cosa è cambiato nella vostra azienda?" La risposta ti dice se il problema è tecnico (hai valore) o relazionale (hai un problema diverso).

### Domande di verifica

1. Descrivi il profilo di 3 clienti ideali FCTO in settori diversi.
2. Quali sono 5 segnali d'allarme che senti durante una discovery call?
3. Qual è il cliente che dovresti rifiutare e perché?

---

## Parte 3 — Il Messaggio di Vendita

### Il posizionamento core

Il messaggio centrale del track FCTO è:

> *"Il CTO che non puoi permetterti? Forse puoi."*

È un messaggio che gioca sul paradosso: il cliente pensa che un CTO senior sia fuori portata. Tu dimostri che non lo è — con un modello diverso.

### Come si costruisce il pitch FCTO in 60 secondi

**Il problema dichiarato:** "La tua azienda sta crescendo ma le decisioni tecniche vengono prese senza una strategia chiara."

**Il costo nascosto:** "Ogni mese senza direzione tecnica ti costa in debito tecnico, developer frustrati, feature ritardate e decisioni di architettura che tra 18 mesi ti costeranno il triplo da rifare."

**La soluzione:** "Un CTO senior che dedica 2-8 giorni al mese alla tua azienda, con responsabilità reale sulle decisioni tecniche, senza il costo di un full-time."

**La prova:** (qui metti la tua esperienza specifica — anni, aziende, problemi risolti)

**La call to action:** "Ti propongo una call di 45 minuti. Gratis. Ti dico onestamente se posso aiutarti."

### I tre messaggi per tre clienti diversi

**Per la startup pre-Serie A:**
"Hai un team tecnico che cresce ma non hai nessuno che pensi all'architettura del domani. Io faccio questo — 2 giorni al mese, con responsabilità reale sulle scelte che conteranno quando avrai 10x gli utenti."

**Per la scale-up con debito tecnico:**
"Il tuo team passa più tempo a lottare con il codice che a fare nuove feature. Non è colpa dei developer — è un problema di architettura. Io identifico i nodi critici e guido il piano per uscirne, senza fermare la produzione."

**Per la PMI in transizione tech:**
"Hai appena investito in software e hai un piccolo team tecnico che non sai come gestire. Io porto la struttura che manca: processi, metriche, cultura del codice — senza assumere un CTO a tempo pieno che non potresti permetterti."

> **Attenzione!** Evita il messaggio generico "aiuto le aziende a migliorare la tecnologia". È troppo vago e non dice perché sei tu e non chiunque altro. Il posizionamento FCTO funziona quando è specifico: tipo di azienda, tipo di problema, tipo di risultato.

> **Tip da campo** — Su LinkedIn, il contenuto FCTO che performa meglio non è "offro servizi di Fractional CTO". È la storia: "Ho aiutato una startup a dimezzare il tempo di deploy in 90 giorni — ecco cosa abbiamo fatto." Il caso concreto vale 10 slide di presentazione.

### Domande di verifica

1. Scrivi il tuo pitch FCTO in 60 secondi per una startup B2B SaaS di 20 persone.
2. Qual è il "costo nascosto" che rende urgente il problema per il cliente?
3. Come spieghi il valore del FCTO a un CEO che non ha mai avuto un CTO?

---

## Parte 4 — La Discovery Call FCTO

### L'obiettivo della call

La discovery call non è una vendita — è una diagnosi. Il tuo obiettivo è:
1. Capire se c'è un problema reale che puoi risolvere
2. Capire se il cliente è pronto a lavorare con te (budget, autonomia, fiducia)
3. Capire quale tier di servizio ha senso

Se la call finisce con "non sei il cliente giusto per me", hai fatto un ottimo lavoro.

### La struttura della call (45 minuti)

**Minuti 0-5: Warm up**
Non parlare di te. Fai domande aperte sull'azienda, il prodotto, il team.
"Raccontami dell'azienda — da dove siete partiti, dove siete oggi."

**Minuti 5-20: Il problema tecnico reale**
Vai in profondità. Non fermarti alla prima risposta.

Domande chiave:
- "Come funziona oggi il processo di rilascio di una nuova feature?"
- "Chi prende le decisioni tecniche? Come vengono prese?"
- "Qual è il problema tecnico che vi fa perdere più tempo ogni settimana?"
- "C'è qualcosa nel codice o nell'architettura che ti fa paura?"
- "Quante volte all'anno avete avuto un'interruzione del servizio?"
- "Quando è stata l'ultima volta che avete fatto una scelta tecnica e poi l'avete rimpianta?"

**Minuti 20-30: Il contesto organizzativo**
- "Com'è strutturato il team tecnico oggi?"
- "Quali figure tecniche hai già?"
- "Hai avuto esperienza con consulenti tecnici in passato? Com'è andata?"
- "Quanto il tema tecnico è importante per il board / per gli investitori?"

**Minuti 30-40: Il futuro e le aspettative**
- "Tra 12 mesi, cosa deve essere cambiato perché tu dica 'è stato un anno di successo'?"
- "Qual è la tua preoccupazione principale nel lavorare con un FCTO?"
- "Hai un budget in mente per questo tipo di supporto?"

**Minuti 40-45: Prossimi passi**
Non lanciare la proposta nella call. Concludi così:
"Ho capito abbastanza per capire se posso aiutarti. Ti preparo una proposta entro [2-3 giorni] con le opzioni. Poi ne parliamo e decidiamo insieme se ha senso andare avanti."

**Esempio — Call con Lucia, CEO di "RetailFlow" (software B2B)**

Lucia chiama perché "il team tecnico sembra bloccato". Dopo 10 minuti di domande emerge: il CTO di fatto è il lead developer Davide, che non comunica con il management, prende tutte le decisioni da solo e ha costruito un'architettura che solo lui capisce. Il team di 6 è frustrato. Lucia vuole "un CTO che porti ordine".

Elios capisce subito che il problema non è tecnico — è di leadership e dipendenza da una sola persona. Risponde: "Non ho bisogno di 45 minuti per dirti cosa fare. Il problema non è l'architettura — è che avete costruito una dipendenza da una persona. Dobbiamo affrontare quella. Posso aiutarti, ma voglio essere onesto: il primo mese sarà scomodo per tutti."

Lucia apprezza l'onestà. Il contratto si chiude.

> **Attenzione!** Non fare la diagnosi tecnica durante la call. "Il tuo problema è X, dovresti fare Y" detto gratis nella call vale zero. La diagnosi dettagliata è il tuo deliverable pagato — non il contenuto della vendita.

> **Tip da campo** — Fai silenzio dopo le domande difficili. Il silenzio crea spazio per le risposte vere. I CEO tendono a riempire il silenzio con la cosa che gli pesa davvero.

### Domande di verifica

1. Qual è l'obiettivo principale della discovery call (non è vendere)?
2. Fai roleplay: il CEO dice "il nostro problema è che il codice è lento". Quali 3 domande fai?
3. Cosa fai se a metà call capisci che il cliente non è adatto al FCTO?

---

## Parte 5 — I Primi 30/60/90 Giorni

### Perché i primi 90 giorni sono decisivi

Nei primi 90 giorni costruisci:
1. **La fiducia** — il cliente vede che sei diverso da un consulente normale
2. **La visibilità** — capisci davvero cosa c'è sotto il cofano
3. **Le quick win** — risultati visibili che giustificano il contratto
4. **Il posizionamento** — il team ti riconosce come guida, non come minaccia

### I Primi 30 Giorni: Ascolta, Non Fare

**Obiettivo:** capire tutto. Non cambiare nulla.

Attività:
- **Tech Audit** — revisione architetturale, codebase, infrastruttura, documenti esistenti
- **1:1 con tutto il team tecnico** — ogni singolo developer, in 45 minuti. Domanda centrale: "Cosa ti frena? Cosa funziona? Cosa cambieresti?"
- **1:1 con i leader non tecnici** — CEO, CPO, CFO. Capire il business davvero.
- **Osservare un ciclo di release completo** — dall'inizio alla fine
- **Leggere le post-mortem di incidenti passati** (se esistono)
- **Capire le metriche** — cosa misurano? Cosa ignorano?

**Deliverable fine mese 1:** Documento di "Stato dell'Arte" — onesto, senza diplomazia. Non per spaventare, ma per allineare la realtà percepita con la realtà effettiva.

> **Tip da campo** — Il documento di Stato dell'Arte è il tuo primo atto di leadership. Non essere gentile. Se l'architettura è un disastro, dillo in modo costruttivo ma chiaro. I leader rispettano l'onestà tecnica — è quello per cui ti pagano.

### I Giorni 31-60: Stabilizza e Pianifica

**Obiettivo:** le prime quick win + costruire la roadmap tecnica.

Attività:
- Identificare i **3 problemi critici** da risolvere (non 10 — 3)
- Avviare le prime iniziative: spesso sono cose di processo (branching strategy, code review, alerting base)
- Presentare la **Roadmap Tecnica 6 mesi** al management
- Avviare il **ritmo di governance**: standup tecnico settimanale, tech meeting mensile con management
- Prima sessione di **hiring tecnico** se serve (definire i profili, aiutare nell'interviewing)

**Esempio — "Finzy" (fintech, 15 developer)**

Al giorno 45 Elios presenta al CEO di Finzy la roadmap tecnica. Include:
1. Migrazione a CI/CD automatizzato (stimata 6 settimane, -70% tempo di deploy)
2. Estrazione del modulo di calcolo interessi in servizio separato (riduce il rischio di regressioni)
3. Piano di hiring: 2 senior developer con profilo specifico

Il CEO vede per la prima volta una visione tecnica scritta e prioritizzata. "Non avevamo mai avuto qualcosa del genere."

### I Giorni 61-90: Esegui e Consolida

**Obiettivo:** dimostrare che la roadmap non è solo carta.

Attività:
- **Prima quick win consegnata** — qualcosa di misurabile e visibile
- **Team review** — ogni developer ha avuto almeno 2 sessioni 1:1 con te
- **Retrospettiva formale** — cosa ha funzionato nel primo trimestre? Cosa no?
- **Proposta di rinnovo** — se il contratto è trimestrale, prepari il prossimo

> **Attenzione!** La trappola del "facciamo tutto insieme": il cliente vuole che tu esegua, non che tu guidi. Se accetti, diventi il senior developer part-time pagato troppo. Ogni volta che un task operativo finisce nelle tue mani, delegalo o addestralo. Il tuo valore è nella direzione, non nell'esecuzione.

### Domande di verifica

1. Cosa fai nel primo mese? Cosa NON fai?
2. Qual è il deliverable di fine mese 1 e perché è importante?
3. Come costruisci la fiducia con il team tecnico che non ti conosce?

---

## Parte 6 — Come si Lavora: Governance Part-Time

### Il ritmo mensile del FCTO

Lavorare 2-8 giorni al mese richiede struttura. Ecco il ritmo tipico per un FCTO Standard (4 giorni/mese):

**Settimana 1 — Giorno 1: Tech governance**
- Standup tecnico (30 min)
- 1:1 con lead developer (60 min)
- Review PR critiche o decisioni architetturali pendenti (2h)
- Comunicazione scritta al CEO/COO sui temi tecnici (30 min)

**Settimana 2 — Giorno 2: Team e people**
- 1:1 con 2-3 developer (45 min ciascuno)
- Sessione di lavoro su iniziativa prioritaria (2h)
- Aggiornamento roadmap (1h)

**Settimana 3 — Giorno 3: Strategia e stakeholder**
- Meeting con CEO/CPO (90 min) — allineamento business-tech
- Revisione metriche di delivery (1h)
- Decisioni su vendor, tool, contratti tecnici (1h)
- Documentazione decisioni architetturali (ADR) (1h)

**Settimana 4 — Giorno 4: Review e pianificazione**
- Tech review mensile (2h) — cosa è stato fatto, cosa è rimasto indietro
- Preparazione report mensile al management (1h)
- Pianificazione mese successivo (1h)

### Come comunichi quando non sei "in ufficio"

Nei giorni in cui non sei fisicamente presente (o in call), la comunicazione continua:
- **Canale Slack/Teams dedicato** — #tech-leadership — dove puoi rispondere in async
- **Response time dichiarato**: "rispondo entro 4 ore nei giorni lavorativi, entro 24h nei weekend"
- **Urgenze vere**: definisci cosa è urgenza (sistema down, decisione irreversibile) vs cosa può aspettare
- **Decisioni delegabili**: lista di decisioni che il lead developer può prendere autonomamente

> **Attenzione!** Il pericolo del "sempre reperibile": alcuni clienti, specialmente i CEO ansiosi, tendono a usarti come hotline tecnica. "Ho una domanda veloce" alle 22:00 diventa la norma. Stabilisci i confini dal giorno 1. Non è maleducazione — è professionalità.

> **Tip da campo** — Crea un documento "Decisioni che puoi prendere senza di me" nel primo mese. È liberatorio per il team e ti protegge dall'essere il collo di bottiglia.

### Domande di verifica

1. Struttura un piano mensile per un FCTO Starter (2 giorni/mese).
2. Come gestisci la comunicazione async tra i tuoi giorni di presenza?
3. Cosa succede se un cliente ti chiama fuori orario per una "urgenza"?

---

## Parte 7 — I Deliverable Mensili

### Cosa consegni ogni mese

Il FCTO non consegna "la tua presenza". Consegna risultati concreti e documentati. Ogni mese, il cliente deve ricevere:

**1. Il Report Mensile (1-2 pagine)**
Non 20 slide. Un documento semplice con:
- Cosa è stato fatto questo mese
- Le 3 decisioni tecniche principali e perché
- Stato della roadmap (verde/giallo/rosso)
- Cosa fa il team il mese prossimo
- Eventuali rischi emergenti

**2. La Roadmap Tecnica Aggiornata**
Un documento vivo, non una foto. Ogni mese aggiornato con:
- Stato di ogni iniziativa (completata / in corso / bloccata / posticipata)
- Nuovi elementi aggiunti
- Stime aggiornate

**3. Le ADR (Architecture Decision Records)**
Ogni decisione architetturale significativa viene documentata in un ADR. Formato semplice:
- Titolo della decisione
- Contesto (perché ci siamo trovati a decidere)
- Opzioni considerate
- Decisione presa
- Conseguenze

Questo protegge te ("ho consigliato X per questi motivi") e il cliente ("capisco perché siamo qui").

**4. Aggiornamento metriche di delivery**
Almeno due metriche ogni mese:
- Tempo medio di deploy (prima / dopo)
- Numero di incidenti in produzione
- Velocità di sviluppo (story points o PR mergeate)

**Esempio — Deliverable mese 3 per "DataBridge" (startup analytics)**

Report mensile Elios → DataBridge, mese 3:
- CI/CD completato: tempo di deploy da 4h a 22 minuti (-91%)
- Incidenti produzione: 0 (vs 2 del mese precedente)
- Roadmap: modulo export dati in corso (80%), hiring senior backend in fase finale
- Decisione architetturale: scelto PostgreSQL vs MongoDB per il modulo di aggregazione (ADR-007)
- Rischio: il lead developer mostra segnali di burnout — raccomando 2 settimane off e riassegnazione task

Questo report vale 10x qualsiasi call di aggiornamento. Il CEO ha tutto su carta. Se arriva un investitore, lo mostra come prova di maturità tecnica.

> **Tip da campo** — Usa un template fisso per il report mensile. Il cliente si abitua alla struttura e la legge più velocemente. La prevedibilità del formato è un vantaggio, non una limitazione.

### Domande di verifica

1. Elenca i 4 deliverable mensili standard di un FCTO.
2. Cos'è un ADR e perché ti protegge?
3. Perché il report mensile è importante anche se parli con il CEO ogni settimana?

---

## Parte 8 — Gestire Più Clienti in Parallelo

### Il modello multi-cliente

La bellezza del FCTO è che puoi avere 3-5 clienti simultanei. La sfida è non confonderli, non bruciarti e non essere percepito come disponibile "quando vuoi".

**Configurazione tipica:**
- 2 clienti FCTO Standard (4gg/mese ciascuno) = 8 gg/mese → ~2 giorni/settimana
- 1 cliente FCTO Starter (2gg/mese) = 2 gg/mese → 2 giorni ogni 2 settimane
- Revenue mensile: 3.200 + 3.200 + 1.800 = **8.200€/mese** ricorrenti

### Come evitare i conflitti

**1. Settori diversi quando possibile**
Un cliente fintech, uno healthtech, uno e-commerce. Meno probabilità di conflitti di interessi e più varietà di esperienze.

**2. Giorni fissi per cliente**
Cliente A: lunedì e martedì. Cliente B: mercoledì e giovedì. Cliente C: venerdì alternato.
Questo aiuta te a "entrare nel mindset" del cliente e il cliente a sapere quando ci sei.

**3. Nessuna condivisione di informazioni**
Non portare soluzioni da un cliente all'altro senza anonimizzarle. Il cliente B non deve sapere come ha risolto il problema il cliente A.

**4. Gestire le urgenze**
Ogni cliente deve capire che le urgenze devono essere vere urgenze. Definisci in contratto cosa è un'urgenza e cosa no. Le "urgenze" false consumano il multi-cliente più velocemente di qualsiasi altra cosa.

**Esempio — Elios con 3 clienti**

Elios gestisce:
- TechCave (startup IoT, 4 gg/mese): lunedì/martedì
- MedConnect (healthtech, 4 gg/mese): mercoledì/giovedì
- RetailNow (e-commerce B2B, 2 gg/mese): venerdì 1 e venerdì 3

Un venerdì di novembre, TechCave ha un'emergenza: il sistema è down. Elios è "in giornata RetailNow". Cosa fa? Ha definito in contratto che le emergenze critiche (sistema down) si gestiscono sempre, ma con un compenso extra-orario (200€/ora oltre il retainer). TechCave lo chiama, il sistema torna up in 3 ore, RetailNow viene avvisato del ritardo.

> **Attenzione!** Non accettare più clienti di quanti ne puoi gestire con qualità. 5 clienti mediocri valgono meno di 3 clienti eccellenti. La reputazione nel mondo FCTO si costruisce sui risultati, non sulla quantità di clienti.

> **Tip da campo** — Tieni un "Context document" per ogni cliente: 1 pagina con le persone chiave, i progetti in corso, le decisioni recenti, le tensioni del team. Rileggilo 30 minuti prima di ogni sessione. Non entrare mai in una call "freddo".

### Domande di verifica

1. Quanti clienti FCTO può gestire un FCTO a tempo pieno? Qual è il limite pratico?
2. Come gestisci un'urgenza di un cliente quando sei "in giornata" per un altro?
3. Perché è importante avere clienti in settori diversi?

---

## Parte 9 — Come Uscire Bene da un Ingaggio

### Perché l'exit è importante quanto l'onboarding

Il modo in cui esci da un ingaggio definisce la tua reputazione per i prossimi anni. Un'uscita ben gestita genera:
- Testimonianza positiva
- Referral al cliente successivo
- Possibilità di essere richiamato in futuro

Un'uscita mal gestita può costare anni di reputazione.

### Le tre modalità di uscita

**1. Exit naturale — il cliente assume un CTO interno**
Il tuo lavoro ha avuto successo. L'azienda è cresciuta al punto di poter/dover assumere un CTO full-time. Questo è il miglior outcome possibile.

Come gestirla:
- Dai 3 mesi di preavviso
- Aiuta attivamente nel processo di hiring del CTO successore
- Fai l'onboarding del nuovo CTO (minimo 1 mese di overlap)
- Consegna la documentazione in ordine: roadmap, ADR, stato team, vendor, contratti

**2. Exit pianificata — progetto completato**
Alcuni FCTO ingaggi hanno un obiettivo specifico (raise, rilascio prodotto v2, riorganizzazione team). Quando l'obiettivo è raggiunto, l'ingaggio finisce.

**3. Exit difficile — il rapporto non funziona**
A volte il cliente non è pronto a seguire i cambiamenti che proponi. O il CEO interferisce costantemente nelle decisioni tecniche. O il budget viene tagliato.

Come gestirla con professionalità:
- Dai il preavviso contrattuale (tipicamente 30-60 giorni)
- Scrivi una lettera di chiusura con: stato del lavoro, raccomandazioni per il successore, rischi aperti
- Non bruciare ponti: il CEO di oggi è il referral di domani

**Esempio — Exit da "LogiSoft" (software logistica)**

Elios lavora per LogiSoft da 14 mesi. L'azienda ha appena chiuso un round Serie B da 12M€ e può permettersi un CTO full-time. Elios gestisce il processo:
1. Mese 12: annuncio al CEO che è il momento di cercare un CTO full-time
2. Mese 13: Elios aiuta nella selezione (scrive il job description, fa i technical interview)
3. Mese 14: onboarding del nuovo CTO Stefano (2 settimane di overlap intenso)
4. Fine mese 14: consegna formale con documento di passaggio

Stefano, il nuovo CTO, dirà in futuro: "Elios mi ha consegnato un'azienda tecnica in ottima forma. È stato il miglior handover che abbia mai ricevuto."

> **Attenzione!** Non sparire senza preavviso. Anche se il rapporto è diventato difficile, il preavviso contrattuale si rispetta sempre. Uscire dall'oggi al domani è la cosa più dannosa che puoi fare alla tua reputazione.

> **Tip da campo** — Nel contratto, includi sempre una clausola di handover: "Al termine dell'ingaggio, il FCTO si impegna a un periodo di 4 settimane di transizione documentata." Questo ti protegge da chi ti vuole tenere in eterno e ti obbliga a fare un'uscita professionale.

### Domande di verifica

1. Quali sono le 3 modalità di exit? Descrivi brevemente ciascuna.
2. Come gestisci la situazione in cui il cliente non vuole che tu te ne vada?
3. Cosa deve contenere il documento di passaggio finale?

---

## Parte 10 — Pricing e Come Difenderlo

### La struttura di pricing FCTO

| Tier | Giorni/mese | Prezzo/mese | Revenue annua per cliente |
|---|---|---|---|
| **Starter** | 2 gg | 1.800€ | 21.600€ |
| **Standard** | 4 gg | 3.200€ | 38.400€ |
| **Full** | 8 gg | 5.500€ | 66.000€ |
| **Interim (3 mesi)** | ~15 gg | 4.000-8.000€/mese | progetto |

**Come si calcola il valore?**
Un CTO senior in Italia costa 100.000-160.000€ lordi annui + contributi (totale costo azienda: 160.000-220.000€). Con un FCTO Standard a 4 giorni/mese, il cliente spende 38.400€/anno — circa il 20-25% del costo di un full-time, per una disponibilità del 20-25%.

**Il valore non è nel tempo — è nella qualità delle decisioni**
Un FCTO esperto che prende 5 decisioni architetturali corrette in 4 giorni vale più di 20 giorni di un developer junior che naviga nel buio. Questo è l'argomento da usare quando il cliente dice "troppo caro".

### Come difendere il prezzo

**Quando il cliente dice "costa troppo":**

Risposta 1 — Il confronto con il full-time:
"Un CTO senior costa 180.000€/anno all inclusive. Io costo 38.400€. La domanda non è 'quanto costa questo servizio' — è 'quanto ti costa non averlo'."

Risposta 2 — Il costo del debito tecnico:
"Ogni mese senza direzione tecnica, il vostro team accumula debito. Un riassetto architetturale medio richiede 6-12 mesi di lavoro. Quanto vale prevenire questo?"

Risposta 3 — Il costo degli errori di hiring:
"Una selezione sbagliata di un senior developer vi costa 3-6 mesi di stipendio più il tempo perso. Io faccio l'interviewing tecnico e vi dico chi assumere e chi no."

**Quando il cliente vuole scontare:**

Non scontare il prezzo — cambia il tier. Se non può permettersi Standard (4gg), proponi Starter (2gg). Non lavorare per meno del tuo minimo perché non hai il tempo per fare un buon lavoro con meno giorni al mese.

> **Attenzione!** Non accettare pagamenti "a risultato" o equity come unica compensazione in fase di lancio. L'equity ha valore solo se l'azienda ha trazione reale. Retainer in cash = dignità professionale + flusso di cassa stabile.

> **Tip da campo** — Prima di fare la proposta, chiedi sempre: "Avete un budget in mente per questo tipo di supporto?" Non per adattarti al budget, ma per capire se siete allineati. Se il budget è 500€/mese, non perdere tempo.

### Domande di verifica

1. Qual è il costo annuo di un FCTO Standard vs un CTO full-time? Che % è?
2. Il cliente dice "mi sembra caro". Dai 3 risposte diverse.
3. Perché non dovresti mai scendere sotto il tuo minimo di prezzo?

---

## Parte 11 — Obiezioni Comuni e Come Risponderle

### Le 7 obiezioni più frequenti

**1. "Non ho bisogno di un CTO — ho già un senior developer che gestisce tutto"**

Risposta: "Ottimo. Ma il tuo senior developer è pagato per scrivere codice, non per pensare alla strategia. Chi pensa all'architettura tra 18 mesi? Chi gestisce il suo sviluppo professionale? Chi parla con gli investitori di roadmap tecnica? Se la risposta è 'lui fa anche quello', stai bruciando il tuo miglior developer."

**2. "Non posso permettermi un FCTO"**

Risposta: "Capisco. Ma possiamo partire con il tier Starter — 2 giorni al mese a 1.800€. Meno di una settimana di lavoro di un developer. Se i primi 3 mesi non portano valore misurabile, fermiamo. Zero rischio."

**3. "Ho già un CTO"**

Risposta (genuina): "Allora probabilmente non sono io il servizio giusto per voi in questo momento. Ma se il vostro CTO è sommerso di operativo e non ha tempo per la strategia, posso affiancarli come advisor esterno." (Questo può diventare un track diverso — advisory board membership.)

**4. "Come fai a capire il mio business in 4 giorni al mese?"**

Risposta: "Non lo capirò in 4 giorni al mese — lo capirò in 4 mesi. Il vantaggio del FCTO è proprio questo: porto una prospettiva esterna con continuità. Non sono dentro il bosco — posso vedere gli alberi."

**5. "E se hai un'emergenza con un altro cliente?"**

Risposta: "Ho un sistema di priorità definito nel contratto. Le emergenze vere — sistema down, vulnerabilità critica — hanno sempre risposta entro 2 ore. Tutto il resto è pianificato."

**6. "Come facciamo a sapere che funzionerà?"**

Risposta: "Non lo sappiamo finché non iniziamo. Per questo propongo sempre un primo periodo di 3 mesi. Alla fine dei 3 mesi, valutiamo insieme. Se non hai visto valore, non rinnoviamo. Se sì, continuiamo."

**7. "Preferiamo assumere un CTO"**

Risposta: "Perfetto. Posso aiutarvi anche in questo — scrivo il job description, faccio i technical interview, vi dico cosa cercare. E nel frattempo, mentre cercate (6-12 mesi in media), il team non resta senza direzione."

> **Tip da campo** — Annota le obiezioni reali che ricevi nelle prime 10 discovery call. Le obiezioni vere sono diverse da quelle che immagini. Aggiorna le tue risposte ogni trimestre.

### Domande di verifica

1. Il cliente dice "il mio CTO tecnico gestisce tutto e va bene così". Risposta?
2. Perché il trial di 3 mesi è utile per entrambe le parti?
3. Come trasformi l'obiezione "abbiamo già un CTO" in un'opportunità?

---

## Parte 12 — Errori Classici del Fractional CTO

### I 10 errori da non fare

**1. Tornare nel codice**
Non farlo. Mai. Appena scrivi codice, perdi il posizionamento da leader.

**2. Fare promesse sulla velocità di risultati**
"In 3 mesi risolvo il debito tecnico" — impossibile. I cambiamenti architetturali richiedono tempo. Gestisci le aspettative con onestà.

**3. Prendere decisioni senza ascoltare il team**
Il team tecnico esistente conosce il codice meglio di te. Consulta sempre prima di decidere. La non-disclosure è il veleno della fiducia.

**4. Diventare il collo di bottiglia**
Se tutto deve passare da te, hai fallito la leadership. Obiettivo: il team funziona bene ANCHE quando non ci sei.

**5. Ignorare la cultura aziendale**
Portare pratiche enterprise in una startup di 10 persone crea paralisi. Calibra le soluzioni al contesto.

**6. Non documentare le decisioni**
"Ricordo che avevamo deciso X" è inutile dopo 6 mesi. Ogni decisione importante va nell'ADR.

**7. Accettare troppi clienti troppo in fretta**
La qualità crolla. Meglio crescere lentamente con clienti felici che bruciare 5 clienti simultaneamente.

**8. Non definire i confini del ruolo**
"Puoi anche fare X?" — se dici sempre sì, in 6 mesi sei il tuttofare tecnico. Definisci cosa fai e cosa no dal giorno 1.

**9. Non raccogliere feedback**
Ogni 3 mesi, chiedi al CEO: "Come sto andando? Cosa potrei fare meglio?" La risposta ti salva da scivoloni invisibili.

**10. Sopravvalutare la propria comprensione del business**
Sei un esperto tecnico. Non sei un esperto del loro mercato. Ascolta più di quanto parli, specialmente nei primi 60 giorni.

> **Attenzione!** Il più grave di tutti: accettare un ingaggio dove il CEO non ti lascia lavorare davvero. Se ogni decisione tecnica che proponi viene bloccata o ribaltata senza ragioni tecniche valide, stai sprecando il tuo tempo e danneggiando la tua reputazione.

### Domande di verifica

1. Qual è l'errore numero 1 del neo-FCTO con background da developer?
2. Come eviti di diventare il collo di bottiglia del team?
3. Cosa fai se il CEO ribalta continuamente le tue decisioni tecniche?

---

## Parte 13 — Glossario FCTO

**ADR (Architecture Decision Record):** documento che registra una decisione architetturale, il suo contesto, le alternative considerate e le conseguenze.

**Debito tecnico:** il costo futuro di dover riscrivere o correggere codice scritto in modo rapido/non ottimale. Come un debito finanziario, cresce nel tempo se non viene ripagato.

**Delivery:** il processo di consegnare funzionalità software funzionante al cliente finale.

**Feature flag:** meccanismo che permette di attivare/disattivare funzionalità in produzione senza un deploy. Usato per rilasci graduali.

**Handover:** il processo di trasferimento di responsabilità e conoscenza da un ruolo a un altro.

**Lead time:** tempo totale dal momento in cui una richiesta viene creata a quando è consegnata in produzione.

**Retainer:** contratto di collaborazione continuativa a pagamento mensile fisso.

**Roadmap tecnica:** documento che pianifica l'evoluzione dell'architettura e della tecnologia nel medio-lungo periodo (tipicamente 6-12 mesi).

**SLA (Service Level Agreement):** accordo formale sui livelli di servizio garantiti (tempo di risposta, uptime, ecc.).

**Stakeholder:** chiunque abbia un interesse nel progetto — CEO, investitori, clienti, team tecnico.

**Tech debt:** vedi debito tecnico.

**Velocity:** velocità di sviluppo del team, spesso misurata in story points per sprint.

---

## Checklist Onboarding Cliente FCTO

### Prima dell'inizio (settimana 0)
- [ ] Contratto firmato con scope chiaro, tier, durata, rinnovo, exit
- [ ] Accesso ai sistemi: codebase, CI/CD, monitoring, documenti
- [ ] Introduzione al team tecnico (email o call)
- [ ] Calendario con giorni fissi concordati per i prossimi 3 mesi
- [ ] Canale di comunicazione definito (Slack? Teams? Email?)
- [ ] Definizione delle urgenze e del response time

### Mese 1: Ascolto
- [ ] 1:1 con ogni membro del team tecnico (45 min ciascuno)
- [ ] 1:1 con CEO/COO/CPO (60 min)
- [ ] Lettura della codebase principale (overview, non deep dive)
- [ ] Revisione dell'architettura esistente
- [ ] Osservazione di un ciclo di release completo
- [ ] Analisi delle metriche esistenti (o constatazione che non esistono)
- [ ] Lettura post-mortem e incident report (se disponibili)
- [ ] Documento "Stato dell'Arte" consegnato al CEO

### Mese 2: Stabilizzazione
- [ ] Roadmap tecnica 6 mesi (bozza presentata al management)
- [ ] Identificazione dei 3 problemi critici prioritari
- [ ] Avvio prima iniziativa quick win
- [ ] Setup ritmo di governance (standup tecnico, tech meeting mensile)
- [ ] Definizione metriche baseline (delivery, incidenti, qualità)
- [ ] Primo report mensile consegnato

### Mese 3: Primo risultato
- [ ] Quick win #1 consegnata e misurata
- [ ] Seconda iniziativa in corso
- [ ] Team report: ogni developer ha ricevuto feedback scritto
- [ ] Retrospettiva trimestrale con CEO
- [ ] Decisione sul rinnovo

---

## 10 Scenari Pratici con Personaggi Inventati

### Scenario 1 — La startup senza direzione (CloudFarm)

**Situazione:** Marco (CEO, CloudFarm, IoT agricoltura) ha 12 developer e un CTO fondatore Andrea esaurito. Architettura del 2021, nessuna CI/CD.

**Intervento FCTO:** Elios inizia con mese di audit. Scopre che il 40% del tempo del team va in fix di bug produzione. Roadmap: CI/CD prima (6 settimane), poi refactoring modulo core. Risultato mese 3: -65% bug produzione, deploy da 3h a 45 min.

**Cosa impari:** Il primo problema da risolvere non è sempre quello dichiarato. Ascolta, poi decidi.

---

### Scenario 2 — Il developer diventato "CTO" per caso (RetailFlow)

**Situazione:** Lucia (CEO) ha promosso Davide a "CTO" perché era il developer più bravo. Davide ora gestisce tutto ma non gestisce nessuno — e il team è frustrato.

**Intervento FCTO:** Elios non sostituisce Davide — lo affianca. 3 mesi di coaching 1:1 con Davide su leadership e delega. Risulta: Davide impara a delegare, le sue giornate cambiano, il team si sblocca.

**Cosa impari:** Il FCTO non è sempre un sostituto — a volte è un coach per chi già c'è.

---

### Scenario 3 — L'azienda con il "developer irremovibile" (Finzy)

**Situazione:** Solo una persona conosce il sistema di calcolo interessi. Se lascia, l'azienda è in crisi.

**Intervento FCTO:** Elios introduce sessioni di knowledge transfer obbligatorie e documentazione minima. In 4 mesi il sistema è documentato e altri 2 developer lo capiscono.

**Cosa impari:** La riduzione del bus factor è uno dei valori più grandi che un FCTO porta.

---

### Scenario 4 — La scale-up pre-Serie B con debito tecnico (DataBridge)

**Situazione:** DataBridge ha 45 clienti enterprise, deploy ogni 6 settimane (troppo lento), e 30 developer che si lamentano del codice.

**Intervento FCTO:** Elios avvia il programma "Ship Every Week" — CI/CD, feature flags, test automatizzati. 6 mesi dopo: deploy ogni settimana, 0 rollback in produzione.

**Cosa impari:** Il debito tecnico si riduce con piccoli passi costanti, non con una ristrutturazione big bang.

---

### Scenario 5 — L'ingaggio che non dovevi accettare (LogiNet)

**Situazione:** Roberto (CEO) vuole un FCTO perché "gli sviluppatori non mi rispettano". Il problema reale: Roberto interfaccia continuamente il team, bypassa le priorità, cambia i requisiti ogni settimana.

**Intervento:** Elios accetta, capisce in 3 settimane che il problema è il CEO. Dopo 2 confronti diretti senza risultato, esce dall'ingaggio con 30 giorni di preavviso.

**Cosa impari:** Non tutti i problemi tecnici sono problemi tecnici. Riconoscere l'ingaggio sbagliato è una competenza.

---

### Scenario 6 — Il CTO che cerca lavoro (MedConnect)

**Situazione:** MedConnect sta cercando un CTO da 8 mesi. Nel frattempo il team è senza guida.

**Intervento FCTO:** Elios fa il bridge. In parallelo, aiuta il processo di selezione: scrive il job description, conduce i technical interview, filtra 12 candidati a 3. Il nuovo CTO viene assunto al mese 9. Overlap di 4 settimane.

**Cosa impari:** Il FCTO come bridge verso l'hiring è uno degli use case più preziosi.

---

### Scenario 7 — La PMI che digitalizza (CasaFlex)

**Situazione:** CasaFlex (real estate software) ha comprato un sistema in-house e assunto 4 developer. Nessuno sa gestirli.

**Intervento FCTO Starter (2gg/mese):** Elios imposta i processi base (code review, branching, weekly standup, backlog). In 3 mesi il team si autogestisce sulle attività ordinarie.

**Cosa impari:** A volte non serve una strategia complessa — servono abitudini sane di base.

---

### Scenario 8 — L'azienda con investitori impazienti (TechCave)

**Situazione:** TechCave ha appena chiuso un round. Gli investitori chiedono una roadmap tecnica al board. Il team non l'ha mai fatta.

**Intervento FCTO:** Elios produce la roadmap tecnica 12 mesi in 3 settimane. Presenta al board. Gli investitori capiscono la visione tecnica per la prima volta. Il funding round successivo è facilitato.

**Cosa impari:** Il FCTO come "traduttore" tra tech e investitori è un valore spesso sottovalutato.

---

### Scenario 9 — Il team tecnico che non si fida del FCTO (SecurityShield)

**Situazione:** SecurityShield (cybersecurity) ha un team tecnico di seniority alta e orgoglioso. Il CTO "a noleggio" viene visto con diffidenza.

**Intervento:** Elios non si impone. Nei primi 30 giorni fa domande, non dà risposte. Partecipa alle code review come osservatore. Al giorno 45, fa la sua prima proposta tecnica — ben argomentata, alternativa inclusa. Il team la discute apertamente. Dal mese 2, viene riconosciuto come pari.

**Cosa impari:** Con team senior, l'autorità si guadagna con la qualità degli argomenti, non con il titolo.

---

### Scenario 10 — L'exit ben fatta (LogiSoft)

**Situazione:** LogiSoft ha chiuso Serie B. Possono assumere un CTO full-time. Elios lavora con loro da 14 mesi.

**Exit gestita:** Mese 12 → annuncio. Mese 13 → selezione CTO con Elios come advisor tecnico nel processo. Mese 14 → onboarding del nuovo CTO Stefano, 2 settimane intensive. Fine mese 14 → consegna formale con documento di transizione completo.

**Risultato:** Stefano parte con piena visibilità su architettura, team, roadmap, ADR, vendor. LogiSoft lascia una recensione pubblica su LinkedIn: "Elios ha costruito le fondamenta su cui cresceremo."

**Cosa impari:** L'exit perfetta è quella dove il cliente non sente il tuo vuoto — perché hai costruito un sistema che funziona senza di te.

---

*Fine — STUDY-FCTO-FractionalCTO.md | Elios Scoglio | 2026-05-27 | v1.0*

> **Box token/costo stimato**
> Documento: ~1.100 righe | Costo generazione stimato: ~0,15€
