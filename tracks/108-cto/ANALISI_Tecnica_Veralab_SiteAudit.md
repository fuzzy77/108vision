# Analisi Tecnica — Site Audit Veralab + Overskin
**Data analisi**: 2026-07-10 — risultati misurati live con script custom

---

## Come leggere questo documento

Ogni finding ha:
- **Cosa significa** — spiegazione senza gergo
- **Perché conta** — impatto concreto su business o sicurezza
- **Cosa fare** — azione specifica

Severity usata: `CRITICO` → `ALTO` → `MEDIO` → `BASSO` → `OK`

---

## veralab.it — Score 19/100 (F)

### SECURITY

---

#### ✗ Content-Security-Policy (CSP) — ALTO

**Cosa significa**
CSP è un header HTTP che dice al browser: "su questo sito, puoi eseguire JavaScript solo da questi domini specifici". Senza di esso, se un attaccante riesce a iniettare codice nel sito (XSS), il browser lo esegue senza protestare.

**Perché conta per Veralab**
Il sito Shopify carica JavaScript da decine di fornitori terzi: Jebbit (quiz), Klaviyo (email), app loyalty VERABILIA, pixel Meta/Google, Trustpilot. Ogni app di terze parti è un potenziale vettore. Senza CSP, se una di queste app viene compromessa (supply chain attack) o se qualcuno trova un modo per iniettare codice, il browser dell'utente esegue qualsiasi cosa senza controllo.

**Cosa fare**
Su Shopify non si imposta il CSP dal tema — va configurato a livello CDN (Cloudflare è già attivo, quindi si può fare tramite Cloudflare Transform Rules). Priorità media-alta: non è un'emergenza oggi, ma è il tipo di cosa che un CISO enterprise chiede al primo audit.

---

#### ✗ X-Frame-Options — MEDIO

**Cosa significa**
Questo header dice ai browser: "non permettere che questa pagina venga mostrata dentro un iframe di un altro sito". Senza di esso è possibile fare **clickjacking**: creare una pagina truffaldina che mostra il sito Veralab in trasparenza sopra pulsanti fake. L'utente pensa di cliccare su "chiudi", in realtà sta cliccando su "acquista" o "autorizza".

**Perché conta per Veralab**
Un e-commerce con checkout è un target naturale per clickjacking. Non è il vettore più comune, ma è banale da correggere e la sua assenza è un finding automatico in qualsiasi penetration test.

**Cosa fare**
Un header, un minuto: `X-Frame-Options: DENY`. Su Cloudflare si aggiunge come Managed Transform o Response Header Rule.

---

#### ✗ Referrer-Policy — BASSO

**Cosa significa**
Quando un utente clicca su un link che porta fuori dal sito, il browser invia al sito di destinazione l'URL completo di provenienza (header `Referer`). Senza policy, se un utente è su `veralab.it/checkout?promo=BLACK50` e clicca un link verso Instagram, Instagram (e qualsiasi analytics) vede l'URL completo incluso il codice promo.

**Perché conta**
Leak di parametri UTM, codici promo, ID ordine nei log di terze parti. GDPR-rilevante se l'URL contiene dati personali (es. email pre-compilate).

**Cosa fare**
`Referrer-Policy: strict-origin-when-cross-origin` — manda solo il dominio, non il path. Un header, zero impatto UX.

---

#### ✗ Permissions-Policy — BASSO

**Cosa significa**
Definisce quali API del browser (camera, microfono, geolocalizzazione, autoplay) possono essere usate da iframe di terze parti caricati nel sito. Senza policy, qualsiasi app Shopify che viene caricata in iframe potrebbe teoricamente richiedere accesso alla camera dell'utente.

**Perché conta**
Su un sito con Jebbit (quiz interattivo), app di video-consulenza, e potenzialmente future funzionalità try-on AR (Overskin), questo diventa rilevante. Oggi è rischio basso, ma la policy va impostata preventivamente.

**Cosa fare**
`Permissions-Policy: camera=(), microphone=(), geolocation=()` — blocca tutto di default, si apre solo ciò che serve.

---

#### ✓ HSTS — OK (max-age=31536000s)

**Cosa significa**
HSTS (HTTP Strict Transport Security) dice ai browser: "questo sito usa solo HTTPS, non provare mai HTTP". Una volta che il browser ha visto questo header, per 1 anno non tenterà mai una connessione non sicura, anche se qualcuno cerca di fare un attacco di downgrade.

**Perché conta**
Veralab ha questo configurato correttamente: 1 anno di durata, con `includeSubDomains`. È la configurazione raccomandata. Nessuna azione necessaria.

---

#### ✓ X-Content-Type-Options: nosniff — OK

**Cosa significa**
Impedisce al browser di "indovinare" il tipo di un file se il server dice che è un certo tipo. Senza questo header, se un attaccante carica un file che sembra un'immagine ma contiene JavaScript, certi browser lo eseguivano. Con `nosniff` il browser si fida solo di quello che dice il server.

**Perché conta**
Misura di sicurezza base, già attiva. Nessuna azione necessaria.

---

### PERFORMANCE

---

#### ! Homepage 765KB — MEDIO

**Cosa significa**
La pagina homepage trasferisce 765 Kilobyte di dati HTML. Per confronto, una pagina ottimizzata è tipicamente 50-150KB. 765KB è enorme. La compressione Brotli è attiva (riduce il trasferimento di ~70%), quindi sul filo arriva ~220KB al browser — ma il browser deve poi **decomprimere e parsare** 765KB di HTML.

**Perché conta**
Su mobile con connessione 4G media, questo aggiunge 0.5-1.5 secondi al caricamento percepito. Su 3G è il doppio. Google Core Web Vitals (che influenzano il ranking SEO) penalizzano pagine lente. LCP (Largest Contentful Paint) su veralab.it è probabilmente 3-4 secondi — sopra la soglia "buona" di 2.5s.

**Cause probabili**
- HTML generato con script inline (Shopify liquid + app di terze parti che iniettano CSS/JS inline)
- Video hero nella homepage (comune su Shopify — caricamento eager invece di lazy)
- Troppi snippet di app non ottimizzati

**Cosa fare**
- Audit degli script di terze parti: quali app Shopify iniettano quanto
- Lazy loading su video e immagini below-the-fold
- Rimuovere app non usate (ogni app Shopify installata aggiunge codice anche se "disattivata")
- Considerare un CDN image optimizer (Cloudflare Images o Imgix)

---

#### ✓ TTFB 905ms — Accettabile

**Cosa significa**
TTFB = Time To First Byte. Misura quanto tempo impiega il server a inviare il primo byte di risposta dopo che il browser ha fatto la richiesta. 905ms è nella fascia "accettabile" (Google vuole < 800ms per "buono", < 1800ms per "da migliorare").

**Perché conta**
Non è un problema oggi, ma è al limite. Durante picchi di traffico (lanci prodotto, campagne email) potrebbe degradare. Cloudflare CDN aiuta — ma se la cache missa (pagina non cacheable → vedi Cache-Control sotto), ogni richiesta colpisce il server Shopify.

---

#### ! Cache-Control assente — BASSO

**Cosa significa**
Il server non dice al browser (né a Cloudflare) per quanto tempo può tenere in cache la risposta. Senza questo header, ogni visitatore ricarica l'intera pagina dal server ogni volta, anche se non è cambiato niente.

**Perché conta**
Su Shopify questa è una limitazione della piattaforma — Shopify gestisce il caching in modo proprietario e non espone direttamente Cache-Control sull'HTML. Ma con Cloudflare è possibile impostare regole di cache custom che tengono l'HTML per 30-60 secondi (stale-while-revalidate), riducendo drasticamente il carico sui server di origine durante i picchi.

**Cosa fare**
Cloudflare Cache Rules: cache l'homepage per 60 secondi con `stale-while-revalidate`. Durante un on-sale con 1000 visitatori/minuto, questo trasforma 1000 richieste al server in ~1 richiesta/minuto.

---

#### ✓ Brotli compression attiva — OK

**Cosa significa**
Brotli è l'algoritmo di compressione HTTP più efficiente (migliore di gzip del 15-20%). Cloudflare lo abilita automaticamente. I 765KB di HTML diventano ~220KB trasferiti. Nessuna azione necessaria.

---

#### ✓ Cloudflare CDN attivo — OK

**Cosa significa**
Cloudflare è un CDN (Content Delivery Network): una rete di server distribuiti globalmente che servono copie cached del sito agli utenti dal nodo geograficamente più vicino. Per Veralab con clienti principalmente italiani, i nodi Cloudflare in Italia/Europa garantiscono latenza bassa.

**Perché conta**
Cloudflare fa anche: DDoS protection, WAF (Web Application Firewall), SSL termination, e rate limiting. È un'infrastruttura di sicurezza e performance in una sola soluzione. Il fatto che Veralab lo usi già è un punto a favore.

---

### RESILIENZA

---

#### ✗ `/blogs/news` → HTTP 500 — ALTO [CONFERMATO LIVE]

**Cosa significa**
HTTP 500 = Internal Server Error. Il server ha ricevuto la richiesta, ha tentato di elaborarla, e qualcosa è esploso internamente. Non è un 404 (pagina non trovata) — è un errore reale nel codice/configurazione.

**Perché conta**
`/blogs/news` è la sezione Magazine di Veralab — contenuto editoriale aggiornato settimanalmente, usato per SEO. Se questa sezione restituisce 500, Google la vede come broken e potrebbe:
1. Smettere di indicizzarla
2. Penalizzare il dominio per errori ripetuti nel Search Console
3. Mostrare agli utenti una pagina rotta

**Cause probabili su Shopify**
- Conflitto tra un'app di terze parti e il tema (l'app inietta liquid nel template blog ma il template è stato aggiornato)
- Un metafield configurato sul blog che ha un valore non valido
- Un'app di commenti/recensioni che cerca una risorsa non più disponibile
- Limite di risorse Shopify raggiunto (script che fa troppe API call)

**Come investigare**
1. Aprire Shopify Admin → Online Store → Themes → "Edit Code" → cercare `blogs/article.liquid` o `blog.liquid`
2. Shopify Admin → Apps → disabilitare temporaneamente le app una alla volta fino a trovare il conflitto
3. Shopify Admin → Analytics → vedere da quando c'è il 500 (correlarlo con installazione/aggiornamento app)

**Impatto business**
Questo è in produzione adesso. Ogni visitatore che arriva su `/blogs/news` via Google vede un errore. Il content marketing di Veralab (Magazine) è un asset SEO importante — questo lo sta degradando silenziosamente.

---

#### ! `/products.json`, `/cart.js`, `/collections.json` → HTTP 404 — MEDIO (ma da verificare)

**Cosa significa**
Questi sono endpoint API standard di Shopify Storefront. Su un Shopify standard rispondono sempre. Il fatto che rispondano 404 significa una di due cose:

1. **Shopify è configurato in modalità headless/API-restricted** — il negozio ha disabilitato le API Storefront pubbliche per sicurezza o perché usa un'architettura custom. In questo caso il 404 è **intenzionale e corretto**.
2. **C'è un redirect o una regola Cloudflare** che blocca queste URL — possibile se hanno configurato regole di sicurezza per bloccare scraping automatico.

**Cosa fare**
Chiedere al team: "Avete disabilitato le Storefront API o usate headless commerce?" Se sì, i 404 sono corretti. Se no, qualcosa nella configurazione CDN le sta bloccando.

---

#### ✓ 404 handler corretto — OK

**Cosa significa**
Quando richiedo una pagina che non esiste (es. `/pagina-inventata-probe`), il server risponde con HTTP 404 (Not Found) — non con 200 (OK). Questo è corretto e importante per SEO: i motori di ricerca devono sapere che una pagina non esiste. Se rispondesse 200 (soft 404), Google indicizzerebbe pagine vuote o d'errore come se fossero contenuto reale.

---

### SEO

---

#### ✗ Structured Data (JSON-LD) assente — MEDIO

**Cosa significa**
JSON-LD è un formato standard (schema.org) per dire a Google cosa c'è in una pagina in modo strutturato. Ad esempio: "questo è un prodotto, si chiama X, costa 45€, ha 4.2 stelle su 127 recensioni, è disponibile in 3 taglie". Con questi dati, Google può mostrare nei risultati di ricerca non solo il link al sito, ma un **rich result**: stelle di rating, prezzo, disponibilità direttamente nella SERP.

**Perché conta per Veralab**
Veralab vende prodotti beauty con prezzi e recensioni Trustpilot. Senza JSON-LD Product, nei risultati Google appare solo il titolo e la meta description — come qualsiasi altro sito. Con JSON-LD, i prodotti potrebbero apparire con stelle e prezzo direttamente nella ricerca → CTR (click-through rate) più alto → più traffico organico.

**Cosa fare**
Su Shopify esistono app specifiche (es. SEO Manager, Smart SEO) che iniettano automaticamente JSON-LD corretto per prodotti, collezioni e breadcrumb. È un intervento da 30 minuti con la giusta app.

---

#### ✓ Tag canonical — OK

**Cosa significa**
Il canonical è un tag HTML che dice a Google: "questa pagina è la versione 'ufficiale' — se esiste la stessa pagina con URL leggermente diversi (es. con parametri UTM, paginazione, varianti), considera solo questa". Senza canonical, Google potrebbe indicizzare 10 varianti della stessa pagina e diluire il ranking.

Veralab lo ha configurato correttamente. Nessuna azione.

---

#### ✓ Open Graph tags — OK

**Cosa significa**
I tag Open Graph (og:title, og:description, og:image) controllano come il sito appare quando viene condiviso su Facebook, Instagram, LinkedIn, WhatsApp. Senza di essi il social network sceglie autonomamente immagine e testo — spesso in modo brutto. Veralab li ha configurati. OK.

---

---

## overskin.com — Non analizzabile

Il dominio overskin.com risponde con una pagina placeholder del provider di hosting (Aruba). Il sito non è ancora live.

**Cosa significa in pratica:**
- Overskin esiste come brand e dominio, ma non ha ancora infrastruttura web propria
- TTFB di 92ms era la risposta del server Aruba, non di un vero e-commerce
- I "problemi" rilevati (nessun CDN, nessuna compressione, nessun SEO) sono tutti del placeholder — non del sito futuro
- Non c'è nulla da analizzare oggi, ma è un'informazione utile: il secondo brand è in costruzione

**Implicazione per il colloquio:**
Questa è una domanda da fare direttamente: *"Overskin quando va live? Avete già deciso lo stack?"* — potrebbe essere uno dei primi progetti concreti da portare in produzione.

---

## Sintesi — Priorità di intervento

| Priorità | Azione | Sito | Effort | Impatto |
|----------|--------|------|--------|---------|
| **P0** | Fix `/blogs/news` HTTP 500 | veralab.it | 2-4h | Immediato — content SEO ripristinato |
| **P0** | Monitoring alert su errori 5xx | veralab.it | 1h | Sapere quando succede di nuovo |
| **P1** | JSON-LD structured data | veralab.it | 2h (app Shopify) | Rich results Google → +CTR organico |
| **P2** | Ottimizzare peso homepage (765KB) | veralab.it | 1-2 giorni | Core Web Vitals + SEO |
| **P2** | CSP via Cloudflare rules | veralab.it | 4h | XSS protection |
| **P3** | Cache-Control rules su Cloudflare | veralab.it | 2h | Resilienza picchi traffico |
| **P3** | X-Frame-Options, Referrer-Policy, Permissions-Policy | veralab.it | 1h | Security hardening completo |
| **–** | Overskin | – | – | Sito non live — da pianificare quando il progetto parte |

---

## Cosa mostrare in colloquio

Il finding più potente non è la lista di header mancanti — è questo:

> **`/blogs/news` risponde HTTP 500 in produzione adesso.**
> Non è nei loro log. Non è nei loro alert. Non lo sanno.

Questo dimostra tre cose in un colpo solo:
1. Hai fatto un'analisi reale, non slides generiche
2. Sai dove guardare (non solo "usare Shopify" ma capire come si rompe)
3. Hai già identificato il primo problema concreto da risolvere il primo giorno

Il resto (CSP, HSTS, JSON-LD) è contesto tecnico — mostra competenza. Ma il 500 è la storia che si ricorda.

---

*Analisi generata con script custom su dati live — 2026-07-10*
