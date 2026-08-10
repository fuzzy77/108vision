---
title: "Data & Analytics — Playbook Operativo per il Consulente"
author: "Elios Scoglio"
track: "108-data"
version: "1.0"
date: "2026-06-09"
uso: "Interno — riferimento consulenziale"
brand: "108 Vision"
---

# Data & Analytics — Playbook Operativo

Guida operativa per l'erogazione del servizio. Copre posizionamento, stack tecnologico, processo di delivery, pattern per settore, governance, KPI framework, pricing e upsell.

---

## 1. Posizionamento — Perché Questo Track Esiste

### Il problema reale delle PMI italiane

Il titolare di una PMI italiana da 10-80 persone prende decisioni importanti ogni giorno: dove investire il budget marketing, quale linea di prodotto spingere, quali clienti vale la pena coltivare, dove si perdono i margini. La maggior parte di queste decisioni viene presa "a sensazione" — sulla base dell'esperienza, dell'intuito, di ciò che si ricorda degli ultimi mesi.

Non è irrazionale. Per decenni ha funzionato. Il problema è che oggi il contesto cambia più velocemente dell'intuito individuale. E i competitor che usano i dati per decidere accumulano un vantaggio silenzioso, invisibile fino a quando il gap è già ampio.

### Il posizionamento corretto

Non vendiamo "business intelligence". Non vendiamo "data strategy". Vendiamo **la capacità di vedere la propria azienda in tempo reale** — come un cruscotto che mostra dove si sta andando, non solo dove si è stati.

Il buyer non è il responsabile IT. Il buyer è:
- L'imprenditore che vuole smettere di fare riunioni basate su opinioni
- Il CFO che vuole avere i numeri senza aspettare fine mese
- Il direttore commerciale che vuole capire quali clienti stanno per andarsene
- Il responsabile operations che vuole sapere dove si perdono ore e margini

### La promessa concreta

> "In 90 giorni hai una dashboard che ti mostra le 10 metriche più importanti del tuo business, aggiornata ogni giorno, accessibile da browser. E sai già cosa fare quando una metrica va nella direzione sbagliata."

### Differenziatori rispetto ai competitor

| Noi | Consulenti IT generici | Software house |
|---|---|---|
| Partiamo dai problemi di business | Partono dalla tecnologia | Partono dal prodotto da vendere |
| Dashboard su misura per il settore | Template generici | Template di prodotto |
| Formiamo il team interno | Deploy e spariscono | Mantengono la dipendenza |
| Stack open source + cloud gratuito | Stack proprietari costosi | License fee mensile |
| Upsell naturale verso AI | Progetto chiuso | Progetto chiuso |

---

## 2. Stack Tecnologico Consigliato per PMI

La scelta dello stack deve seguire tre criteri: **costo totale di ownership**, **facilità di adozione interna**, **scalabilità futura**. Non esiste una soluzione universale. Qui il framework decisionale.

### 2.1 Metabase — Self-Hosted Open Source

**Quando usarlo:** PMI con un minimo di competenza tecnica interna (anche solo un developer o un sistemista part-time), che vuole una soluzione completamente propria, senza dipendenze cloud, con controllo totale sui dati.

**Costo reale:**
- Software: gratuito (Community Edition)
- Hosting: VPS da 20-40€/mese (Hetzner, OVH, Contabo) o server interno già disponibile
- Metabase Cloud: 500$/anno per un'istanza gestita (elimina la parte operativa)

**Vantaggi:**
- Interfaccia intuitiva — un utente business non tecnico può costruire query senza SQL in 2 ore di onboarding
- Connettori nativi per PostgreSQL, MySQL, MS SQL Server, MongoDB, Google Sheets, BigQuery, Snowflake e oltre 40 altri
- Embedding: puoi incorporare le dashboard in portali interni o applicativi custom
- API completa per automazione
- Alerting nativo: soglie su metriche, notifiche email/Slack

**Svantaggi:**
- Richiede manutenzione (aggiornamenti, backup)
- Enterprise features (SSO, permessi granulari per row) solo nella versione Pro (500$/anno)
- La Community Edition non ha supporto ufficiale

**Setup minimo per PMI:**
```
Server: VPS 4GB RAM, 2 CPU, 50GB SSD (≈ 20€/mese su Hetzner)
Database Metabase: PostgreSQL 15 (nello stesso VPS o managed)
Database dati: il DB già esistente dell'azienda (connessione read-only)
Backup: snapshot giornaliero automatico (≈ 5€/mese)
SSL: Let's Encrypt gratuito con reverse proxy Caddy o Nginx
```

**Tempo di setup:** 4-8 ore per un professionista esperto. 1-2 giorni se il cliente non ha infrastruttura esistente.

**Adatto per:** aziende con 1 database principale (ERP, CRM, e-commerce), dati già in un DB relazionale, nessun vincolo cloud specifico.

---

### 2.2 Looker Studio (Google) — Cloud Gratuito

**Quando usarlo:** PMI che usano già l'ecosistema Google (Google Analytics, Google Ads, Google Sheets), che hanno dati distribuiti in più sorgenti cloud, che vogliono zero overhead operativo.

**Costo reale:**
- Looker Studio: completamente gratuito
- Looker Studio Pro: 9$/mese per utente (funzioni enterprise, embedding, SLA)
- Google Cloud (BigQuery per storage dati): pay-per-query, tipicamente 0-50€/mese per PMI
- Connectors di terze parti: 0-30€/mese (SuperMetrics, Fivetran Lite)

**Vantaggi:**
- Zero infrastruttura da gestire
- Connessione nativa con tutti i prodotti Google
- Condivisione semplice (link con permessi Google)
- Aggiornamento dati in tempo reale per le sorgenti native
- Ottimo per marketing analytics (GA4, Google Ads, Search Console)

**Svantaggi:**
- Connessione ai database aziendali richiede connettori di terze parti (a pagamento) o middleware
- Calcoli complessi e trasformazioni dati avanzate richiedono BigQuery (curva di apprendimento)
- Non self-hosted: dati passano per infrastruttura Google (valutare per dati sensibili)
- Personalizzazione grafica limitata rispetto ad altre soluzioni

**Pattern di utilizzo tipico per PMI:**
```
Sorgenti:          Google Analytics 4 + Google Ads + Google Sheets (dati vendite manuali)
Connessione:       Nativa (gratuita)
Trasformazioni:    Google Sheets come layer intermedio o BigQuery per dati complessi
Dashboard:         Looker Studio con template personalizzati
Condivisione:      Link condivisibile + embedding su sito intranet
```

**Adatto per:** PMI con forte presenza digitale (e-commerce, servizi online), team marketing orientato a Google, necessità di zero costi infrastrutturali.

---

### 2.3 Power BI — Microsoft Integrato

**Quando usarlo:** PMI che vivono nell'ecosistema Microsoft (Office 365, Azure AD, Dynamics, SQL Server), che hanno già licenze M365, che vogliono integrazione nativa con Excel e SharePoint.

**Costo reale:**
- Power BI Desktop: gratuito (solo uso locale)
- Power BI Pro: 9,99€/utente/mese (condivisione e collaborazione)
- Power BI Premium Per User: 18,70€/utente/mese (AI features, deployment pipelines)
- Power BI Embedded: pay-per-use per embedding in applicazioni

**Vantaggi:**
- Integrazione eccellente con l'intero stack Microsoft
- Power Query (M language) potente per trasformazioni dati senza codice
- DAX per calcoli avanzati (una volta appreso, estremamente espressivo)
- Connettori per quasi tutto (500+)
- Se il cliente ha già M365 Business Premium, Power BI Pro può essere incluso

**Svantaggi:**
- Curva di apprendimento DAX ripida
- Ecosistema fortemente legato a Microsoft (vendor lock-in reale)
- La versione gratuita è inutilizzabile per il lavoro collaborativo
- Performance su dataset grandi richiede Premium (costi significativi)
- Refreshes dati limitati nella versione Pro (8/giorno)

**Adatto per:** PMI che già usano Microsoft 365, che hanno SQL Server come database principale, che vogliono integrazione con Excel e Teams.

---

### 2.4 Apache Superset — Enterprise Open Source

**Quando usarlo:** PMI medio-grandi (50+ persone) o con un team tecnico interno capace, che vogliono una soluzione enterprise senza license cost, che devono gestire volumi di dati elevati, che vogliono personalizzazione massima.

**Costo reale:**
- Software: gratuito (Apache License 2.0)
- Hosting: VPS robusto o Kubernetes (50-200€/mese a seconda del volume)
- Preset.io (Superset managed): da 50$/mese

**Vantaggi:**
- Feature set enterprise completo: RBAC granulare, Row Level Security, audit log
- Supporto nativo per database analitici (ClickHouse, Druid, Trino, Presto, BigQuery)
- SQL Lab integrato per query ad-hoc
- Plugin architecture per visualizzazioni custom
- Usato in produzione da Airbnb, Twitter, Netflix (credenziali eccellenti)

**Svantaggi:**
- Setup e configurazione complessa (Docker Compose o Helm chart)
- Richiede familiarità con Python, Docker, eventualmente Kubernetes
- Manutenzione non banale
- Onboarding utenti business più lento rispetto a Metabase

**Adatto per:** PMI con team tecnico interno, volumi dati significativi, requisiti di sicurezza avanzati.

---

### Matrice di Selezione Stack

| Criterio | Metabase | Looker Studio | Power BI | Superset |
|---|---|---|---|---|
| Costo infrastruttura | Basso | Zero | Medio | Medio-Alto |
| License cost | Zero | Zero | Medio | Zero |
| Setup complexity | Bassa | Molto bassa | Bassa | Alta |
| Ecosistema Microsoft | No | No | Eccellente | No |
| Ecosistema Google | Medio | Eccellente | No | Medio |
| Volumi dati | Medio | Alto (con BigQuery) | Alto | Molto alto |
| Autonomia cliente | Alta | Alta | Media | Alta |
| Embedding | Si | Si (Pro) | Si (Embedded) | Si |
| Self-hosted | Si | No | Parziale | Si |

**Regola pratica:** inizia con Metabase o Looker Studio. Migra a Superset o Power BI solo se ci sono esigenze specifiche che le prime due non coprono.

---

## 3. Processo di Delivery

Il processo standard si articola in 6 fasi. Ogni fase ha deliverable chiari, criteri di completamento e checkpoint con il cliente.

### Fase 0 — Discovery (1-2 giorni, inclusa nell'assessment)

**Obiettivo:** capire dove si trova il cliente, cosa vuole ottenere, cosa è fattibile.

**Attività:**
- Intervista con il decision maker (60 min): "Quali decisioni prendi ogni mese che vorresti fare meglio?"
- Mappatura delle sorgenti dati esistenti (CRM, ERP, e-commerce, fogli Excel, strumenti SaaS)
- Valutazione qualità e accessibilità dei dati
- Definizione di 3-5 domande di business prioritarie a cui i dati devono rispondere

**Output:** Data Readiness Score (1-5) e proposta tecnica adattata al contesto.

**Red flags che bloccano il progetto:**
- Dati completamente inconsistenti (nomi cliente in 5 formati diversi, date non standardizzate)
- Zero ownership dei dati nell'organizzazione (nessuno sa dove sono i dati di cosa)
- Aspettative irrealistiche ("voglio la dashboard domani con tutti i dati degli ultimi 10 anni")

---

### Fase 1 — Data Audit (3-5 giorni)

**Obiettivo:** inventario completo delle sorgenti dati, valutazione qualità, identificazione gap.

**Attività:**
1. Mappatura di tutte le sorgenti: database, file, API, strumenti SaaS
2. Per ogni sorgente: volume, aggiornamento, formato, ownership, qualità
3. Identificazione delle sorgenti "master" per ogni dominio (clienti, prodotti, ordini)
4. Analisi della sovrapposizione e conflitti tra sorgenti diverse
5. Stima dell'effort di normalizzazione

**Template Data Audit:**

```markdown
## Sorgente: [Nome]
- Tipo: Database relazionale / File / API / SaaS
- Tecnologia: MySQL 8.0 / Excel / REST API / Salesforce
- Volume: N record, X GB
- Frequenza aggiornamento: Realtime / Giornaliero / Settimanale / Manuale
- Owner: [Nome persona]
- Qualità stimata: Alta / Media / Bassa
- Problemi noti: [lista]
- Accessibilità: Diretta / Via export / Via API / Richiede ETL
```

**Output:** Data Audit Report con:
- Mappa delle sorgenti
- Data Quality Assessment per sorgente (0-100)
- Lista prioritizzata delle azioni di pulizia
- Stima del gap tra stato attuale e stato necessario per le dashboard

---

### Fase 2 — Data Model Design (2-4 giorni)

**Obiettivo:** definire la struttura logica dei dati che alimenterà le dashboard.

**Principio guida:** il data model non deve replicare il modello operativo del database sorgente. Deve essere ottimizzato per le query analitiche — piatto, denormalizzato dove utile, con dimensioni e fatti separati.

**Schema Kimball (star schema) per PMI:**

```
FATTO: ordini
- order_id
- date_id (FK → dim_date)
- customer_id (FK → dim_customer)
- product_id (FK → dim_product)
- channel_id (FK → dim_channel)
- revenue
- cost
- margin
- quantity

DIMENSIONE: date
- date_id
- year, quarter, month, week, day
- is_weekend, is_holiday
- fiscal_period

DIMENSIONE: customer
- customer_id
- segment (new/returning/vip)
- acquisition_channel
- acquisition_date
- region, city
- industry (B2B)

DIMENSIONE: product
- product_id
- category, subcategory
- brand, supplier
- unit_cost, unit_price
- margin_band (A/B/C)
```

**Output:** ERD del data warehouse + dizionario dei dati (ogni campo con definizione, tipo, valori ammessi).

---

### Fase 3 — ETL/Pipeline Setup (3-7 giorni)

**Obiettivo:** costruire il flusso automatico che porta i dati dalle sorgenti al data warehouse/mart su cui girano le dashboard.

**Stack ETL per PMI (in ordine di complessità crescente):**

**Opzione A — dbt + script SQL (consigliata per partire)**
- Adatta quando i dati sono già in un database relazionale
- dbt trasforma i dati con SQL puro, versiona le trasformazioni in Git
- Schedule: cron job o dbt Cloud (free tier disponibile)
- Costo: quasi zero

**Opzione B — Python + Pandas + SQLAlchemy**
- Adatta quando ci sono sorgenti eterogenee (API, file, database diversi)
- Script Python schedulati (cron, Prefect free tier, Airflow self-hosted)
- Costo: infrastruttura hosting (VPS già esistente o aggiunta 10-20€/mese)

**Opzione C — Fivetran / Airbyte (low-code ETL)**
- Adatta quando ci sono molti connettori SaaS da integrare
- Airbyte: open source self-hosted o cloud (free tier fino a 1000 record/mese)
- Fivetran: costoso per PMI (500-2000$/mese), ma potente
- Valutare solo se la complessità delle sorgenti giustifica il costo

**Pattern ETL standard:**

```
EXTRACT:   Connessione read-only alle sorgenti originali
           → mai scrivere sui sistemi operativi
           → snapshot incrementali (delta) quando possibile

TRANSFORM: Normalizzazione (nomi, date, valute, encoding)
           Deduplicazione
           Calcolo metriche derivate (margine, LTV, CAC)
           Validazione qualità (null checks, range checks, referential integrity)

LOAD:      Caricamento nel data warehouse (PostgreSQL, BigQuery, DuckDB)
           Strategia: full refresh per piccoli dataset, incremental per grandi
           Notifiche di errore via email/Slack se il job fallisce
```

**Monitoraggio pipeline:**
- Log di ogni esecuzione (timestamp, record processati, errori)
- Alert se il job non gira da N ore
- Alert se la qualità dei dati scende sotto una soglia (es. >5% null su campo chiave)

---

### Fase 4 — Dashboard Building (3-8 giorni)

**Obiettivo:** costruire le dashboard che rispondono alle domande di business identificate nella Discovery.

**Principi di design:**

1. **Una dashboard = un pubblico = un set di decisioni**
   Non costruire dashboard omnibus che "fanno tutto". Costruisci dashboard per ruolo: una per il CEO, una per il commerciale, una per l'operations manager.

2. **Gerarchia visiva chiara**
   - KPI numerici in alto (i 4-6 numeri che contano)
   - Trend temporali al centro (come stanno andando nel tempo)
   - Breakdown/analisi di dettaglio in basso (perché stanno andando così)

3. **Azione come metro di giudizio**
   Ogni metrica in dashboard deve rispondere a: "Se questo numero va nella direzione sbagliata, cosa faccio?" Se non c'è un'azione conseguente, quella metrica non appartiene alla dashboard operativa.

4. **Mobile-ready**
   Il titolare spesso guarda i numeri da telefono. Testare ogni dashboard su mobile.

**Template dashboard CEO (universale):**

```
Riga 1 — KPI Overview (4 card numeriche)
  [Fatturato MTD vs. target] [Margine % MTD] [Nuovi clienti MTD] [NPS/CSAT]

Riga 2 — Trend 12 mesi
  [Fatturato mensile — linea con target] [Mix canali — area chart]

Riga 3 — Analisi
  [Top 10 clienti per fatturato] [Top 10 prodotti per margine] [Pipeline commerciale]

Riga 4 — Alert
  [Clienti senza acquisto da 60+ giorni] [Prodotti sotto soglia stock] [Scostamenti budget >10%]
```

---

### Fase 5 — Training & Adoption (1-3 giorni)

**Obiettivo:** il cliente usa autonomamente le dashboard e può fare modifiche semplici senza chiamare il consulente.

**Struttura del training:**

**Sessione 1 (2h) — Come leggere i dati**
- Come navigare le dashboard
- Come filtrare e fare drill-down
- Come interpretare i KPI (non solo leggerli: capire cosa indicano)
- Le domande giuste da farsi quando una metrica è anomala

**Sessione 2 (2h) — Come gestire i dati**
- Come aggiornare manualmente dati da Google Sheets (se usato come sorgente)
- Come verificare che la pipeline stia girando
- Come segnalare anomalie al consulente
- Cosa fare se una dashboard mostra dati incongruenti

**Sessione 3 (1h) — Come chiedere nuove analisi**
- Come formulare una richiesta di nuova metrica/dashboard
- Cosa è fattibile in autonomia vs. cosa richiede intervento consulenziale
- Processo di gestione delle modifiche

**Documentazione consegnata:**
- Glossario dei KPI (definizione di ogni metrica: cosa misura, come si calcola, fonte dei dati)
- Runbook operativo (cosa fare se X non funziona)
- Contatti e modalità di supporto

---

### Fase 6 — Iterazione (ongoing)

**Obiettivo:** evolvere le dashboard in risposta alle necessità del business, correggere problemi di qualità dati, aggiungere nuove sorgenti.

**Ritmo consigliato:**
- Review mensile (60 min): funzionano le dashboard? Ci sono metriche che non vengono usate? Ce ne mancano?
- Review trimestrale (2h): i KPI scelti sono ancora rilevanti? Il business è cambiato?
- Nuove sorgenti: valutare on-demand

**Indicatori di successo del progetto:**
- Frequenza di accesso alle dashboard (almeno 3 volte a settimana per i key user)
- Decisioni documentate basate su dati (chiedere al cliente di tracking-are almeno 5 decisioni/mese)
- Riduzione del tempo dedicato a report manuali (confrontare ore prima/dopo)

---

## 4. Pattern per Settore

### 4.1 E-Commerce

**Domande di business chiave:**
- Quanto costa acquisire un cliente? (CAC)
- Quanto vale un cliente nel tempo? (LTV)
- Dove si perdono i clienti nel funnel? (Conversion funnel)
- Quali prodotti generano margine? (Non fatturato, margine)
- Quando rischiano di andarsene i clienti fedeli? (Churn prediction)

**KPI fondamentali:**

| KPI | Formula | Frequenza | Alert |
|---|---|---|---|
| CAC | Spesa marketing / N nuovi clienti | Mensile | >50% del valore medio ordine |
| LTV | Fatturato totale cliente / durata relazione | Mensile | LTV < 3x CAC = problema |
| Conversion rate | Ordini / Sessioni | Giornaliero | <1% (B2C tipico 1-3%) |
| AOV (Average Order Value) | Fatturato / N ordini | Settimanale | Calo >10% MoM |
| Churn rate | Clienti persi / Tot clienti inizio periodo | Mensile | >5%/mese = critico |
| ROAS (Return on Ad Spend) | Fatturato da ads / Spesa ads | Settimanale | <2x = non sostenibile |

**Dashboard prioritarie:**
1. **Funnel di acquisto**: sessioni → prodotto visto → aggiunto al carrello → checkout → ordine completato. Ogni step con tasso di conversione e variazione WoW.
2. **Analisi clienti**: segmentazione RFM (Recency, Frequency, Monetary), distribuzione LTV, clienti a rischio churn.
3. **Performance prodotti**: fatturato, margine, rotazione, resi, rating medio per categoria/SKU.
4. **Marketing mix**: CAC per canale, ROAS per campagna, attribuzione ordini per touchpoint.

**Pipeline dati tipica:**
```
Shopify/WooCommerce → ETL (API REST) → PostgreSQL → Metabase
Google Analytics 4 → BigQuery → Looker Studio
Google Ads / Meta Ads → SuperMetrics / Fivetran → stesso data warehouse
```

---

### 4.2 Servizi Professionali (Consulenza, Agenzia, Studio)

**Domande di business chiave:**
- Stiamo usando le ore disponibili in modo profittevole? (Utilization rate)
- Quali clienti/progetti generano margine? (Non solo fatturato)
- Quante ore vendiamo vs. ore a disposizione? (Capacity planning)
- Come sta andando la pipeline commerciale? (Sales forecast)

**KPI fondamentali:**

| KPI | Formula | Frequenza | Benchmark |
|---|---|---|---|
| Billable utilization | Ore fatturate / Ore disponibili | Settimanale | Target 70-80% |
| Revenue per head | Fatturato / N persone billable | Mensile | Benchmark settoriale |
| Project margin | (Fatturato - Costo ore - Costi diretti) / Fatturato | Per progetto | >30% obiettivo |
| Project budget variance | (Budget - Consuntivo) / Budget | Per progetto | Alert se >10% negativo |
| Days Sales Outstanding (DSO) | Crediti / (Fatturato annuo / 365) | Mensile | Target <45 giorni |
| Client concentration | Fatturato top 3 clienti / Fatturato totale | Mensile | Alert se >50% |

**Dashboard prioritarie:**
1. **Utilization tracker**: ore per persona per settimana, billable vs. non-billable, forecast capacità prossime 4 settimane.
2. **Profittabilità progetti**: budget vs. consuntivo, margine per progetto, ore bruciate per fase.
3. **Pipeline commerciale**: opportunità per stage, valore atteso, forecast mensile/trimestrale.
4. **Cash flow**: fatturato vs. incassato, DSO trend, scadenze da incassare.

**Fonte dati tipica:**
```
Timesheet: Harvest, Toggl, Clockify, Asana, Jira → API
CRM: HubSpot, Pipedrive, Salesforce → API o export CSV
Fatturazione: Fatture In Cloud, Zucchetti, SAP → export CSV o API
```

---

### 4.3 Retail (Fisico e Omnichannel)

**Domande di business chiave:**
- Quali categorie di prodotto ruotano bene? Quali no?
- Come cambia il mix di vendita tra stagioni/periodi?
- Quanto stock fermo ho e quanto mi costa?
- Come si comportano i clienti fedeli vs. occasionali?

**KPI fondamentali:**

| KPI | Formula | Frequenza | Alert |
|---|---|---|---|
| Sell-through rate | Unità vendute / Unità acquistate | Mensile | <60% = problema di acquisto |
| Inventory turnover | COGS / Inventario medio | Mensile | <4x annuo = stock in eccesso |
| Giorni di copertura | Inventario / Vendite giornaliere medie | Settimanale | >60 giorni = attenzione |
| Gross Margin % | (Fatturato - COGS) / Fatturato | Mensile | <30% per retail = critico |
| Revenue per sqm | Fatturato / Superficie vendita | Mensile | Benchmark settoriale |
| Ticket medio | Fatturato / N transazioni | Giornaliero | Variazioni >15% MoM |

**Dashboard prioritarie:**
1. **Inventario in tempo reale**: stock per categoria/SKU, giorni di copertura, alert su stock out e overstock.
2. **Stagionalità**: confronto settimane/mesi vs. anni precedenti, forecast per riordino.
3. **Performance punti vendita**: confronto negozi su fatturato/sqm, conversion rate, ticket medio.
4. **Clienti fedeli**: acquisti per segmento (tessera fedeltà), frequenza, valore LTV.

---

## 5. Governance dei Dati

La governance non è burocrazia. È la differenza tra dati su cui puoi fare affidamento e dati che ti fanno prendere decisioni sbagliate.

### 5.1 Naming Conventions

**Regola fondamentale:** un nome deve essere comprensibile senza contesto. Mai abbreviazioni ambigue.

**Per tabelle e viste:**
```
Prefissi:
  dim_     → dimensioni (dim_customer, dim_product, dim_date)
  fct_     → fatti (fct_orders, fct_sessions, fct_inventory)
  stg_     → staging/raw (stg_shopify_orders, stg_crm_contacts)
  agg_     → aggregati precalcolati (agg_daily_revenue)

Esempi:
  dim_customer          → anagrafiche clienti normalizzate
  fct_orders            → transazioni di vendita
  stg_shopify_orders    → dati raw da Shopify prima della trasformazione
  agg_daily_revenue     → fatturato aggregato per giorno (precalcolato per performance)
```

**Per le metriche nelle dashboard:**
```
Naming pattern: [oggetto]_[metrica]_[periodo opzionale]
  revenue_mtd           → fatturato mese corrente
  customer_count_new    → numero clienti nuovi
  order_avg_value       → valore medio ordine
  margin_gross_pct      → margine lordo percentuale
```

### 5.2 Data Ownership

Ogni dataset deve avere un owner identificato. L'owner non è necessariamente chi ha creato i dati — è chi ne risponde.

**Responsabilità dell'owner:**
- Garantire che i dati vengano aggiornati con la frequenza definita
- Segnalare anomalie quando le nota
- Approvare le definizioni delle metriche derivate da quei dati
- Essere il punto di contatto per domande sulla qualità

**Template Data Ownership Registry:**

```markdown
| Dataset | Owner | Frequenza aggiornamento | SLA qualità | Ultimo check |
|---|---|---|---|---|
| Ordini | Mario Rossi (responsabile vendite) | Giornaliero (automatico) | 99% completezza | 2026-06-08 |
| Anagrafiche clienti | Giulia Bianchi (CRM admin) | Real-time (sync CRM) | 0 duplicati chiave | 2026-06-01 |
| Costi prodotto | Paolo Verdi (acquisti) | Mensile (manuale) | Aggiornato entro 5gg | 2026-05-31 |
```

### 5.3 Data Freshness

La freshness è la garanzia che i dati siano aggiornati quando servono. Un dashboard con dati di 2 settimane fa non è analytics — è storia.

**Standard freshness per tipo di metrica:**

| Tipo metrica | Frequenza minima | Frequenza ideale |
|---|---|---|
| KPI operativi (fatturato giornaliero, ordini) | Giornaliera | Ogni 4 ore |
| KPI strategici (LTV, churn, CAC) | Settimanale | Giornaliera |
| Report di management | Mensile | Settimanale |
| Dati di inventario (retail) | Giornaliera | Real-time |
| Pipeline commerciale | Giornaliera | Real-time (se CRM lo supporta) |

**Monitoraggio freshness:**
- Ogni dashboard deve mostrare "Dati aggiornati al: [timestamp]"
- Alert automatico se i dati non si aggiornano da più di N ore (N = 2x frequenza attesa)
- Dashboard separata per il team tecnico con stato di tutti i job ETL

### 5.4 Data Quality Framework

**Le 5 dimensioni della qualità:**

1. **Completezza**: quanti valori mancanti ci sono nei campi critici?
   - Alert se >1% null su campi chiave (order_id, customer_id, amount)

2. **Accuratezza**: i valori corrispondono alla realtà?
   - Spot check mensile: campione casuale di 20 record confrontati con la fonte originale

3. **Consistenza**: gli stessi dati in fonti diverse sono allineati?
   - Riconciliazione mensile: fatturato da ERP vs. fatturato da e-commerce vs. estratto banca

4. **Tempestività**: i dati sono disponibili quando servono?
   - SLA aggiornamento definito per ogni pipeline

5. **Unicità**: ci sono duplicati?
   - Test automatico: COUNT(*) vs. COUNT(DISTINCT primary_key) su ogni tabella critica

---

## 6. KPI Framework

### Principio fondamentale

Un KPI è utile solo se porta a un'azione. "Il fatturato è aumentato del 5%" è un'informazione. "Il fatturato è aumentato del 5% ma il margine è sceso del 3% perché la categoria X ha cannibalizzo la Y" porta a una decisione.

**Domande da fare per ogni KPI proposto:**

1. Chi la usa? (Ruolo specifico)
2. Con quale frequenza? (Giornaliero, settimanale, mensile)
3. Cosa fa se il numero va su? E se va giù?
4. Come si calcola esattamente? (Formula non ambigua)
5. Qual è il target? E la soglia di allerta?

### 6.1 KPI per Funzione

**CEO / Imprenditore**
```
Livello 1 — Salute aziendale (guardare ogni giorno)
  Fatturato giornaliero vs. target
  Cash in banca
  N nuovi clienti / lead MTD

Livello 2 — Performance (guardare ogni settimana)
  Margine % per area di business
  N transazioni / ticket medio
  Pipeline commerciale (valore totale, weighted)

Livello 3 — Strategia (guardare ogni mese)
  LTV / CAC ratio
  Churn rate
  Employee satisfaction (se misurata)
  Net Promoter Score
```

**Responsabile Commerciale / Sales**
```
Livello operativo (ogni giorno)
  N lead nuovi per canale
  N opportunità per stage
  N chiamate / incontri / demo
  N offerte inviate

Livello performance (ogni settimana)
  Conversion rate per stage (lead → qualificato → offerta → chiuso)
  Valore pipeline per agente
  Forecast mese corrente vs. obiettivo
  Tempo medio di chiusura deal

Livello strategico (ogni mese)
  Win rate per segmento clienti
  CAC per canale di acquisizione
  Revenue per agente commerciale
  Analisi deal persi (motivi)
```

**Marketing**
```
Livello operativo (ogni giorno)
  Spesa ads per canale
  Impression / Reach
  Click e CTR

Livello performance (ogni settimana)
  Cost per lead per canale
  Lead quality score (% che diventano opportunità)
  ROAS per campagna
  Traffico organico vs. paid

Livello strategico (ogni mese)
  CAC per canale
  Attribution analysis (quale touchpoint contribuisce di più)
  Content performance (quali contenuti generano lead)
  SEO rank per keyword prioritarie
```

**Operations / Produzione**
```
Livello operativo (ogni giorno)
  Ordini in lavorazione / backlog
  Tempi di evasione effettivi vs. SLA
  N resi / reclami

Livello performance (ogni settimana)
  OEE (Overall Equipment Effectiveness) per manifattura
  Utilization rate del team (per servizi)
  Costi operativi fissi vs. variabili
  Stock critico / rotture

Livello strategico (ogni mese)
  Costo per unità prodotta / erogata
  Efficienza per processo
  Fornitori: lead time medio, puntualità, qualità
```

**Finance / CFO**
```
Livello operativo (ogni giorno)
  Cash position
  Fatture scadute / da incassare

Livello performance (ogni settimana)
  Fatturato vs. budget
  DSO (Days Sales Outstanding)
  DPO (Days Payable Outstanding)
  Burn rate (startup) o working capital (PMI consolidata)

Livello strategico (ogni mese)
  P&L per area di business
  EBITDA margin
  Free Cash Flow
  Debt / Equity ratio
  Forecast a 3/6 mesi
```

### 6.2 Come Definire un Target Corretto

Un target senza contesto è inutile. Il target giusto viene da:

1. **Baseline storica**: qual è la media degli ultimi 6-12 mesi?
2. **Benchmark settoriale**: come si posiziona il settore? (Fonti: associazioni di categoria, report specifici)
3. **Capacità interna**: cosa è realisticamente raggiungibile con le risorse attuali?
4. **Ambizione**: quanto vuole crescere il management?

**Formula target SMART per KPI:**
```
Target = [Baseline] × [1 + % crescita attesa]
Range accettabile = [Target ± 10%]
Alert threshold = [Target - 20%]
Exceptional = [Target + 20%]
```

---

## 7. Pricing

### Struttura tariffaria

Il pricing segue tre livelli corrispondenti alle fasi di engagement del cliente. Ogni livello ha un deliverable chiaro, un risultato atteso, e apre naturalmente al livello successivo.

### Livello 1 — Data Assessment

**Cosa include:**
- Audit completo delle sorgenti dati esistenti (2-3 giorni)
- Data Readiness Score (1-5) con analisi per dimensione
- Report con problemi identificati, priorità di intervento, roadmap consigliata
- Sessione di presentazione risultati (2 ore con decision maker)
- Proposta tecnica per eventuale progetto dashboard

**Pricing:** 1.000 — 2.500€ (una tantum)

**Variabili che spostano il prezzo:**
- 1.000€: azienda piccola (<15p), 1-2 sorgenti dati, dati già in buono stato
- 1.500€: azienda media (15-50p), 3-5 sorgenti, qualità dati variabile
- 2.500€: azienda medio-grande (50-100p), 5+ sorgenti eterogenee, problemi di qualità significativi

**Posizionamento commerciale:** l'assessment è un "rischio basso, valore alto" per il cliente. Costa poco, produce un documento di valore indipendente dall'esito del progetto successivo. Aumenta il tasso di conversione al progetto perché il cliente capisce cosa sta comprando.

---

### Livello 2 — Progetto Dashboard

**Cosa include:**
- Data model design e documentazione
- Setup infrastruttura (VPS + Metabase o configurazione Looker Studio/Power BI)
- Pipeline ETL (fino a 3 sorgenti dati)
- 3-5 dashboard su misura per il settore e per i ruoli chiave
- Glossario KPI
- Training (2-3 sessioni da 2 ore)
- 30 giorni di supporto post-lancio

**Pricing:** 3.000 — 12.000€ (una tantum)

**Variabili che spostano il prezzo:**
- 3.000€: stack Looker Studio, 1-2 sorgenti native Google, 2-3 dashboard semplici, cliente già data-literate
- 5.000€: Metabase self-hosted, 2-3 sorgenti con ETL medio, 3-5 dashboard
- 8.000€: stack più complesso, 4-5 sorgenti eterogenee, ETL custom, training esteso
- 12.000€: progetto enterprise con Superset, 5+ sorgenti, data model complesso, formazione multi-team

**Note pricing:**
- Includere sempre almeno 1 mese di supporto post-lancio
- Se il cliente sceglie Metabase self-hosted: configurare il VPS è nel prezzo, la manutenzione ongoing va nel Livello 3
- Mai fare progetto sotto i 3.000€: sotto quella soglia non si copre l'effort reale

---

### Livello 3 — Data Governance Mensile

**Cosa include:**
- Monitoraggio pipeline ETL (alert, intervento su failure)
- Aggiornamento e manutenzione dashboard (fino a 4 ore di modifiche al mese)
- Review mensile KPI (60 min con il cliente)
- Aggiunta di nuove metriche leggere (modifiche semplici)
- Supporto via chat/email su domande di interpretazione dati
- Report mensile qualità dati

**Pricing:** 1.500 — 3.500€/mese (retainer)

**Variabili:**
- 1.500€/mese: stack semplice (Looker Studio), pipeline stabili, cliente autonomo, 2-3 dashboard
- 2.500€/mese: Metabase self-hosted con manutenzione server inclusa, 4-6 dashboard, review bisettimanale
- 3.500€/mese: stack complesso, 6+ dashboard, nuove analisi ricorrenti, team di 3-5 utenti da supportare

**Obiettivo del retainer:** non essere il consulente che viene chiamato quando qualcosa si rompe. Essere il riferimento stabile che trasforma progressivamente l'azienda da "gestita a intuito" a "gestita a dati".

---

### Pacchetti Combinati

**Starter Pack** (Assessment + Dashboard base): 3.500€
- Assessment dati (1.000€)
- Progetto dashboard semplice (2.500€)
- Adatto per: PMI piccola (<20p) che vuole partire con il minimo rischio

**Growth Pack** (Assessment + Dashboard + 3 mesi governance): 9.000€
- Assessment dati (1.500€)
- Progetto dashboard medium (4.500€)
- 3 mesi governance (3.000€)
- Adatto per: PMI media (20-60p) che vuole un'adozione guidata

**Full Pack** (Assessment + Dashboard + 6 mesi governance): 18.000€
- Assessment dati (2.000€)
- Progetto dashboard completo (7.000€)
- 6 mesi governance (9.000€)
- Adatto per: PMI strutturata (60-100p) con complessità significativa

---

## 8. Upsell Naturale verso AI Adoption

Il track Data & Analytics è il prerequisito naturale per il track AI Adoption. Non è una vendita forzata: è la sequenza logica corretta.

### Il percorso

```
DATI PULITI + MODELLO DATI SOLIDO
         ↓
   Analisi predittiva (forecasting, churn, demand planning)
         ↓
   Automazione con AI (raccomandazioni automatiche, alert intelligenti)
         ↓
   AI Adoption completa (LLM su dati aziendali, agenti)
```

### Come presentare l'upsell

Non proporre AI "a vendita". Proporre AI "quando i dati sono pronti".

**Script di transizione naturale (da usare nella review a 3 mesi):**

> "Abbiamo costruito una base solida: i dati sono puliti, affidabili, aggiornati ogni giorno. Questo ci mette in una posizione privilegiata. Con la stessa base dati, potremmo ora fare cose che prima erano impossibili: prevedere quali clienti stanno per andarsene prima che succeda, ottimizzare automaticamente i prezzi, fare demand planning con modelli statistici. È il passo naturale successivo. Quando vuole parlarne?"

**Condizioni per proporre l'upsell AI:**
- I dati sono stati puliti e sono affidabili (data quality score >70%)
- Il cliente usa le dashboard con regolarità (>3 accessi/settimana)
- Il cliente ha dimostrato di saper leggere e interpretare i dati
- C'è almeno 1 processo in azienda che beneficerebbe di previsioni automatiche

**Servizi AI che si sbloccano con una buona base dati:**
1. **Churn prediction**: modello ML che identifica clienti a rischio 30-60 giorni prima
2. **Demand forecasting**: previsione vendite/ordini per ottimizzare acquisti e produzione
3. **Anomaly detection**: alert automatici su pattern inusuali nei dati operativi
4. **LLM su dati interni**: chatbot che risponde a domande sui dati aziendali in linguaggio naturale
5. **Pricing optimization**: suggerimenti automatici di prezzo basati su elasticità domanda

---

## 9. Errori Comuni da Evitare

### Errore 1 — Vanity Metrics

**Il problema:** il cliente vuole misurare cose che sembrano importanti ma non guidano decisioni.

**Esempi:**
- "Voglio vedere il numero di follower Instagram nella dashboard CEO"
- "Metti il numero di righe vendute (senza valore economico)"
- "Voglio il traffico totale al sito (senza conversion)"

**Come gestirlo:** non rifiutare la richiesta, ma ampliare la prospettiva.
> "Possiamo mettere i follower, ma aggiungiamo anche il costo per follower acquisito e il tasso di conversione da follower a lead — così vediamo se quel numero ti sta davvero aiutando o no."

### Errore 2 — Dashboard Che Nessuno Guarda

**Il problema:** le dashboard vengono costruite, consegnate, e dopo 2 settimane nessuno le apre più.

**Cause tipiche:**
- Dashboard troppo complesse (troppe metriche, layout confuso)
- Dashboard non allineate alle domande reali del cliente
- Mancanza di habit formation: nessuno ha incorporato la dashboard nella routine

**Come prevenirlo:**
- Nella fase di discovery, chiedere: "Hai mai usato una dashboard in passato? Come è andata?"
- Costruire dashboard con massimo 6-8 metriche per view
- Mandare il link della dashboard ogni lunedì per 4 settimane con un commento su un dato rilevante
- Proporre alla review mensile di fare la riunione di management con la dashboard aperta invece dei soliti Excel

### Errore 3 — Dati Non Affidabili Come Base

**Il problema:** si costruisce la dashboard, ma i dati sottostanti sono sporchi. Il risultato: il cliente non si fida dei numeri, smette di usarli, torna agli Excel.

**Come prevenirlo:**
- Non saltare la fase di Data Audit. Mai.
- Includere nella dashboard un "stato qualità dati" visibile (semaforo verde/giallo/rosso)
- Fare la riconciliazione manuale con il cliente su almeno 2-3 metriche chiave prima del lancio: "Secondo la dashboard, il fatturato di maggio è 187.000€. Quanto segnate voi nei vostri sistemi?" Se c'è discrepanza, investigare prima di presentare.

### Errore 4 — Scope Creep Senza Controllo

**Il problema:** il cliente inizia a chiedere metriche, sorgenti dati, dashboard nuove a ogni incontro. Il progetto non finisce mai.

**Come gestirlo:**
- Definire lo scope del progetto in modo scritto prima di iniziare (documento di scope firmato)
- Ogni richiesta fuori scope viene registrata in una "lista desideri" e valutata per il Livello 3 o per un progetto successivo
- Usare la locuzione: "Ottima idea, la aggiungo alla roadmap — nel progetto attuale siamo nei tempi e voglio consegnarti qualcosa di funzionante prima di aggiungere"

### Errore 5 — KPI Definiti Senza Consenso

**Il problema:** il consulente sceglie autonomamente cosa misurare. Il cliente riceve un progetto finito con metriche che non riconosce o non capisce.

**Come prevenirlo:**
- Presentare il draft dei KPI al cliente prima di costruire qualsiasi cosa
- Fare validare ogni definizione: "Revenue MTD = fatturato lordo compreso di IVA, o netto? Include i resi già emessi o no?" Ogni ambiguità va risolta con il cliente, non assunta.
- Documentare le decisioni di definizione nel Glossario KPI: non "fatturato" ma "Fatturato Netto IVA esclusa, al netto dei resi evasi, fonte: tabella `orders` del gestionale".

---

## 10. Checklist Operativa per Progetto

### Pre-progetto
- [ ] Assessment completato con Data Readiness Score
- [ ] Scope documento firmato
- [ ] Accessi read-only alle sorgenti dati concordati e testati
- [ ] Decision maker identificato (chi approva le definizioni)
- [ ] Kick-off meeting con tutti gli stakeholder chiave

### Durante il progetto
- [ ] Data model validato prima di iniziare l'ETL
- [ ] ETL testato su dataset campione prima del deployment
- [ ] Dashboard bozza validata dal cliente prima del polish finale
- [ ] Glossario KPI scritto e validato
- [ ] Riconciliazione dati effettuata su almeno 3 metriche chiave

### Post-lancio
- [ ] Training completato (tutte e 3 le sessioni)
- [ ] Runbook consegnato
- [ ] Monitoraggio pipeline attivo e testato
- [ ] Prima review schedulata (30 giorni dal lancio)
- [ ] Proposta retainer Livello 3 inviata

---

*Versione 1.0 — Elios Scoglio — Giugno 2026*
*Track: Data & Analytics — 108 Vision Consulting*
