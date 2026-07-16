---
title: "Sviluppo a Progetto — Playbook Operativo"
author: "Elios Scoglio"
brand: "108 Vision"
track: "108-dev"
type: "playbook-interno"
version: "1.0"
date: "2026-06-08"
---

# Sviluppo a Progetto — Playbook Operativo
## Guida interna per il delivery di progetti software chiavi in mano

---

> Questo documento e per me. E il mio manuale di delivery per quando un cliente vuole un software costruito da zero (o ricostruito) con scope chiuso e prezzo fisso. Governa le fasi, i rischi, le decisioni go/no-go.

---

## SEZIONE 1 — Il Servizio

### 1.1 Cosa offro

Sviluppo software chiavi in mano: dalla specifica al deploy in produzione, con la stessa governance architetturale che uso su sistemi enterprise da milioni di utenti.

### 1.2 Cosa NON e

- Non e body rental. Non vendo ore.
- Non e un MVP fragile "poi lo sistemiamo". E architettura solida dal giorno 1.
- Non e un progetto senza fine. Ha scope, milestone, data di consegna.

### 1.3 Differenziatore

Il cliente compra un progetto con governance da Software Architect enterprise:
- Architettura documentata (ADR)
- API-First design
- Test automatici (>80% coverage)
- CI/CD pipeline inclusa
- Observability (log, metriche, health check)
- Security by design (OWASP Top 10)
- Documentazione tecnica e utente

---

## SEZIONE 2 — Target

### Chi e il cliente ideale

| Segmento | Esempio | Segnale d'acquisto |
|---|---|---|
| Startup post-validazione | Ha un MVP fatto male, deve ricostruire | "Il nostro MVP non scala" |
| PMI digitalizzazione | Processo manuale da automatizzare | "Usiamo ancora Excel per..." |
| Azienda con gap tecnico | Serve un modulo/integrazione | "Il nostro fornitore non riesce a..." |
| Ex-delusi da freelancer | Hanno pagato e non ricevuto | "Abbiamo speso 20K e non funziona" |

### Chi NON e il cliente

- Chi vuole "un'app come Uber ma per..."
- Chi non ha budget definito
- Chi non ha chiaro cosa vuole (mandare su track Supporto/Discovery prima)
- Chi vuole solo ore di sviluppo senza governance

---

## SEZIONE 3 — Fasi del Progetto

### Fase 0 — Qualifica (1-2 call)

**Obiettivo:** capire se c'e un progetto reale.

Domande chiave:
- Cosa deve fare il software? (problema, non soluzione)
- Chi lo usera? Quanti utenti?
- C'e gia qualcosa? (legacy da sostituire, MVP da rifare)
- Budget indicativo?
- Deadline esterna?

**Output:** Go / No-go. Se go → proposta Discovery.

### Fase 1 — Discovery (1-2 settimane)

**Costo:** 1.500 — 3.000 EUR (pagato, non gratuito)

**Deliverable:**
- Documento di specifica funzionale (user stories + acceptance criteria)
- Architettura proposta (diagramma C4 livello 1-2)
- Stack tecnologico scelto con motivazione
- Stima effort (best/likely/worst)
- Proposta economica progetto completo
- Timeline con milestone

**Principio:** la Discovery e un prodotto autonomo. Se il cliente non procede, ha comunque un documento utile per andare da chiunque altro.

### Fase 2 — Contratto & Kickoff

**Proposta:** prezzo fisso con scope definito.

Struttura contratto:
- Scope dettagliato (cosa e dentro, cosa e fuori)
- Milestone con pagamenti associati (30% anticipo, 40% a meta, 30% a consegna)
- Varianti: procedura per change request (fuori scope = preventivo aggiuntivo)
- Timeline con date indicative
- Garanzia 30 giorni post-consegna
- Proprieta del codice: del cliente al 100%
- SLA supporto post-consegna (opzionale, a parte)

### Fase 3 — Sviluppo (2-16 settimane)

**Metodologia:** Sprint bisettimanali con demo.

Ogni sprint:
1. Planning (cosa facciamo)
2. Sviluppo (con commit frequenti su repo condiviso)
3. Demo al cliente (vede il progresso)
4. Retrospettiva (cosa migliorare)

**Standard di quality:**
- Git flow (feature branch → PR → review → merge)
- CI pipeline attiva dal giorno 1 (build + test + lint)
- Code review su ogni PR
- Test: unit >80%, integration sui flussi critici
- No deploy manuale: pipeline automatizzata

### Fase 4 — Consegna

**Checklist consegna:**
- [ ] Deploy in produzione funzionante
- [ ] Documentazione tecnica (architettura, API, deployment)
- [ ] Documentazione utente (se applicabile)
- [ ] Repo trasferito al cliente (o accesso completo)
- [ ] CI/CD pipeline documentata
- [ ] Training operativo (1-2 sessioni)
- [ ] Periodo garanzia avviato (30 giorni)

### Fase 5 — Post-Consegna

**Garanzia (inclusa):** 30 giorni. Fix bug emersi, nessuna nuova feature.

**Evoluzione (a parte):**
- Proposta Factory (retainer mensile) per chi vuole continuare
- Pacchetti di sviluppo aggiuntivi a progetto

---

## SEZIONE 4 — Pricing

### Regola base

Il prezzo si calcola su: complessita + rischio + valore per il cliente.

**Non** si calcola su: ore stimate x tariffa oraria. Questo e body rental, non progetto.

### Fasce

| Taglia | Durata | Complessita | Range |
|---|---|---|---|
| **S** | 2-4 settimane | 1-2 moduli, poche integrazioni | 3.000 — 8.000 EUR |
| **M** | 4-8 settimane | 3-5 moduli, integrazioni, auth | 8.000 — 25.000 EUR |
| **L** | 8-16 settimane | Piattaforma, multi-utente, AI | 25.000 — 80.000 EUR |

### Struttura pagamento

- 30% alla firma
- 40% a milestone intermedia (meta scope)
- 30% a consegna accettata

### Discovery come entry point

La Discovery (1.500-3.000 EUR) e il primo pagamento reale. Serve a:
1. Qualificare il progetto (e il cliente)
2. Produrre valore tangibile anche se non si procede
3. Ancorare il prezzo progetto su dati reali, non stime alla cieca

---

## SEZIONE 5 — Rischi e Mitigazioni

| Rischio | Probabilita | Impatto | Mitigazione |
|---|---|---|---|
| Scope creep | Alta | Sforamento budget | Scope scritto, change request formale |
| Cliente non risponde | Media | Ritardo | SLA di risposta nel contratto (48h) |
| Requisito ambiguo | Media | Rework | Discovery rigorosa, acceptance criteria |
| Tecnologia nuova | Bassa | Ritardo | Spike tecnico in Discovery |
| Cliente non paga | Bassa | Cash flow | Anticipo 30%, milestone vincolanti |

---

## SEZIONE 6 — Stack Tecnologico Preferito

| Layer | Opzione A (default) | Opzione B | Quando B |
|---|---|---|---|
| Backend | .NET 8 (Minimal API) | Java Spring Boot | Cliente Java shop |
| Frontend | Angular 17+ | React/Next.js | Landing/marketing site |
| Database | PostgreSQL | SQL Server | Ecosistema Microsoft |
| Cache | Redis | -- | Sempre se serve |
| Auth | Duende IdentityServer / Auth0 | Keycloak | Self-hosted requirement |
| CI/CD | GitLab CI | GitHub Actions | Repo su GitHub |
| Hosting | Docker + VPS / Kubernetes | AWS managed | Budget > 25K |
| Observability | Serilog + Seq / Grafana | Datadog | Cliente gia su Datadog |

---

## SEZIONE 7 — Template e Artefatti

### Template Proposta

```markdown
# Proposta Progetto — [Nome Cliente]

## Contesto
[2-3 frasi: cosa fa il cliente, qual e il problema]

## Soluzione Proposta
[Descrizione soluzione + architettura high-level]

## Scope
### Incluso
- [Feature 1]
- [Feature 2]
- [...]

### Escluso
- [Cosa NON e incluso]

## Timeline
| Fase | Durata | Milestone |
|---|---|---|
| Discovery | 1 sett | Specifiche + architettura |
| Sprint 1-2 | 2 sett | Core backend + auth |
| Sprint 3-4 | 2 sett | Frontend + integrazioni |
| Sprint 5 | 1 sett | Testing + deploy |

## Investimento
- Discovery: X EUR
- Progetto completo: Y EUR (prezzo fisso)
- Pagamento: 30/40/30

## Garanzia
30 giorni post-consegna per bug fix inclusi.

## Prossimi passi
1. Accettazione proposta
2. Firma contratto + pagamento anticipo
3. Kickoff entro [data]
```

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
