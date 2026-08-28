---
title: "VPS-Spiegato-Semplice"
brand: "108 Vision"
type: "manuale"
audience: "interno"
version: "1.0"
date: "2026-08-21"
track: "infra"
---

# VPS spiegato semplice — cos'è, quanto costa, perché non paghi GitHub

> Guida per chi non ha mai avuto un server. Spiega in parole semplici cos'è un VPS, perché **"VPS only"** è la scelta giusta per 108 Vision, e perché così **non paghi GitHub Actions / GHCR**. Il dettaglio tecnico passo-passo resta in [manuale-deploy-completo-hetzner.md](manuale-deploy-completo-hetzner.md).

---

## 1. Cos'è un VPS (in parole semplici)

Un **VPS** (Virtual Private Server) è un **computer sempre acceso, affittato in un datacenter, che controlli completamente**.

**Analogia:** è come affittare un piccolo ufficio con dentro un computer che non spegni mai. Il tuo sito e le tue app "vivono" lì: chi apre `108vision.it` o usa l'app WellBeing sta parlando con **quel** computer.

**Rispetto alle alternative:**

| Soluzione | Cos'è | Limite |
|---|---|---|
| Hosting condiviso (Aruba base) | condividi un computer con altri siti | non puoi installare Docker, .NET, database custom |
| Serverless (Vercel/Netlify) | non gestisci nessun computer, carichi solo il codice | costi variabili, limiti, e servizi "pieni" (DB, API .NET, text-to-speech) non ci girano o costano |
| **VPS** | un computer tutto tuo, a costo fisso | devi occuparti tu dell'aggiornamento (ma lo automatizziamo) |

Il VPS è la via di mezzo: **piena libertà, costo fisso e prevedibile**.

---

## 2. Quanto costa davvero

| Voce | Costo | Note |
|---|---|---|
| VPS Hetzner CX32 (4 vCPU · 8 GB RAM · 80 GB NVMe · Ubuntu 24.04) | **~8 €/mese fisso** | l'unico costo |
| Dominio 108vision.it (Aruba) | già pagato | non cambia |
| GitHub (solo hosting del codice → `git pull`) | **0 €** | repo privati gratuiti |
| SSL / HTTPS (Let's Encrypt via Traefik) | **0 €** | automatico |
| **Totale** | **~8 €/mese fisso** | nessuna sorpresa a fine mese |

---

## 3. Perché "VPS only" = non paghi GitHub

Esistono **due modi** di fare il deploy automatico. La differenza sta in *chi compila il codice*:

### Modo A — GitHub Actions + GHCR (scartato)
- GitHub "affitta" computer temporanei per compilare le immagini Docker → consumi **minuti CI** (solo 2.000 min/mese gratis con repo privati, poi paghi ~0,008 €/min).
- Le immagini compilate vengono salvate su **GHCR** → consumi **storage** (500 MB gratis, poi 0,25 €/GB/mese) e **transfer** (1 GB/mese gratis).
- **Rischio concreto:** ogni push che tagga l'immagine con lo SHA genera una nuova copia da 200–400 MB → in poche settimane superi la soglia → arriva la bolletta.

### Modo B — VPS only (scelto)
- Le immagini Docker vengono **compilate direttamente sul tuo VPS** (che paghi già con gli 8 €/mese).
- Nessun computer temporaneo GitHub → **0 minuti CI**.
- Nessuna immagine su GHCR → **0 storage, 0 transfer**.
- GitHub viene usato **solo come cassaforte del codice** (un normale repo git), che è gratis.
- **Risultato: paghi solo Hetzner. Punto.**

> **In più:** il codice gira su un computer che controlli tu. Non dipendi da limiti o variazioni di prezzo di GitHub.

---

## 4. Come funziona il deploy VPS-only (flusso)

```
Tu (PC)                    GitHub (gratis)                 VPS Hetzner (~8 €/mese)
  │  git push                 │                                │
  │──────────────────────────▶│   (notifica webhook)           │
  │                           │───────────────────────────────▶│
  │                           │                                │  webhook → deploy.sh
  │                           │                                │  git pull  (scarica il codice nuovo)
  │                           │                                │  docker compose build  (compila SUL VPS)
  │                           │                                │  docker compose up -d  (riavvia i servizi)
  │                           │                                │  health check
```

**Passi:**
1. Tu fai `git push` (gratis, dal tuo PC).
2. GitHub invia un **webhook** (una semplice chiamata HTTP) al VPS: "il codice è cambiato".
3. Sul VPS uno script `deploy.sh` esegue `git pull` + `docker compose build` + `docker compose up -d`.
4. Sito e app sono aggiornati. **Hai pagato solo il VPS.**

---

## 5. Cosa gira sul VPS (in parole semplici)

| Servizio | A cosa serve | Indirizzo |
|---|---|---|
| **Traefik** | "portiere" che smista le richieste e mette l'HTTPS | — |
| **Sito 108 Vision** (Astro) | il sito pubblico | www.108vision.it |
| **Gateway AIA** (Hono) | API della piattaforma 108 Vision | api.108vision.it |
| **WellBeing API** (.NET 9) | backend dell'app WellBeing | wellbeing.108vision.it |
| **PostgreSQL** | database (dati WellBeing + piattaforma) | interno |
| **Redis** | memoria veloce (cache) | interno |
| **Qdrant** | database vettoriale per l'AI | interno |
| **Neo4j** | grafo della conoscenza | interno |
| **LiteLLM** | porta unica verso i modelli AI (DeepSeek/Qwen) | interno |

Tutto dentro **contenitori Docker**, avviati insieme con un solo comando (`docker compose`).

---

## 6. Cosa devi fare tu (una sola volta)

1. **Comprare il VPS** Hetzner CX32 (~8 €/mese) — 10 minuti.
2. **Puntare i DNS** (Aruba) dei sottodomini verso l'IP del VPS.
3. **Eseguire lo script bootstrap** che preparo io: installa Docker, crea le cartelle, scarica i file di deploy, avvia tutto.
4. **Inserire i segreti** (chiavi API DashScope/DeepSeek, password DB, OAuth Google/Facebook) nel file `.env` **sul VPS** — mai su GitHub.

Da lì in poi: **ogni `git push` aggiorna sito e app da solo.**

---

## 7. Domande frequenti

**"Se spengo il VPS, il sito va giù?"**
Sì. Il VPS deve restare acceso (è la sua natura: un computer sempre on). Hetzner lo tiene acceso per te.

**"E se il VPS si rompe o lo buco con un aggiornamento?"**
C'è il backup automatico dei database (cron sul VPS) e, opzionale, lo snapshot Hetzner (+~1,50 €/mese). Il codice è sempre al sicuro su GitHub.

**"Devo sapere Linux/Docker?"**
No. Per l'uso quotidiano non tocchi nulla: fai `git push` e basta. Il setup iniziale è scriptato.

**"Perché non resto su Azure/Railway per WellBeing?"**
Perché lì i costi crescono con l'uso (e con TTS/audio/DB). Sul VPS è un costo fisso che non cambia.

---

## 8. Riferimenti

- [manuale-deploy-completo-hetzner.md](manuale-deploy-completo-hetzner.md) — procedura tecnica passo-passo completa.
- [VPS-Coolify-Setup-Manual.md](VPS-Coolify-Setup-Manual.md) — alternativa con pannello grafico (Coolify), se in futuro preferisci non usare Docker "a mano".

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
