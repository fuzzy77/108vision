# Competenze tecniche — Tech Lead Veralab

**Finalità:** documento di studio approfondito sulle competenze tecniche richieste dal ruolo.
**Stack di riferimento:** Shopify / Hydrogen, Microsoft Dynamics NAV / Business Central, architettura delle integrazioni, customer data, sicurezza, osservabilità, AI Engineering.
**Nota:** le sezioni marcate `[verificato]` si basano su documentazione ufficiale; quelle `[probabile]` su inferenze dall'esterno che richiedono conferma.

---

## Indice

1. Shopify — architettura e funzionamento
2. Shopify API — REST vs GraphQL, rate limit, webhook
3. Shopify Hydrogen e architettura headless
4. Microsoft Dynamics NAV e Business Central
5. Personalizzazioni NAV: C/AL, AL, Extensions
6. Integrazione Shopify ↔ ERP — pattern affidabili
7. Inventory omnicanale
8. Customer identity e data
9. Loyalty — architettura del ledger
10. Sicurezza dell'ecosistema
11. Osservabilità — da infrastruttura a business
12. Delivery — CI/CD per ecosistemi Shopify
13. Architettura delle integrazioni — opzioni e trade-off
14. Multi-brand — architettura Veralab/Overskin
15. Internazionalizzazione
16. AI Engineering applicato all'e-commerce
17. DORA Metrics e maturità operativa
18. Glossario tecnico essenziale

---

## 1. Shopify — architettura e funzionamento

### Cosa è Shopify tecnicamente

Shopify è una piattaforma SaaS multi-tenant. L'infrastruttura (hosting, database, CDN, checkout, aggiornamenti di sicurezza della piattaforma core) è gestita da Shopify. Il merchant controlla tema, dati, app, configurazione e, in parte, la logica del checkout.

**Implicazione per il Tech Lead:** il perimetro di ownership è diverso da un sistema custom. Non puoi modificare il database, non puoi installare software server-side direttamente, non puoi bypassare le API. Ogni estensione avviene tramite l'ecosistema ufficiale (app, extensions, custom storefronts).

### Shopify vs Shopify Plus

| Capability | Shopify base | Shopify Plus |
|---|---|---|
| Store multipli (organizzazione) | No | Sì (fino a 10 store inclusi) |
| Checkout personalizzabile (UI Extension) | Limitato | Completo (`checkout.liquid` + Extensions) |
| Script Editor (legacy) | No | Sì (in deprecazione → Functions) |
| Shopify Functions | Sì | Sì (limiti più alti) |
| B2B nativo | Limitato | Completo |
| Automation (Shopify Flow) | Sì | Esteso |
| Launchpad (campagne programmate) | No | Sì |
| API rate limits | Standard | Maggiori (2x) |
| Wholesale/B2B canale dedicato | No | Sì |

`[probabile]` Veralab usa Shopify Plus per le capability B2B, multi-store e checkout avanzato. Da verificare: qual è il piano attivo, quanti store esistono, quali funzioni Plus vengono realmente usate.

### Struttura dati fondamentale

**Product → Variant → InventoryItem → InventoryLevel @ Location**

```
Product
  ├── title, description, tags, metafields
  ├── Variant 1 (es. Rossetto Rosso 3.5g)
  │   ├── SKU, barcode, price, compareAtPrice
  │   ├── InventoryItem (tracked: true/false)
  │   │   └── InventoryLevel @ Location A → quantity: 50
  │   │   └── InventoryLevel @ Location B → quantity: 12
  │   └── metafields (shade hex, ingredients, ...)
  └── Variant 2 (es. Rossetto Rosa 3.5g)
```

**Perché questo conta in beauty:** ogni shade è una variante separata. Un mapping errato tra shade → SKU → barcode → immagine produce: prodotto sbagliato consegnato, stock attribuito alla variante sbagliata, errori nel virtual try-on, recensioni aggregate sul prodotto errato.

### Order model

Un ordine Shopify ha:
- `financial_status`: pending → authorized → paid → partially_paid → refunded → voided
- `fulfillment_status`: null → partial → fulfilled → restocked
- `line_items`: ogni prodotto con variante, quantità, prezzo, sconti applicati
- `transactions`: pagamenti, rimborsi, autorizzazioni
- `fulfillments`: spedizioni, tracking

**Attenzione:** un ordine Shopify è il "documento commerciale" lato e-commerce. Nell'ERP corrisponde a documenti diversi: ordine di vendita, nota di consegna, fattura, nota di credito. Il mapping non è 1:1 — deve essere progettato esplicitamente.

### Shopify Functions

Shopify Functions è il sistema attuale per la logica custom sul checkout (sostituisce Script Editor, deprecato). Permettono di estendere:
- discount logic (sconti personalizzati)
- shipping methods (filtri metodi di spedizione)
- payment methods (esclusioni, ordinamento)
- cart and checkout validation
- order routing (Shopify Plus)

Le Functions sono compilate in **WebAssembly** e girano nell'infrastruttura Shopify. Non sono codice server-side arbitrario. Limite: nessun accesso a database esterni durante l'esecuzione sincrona — solo payload dell'evento.

### Metafields e Custom Data

I Metafields permettono di estendere il modello dati Shopify senza app aggiuntive:
- namespace + key + type
- disponibili su: Product, Variant, Customer, Order, Collection, ...
- accessibili via GraphQL Admin e Storefront API
- utili per: attributi tecnici prodotto (INCI, shade hex, SPF), tag loyalty, dati B2B

---

## 2. Shopify API — REST, GraphQL, webhook, rate limit

### REST Admin API — stato attuale

`[verificato]` La REST Admin API è considerata legacy da ottobre 2024. Le nuove applicazioni pubbliche devono usare la GraphQL Admin API. La REST è ancora supportata ma non riceve nuove feature.

**Rischio pratico:** integrazioni esistenti costruite su REST potrebbero usare versioni di API già deprecate o endpoint in via di rimozione. Verificare: quali connector, app custom o middleware usano ancora REST? Qual è la versione API dichiarata nelle richieste?

### GraphQL Admin API

**Schema-first:** tutte le query sono esplicite sul tipo e sui campi richiesti. Non si "legge tutto" come in REST — si specifica esattamente cosa serve.

**Rate limiting basato su costo:** ogni query ha un costo calcolato in base alla complessità. Il bucket si rigenera nel tempo. Query profonde (es: tutti gli ordini con tutte le line items con tutte le varianti) consumano molto. Query piatte costano poco.

**Implicazioni architetturali:**
- non fare bulk fetch in loop — usare `bulkOperations` (eseguite asincronamente, risultato via URL)
- non richiedere campi non necessari
- separare sincronizzazione iniziale (bulk) da aggiornamenti incrementali (webhook)
- monitorare il costo delle query nei log dell'integration layer

### Storefront API

API pubblica, accesso con Storefront Access Token (non con Admin Token). Serve per:
- costruire storefront custom (Hydrogen, app mobile, kiosk)
- ricerca prodotti, catalogo, checkout headless
- accesso a carrello e checkout da frontend

**Non va mai esposta con credenziali Admin.** Token separati con scope limitati.

### Webhook subscription

`[verificato]` Le webhook subscription Shopify possono consegnare eventi a tre destinazioni:
1. **HTTPS endpoint** — server custom
2. **Amazon EventBridge** — event bus AWS, partner integration ufficiale
3. **Google Cloud Pub/Sub** — message broker GCP, partner integration ufficiale

Shopify **non** consegna nativamente a Kafka o RabbitMQ. Servono adapter custom.

**Topic principali rilevanti per Veralab:**

| Topic | Quando scatta |
|---|---|
| `orders/create` | Nuovo ordine confermato |
| `orders/updated` | Ordine modificato (indirizzo, line item, stato) |
| `orders/paid` | Pagamento acquisito |
| `orders/cancelled` | Ordine annullato |
| `orders/fulfilled` | Ordine completamente spedito |
| `orders/partially_fulfilled` | Spedizione parziale |
| `refunds/create` | Rimborso creato |
| `returns/approve` / `returns/decline` | Gestione reso |
| `inventory_levels/update` | Variazione stock su una location |
| `products/create` / `products/update` | Catalogo |
| `customers/create` / `customers/update` | Profilo cliente |
| `checkouts/create` / `checkouts/update` | Carrello abbandonato |

**Webhook delivery guarantees:** Shopify non garantisce exactly-once. Gli eventi possono arrivare duplicati o fuori sequenza. Shopify raccomanda job di riconciliazione periodici tramite API.

### Shopify Events (developer preview)

`[verificato]` Al luglio 2026 è in developer preview, usa API `unstable`. Non usare in produzione. Monitora l'evoluzione — quando diventa stabile, offre trigger più granulari e payload custom rispetto ai webhook tradizionali.

---

## 3. Shopify Hydrogen e architettura headless

### Cosa è Hydrogen

Hydrogen è il framework React ufficiale Shopify per storefront custom. Basato su Remix (ora React Router v7). Usa la Storefront API per tutti i dati.

**Oxygen** è il runtime di hosting gestito da Shopify per Hydrogen (basato su Cloudflare Workers).

`[probabile]` Veralab usa Hydrogen/Oxygen per la presenza e-commerce multilingua/multicountry.

### Perché headless

**Vantaggi:**
- controllo totale su UI/UX senza vincoli del tema Shopify
- performance ottimizzabile (SSR, streaming, edge caching)
- supporto multicountry/multilingua flessibile
- integrazione con sistemi proprietari (Verabilia, quiz, virtual try-on)

**Svantaggi e rischi:**
- più complesso da mantenere rispetto a un tema Liquid standard
- ogni feature checkout o marketing richiede integrazione esplicita
- aggiornamenti Shopify non automatici sul frontend
- necessità di competenze React/Remix nel team

### Architettura Hydrogen

```
Cliente
   ↓
CDN / Cloudflare (edge cache, WAF)
   ↓
Oxygen (Cloudflare Workers runtime)
   ↓
Hydrogen app (React / Remix / React Router v7)
   ├── Shopify Storefront API (prodotti, catalogo, cart, checkout)
   ├── Custom API routes (per logiche proprietarie)
   └── Integrazioni frontend (Klaviyo, Jebbit, VTO, Verabilia widget)
```

### Caching in Hydrogen

Hydrogen ha una cache strategy componibile:
- `CacheShort()` — minuti, per dati frequentemente aggiornati
- `CacheLong()` — ore, per dati stabili
- `CacheNone()` — nessuna cache
- `CacheCustom()` — TTL personalizzato

Un'impostazione errata della cache può produrre: prezzi obsoleti mostrati, stock non aggiornato, contenuto personalizzato non invalidato dopo login.

`[verificato nel security assessment]` Il site header `oxygen-full-page-cache: uncacheable` indica che la caching non era attiva sulle pagine campionate — significa TTL zero o logica che bypassa la cache (es: personalizzazione, cookie letti lato server).

### Rendering strategy

- **SSR (Server-Side Rendering):** rendering lato server a ogni richiesta. Dati freschi, maggiore TTFB, non cacheable in modo statico.
- **RSC (React Server Components):** rendering server-side con streaming. Permette di caricare componenti pesanti lato server e inviare solo l'HTML necessario.
- **SPA (client-side):** navigazione dopo il primo caricamento, senza round-trip server.

Il bilanciamento corretto tra SSR e caching è critico per performance durante i picchi.

---

## 4. Microsoft Dynamics NAV e Business Central

### Storia e versioni

```
Microsoft Dynamics Navision
   ↓
Microsoft Dynamics NAV (2009, 2013, 2015, 2016, 2017, 2018)
   ↓
Microsoft Dynamics 365 Business Central (da 2018)
   ↓
Business Central 2026 release wave 1 (versione 28, luglio 2026)
```

**Il nome "NAV" non esiste più come prodotto attivo.** Ogni installazione con quel nome è legacy.

### Lifecycle

| Versione | Fine mainstream | Fine extended | Stato luglio 2026 |
|---|---|---|---|
| NAV 2016 | Apr 2021 | Apr 2026 | **Fuori supporto** |
| NAV 2017 | Gen 2022 | Gen 2027 | Solo extended support |
| NAV 2018 | Gen 2023 | Gen 2028 | Solo extended support |
| Business Central (qualsiasi versione online) | Aggiornamenti continui | N/A | Sempre supportato |

**Implicazione:** "extended support" significa che Microsoft fornisce patch di sicurezza critiche ma non nuove funzionalità. Niente Cumulative Updates con feature, niente integrazione con nuovi connettori Microsoft, niente evoluzione.

### Business Central online vs on-premises

**Online (SaaS):**
- gestito da Microsoft su Azure
- aggiornamenti obbligatori (2 major wave/anno + minor updates mensili)
- estensioni solo in AL (no codice server-side diretto)
- API REST + OData incluse
- connettore Shopify ufficiale incluso

**On-premises:**
- installato su server del cliente o hosting
- aggiornamenti manuali (rischio di non aggiornarsi)
- più flessibile ma più costoso da mantenere
- può usare ancora C/AL in alcune configurazioni

`[probabile]` Un'azienda come Veralab con NAV storico è probabilmente on-premises, il che implica un partner gestionale che detiene il controllo del server e del codice.

### Architettura Business Central

```
Business Central Service Tier (NST)
   ├── Application Layer (AL extensions)
   ├── Business Logic Layer
   └── Data Layer (SQL Server)

Client Layer:
   ├── Web Client (browser)
   ├── Windows Client (legacy)
   └── Mobile App

Integration Layer:
   ├── OData v4 API
   ├── SOAP Web Services (legacy)
   ├── AL API Pages (REST)
   └── Azure Service Bus (per eventi)
```

### Come espone dati Business Central

**API Pages (REST/OData):** il modo moderno. Si definiscono "API pages" in AL che espongono entità come endpoint REST standard. Il connettore Shopify ufficiale usa questo meccanismo.

**OData v4:** disponibile per tutte le pagine e query. Permette filtri, espansioni, $top/$skip. Usato per integrazioni legacy e query di reporting.

**Web Services SOAP:** modalità legacy, ancora supportata ma non raccomandata per nuove integrazioni.

---

## 5. Personalizzazioni NAV: C/AL, AL, Extensions

### C/AL (il sistema legacy)

NAV fino alla versione 2018 usava **C/AL** (Client/Server Application Language) come linguaggio interno. Le personalizzazioni erano:
- **Codeunit:** logica riusabile (equivalente a service/helper)
- **Table:** definizione tabelle e trigger
- **Page:** definizione UI
- **Report:** stampe e output dati
- **XMLport:** import/export strutturato

Il problema: le modifiche erano fatte **direttamente sugli oggetti standard**. Una personalizzazione su Codeunit 80 (Sales-Post) mescolava logica Microsoft con logica custom. Aggiornare significava risolvere conflitti manualmente.

### AL e Extension model (Business Central)

Business Central usa **AL** con il **Extension model**:
- nessuna modifica agli oggetti standard
- si "estende" con `tableextension`, `pageextension`, `codeunit`
- si subscribono eventi con `EventSubscriber`
- il codice custom è isolato in un'extension con il proprio namespace

**Implicazione per la migrazione:** il codice C/AL non migra automaticamente in AL. Deve essere riscritto, convertito con tool (AL Conversion), o eliminato. Per ogni customizzazione bisogna decidere: serve ancora? è diventata funzionalità standard? va riscritta?

### Classificazione customizzazioni

| Tipo | Cosa fare |
|---|---|
| Obbligo normativo (es: split payment IVA, e-fattura) | Verificare se disponibile come extension di mercato; altrimenti riscrivere in AL |
| Processo differenziante (es: logica listini B2B personalizzata) | Riscrivere in AL dopo revisione del processo |
| Workaround storico (es: campo aggiunto per una esigenza superata) | Eliminare |
| Funzione oggi standard in BC | Sostituire con standard, eliminare custom |
| Report legacy | Valutare sostituzione con Power BI o report AL |
| Accessi diretti al database | **Eliminare obbligatoriamente** — BC online non lo permette |
| Batch job schedulati | Riscrivere come Job Queue in AL |

### Web Services e API NAV

**SOAP Web Services (NAV legacy):**
```
WSDL endpoint: http://<server>:<port>/<tenant>/WS/<company>/Page/<PageName>
```
Usato storicamente per integrazioni Shopify → NAV. Ogni chiamata è sincrona, usa XML.

**OData v4 (BC):**
```
GET https://<server>/ODataV4/Company('<company>')/SalesOrders?$filter=...
```
Più moderno, usabile da qualsiasi client HTTP.

**API Pages (BC):**
```
GET https://api.businesscentral.dynamics.com/v2.0/<tenant>/<env>/api/v2.0/salesOrders
```
Il modo raccomandato. Schema OpenAPI disponibile.

---

## 6. Integrazione Shopify ↔ ERP — pattern affidabili

### Il problema fondamentale

Shopify e NAV/BC sono sistemi separati con concetti diversi. La sincronizzazione deve:
1. non perdere eventi (affidabilità)
2. non creare duplicati (idempotenza)
3. recuperare dagli errori (retry + dead-letter)
4. rimanere coerente (riconciliazione)
5. essere osservabile (logging + alerting)

### Pattern di ricezione webhook affidabile

```
Shopify invia webhook
   ↓
[1] Ricezione → risposta HTTP 200 immediata (< 5 secondi)
   ↓
[2] Verifica autenticità HMAC
   ↓
[3] Lettura X-Shopify-Webhook-Id (deduplication key)
   ↓
[4] Persistenza evento in coda/DB (idempotent write)
   ↓
[5] Worker asincrono processa l'evento
   ↓
[6] Check idempotenza: "questo ordine esiste già in ERP?"
   ↓
[7] Chiamata ERP (con timeout + retry + circuit breaker)
   ↓
[8] Registrazione risultato (successo/fallimento)
   ↓
[9] Se fallisce dopo N retry → dead-letter queue
   ↓
[10] Alert + manual review per dead-letter
```

**Perché rispondere immediatamente e processare in modo asincrono:** se il worker è lento (ERP sotto carico, timeout di rete), Shopify considera il webhook non consegnato e lo riprova. Separare ricezione da elaborazione evita retry fantasma.

### Verifica HMAC

Shopify firma ogni webhook con HMAC-SHA256 usando il secret dell'app. L'header è `X-Shopify-Hmac-Sha256`. Va verificato prima di processare qualsiasi payload.

```
expected = base64(HMAC-SHA256(secret, raw_body))
if request_header != expected → scarta (non è Shopify)
```

### Idempotenza — implementazione concreta

Il concetto: processare lo stesso evento due volte deve produrre lo stesso risultato. Non due ordini nell'ERP, non due movimenti loyalty, non due email.

**Implementazione:**

```
PRIMA di creare ordine ERP:
   SELECT erp_order_id FROM event_log WHERE shopify_order_id = '12345'
   SE esiste → return (già processato)
   SE non esiste → crea ordine ERP + INSERT INTO event_log

ATOMICITÀ: transazione DB o lock ottimistico per evitare race condition
```

La tabella `event_log` è una **idempotency table**: `shopify_event_id` → `erp_reference` → `status` → `timestamp`.

### Gestione degli stati dell'ordine

Un ordine Shopify passa attraverso stati su due assi:

**Financial status:** `pending` → `authorized` → `paid` → `partially_refunded` → `refunded` → `voided`

**Fulfillment status:** `null` → `partial` → `fulfilled` → `restocked`

Non inviare l'ordine all'ERP prima che sia `paid`. Un ordine `authorized` potrebbe non essere mai acquisito (es: frode, timeout). La logica corretta è: `orders/paid` webhook → creazione ordine ERP.

### Riconciliazione periodica

Anche con webhook perfetti, la riconciliazione periodica è obbligatoria. Shopify stesso lo raccomanda.

```
Job giornaliero (es: alle 02:00):
   1. Fetch ordini Shopify delle ultime 24h via API GraphQL
   2. Per ogni ordine: esiste in ERP?
   3. Se manca → crea (evento webhook perso)
   4. Se stato diverso → allinea
   5. Log discrepanze → alert se sopra soglia
```

### Dead-letter queue

Gli eventi che falliscono dopo N retry non vanno persi — vanno in una dead-letter queue (DLQ):
- SQS Dead-Letter Queue (se usi AWS)
- tabella `failed_events` nel DB
- coda separata in RabbitMQ

La DLQ deve avere:
- dashboard visibile (non solo log)
- alert quando cresce sopra soglia
- processo di revisione + replay manuale
- log del motivo del fallimento

---

## 7. Inventory omnicanale

### Il problema: stock fisico vs stock vendibile

Questi sono concetti distinti che non devono essere confusi:

| Concetto | Definizione |
|---|---|
| **Stock fisico** | Quantità effettivamente presente in magazzino (conteggio fisico) |
| **Stock impegnato** | Quantità bloccata da ordini in lavorazione (non ancora spediti) |
| **Stock in transito** | Quantità in trasferimento tra locations |
| **Safety stock** | Buffer minimo che non deve essere venduto (gestione rischio) |
| **Available-to-sell (ATS)** | Fisico - impegnato - safety stock = quello che puoi pubblicare su Shopify |
| **Stock pubblicato su Shopify** | Il numero che il cliente vede — deve essere ATS, non fisico |

**Errore comune:** sincronizzare lo stock fisico dell'ERP direttamente su Shopify, senza sottrarre impegnato e safety stock. Risultato: overselling durante i lanci prodotto.

### Modello inventory Shopify

```
InventoryItem (per variante)
   └── InventoryLevel @ Location
         ├── available (vendibile)
         ├── committed (in ordini non ancora spediti)
         ├── incoming (in arrivo da fornitore)
         └── on_hand (quantità fisica nella location)
```

Le **Locations** in Shopify possono rappresentare:
- magazzini fisici
- negozi diretti (Veralab store)
- servizi di fulfillment (3PL)
- dropship

`[probabile]` Per Veralab le locations includono almeno: magazzino centrale, negozi fisici aperti, forse un 3PL.

### Flusso inventory corretto

```
ERP/WMS (source of truth)
   ↓
Calcolo ATS = on_hand - committed - safety_stock
   ↓
Confronto con valore attuale su Shopify
   ↓
Se differenza > threshold → aggiornamento Shopify InventoryLevel
   ↓
Log aggiornamento + timestamp
```

**Frequenza:** non sincronizzare in real-time puro (ogni modifica ERP → chiamata API Shopify). Usare un ciclo breve (es: ogni 2-5 minuti) con batch update. Real-time vero è necessario solo sui decrementi durante il checkout (quello lo gestisce il lock di Shopify).

### Lock di inventory durante il checkout

Shopify fa un soft reservation durante il checkout: mentre il cliente è nella pagina di pagamento, la quantità è "tenuta" temporaneamente. Il lock scade se il checkout non viene completato. Questo è gestito internamente da Shopify — non va implementato nel codice custom.

### Inventory durante i lanci prodotto (drop)

Il caso più critico per Veralab: lancio di un nuovo prodotto con alta domanda concentrata.

**Pattern da implementare:**
1. Safety stock configurato per assorbire ritardi di sincronizzazione
2. Rate di aggiornamento inventory aumentato nelle ore del lancio
3. Soglia di "sold out" anticipata (es: se ATS < 5, metti 0 su Shopify)
4. Queue ERP configurata con priorità più alta durante il lancio
5. Alert su: ordini Shopify senza conferma ERP entro X minuti
6. Runbook: se ERP non risponde, Shopify può continuare a ricevere ordini?

---

## 8. Customer identity e data

### Il problema della frammentazione

In un ecosistema come Veralab, lo stesso cliente fisico può avere profili in:
- Shopify (customer record)
- POS (profilo negozio)
- Verabilia (profilo loyalty)
- Klaviyo (profilo marketing)
- Jebbit (risposte quiz)
- Customer care tool (ticket history)
- CRM (se esiste un CRM centrale)
- Portale B2B (se rivenditore)

**Identity resolution:** il processo di riconoscere che questi profili appartengono alla stessa persona, usando chiavi di collegamento (email, phone, loyalty ID, Shopify customer ID).

### Architettura identity

```
Identificatori forti (match certo):
   - email (normalizzata lowercase + trim)
   - numero di telefono (E.164 format)

Identificatori deboli (match probabilistico):
   - nome + cognome + indirizzo
   - device fingerprint

Golden record:
   - entità unificata con tutti gli attributi noti
   - storico degli ordini cross-channel
   - punti loyalty aggregati
   - consensi validi
```

La **Golden record** non deve necessariamente essere un nuovo database. Può essere una vista unificata costruita sopra i sistemi esistenti, con regole di merge definite.

### GDPR e dati cliente

Obblighi tecnici non negoziabili per un e-commerce europeo:

**Consensi:**
- cookie di marketing (Klaviyo, analytics, advertising): consenso esplicito
- comunicazioni email/SMS: opt-in documentato con timestamp
- profilazione: separata dal contratto di acquisto
- zero-party data (Jebbit): consenso al momento della raccolta

**Propagazione dei consensi:** il consenso raccolto in Shopify deve arrivare a Klaviyo, CRM, loyalty. Se il cliente fa opt-out via email Klaviyo, va propagato anche a Shopify e loyalty. Un sistema che non propaga i consensi viola GDPR.

**Retention:** i dati non servono per sempre. Ogni entità deve avere una policy di retention (es: dati ordine: 10 anni per obblighi fiscali; dati marketing: 2 anni dall'ultimo acquisto).

**Data subject rights:**
- diritto all'oblio: cancellazione da tutti i sistemi
- portabilità: export dati in formato leggibile
- Shopify ha API per anonimizzare/cancellare customer data (`customers/redact` webhook)

### Klaviyo — ruolo architetturale

Klaviyo è uno strumento di **marketing automation e email/SMS**, non un CRM o un CDP. Usarlo come database centrale è un antipattern:
- profili duplicati (email diversa = profilo diverso)
- costo basato sul numero di profili attivi
- consensi non propagati agli altri sistemi
- dati non strutturati per BI

**Ruolo corretto di Klaviyo:**
- riceve eventi da Shopify (acquisto, abbandono carrello, visualizzazione prodotto)
- riceve segmenti da CRM/CDP
- esegue flow automatizzati (welcome, post-acquisto, win-back)
- misura performance email/SMS

**Non deve essere:** fonte di verità sull'identità cliente, deposito delle preferenze prodotto, sostituto del CRM.

### Jebbit — zero-party data

Jebbit raccoglie risposte dichiarate dal cliente (quiz, sondaggi). Il dato ha alto valore perché è consapevolmente fornito.

**Problemi tecnici comuni:**
- risposta anonima non collegata al profilo Shopify/CRM
- stesso cliente risponde più volte con dati diversi (versioning)
- dati non propagati a CRM e loyalty
- logica di raccomandazione chiusa nel vendor (no ownership)

**Architettura corretta:**
```
Jebbit quiz completato
   ↓
Identifica l'utente (email, Shopify customer ID)
   ↓
Salva risposte come metafields su customer Shopify
   ↓
Propaga al CRM/CDP con timestamp
   ↓
Usa in Klaviyo per segmentazione
```

---

## 9. Loyalty — architettura del ledger

### Il punto tecnico critico: punti = ledger, non campo numerico

Un errore architetturale comune è salvare i punti loyalty come un campo `points_balance INT` direttamente aggiornabile. Questo causa:
- doppio accredito se l'evento viene processato due volte
- mancato storno se il reso non propaga correttamente
- impossibilità di riconciliare ("da dove vengono questi punti?")
- voucher utilizzabili più volte

**La soluzione corretta:** trattare i punti come un **accounting ledger**.

```
Tabella: loyalty_transactions
   - transaction_id (UUID)
   - customer_id
   - amount (positivo = accredito, negativo = addebito)
   - transaction_type (purchase | return | bonus | redemption | expiry)
   - reference_id (es: shopify_order_id)
   - reference_type (shopify_order | pos_receipt | manual_adjustment)
   - created_at
   - status (pending | confirmed | reversed)

Il saldo corrente = SUM(amount) WHERE customer_id = X AND status = 'confirmed'
```

**Idempotenza sul ledger:** prima di accreditare per l'ordine `shopify_order_12345`:
```
SELECT COUNT(*) FROM loyalty_transactions 
WHERE reference_id = 'shopify_order_12345' AND transaction_type = 'purchase'
SE > 0 → non accreditare di nuovo
```

### Casi edge da gestire

| Scenario | Cosa deve succedere |
|---|---|
| Reso totale ordine | Storno completo dei punti accreditati per quell'ordine |
| Reso parziale | Storno proporzionale (o delle sole line item rese) |
| Voucher usato, poi ordine annullato | Riacredito del voucher + invalidazione se non ancora usato altrove |
| Cliente acquista online poi reso in negozio | Il reso POS deve conoscere l'ordine Shopify per stornare i punti |
| Punti scaduti | Batch notturno che aggiunge transazione di tipo `expiry` negativa |
| Acquisto in negozio (Verabilia) | POS deve avere accesso al loyalty engine via API |

### Integrazione loyalty ↔ Shopify

Shopify non ha un sistema loyalty nativo robusto. L'integrazione avviene tipicamente:
- checkout script/extension che mostra saldo punti e permette redemption
- webhook `orders/paid` → accredito punti
- webhook `refunds/create` → storno punti
- API loyalty esposta al POS e al customer service

---

## 10. Sicurezza dell'ecosistema

### Evidenze dell'assessment esterno (da validare internamente)

**Portale B2B su HTTP — criticità alta:**

Il form di login su `b2b.veralab.it` inviava credenziali su HTTP (non HTTPS). I cookie di sessione erano senza attributi `Secure`, `HttpOnly`, `SameSite`.

**Correttamente:**
```http
Set-Cookie: session_id=...; Secure; HttpOnly; SameSite=Strict; Path=/
```
- `Secure`: trasmesso solo su HTTPS
- `HttpOnly`: non accessibile da JavaScript (protegge da XSS)
- `SameSite=Strict`: non inviato in richieste cross-site (protegge da CSRF)

**HSTS:** l'header `Strict-Transport-Security` forza HTTPS anche se l'utente digita http://. Va aggiunto sul dominio B2B.

**Content Security Policy:**

CSP è una policy dichiarata nel response header che dice al browser: "esegui solo script/stili/immagini provenienti da queste origini". Senza CSP, se un attaccante riesce a iniettare uno script nella pagina (XSS), il browser lo esegue.

```http
Content-Security-Policy: default-src 'self'; 
  script-src 'self' cdn.shopify.com klaviyo.com; 
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: cdn.shopify.com;
  connect-src 'self' api.shopify.com;
  frame-ancestors 'none'
```

**Approccio pragmatico:** non partire da una policy restrittiva che rompe tutto. Usare prima `Content-Security-Policy-Report-Only` per monitorare le violazioni senza bloccarle, raccogliere i dati, poi restringere progressivamente.

**CORS permissivo con credenziali — `api2.veralabtech.net`:**

L'header `Access-Control-Allow-Origin: <reflective>` con `Access-Control-Allow-Credentials: true` è un pattern pericoloso.

**Cosa significa:** il server rispecchia l'origine della richiesta invece di dichiarare un'allowlist. Se combinato con `credentials: true`, consente a qualsiasi sito di fare richieste autenticate alla API.

**Corretto:**
```http
Access-Control-Allow-Origin: https://www.veralab.it
Access-Control-Allow-Credentials: true
```
Solo origini esplicite, mai wildcard con credenziali.

### Security checklist per ecosistema SaaS

**Gestione accessi:**
- MFA obbligatorio su Shopify admin, ERP, Cloudflare, repository
- Principio least privilege: ogni app Shopify ha solo gli scope necessari
- Review periodica degli accessi (trimestrale)
- Nessun account personale per accessi di servizio (usare service account)

**Secret management:**
- nessuna chiave API, password o token nel codice sorgente
- usare environment variables + secret manager (AWS Secrets Manager, Shopify app env)
- rotazione periodica dei token Shopify (API access tokens)
- audit: cercare in git history credenziali eventualmente committate

**Dependency security:**
- scan delle dipendenze npm/composer/nuget per CVE note
- Shopify Partner Dashboard mostra app con accessi AI o dati sensibili
- app di terze parti: ogni app installata ha accesso ai dati del merchant per gli scope concessi

**Backup e disaster recovery:**
- Shopify non ha backup nativo esportabile dal merchant (esporta solo CSV prodotti/clienti)
- dati critici (ordini, clienti, loyalty) devono essere replicati in un sistema proprietario
- testare restore almeno una volta all'anno

---

## 11. Osservabilità — da infrastruttura a business

### I quattro Golden Signals

Il framework Google SRE definisce 4 segnali che, monitorati insieme, coprono la maggior parte dei problemi:

| Segnale | Definizione | Esempio Veralab |
|---|---|---|
| **Latency** | Tempo per completare una richiesta | Tempo per creare ordine in ERP dopo webhook |
| **Traffic** | Numero di richieste/eventi per unità di tempo | Webhook Shopify ricevuti/minuto |
| **Errors** | Tasso di richieste/eventi falliti | % webhook che finiscono in dead-letter |
| **Saturation** | Utilizzo delle risorse al loro limite | Queue depth, CPU ERP, connessioni DB |

### Osservabilità business — la differenza che conta

Non è sufficiente monitorare che "il server risponde". Bisogna tradurre i fallimenti tecnici in impatto business.

**Domanda corretta:** "Quanto vale il problema in questo momento?"

```
Metrica tecnica: 15% webhook in dead-letter queue
   ↓
Traduzione business: 
   - Ordini bloccati: 47
   - Valore economico bloccato: €3.840
   - Clienti coinvolti: 47
   - Stock non decrementato: potenziale overselling su 12 varianti
```

**Dashboard da costruire (priorità 1):**

| Metrica | Tipo | Soglia alert |
|---|---|---|
| Ordini Shopify non in ERP dopo 10 min | Business | > 5 ordini |
| Webhook dead-letter queue depth | Tecnica | > 0 (notify) / > 10 (alert) |
| Stock sync lag | Business | > 30 min dall'ultimo aggiornamento |
| Shopify checkout errors | Business | > 1% delle sessioni checkout |
| Loyalty points non assegnati (< 5 min da ordine paid) | Business | > 1% ordini |
| ERP response time (p95) | Tecnica | > 5 secondi |
| Rimborsi non riconciliati | Business | > 24h |

### Logging strutturato

Non loggare stringhe libere. Loggare JSON con campi standardizzati:

```json
{
  "timestamp": "2026-07-24T14:32:00.123Z",
  "level": "ERROR",
  "service": "shopify-erp-integration",
  "event_type": "order_sync",
  "shopify_order_id": "12345",
  "erp_response_code": 500,
  "retry_count": 3,
  "duration_ms": 4823,
  "error": "ERP timeout after 4823ms",
  "trace_id": "abc123"
}
```

**Non loggare mai:**
- email cliente
- numero di carta o CVV
- password o token
- indirizzi completi (ID + country è sufficiente per debugging)

### SLO/SLI/SLA — concetti operativi

- **SLA (Service Level Agreement):** impegno contrattuale verso il cliente. Es: "il sito sarà disponibile al 99.9% del tempo."
- **SLO (Service Level Objective):** obiettivo interno. Es: "la sincronizzazione ordini deve completarsi in < 5 minuti nel 99% dei casi."
- **SLI (Service Level Indicator):** la metrica che misura l'SLO. Es: "percentuale di ordini sincronizzati in < 5 minuti su totale ordini."

**Error budget:** se l'SLO è 99%, ho un budget di 1% di "fallimenti" accettabili. Quando il budget si esaurisce, la priorità passa da feature a stabilità.

---

## 12. Delivery — CI/CD per ecosistemi Shopify

### Stack di sviluppo Shopify

**Shopify CLI:** tool ufficiale per sviluppo locale di temi, app e extensions. Permette:
- `shopify theme dev` — sviluppo tema con hot reload
- `shopify app dev` — sviluppo app con tunnel (ngrok-style)
- `shopify app deploy` — deploy extensions
- `shopify theme push/pull` — sincronizzazione con store

**Ambienti Shopify:**
- **Development store:** sandbox, no pagamenti reali
- **Staging/Test store:** spesso un secondo merchant store con dati di test
- **Production:** lo store reale

**Attenzione:** Shopify non ha un vero sistema di ambienti integrato come un'applicazione custom. Le "Theme editions" permettono versioning dei temi ma non il branching completo. Per Hydrogen, il CI/CD è quello standard del codice.

### Pipeline CI/CD per Hydrogen (headless)

```
git push → GitHub/GitLab
   ↓
CI pipeline:
   ├── lint (ESLint)
   ├── type check (TypeScript)
   ├── unit tests (Vitest)
   └── build (vite build)
   ↓
Preview deployment (Oxygen preview environment)
   ↓
Review + QA
   ↓
Production deployment (Oxygen main)
```

### Deploy di temi Liquid (se applicabile)

```
Feature branch
   ↓
Shopify Theme push to development store
   ↓
Manual QA
   ↓
Merge to main
   ↓
CI: shopify theme push --store production (via CLI token)
```

**Rollback temi:** Shopify mantiene le ultime 3 versioni del tema pubblicate. Rollback rapido tramite admin.

### Feature flags

Per rilasci a rischio medio-alto, usare feature flags invece di deploy tutto-o-niente:
- Shopify Metafields + metaobjects per flag lato storefront
- LaunchDarkly/Flagsmith per flag lato integration layer
- Permette: rilascio graduale (1% → 10% → 100%), A/B test, killswitch rapido

---

## 13. Architettura delle integrazioni — opzioni e trade-off

### Opzione A: Point-to-point

```
Shopify → direttamente → ERP
Shopify → direttamente → Klaviyo
Shopify → direttamente → Loyalty
```

**Pro:** semplice, rapido da implementare inizialmente.
**Contro:** n² problemi — con 5 sistemi hai fino a 20 integrazioni dirette, ognuna con la propria logica di retry, errore, versionamento. Un cambio in Shopify rompe 5 integrazioni.

### Opzione B: Integration middleware / iPaaS

Piattaforme come **Make (ex Integromat)**, **Zapier**, **Celigo**, **Boomi**, **Mulesoft**, **Azure Logic Apps**:
- modello visuale di connessione tra sistemi
- connettori pre-costruiti per Shopify, BC, Klaviyo
- gestione retry e error logging integrata

**Pro:** sviluppo rapido, manutenzione ridotta, nessun codice server-side da gestire.
**Contro:** costo per operazione, logiche di business nascoste nei "flow", difficoltà di test unitario, lock-in sul vendor, limite per logiche complesse.

### Opzione C: AWS EventBridge + SQS

`[verificato]` Shopify supporta nativamente la consegna webhook ad Amazon EventBridge.

```
Shopify
   ↓ (webhook subscription → EventBridge partner event source)
Amazon EventBridge (event bus)
   ├── Rule: orders/* → SQS ordini-erp
   ├── Rule: inventory/* → SQS inventory-sync
   ├── Rule: customers/* → SQS customers-crm
   └── Rule: refunds/* → SQS refunds-loyalty

SQS ordini-erp
   ↓ (worker Lambda o container)
ERP (BC/NAV)
   + Dead Letter Queue per fallimenti
```

**Pro:** managed, scalabile, SQS ha DLQ nativa, costo per evento basso, visibilità tramite CloudWatch.
**Contro:** dipendenza AWS, governance dei topic e degli schemi da costruire, ogni consumer è un servizio separato da mantenere.

### Opzione D: Azure Service Bus

Simile a SQS ma per stack Microsoft. Più naturale se BC è su Azure. Supporta:
- code (queues) per one-to-one
- topic (per publish-subscribe)
- dead-letter queue integrata
- sessions (per ordinamento garantito per chiave)

**Punto di attenzione:** Business Central online ha integrazione nativa con Azure Service Bus per eventi outbound (quando BC crea/modifica entità → emette evento su Service Bus). Se si migra a BC online, questo può essere usato per la direzione ERP → Shopify.

### Opzione E: Kafka

`[verificato]` Shopify non consegna nativamente su Kafka. Serve un adapter.

**Quando Kafka ha senso:**
- volumi molto alti (milioni di eventi/giorno)
- necessità di replay degli eventi (es: ricostruire lo stato del dato in un punto passato)
- molti consumer diversi sullo stesso stream
- data platform già Kafka-based

**Quando Kafka non ha senso (Veralab probabile):**
- volumi tipici di un e-commerce beauty PMI (decine/centinaia di migliaia di eventi/giorno)
- team senza esperienza Kafka operativa
- nessuna esigenza di replay
- costo e complessità operativa non giustificati

### Raccomandazione per Veralab

`[probabile]` Modello ibrido:

| Flusso | Pattern raccomandato |
|---|---|
| Shopify → ERP (ordini, resi) | EventBridge → SQS + Lambda/container, oppure iPaaS per start rapido |
| ERP → Shopify (stock) | Job schedulato (polling ERP con delta) → Shopify API |
| Shopify → Loyalty | Evento ordine/paid → integration layer → loyalty engine API |
| Shopify → Klaviyo | Shopify native integration (gestita da Klaviyo app) |
| Shopify → CRM | Webhook → integration layer → CRM API |
| POS → Loyalty | POS chiama loyalty API direttamente al momento del pagamento |

---

## 14. Multi-brand — architettura Veralab/Overskin

### Domande architetturali aperte

`[ignoto]` Non è noto dall'esterno se Overskin e Veralab condividono lo stesso store Shopify o hanno store separati. Questa è la prima domanda da fare.

### Store condiviso vs store separati

| Aspetto | Store condiviso | Store separati |
|---|---|---|
| Catalogo | Stessa tassonomia e SKU | Cataloghi indipendenti |
| Stock | Condiviso tra brand | Segregato per brand |
| Cliente | Stesso customer record | Profili separati o unificati via CRM |
| Checkout | Stesso checkout | Checkout indipendente |
| Promozioni | Rischio cross-brand indesiderato | Promozioni isolate |
| Analytics | Reporting misto | Reporting separato |
| Costo Shopify | 1 store | 2 store (spesa maggiore) |
| Complessità | Maggiore (metafields per distinguere) | Minore per store, maggiore per sync |

**Pattern comune:** store condiviso con tag/metafields per distinguere i brand, ma con canali di vendita (sales channels) separati. Permette:
- catalogo unico con prodotti taggiati per brand
- prezzi e promozioni separate
- reporting filtrato per brand
- un solo Shopify plan

**Rischio del pattern condiviso:** se in futuro Overskin diventa un brand autonomo (proprio CRM, propria equity, propri partner), separarli da un store condiviso è costoso.

**Principio:** la separazione tecnica deve seguire la separazione strategica. Chiedi: "Tra 3 anni Overskin potrebbe essere venduto separatamente o gestito da un team autonomo?" Se sì, progetta la separazione da subito.

---

## 15. Internazionalizzazione

### Shopify Markets

`[verificato]` Shopify Markets è la soluzione nativa per vendita internazionale. Permette:
- prezzi per mercato (con conversione automatica o prezzi fissi)
- lingue per mercato (tramite Translate & Adapt app o API)
- restrizioni prodotto per mercato
- domini o subpath per mercato (es: veralab.es, veralab.it/en)
- tasse incluse/escluse per mercato
- pagamenti localizzati (Shopify Payments in alcuni paesi)

### Cosa Markets non risolve

Shopify Markets gestisce il **frontend commerce**. Non risolve:
- fulfillment e logistica internazionale
- dazi e dogana (EU → UK, ad esempio)
- contabilità e IVA locale (richiede registrazione IVA nel paese o uso di oss/ioss per UE)
- customer service multilingua
- ritorno dei prodotti (resi internazionali)
- ERP: NAV/BC deve supportare multi-company o chart of accounts per paese

### Spagna — accordo El Corte Inglés

`[verificato]` Veralab ha un accordo con El Corte Inglés per shop-in-shop in Spagna.

**Implicazioni tecniche:**
- B2B: El Corte Inglés è un rivenditore → flusso ordini B2B o EDI
- stock dedicato per canale ES?
- reporting separato per canale?
- ERP: necessità di company o branch spagnola per contabilità locale?
- loyalty: i clienti El Corte Inglés entrano in Verabilia?
- customer care: quale lingua, quale team, quale tool?

---

## 16. AI Engineering applicato all'e-commerce

### Il framework corretto: problema → processo → dato → esperimento → eval → produzione

Non partire dal modello. Partire dal problema e dai dati che lo definiscono.

### Casi d'uso concreti per Veralab, ordinati per rischio

**Basso rischio (nessun dato sensibile, errore non critico):**

1. **Classificazione ticket customer service**
   - Input: testo del ticket
   - Output: categoria (reso, ordine mancante, domanda prodotto, reclamo)
   - Baseline: classificazione manuale attuale (tempo medio, accuratezza)
   - Eval: precision/recall per categoria + test su golden dataset
   - Integrazione: API del tool CS → classifier → tag automatico

2. **Ricerca semantica sulla knowledge base interna**
   - Input: domanda dell'operatore CS ("quanto tempo per un reso?")
   - Output: paragrafo rilevante dalle procedure interne
   - Tecnica: RAG (Retrieval Augmented Generation) su documenti interni
   - Baseline: tempo medio attuale per trovare la risposta
   - Eval: % di risposte corrette su un test set di 50 domande reali

3. **Suggerimento risposta per customer care**
   - Input: ticket + contesto ordine + knowledge base
   - Output: bozza risposta da revisionare dall'operatore
   - Human-in-the-loop: obbligatorio — l'operatore approva prima dell'invio
   - Eval: % di bozze usate senza modifiche, % modificate, % scartate

**Medio rischio (dati cliente, impatto su decisioni):**

4. **Segmentazione predittiva** (es: propensione all'acquisto, rischio churn)
   - Richiede: storico ordini, dati comportamentali, clean customer data
   - Eval: lift vs segmentazione manuale su campagna A/B
   - Governance: spiegabilità (perché questo cliente è "a rischio churn"?)

5. **Previsione domanda per inventory planning**
   - Richiede: storico vendite per SKU, dati seasonality, dati promozioni pianificate
   - Eval: MAE/MAPE su test set storico
   - Human-in-the-loop: planner rivede la previsione prima dell'ordine fornitore

**Alto rischio (mai senza governance):**

6. **Pricing dinamico automatico**
   - Richiede approvazione esplicita per ogni modifica prezzo
   - Rischio: inconsistenza prezzo cross-canale, danno reputazionale

### Architettura RAG (Retrieval Augmented Generation)

Il pattern più utile per use case interni:

```
Query utente
   ↓
Embedding della query (trasformazione in vettore numerico)
   ↓
Vector search su knowledge base (trova i chunk più simili)
   ↓
Costruzione del prompt: [contesto recuperato] + [domanda]
   ↓
LLM genera risposta basata sul contesto
   ↓
Output + source references
```

**Stack tecnico minimo:**
- Embedding model: OpenAI text-embedding-3-small, Cohere embed-v3
- Vector DB: pgvector (se si ha già PostgreSQL), Qdrant, Pinecone
- LLM: Claude Haiku/Sonnet per cost routing (vedi sotto)

### Cost routing — principio fondamentale

Non usare sempre il modello più potente. I modelli LLM hanno costi molto diversi:

| Modello | Costo (input/output) | Uso corretto |
|---|---|---|
| Claude Haiku 4.5 | Molto basso | Classificazione, estrazione, risposta semplice |
| Claude Sonnet 5 | Medio | Sintesi, bozze risposta, RAG standard |
| Claude Opus 4.8 | Alto | Decisioni complesse, analisi approfondite, codice |

**Regola pratica:** il 90% delle task di customer care e operazioni sono gestibili da Haiku o Sonnet. Opus solo per task che richiedono ragionamento multi-step complesso.

### Eval framework — obbligatorio prima della produzione

Senza eval non sai se hai un sistema AI o una slot machine elegante.

**Golden dataset:** 100-200 esempi reali con risposta attesa. Costruito manualmente da esperti del dominio (CS, marketing). Aggiornato quando i pattern cambiano.

**Metriche:**
- **Accuracy/F1** per classificazione
- **RAGAS** (faithfulness, answer relevance, context recall) per RAG
- **Human eval** (1-5 score) per qualità risposte aperte
- **Latency** (p50, p95)
- **Cost per query**

**Threshold per il go/live:** definire soglie minime prima di iniziare il pilota. Es: "non andiamo in produzione se accuracy < 85%."

---

## 17. DORA Metrics e maturità operativa

### Le 4 metriche DORA

Il framework **DevOps Research and Assessment** misura la maturità di delivery di un team:

| Metrica | Definizione | Élite (top performer) | Low performer |
|---|---|---|---|
| **Deployment Frequency** | Quante volte si rilascia in produzione | Più volte al giorno | < 1 volta al mese |
| **Lead Time for Changes** | Dal commit al deploy in produzione | < 1 ora | > 6 mesi |
| **Change Failure Rate** | % di deploy che causano incidenti | < 5% | > 15% |
| **MTTD + MTTR** | Tempo rilevazione + recupero da incidente | < 1 ora | > 1 settimana |

**Come usarle in Veralab:** queste metriche non sono un obiettivo in sé — sono una diagnosi. Se il Lead Time è alto, il problema potrebbe essere: processi di approval lenti, test scarsi, dipendenza da un singolo sviluppatore, deploy manuali. La metrica mostra il sintomo, non la causa.

### Incident management — struttura minima

**Severity levels:**

| Severity | Definizione | Esempio Veralab | Risposta |
|---|---|---|---|
| P1 | Checkout completamente non funzionante | 500 errors al checkout | Immediata, war room |
| P2 | Feature critica degradata | Sync ordini in ritardo > 30 min | < 30 min da rilevazione |
| P3 | Feature non critica impattata | Email post-acquisto non inviate | < 4 ore |
| P4 | Anomalia monitorata, no impatto immediato | Warning nei log, nessun errore visibile | Next business day |

**Post-mortem (blameless):** dopo ogni P1/P2, un documento che risponde a:
- cosa è successo (timeline)
- qual è stata la causa radice (5 whys)
- cosa ha funzionato nell'incident response
- cosa non ha funzionato
- action items con owner e deadline

Il post-mortem **non è per trovare il colpevole**. È per imparare.

---

## 18. Glossario tecnico essenziale

| Termine | Definizione |
|---|---|
| **ATS (Available-to-Sell)** | Stock che può essere pubblicato e venduto = fisico - impegnato - safety stock |
| **C/AL** | Linguaggio di personalizzazione legacy Dynamics NAV |
| **AL** | Linguaggio di estensione Business Central (tipo C#, compilato in VSIX) |
| **Circuit breaker** | Pattern che smette di chiamare un servizio degradato per un periodo, evitando cascading failure |
| **CORS** | Cross-Origin Resource Sharing — meccanismo browser che controlla quali origini possono fare richieste API |
| **CSP** | Content Security Policy — header che limita le origini da cui il browser carica risorse |
| **DLQ (Dead-Letter Queue)** | Coda dove finiscono i messaggi che non riescono a essere processati dopo N retry |
| **DORA** | DevOps Research and Assessment — framework di 4 metriche che misurano la maturità del delivery |
| **Eval** | Processo sistematico di valutazione della qualità output di un sistema AI su un dataset di riferimento |
| **Extension (BC)** | Pacchetto di personalizzazione per Business Central scritto in AL, non modifica il codice base |
| **Golden record** | Profilo unificato del cliente creato aggregando dati da più sistemi |
| **GraphQL** | Query language per API che permette di specificare esattamente i campi richiesti |
| **HSTS** | HTTP Strict Transport Security — header che forza HTTPS per tutti i futuri accessi al dominio |
| **Hydrogen** | Framework React ufficiale Shopify per storefront headless |
| **HMAC** | Hash-based Message Authentication Code — firma crittografica per verificare autenticità webhook |
| **Idempotenza** | Proprietà per cui eseguire la stessa operazione più volte produce lo stesso risultato della prima esecuzione |
| **Identity resolution** | Processo di riconoscere che profili diversi appartengono alla stessa persona |
| **iPaaS** | Integration Platform as a Service — piattaforma gestita per integrare sistemi (es: Make, Boomi, Mulesoft) |
| **Ledger** | Registro contabile di transazioni — sommare le voci dà il saldo corrente |
| **MTTD** | Mean Time to Detect — tempo medio dalla prima anomalia alla rilevazione |
| **MTTR** | Mean Time to Recover — tempo medio dal rilevamento dell'incidente al ripristino |
| **OData** | Protocollo standard per API REST basate su HTTP, usato da Business Central |
| **Oxygen** | Runtime di hosting Shopify per app Hydrogen (Cloudflare Workers) |
| **RAG** | Retrieval Augmented Generation — architettura AI che recupera contesto rilevante prima di generare una risposta |
| **Rate limit** | Limite massimo di richieste API per unità di tempo |
| **Reservation** | Riserva temporanea di stock durante il checkout, prima del pagamento |
| **Shopify Functions** | Sistema per logica custom nel checkout Shopify, compilata in WebAssembly |
| **Shopify Markets** | Feature nativa per vendita internazionale multi-mercato |
| **SLA** | Service Level Agreement — impegno contrattuale di disponibilità verso il cliente |
| **SLI** | Service Level Indicator — la metrica che misura l'SLO |
| **SLO** | Service Level Objective — obiettivo interno di qualità del servizio |
| **SKU** | Stock Keeping Unit — codice univoco che identifica una specifica variante prodotto |
| **Storefront API** | API pubblica Shopify per costruire storefront custom |
| **Variant** | Specifica combinazione di attributi di un prodotto (es: rossetto rosso 3.5g) |
| **Vector DB** | Database ottimizzato per ricerca per similarità semantica (es: Qdrant, pgvector) |
| **Webhook** | Notifica HTTP che un sistema invia a un altro quando accade un evento |
| **Zero-party data** | Dati che il cliente fornisce consapevolmente (quiz, preferenze dichiarate) |

---

*Documento di studio interno — 108 Vision — luglio 2026*
*Da aggiornare dopo l'assessment con i dati architetturali interni di Veralab.*
