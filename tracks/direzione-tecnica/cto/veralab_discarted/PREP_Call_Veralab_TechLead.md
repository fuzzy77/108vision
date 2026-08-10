# Preparazione — Prima Call con Veralab
## Fractional CTO Discovery Call | 108 Vision

**Tipo call**: Discovery + Proposta Fractional CTO
**Durata target**: 30–45 minuti
**Interlocutore target**: CEO / COO — se risponde solo HR, chiedere di coinvolgere il decisore prima della call
**Contesto**: Contatto avviato con email che cita il 500 sul Magazine. Questa è la call di risposta.
**Companion**: `ANALISI_Tecnica_Veralab_SiteAudit.md` · `STRATEGIA_Negoziazione_Veralab.md`

---

## Principio di questa call

Non è una call per candidarsi. È una call per **capire se esiste un fit** tra il problema di Veralab e il modello Fractional CTO.

Esco con una di tre conclusioni:
1. **Fit confermato** → proposta scritta entro 48h
2. **Potenziale da esplorare** → follow-up con Tech Assessment come entry point
3. **No fit** → fine pulita, professionale, senza insistere

La mia posizione è forte: ho già fatto il lavoro (site audit, gap analysis, risk assessment) prima della call. Loro lo sanno. Questo cambia la dinamica — non sono un candidato che si presenta, sono un professionista che ha già dimostrato qualcosa.

---

## Struttura call (45 minuti)

```
MIN 0-2   │ WARM UP
          │ • Ringrazia per il tempo, conferma durata
          │ • "Prima di raccontarvi di me, ho preparato
          │   qualcosa — vi mostro cosa ho trovato"
          │
MIN 2-8   │ APERTURA CON I DATI (tu parli)
          │ • HTTP 500 Magazine — P0, in produzione adesso
          │ • 2–3 gap architetturali in ordine d'impatto
          │ • "Non sono slide — li ho misurati live"
          │ • Non spiegare tutto — crea curiosità, poi
          │   passa subito a loro
          │
MIN 8-22  │ DISCOVERY (loro parlano, tu ascolti)
          │ • Domande chiave (sezione sotto)
          │ • Mirror: riformula quello che dicono
          │ • Nota pain, trigger, team, segnali budget
          │
MIN 22-32 │ CHI SONO + IL MODELLO FRACTIONAL CTO
          │ • 60 secondi su chi sei
          │ • Spiega il modello (non "consulente" generico)
          │ • Range pricing senza numero fisso
          │
MIN 32-40 │ ENTRY POINT: TECH ASSESSMENT
          │ • 3 giorni, output concreto, zero rischio
          │ • Se proseguono → Fractional. Se no → hanno
          │   una roadmap che vale comunque
          │
MIN 40-45 │ CHIUSURA
          │ • "C'è qualcosa che non vi ho detto?"
          │ • "Chi altro deve essere in loop?"
          │ • "Vi mando una proposta scritta entro 48h"
          │ • Conferma next step concreto e data
```

---

## Apertura con i dati — Script

Non iniziare a parlare di te. Apri con ciò che hai trovato.

> "Quando mi avete risposto, stavo aspettando questo momento. Ho fatto un'analisi tecnica del sito prima di scrivervi — non slide, script che gira live sui vostri endpoint.
>
> La cosa più urgente: `/blogs/news` — il Magazine Veralab, quello che aggiornate ogni settimana per il SEO e per la community — risponde HTTP 500 in produzione adesso. Ogni utente che arriva da Google su quel contenuto vede un errore. Non è nei vostri alert perché non c'è monitoring configurato su quel percorso. Probabilmente succede da settimane senza che nessuno lo sappia.
>
> Ho altri sei finding, ma quello era il più urgente da dirvi subito. Nessuno si presenta così normalmente — ma non sono qui per sprecare il vostro tempo: voglio che sappiate concretamente cosa vi porto prima ancora di discutere del modello."

Pausa. Lascia che reagiscano.

---

## Domande di discovery

Fare 4–5 domande max. Non è un questionario — è una conversazione. Usa il follow-up naturale: *"Interessante. E come gestite X oggi?"*

### Must-ask

| # | Domanda | Cosa ascolto |
|---|---------|-------------|
| 1 | "Cosa vi ha portato a cercare una figura di governance tecnica proprio ora?" | Il trigger: crescita, problema acuto, decisione rimasta in sospeso? |
| 2 | "Chi prende le decisioni tecniche oggi — su Shopify, su NAV, sulle integrazioni?" | Il vuoto che riempio. "Le prendiamo insieme" o "nessuno" = leva massima. |
| 3 | "Come funziona oggi la sincronizzazione inventory tra Shopify e i 14 store fisici? C'è real-time o è batch notturno?" | Pain omnichannel — è il gap #1 che ho già identificato. |
| 4 | "Overskin — avete già definito lo stack o è ancora aperto?" | Progetto nuovo in corso = opportunità concreta di progetto nel primo anno. |

### Domanda killer (fine discovery)

> "Se poteste risolvere un solo problema tecnico nei prossimi 90 giorni, quale sarebbe?"

| Risposta | Interpretazione |
|----------|----------------|
| Strategica (NAV, inventory, Overskin) | Fit ottimo — è esattamente il perimetro FCTO |
| Operativa (fix un bug specifico) | Forse vogliono un dev senior. Chiarire prima di procedere. |
| Non sanno rispondere | **Hanno bisogno di direzione** — è esattamente quello che faccio |

---

## Chi sono — Script (60 secondi)

> "In sintesi: sono Software & Architecture Manager su un sistema mission-critical — 30 milioni di transazioni l'anno, compliance con la normativa fiscale italiana, integrazioni con enti statali. Non scrivo codice — definisco la direzione tecnica, i processi decisionali, i confini architetturali.
>
> Ho scelto di non candidarmi a quel ruolo perché gestisco già un sistema a tempo pieno. Quello che vi offro è diverso: 3 giorni a settimana come Fractional CTO — la qualità decisionale di un profilo enterprise applicata al vostro contesto, senza il costo di un full-time che finanziate anche nelle ore in cui nessuno decide niente."

---

## Il modello Fractional CTO — Come spiegarlo

> "Come funziona in pratica. Retainer mensile fisso: 3 giorni a settimana, remoto con 1–2 presenze mensili in sede. Non vendo ore — vendo quattro cose: Strategia (roadmap tecnica allineata agli obiettivi di business), Architettura (decisioni strutturali con trade-off espliciti), Team (sviluppo del vostro Tech Lead interno) e Stakeholder (traduco il tecnico in linguaggio di business per il CEO e il board).
>
> Il primo mese non cambio niente. Mappo lo stack, parlo con il team, misuro i gap. A fine mese avete un documento: dove siete, dove potete andare, cosa rischia. Poi definiamo obiettivi trimestrali — non opinion, numeri misurabili. Se dopo 3 mesi i numeri non migliorano, ne parliamo. Non ho interesse a tenere un contratto che non crea valore."

---

## Pricing — Come presentarlo

Non dare il numero fisso. Dai il range con l'ancoraggio.

> "Per darvi un'idea concreta: un CTO senior full-time all-in costa tra i 150 e i 180K l'anno. Con il modello fractional a 3 giorni a settimana, il range è tra i 7 e gli 8 mila euro al mese — meno della metà, con la stessa seniority disponibile nei momenti che contano davvero.
>
> Se volete più presenza nella fase iniziale — diciamo 4 giorni nelle prime 12–16 settimane — si posiziona tra i 14 e i 16K mensili per quel periodo, poi si scende al regime standard."

**Floor assoluto**: mai sotto €6.500/mese ongoing. Non scendere.

---

## Entry point: Tech Assessment

> "Vi propongo di partire con un Tech Assessment — 3 giorni di lavoro concentrato. Output scritto: audit completo Shopify/NAV/integrazioni, integration map dove i dati si rompono tra sistemi, top 5 rischi con impatto stimato, roadmap 12 mesi, e una raccomandazione su NAV → Business Central con dati — non con opinioni.
>
> Costa tra i 2.500 e i 3.500 euro. Se poi decidiamo di proseguire come Fractional CTO, il costo viene detratto dal primo mese. Se non proseguiamo, avete comunque una roadmap concreta e verificabile. Zero rischio per voi — e per me il rischio è che vi piaccia tanto da voler andare avanti."

---

## Obiezioni probabili e risposte

| Obiezione | Risposta |
|-----------|---------|
| **"Cerchiamo full-time"** | "Lo capisco. Il valore di un CTO non è nelle ore — è in 3–4 decisioni architetturali l'anno fatte bene. Quella su NAV→BC vale da sola 100–300K di costo evitato. Con il fractional pagate le decisioni. Se poi volete internalizzare, vi aiuto a trovare la persona e a fare l'onboarding." |
| **"2 giorni bastano?"** | "In 2 giorni di governance strategica faccio quello che un junior non fa in 2 settimane di esecuzione. Il team esegue — io garantisco che eseguano nella direzione giusta." |
| **"Costa troppo"** | "Quanto vi è costata l'ultima decisione tecnica sbagliata? Una scelta ERP errata su 70M di revenue vale 200–400K di rework. Il mio retainer annuale è meno di un decimo di quello." |
| **"Non abbiamo team tecnico"** | "Perfetto — il mio primo deliverable è dirvi di chi avete bisogno e in quale ordine. Non assumete nessuno prima del Tech Assessment." |
| **"Proviamo un mese gratis"** | "L'entry point che vi propongo è il Tech Assessment: 3 giorni, pagato, output concreto. Un mese 'gratuito' non produce niente di verificabile — produce relazione. Quella la costruiamo dopo." |
| **"Sappiamo già i problemi"** | "Ottimo — allora siamo già allineati sulla diagnosi. La domanda è: chi costruisce la roadmap e garantisce che le soluzioni siano quelle giuste, nel giusto ordine?" |

---

## Red flag — non procedere se:

- Vogliono che scriva codice ("darebbe anche una mano con qualche sprint")
- Budget dichiarato < €5K/mese senza margine
- Dopo la risposta positiva via email, reinseriscono la HR come unico interlocutore
- Cambiano priorità tre volte nella stessa call di 30 minuti

---

## Scenari post-call

| Scenario | Azione |
|----------|--------|
| **"Andiamo avanti"** | Proposta scritta entro 48h. Conferma scritta del next step in call. |
| **"Interessante, ci pensiamo"** | Proposta scritta entro 48h. Follow-up dopo 5 giorni se silenzio. |
| **"Cerchiamo full-time"** | "Capisco. Se cambia qualcosa, resto disponibile." Fine professionale. |
| **"Budget basso"** | Proponi Tech Assessment come entry point a bassa barriera. Se rifiutano anche quello, non è il cliente giusto. |
| **"Ci piace — possiamo fare Bridge (4gg)?"** | Sì, ma chiarisci da subito: Bridge è temporaneo (max 4 mesi), poi Standard. Mettilo per iscritto nella proposta. |

---

## Checklist pre-call

- [ ] Rileggere `ANALISI_Tecnica_Veralab_SiteAudit.md` — avere i numeri a memoria
- [ ] Rileggere `STRATEGIA_Negoziazione_Veralab.md` — pricing e floor confermati
- [ ] Tenere aperto il browser con veralab.it/blogs/news durante la call se utile mostrare
- [ ] P.IVA operativa e regime fiscale confermato
- [ ] Disponibilità concreta: 3 gg/sett steady, max 4 gg Bridge (max 4 mesi)
- [ ] Range pricing in testa: 7–8K standard, 14–16K bridge, 2.5–3.5K assessment
- [ ] Setting: stanza tranquilla, videocamera accesa, blocco note aperto

---

*Documento: v2.0 | 2026-07-13*
*Aggiornato: preparazione colloquio dipendente → proposta Fractional CTO*
*Companion: `ANALISI_Tecnica_Veralab_SiteAudit.md` · `STRATEGIA_Negoziazione_Veralab.md`*
