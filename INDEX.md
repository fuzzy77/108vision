---
title: "108 Vision — Architecture Index"
brand: "108 Vision"
claim: "Costruiamo la direzione, non solo il codice."
author: "Elios Scoglio"
version: "5.0"
date: "2026-06-09"
---

# 108 Vision — Architecture Index

> **Claim:** Costruiamo la direzione, non solo il codice.
> **Owner:** Elios Scoglio

---

## Architettura Repository

```
Vision/
├── INDEX.md                    ← Sei qui. Mappa completa del progetto.
│
├── brand/                      ← Identita visiva, naming, tone of voice
│   └── 108-VISION-Brand-Copy-Sito.md
│
├── tracks/                     ← Offerta consulenziale (15 track)
│   ├── ai-adoption/           ← Adozione AI nelle PMI
│   ├── ai-platform/           ← Piattaforma AI aziendale (prodotto SaaS)
│   ├── fractional-cto/        ← CTO part-time / governance tecnica
│   ├── architettura/          ← Architettura software & scaling
│   ├── trasformazione-digitale/ ← Digitalizzazione processi
│   ├── leadership/            ← Tech leadership & management
│   ├── agile-devops/          ← Agile, CI/CD, DevOps culture
│   ├── wellbeing/             ← Benessere tech team & anti-burnout
│   ├── pubblica-amministrazione/ ← Consulenza tecnica PA / MEPA
│   ├── digital-starter/       ← Primo progetto digitale (startup/PMI)
│   ├── sviluppo-progetto/     ← Sviluppo a corpo (prezzo fisso)
│   ├── factory/               ← Team esterno continuativo + mobile
│   ├── compliance-ai-act/     ← Compliance EU AI Act (2024/1689)
│   ├── nocode-automation/     ← Automazione No-Code / Low-Code
│   ├── data-analytics/        ← Data & Analytics / BI
│   ├── study/                 ← Manuali di studio per il consulente
│   └── sales/                 ← Sales kit e content calendar
│
├── aia-platform/              ← Codice sorgente piattaforma AI (monorepo TS)
└── aia-website/               ← Sito web promozionale (Astro + TinaCMS)
```

---

## Struttura di ogni Track

Ogni track segue una struttura standard a 3 documenti:

| Documento | Scopo | Audience |
|-----------|-------|----------|
| **Playbook** | Processo operativo end-to-end per il consulente | Interna |
| **Manuale** | Contenuto tecnico approfondito (lead magnet) | Cliente |
| **Sito/Copy** | Testi per la pagina web del servizio | Pubblico |

Le track `ai-adoption` e `ai-platform` hanno documenti aggiuntivi (segmentazione PMI, piano esecutivo, assistente aziendale).

---

## Catalogo Track

### 1. AI Adoption (`tracks/ai-adoption/`)
**Claim:** "Adottare l'AI e una decisione di business, non tecnologica."

Programma strutturato per portare l'intelligenza artificiale in PMI senza hype. Assessment readiness, selezione use case ad alto ROI, implementazione pilota, scaling.

| File | Contenuto |
|------|-----------|
| `AI-Adoption-Manuale-PMI.md` | Guida completa adozione AI per PMI |
| `AI-Adoption-Sito-Copy.md` | Copy pagina sito |
| `AI-Adoption-Program-README.md` | Overview programma |
| `AI-Piccole-Imprese.md` | Segmento micro/piccole (< 50 dipendenti) |
| `AI-Medie-Imprese.md` | Segmento medie (50-250 dipendenti) |

### 2. AI Platform (`tracks/ai-platform/`)
**Claim:** "L'AI che conosce la tua azienda."

Piattaforma SaaS di assistente AI aziendale con RAG su knowledge base interna. Prodotto proprio in sviluppo.

| File | Contenuto |
|------|-----------|
| `AIA-Playbook-Piattaforma.md` | Processo delivery piattaforma |
| `AIA-Manuale-Piattaforma.md` | Architettura tecnica e funzionalita |
| `AIA-Sito-Piattaforma.md` | Copy pagina sito |
| `PLATFORM-AI-Assistente-Aziendale.md` | Spec funzionale assistente |
| `PLATFORM-AI-Piano-Esecutivo.md` | Piano di sviluppo e go-to-market |

### 3. Fractional CTO (`tracks/fractional-cto/`)
**Claim:** "La governance tecnica che ti manca."

CTO part-time per PMI: governance architetturale, code review strategica, mentoring tech lead, decisioni build-vs-buy, due diligence tecnica.

| File | Contenuto |
|------|-----------|
| `FCTO-Playbook-FractionalCTO.md` | Framework operativo |
| `FCTO-Manuale-FractionalCTO.md` | Guida completa ruolo e deliverable |
| `FCTO-Sito-FractionalCTO.md` | Copy pagina sito |

### 4. Architettura Software (`tracks/architettura/`)
**Claim:** "Il debito tecnico ha un costo invisibile."

Consulenza architetturale: audit sistemi esistenti, modernizzazione monoliti, design microservizi, scalabilita, performance.

| File | Contenuto |
|------|-----------|
| `ARCH-Playbook-Scaling.md` | Processo audit e redesign |
| `ARCH-Manuale-Scaling.md` | Principi architetturali e pattern |
| `ARCH-Sito-Scaling.md` | Copy pagina sito |

### 5. Trasformazione Digitale (`tracks/trasformazione-digitale/`)
**Claim:** "Digitalizzare e ripensare come lavori."

Accompagnamento nella digitalizzazione di processi aziendali: mappatura as-is, design to-be, selezione strumenti, change management.

| File | Contenuto |
|------|-----------|
| `DIGI-Playbook-Trasformazione.md` | Framework trasformazione |
| `DIGI-Manuale-Trasformazione.md` | Guida metodologica |
| `DIGI-Sito-Trasformazione.md` | Copy pagina sito |

### 6. Tech Leadership (`tracks/leadership/`)
**Claim:** "Da tech lead a leader tecnico."

Coaching e mentoring per tech lead e engineering manager: comunicazione, delega, gestione conflitti, crescita team.

| File | Contenuto |
|------|-----------|
| `LEAD-Playbook-Leadership.md` | Framework coaching |
| `LEAD-Manuale-Leadership.md` | Guida leadership tecnica |
| `LEAD-Sito-Leadership.md` | Copy pagina sito |

### 7. Agile & DevOps (`tracks/agile-devops/`)
**Claim:** "Rilasciare senza paura."

Implementazione pratiche Agile e DevOps: CI/CD, trunk-based development, team topology, metriche DORA, cultura blameless.

| File | Contenuto |
|------|-----------|
| `AGILE-Playbook-AgileDevOps.md` | Framework implementazione |
| `AGILE-Manuale-AgileDevOps.md` | Guida pratiche e strumenti |
| `AGILE-Sito-AgileDevOps.md` | Copy pagina sito |

### 8. Tech Wellbeing (`tracks/wellbeing/`)
**Claim:** "Il burnout costa il doppio."

Programma anti-burnout per team tecnici: riconoscimento segnali, riduzione cognitive load, sustainable pace, retrospettive di benessere.

| File | Contenuto |
|------|-----------|
| `WELL-Playbook-Wellbeing.md` | Framework wellbeing |
| `WELL-Manuale-Wellbeing.md` | Guida completa |
| `WELL-Sito-Wellbeing.md` | Copy pagina sito |

### 9. Pubblica Amministrazione (`tracks/pubblica-amministrazione/`)
**Claim:** "La PA ha bisogno di sistemi che funzionano."

Consulenza tecnica per enti pubblici: MEPA, bandi digitali, modernizzazione legacy PA, accessibilita, interoperabilita.

| File | Contenuto |
|------|-----------|
| `PA-Playbook-PubblicaAmministrazione.md` | Framework PA |
| `PA-Manuale-PubblicaAmministrazione.md` | Guida completa |
| `PA-Sito-PubblicaAmministrazione.md` | Copy pagina sito |

### 10. Digital Starter (`tracks/digital-starter/`)
**Claim:** "Il tuo primo passo. Senza fuffa."

Pacchetto entry-level per chi parte da zero: primo sito, primo e-commerce, primo CRM, primo workflow digitale.

| File | Contenuto |
|------|-----------|
| `ZERO-Playbook-FromScratch.md` | Processo onboarding |
| `ZERO-Manuale-FromScratch.md` | Guida primi passi |
| `ZERO-Sito-FromScratch.md` | Copy pagina sito |

### 11. Sviluppo a Progetto (`tracks/sviluppo-progetto/`)
**Claim:** "Un progetto. Un prezzo. Un risultato."

Sviluppo software a corpo con scope definito: discovery, sviluppo, delivery, garanzia. Prezzo fisso, nessuna sorpresa.

| File | Contenuto |
|------|-----------|
| `PROJ-Playbook-SviluppoProgetto.md` | Processo delivery |
| `PROJ-Manuale-SviluppoProgetto.md` | Framework progettuale |
| `PROJ-Sito-SviluppoProgetto.md` | Copy pagina sito |

### 12. Factory (`tracks/factory/`)
**Claim:** "Il tuo team esterno. Senza assumerlo."

Team dedicato in outsourcing continuativo: sviluppo, manutenzione evolutiva, mobile. Modello a canone mensile.

| File | Contenuto |
|------|-----------|
| `FACT-Playbook-Factory.md` | Framework factory |
| `FACT-Manuale-Factory.md` | Guida operativa |
| `FACT-Sito-Factory.md` | Copy pagina sito |

### 13. Compliance & AI Act (`tracks/compliance-ai-act/`)
**Claim:** "L'AI Act non e un problema legale. E un problema di sistema."

Accompagnamento PMI nella compliance al Regolamento EU 2024/1689: classificazione rischio, gap analysis, piano adeguamento, audit readiness. Approccio tecnico (non solo legale).

| File | Contenuto |
|------|-----------|
| `COMP-Playbook-ComplianceAIAct.md` | Framework compliance 6 fasi |
| `COMP-Manuale-ComplianceAIAct.md` | Guida AI Act per PMI (lead magnet) |
| `COMP-Sito-ComplianceAIAct.md` | Copy pagina sito + LinkedIn posts |

### 14. No-Code / Low-Code Automation (`tracks/nocode-automation/`)
**Claim:** "Automatizza prima di assumere."

Progettazione e implementazione automazioni con piattaforme no-code (Make, n8n, Zapier): workflow inter-app, integrazioni gestionali italiani, riduzione lavoro manuale ripetitivo.

| File | Contenuto |
|------|-----------|
| `NOCODE-Playbook-Automation.md` | Framework consulenziale + gestionali IT |
| `NOCODE-Manuale-Automation.md` | Guida step-by-step automazione (lead magnet) |
| `NOCODE-Sito-Automation.md` | Copy pagina sito + pricing |

### 15. Data & Analytics (`tracks/data-analytics/`)
**Claim:** "I dati che hai gia ti dicono cosa fare."

Business intelligence e analytics per PMI: audit dati esistenti, dashboard KPI, data literacy team, cultura data-driven senza big-data hype.

| File | Contenuto |
|------|-----------|
| `DATA-Playbook-Analytics.md` | Framework analytics 5 fasi |
| `DATA-Manuale-Analytics.md` | Guida BI per PMI (lead magnet) |
| `DATA-Sito-Analytics.md` | Copy pagina sito + pricing |

---

## Track Trasversali

### Study (`tracks/study/`)
Manuali di studio per il consulente. Coprono la teoria e i framework dietro ogni track.

| File | Copertura |
|------|-----------|
| `STUDY-AI-Adoption.md` | Teoria adozione AI |
| `STUDY-AIA-Piattaforma.md` | Architettura piattaforme AI |
| `STUDY-AGILE-DevOps.md` | Fondamenti Agile/DevOps |
| `STUDY-ARCH-Scaling.md` | Pattern architetturali |
| `STUDY-DIGI-Trasformazione.md` | Digital transformation theory |
| `STUDY-FCTO-FractionalCTO.md` | Fractional leadership models |
| `STUDY-LEAD-Leadership.md` | Engineering management |
| `STUDY-WELL-Wellbeing.md` | Occupational psychology |
| `STUDY-ZERO-DigitalStarter.md` | Digital literacy foundations |

### Sales (`tracks/sales/`)
Materiali commerciali trasversali a tutte le track.

| File | Contenuto |
|------|-----------|
| `AI-Sales-Kit.md` | Script vendita, obiezioni, pricing |
| `AI-Content-Calendar.md` | Piano editoriale 90 giorni |

---

## Modelli di Ingaggio

| Modello | Target | Range | Entry Point |
|---------|--------|-------|-------------|
| Quick Win | Primo contatto | 500-1.500 EUR | Audit / Assessment |
| Progetto | Obiettivo definito | 3.000-80.000 EUR | Discovery Sprint |
| Factory | Evoluzione continua | 1.500-5.500 EUR/mese | Assessment sistema |
| Fractional CTO | Governance continuativa | 3.000-8.000 EUR/mese | Call strategica |
| Mobile (a corpo) | App chiavi in mano | 5.000-60.000 EUR | Discovery |
| Mobile (Factory) | App in evoluzione | 2.500 EUR/mese | Assessment |
| Compliance AI Act | Adeguamento normativo | 1.500-20.000 EUR | AI Risk Assessment |
| No-Code Automation | Automazione processi | 1.500-8.000 EUR | Workshop discovery |
| Data & Analytics | BI / Dashboard KPI | 2.000-15.000 EUR | Audit dati |

---

## Stato Completamento

| Track | Playbook | Manuale | Sito | Studio | Codice |
|-------|----------|---------|------|--------|--------|
| AI Adoption | - | DONE | DONE | DONE | - |
| AI Platform | DONE | DONE | DONE | DONE | WIP |
| Fractional CTO | DONE | DONE | DONE | DONE | - |
| Architettura | DONE | DONE | DONE | DONE | - |
| Trasformazione | DONE | DONE | DONE | DONE | - |
| Leadership | DONE | DONE | DONE | DONE | - |
| Agile & DevOps | DONE | DONE | DONE | DONE | - |
| Wellbeing | DONE | DONE | DONE | DONE | - |
| PA | DONE | DONE | DONE | - | - |
| Digital Starter | DONE | DONE | DONE | DONE | - |
| Sviluppo Progetto | DONE | DONE | DONE | - | - |
| Factory | DONE | DONE | DONE | - | - |
| Compliance AI Act | DONE | DONE | DONE | - | - |
| No-Code Automation | DONE | DONE | DONE | - | - |
| Data & Analytics | DONE | DONE | DONE | - | - |

**Totale:** 51 documenti track + 9 study + 2 sales = 62 documenti

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
