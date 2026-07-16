# Preparazione Call — Veralab (Fractional CTO)

**Tipo call**: Discovery + Proposta Fractional CTO
**Durata target**: 30-45 minuti
**Interlocutore target**: CEO / COO — se risponde solo HR, chiedere di coinvolgere il decisore prima della call
**Contesto**: Contatto avviato con email che cita il 500 sul Magazine. Questa è la call di risposta.
**Companion**: `ANALISI_Tecnica_Veralab_SiteAudit.md` · `STRATEGIA_Negoziazione_Veralab.md` · `PRES_Veralab_EliosScoglio.md`

---

## INDICE

1. [Struttura della Call](#1-struttura-della-call)
2. [Intro: Chi è Veralab](#2-intro-chi-è-veralab)
3. [Apertura con i dati](#3-apertura-con-i-dati)
4. [Presentazione: Chi sono io](#4-presentazione-chi-sono-io)
5. [Il mio approccio: Due Filoni + Metodo](#5-il-mio-approccio-due-filoni--metodo)
6. [Discovery: Domande da fare](#6-discovery-domande-da-fare)
7. [Pricing e Opzioni](#7-pricing-e-opzioni)
8. [Obiezioni e Risposte](#8-obiezioni-e-risposte)
9. [Red Flags e Scenario Planning](#9-red-flags-e-scenario-planning)
10. [Tecniche Comunicative](#10-tecniche-comunicative)
11. [Checklist Pre-Call](#11-checklist-pre-call)

---

## 1. STRUTTURA DELLA CALL

### Principio di questa call

Non è una call per candidarsi. È una call per **capire se esiste un fit** tra il problema di Veralab e il modello Fractional CTO.

La mia posizione è forte: ho già fatto il lavoro (site audit, gap analysis) **prima** della call. Loro lo sanno dall'email. Non sono un candidato che si presenta — sono un professionista che ha già dimostrato qualcosa.

Esco con una di tre conclusioni:
1. **Fit confermato** → proposta scritta entro 48h
2. **Potenziale da esplorare** → Tech Assessment come entry point
3. **No fit** → fine pulita, professionale, senza insistere

### Principi comunicativi

- **Regola 80/20**: primi 15 minuti → 80% loro parlano, 20% tu. Secondi 15 → inverti.
- **Pain before solution**: mai presentare la soluzione prima di aver fatto emergere il dolore.
- **Specifico batte generico**: "http 500 sul Magazine in produzione adesso" batte "ho trovato dei problemi".
- **Mirror & Match**: ricalca il loro linguaggio. Se dicono "team", non dire "risorse".

### Timeline (45 minuti)

```
MIN 0-2   │ WARM UP
          │ • Ringrazia per il tempo, conferma durata
          │ • "Prima di raccontarvi di me, vi mostro cosa ho trovato"
          │
MIN 2-8   │ APERTURA CON I DATI (tu parli)
          │ • HTTP 500 Magazine — P0, in produzione adesso
          │ • 2-3 gap architetturali in ordine d'impatto
          │ • "Non sono slide — li ho misurati live"
          │ • Non spiegare tutto — crea curiosità, poi passa a loro
          │
MIN 8-22  │ DISCOVERY (loro parlano, tu ascolti)
          │ • Domande chiave (sezione 6)
          │ • Mirror: riformula quello che dicono
          │ • Nota pain, trigger, team, segnali budget
          │
MIN 22-24 │ PONTE — Collegamento loro→te
          │ • "Ok, ho capito il quadro. Mi ritrovo in quello che descrivete
          │    perché gestisco quotidianamente un contesto molto simile."
          │
MIN 24-32 │ PRESENTAZIONE — Chi sei + approccio
          │ • Chi sono (60 secondi)
          │ • Due filoni (2 minuti)
          │ • Metodo Know-How → Step → KPI (1 minuto)
          │ • Risultati concreti (1 minuto — numeri)
          │ • Collega ogni punto a qualcosa che LORO hanno detto
          │
MIN 32-40 │ PROPOSTA — Tech Assessment come entry point
          │ • 3 giorni, output concreto, zero rischio
          │ • Range pricing senza numero fisso
          │ • "Il primo mese non cambio niente — capisco"
          │
MIN 40-45 │ CHIUSURA
          │ • "C'è qualcosa che non vi ho detto?"
          │ • "Chi altro va coinvolto?"
          │ • "Vi mando una proposta scritta entro 48h"
          │ • Conferma next step concreto e data
```

---

## 2. INTRO: CHI È VERALAB

### Dati da citare in call (mostra che hai studiato — scegli 2-3 max)

| Dato | Frase da usare |
|------|----------------|
| 14 store fisici + e-commerce | "Gestite un retail omnichannel complesso — non solo un negozio online, ma una rete fisica con tutto quello che comporta in termini di inventory e logistica" |
| VERABILIA loyalty | "Avete un programma loyalty cross-channel — quello che tecnicamente è difficile da fare bene su sistemi separati" |
| Magazine settimanale SEO | "Il Magazine è un asset SEO aggiornato settimanalmente — è contenuto che costruisce traffico organico nel tempo" |
| Secondo brand Overskin | "State costruendo un secondo brand — significa che l'architettura che avete oggi deve reggersi su due realtà, non una" |
| Dynamics NAV | "NAV è il cuore operativo — inventory, B2B, logistica. È anche il punto dove si accumula il debito tecnico più silenzioso" |

### Profilo completo (per te — non da recitare)

| Dato | Valore |
|------|--------|
| **Brand** | Veralab — beauty e-commerce + retail fisico |
| **Store** | 14 store fisici + e-commerce Shopify |
| **ERP** | Dynamics NAV (gestione inventory fisico e B2B) |
| **Loyalty** | Programma VERABILIA cross-channel |
| **Secondo brand** | Overskin — dominio registrato, sito non ancora live (Aruba placeholder) |
| **Piattaforma e-commerce** | Shopify (con Cloudflare CDN attivo) |
| **App Shopify rilevanti** | Jebbit (quiz), Klaviyo (email), pixel Meta/Google, Trustpilot |
| **JD aperta** | Tech Lead (full-time dipendente) — Elios sceglie di proporre Fractional CTO |

### Cosa probabilmente NON sanno che sai

- Che `/blogs/news` è in 500 da settimane
- Che non hanno alerting configurato su errori 5xx
- Che la homepage pesa 765KB (LCP stimato 3-4s)
- Che Overskin è ancora un placeholder Aruba
- Che JSON-LD non è configurato — nessun rich result su Google

**Strategia**: il 500 apre la conversazione. Il resto lo riveli gradualmente durante la discovery.

---

## 3. APERTURA CON I DATI — Script

Non iniziare a parlare di te. Apri con ciò che hai trovato.

> "Quando mi avete risposto, stavo aspettando questo momento. Ho fatto un'analisi tecnica del sito prima di scrivervi — non slide, script che girava live sui vostri endpoint.
>
> La cosa più urgente: `/blogs/news` — il Magazine Veralab, quello che aggiornate ogni settimana per il SEO e per la community — risponde HTTP 500 in produzione adesso. Ogni utente che arriva da Google su quel contenuto vede un errore. Non è nei vostri alert perché non c'è monitoring configurato su quel percorso. Probabilmente succede da settimane senza che nessuno lo sappia.
>
> Ho altri sei finding, ma quello era il più urgente da dirvi subito. Nessuno si presenta così normalmente — ma non sono qui per sprecare il vostro tempo: voglio che sappiate concretamente cosa vi porto prima ancora di discutere del modello."

Pausa. Lascia che reagiscano.

**Perché funziona:**
- Mostra lavoro fatto prima della call (rispetto + competenza)
- Il 500 è verificabile in 10 secondi — non un'opinione
- "Non sono qui per sprecare il vostro tempo" → abbassa la resistenza
- La pausa dopo è potente — aspetta che reagiscano, non riempire il silenzio

---

## 4. PRESENTAZIONE: CHI SONO IO

### Script "Chi sono" (60-90 secondi)

> "Mi presento in trenta secondi, poi vi spiego come lavoro.
>
> Sono Elios Scoglio, Software & Architecture Manager. Da dieci anni lavoro su piattaforme mission-critical — oggi gestisco l'architettura di un sistema che processa trenta milioni di transazioni l'anno, con vincoli di compliance fiscale, integrazioni con enti statali, e un requisito di zero-downtime.
>
> In pratica: 93 componenti, 7 livelli architetturali, 3 team di sviluppo che devono andare nella stessa direzione. Non scrivo codice — definisco la direzione tecnica, i processi, e gli standard.
>
> La cosa che vi riguarda: gestisco sistemi con spike di traffico prevedibili — esattamente come un lancio prodotto con copertura influencer. Un errore in quel momento costa vendite reali. E gestisco da anni il problema dell'inventory sincronizzato tra sistemi eterogenei — il vostro problema Shopify-NAV lo conosco dall'interno."

### Credenziali da NON citare (a meno che chiedano)

- Il nome TicketOne/Eventim
- Titoli di studio
- Lista di tecnologie

### Credenziali da citare SE approfondiscono

| Se chiedono | Rispondi |
|-------------|----------|
| "Che settore?" | "Ticketing nazionale — concerti, sport, 30M biglietti/anno. Diverso dal vostro, ma identici pattern: spike traffico, inventory critico, integrazioni esterne che non puoi permetterti di perdere." |
| "Hai esperienza e-commerce?" | "Non ho gestito un Shopify da imprenditore — ma ho gestito sistemi con la stessa complessità tecnica: checkout sotto pressione, inventory concorrente, logistica distribuita. I problemi architetturali sono gli stessi." |
| "Hai esperienza con NAV/BC?" | "Ho gestito migrazioni legacy in produzione — sistemi che non puoi fermare mentre li modernizzi. La decisione NAV→Business Central ha le stesse dinamiche di qualsiasi migrazione critica: risk assessment, timing, costo del non farlo vs costo del farlo sbagliato." |

---

## 5. IL MIO APPROCCIO: DUE FILONI + METODO

### Come introdurlo (dopo la discovery)

> "Sulla base di quello che mi avete raccontato, vi spiego come lavoro. Il mio approccio si basa su due filoni paralleli — uno guarda al presente, l'altro alla visione."

### Filone 1 — PRESENTE: Concretizzare e ottimizzare

> "Il primo filone è pratico e immediato. Guardiamo come lavorate oggi — i flussi, le best practice, il monitoring. Non rivoluzioni. Miglioramenti concreti che il team sente nelle prime settimane. Fix del Magazine, alert su 5xx, pipeline di deploy più stabile, code review strutturata, incident management chiaro."

**Frase di ancoraggio**: "Far funzionare meglio quello che già funziona."

### Filone 2 — VISIONE: Architettura, scale, decisioni critiche

> "Il secondo filone guarda avanti. Come risolviamo l'inventory sync tra Shopify e NAV? Quando è il momento giusto per migrare a Business Central, e con quale approccio? Come architettate Overskin in modo che non diventi un secondo silos? Queste decisioni costano 6-12 mesi se sbagliate — il mio lavoro è non sbagliare."

**Frase di ancoraggio**: "Vedere dove andare prima di arrivarci."

### Il Metodo: Know-How → Step → KPI

> "Come funziona in pratica? Il primo mese non cambio NIENTE. Ascolto, mappo, misuro. Capisco il vostro stack e il vostro team. A fine mese consegno un documento con: dove siete, dove potete andare, cosa rischia. Poi definiamo insieme obiettivi concreti con tempi e KPI — numeri veri, misurabili, mese per mese. Se dopo 3 mesi i numeri non migliorano, ne parliamo."

---

## 6. DISCOVERY: DOMANDE DA FARE

### Principio: 4-5 domande max. Non un questionario — una conversazione.

### Must-ask

| # | Domanda | Cosa ascolto |
|---|---------|-------------|
| 1 | "Cosa vi ha portato a cercare una figura di governance tecnica proprio ora?" | Trigger: crescita? problema acuto? decisione rimasta in sospeso? |
| 2 | "Chi prende le decisioni tecniche oggi — su Shopify, su NAV, sulle integrazioni?" | Il vuoto che riempio. "Nessuno" o "lo facciamo insieme" = leva massima. |
| 3 | "Come funziona oggi la sincronizzazione inventory tra Shopify e i 14 store fisici? Real-time o batch notturno?" | Gap #1 già identificato — vedo se lo sanno o lo sottovalutano. |
| 4 | "Overskin — avete già definito lo stack o è ancora aperto?" | Progetto nuovo in corso = primo deliverable concreto. |

### Domanda killer (fine discovery)

> "Se poteste risolvere un solo problema tecnico nei prossimi 90 giorni, quale sarebbe?"

| Risposta | Interpretazione |
|----------|----------------|
| Strategica (NAV, inventory, Overskin) | Fit ottimo — è esattamente il perimetro FCTO |
| Operativa (fix un bug, aggiungere una feature) | Forse vogliono un dev senior. Chiarire prima di procedere. |
| Non sanno rispondere | **Hanno bisogno di direzione** — è esattamente quello che faccio |

### Follow-up naturali (non da lista — da usare nel flusso)

> "Interessante. E come gestite [X] oggi?"
> "Da quanto tempo è così?"
> "Cosa succede quando [X] va storto?"
> "Chi se ne occupa attualmente?"

---

## 7. PRICING E OPZIONI

### Il principio: non vendere il prezzo — vendi il modello

Non dare mai un numero secco. Dai un RANGE legato al valore, ancorato al costo del full-time.

### Le 3 opzioni (non presentarle tutte — scegli in base alla discovery)

| Opzione | Giorni/settimana | EUR/mese | Durata | Per chi |
|---------|-----------------|----------|--------|---------|
| **Standard** | 3 gg/sett | 7.000 – 8.000 | Min 6 mesi | Setup normale, team già presente |
| **Bridge** | 4 gg/sett | 10.000 – 12.000 | Max 4 mesi, poi Standard | Onboarding intensivo, decisioni urgenti (NAV, Overskin) |
| **Tech Assessment** | 3 giorni totali | 2.500 – 3.500 | Una tantum | Entry point a bassa barriera — detratto se si prosegue |

**Floor assoluto**: mai sotto €6.500/mese ongoing. Non scendere.

### Come presentare il prezzo in call

> "Il modello è semplice: un retainer mensile fisso che copre 3 giorni di presenza a settimana. Non vendo ore — vendo direzione e risultati misurabili.
>
> Per darvi un'idea: un Tech Lead / Direttore Tecnico senior all-in costa tra i 120 e i 180K l'anno. Il mio modello a 3 giorni si posiziona tra i 7 e gli 8 mila euro al mese — meno della metà, con la stessa seniority disponibile nei momenti che contano davvero.
>
> Se nella fase iniziale volete più presenza — diciamo 4 giorni mentre mappiamo lo stack e prendete le prime decisioni su NAV e Overskin — c'è un modello Bridge temporaneo che poi transita al regime standard."

### Entry point: Tech Assessment

> "Vi propongo di partire con un Tech Assessment — 3 giorni, output concreto: audit completo Shopify/NAV/integrazioni, integration map dove i dati si rompono, top 5 rischi con impatto in EUR, roadmap 12 mesi, e una raccomandazione su NAV→Business Central con dati — non con opinioni. Più il fix del Magazine se ancora presente.
>
> Costa tra 2.500 e 3.500 euro. Se poi decidiamo di proseguire come Fractional CTO, il costo viene detratto dal primo mese. Se non proseguiamo, avete comunque una roadmap concreta. Zero rischio."

---

## 8. OBIEZIONI E RISPOSTE

### Tecnica: FORMULA (Feel — Felt — Found)

> "Capisco [la preoccupazione]. Anche [altri] hanno avuto lo stesso dubbio. Quello che hanno trovato è [risultato]."

### Le 7 obiezioni più probabili

| Obiezione | Risposta |
|-----------|----------|
| **"Cerchiamo full-time"** | "Lo capisco. Ma un Tech Lead / Direttore Tecnico con questa seniority all-in costa 150-180K. Con il fractional: stessa competenza nei momenti che contano, a meno della metà. Se dopo 12 mesi volete internalizzare, vi aiuto a trovare la persona e a fare l'onboarding." |
| **"3 giorni bastano?"** | "In 3 giorni di governance strategica faccio quello che un junior non fa in 3 settimane di esecuzione. Non sono ore di codice — sono ore di direzione. Il team esegue — io garantisco che eseguano nella direzione giusta." |
| **"Come fai a capire il nostro business?"** | "Non lo capisco in una settimana — lo capisco in 4 settimane di ascolto. Ma i problemi architetturali che avete — inventory sync, ERP migration, multi-brand — sono pattern che conosco dall'interno. Il dominio specifico lo imparo; le competenze che porto non si improvvisano." |
| **"Costa troppo per noi"** | "Quanto vi è costata l'ultima decisione tecnica sbagliata? Una scelta ERP errata su un business come il vostro vale 200-400K di rework. Il mio retainer annuale è meno di un terzo di quello." |
| **"Abbiamo già provato consulenti"** | "Che tipo di consulente? E cosa non ha funzionato? [ASCOLTA] La differenza: non scrivo un report e sparisco. Sono al tavolo ogni settimana. Dopo 3 mesi conosco il codice, il team, i vincoli. Non sono esterno — sono parte del sistema." |
| **"Ci serve qualcuno che scriva anche codice"** | "Se il bisogno primario è scrivere codice, vi serve un senior developer — è un profilo diverso. Ma quello che ho trovato questa settimana — il 500 sul Magazine, l'assenza di monitoring, i gap inventory — non li risolve uno che scrive codice. Li risolve chi decide dove guardare." |
| **"Possiamo fare un mese di prova?"** | "Il Tech Assessment è la prova: 3 giorni, output concreto, zero vincolo. Ma un mese non basta per risultati reali — il minimo per vedere valore misurabile è 3 mesi. E poi si rivaluta insieme." |

---

## 9. RED FLAGS E SCENARIO PLANNING

### Red flag — monitorare durante la call

| Segnale | Cosa significa | Azione |
|---------|---------------|--------|
| "Ci serve qualcuno che scriva codice" | Vogliono un dev senior economico | Chiarire subito. Se insistono: declina |
| "Budget max 3-4K/mese" | Sotto soglia di qualità | Proponi Tech Assessment standalone o declina |
| "Trial 2 settimane gratis" | Non capiscono il valore | Offri Tech Assessment (pagato). Non negoziare il gratis. |
| Nessun decisore in call | HR fa screening | Chiedi di parlare col CEO dopo |
| "Vuole che gestisca anche gli sprint" | Confondono FCTO con PM | Chiarire ruolo subito |
| "Il fondatore decide tutto tech" | Possibile micromanagement | Verificare autonomia decisionale nel ruolo |

### Scenari post-call

| Scenario | Azione |
|----------|--------|
| **"Andiamo avanti"** | Tech Assessment entro 2 settimane. Conferma scritta entro 24h. |
| **"Interessante, ci pensiamo"** | Proposta scritta entro 48h. Follow-up dopo 5 giorni. |
| **"Cerchiamo full-time"** | "Capisco. Se cambiate idea, resto disponibile." Fine professionale. |
| **"Budget basso"** | Proponi Tech Assessment standalone. Se rifiutano anche quello, non è il cliente giusto. |
| **"Possiamo fare Bridge (4gg) subito?"** | Sì, ma chiarisci da subito: Bridge è temporaneo (max 4 mesi), poi Standard. Metti per iscritto nella proposta. |

---

## 10. TECNICHE COMUNICATIVE

### Pattern retorici da usare

**1. Regola del 3**
> "Ascolto. Codifico. Misuro."
> "Architettura. Team. Strategia."
> "Prima misuro, poi propongo, poi eseguo."

**2. Specifico > Generico**
Non "ho trovato problemi". Sempre: "il Magazine risponde 500 — è in produzione adesso, non è nei vostri alert, succede da settimane."

**3. Contrasto (Before/After)**
- "Da deploy ogni 6 settimane a ogni settimana"
- "Da analisi di 3 giorni a 2 ore"
- "Da nessun monitoring a golden signals su ogni servizio"

**4. Framing di sicurezza**
- "Il primo mese non cambio niente"
- "Zero rischio" (Tech Assessment)
- "Se non funziona, non rinnoviamo"

**5. Loss aversion (funziona 2x di gain)**
- "Quanto vi costa non avere inventory sync durante un lancio influencer?"
- "Ogni trimestre senza decisione su NAV aumenta il rischio di doverla prendere in emergenza"
- "Il content marketing che costruite ogni settimana non porta traffico finché quel 500 è lì"

**6. Anchoring**
Dai il numero alto PRIMA del tuo prezzo.
- "Un Tech Lead senior all-in: 150-180K/anno. Il mio modello: meno della metà."

**7. Social proof implicito**
Non dire "ho tanti clienti". Mostra competenza attraverso dettagli specifici:
- "Gli spike durante i lanci li gestisco con circuit breaker e backpressure — stessa dinamica di un on-sale ticketing"
- "L'inventory sync in real-time richiede idempotenza su ogni operazione critica — altrimenti oversell"

### Frasi da avere pronte

> **Sul valore:**
> "Il mio lavoro è fare in modo che le prossime 100 decisioni tecniche del team siano migliori."

> **Sulla differenza:**
> "Un dev senior risolve i problemi di oggi. Io prevengo quelli di domani."

> **Sul rischio:**
> "Il rischio non è provare il fractional. Il rischio è continuare senza direzione per altri 12 mesi."

> **Sull'AI:**
> "Porto AI dove ha senso — non come hype ma come strumento. Ve lo dimostro con numeri, non con slide."

> **Sul 500:**
> "Questo l'ho trovato prima di scrivervi. Il giorno dopo l'onboarding, lo chiudiamo."

---

## 11. CHECKLIST PRE-CALL

### Da decidere PRIMA

1. **Disponibilità**: 3 gg/sett standard. Bridge 4gg disponibile max 4 mesi. Quali giorni?
2. **On-site**: Milano — disponibile. Frequenza: 1-2 volte/mese.
3. **Pricing floor**: Standard min €6.500/mese. Bridge min €10.000/mese. Non scendere.
4. **P.IVA**: operativa e regime fiscale confermato?
5. **Timeline start**: quando puoi iniziare? Tech Assessment: entro 2 settimane dalla firma.
6. **Brand**: ti presenti come "108 Vision" o "Elios Scoglio"? Per primo cliente forse meglio nome personale.

### Da fare PRIMA della call

- [ ] Rileggere `ANALISI_Tecnica_Veralab_SiteAudit.md` — avere i numeri a memoria
- [ ] Verificare live `/blogs/news` — è ancora 500? (apri browser durante call se utile mostrarlo)
- [ ] Rileggere `STRATEGIA_Negoziazione_Veralab.md` — pricing e floor confermati
- [ ] Avere `PRES_Veralab_EliosScoglio.md` aperto per condivisione schermo se la call lo permette
- [ ] Stanza tranquilla, videocamera accesa, sfondo neutro
- [ ] Blocco note aperto per appunti
- [ ] Range pricing in testa: 7-8K standard, 10-12K bridge, 2.5-3.5K assessment

### Da preparare DOPO (se va bene)

- [ ] Proposta scritta (1-2 pagine) entro 48h
- [ ] Conferma date per Tech Assessment
- [ ] Calendario primo mese con le 4 sessioni mensili fisse

---

*Documento: v1.0 | 2026-07-14*
*Modello: adattato da PREP_Call_EticaSoluzioni_20260616.md*
*Companion: `ANALISI_Tecnica_Veralab_SiteAudit.md` · `STRATEGIA_Negoziazione_Veralab.md` · `PRES_Veralab_EliosScoglio.md`*
