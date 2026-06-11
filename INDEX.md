---
title: "108 Vision — Architecture Index"
brand: "108 Vision"
claim: "Costruiamo la direzione, non solo il codice."
author: "Elios Scoglio"
version: "6.0"
date: "2026-06-11"
---

# 108 Vision — Architecture Index

> **Claim:** Costruiamo la direzione, non solo il codice.
> **Owner:** Elios Scoglio
> **Web:** www.108vision.it | **Email:** info@108vision.it

---

## Architettura Repository

```
Vision/
├── INDEX.md                    ← Sei qui. Mappa completa del progetto.
│
├── brand/                      ← Identita visiva, naming, tone of voice
│   └── 108-VISION-Brand-Copy-Sito.md
│
├── tracks/                     ← Offerta consulenziale (15 track — naming 108-X)
│   ├── 108-ai/                ← 108 AI — Piattaforma AI aziendale (SaaS)
│   ├── 108-ai-adoption/       ← 108 AI Adoption — Adozione AI nelle PMI
│   ├── 108-cto/               ← 108 CTO — Fractional CTO / governance tecnica
│   ├── 108-arch/              ← 108 Arch — Architettura software & scaling
│   ├── 108-digital/           ← 108 Digital — Trasformazione digitale
│   ├── 108-lead/              ← 108 Lead — Tech leadership & management
│   ├── 108-agile/             ← 108 Agile — Agile, CI/CD, DevOps culture
│   ├── 108-wellbeing/         ← 108 Wellbeing — Benessere tech team
│   ├── 108-pa/                ← 108 PA — Consulenza tecnica PA / MEPA
│   ├── 108-starter/           ← 108 Starter — Primo progetto digitale
│   ├── 108-dev/               ← 108 Dev — Sviluppo (progetto + factory)
│   ├── 108-compliance/        ← 108 Compliance — EU AI Act
│   ├── 108-nocode/            ← 108 NoCode — Automazione No-Code
│   ├── 108-data/              ← 108 Data — Analytics & BI
│   ├── 108-sales/             ← 108 Sales — Sales kit e content calendar
│   ├── study/                 ← Manuali di studio per il consulente
│   └── Curriculum/            ← CV professionali
│
├── aia-platform/              ← Codice sorgente piattaforma AI (monorepo TS)
└── aia-website/               ← Sito web (Astro + Tailwind — www.108vision.it)
```

---

## Struttura di ogni Track

Ogni track segue la naming convention `108-{keyword}/` e contiene 3 documenti standard:

| Documento | Naming | Audience |
|-----------|--------|----------|
| **Playbook** | `108{PREFIX}-Playbook.md` | Interna (consulente) |
| **Manuale** | `108{PREFIX}-Manuale.md` | Cliente (lead magnet) |
| **Sito** | `108{PREFIX}-Sito.md` | Pubblico (copy pagina web) |

---

## Catalogo Track

### 1. 108 AI Adoption (`tracks/108-ai-adoption/`)
**Claim:** "Adottare l'AI e una decisione di business, non tecnologica."

Programma strutturato per portare l'AI in PMI senza hype. Assessment readiness, selezione use case ad alto ROI, implementazione pilota, scaling.

| File | Contenuto |
|------|-----------|
| `108AIA-Manuale.md` | Guida completa adozione AI per PMI |
| `108AIA-Sito.md` | Copy pagina sito |
| `108AIA-README.md` | Overview programma |
| `108AIA-Piccole-Imprese.md` | Segmento micro/piccole (< 50 dipendenti) |
| `108AIA-Medie-Imprese.md` | Segmento medie (50-250 dipendenti) |

### 2. 108 AI (`tracks/108-ai/`)
**Claim:** "L'AI che conosce la tua azienda."

Piattaforma SaaS di assistente AI aziendale con RAG su knowledge base interna. Prodotto proprio.

| File | Contenuto |
|------|-----------|
| `108AI-Playbook.md` | Processo delivery piattaforma |
| `108AI-Manuale.md` | Architettura tecnica e funzionalita |
| `108AI-Sito.md` | Copy pagina sito |
| `108AI-Assistente-Aziendale.md` | Spec funzionale assistente |
| `108AI-Desktop-Bridge.md` | Manuale Desktop Bridge |
| `108AI-PLATFORM-AI-Piano-Esecutivo.md` | Piano go-to-market |

### 3. 108 CTO (`tracks/108-cto/`)
**Claim:** "La governance tecnica che ti manca."

CTO part-time per PMI: governance architetturale, code review strategica, mentoring tech lead.

| File | Contenuto |
|------|-----------|
| `108CTO-Playbook.md` | Framework operativo |
| `108CTO-Manuale.md` | Guida ruolo e deliverable |
| `108CTO-Sito.md` | Copy pagina sito |

### 4. 108 Arch (`tracks/108-arch/`)
**Claim:** "Il debito tecnico ha un costo invisibile."

Consulenza architetturale: audit sistemi, modernizzazione monoliti, design microservizi, scalabilita.

| File | Contenuto |
|------|-----------|
| `108ARCH-Playbook.md` | Processo audit e redesign |
| `108ARCH-Manuale.md` | Principi architetturali e pattern |
| `108ARCH-Sito.md` | Copy pagina sito |

### 5. 108 Digital (`tracks/108-digital/`)
**Claim:** "Digitalizzare e ripensare come lavori."

Accompagnamento nella digitalizzazione processi: mappatura as-is, design to-be, selezione strumenti.

| File | Contenuto |
|------|-----------|
| `108DIGI-Playbook.md` | Framework trasformazione |
| `108DIGI-Manuale.md` | Guida metodologica |
| `108DIGI-Sito.md` | Copy pagina sito |

### 6. 108 Lead (`tracks/108-lead/`)
**Claim:** "Da tech lead a leader tecnico."

Coaching per tech lead e engineering manager: comunicazione, delega, crescita team.

| File | Contenuto |
|------|-----------|
| `108LEAD-Playbook.md` | Framework coaching |
| `108LEAD-Manuale.md` | Guida leadership tecnica |
| `108LEAD-Sito.md` | Copy pagina sito |

### 7. 108 Agile (`tracks/108-agile/`)
**Claim:** "Rilasciare senza paura."

Implementazione Agile e DevOps: CI/CD, trunk-based development, team topology, metriche DORA.

| File | Contenuto |
|------|-----------|
| `108AGILE-Playbook.md` | Framework implementazione |
| `108AGILE-Manuale.md` | Guida pratiche e strumenti |
| `108AGILE-Sito.md` | Copy pagina sito |

### 8. 108 Wellbeing (`tracks/108-wellbeing/`)
**Claim:** "Il burnout costa il doppio."

Programma anti-burnout: riconoscimento segnali, riduzione cognitive load, sustainable pace.

| File | Contenuto |
|------|-----------|
| `108WELL-Playbook.md` | Framework wellbeing |
| `108WELL-Manuale.md` | Guida completa |
| `108WELL-Sito.md` | Copy pagina sito |

### 9. 108 PA (`tracks/108-pa/`)
**Claim:** "La PA ha bisogno di sistemi che funzionano."

Consulenza tecnica per enti pubblici: MEPA, bandi digitali, accessibilita, interoperabilita.

| File | Contenuto |
|------|-----------|
| `108PA-Playbook.md` | Framework PA |
| `108PA-Manuale.md` | Guida completa |
| `108PA-Sito.md` | Copy pagina sito |

### 10. 108 Starter (`tracks/108-starter/`)
**Claim:** "Il tuo primo passo. Senza fuffa."

Pacchetto entry-level per chi parte da zero: primo sito, e-commerce, CRM, workflow digitale.

| File | Contenuto |
|------|-----------|
| `108START-Playbook.md` | Processo onboarding |
| `108START-Manuale.md` | Guida primi passi |
| `108START-Sito.md` | Copy pagina sito |

### 11. 108 Dev (`tracks/108-dev/`)
**Claim:** "Un progetto. Un prezzo. Un risultato." / "Il tuo team esterno. Senza assumerlo."

Sviluppo software in due modalita: progetto a scope fisso (discovery → delivery) oppure team continuativo (factory a retainer mensile).

| File | Contenuto |
|------|-----------|
| `108DEV-Playbook-Progetto.md` | Delivery progetto chiavi in mano |
| `108DEV-Manuale-Progetto.md` | Framework progettuale |
| `108DEV-Sito-Progetto.md` | Copy sezione progetto |
| `108DEV-Playbook-Factory.md` | Framework factory / retainer |
| `108DEV-Manuale-Factory.md` | Guida operativa factory |
| `108DEV-Sito-Factory.md` | Copy sezione factory |

### 12. 108 Compliance (`tracks/108-compliance/`)
**Claim:** "L'AI Act non e un problema legale. E un problema di sistema."

Compliance EU AI Act 2024/1689: classificazione rischio, gap analysis, piano adeguamento.

| File | Contenuto |
|------|-----------|
| `108COMP-Playbook.md` | Framework compliance 6 fasi |
| `108COMP-Manuale.md` | Guida AI Act per PMI (lead magnet) |
| `108COMP-Sito.md` | Copy pagina sito |

### 13. 108 NoCode (`tracks/108-nocode/`)
**Claim:** "Automatizza prima di assumere."

Automazioni no-code (Make, n8n, Zapier): workflow inter-app, integrazioni gestionali italiani.

| File | Contenuto |
|------|-----------|
| `108NOCODE-Playbook.md` | Framework consulenziale |
| `108NOCODE-Manuale.md` | Guida step-by-step (lead magnet) |
| `108NOCODE-Sito.md` | Copy pagina sito |

### 14. 108 Data (`tracks/108-data/`)
**Claim:** "I dati che hai gia ti dicono cosa fare."

Business intelligence per PMI: audit dati, dashboard KPI, data literacy, cultura data-driven.

| File | Contenuto |
|------|-----------|
| `108DATA-Playbook.md` | Framework analytics 5 fasi |
| `108DATA-Manuale.md` | Guida BI per PMI (lead magnet) |
| `108DATA-Sito.md` | Copy pagina sito |

---

## Track Trasversali

### 108 Sales (`tracks/108-sales/`)
Materiali commerciali trasversali a tutte le track.

| File | Contenuto |
|------|-----------|
| `108SALES-Sales-Kit.md` | Script vendita, obiezioni, pricing |
| `108SALES-Content-Calendar.md` | Piano editoriale 90 giorni |

### Study (`tracks/study/`)
Manuali di studio per il consulente.

| File | Copertura |
|------|-----------|
| `108-STUDY-AI-Adoption.md` | Teoria adozione AI |
| `108-STUDY-AI-Platform.md` | Architettura piattaforme AI |
| `108-STUDY-Agile.md` | Fondamenti Agile/DevOps |
| `108-STUDY-Arch.md` | Pattern architetturali |
| `108-STUDY-Digital.md` | Digital transformation theory |

---

## Modelli di Ingaggio

| Modello | Target | Range | Entry Point |
|---------|--------|-------|-------------|
| Quick Win | Primo contatto | 500-1.500 EUR | Audit / Assessment |
| Progetto (108 Dev) | Obiettivo definito | 3.000-80.000 EUR | Discovery Sprint |
| Factory (108 Dev) | Evoluzione continua | 1.500-5.500 EUR/mese | Assessment sistema |
| 108 CTO | Governance continuativa | 3.000-8.000 EUR/mese | Call strategica |
| 108 Compliance | Adeguamento AI Act | 1.500-20.000 EUR | AI Risk Assessment |
| 108 NoCode | Automazione processi | 1.500-8.000 EUR | Workshop discovery |
| 108 Data | BI / Dashboard KPI | 2.000-15.000 EUR | Audit dati |

---

## Stato Completamento

| Track | Playbook | Manuale | Sito | Studio | Codice |
|-------|----------|---------|------|--------|--------|
| 108 AI Adoption | - | DONE | DONE | DONE | - |
| 108 AI | DONE | DONE | DONE | DONE | WIP |
| 108 CTO | DONE | DONE | DONE | DONE | - |
| 108 Arch | DONE | DONE | DONE | DONE | - |
| 108 Digital | DONE | DONE | DONE | DONE | - |
| 108 Lead | DONE | DONE | DONE | DONE | - |
| 108 Agile | DONE | DONE | DONE | DONE | - |
| 108 Wellbeing | DONE | DONE | DONE | DONE | - |
| 108 PA | DONE | DONE | DONE | - | - |
| 108 Starter | DONE | DONE | DONE | DONE | - |
| 108 Dev | DONE | DONE | DONE | - | - |
| 108 Compliance | DONE | DONE | DONE | - | - |
| 108 NoCode | DONE | DONE | DONE | - | - |
| 108 Data | DONE | DONE | DONE | - | - |

**Totale:** 51 documenti track + 9 study + 2 sales = 62 documenti

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
