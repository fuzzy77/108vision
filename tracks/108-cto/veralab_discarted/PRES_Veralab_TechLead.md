# Elios Scoglio — Proposta Fractional CTO per Veralab
**108 Vision | elios@108vision.it**
**Documento: da condividere in call o inviare come allegato**

---

## Una premessa

Non mi sono candidato al ruolo Tech Lead che avete pubblicato. Ho scelto di contattarvi direttamente perché ho fatto un lavoro di analisi prima di scrivervi — e quello che ho trovato vale una conversazione.

Gestisco già un sistema a tempo pieno. Non cerco un impiego. Vi propongo qualcosa di diverso: un Fractional CTO, due giorni a settimana, obiettivi trimestrali misurabili.

Se cercate esclusivamente un dipendente full-time, non sono la persona giusta e non voglio sprecare il vostro tempo. Se siete disposti a valutare un modello diverso, il lavoro che segue mostra concretamente cosa vi porto.

---

## PARTE 1 — Cosa ho trovato prima di contattarvi

Ho analizzato veralab.it con script su dati live. Non ho usato tool generici — ho misurato endpoint specifici, header HTTP, comportamento in produzione.

### Il problema urgente

**`/blogs/news` → HTTP 500 — in produzione adesso**

Il Magazine Veralab — il vostro asset SEO, aggiornato settimanalmente, fonte di traffico organico — risponde errore 500 a ogni richiesta. Non è nei vostri alert. Probabilmente non lo sapete.

Cosa sta succedendo: ogni utente che arriva da Google su quel contenuto vede una pagina di errore. Google lo vede come sito rotto e può smettere di indicizzare quella sezione. Il content marketing che costruite ogni settimana non porta traffico.

Causa probabile: conflitto tra un'app Shopify di terze parti e il tema Liquid, causato dall'installazione o aggiornamento recente di un'app. Fix tipico: 2–4 ore.

### Gli altri finding (in ordine di impatto)

| Priorità | Finding | Impatto | Stato |
|----------|---------|---------|-------|
| P0 | Magazine `/blogs/news` → HTTP 500 | SEO rotto, utenti vedono errore | In produzione |
| P0 | Nessun alerting su errori 5xx | Nessuno sa quando il sito si rompe | Verificato |
| P0 | NAV come SPOF senza fallback | Se NAV va offline, zero gestione ordini e inventory | [probabile] |
| P1 | Structured data JSON-LD assente | Google non genera rich results — prodotti senza stelle, senza prezzo in SERP | Verificato |
| P1 | Content-Security-Policy assente | XSS via una delle decine di app Shopify terze parti — rischio reale con Jebbit, Klaviyo, pixel Meta | Verificato |
| P2 | Homepage 765KB | Core Web Vitals probabilmente sotto soglia, LCP stimato 3–4s | Verificato |
| P2 | Overskin — sito non live | Brand in produzione, dominio con placeholder Aruba | Verificato |

**Nota su Overskin**: il dominio overskin.com risponde con una pagina placeholder. Se il lancio è in programma, l'infrastruttura e-commerce non esiste ancora — è un progetto aperto.

---

## PARTE 2 — I gap architetturali (quello che non si vede dal sito)

Questi gap li conosco perché conosco i pattern. Non li ho "visti" — li ho inferiti dalla struttura del business. Vanno verificati in onboarding.

### Gap #1 — Inventory non unificato (problema centrale)

Shopify gestisce lo stock e-commerce. Dynamics NAV gestisce l'inventario fisico (14 store + B2B). Quasi certamente non esiste un single source of truth real-time.

Conseguenze operative dirette:
- Click & collect impossibile senza inventory sync
- Ship-from-store impossibile
- Overselling su lanci prodotto (stessa dinamica degli on-sale ticketing)
- Loyalty VERABILIA cross-channel non funziona se il POS non è connesso a Shopify

### Gap #2 — Decisione ERP non presa

Dynamics NAV è fuori mainstream support sulle versioni precedenti al 2018. La migrazione a Business Central (il percorso Microsoft ufficiale) richiede 6–18 mesi e 100–400K EUR. Ogni trimestre che passa senza una decisione informata aumenta il rischio di doverla prendere in emergenza.

### Gap #3 — Architettura multi-brand non definita

Veralab + Overskin condividono infrastruttura ma sono brand separati. Catalogo, pricing, loyalty, logistica, contabilità — tutto deve essere separato o condivisibile per design, non per accidente. Su Shopify standard questo non è possibile senza Shopify Plus o una scelta architetturale esplicita.

### Gap #4 — Monitoraggio assente

Il 500 del Magazine non è nei vostri alert. Questo è il segnale di un problema sistemico, non di un singolo errore: non avete visibilità su cosa succede in produzione.

---

## PARTE 3 — Chi sono

Sono Software & Architecture Manager su un sistema mission-critical che processa 30 milioni di transazioni l'anno. Gestisco 93 componenti, 7 livelli architetturali, 3 team di sviluppo.

**Non scrivo codice.** Definisco la direzione tecnica, i processi decisionali, i confini architetturali. Mi assicuro che le prossime cento decisioni del team siano quelle giuste — non quelle più veloci.

Il mio background è rilevante per Veralab per un motivo specifico: gestisco sistemi con spike di traffico prevedibili (concerti, eventi sportivi) dove un'ora di downtime o un inventory desync durante il picco costa decine di migliaia di euro. Il lancio di un prodotto Veralab con influencer coverage è esattamente lo stesso pattern: concorrenza sull'inventory, checkout sotto pressione, un errore in quel momento costa vendite reali.

**Risultati misurabili nel mio contesto attuale:**

| Metrica | Prima | Dopo |
|---------|-------|------|
| Frequenza deploy | Ogni 6 settimane | Ogni settimana (+400%) |
| Durata deploy | 4 ore | 22 minuti (–91%) |
| Tempo analisi requisiti | 2–3 giorni | 2 ore (–92%) |

---

## PARTE 4 — Il modello Fractional CTO

### Come funziona

Non sono un consulente che scrive un report e sparisce. Sono parte del sistema per la durata del contratto.

**Le 4 responsabilità:**

| Area | Cosa faccio |
|------|-------------|
| Strategia | Roadmap tecnica allineata agli obiettivi di business. Se aprite il mercato estero in 6 mesi, quella decisione entra nella roadmap tecnica oggi. |
| Architettura | Decisioni strutturali con trade-off espliciti: NAV vs Business Central, Shopify Plus vs headless, CDP vs soluzioni puntali. Non "cosa fa il mercato" — cosa è giusto per voi. |
| Team | Sviluppo del vostro Tech Lead interno. Costruisco autonomia — non dipendenza da me. |
| Stakeholder | Traduco il tecnico in linguaggio di business per il CEO. Non slide con buzzword — dashboard di rischio con impatto in EUR. |

**Cosa NON faccio:** scrivo codice, gestisco ticket, faccio il project manager, sostituisco un Tech Lead. Se manca un Tech Lead, il mio primo obiettivo è costruirne uno — dall'interno.

### I 4 momenti mensili (operating rhythm)

| Sessione | Durata | Partecipanti | Output |
|----------|--------|-------------|--------|
| Strategic Planning | 2h | CEO + Tech Lead | Decisioni scritte, roadmap aggiornata, rischi |
| Architecture Review | 2h | Tech Lead + senior dev | ADR, trade-off documentati, debito tecnico |
| Team Mentoring | 1h | Tech Lead (1-on-1) | Crescita leadership, azioni concrete |
| Stakeholder Update | 1h | CEO | Report 1-pager: highlight, rischi, decisioni richieste |

### Struttura operativa

- **3 giorni a settimana** (remoto) + 1–2 presenze mensili in sede a Milano
- Reperibilità su emergenze reali (lancio prodotto, produzione giù)
- Comunicazione asincrona su Slack/Teams
- ADR per ogni decisione architetturale rilevante — nessun folklore tecnico

---

## PARTE 5 — Il percorso proposto

### Entry point: Tech Assessment (3 giorni)

Prima di qualsiasi contratto ongoing, vi propongo un Tech Assessment autonomo.

**Output garantito:**
- Mappa completa dello stack: Shopify, NAV, CRM, WMS, POS in-store, loyalty
- Integration map: dove i dati si rompono tra sistemi
- Top 5 rischi con impatto stimato in EUR
- Decisione NAV → Business Central: go/no-go con dati, non opinioni
- Roadmap tecnica prioritizzata 12 mesi
- Fix del 500 sul Magazine (se ancora presente)

**Costo:** €2.500–3.500 (una tantum)
**Se proseguite come Fractional CTO:** il costo viene detratto dal primo mese
**Se non proseguite:** avete una roadmap verificabile e una decisione ERP informata. Zero rischio.

### Fractional CTO ongoing

Dopo il Tech Assessment, contratto retainer mensile:

| Modello | Giorni/settimana | EUR/mese | Durata minima |
|---------|-----------------|----------|---------------|
| **Standard** | 3 | €10.000–12.000 | 6 mesi |
| **Bridge** *(opzionale, fase iniziale)* | 4 | €14.000–16.000 | Max 4 mesi |

**Bridge** serve se volete più presenza nelle prime settimane mentre si costruisce il team e si stabilizzano i processi. Non è una forma permanente — si transita al modello Standard dopo il periodo concordato.

---

## PARTE 6 — I prossimi 12 mesi (se lavoriamo insieme)

### Mese 1 — Foundation
Non cambio niente. Ascolto, misuro, mappo. Output: State of the Stack + roadmap prioritizzata.

Fix immediato: `/blogs/news` HTTP 500 + monitoring alert base su 5xx.

### Mesi 2–3 — Decisioni critiche
- Assessment NAV → Business Central con dati: go/no-go
- Integration map Shopify ↔ NAV: primo prototipo inventory sync
- Decisione architettura Overskin (se il progetto è in corso)
- ADR per le prime 5 decisioni architetturali

### Mesi 4–6 — Omnichannel
- Inventory unificato (single source of truth)
- Click & collect su tutti i 14 store
- Loyalty VERABILIA cross-channel
- Profilo cliente unificato online + offline

### Mesi 7–12 — Scale
- Multi-brand architecture: Veralab + Overskin
- CDP (Customer Data Platform): aggregare dati da tutti i touchpoint
- Migrazione ERP (se assessment lo conferma)
- Team tecnico strutturato e autonomo

---

## Tre domande per voi

Prima di andare avanti:

1. **"Come funziona oggi la sincronizzazione inventory tra Shopify e i 14 store? Real-time o batch notturno?"**
2. **"Overskin — avete già deciso lo stack o è ancora aperto?"**
3. **"Chi prende le decisioni tecniche oggi — su ERP, su Shopify, sulle integrazioni?"**

Le risposte cambiano la priorità della roadmap. Ma cambiano poco la diagnosi — i gap che ho descritto esistono indipendentemente dalle risposte.

---

## Una frase

> "Non vengo a portare opinioni.
> Sono venuto con dati misurati sul vostro stack e problemi che posso risolvere.
> Il mese dopo il Tech Assessment, i numeri parlano — non le slide."

---

*Elios Scoglio | 108 Vision*
*elios@108vision.it | 108vision.it*
*Software & Architecture Manager | Fractional CTO*
