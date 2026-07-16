# Strategia — Veralab: Proposta Fractional CTO
**Uso interno — non condividere**
**Aggiornato: 2026-07-13 — Frame: Fractional CTO puro, nessun ibrido**

---

## Il cambio di frame

Il documento precedente ragionava su come "guadagnarsi la flessibilità" partendo da un full-time nominale. Quella strategia era sbagliata per due motivi:

1. **Posizionamento falso**: entrare come candidato dipendente e rivelare poi il modello reale è una bugia per omissione. Se la scoprono dopo, tutto si rompe.
2. **Obiettivo sbagliato**: il mio obiettivo è costruire 108 Vision, non cercare un impiego dipendente con meno ore.

**Il frame corretto**: mi presento come Fractional CTO, propongo un modello chiaro, mostro valore immediato con il lavoro già fatto. Chi vuole questo profilo, lavoriamo insieme. Chi vuole un dipendente full-time, lo rispetto — non è per me.

---

## La proposta concreta

### Modello Standard (steady state)

- **3 giorni a settimana** (12 giorni/mese) — remoto + 1-2 presenze mensili in sede
- **€10.000–12.000/mese** retainer fisso, contratto da consulente PI
- Durata minima: 6 mesi

### Modello Bridge (primo periodo — opzionale, non default)

- **4 giorni a settimana** (16 giorni/mese) per le prime 12–16 settimane
- **€14.000–16.000/mese**
- Serve se vogliono più presenza nella fase di onboarding e assessment iniziale
- Transizione automatica al modello Standard dopo il periodo concordato — **non è negoziabile come forma permanente**

### Entry point: Tech Assessment

- **3 giorni di lavoro**, €2.500–3.500
- Output: Tech Map completa (Shopify, NAV, integrazioni, POS), integration map dove i dati si rompono, top 5 rischi, roadmap prioritizzata 12 mesi, decisione NAV → Business Central con dati
- Se proseguono come Fractional CTO → il costo viene detratto dal primo mese
- Se non proseguono → escono con un deliverable concreto e verificabile. Zero rischio

Il Tech Assessment è l'entry point giusto: bassa barriera d'ingresso, alto valore immediato, nessun impegno a lungo termine per nessuno dei due. E risolve il 500 nel primo giorno.

---

## Come aprire la conversazione

**Non mandare il CV. Non rispondere alla JD come candidato.**

### Canale: email/LinkedIn diretta alla decision-maker (CEO o COO)

Non alla HR. La HR ha il mandato di cercare un dipendente full-time — non puoi convertire quella conversazione dall'interno. Cerca il nome del CEO/COO su LinkedIn, scrivi direttamente.

### Template apertura

---

*Oggetto: Ho analizzato il vostro stack — c'è qualcosa che probabilmente non sapete*

*Gentile [Nome],*

*Ho visto l'apertura Tech Lead e ho fatto un'analisi tecnica del sito Veralab prima di contattarvi. Ho trovato tre problemi concreti che probabilmente non avete nel monitoring — incluso un HTTP 500 in produzione sul blog (il Magazine SEO) che non risulta monitorato.*

*Non mi propongo come candidato dipendente per quel ruolo. Gestisco già un sistema mission-critical a tempo pieno. Mi propongo come Fractional CTO: 3 giorni a settimana, obiettivi trimestrali misurabili, retainer mensile fisso.*

*Non voglio sprecare il vostro tempo né il mio — se cercate esclusivamente un full-time dipendente, non sono la persona giusta. Se siete disposti a valutare un modello diverso, ho già il 90% dell'analisi fatta: vi basta una call di 30 minuti.*

*Elios Scoglio | 108 Vision | elios@108vision.it*

---

**Perché funziona:**
- Mostra lavoro già fatto — non promesse
- È onesto sul modello fin dal primo messaggio
- Qualifica immediatamente: se vogliono solo full-time, non perdere tempo
- Il 500 è il hook concreto che li fa rispondere

---

## Come gestire "cerchiamo full-time"

> "Lo capisco — è il percorso classico. Permettetemi di farvi una domanda: nelle ultime decisioni tecniche importanti — NAV versus Business Central, la sincronizzazione inventory con i 14 store, l'architettura di Overskin — chi ha dato l'advisory?
>
> Il valore di un CTO senior non è nelle ore in ufficio. È in tre o quattro decisioni architetturali all'anno fatte bene. Quella sull'ERP vale da sola 100–300K di costo evitato. Con il fractional pagate quelle decisioni — non il tempo sulla sedia tra una e l'altra.
>
> Se dopo 6 mesi decidete che volete internalizzare, vi aiuto a trovare la persona e a fare l'onboarding. Il modello fractional non è per sempre — è per costruire la direzione tecnica mentre scegliete la persona giusta."

**Cosa NON fare:**
- Non offrire un ibrido confuso ("posso fare 4 giorni come dipendente part-time")
- Non cedere al "provate gratis per un mese" — l'entry point è il Tech Assessment, pagato
- Non abbassare il prezzo per chiudere — abbassa i giorni, mai il day rate

---

## Come usare le debolezze trovate

Il `/blogs/news` HTTP 500 è il pezzo più potente. Non è una slide — è un problema reale, in produzione, adesso, che loro non sanno di avere.

**Come usarlo in apertura:**

> "Ho analizzato il sito prima di contattarvi. Vi mostro una cosa: `/blogs/news` — il Magazine, il vostro asset SEO principale, aggiornato ogni settimana — risponde HTTP 500 in questo momento. Non è nei vostri alert perché non avete monitoring configurato su quel percorso. Ogni utente che arriva da Google su quel contenuto vede un errore. E probabilmente sta succedendo da settimane."

Poi il contesto tecnico: conflitto tra app Shopify e tema, probabilmente causato dall'installazione o aggiornamento di un'app di terze parti. Fix in 2–4 ore una volta identificata la causa.

**Gli altri finding da portare (in ordine di impatto):**

| # | Finding | Severity | Stato |
|---|---------|----------|-------|
| 1 | `/blogs/news` HTTP 500 — Magazine SEO rotto | P0 | [verificato live] |
| 2 | NAV come SPOF senza fallback — se va offline, nessuna gestione ordini | P0 | [probabile] |
| 3 | Nessun alerting su errori 5xx | P0 | [verificato indirettamente] |
| 4 | JSON-LD assente — Google non mostra rich results | P1 | [verificato] |
| 5 | CSP assente — XSS via terze parti non protetto | P1 | [verificato] |
| 6 | Overskin non ha sito — brand in costruzione | Info | [verificato] |
| 7 | Homepage 765KB — Core Web Vitals probabilmente sotto soglia | P2 | [verificato] |

---

## Sequenza completa

| Step | Azione | Timing | Output atteso |
|------|--------|--------|---------------|
| 1 | Email/LinkedIn a CEO/COO (non HR) | Subito | Risposta o silenzio in 3–5 gg |
| 2 | Call discovery 30–45 min | Entro 1 settimana dalla risposta | Capire fit, pain, budget |
| 3 | Se fit confermato: proposta scritta | 48h dopo call | Documento con modello + pricing + scope |
| 4 | Se accettano: contratto Tech Assessment | 1–2 settimane | Kick-off e accessi |
| 5 | Fine Tech Assessment: revisione insieme | 3–4 settimane dopo kick-off | Decisione Fractional CTO ongoing |

---

## Pricing recap (non cedere)

| Modello | Giorni/sett | EUR/mese | Durata |
|---------|-------------|----------|--------|
| Tech Assessment | — | 2.500–3.500 (una tantum) | 3 giorni di lavoro |
| Standard | 3 | 10.000–12.000 | Minimo 6 mesi |
| Bridge (opzionale) | 4 | 14.000–16.000 | Max 4 mesi, poi Standard |

**Floor assoluto**: mai sotto €6.500/mese per un contratto ongoing. Sotto quella soglia non ho le ore per fare il lavoro bene — e il cliente lo sente.

---

## I rischi reali

| Rischio | Mitigazione |
|---------|-------------|
| Ignorano la mail (vogliono solo full-time) | È la qualifica che cerchi. Non inseguire. |
| Vogliono Bridge permanente (4gg per sempre) | Chiarire da contratto: Bridge è temporaneo, max 4 mesi. Poi Standard o si chiude. |
| Chiedono di abbassare il prezzo | Abbassa i giorni, mai il day rate. |
| CEO vuole reperibilità telefonica continua | Incluso per emergenze reali. Non per domande quotidiane. Va scritto nel contratto. |
| Il 500 viene fixato internamente prima della call | Ottimo — significa che il finding ha creato valore immediato. Hai altri 6 finding da mostrare. |

---

*Uso interno — 2026-07-13*
*Frame: Fractional CTO puro. Nessun ibrido. Nessuna ambiguità.*
