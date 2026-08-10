---
title: "Come Costruire un Team Tech che Funziona Davvero"
subtitle: "Guida per Engineering Manager, CTO e chi vuole smettere di perdere le persone migliori"
author: "108 Vision | Elios Scoglio"
type: "manuale-omaggio"
track: "108-lead"
version: "2.0"
date: "2026-06-11"
brand: "108 Vision"
---

# Come Costruire un Team Tech che Funziona Davvero

**Guida per Engineering Manager, CTO e chi vuole smettere di perdere le persone migliori**

---

## Perche questo documento esiste

Ho gestito team tecnici in ambienti ad alta pressione: sistemi con milioni di transazioni, on-call notturni su incidenti che bloccano la vendita, decisioni architetturali prese male e da pagare per anni. In questo percorso ho portato un team dal 40% di soddisfazione all'82%, aumentato la delivery velocity del 30% senza aggiungere headcount, e costruito una cultura dove le persone dicono cosa non va prima che diventi un problema. Non per magia — per metodo. Questo manuale ti da gli strumenti per diagnosticare cosa non va nel tuo team, le metriche per misurarlo, e le pratiche concrete per intervenire.

---

## 01. I 3 Problemi che Distruggono i Team Tech Italiani

### Il Micromanagement Tecnico

Il CTO controlla ogni pull request. Decide quale libreria usare. Le sue revisioni bloccano i deploy. I developer aspettano il suo parere prima di procedere su qualsiasi cosa "importante".

In apparenza sembra competenza. In realta e il segnale piu chiaro che qualcosa non va.

**Le cause reali:**
- Paura della perdita di controllo: il CTO era il developer migliore, il suo valore era tecnico, nessuno gli ha detto che ora il suo valore dovrebbe essere diverso
- Assenza di standard scritti: senza un sistema, il controllo individuale e l'unica alternativa al caos
- Esperienze passate di danni: "se non controllo, succede qualcosa di brutto" e un meccanismo di protezione

**Il costo reale:**
- Velocity: ogni decisione che passa da una sola persona e un collo di bottiglia
- Crescita: developer che non decidono mai, non crescono mai. Dopo due anni hanno skill tecniche ma zero giudizio
- Retention: i developer eccellenti trovano il micromanagement insopportabile. Rimangono quelli che non trovano alternative

**Come uscirne — 4 fasi:**
1. Costruire standard scritti (ADR, coding guidelines, criteri per quando serve approvazione)
2. Definire decisioni reversibili vs irreversibili — delegare le prime completamente
3. Passare dalla code review come "gate" alla code review come "coaching"
4. Misurare la delega: quante decisioni rilevanti vengono prese senza il CTO nel loop?

### La Mancanza di Ownership

Il developer consegna quello che gli viene chiesto, nei tempi ragionevoli, senza errori evidenti. Ma non segnala mai un problema fuori dal suo ticket. Non propone miglioramenti non richiesti. Quando il sistema ha un bug: "non era nel mio scope".

Non e pigrizia. E il risultato prevedibile di strutture che formano esecutori.

**Cause specifiche:**
- Ticket scritti come istruzioni, non come problemi ("implementa il metodo X" vs "gli utenti non riescono a cancellare l'ordine — risolvi")
- Nessun feedback sul risultato reale: il developer non sa mai cosa succede al suo codice in produzione
- Blame cultura: il primo incidente in cui qualcuno viene additato insegna che la cosa piu sicura e fare il minimo

**Come costruire ownership:**
- Assegna problemi, non compiti. Riscrivi i ticket.
- Chiudi il loop sul risultato: "la funzionalita X ha ridotto le richieste al support del 22%"
- Coinvolgi nelle decisioni sul loro codice
- Distingui errori da errori: un caso limite non previsto non e negligenza

### Il Silenzio come Feedback

Riunione di retrospettiva. "Cosa non sta funzionando?" Silenzio. Due settimane dopo, uno dei developer migliori invia le dimissioni.

Il silenzio non e assenza di opinioni. E un calcolo di rischio. Se in passato sollevare un problema ha portato a conseguenze negative — anche solo alzare le sopracciglia, anche solo un tono — il cervello impara che il silenzio e la scelta piu sicura.

**Come costruire psychological safety in 3 mesi:**
- Mese 1: Modella il comportamento. Di' pubblicamente "ho sbagliato quella valutazione". Ringrazia chi porta un problema prima che diventi critico.
- Mese 2: Rimuovi le eccezioni punitive. Cerca nei tuoi comportamenti passati le reazioni negative a notizie negative. Anche i micro-segnali.
- Mese 3: Crea strutture formali dove il feedback e atteso: retrospettive ben facilitate, 1-on-1 con domande aperte reali.

> **Takeaway:** La psychological safety non si costruisce con un team building. Si costruisce con comportamenti ripetuti del leader, nel tempo. Ogni volta che una persona alza la voce e riceve una risposta positiva, il segnale si propaga.

---

## 02. Come Misurare la Salute del Tuo Team

### Metriche DORA — Il Processo

| Metrica | Come misurare | Benchmark | Allarme |
|---|---|---|---|
| Deployment Frequency | Deploy/mese da CI/CD | 1-4/settimana | <1/mese |
| Lead Time | Commit a produzione | <1 settimana | >4 settimane |
| MTTR | Log incidenti: inizio a risoluzione | <1 ora (critici) | >4 ore |
| Change Failure Rate | Deploy KO / Totale | 5-15% | >30% |

### Metriche Umane — Le Persone

| Metrica | Come misurare | Benchmark | Allarme |
|---|---|---|---|
| Voluntary Turnover | Dimissioni/headcount anno | 10-15% | >20% o cluster su senior |
| Onboarding Time | Giorni a prima autonomia | 30-60gg | >90 giorni |
| 1-on-1 Frequency | % pianificate effettuate | >85% | <60% |
| Feedback Latency | Giorni osservazione a feedback | <3 giorni | >2 settimane |
| Burnout Index | Punteggio composito (vedi sotto) | <15/30 | >20/30 |

### Burnout Index — Proxy Mensile

Assegna un punteggio da 1 a 5 ai seguenti indicatori:

| Indicatore | 1 (basso rischio) | 5 (alto rischio) |
|---|---|---|
| Ore di straordinario | Quasi nessuna | 10h+/settimana sistematiche |
| PTO utilizzato vs disponibile | >80% | <40% |
| Partecipazione ai rituali di team | Alta e attiva | Bassa o passiva |
| Qualita del codice (bug rate) | Stabile o migliorata | Peggiorata |
| Richieste di cambio progetto/team | Assenti | Frequenti |
| Segnali nelle 1-on-1 ("sono stanco") | Assenti | Presenti |

Punteggio aggregato >20 su 30: segnale di allarme che richiede intervento.

> **Takeaway:** Le metriche DORA ti dicono com'e il processo. Le metriche umane ti dicono com'e il team come sistema di persone. Nessun tool di CI/CD raccoglie le seconde automaticamente. Richiedono attenzione deliberata.

---

## 03. Da Developer a Tech Lead: Il Salto che Nessuno Insegna

### La Trappola della Competenza Tecnica

Sei diventato tech lead perche eri il developer migliore. Ora il tuo valore non e scrivere codice.

Questa frase e semplice da leggere e difficile da interiorizzare. Per anni il tuo senso del valore era legato alla qualita tecnica del tuo output. La trappola: tornare a scrivere codice perche ti fa sentire utile. Ogni volta che torni a fare il developer, stai lavorando nel tuo business, non sul tuo business — e stai bloccando la crescita del team.

Il tuo nuovo valore: il team che funziona bene senza di te per un giorno, una settimana, un mese.

### Le 5 Nuove Competenze

**1. Fare 1-on-1 efficaci (30 minuti)**
- Apertura (5 min): domanda aperta genuina — "cosa hai sulla testa questa settimana?"
- Ascolto attivo (15 min): parla il meno possibile. Fai domande che aprono, non chiudono.
- Azione concreta (10 min): "c'e qualcosa che posso fare per aiutarti questa settimana?"

L'errore piu comune: trasformare la 1-on-1 in un update di progetto. Se i primi 20 minuti parlano di ticket e sprint, hai perso l'opportunita.

**2. Dare feedback critico senza distruggere la relazione**
Formato: descrivi il comportamento specifico (non la persona) poi descrivi l'impatto osservato poi chiedi la prospettiva dell'altro poi indica cosa ti aspetti in futuro (specifico e misurabile).

Quando: entro 48-72 ore dall'evento. In privato sempre per il feedback critico. Mai reattivamente.

**3. Prendere decisioni architetturali CON il team**
Il formato RFC: scrivi il problema, le opzioni con pro/contro, la tua proposta. Condividi. Chiedi feedback asincrono in 3-5 giorni. Call sincrona per i disaccordi. La decisione finale rimane tua — ma e costruita con chi dovra viverci dentro.

**4. Gestire le aspettative verso l'alto**
Non sacrificare uno dei due lati. Non trasmettere la pressione del management senza mediazione. Non nascondere problemi dicendo sempre si. La terza via: essere il traduttore bidirezionale che porta informazione vera in entrambe le direzioni.

**5. Costruire una cultura del miglioramento continuo**
Post-mortem scritto entro 48 ore (senza blame). "Se ripartissimo da zero su questo task, cosa faremmo diversamente?" Normalizza il "non lo sapevo" e l'"ho sbagliato". Nomina il debito tecnico — non fingere che non esista.

### Le 3 Trappole del Tech Lead

1. **Essere l'esperto di tutto:** crea altri centri di competenza nel team.
2. **Evitare i conflitti interpersonali:** affrontali entro una settimana, con curiosita non moralismo.
3. **Misurare il proprio valore sulle ore lavorate:** modellare burnout insegna al team che il valore e presenza, non impatto.

> **Takeaway:** Se il team prende decisioni senza te, se le 1-on-1 producono conversazioni vere, se le persone portano problemi prima che esplodano — stai facendo bene. Se no, hai dati su dove concentrarti.

---

## 04. Come Gestire il Burnout Tecnico

### I 5 Segnali Precoci

1. **Calo della qualita tecnica:** patch veloci, review meno attente, bug in aumento. Non e negligenza — e un cervello che ha esaurito l'attenzione sostenuta.
2. **Riduzione dell'engagement:** silenzio nei planning, nelle retrospettive, nelle decisioni. La fatica di discutere supera il valore percepito del contribuire.
3. **Risposta emotiva sproporzionata:** un bug ordinario provoca reazioni visibilmente stressate. Il sistema nervoso e in allerta permanente.
4. **Accumulo di PTO non utilizzate:** "non c'e mai il momento giusto" — la persona si sente indispensabile in modo ansioso.
5. **Cinismo mascherato da pragmatismo:** "facciamo quello che vuoi, tanto cambiera tutto tra sei mesi."

### La Differenza tra Stress e Burnout

Lo stress e temporaneo, ha una fine visibile, e seguito da realizzazione. Il burnout e cronico, si accumula senza una fine visibile, e produce vuoto. Dopo sprint intenso: lo stress recupera in qualche giorno. Il burnout non recupera nemmeno dopo le ferie.

### Cosa Funziona Davvero

- **Ownership e controllo:** l'autonomia su come fare il lavoro riduce significativamente il rischio di burnout
- **Protezione dal caos:** filtrare richieste urgenti-ma-non-importanti, stabilizzare priorita, difendere il deep work
- **Feedback che chiude il loop:** connettere sforzo e risultato per mantenere la motivazione
- **Slack time strutturata:** il 15% del tempo per fare le cose fatte bene riduce la frustrazione

### Come Strutturare il Lavoro Sistemicamente

- Rendi visibile il carico: board Kanban con WIP limit, conversazione esplicita su "stiamo prendendo troppo?"
- Distribuisci l'on-call equamente: rotation chiara, runbook aggiornati, debrief post-on-call
- Proteggi il deep work: no-meeting mornings, aspettativa che non si risponde a Slack durante le ore di focus
- Costruisci ridondanza: se solo una persona sa fare una cosa critica, quella persona non puo mai staccare

---

## 05. Hiring: Come Trovare Developer Senior in Italia

### Il Processo Giusto

**CV Screening — 10 minuti per scheda**

3 segnali positivi: progressione di responsabilita, descrizione di problemi risolti (non solo tecnologie), contributi visibili (open source, articoli).

3 red flag: job hopping senza progressione, lista infinita di tecnologie senza profondita, nessuna descrizione di impatto.

**Colloquio tecnico — Conversazione sulle decisioni passate**

Domande che rivelano la seniority reale:
- "Raccontami una decisione architetturale di cui ti sei pentito. Cosa ha insegnato?"
- "Hai mai dovuto dire no a un requisito del management? Come l'hai gestito?"
- "Descrivi la codebase piu difficile su cui hai lavorato. Cosa la rendeva difficile?"

**Pair Session — 45-60 minuti su problema reale**

Osserva: come comunica mentre lavora, come gestisce il blocco (chiede aiuto? ammette incertezza?), come prende decisioni con info incomplete, come accetta feedback sulla sua soluzione.

### Job Description che Attira i Giusti

Includi: descrizione concreta del problema tecnico, contesto del team, sfide reali (senza nasconderle), cultura del feedback.

Evita: requisiti irrealistici, lista di 25 tecnologie "expert", "startup mindset" se non sei una startup, "competitive salary" senza indicare una fascia.

> **Takeaway:** Un developer senior con opzioni legge la job description e si chiede: "E interessante lavorare qui? Imparero qualcosa? I problemi da risolvere sono reali?" Se non rispondi a queste domande, non attrai i profili migliori.

---

## 06. Remote e Ibrido: Come Farlo Funzionare

### I 3 Miti

1. **"Bastano Slack e Zoom"** — sono strumenti di comunicazione, non una cultura di lavoro remoto
2. **"Il remote aumenta la produttivita"** — dipende: si per deep work, no per collaborazione
3. **"La fiducia viene col tempo"** — in remoto richiede investimento deliberato

### Come Prendere Decisioni Senza Riunioni Infinite

- Definisci chi decide prima di iniziare la discussione
- Formato "Proposta + Silenzio-Assenso": chi non risponde entro la deadline e in accordo
- Distingui riunioni di discussione (esplorare) da riunioni di decisione (output obbligatorio)

### Come Costruire Fiducia in Remoto

- Rituali di connessione brevi e regolari (5 min "come stai davvero?" a inizio call settimanale)
- Lavoro visibile: update brevi asincroni, progress condiviso, decision log
- Celebrazione dei risultati con intenzionalita: un messaggio sul canale vale piu di quanto pensi
- Writing culture: decisioni documentate per chi non era in call e per il futuro se stesso

---

## 07. Piano d'Azione Immediato

### Team Health Check — 10 Domande, 30 Minuti

Rispondi 1-5 per ogni domanda:

1. Le persone sanno cosa ci si aspetta da loro (output e comportamento)?
2. Negli ultimi 30 giorni, hai fatto almeno una 1-on-1 significativa con ogni membro?
3. Quando qualcuno sbaglia, si cercano cause sistemiche o il "colpevole"?
4. Le persone sanno come il loro lavoro impatta il business?
5. Il turnover si concentra sulle persone migliori? (5=no, 1=si)
6. Le decisioni architetturali vengono prese con il team o per il team?
7. C'e una persona su cui tutto dipende — che non puo prendere ferie? (5=no, 1=si)
8. Gli ultimi 3 mesi sono stati sostenibili, senza straordinari sistematici?
9. Il feedback viene dato entro pochi giorni, non solo nelle performance review?
10. Se chiedessi al team "ti piace lavorare qui?", quanti risponderebbero si convinto?

**Score:**
- 40-50: buona salute. Consolida.
- 30-39: segnali misti. Piano intervento 60 giorni sulle 2-3 aree peggiori.
- 20-29: problemi strutturali. Serve intervento sistematico.
- Sotto 20: situazione critica. Considera supporto esterno.

### I 3 Interventi di Questa Settimana

**1. Pianifica le 1-on-1 che non hai mai fatto.**
Apri il calendario adesso. 30 minuti con ogni persona, ricorrente ogni 1-2 settimane. Non aspettare "il momento giusto".

**2. Chiedi un feedback reale.**
Nella prossima 1-on-1: "C'e qualcosa che faccio come manager che ti rende il lavoro difficile, anche involontariamente?" Stai zitto dopo la domanda. Non difenderti.

**3. Identifica il tuo bottleneck di decisione.**
Conta le decisioni degli ultimi 30 giorni passate per te. Per le 3 categorie piu comuni: potrebbe essere delegata con standard scritti? Se si, scrivi lo standard e comunica al team che la decisione e loro.

---

## 08. Template: 1-on-1 Engineering Manager (30 Minuti)

```
DATA: ____________________
PERSONA: ____________________

[5 minuti — Apertura]
Come stai, al di la del lavoro?
C'e qualcosa che ti sta pesando questa settimana?

[15 minuti — Ascolto e Esplorazione]
Domande in rotazione (scegliere 1-2 per sessione):
- "Cosa ti ha dato piu soddisfazione negli ultimi 15 giorni?"
- "C'e qualcosa che ti sta frustrando e che non hai ancora sollevato?"
- "Se potessi cambiare una cosa di come lavoriamo, cosa sarebbe?"
- "Dove ti senti meno capace di quello che vorresti essere?"
- "Come stai rispetto a 3 mesi fa?"
- "Cosa ti piacerebbe imparare nei prossimi 6 mesi?"

[10 minuti — Azione e Chiusura]
C'e qualcosa che posso fare per aiutarti questa settimana?
C'e qualcosa su cui vuoi un feedback da me?

NOTE (solo per il manager):
_____________________________________________________________

ACTION ITEMS (con owner e deadline):
[ ] ______________________ — owner: _______ — entro: _______
[ ] ______________________ — owner: _______ — entro: _______
```

---

## 09. Template: Retrospective Start/Stop/Continue

```
DATA: ____________________
SPRINT / PERIODO: ____________________

[10 min — Raccolta individuale silenziosa]
Ognuno scrive per ciascuna categoria. Nessuna discussione.

START — Cosa dovremmo iniziare a fare?
STOP — Cosa dovremmo smettere di fare?
CONTINUE — Cosa dovremmo continuare a fare?

[10 min — Clustering e discussione]
Raggruppa per tema. Dot voting: 3 voti a testa.

TOP 3 TEMI:
1. ___________________ (voti: ___)
2. ___________________ (voti: ___)
3. ___________________ (voti: ___)

[10 min — Action item]
UN solo action item concreto per il prossimo sprint.
(Uno ben eseguito vale piu di dieci dimenticati)

ACTION ITEM:
Cosa: ___________________
Chi lo guida: ___________________
Come sappiamo che e fatto: ___________________
```

---

## 10. Quando Ha Senso un Supporto Esterno

Un supporto esterno ha senso quando:

- **Il problema e troppo vicino per essere visto:** sei dentro il sistema che non funziona, non hai la prospettiva per vedere cosa stai facendo tu
- **Serve un catalizzatore:** dinamiche cristallizzate, tutti sanno che c'e un problema ma nessuno sa uscire dal loop
- **La trasformazione e sistemica:** non un singolo comportamento ma una cultura costruita in anni — non si risolve con un corso di due giorni
- **Le metriche indicano urgenza non riconosciuta:** turnover alto, burnout elevato, delivery in calo — ma nessuno vede il segnale

---

## CTA

Vuoi applicare questo metodo alla tua azienda? Prenota 30 minuti con noi su 108vision.it — gratuito, senza impegno.

Il Team Assessment e una valutazione in 2-3 settimane che include: interviste individuali riservate, analisi metriche DORA e umane, osservazione dei rituali di team, e un report con diagnosi precisa e piano di intervento a 90 giorni con milestone misurabili.

---

*Versione 2.0 — Giugno 2026*
*108 Vision | Elios Scoglio*

> "Un team tecnico che funziona non e un team senza problemi. E un team che riconosce i problemi abbastanza presto da poterli risolvere."
