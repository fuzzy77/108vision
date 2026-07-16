# Elios Scoglio — Presentazione per Veralab / Re-Forme SRL

**Formato**: Slide narrative (da leggere/mostrare in call, 8-10 minuti max)  
**Scopo**: Presentare chi sono, cosa ho trovato sul loro stack, come lavoro — adattato a Veralab

---

## SLIDE 1 — Chi sono

**Elios Scoglio**
Software & Architecture Manager | Fractional CTO

- 10+ anni su piattaforme mission-critical
- Attualmente: governance architetturale su sistema che processa **30 milioni di transazioni/anno**
- Responsabilità quotidiana: 93 componenti, 7 livelli architetturali, 3 team di sviluppo
- Specializzazione: sistemi con **spike di traffico prevedibili**, **inventory real-time su canali multipli**, **integrazioni esterne critiche**, **compliance stringente** (GDPR, normativa fiscale, enti statali)

**Non scrivo codice. Faccio in modo che le decisioni tecniche siano quelle giuste.**

---

## SLIDE 2 — Perché vi contatto così

Ho analizzato veralab.it con script su dati live — non tool generici, endpoint specifici misurati uno per uno.

Quello che ho trovato vale una conversazione.

| Finding | Severity | Stato |
|---------|----------|-------|
| `/blogs/news` → HTTP 500 | **CRITICO** | Confermato in produzione |
| Nessun alerting su errori 5xx | **ALTO** | Il sito si rompe senza che nessuno lo sappia |
| Content-Security-Policy assente | **ALTO** | XSS possibile via app Shopify di terze parti |
| Structured data JSON-LD assente | **MEDIO** | Google non genera rich results — prodotti senza stelle in SERP |
| Homepage 765KB — LCP stimato 3-4s | **MEDIO** | Core Web Vitals sotto soglia, SEO penalizzato |
| X-Frame-Options assente | **MEDIO** | Vulnerabilità clickjacking su checkout |
| Overskin — placeholder Aruba, non live | **INFO** | Secondo brand senza infrastruttura |

**Il punto più urgente:**

> `/blogs/news` — il Magazine Veralab, aggiornato ogni settimana per SEO e community — risponde HTTP 500 in produzione adesso. Ogni utente che arriva da Google su quel contenuto vede un errore. Non è nei vostri alert. Probabilmente succede da settimane.

Non sono slide. Questi li ho misurati live. Il fix tipico è 2-4 ore.

---

## SLIDE 3 — I gap architetturali (quello che non si vede dal sito)

Questi li ho inferiti dalla struttura del business — vanno verificati in onboarding. Li presento come ipotesi da confermare, non come certezze.

### Gap probabile #1 — Inventory non unificato

Shopify gestisce lo stock e-commerce. Dynamics NAV gestisce l'inventario fisico (14 store + B2B). Su questa architettura, quasi certamente non esiste un single source of truth real-time.

Possibili conseguenze dirette:
- Click & collect complesso senza sincronizzazione inventory
- Overselling sui lanci con copertura influencer (stesso pattern degli on-sale ticketing — conosco questo problema dall'interno)
- Loyalty VERABILIA cross-channel limitata se il POS non è connesso a Shopify

### Gap probabile #2 — Decisione ERP aperta

Dynamics NAV: le versioni pre-2018 sono fuori mainstream support. Migrazione a Business Central: 6-18 mesi, 100-400K EUR. Ogni trimestre senza una decisione informata aumenta il rischio di doverla prendere in emergenza, quando i costi e i rischi sono massimi.

### Gap probabile #3 — Architettura multi-brand non definita

Veralab + Overskin sono brand separati. Catalogo, pricing, loyalty, logistica — tutto deve essere separato o condivisibile **per design**, non per accidente. Su Shopify standard non è possibile senza Shopify Plus o una scelta architetturale esplicita presa prima che si accumuli debito.

### Gap verificato — Monitoring assente

Il 500 del Magazine non è nei vostri alert. Questo è il segnale più chiaro: **non avete visibilità su cosa succede in produzione**. È il gap più semplice da chiudere e il più importante per tutto il resto.

---

## SLIDE 4 — Cosa faccio concretamente

| Responsabilità | Cosa significa in pratica |
|----------------|--------------------------|
| **Strategia tecnica** | Roadmap, decisioni architetturali, allineamento business ↔ tech |
| **Architettura** | Decisioni strutturali con trade-off espliciti: NAV vs Business Central, Shopify Plus vs headless, inventory sync approach, architettura Overskin |
| **Team** | Sviluppo del Tech Lead interno. Costruisco autonomia — non dipendenza da me |
| **Stakeholder** | Traduco il tecnico in linguaggio business. Non slide con buzzword — impatto in EUR, rischi concreti, timeline realistiche |
| **Monitoraggio** | Visibilità su cosa succede in produzione: alert, metriche, 4 Golden Signals |

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

## SLIDE 6 — Il mio approccio: due filoni

### Filone 1 — PRESENTE
> Concretizzare e ottimizzare quello che c'è

- Fix Magazine + monitoring su 5xx (primo giorno)
- Security headers via Cloudflare (CSP, X-Frame, Referrer-Policy)
- Structured data JSON-LD → rich results su Google
- Ottimizzazione performance homepage (765KB → <200KB target)
- Pipeline di deploy stabile, code review strutturata
- Incident playbook: "cosa fare quando il checkout va giù durante un lancio influencer"

**Principio:** zero rivoluzioni. Ogni intervento ha valore visibile in 2-4 settimane.

---

### Filone 2 — VISIONE
> Dove andare nei prossimi 12-24 mesi

- Inventory unificato: Shopify ↔ NAV → single source of truth
- Decisione NAV → Business Central: go/no-go con dati, non opinioni
- Architettura Overskin: Shopify Plus? Multi-store? Headless? Decisa prima del debito
- Loyalty VERABILIA davvero cross-channel (online + store fisici unificati)
- Profilo cliente unificato: CRM/CDP che aggrega tutti i touchpoint
- AI dove ha senso: predizione stock, personalizzazione, chatbot post-vendita

**Principio:** ogni decisione strategica ha un costo stimato, un beneficio misurabile, e un piano di rollback.

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
  Integration map Shopify ↔ NAV: design inventory sync
  Architettura Overskin (se il progetto è in corso)
  ADR per le prime 5 decisioni architetturali

MESI 4-6 — OMNICHANNEL
  Inventory unificato (single source of truth)
  Click & collect su tutti i 14 store
  Loyalty VERABILIA cross-channel
  Profilo cliente unificato online + offline

MESI 7-12 — SCALE
  Multi-brand: Veralab + Overskin su architettura condivisa
  Migrazione ERP (se assessment lo conferma)
  Team tecnico strutturato e autonomo
```

**Non prometto numeri prima di misurare il baseline. Prima misuro, poi prometto.**

---

## SLIDE 8 — Perché sono rilevante per Veralab in particolare

| Il vostro contesto | La mia esperienza diretta |
|--------------------|--------------------------|
| Lanci prodotto con spike traffico (influencer) | Gestisco on-sale con spike prevedibili — un'ora di downtime = decine di K EUR |
| Inventory multi-canale (14 store + online) | Sistemi con inventory real-time e accesso concorrente su stock critico |
| Shopify + NAV — integrazione eterogenea | Integrazioni esterne con circuit breaker, retry, idempotenza — conosco il pattern |
| Loyalty cross-channel (VERABILIA) | Profili cliente unificati su sistemi eterogenei |
| Secondo brand da lanciare (Overskin) | Architetture multi-brand su piattaforme condivise |
| NAV → Business Central: decisione aperta | Migrazioni legacy in produzione senza fermare il business |
| Monitoring assente | Observability come strumento di governance — log, alert, golden signals |
| GDPR su dati cliente e-commerce | GDPR quotidiano: PII minimization, dati sensibili |

---

## SLIDE 9 — Il modello Fractional CTO

| Full-time (Tech Lead / Direttore Tecnico) | Fractional CTO |
|-------------------------------------------|----------------|
| 120-180K EUR/anno (costo azienda) | 84-96K EUR/anno (3gg/sett standard) |
| Rischio hiring: 6 mesi per capire se funziona | Trial via Tech Assessment — output concreto prima di impegnarsi |
| Prospettiva solo interna | Prospettiva esterna + interna — cross-pollination |
| Un settore = visione limitata | Multi-settore: ticketing, e-commerce, retail, PA |
| Se esce = panico + 6 mesi di vuoto | Exit pianificata → team autonomo come deliverable |

**Il vantaggio chiave:** stessa seniority enterprise a costo proporzionale, con la possibilità di scalare su (Bridge 4gg) o giù ogni trimestre.

---

## SLIDE 10 — Come funziona in pratica

| Aspetto | Dettaglio |
|---------|-----------|
| **Presenza standard** | 3 giorni/settimana (remoto) + 1-2 presenze mensili a Milano |
| **Bridge iniziale** | 4 giorni/settimana per max 4 mesi — se serve più presenza nella fase decisionale (NAV, Overskin, onboarding) |
| **Sessioni mensili fisse** | Strategic Planning (2h CEO), Architecture Review (2h Tech Lead), Team Mentoring (1h) |
| **Giorni off** | Disponibilità async (risposta entro 4h), emergenze entro 2h |
| **Deliverable mensili** | Report scritto, ADR, roadmap aggiornata, metriche |
| **Commitment minimo** | Tech Assessment → poi 6 mesi |
| **Entry point** | Tech Assessment (3 giorni) — output concreto, zero vincolo |

---

## SLIDE 11 — Entry point: Tech Assessment

### Cos'è

3 giorni di lavoro concentrato sul vostro stack — non un'intervista, un'analisi.

### Output garantito

- Mappa completa: Shopify, NAV, CRM, WMS, POS, loyalty, integrazioni
- Integration map: dove i dati si rompono tra sistemi
- Top 5 rischi con impatto stimato in EUR
- Decisione NAV → Business Central: go/no-go con dati, non opinioni
- Architettura Overskin: raccomandazione con trade-off
- Roadmap tecnica prioritizzata 12 mesi
- Fix del 500 sul Magazine (primo giorno, se ancora presente)

### Condizioni

- **Costo**: €2.500 – €3.500 (una tantum)
- **Se proseguite come Fractional CTO**: costo detratto dal primo mese
- **Se non proseguite**: avete una roadmap verificabile, una decisione ERP informata, e un sito con il Magazine funzionante. Zero rischio.

---

## SLIDE 12 — Una frase

> "Non sono venuto con opinioni.
> Sono venuto con dati misurati sul vostro stack e problemi che posso risolvere.
> Il giorno dopo l'onboarding, il Magazine è online.
> Il mese dopo il Tech Assessment, i numeri parlano — non le slide."

---

*Elios Scoglio | elios@108vision.it | 108vision.it*  
*Software & Architecture Manager | Fractional CTO — 108 Vision*
