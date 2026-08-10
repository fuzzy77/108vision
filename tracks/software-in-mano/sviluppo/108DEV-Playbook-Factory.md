---
title: "Factory — Playbook Operativo"
author: "Elios Scoglio"
brand: "108 Vision"
track: "108-dev"
type: "playbook-interno"
version: "1.0"
date: "2026-06-08"
---

# Factory — Playbook Operativo
## Guida interna per il delivery di sviluppo continuativo a retainer

---

> Questo e il mio manuale per gestire clienti in modalita Factory: retainer mensile con capacity dedicata, evoluzione continua, governance architetturale inclusa. Include anche lo sviluppo mobile (app iOS/Android).

---

## SEZIONE 1 — Il Servizio

### 1.1 Cosa offro

Un team di sviluppo esterno dedicato, con governance architetturale inclusa. Il cliente ha capacity di sviluppo garantita ogni mese senza assumere, con la stessa qualita di un team enterprise interno.

### 1.2 Cosa include

- **Sviluppo software** (web, API, mobile, integrazioni)
- **Governance architetturale** — decisioni tecniche non lasciate al caso
- **Code review** — ogni PR revisionata
- **CI/CD** — pipeline automatizzate, deploy senza rischio
- **Monitoraggio** — so come sta il sistema prima del cliente
- **Evoluzione continua** — nuove feature, ottimizzazioni, ogni mese
- **Sviluppo Mobile** — app native (Swift/Kotlin) o cross-platform (React Native/Flutter)

### 1.3 Modelli disponibili

| Piano | Capacity | Include | Investimento |
|---|---|---|---|
| **Starter** | ~20h/mese | Sviluppo + code review + 1 sync/mese | 1.500 EUR/mese |
| **Growth** | ~40h/mese | + architettura + CI/CD + 2 sync/mese | 2.800 EUR/mese |
| **Scale** | ~60h/mese | Full delivery + governance + on-call leggero | 4.000 EUR/mese |
| **Mobile** | ~30h/mese | App development + backend API + store management | 2.500 EUR/mese |
| **Full Stack + Mobile** | ~80h/mese | Web + Mobile + infra + governance completa | 5.500 EUR/mese |

### 1.4 Cosa NON e

- Non e body rental (non vendo ore vuote)
- Non e supporto help-desk
- Non e "chiami quando hai bisogno" senza continuita
- Non e un team offshore a basso costo senza governance

---

## SEZIONE 2 — Target

### Chi e il cliente ideale

| Segmento | Segnale d'acquisto |
|---|---|
| PMI con prodotto software esistente | "Non abbiamo banda per le evoluzioni" |
| Startup post-lancio | "L'MVP funziona, ora dobbiamo scalare" |
| Azienda non-tech con sistema custom | "Chi ci ha fatto il software non c'e piu" |
| PMI che vuole app mobile | "Vogliamo un'app per i clienti/operatori" |
| Ex-cliente Progetto | "Il progetto e finito, ora vogliamo continuare" |

### Chi NON e il cliente

- Chi vuole solo "qualche ora quando serve" senza commitment
- Chi non ha un prodotto/sistema su cui lavorare (mandare su track Progetto)
- Chi ha gia un team interno e vuole solo body rental

---

## SEZIONE 3 — Onboarding

### Settimana 0 — Assessment

1. **Audit sistema attuale** — capisco lo stato del codice, infra, debito tecnico
2. **Mappa priorita** — cosa serve nei primi 30 giorni
3. **Setup operativo** — accesso repo, board, canale comunicazione
4. **Piano mese 1** — sprint 1-2 con obiettivi concreti

### Primo Mese — Stabilizzazione

Obiettivo: dimostrare valore subito.
- Fix immediati (quick wins visibili)
- CI/CD setup se mancante
- Monitoring base
- Prima feature nuova consegnata

### Dal Mese 2 — Regime

Ciclo mensile:
1. **Planning mensile** — priorita + capacity allocation
2. **Sprint bisettimanali** — sviluppo + demo
3. **Report mensile** — cosa fatto, metriche qualita, prossime priorita
4. **Review trimestrale** — direzione, soddisfazione, eventuale scale up/down

---

## SEZIONE 4 — Sviluppo Mobile

### 4.1 Approcci disponibili

| Approccio | Pro | Contro | Quando |
|---|---|---|---|
| **React Native** | Codebase unica iOS+Android, veloce | Performance non nativa su UI complesse | MVP, app content-based, B2B |
| **Flutter** | UI consistente, ottime performance | Ecosistema meno maturo | App consumer con UI ricca |
| **Nativo (Swift + Kotlin)** | Performance massima, accesso HW | Doppio codebase, doppio costo | App con requisiti HW specifici |

### 4.2 Stack Mobile preferito

- **Framework:** React Native (default) o Flutter (se UI-intensive)
- **State management:** Zustand / Riverpod
- **Backend:** .NET Minimal API o Node.js (condiviso con web se esiste)
- **Auth:** OAuth2/OIDC (Auth0, Duende, Firebase Auth)
- **Push notifications:** Firebase Cloud Messaging (FCM) + APNs
- **CI/CD:** Fastlane + GitHub Actions / GitLab CI
- **Store management:** App Store Connect + Google Play Console
- **Distribuzione beta:** TestFlight (iOS) + Firebase App Distribution (Android)

### 4.3 Deliverable Mobile

- App pubblicata su App Store + Play Store
- Backend API dedicato (o integrazione con esistente)
- CI/CD per build + deploy automatico
- Documentazione: architettura, API, guida store submission
- Monitoraggio crash (Sentry / Firebase Crashlytics)
- Analytics base (eventi chiave, retention)

### 4.4 Pricing Mobile (a corpo)

Per clienti che vogliono un'app come progetto chiuso (non retainer):

| Taglia | Descrizione | Range |
|---|---|---|
| **S** | App semplice (3-5 schermate, 1 integrazione) | 5.000 — 12.000 EUR |
| **M** | App completa (auth, push, 8-12 schermate, API) | 12.000 — 30.000 EUR |
| **L** | App complessa (offline, real-time, multi-ruolo) | 30.000 — 60.000 EUR |

---

## SEZIONE 5 — Operations

### Comunicazione

| Canale | Per cosa |
|---|---|
| **Slack/Teams** | Domande rapide, aggiornamenti quotidiani |
| **Board (Jira/Linear/GitHub Projects)** | Backlog, priorita, stato task |
| **Call bisettimanale** | Demo + planning (30-45 min) |
| **Report mensile** | Riepilogo scritto + metriche |

### SLA

| Metrica | Target |
|---|---|
| Tempo risposta richieste | < 4h lavorative |
| Hotfix produzione | Entro 24h |
| Feature nuova (piccola) | Entro sprint corrente |
| Feature nuova (media) | Sprint successivo |

### Metriche di qualita reportate

- Velocity (story point o task completati/mese)
- Cycle time (da "in progress" a "done")
- Bug rate (bug aperti vs feature rilasciate)
- Test coverage (target >80%)
- Uptime (se gestisco infra)
- Deployment frequency

---

## SEZIONE 6 — Contrattualistica

### Struttura contratto

- **Durata minima:** 3 mesi (poi mese per mese)
- **Disdetta:** 30 giorni di preavviso
- **Fatturazione:** mensile anticipata
- **Scale up/down:** possibile con 15gg preavviso
- **Proprieta codice:** del cliente, sempre
- **IP:** tutto il codice prodotto e di proprieta del cliente

### Clausole importanti

- **Capacity garantita** — le ore/mese sono dedicate, non "best effort"
- **Nessun lock-in tecnico** — codice documentato, repo del cliente, nessuna dipendenza da tool proprietari miei
- **Passaggio di consegne** — se il cliente esce, 2 settimane di handoff incluse
- **NDA** — standard, reciproco

---

## SEZIONE 7 — Upsell & Cross-sell

| Trigger | Proposta |
|---|---|
| "Ci serve anche un'app mobile" | Aggiungi piano Mobile o Full Stack |
| "Dobbiamo rifare l'architettura" | Track Architettura (assessment + roadmap) |
| "Il team interno ha bisogno di guida" | Fractional CTO o Leadership coaching |
| "Vogliamo AI nel prodotto" | Track AI Platform o AI Adoption |
| "Siamo cresciuti, serve piu capacity" | Scale up piano Factory |

---

## SEZIONE 8 — Exit Strategy (per il cliente)

Se il cliente decide di uscire:
1. Sprint corrente completato normalmente
2. 2 settimane di handoff: documentazione, sessioni knowledge transfer
3. Accesso repo confermato (gia del cliente)
4. Eventuale supporto residuo per 30gg (a consumo, se richiesto)

Il cliente non deve mai sentirsi "intrappolato". Il lock-in deve essere di valore (conviene restare), non di vincolo (non puo andarsene).

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
