# Elios Scoglio — Proposta Fractional CTO per Veralab
**108 Vision | elios@108vision.it**

**Formato**: Slide narrative (da leggere/mostrare in call, 8-10 minuti max)
**Scopo**: Presentare chi sono, cosa ho trovato, come lavoro — adattato a Veralab / Re-Forme SRL

---

## SLIDE 1 — Chi sono

**Elios Scoglio**
Software & Architecture Manager | Fractional CTO

- 10+ anni su piattaforme mission-critical
- Attualmente: governance architetturale su sistema che processa **30 milioni di transazioni/anno**
- Responsabilità quotidiana: 93 componenti, 7 livelli architetturali, 3 team di sviluppo
- Specializzazione: sistemi con **spike di traffico prevedibili**, **inventory real-time**, **integrazioni esterne critiche**, **compliance stringente** (GDPR, normativa fiscale, enti statali)

**Non scrivo codice. Faccio in modo che le decisioni tecniche siano quelle giuste.**

---

## SLIDE 2 — Perché vi contatto così

Ho analizzato veralab.it con script su dati live — non tool generici, endpoint specifici misurati uno per uno.

Quello che ho trovato vale una conversazione.

| Finding | Severity | Stato |
|---------|----------|-------|
| `/blogs/news` → HTTP 500 | **CRITICO** | In produzione adesso |
| Nessun alerting su errori 5xx | **ALTO** | Non sapete quando il sito si rompe |
| Nessun monitoraggio NAV come SPOF | **ALTO** | Zero gestione ordini se NAV va offline |
| Structured data JSON-LD assente | **MEDIO** | Google non genera rich results — prodotti senza stelle in SERP |
| Content-Security-Policy assente | **MEDIO** | XSS via app Shopify di terze parti (Jebbit, Klaviyo, pixel Meta) |
| Homepage 765KB — LCP stimato 3-4s | **MEDIO** | Core Web Vitals sotto soglia, SEO penalizzato |
| Overskin — placeholder Aruba, sito non live | **INFO** | Secondo brand senza infrastruttura |

**Il punto più urgente:**

> `/blogs/news` — il Magazine Veralab, aggiornato ogni settimana per SEO e community — risponde HTTP 500 in produzione. Ogni utente che arriva da Google su quel contenuto vede un errore. Non è nei vostri alert. Probabilmente succede da settimane.

Non sono slide. Ho i dati. Il fix tipico è 2-4 ore.

---

## SLIDE 3 — I gap architetturali (quello che non si vede dal sito)

Questi li ho inferiti dalla struttura del business — vanno verificati in onboarding, ma la probabilità è alta.

### Gap #1 — Inventory non unificato
Shopify gestisce lo stock e-commerce. Dynamics NAV gestisce l'inventario fisico (14 store + B2B). Quasi certamente **non esiste un single source of truth real-time**.

Conseguenze dirette:
- Click & collect impossibile senza inventory sync
- Overselling sui lanci prodotto con influencer coverage (stesso pattern degli on-sale ticketing — conosco questo problema)
- Loyalty VERABILIA cross-channel non funziona se il POS non è connesso a Shopify

### Gap #2 — Decisione ERP non presa
Dynamics NAV fuori mainstream support sulle versioni pre-2018. Migrazione a Business Central: 6-18 mesi, 100-400K EUR. Ogni trimestre senza una decisione informata aumenta il rischio di doverla prendere in emergenza.

### Gap #3 — Architettura multi-brand non definita
Veralab + Overskin condividono infrastruttura ma sono brand separati. Catalogo, pricing, loyalty, logistica — tutto deve essere separato o condivisibile **per design**, non per accidente. Su Shopify standard non è possibile senza Shopify Plus o scelta architetturale esplicita.

### Gap #4 — Monitoraggio assente
Il 500 del Magazine non è nei vostri alert. È il segnale di un problema sistemico: **non avete visibilità su cosa succede in produzione**.

---

## SLIDE 4 — Cosa faccio concretamente

| Responsabilità | Cosa significa in pratica |
|----------------|--------------------------|
| **Strategia tecnica** | Roadmap, decisioni architetturali, allineamento business ↔ tech |
| **Architettura** | Decisioni strutturali con trade-off espliciti: NAV vs BC, Shopify Plus vs headless, CDP vs soluzioni puntali |
| **Team** | Sviluppo del Tech Lead interno. Costruisco autonomia — non dipendenza da me |
| **Stakeholder** | Traduco il tecnico in linguaggio di business. Non slide con buzzword — dashboard di rischio con impatto in EUR |
| **Monitoraggio** | Visibilità su cosa succede in produzione: alert, metriche, golden signals |

**Cosa NON faccio:** scrivere codice, gestire sprint, fare il PM, risolvere bug in autonomia.

---

## SLIDE 5 — Risultati dimostrabili

| Metrica | Prima | Dopo |
|---------|-------|------|
| Deploy frequency | Ogni 6 settimane | **Ogni settimana (+400%)** |
| Tempo deploy | 4 ore | **22 minuti (−91%)** |
| Costo sviluppo (con AI) | baseline | **−77% a −82% su task specifici** |
| Tempo analisi requisiti | 2-3 giorni | **2 ore (−92%)** |
| Team satisfaction | baseline | **+50%** |
| Sprint velocity | baseline | **+30%** |

Questi numeri vengono da sistemi reali in produzione, non da POC o demo.

---

## SLIDE 6 — Perché sono rilevante per Veralab in particolare

| Il vostro contesto | La mia esperienza diretta |
|--------------------|--------------------------|
| Lanci prodotto con spike traffico (influencer) | Gestisco on-sale con spike prevedibili — un'ora di downtime = decine di K EUR |
| Inventory multi-canale (14 store + online) | Sistemi con inventory real-time e concorrenza sull'accesso |
| Shopify + NAV — integrazione critica | Integrazioni esterne con circuit breaker, retry, idempotenza |
| Loyalty cross-channel (VERABILIA) | Profili cliente unificati su sistemi eterogenei |
| Secondo brand da lanciare (Overskin) | Architetture multi-tenant e multi-brand su piattaforme shared |
| NAV → Business Central: decisione aperta | Migrazioni legacy in corso senza fermare la produzione |
| Monitoraggio assente | Osservabilità come strumento di governance — log, alert, golden signals |
| GDPR su dati cliente e-commerce | GDPR quotidiano: PII minimization, dati sensibili, enti statali |

---

## SLIDE 7 — Il metodo: Know-How → Step → KPI

```
MESE 1 — ASCOLTO
  Capisco il vostro stack e il vostro mondo.
  Mappo: Shopify, NAV, CRM, WMS, POS, loyalty, integrazioni.
  Misuro la baseline. Codifico i gap.
  Output: "State of the Stack" + Piano 90 giorni
  Fix immediato: /blogs/news + monitoring alert base su 5xx

MESI 2-3 — DECISIONI CRITICHE
  Assessment NAV → Business Central: go/no-go con dati
  Integration map Shopify ↔ NAV: primo prototipo inventory sync
  Architettura Overskin (se il progetto è in corso)
  ADR per le prime 5 decisioni architetturali

MESI 4-6 — OMNICHANNEL
  Inventory unificato (single source of truth)
  Click & collect su tutti i 14 store
  Loyalty VERABILIA cross-channel
  Profilo cliente unificato online + offline

MESI 7-12 — SCALE
  Multi-brand architecture: Veralab + Overskin
  CDP: aggregare dati da tutti i touchpoint
  Migrazione ERP (se assessment lo conferma)
  Team tecnico strutturato e autonomo
```

**Non prometto numeri prima di misurare il baseline. Prima misuro, poi prometto.**

---

## SLIDE 8 — Il modello Fractional CTO

| Full-time (Tech Lead / Direttore Tecnico) | Fractional CTO |
|-------------------------------------------|----------------|
| 120-180K EUR/anno (costo azienda) | 84-96K EUR/anno (3gg/sett standard) |
| Rischio hiring: 6 mesi per capire se funziona | Trial via Tech Assessment — output concreto prima |
| Prospettiva solo interna | Prospettiva esterna + interna — cross-pollination |
| Un settore = visione limitata | Multi-settore: ticketing, e-commerce, retail, PA |
| Se esce = panico + 6 mesi di vuoto | Exit pianificata → team autonomo come deliverable |

**Il vantaggio chiave:** stessa seniority enterprise a costo proporzionale, con la possibilità di scalare up (Bridge 4gg) o down ogni trimestre.

---

## SLIDE 9 — Come funziona in pratica

| Aspetto | Dettaglio |
|---------|-----------|
| **Presenza standard** | 3 giorni/settimana (remoto) + 1-2 presenze mensili in sede a Milano |
| **Bridge iniziale** | 4 giorni/settimana per max 4 mesi — se serve più presenza nella fase di onboarding |
| **Sessioni mensili fisse** | Strategic Planning (2h CEO), Architecture Review (2h Tech Lead), Team Mentoring (1h), Stakeholder Update (1h CEO) |
| **Giorni off** | Disponibilità async (risposta entro 4h), emergenze entro 2h |
| **Deliverable mensili** | Report scritto, ADR, roadmap aggiornata, metriche |
| **Commitment minimo** | 6 mesi (dopo Tech Assessment) |
| **Entry point** | Tech Assessment (3 giorni) — output concreto, zero vincolo |

---

## SLIDE 10 — Entry point: Tech Assessment

### Cos'è

3 giorni di lavoro concentrato sul vostro stack — non un'intervista, un'analisi.

### Output garantito

- Mappa completa: Shopify, NAV, CRM, WMS, POS, loyalty, integrazioni
- Integration map: dove i dati si rompono tra sistemi
- Top 5 rischi con impatto stimato in EUR
- Decisione NAV → Business Central: go/no-go con dati, non opinioni
- Roadmap tecnica prioritizzata 12 mesi
- Fix del 500 sul Magazine (se ancora presente)

### Condizioni

- **Costo**: €2.500 – €3.500 (una tantum)
- **Se proseguite come Fractional CTO**: costo detratto dal primo mese
- **Se non proseguite**: avete una roadmap verificabile e una decisione ERP informata. Zero rischio.

---

## SLIDE 11 — Una frase

> "Non sono venuto con opinioni.
> Sono venuto con dati misurati sul vostro stack e problemi che posso risolvere.
> Il mese dopo il Tech Assessment, i numeri parlano — non le slide."

---

*Elios Scoglio | elios@108vision.it | 108vision.it*
*Software & Architecture Manager | Fractional CTO — 108 Vision*
