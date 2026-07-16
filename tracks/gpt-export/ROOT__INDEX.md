---
title: "108 Vision — Indice Completo"
brand: "108 Vision"
claim: "Costruiamo la direzione, non solo il codice."
author: "Elios Scoglio"
version: "8.0"
date: "2026-06-18"
---

# 108 Vision — Indice Completo

> **Ultimo aggiornamento:** 2026-06-18
> **Owner:** Elios Scoglio | **Web:** www.108vision.it | **Email:** info@108vision.it

---

## Struttura Repository

```
Vision/
├── CLAUDE.md                        ← Istruzioni per AI copilot
├── aia-platform/                    ← Codice sorgente piattaforma AI (monorepo TS)
│   └── CLAUDE.md
├── aia-website/                     ← Sito web (Astro + Tailwind) — solo codice
│
└── tracks/                          ← TUTTI i documenti .md vivono qui
    ├── INDEX.md                     ← Sei qui. Mappa completa.
    │
    ├── brand/                       ← Identità visiva, copy, design, template, loghi
    │   ├── 108-VISION-Brand-Copy-Sito.md
    │   ├── brand-voice-strategy.md
    │   ├── design-system.md
    │   ├── logo/                   ← SVG loghi track + brand
    │   └── templates/
    │       ├── manuale-template.md
    │       ├── playbook-template.md
    │       └── sito-template.md
    │
    ├── 108-ai/                     ← Piattaforma AI aziendale (SaaS)
    │   ├── platform-docs/          ← Docs tecnici piattaforma (phase, ADR, deploy)
    │   ├── local-agent-docs/       ← Docs Desktop Agent (README, guide, ADR)
    │   └── website-docs/           ← Docs sito web (setup, blog)
    ├── 108-ai-adoption/            ← Adozione AI nelle PMI
    ├── 108-cto/                    ← Fractional CTO / governance tecnica
    ├── 108-arch/                   ← Architettura software & scaling
    ├── 108-digital/                ← Trasformazione digitale
    ├── 108-lead/                   ← Tech leadership & management
    ├── 108-agile/                  ← Agile, CI/CD, DevOps culture
    ├── 108-wellbeing/              ← Benessere tech team
    ├── 108-pa/                     ← Consulenza tecnica PA / MEPA
    ├── 108-starter/                ← Primo progetto digitale
    ├── 108-dev/                    ← Sviluppo (progetto + factory)
    ├── 108-compliance/             ← EU AI Act
    ├── 108-nocode/                 ← Automazione No-Code
    ├── 108-data/                   ← Analytics & BI
    ├── 108-sales/                  ← Sales kit e content calendar
    ├── study/                      ← Manuali di studio per il consulente
    ├── infra/                      ← Manuali infrastruttura & deploy
    ├── Curriculum/                 ← CV professionali (PDF/DOCX)
    └── ARCHITETTURA-TRACKS.md      ← Schema architetturale track
```

---

## Documenti per Categoria

### Configurazione

- [INDEX.md](INDEX.md) — Indice completo (sei qui)
- [../CLAUDE.md](../CLAUDE.md) — Istruzioni per AI copilot 108 Vision

---

### Brand & Identità (`brand/`)

- [108-VISION-Brand-Copy-Sito.md](brand/108-VISION-Brand-Copy-Sito.md) — Brand completo, copy sito, struttura pagine
- [brand-voice-strategy.md](brand/brand-voice-strategy.md) — Tone of voice, guida copy, stile comunicazione
- [design-system.md](brand/design-system.md) — Sistema visivo: colori, tipografia, componenti UI

**Template (`brand/templates/`)**

- [manuale-template.md](brand/templates/manuale-template.md) — Template base per ogni manuale cliente
- [playbook-template.md](brand/templates/playbook-template.md) — Template base per ogni playbook consulente
- [sito-template.md](brand/templates/sito-template.md) — Template base per ogni pagina servizio web

---

### Track: 108 AI Adoption (`108-ai-adoption/`)

> "Adottare l'AI è una decisione di business, non tecnologica."

- [108AIA-README.md](108-ai-adoption/108AIA-README.md) — Indice e overview del programma
- [108AIA-Manuale.md](108-ai-adoption/108AIA-Manuale.md) — Guida completa adozione AI per PMI
- [108AIA-Sito.md](108-ai-adoption/108AIA-Sito.md) — Copy pagina sito
- [108AIA-Piccole-Imprese.md](108-ai-adoption/108AIA-Piccole-Imprese.md) — Materiali segmento piccole imprese (5-30 pers.)
- [108AIA-Medie-Imprese.md](108-ai-adoption/108AIA-Medie-Imprese.md) — Materiali segmento medie imprese (30-200 pers.)

---

### Track: 108 AI (`108-ai/`)

> "L'AI che conosce la tua azienda."

- [108AI-Playbook.md](108-ai/108AI-Playbook.md) — Processo delivery piattaforma
- [108AI-Manuale.md](108-ai/108AI-Manuale.md) — Architettura tecnica e funzionalità
- [108AI-Manuale-Installazione.md](108-ai/108AI-Manuale-Installazione.md) — Guida install locale + cloud + cost control
- [108AI-Sito.md](108-ai/108AI-Sito.md) — Copy pagina sito
- [108AI-Assistente-Aziendale.md](108-ai/108AI-Assistente-Aziendale.md) — Studio di fattibilità e architettura assistente
- [108AI-Desktop-Bridge.md](108-ai/108AI-Desktop-Bridge.md) — Manuale Desktop Bridge (OS-level agent)
- [108AI-PLATFORM-AI-Piano-Esecutivo.md](108-ai/108AI-PLATFORM-AI-Piano-Esecutivo.md) — Piano go-to-market ed esecutivo piattaforma
- [desktop-agent-roadmap-complete.md](108-ai/desktop-agent-roadmap-complete.md) — Roadmap completa Desktop Agent (11 sprint, 353h)

**Documentazione tecnica piattaforma (`108-ai/platform-docs/`)**

- [phase-0-infrastructure.md](108-ai/platform-docs/phase-0-infrastructure.md) — Setup infrastruttura base (DB, cache, vettori)
- [phase-4-graph-kb.md](108-ai/platform-docs/phase-4-graph-kb.md) — Graph Knowledge Base con Neo4j
- [phase-5-desktop-agent-v2.md](108-ai/platform-docs/phase-5-desktop-agent-v2.md) — Desktop Agent v2: coding assistant completo
- [ADR-001-neo4j-graph-vector.md](108-ai/platform-docs/ADR-001-neo4j-graph-vector.md) — ADR: scelta Neo4j come Graph Knowledge Engine
- [coding-agent-capabilities.md](108-ai/platform-docs/coding-agent-capabilities.md) — Capabilities coding agent
- [desktop-agent-installer-plan.md](108-ai/platform-docs/desktop-agent-installer-plan.md) — Piano installer desktop agent
- [desktop-client-master-plan.md](108-ai/platform-docs/desktop-client-master-plan.md) — Master plan desktop client
- [manuale-deploy-hetzner.md](108-ai/platform-docs/manuale-deploy-hetzner.md) — Manuale deploy Hetzner
- [security-hardening-backlog.md](108-ai/platform-docs/security-hardening-backlog.md) — Backlog security hardening
- [base-principles.md](108-ai/platform-docs/base-principles.md) — Principi base template
- [PLAN-integration-opencode-goose-mcp.md](108-ai/platform-docs/PLAN-integration-opencode-goose-mcp.md) — Piano integrazione OpenCode/MCP (Opzione B: Embed)
- [coding-engine-setup-guide.md](108-ai/platform-docs/coding-engine-setup-guide.md) — Guida setup completa Coding Engine (locale + cloud)

**Desktop Agent docs (`108-ai/local-agent-docs/`)**

- [README.md](108-ai/local-agent-docs/README.md) — Desktop Agent: capabilities OS-level
- [CHANGELOG.md](108-ai/local-agent-docs/CHANGELOG.md) — Changelog release
- [ADR-001-extensions-architecture.md](108-ai/local-agent-docs/ADR-001-extensions-architecture.md) — ADR: architettura estensioni
- [INTEGRATIONS-API.md](108-ai/local-agent-docs/INTEGRATIONS-API.md) — API integrazioni
- [MULTI-AGENT-PLAYBOOK.md](108-ai/local-agent-docs/MULTI-AGENT-PLAYBOOK.md) — Playbook multi-agent orchestration
- [SECURITY-RUNBOOK.md](108-ai/local-agent-docs/SECURITY-RUNBOOK.md) — Runbook sicurezza
- [USER-GUIDE.md](108-ai/local-agent-docs/USER-GUIDE.md) — Guida utente

**Sito web docs (`108-ai/website-docs/`)**

- [README.md](108-ai/website-docs/README.md) — Overview stack sito (Astro + Tailwind)
- [SETUP-GUIDE.md](108-ai/website-docs/SETUP-GUIDE.md) — Setup completo: dominio Aruba, email Zoho, deploy
- [blog-benvenuto.md](108-ai/website-docs/blog-benvenuto.md) — Primo post blog: AI strategy per PMI

---

### Track: 108 CTO (`108-cto/`)

> "La governance tecnica che ti manca."

- [108CTO-Playbook.md](108-cto/108CTO-Playbook.md) — Framework operativo Fractional CTO
- [108CTO-Manuale.md](108-cto/108CTO-Manuale.md) — Guida ruolo e deliverable
- [108CTO-Principi-Tecnici.md](108-cto/108CTO-Principi-Tecnici.md) — Studio tecnico: 15 aree fondamentali (architettura, testing, security, AI, team, costi)
- [108CTO-Sito.md](108-cto/108CTO-Sito.md) — Copy pagina sito
- [PREP_Call_EticaSoluzioni_20260616.md](108-cto/PREP_Call_EticaSoluzioni_20260616.md) — Prep call Etica Soluzioni
- [PREP_Call_EticaSoluzioni_KNOWHOW.md](108-cto/PREP_Call_EticaSoluzioni_KNOWHOW.md) — Know-how Etica Soluzioni

---

### Track: 108 Arch (`108-arch/`)

> "Il debito tecnico ha un costo invisibile."

- [108ARCH-Playbook.md](108-arch/108ARCH-Playbook.md) — Processo audit e redesign architetturale
- [108ARCH-Manuale.md](108-arch/108ARCH-Manuale.md) — Principi architetturali e pattern
- [108ARCH-Sito.md](108-arch/108ARCH-Sito.md) — Copy pagina sito

---

### Track: 108 Digital (`108-digital/`)

> "Digitalizzare è ripensare come lavori."

- [108DIGI-Playbook.md](108-digital/108DIGI-Playbook.md) — Framework trasformazione digitale
- [108DIGI-Manuale.md](108-digital/108DIGI-Manuale.md) — Guida metodologica
- [108DIGI-Sito.md](108-digital/108DIGI-Sito.md) — Copy pagina sito

---

### Track: 108 Lead (`108-lead/`)

> "Da tech lead a leader tecnico."

- [108LEAD-Playbook.md](108-lead/108LEAD-Playbook.md) — Framework coaching leadership
- [108LEAD-Manuale.md](108-lead/108LEAD-Manuale.md) — Guida leadership tecnica
- [108LEAD-Sito.md](108-lead/108LEAD-Sito.md) — Copy pagina sito

---

### Track: 108 Agile (`108-agile/`)

> "Rilasciare senza paura."

- [108AGILE-Playbook.md](108-agile/108AGILE-Playbook.md) — Framework implementazione Agile/DevOps
- [108AGILE-Manuale.md](108-agile/108AGILE-Manuale.md) — Guida pratiche e strumenti
- [108AGILE-Sito.md](108-agile/108AGILE-Sito.md) — Copy pagina sito

---

### Track: 108 Wellbeing (`108-wellbeing/`)

> "Il burnout costa il doppio."

- [108WELL-Playbook.md](108-wellbeing/108WELL-Playbook.md) — Framework wellbeing team tech
- [108WELL-Manuale.md](108-wellbeing/108WELL-Manuale.md) — Guida completa anti-burnout
- [108WELL-Sito.md](108-wellbeing/108WELL-Sito.md) — Copy pagina sito

---

### Track: 108 PA (`108-pa/`)

> "La PA ha bisogno di sistemi che funzionano."

- [108PA-Playbook.md](108-pa/108PA-Playbook.md) — Framework consulenza PA
- [108PA-Manuale.md](108-pa/108PA-Manuale.md) — Guida MEPA, bandi, interoperabilità
- [108PA-Sito.md](108-pa/108PA-Sito.md) — Copy pagina sito

---

### Track: 108 Starter (`108-starter/`)

> "Il tuo primo passo. Senza fuffa."

- [108START-Playbook.md](108-starter/108START-Playbook.md) — Processo onboarding primo progetto
- [108START-Manuale.md](108-starter/108START-Manuale.md) — Guida primi passi digitali
- [108START-Sito.md](108-starter/108START-Sito.md) — Copy pagina sito

---

### Track: 108 Dev (`108-dev/`)

> "Un progetto. Un prezzo. Un risultato." / "Il tuo team esterno. Senza assumerlo."

**Modalità Progetto (scope fisso)**

- [108DEV-Playbook-Progetto.md](108-dev/108DEV-Playbook-Progetto.md) — Delivery progetto chiavi in mano
- [108DEV-Manuale-Progetto.md](108-dev/108DEV-Manuale-Progetto.md) — Framework progettuale
- [108DEV-Sito-Progetto.md](108-dev/108DEV-Sito-Progetto.md) — Copy sezione sito (progetto)

**Modalità Factory (retainer mensile)**

- [108DEV-Playbook-Factory.md](108-dev/108DEV-Playbook-Factory.md) — Framework factory / retainer
- [108DEV-Manuale-Factory.md](108-dev/108DEV-Manuale-Factory.md) — Guida operativa factory
- [108DEV-Sito-Factory.md](108-dev/108DEV-Sito-Factory.md) — Copy sezione sito (factory)

---

### Track: 108 Compliance (`108-compliance/`)

> "L'AI Act non è un problema legale. È un problema di sistema."

- [108COMP-Playbook.md](108-compliance/108COMP-Playbook.md) — Framework compliance EU AI Act (6 fasi)
- [108COMP-Manuale.md](108-compliance/108COMP-Manuale.md) — Guida AI Act per PMI (lead magnet)
- [108COMP-Sito.md](108-compliance/108COMP-Sito.md) — Copy pagina sito

---

### Track: 108 NoCode (`108-nocode/`)

> "Automatizza prima di assumere."

- [108NOCODE-Playbook.md](108-nocode/108NOCODE-Playbook.md) — Framework consulenza automazione
- [108NOCODE-Manuale.md](108-nocode/108NOCODE-Manuale.md) — Guida step-by-step (lead magnet)
- [108NOCODE-Sito.md](108-nocode/108NOCODE-Sito.md) — Copy pagina sito

---

### Track: 108 Data (`108-data/`)

> "I dati che hai già ti dicono cosa fare."

- [108DATA-Playbook.md](108-data/108DATA-Playbook.md) — Framework analytics 5 fasi
- [108DATA-Manuale.md](108-data/108DATA-Manuale.md) — Guida BI per PMI (lead magnet)
- [108DATA-Sito.md](108-data/108DATA-Sito.md) — Copy pagina sito

---

### Track Trasversale: 108 Sales (`108-sales/`)

- [108SALES-Sales-Kit.md](108-sales/108SALES-Sales-Kit.md) — Script vendita, gestione obiezioni, pricing
- [108SALES-Content-Calendar.md](108-sales/108SALES-Content-Calendar.md) — Piano editoriale e lancio 90 giorni

---

### Studio — Manuali del Consulente (`study/`)

Materiali di studio interni per il consulente. Non per il cliente.

- [108-STUDY-AI-Adoption.md](study/108-STUDY-AI-Adoption.md) — Teoria e framework adozione AI
- [108-STUDY-AI-Platform.md](study/108-STUDY-AI-Platform.md) — Architettura piattaforme AI
- [108-STUDY-AI-Principi-Operativi.md](study/108-STUDY-AI-Principi-Operativi.md) — Principi operativi AI: context, ownership, risparmio, controllo, condivisione team
- [108-STUDY-Agile.md](study/108-STUDY-Agile.md) — Fondamenti Agile, DevOps, metriche DORA
- [108-STUDY-Arch.md](study/108-STUDY-Arch.md) — Pattern architetturali e trade-off
- [108-STUDY-Digital.md](study/108-STUDY-Digital.md) — Digital transformation theory
- [STUDY-FCTO-FractionalCTO.md](study/STUDY-FCTO-FractionalCTO.md) — Campo di addestramento Fractional CTO
- [STUDY-LEAD-Leadership.md](study/STUDY-LEAD-Leadership.md) — Manuale completo tech leadership
- [STUDY-WELL-Wellbeing.md](study/STUDY-WELL-Wellbeing.md) — Manuale completo wellbeing team tech
- [STUDY-ZERO-DigitalStarter.md](study/STUDY-ZERO-DigitalStarter.md) — Guida accompagnamento Digital Starter

---

### Infrastruttura & Deploy (`infra/`)

- [VPS-Coolify-Setup-Manual.md](infra/VPS-Coolify-Setup-Manual.md) — Setup VPS economica + Coolify self-hosted
- [Railway-WellBeingApi-Setup-Manual.md](infra/Railway-WellBeingApi-Setup-Manual.md) — Deploy .NET API su Railway + PostgreSQL

---

### Architettura Track

- [ARCHITETTURA-TRACKS.md](ARCHITETTURA-TRACKS.md) — Schema architetturale delle track

---

### Agenti AI (`.claude/agents/`)

- [agent-marketing-copy-108.md](../.claude/agents/agent-marketing-copy-108.md) — Agente copywriter 108 Vision (Claude Code)

---

## Stato Completamento Track

| Track | Playbook | Manuale | Sito | Studio | Note |
|-------|----------|---------|------|--------|------|
| 108 AI Adoption | — | DONE | DONE | DONE | README + varianti segmento |
| 108 AI | DONE | DONE | DONE | DONE | + Assistente, Bridge, Piano, Platform docs |
| 108 CTO | DONE | DONE | DONE | DONE | — |
| 108 Arch | DONE | DONE | DONE | DONE | — |
| 108 Digital | DONE | DONE | DONE | DONE | — |
| 108 Lead | DONE | DONE | DONE | DONE | — |
| 108 Agile | DONE | DONE | DONE | DONE | — |
| 108 Wellbeing | DONE | DONE | DONE | DONE | — |
| 108 PA | DONE | DONE | DONE | — | — |
| 108 Starter | DONE | DONE | DONE | DONE | — |
| 108 Dev | DONE | DONE | DONE | — | 2 modalità (progetto + factory) |
| 108 Compliance | DONE | DONE | DONE | — | — |
| 108 NoCode | DONE | DONE | DONE | — | — |
| 108 Data | DONE | DONE | DONE | — | — |

---

## Conteggio Documenti

| Categoria | Documenti |
|-----------|-----------|
| Brand & Template | 6 |
| Track (Playbook/Manuale/Sito) | 44 |
| Track 108 AI (extra consulenziali) | 4 |
| Track 108 AI (platform-docs) | 10 |
| Track 108 AI (local-agent-docs) | 7 |
| Track 108 AI (website-docs) | 3 |
| Track 108 AI Adoption (extra) | 3 |
| Track 108 CTO (extra) | 2 |
| Track 108 Sales | 2 |
| Studio consulente | 10 |
| Infrastruttura | 2 |
| Architettura track | 1 |
| Agenti AI | 1 |
| **Totale** | **95** |

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
