---
title: "Playbook — Direzione Tecnica"
subtitle: "Guida operativa interna — Canale 1"
author: "Elios Scoglio"
track: "direzione-tecnica"
type: "playbook-interno"
version: "1.0"
date: "2026-08-10"
brand: "108 Vision"
supersedes: "cto/108CTO-Playbook.md (uso commerciale)"
fonte_posizionamento: "brand/riposizionamento-partner-tecnico.md v2.0"
---

# Playbook — Direzione Tecnica

> **Documento interno.** Non per il cliente. Sostituisce l'uso commerciale di `cto/108CTO-Playbook.md` (naming legacy «Fractional CTO»).
> Fonte di verità posizionamento: `brand/riposizionamento-partner-tecnico.md`.

---

## Indice rapido

1. [Posizionamento e differenziazione](#1-posizionamento-e-differenziazione)
2. [Target e anti-target](#2-target-e-anti-target)
3. [Tre modalità di ingaggio](#3-tre-modalità-di-ingaggio)
4. [Vincolo di capacità e contratto](#4-vincolo-di-capacità-e-contratto)
5. [Processo end-to-end](#5-processo-end-to-end)
6. [Pricing interno](#6-pricing-interno)
7. [Red flag](#7-red-flag)
8. [Script vendita e obiezioni](#8-script-vendita-e-obiezioni)
9. [AI nel contesto Direzione Tecnica](#9-ai-nel-contesto-direzione-tecnica)
10. [Competenze di dettaglio (link)](#10-competenze-di-dettaglio-link)
11. [Checklist operativa](#11-checklist-operativa)

---

## 1. Posizionamento e differenziazione

### Claim e identità

| Elemento | Valore |
|---|---|
| **Brand** | 108 Vision — Partner Tecnico |
| **Claim primario (unico)** | *«Il partner tecnico che prende in mano la situazione.»* |
| **Canale** | Direzione Tecnica (non «Fractional CTO» col cliente) |
| **Proposta** | Prendiamo ownership di decisioni tecniche e deliverable concordati — con ore chiare, non presenza illimitata |

### Cosa significa «Partner Tecnico» vs alternative

| Termine | Cosa comunica al cliente PMI | Perché evitarlo o usarlo |
|---|---|---|
| Fractional CTO | Part-time, strategico, americano | PMI non sa cos'è un CTO; suona distaccato |
| Consulente | Diagnosi, slide, poi sparisce | Nessuna accountability sul risultato |
| Agenzia / Software House | Esegue specifiche | Nessuna direzione, commodity |
| Staff augmentation | Ore di sviluppo in più | Task completati, non direzione |
| **Partner Tecnico / Direzione Tecnica** | Prende in mano, rimane, risponde | Ownership + relazione continuativa |

### Differenza vs «Fractional CTO» (linguaggio cliente)

Usare questa tabella in call quando il prospect dice «cerco un CTO part-time».

| Aspetto | Fractional CTO (come lo intende il mercato) | Direzione Tecnica 108 Vision |
|---|---|---|
| **Promessa** | Figura senior «a metà tempo» nel team | Direzione + deliverable mensili scritti |
| **Presenza** | Spesso implicita: «3 giorni a settimana» | **Slot settimanale esplicito** (es. 6 h/sett.) |
| **Output** | Spesso vago («guido il team») | State of the Stack, roadmap, ADR, report mensile |
| **Operatività** | Rischio embed full-time mascherato | Operativo = **time-boxed** (review, pair, rituali) |
| **Codice** | Talvolta scrive codice | **Non scrivo codice** — alzo capacità del team |
| **Capacità** | Non sempre dichiarata | **Cap 8–12 h/sett.** totale lato consulenza |

### Ownership — definizione cliente-safe

> **Ownership** = siamo responsabili delle decisioni tecniche e dei deliverable concordati nel contratto. Non significa presenza quotidiana in ufficio o risposta Slack entro l'ora.

### Le 4 responsabilità core (invarianti dal legacy)

| Area | Cosa facciamo | Cosa NON facciamo |
|---|---|---|
| **Strategia** | Roadmap tecnica ↔ obiettivi business | Gestire backlog operativo giorno per giorno |
| **Architettura** | Governare decisioni strutturali, ADR, trade-off | Code review task-by-task al posto del Tech Lead |
| **Team** | Sviluppare Tech Lead / EM, hiring review, cultura | Sostituire permanentemente l'EM interno |
| **Stakeholder** | Tradurre rischi in EUR/tempo/impatto business | Status update quotidiani da project manager |

### Cosa NON faccio (ribadire in onboarding)

- [ ] Non scrivo codice (nemmeno «solo un esempio»)
- [ ] Non gestisco ticket / Jira operativo
- [ ] Non sono project manager delle consegne
- [ ] Non sostituisco il Tech Lead a lungo termine
- [ ] Non partecipo a ogni meeting tecnico — scelgo dove aggiungo valore strategico

---

## 2. Target e anti-target

### Target primario

| Criterio | Dettaglio | Segnale in call |
|---|---|---|
| **Dimensione** | PMI 10–100 persone; team dev **3–10** | «Abbiamo sviluppatori ma nessuno che guardi avanti» |
| **Prodotto** | Almeno un prodotto/sistema **in produzione** con utenti | Non solo MVP da zero |
| **Gap di direzione** | Nessun CTO, CTO debole, o founder tecnico senza tempo | Decisioni per inerzia o urgenza |
| **Trigger** | Crescita team, incidente, assunzioni imminenti, debito tecnico visibile | «Perché ora?» ha risposta concreta |
| **Budget** | Retainer ≥ soglia minima (vedi §6) | Non equity-only, non «trial gratis» |
| **Mindset** | Vuole capacità interna, non outsourcing permanente | Accetta che il team implementa |

### Profilo ideale (one-liner)

Founder non tecnico (o tecnico overloaded) con prodotto che funziona, team che cresce, decisioni tecniche prese per inerzia e nessun piano sul debito tecnico.

### Anti-target — non accettare

| Anti-target | Perché | Azione |
|---|---|---|
| **Zero team dev** | È Canale 2 (Software in Mano) | Reindirizza a Discovery |
| **Solo MVP, niente in prod** | Manca oggetto di «direzione» | Consulenza puntual o SiM |
| **Vuole dev che scrive codice** | Staff aug, non DT | Declina o passa a SiM |
| **CTO interno ogni giorno 8 h** | Fuori cap e fuori modello | Red flag — vedi §7 |
| **Budget sotto floor** | Under-delivery garantito | Assessment standalone o declina |
| **Trial gratis / 2 settimane** | Non rispetta minimo 3 mesi valore | Offri Tech Assessment pagato |
| **Micro-management cronico** | Non sostenibile nel cap | Conversazione §8 o exit |
| **Secondo cliente che sfora cap** | Danno reputazionale | Waitlist, non scontare ore |

### 5 domande di qualificazione (20 min)

1. *«Qual è la decisione tecnica più importante rimandata negli ultimi 3 mesi?»*
2. *«Com'è strutturato il team? Chi prende le decisioni architetturali?»*
3. *«Dove volete essere tra 12 mesi — e cosa deve reggere lato tech?»*
4. *«Incidenti negli ultimi 6 mesi — come li avete gestiti?»*
5. *«Perché ora? Cosa è cambiato rispetto a 6 mesi fa?»*

**Matrice rapida post-call:**

| Esito | Azione |
|---|---|
| Ideale + budget ok | Proposta entro 48 h |
| Ideale + budget borderline | Scope ridotto + ore esplicite |
| Team < 3 dev | Follow-up 6 mesi o SiM |
| Red flag embed / codice | Declina educatamente |
| Nessun prodotto in prod | Assessment strategico puntual, non retainer |

---

## 3. Tre modalità di ingaggio

Le modalità **non sono prodotti separati** — sono livelli di coinvolgimento dentro lo stesso contratto mensile. Si adattano nel tempo; si declinano in **ore/settimana**.

### Panoramica

| Modalità | Cosa facciamo | Ore tipiche/sett. | Quando ha senso |
|---|---|---|---|
| **Strategico** | Roadmap, architettura, governance, ADR, report CEO | 4–6 h | Team capace; manca direzione e priorità |
| **Operativo integrato** | Slot fissi: code review architetturale, pair time-boxed, rituali mensili | 6–8 h | Team presente ma senza guida pratica |
| **Team building** | Assessment persone, hiring, onboarding, struttura ruoli, crescita EM | Batch + 4–6 h/sett. | Il problema è il team prima del codice |

### Quando usare quale — albero decisionale

```
                    [Call qualificazione]
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    Decisioni arch.    Team disorientato   Turnover / hiring /
    assenti, TL ok     TL debole           conflitti / burnout
            │               │               │
            ▼               ▼               ▼
      STRATEGICO     OPERATIVO         TEAM BUILDING
      (+ report)     (+ slot review)   (+ assessment persone)
            │               │               │
            └───────────────┴───────────────┘
                            │
              Spesso: Strategico mese 1-2 → Operativo mese 3+
              Team building: fase iniziale o crisi people
```

### Strategico — checklist attività

- [ ] Tech Assessment / State of the Stack (ingresso)
- [ ] Strategic Planning mensile (2 h) con CEO + TL
- [ ] Architecture Review mensile (2 h) — trade-off, non bug hunt
- [ ] Stakeholder Update mensile (1 h) — 1 pagina, linguaggio business
- [ ] ADR: revisione e coaching al TL (non scrittura al posto loro)
- [ ] Roadmap tecnica 90 giorni rolling

**Quando NON basta da solo:** il TL chiede «vieni nelle review?» / nessuno fa merge review / sprint caotici.

### Operativo integrato — regola time-boxed

> **Operativo = time-boxed, non full embed.** Slot fissi in calendario; non «sono uno di voi a tempo pieno».

| Slot tipo | Frequenza | Durata | Esempio |
|---|---|---|---|
| Architecture / PR review | 1×/sett. | 60–90 min | Solo PR con impatto architetturale |
| Pair session | 2×/mese | 60 min | TL o senior su decisione difficile |
| Ritual partecipazione | 1×/mese | Sprint review o retro (osservazione pattern) | Max 1 cerimonia/mese |
| Canale async | Continuo | Entro SLA contratto | Slack/email — non 24/7 |

**Quando passare da Strategico a Operativo:** post-assessment, TL nominato ma immaturo; backlog di decisioni non implementate.

### Team building — quando attivarlo

| Segnale | Intervento | Dettaglio in |
|---|---|---|
| Assunzioni imminenti senza processo | Hiring review + profilo | `leadership/108LEAD-Playbook.md` §5.4 |
| TL fantasma / senior tossico | 1-on-1 strutturate, SBI feedback | `leadership/` §5.1–5.2 |
| Burnout / turnover alto | Diagnosi 4P, programma wellbeing | `wellbeing-team/108WELL-Playbook.md` |
| Processo caotico | Agile maturity + 90-day program | `agile-devops/108AGILE-Playbook.md` |

**Formato tipico:** Team Assessment (1–2 gg) → Piano 90 gg people/process → retainer con focus mentoring EM.

### Operating rhythm mensile (legacy adattato al cap)

Totale presenza diretta tipica: **~7 h/mese** + prep/async nel cap ore.

| Momento | Durata | Partecipanti | Output |
|---|---|---|---|
| Strategic Planning | 2 h | CEO + TL | Decisioni scritte, priorità mese |
| Architecture Review | 2 h | TL + senior | Note trade-off, rischi aggiornati |
| Team Mentoring | 1–2 h | TL / EM | Azioni sviluppo leadership |
| Stakeholder Update | 1 h | CEO | Tech Update 1 pagina |

---

## 4. Vincolo di capacità e contratto

### Cap operativo (non negoziabile)

| Parametro | Valore | Note |
|---|---|---|
| **Ore max / settimana** (tutti i clienti DT) | **8–12 h** | Somma di tutti i clienti attivi side |
| **Slot tipico per cliente** | 4–8 h/sett. | 1 cliente principale + eventuale secondo leggero |
| **Pianificazione** | Mensile | Contratto dichiara **ore/mese**, non «sempre disponibile» |
| **Escalation fuori cap** | No | Nuovo cliente o scope extra → waitlist o rinegoziazione |
| **Emergenze prod** | Time-boxed | Coordinamento e comunicazione, non guardia 24/7 |

### Cosa sì / no dentro il cap

| ✅ Sì | ❌ No |
|---|---|
| Decisioni architetturali e roadmap scritte | Embed full-time nel team cliente |
| Code review e pair **time-boxed** | Guardia 24/7 produzione |
| Accountability su deliverable del mese | Sostituire CTO/EM interno a tempo pieno |
| Presenza momenti critici **concordati** | Risposta ogni Slack entro 1 h |

### Clausola ore — testo base contratto

> **Oggetto e modalità.** Il Fornitore eroga servizi di Direzione Tecnica nell'ambito di **[X] ore/settimana** (corrispondenti a **[Y] ore/mese**, calcolate su [4/4,33] settimane). Le ore non utilizzate nel mese **non sono cumulabili** salvo diverso accordo scritto.
>
> **Perimetro.** Il servizio comprende: direzione tecnica, architettura, governance, mentoring del referente tecnico interno e deliverable documentali concordati (report mensile, roadmap, ADR review). **Non** comprende: sviluppo software, gestione operativa del backlog, project management delle consegne, né presenza full-time presso il Cliente.
>
> **Canali e SLA.** Comunicazione ordinaria via **[email/Slack]** con risposta entro **[24/48] ore lavorative**. Urgenze produzione: messa in sicurezza coordinata con il team interno; **non** costituisce servizio di on-call 24/7.
>
> **Extra scope.** Attività fuori perimetro o oltre le ore concordate: preventivo scritto o tariffa **[€/h da definire]** con approvazione preventiva del Cliente.
>
> **Capacità.** Il Fornitore opera con capacità professionale limitata e dichiarata; il Cliente riconosce che la disponibilità è organizzata per slot fissi, garantendo continuità e qualità del servizio.

Adattare [X], [Y], SLA e tariffa extra prima della firma.

### Ownership — paragrafo consigliato

> Il Fornitore assume **ownership** delle decisioni tecniche e dei deliverable definiti nell'Allegato A, nei limiti delle ore concordate. Tale ownership **non** implica rappresentanza legale del Cliente, né sostituzione delle figure interne responsabili dell'esecuzione.

### Allegato A — deliverable mensili standard

- [ ] Tech Update 1 pagina (CEO)
- [ ] Lista rischi aggiornata
- [ ] Decisioni del mese documentate (link ADR se applicabile)
- [ ] Sessioni calendarizzate completate (SP, Arch Review, Mentoring)
- [ ] Rispetto cap ore (log interno)

---

## 5. Processo end-to-end

```
[Lead] → Qualificazione (20 min) → Tech Assessment → Proposta retainer → Contratto → Onboarding (4 sett.) → Operating rhythm → Review trimestrale
```

### Fase 0 — Qualificazione (gratuita, max 30 min)

| Step | Azione | Output |
|---|---|---|
| 0.1 | Domanda canale: *«Hai già un team di sviluppo, o il software non esiste/non regge?»* | DT vs SiM |
| 0.2 | 5 domande §2 | Score fit |
| 0.3 | Verifica aspettative embed/codice | Go / no-go |
| 0.4 | Log obbligatorio: canale, obiezione #1, ore richieste vs cap | CRM / foglio call |

**No-go immediato:** richiesta CTO 5 gg/sett., trial gratis, solo equity.

### Fase 1 — Tech Assessment (entry point a pagamento)

| Elemento | Dettaglio |
|---|---|
| **Scopo** | Stato reale di stack, team, processi — non percepito dal CEO |
| **Durata** | 2–3 giorni lavorativi (legacy: 2 gg sito, 3 gg prep clienti) [da verificare per PMI] |
| **Output** | **State of the Stack** v1 + piano 90 gg + raccomandazione modalità |
| **Credito** | Importo **detratto dal mese 1** se si firma retainer entro 30 gg |
| **Standalone** | Valido anche senza retainer — il cliente tiene il documento |

**Checklist pre-assessment (chiedere al cliente):**

- [ ] Tech stack document (anche informale)
- [ ] Org chart team tecnico
- [ ] Roadmap attuale (anche 3 bullet)
- [ ] Ultimi 3 incidenti significativi
- [ ] Accesso read-only: repo, issue tracker, monitoring (se esiste)

**Settimane assessment (se già in retainer — onboarding):**

| Settimana | Focus | Ore stimate |
|---|---|---|
| 1 | Tech Assessment: repo, CI/CD, 1-on-1 dev + CEO | 8–12 h |
| 2 | Architecture Quick Review: top 5 rischi + 3 opportunità | 4–6 h |
| 3 | Team Assessment: 1-on-1, turnover, TL potenziale | 4–6 h |
| 4 | Strategic Alignment workshop CEO + TL → State of the Stack | 4–6 h |

Template State of the Stack: `cto/108CTO-Playbook.md` §8.1 (legacy).

### Fase 2 — Proposta retainer

Consegnare entro **48 h** post-assessment.

**Struttura proposta (1–2 pagine):**

1. Executive summary — 3 problemi emersi
2. Modalità consigliata (Strategico / Operativo / Team building)
3. **Ore/settimana e ore/mese** (es. 6 h/sett = ~26 h/mese)
4. Deliverable mensili (Allegato A)
5. Operating rhythm — date prime sessioni
6. Pricing e durata minima (**3 mesi**)
7. Criteri di successo a 90 giorni
8. Cosa esplicitamente **non** incluso

### Fase 3 — Contratto e kick-off

- [ ] Contratto + clausola ore §4
- [ ] Allegato A deliverable
- [ ] Prima fattura (anticipo o fine mese — coerente con pratica)
- [ ] Kick-off 60 min: aspettative, canali, escalation
- [ ] Intro al team (email CEO + call team 30 min)
- [ ] Calendario operating rhythm **bloccato** 3 mesi avanti

### Fase 4 — Erogazione mensile

Vedi §3 Operating rhythm + checklist mensile §11.

### Fase 5 — Review trimestrale

| Domanda | Azione se «no» |
|---|---|
| Deliverable consegnati ogni mese? | Allineamento scope |
| Almeno 1 priorità strategica implementata dal team? | Ridimensionare raccomandazioni o uscire |
| CEO/T L soddisfatti (1–5)? | Conversazione §8 |
| Ore rispettate (entrambi)? | Ricalibrare contratto |
| Modalità ancora giusta? | Switch Strategico ↔ Operativo |

**Rinnovo:** tacito mensile dopo minimo 3 mesi; revisione trimestrale obbligatoria.

### Exit — criteri oggettivi (legacy)

| Situazione | Azione |
|---|---|
| 3 mesi zero implementazione raccomandazioni strategiche | Conversazione diretta → exit |
| Budget tagliato sotto floor | Rinegozia scope o uscita |
| Cliente assume CTO full-time | **Successo** — transizione 4–6 sett. |
| Conflitto valori / micro-management incontrollabile | Exit professionale |

---

## 6. Pricing interno

> **Nota cap ore:** i range legacy «Fractional CTO» (3 gg/sett., €7–12K/mese) **non** sono compatibili con cap 8–12 h/sett. totale. Usare i range sotto adattati; marcare [da verificare] finché non validati da contratti reali post-ripo v2.

### Entry point

| Prodotto | Range EUR | Durata | Fonte |
|---|---|---|---|
| **Tech Assessment** | €1.500 – €3.500 | 2–3 gg | Prep clienti €2.5–3.5K [da verificare PMI] |
| **Credito su retainer** | 100% detrazione mese 1 | — | Standard sito legacy |

### Retainer mensile — Direzione Tecnica

| Tier | Ore/sett. | Ore/mese ca. | Range EUR/mese | Quando |
|---|---|---|---|---|
| **Light — Strategico** | 4–5 h | ~18–22 h | €3.000 – €5.000 | 1 cliente, team maturo |
| **Standard** | 6–8 h | ~26–35 h | €5.000 – €8.000 | Modalità mista strategico + operativo |
| **Intensivo** | 8 h (max 1 cliente) | ~35 h | €7.000 – €8.000 | Solo se unico cliente DT nel cap |

**Floor assoluto retainer:** €3.000/mese [da verificare — legacy FCTO floor €5–6.5K per modelli più pesanti].

**Durata minima:** 3 mesi. **Review:** trimestrale.

**Extra-orario fuori cap:** €150 – €200/h [da verificare] — solo con approvazione scritta.

### Add-on da competenze (batch, non retainer)

| Prodotto | Range EUR | Riferimento |
|---|---|---|
| Team Assessment (leadership) | €8.000 flat | `leadership/108LEAD-Playbook.md` |
| Leadership Program 3 mesi | €5.000 – €8.000/mese | leadership |
| Agile Maturity Assessment 1 gg | €5.000 | `agile-devops/108AGILE-Playbook.md` |
| 90-Day Agile Adoption | €4.000 – €8.000/mese × 3 | agile-devops |
| Workshop wellbeing 1 gg | €3.000 – €5.000 | `wellbeing-team/108WELL-Playbook.md` |
| Programma wellbeing 3 mesi | €8.000 – €15.000 | wellbeing |

Integrare add-on **solo** se restano dentro cap ore o come progetto separato time-boxed.

### Confronto costo — argomento vendita (non slide)

| Opzione cliente | Costo indicativo annuo | Note |
|---|---|---|
| CTO senior assunto | €120.000 – €180.000 | Legacy prep clienti [da verificare] |
| Direzione Tecnica Standard | €60.000 – €96.000 | ~€5–8K × 12 |
| Tech Assessment alone | €1.500 – €3.500 | Zero vincolo retainer |

---

## 7. Red flag

### Capacità e modello (stop prima del contratto)

- [ ] Chiede «CTO interno part-time ma presente ogni giorno»
- [ ] Scope senza ore settimanali scritte
- [ ] Secondo/terzo cliente DT che farebbe **sforare 8–12 h/sett. totali**
- [ ] «Urgente go-live 2 settimane» senza team interno capace
- [ ] On-call 24/7 implicito o esplicito
- [ ] Richiesta scrittura codice / «dai una mano sullo sprint»

### Commerciali e relazionali (legacy + riposizionamento)

| Red flag | Segnale | Azione |
|---|---|---|
| Tech lead economico | «Guidi il team ogni giorno + review codice» | Script §8 — declina se insistono |
| Budget sotto floor | < €3K/mese non negoziabile | Assessment standalone o declina |
| Trial gratis | «Proviamo un mese» | Solo Tech Assessment pagato |
| Equity al posto cash | Startup pre-revenue | Declina salvo eccezione strategica documentata |
| MVP only | Niente in produzione | SiM o consulenza puntual |
| Founder vuole restare CTO | Nessun spazio per direzione esterna | Non procedere |
| Priorità ogni settimana | CEO reactive | OK solo se accetta operating rhythm mensile |
| Mancanza fiducia estrema | Report settimanali dettagliati attività | Trasparenza proattiva o declina |
| «Fai anche DevOps/PM» | Scope infinito | Perimetro scritto o declina |

### Log post-call (obbligatorio M1)

| Campo | Valore |
|---|---|
| Data / prospect | |
| Canale percepito (DT/SiM) | |
| Ore richieste / sett. | |
| vs cap 8–12 h | OK / OVER |
| Obiezione #1 | |
| Next step pagamento? | sì/no |
| Decisione | Proposta / Assessment / Declina / SiM |

---

## 8. Script vendita e obiezioni

### Pitch 30 secondi

> «Sono il partner tecnico che prende in mano decisioni e deliverable del software delle PMI. Se hai già un team, entro con Direzione Tecnica — roadmap, architettura, e slot settimanali chiari per alzare il livello. Se il software non c'è o non regge, costruiamo con Software in Mano. Lavoriamo sempre con ore concordate, così resto affidabile.»

### Domanda canale (apertura)

> «Hai già un team di sviluppo, o il problema è che il software non esiste — o non regge — ancora?»

### Script — cosa faccio / non faccio (prima call)

> *«Prima di andare avanti, voglio essere preciso. Il mio ruolo è la direzione tecnica: strategia, architettura, team. Non scrivo codice, non gestisco lo sprint, non sono un tech lead affittato a tempo pieno.*
>
> *La differenza pratica: invece di risolvere i problemi al posto vostro, costruisco la capacità di risolverli in modo coerente — con decisioni scritte e slot settimanali chiari.*
>
> *Se cercate qualcuno che aumenta la produttività a breve termine scrivendo codice, non sono io. Se cercate qualcuno che garantisca che le decisioni di oggi non diventino i problemi di domani, ha senso continuare.»*

### Obiezione — «Sei part-time?» / «Non sei abbastanza presente?»

> *«Sì — e lo dichiaro nel contratto, perché è un vantaggio per voi, non un limite nascosto. Un CTO full-time costa €120–180K l'anno e spesso il 40% del tempo va in meeting che non servono. Io porto seniority enterprise sui momenti che contano: decisioni architetturali, rischi, hiring, allineamento con il CEO — in slot fissi che rispetto.*
>
> *Prendo ownership di decisioni e deliverable mensili scritti. Non prometto di essere in chat ogni ora: prometto che quando lavoro, lavoro sulle cose giuste — e che il referente interno cresce. Se vi serve qualcuno full-time dentro il team ogni giorno, vi aiuto a strutturare quell'assunzione — non a fingere che io possa essere quella persona nel cap ore concordato.»*

### Obiezione — «Fractional CTO costa meno da altri»

> *«Spesso sì — perché vendono giorni/settimana senza deliverable chiari. Chiedete: cosa ricevete ogni mese per iscritto? Quante ore esatte? Chi fa on-call? Il mio modello è più leggero del "3 giorni a settimana" classico, ma ogni ora è contabilizzata su output che il CEO può verificare.»*

### Obiezione — «Possiamo provare un mese gratis / cheap?»

> *«Il Tech Assessment è la prova: [2–3] giorni, State of the Stack concreto, zero vincolo sul retainer. Un mese di "prova gratis" non dà tempo al team di implementare nulla — e non è rispettoso per nessuno. Minimo 3 mesi sul retainer, review trimestrale.»*

### Obiezione — «Costa troppo»

> *«Quanto vi è costata l'ultima decisione tecnica sbagliata? Un refactor non pianificato, un hiring errato, una settimana di downtime? Il retainer annuale è una frazione di un solo CTO assunto — e avete deliverable mensili misurabili. Partiamo dall'Assessment se il budget è stretto: €[X] una tantum, tenete la roadmap.»*

### Obiezione — «Vogliamo qualcuno che scriva anche codice»

> *«Capisco — volete velocità immediata. Quello è Canale Software in Mano, o un senior dev assunto. Io evito di scrivere codice apposta: quando lo faccio, divento risorsa, non direzione — e voi perdete il valore per cui mi pagate. Vi aiuto a definire cosa assumere e come revieware, così il team accelera in modo sostenibile.»*

### Obiezione — «Il team non accetterà un esterno»

> *«Succede quando hanno visto consulenti fare slide e sparire. Il primo mese non giudico: ascolto, risolvo un problema concreto insieme al TL, rispetto gli slot. La fiducia si costruisce con utilità, non con titoli.»*

### Chiusura verso Tech Assessment

> *«Prossimo passo: Tech Assessment di [2–3] giorni. Avete un documento State of the Stack, piano 90 giorni, e una raccomandazione onesta su cosa vi serve — anche se la risposta è "assumete un EM, non me". Costa €[X], scalato dal mese 1 se proseguiamo. Zero rischio di restare bloccati senza output.»*

---

## 9. AI nel contesto Direzione Tecnica

### Principio — AI-native, non AI-first

L'AI **non** è un prodotto venduto a parte nel Canale DT. È competenza trasversale applicata dove c'è ROI nel contesto del cliente.

**Regola commerciale:** non aprire call o LinkedIn con «consulenza AI». Nominare AI solo quando il problema del cliente lo giustifica.

### Quando fare assessment AI (trigger)

| Trigger emerso in Assessment / SP | Azione | Output |
|---|---|---|
| Team copia dati manualmente 2+ h/giorno | Valutare automazione LLM + integrazione | Brief ROI 90 gg |
| Backlog support ripetitivo | Classificazione / draft risposte con human review | Policy + metriche qualità |
| Documentazione assente / onboarding lento | RAG su KB interna | Architettura + costi token stimati |
| CEO chiede «dobbiamo fare AI?» senza problema | **Non** vendere progetto AI | Education: problema prima, tecnologia dopo |
| Dati sensibili / settore regolato | Privacy, retention, fallback | Checklist governance |

**Dove approfondire metodo:** `../competenze/ai-adozione/` (non canale commerciale).

### Cosa includere in Direzione Tecnica (gratis nel retainer)

- [ ] Valutazione opportunità AI nel contesto specifico (1–2 h in Assessment)
- [ ] AI in roadmap come qualsiasi altra tecnologia — con trade-off
- [ ] Governance: privacy, costi token, fallback, monitoring
- [ ] Formazione team **pratica** su tool approvati (non corso generico)

### Cosa NON vendere / NON promettere

- [ ] «Consulenza AI» standalone
- [ ] AI senza ROI misurabile entro **90 giorni**
- [ ] AI come argomento nelle **prime call**
- [ ] Formazione AI generica senza problema concreto
- [ ] AIA Platform come prodotto hero — solo se problema = KB/agent (→ spesso SiM)
- [ ] Multi-agent / RAG produzione senza golden dataset e evaluation

### AI per accelerare il *mio* lavoro (interno)

| Task | Uso consentito |
|---|---|
| Bozza Tech Update / report | Sì — poi riscrivo giudizio e numeri |
| Analisi snippet codice | Sì — valido sempre con evidenza repo |
| Valutazione persone / hiring | **No** — giudizio umano |
| Raccomandazioni strategiche ad alto impatto | AI come input, decisione umana |

---

## 10. Competenze di dettaglio (link)

Playbook **unificato** per vendita e delivery standard. Per approfondimenti operativi:

### `cto/` — Legacy Fractional CTO

| Documento | Uso |
|---|---|
| `cto/108CTO-Playbook.md` | Template State of Stack, onboarding 50 item, governance ADR, situazioni difficili |
| `cto/108CTO-Manuale.md` | Contenuto cliente / lead magnet |
| `cto/108CTO-Sito.md` | Copy sito (legacy fino M2) |
| Prep clienti (`PREP_*`, `PRES_*`) | Esempi reali call e pricing negoziato |

### `leadership/` — Tech Leadership & Team Building

| Sezione chiave | Contenuto |
|---|---|
| §1 Posizionamento | Team Assessment €8K, Leadership Program 3 mesi |
| §2 Engineering Excellence | 4 dimensioni, Maturity Model |
| §3 Team Assessment 1–2 gg | Interview + synthesis |
| §4 Leadership Program 3 mesi | Foundation → Development → Stabilizzazione |
| §5 Situazioni difficili | Senior tossico, TL fantasma, turnover, hiring |
| §6 NLP applicato | Rapport, feedback, outcome frame |
| §7 Template | Survey health, 1-on-1 EM, SBI, OKR |

### `agile-devops/` — Ritmo, CI/CD (no gergo sprint col cliente)

| Sezione chiave | Contenuto |
|---|---|
| Parte 1 | Agile Maturity Assessment 1 gg (€5K) |
| Parte 2 | Scrum vs Kanban vs ibrido — albero PMI |
| Parte 3 | 90-Day Agile Adoption Program |
| Parte 4 | DevOps Foundation PMI, prima pipeline 4 h |
| Parte 5 | DORA metrics team piccoli |
| Parte 6 | Obiezioni e resistenza |
| Parte 7 | Template (Sprint Charter, report, checklist) |

**Linguaggio cliente:** «ritmo di consegna», «qualità rilasci», «visibilità avanzamento» — evitare «sprint», «story points» in prima battuta.

### `wellbeing-team/` — Benessere team tecnico (≠ Wellbeing App)

| Sezione chiave | Contenuto |
|---|---|
| Parte 1 | Modello 4P: Performance, Persone, Processi, Presenza |
| Parte 2 | Burnout assessment e diagnosi |
| Parte 3 | Programma 3–6 mesi |
| Parte 4 | Yoga for developers (opzionale team) |
| Parte 5 | NLP situazioni comuni |
| Parte 6 | Retreat tech+yoga (€12–25K) |
| Parte 7 | Positioning verso CTO/HR |

**Nota:** `wellbeing-team` = consulenza team. **Wellbeing App** = prova Software in Mano (sito `/wellbeing`).

### Trasversali

| Path | Contenuto |
|---|---|
| `../competenze/architettura/` | Pattern, ADR, review — condiviso DT + SiM |
| `../competenze/ai-adozione/` | Metodo AI (non vendita standalone) |
| `../brand/riposizionamento-partner-tecnico.md` | Fonte verità posizionamento v2 |

---

## 11. Checklist operativa

### Pre-call vendita

- [ ] Riletto §7 red flag capacità
- [ ] Cap ore attuale: ___ h/sett. impegnate / ___ h disponibili
- [ ] Log call preparato

### Post Tech Assessment

- [ ] State of the Stack consegnato
- [ ] Proposta retainer 48 h
- [ ] Modalità raccomandata esplicita
- [ ] Ore/sett. e €/mese nel PDF

### Pre-firma

- [ ] Clausola ore §4 in contratto
- [ ] Allegato A deliverable
- [ ] SLA comunicazione
- [ ] Durata minima 3 mesi
- [ ] Extra-orario tariffato
- [ ] Nessuna promessa on-call / full embed

### Mensile (per cliente)

- [ ] Strategic Planning — decisioni scritte 24 h
- [ ] Architecture Review — note architetturali
- [ ] Mentoring TL — azioni con owner
- [ ] Tech Update CEO — 1 pagina
- [ ] Ore loggate ≤ cap contratto
- [ ] Fattura entro giorno 5 mese successivo

### Trimestrale

- [ ] Review §5 Fase 5
- [ ] Aggiornare questo playbook se lesson learned
- [ ] Verificare cap globale 8–12 h/sett. ancora rispettato

---

## Controllo versioni

| Versione | Data | Note |
|---|---|---|
| 1.0 | 2026-08-10 | Playbook unificato Canale 1 — riposizionamento Partner Tecnico v2 |

**Prossima revisione:** dopo primo contratto firmato con nuovo modello ore — aggiornare §6 pricing [da verificare].

---

*108 Vision — Il partner tecnico che prende in mano la situazione.*
