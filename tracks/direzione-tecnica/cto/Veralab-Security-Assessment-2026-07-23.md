# Veralab — Security & Resilience Assessment

**Dominio analizzato:** `veralab.it` e principali sottodomini pubblicamente collegati  
**Data della verifica:** 23 luglio 2026  
**Tipologia:** assessment esterno, non autenticato e non invasivo  
**Classificazione:** documento tecnico preliminare

---

## 1. Executive summary

L'ecosistema pubblico Veralab presenta una buona configurazione TLS sul dominio e-commerce principale, ma sono state rilevate alcune criticità di sicurezza, hardening e resilienza.

Il rischio più rilevante non riguarda direttamente il frontend Shopify Hydrogen, ma il portale **B2B (Business-to-Business)**:

- la pagina di login è raggiungibile e utilizzabile tramite HTTP non cifrato;
- il traffico HTTP non viene forzato verso HTTPS;
- i cookie di sessione non presentano gli attributi di sicurezza `Secure`, `HttpOnly` e `SameSite`;
- il sottodominio non invia HSTS;
- mancano protezioni anti-clickjacking sulla pagina di autenticazione.

Questa combinazione può esporre credenziali e sessioni a intercettazione o manipolazione quando un utente raggiunge il portale attraverso HTTP, una rete non affidabile o un collegamento malevolo.

Sul sito principale risultano inoltre confermati:

- la risposta HTTP 500 della vecchia route `/blogs/news`;
- l'assenza di **CSP (Content Security Policy)**;
- l'assenza di `X-Frame-Options` e della direttiva CSP `frame-ancestors`;
- una gestione non coerente delle pagine inesistenti;
- una configurazione CORS da rivedere sull'API pubblica;
- payload HTML molto grandi e pagine non cacheabili;
- cookie con una durata probabilmente errata.

### Valutazione complessiva

| Area | Valutazione |
| --- | --- |
| E-commerce principale | **Rischio medio** — hardening, routing e resilienza |
| Portale B2B | **Rischio alto** — trasporto credenziali e gestione sessione |
| Checkout Shopify | **Buona configurazione di base** |
| API pubblica | **Rischio medio da approfondire** — configurazione CORS |
| Evidenza di compromissione | **Nessuna evidenza rilevata** |

---

## 2. Ambito e metodologia

La verifica ha incluso esclusivamente risorse pubbliche e richieste non distruttive:

- navigazione delle pagine pubbliche;
- controllo dei redirect HTTP/HTTPS;
- analisi degli header HTTP;
- verifica della gestione di route valide e inesistenti;
- analisi degli attributi dei cookie anonimi;
- verifica CORS tramite richieste `OPTIONS` e origine di test;
- controllo passivo delle tecnologie esposte;
- analisi dimensionale delle risposte HTML;
- verifica TLS del dominio principale;
- controllo di un campione di bundle JavaScript e source map.

Non sono stati eseguiti:

- tentativi di accesso ad account;
- brute force o credential stuffing;
- acquisti o modifiche del carrello;
- exploit di vulnerabilità;
- test di autorizzazione con utenti reali;
- scansioni invasive o test di carico;
- accessi a codice sorgente, configurazioni cloud, database o pipeline.

Questo documento non sostituisce un penetration test completo con autorizzazione formale, account di test e accesso all'architettura interna.

---

## 3. Risultati principali

### SEC-01 — Login B2B disponibile tramite HTTP

**Gravità:** Alta  
**Stato:** Confermato  
**Componente:** `b2b.veralab.it`

#### Evidenza

La navigazione a:

```text
http://b2b.veralab.it/
```

produce un redirect relativo verso:

```text
http://b2b.veralab.it/it/login/
```

La destinazione finale rimane quindi in HTTP e restituisce una pagina di login funzionante.

Il form contiene i campi `email` e `password`, utilizza il metodo `POST` e non specifica una destinazione HTTPS assoluta. In condizioni normali il browser invia quindi i dati alla stessa URL HTTP.

#### Impatto

Un utente che raggiunge il portale attraverso HTTP può trasmettere credenziali senza cifratura. Un attaccante presente sulla rete potrebbe:

- intercettare email e password;
- modificare la pagina o il form di login;
- sottrarre o impostare cookie;
- reindirizzare l'utente verso contenuti malevoli.

Il problema è particolarmente importante perché il dominio non risulta protetto da HSTS preload e il dominio principale non applica `includeSubDomains`.

#### Remediation

1. Configurare sul load balancer o reverse proxy un redirect permanente di tutto il traffico della porta 80:

   ```text
   http://b2b.veralab.it/* → https://b2b.veralab.it/*
   ```

2. Non permettere all'applicazione PHP di generare pagine o cookie su HTTP.
3. Aggiungere HSTS su tutte le risposte HTTPS del B2B.
4. Valutare `includeSubDomains` sul dominio principale solo dopo aver verificato che tutti i sottodomini supportino correttamente HTTPS.
5. Considerare il preload HSTS dopo un inventario completo dei sottodomini.

**Riferimento:** [OWASP — Testing for Credentials Transported over an Encrypted Channel](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/04-Authentication_Testing/01-Testing_for_Credentials_Transported_over_an_Encrypted_Channel)

---

### SEC-02 — Cookie di sessione B2B privi degli attributi di sicurezza

**Gravità:** Alta  
**Stato:** Confermato  
**Componente:** `b2b.veralab.it`

#### Evidenza

Il portale imposta cookie come:

- `PHPSESSID`;
- `last_session_id`.

Nelle risposte analizzate non risultano presenti:

- `Secure`;
- `HttpOnly`;
- `SameSite`.

Il cookie `last_session_id` contiene inoltre informazioni riconducibili all'indirizzo IP e al momento di creazione della sessione, che vengono memorizzate lato client.

#### Impatto

- Senza `Secure`, il browser può inviare i cookie anche tramite HTTP.
- Senza `HttpOnly`, eventuale JavaScript eseguito nella pagina può leggere il cookie.
- Senza `SameSite`, diminuisce la protezione di base contro richieste cross-site e attacchi CSRF.
- La presenza contemporanea della pagina HTTP rende il rischio più concreto.

#### Remediation

Configurare almeno:

```ini
session.cookie_secure = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
session.use_strict_mode = 1
```

Ulteriori interventi:

- rigenerare il session identifier dopo il login;
- usare cookie con prefisso `__Host-` quando tecnicamente possibile;
- evitare di salvare nel cookie IP e timestamp se non realmente necessari;
- verificare logout, scadenza, rotazione e invalidazione server-side.

**Riferimenti:**

- [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP — Testing for Cookies Attributes](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/02-Testing_for_Cookies_Attributes)

---

### SEC-03 — Protezioni anti-clickjacking assenti sul sito principale

**Gravità:** Media  
**Stato:** Confermato  
**Componente:** `veralab.it`

#### Evidenza

Homepage, login, Magazine e pagine di errore non restituiscono:

- `Content-Security-Policy`;
- `X-Frame-Options`;
- direttiva CSP `frame-ancestors`.

Le pagine possono quindi essere caricate all'interno di un iframe ospitato da un sito esterno.

Il checkout e le landing Shopify utilizzano invece:

```text
X-Frame-Options: DENY
Content-Security-Policy: ... frame-ancestors 'none' ...
```

Il problema sembra quindi concentrato nell'applicazione headless personalizzata.

#### Impatto

Un attaccante potrebbe sovrapporre elementi grafici ingannevoli alla pagina Veralab e indurre l'utente a:

- cliccare pulsanti;
- aprire modali;
- interagire con login, carrello o profilo;
- compiere azioni diverse da quelle percepite.

#### Remediation

Applicare almeno:

```http
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
```

Se alcune pagine devono essere incorporate da partner, utilizzare una allowlist esplicita in `frame-ancestors`.

**Riferimento:** [OWASP — Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)

---

### SEC-04 — Content Security Policy assente

**Gravità:** Media  
**Stato:** Confermato  
**Componente:** `veralab.it`

#### Evidenza

Il sito principale non restituisce né:

```text
Content-Security-Policy
```

né:

```text
Content-Security-Policy-Report-Only
```

Nel markup sono però presenti script con attributo `nonce`. Un nonce non produce alcun effetto se il server non invia una CSP che lo utilizza.

#### Impatto

La CSP non elimina le vulnerabilità XSS, ma rappresenta un'importante difesa aggiuntiva. La sua assenza aumenta l'impatto di:

- Cross-Site Scripting;
- compromissione di script di terze parti;
- caricamento di risorse da origini non autorizzate;
- esfiltrazione di dati dal browser.

#### Remediation

1. Avviare una fase di osservazione:

   ```http
   Content-Security-Policy-Report-Only: ...
   ```

2. Inventariare script, immagini, font, connessioni API, iframe e servizi terzi.
3. Utilizzare i nonce già generati dal server.
4. Evitare progressivamente `unsafe-inline` e allowlist troppo estese.
5. Passare alla modalità enforcement dopo aver analizzato i report.

Possibile base iniziale da adattare:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<valore-dinamico>';
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

**Riferimento:** [OWASP — Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

---

### SEC-05 — Configurazione CORS permissiva sull'API

**Gravità:** Media da validare  
**Stato:** Configurazione rischiosa confermata; sfruttabilità non dimostrata  
**Componente:** `api2.veralabtech.net`

#### Evidenza

Una richiesta proveniente da un'origine arbitraria di test:

```text
Origin: https://example.invalid
```

riceve:

```text
Access-Control-Allow-Origin: https://example.invalid
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET
```

La risposta preflight contiene anche:

```text
Access-Control-Allow-Headers: undefined
Vary: *
```

Il server riflette quindi l'origine fornita dal client senza una allowlist apparente.

#### Valutazione

La configurazione diventerebbe una vulnerabilità sfruttabile se l'API esponesse endpoint che:

- utilizzano cookie o credenziali browser;
- restituiscono informazioni riservate;
- permettono operazioni sensibili tramite GET;
- non applicano controlli di autorizzazione indipendenti dall'origine.

L'endpoint radice testato non imposta cookie e restituisce solamente un errore `NOT_FOUND`. Non è stato quindi dimostrato accesso a dati o funzionalità protette.

#### Remediation

- autorizzare esclusivamente le origini necessarie;
- non riflettere automaticamente il valore dell'header `Origin`;
- rimuovere `Access-Control-Allow-Credentials` se non necessario;
- utilizzare `Vary: Origin`;
- correggere il valore `Access-Control-Allow-Headers: undefined`;
- verificare tutti gli endpoint autenticati;
- non considerare CORS un sostituto di autenticazione, autorizzazione o protezione CSRF.

**Riferimento:** [OWASP — HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)

---

### REL-01 — Gestione non coerente di route inesistenti

**Gravità:** Media  
**Categoria:** Resilienza, osservabilità e SEO  
**Stato:** Confermato

#### Matrice dei risultati

| URL o tipologia | Risultato |
| --- | --- |
| `/blogs/news` | Redirect allo slash finale e successivo HTTP 500 |
| `/.well-known/security.txt` | HTTP 500 |
| Route casuale sotto `/it-it/` | HTTP 500 |
| Route casuale alla radice | HTTP 404 corretto |
| Collection inesistente | Redirect alla homepage con HTTP 200 |
| `/it-it/magazine/` | HTTP 200 corretto |

#### Impatto

- Generazione di falsi incidenti 5xx.
- Alert fatigue se il monitoraggio non distingue route e tipologia di errore.
- Spreco di capacità applicativa e rendering.
- Possibili errori di indicizzazione.
- Soft 404 per le collection inesistenti.
- Difficoltà nel distinguere errori applicativi reali da risorse non trovate.

#### Remediation

- introdurre una `NotFoundBoundary` o equivalente che restituisca sempre HTTP 404;
- evitare che una risorsa non trovata venga trasformata in eccezione HTTP 500;
- non redirigere genericamente le route sconosciute alla homepage;
- creare redirect solamente per mapping legacy espliciti;
- monitorare il rapporto `5xx / richieste`, segmentato per route, paese e release;
- correlare gli errori tramite `x-request-id`.

---

### REL-02 — Vecchia route `/blogs/news` in errore

**Gravità:** Media  
**Categoria:** Affidabilità e SEO  
**Stato:** Confermato

La vecchia URL:

```text
https://veralab.it/blogs/news
```

non risulta utilizzata:

- dal menu pubblico corrente;
- dalla homepage;
- dai sitemap analizzati.

Il collegamento pubblico del Magazine utilizza:

```text
https://veralab.it/it-it/magazine/
```

La route `/blogs/news` sembra quindi una vecchia route Shopify, un collegamento storico o una URL ancora presente su siti esterni.

#### Remediation

Configurare:

```text
/blogs/news
/blogs/news/
    → HTTP 301
/it-it/magazine/
```

Il redirect deve preservare eventuali parametri di tracking ammessi e non generare catene di redirect.

---

### REL-03 — Payload HTML molto grandi e risposta non cacheabile

**Gravità:** Media/Alta per impatto business  
**Categoria:** Performance, scalabilità e resilienza  
**Stato:** Confermato con misurazione esterna

#### Misurazioni

| Pagina | HTML non compresso | Trasferimento Brotli indicativo |
| --- | ---: | ---: |
| Homepage | circa 775 KB | circa 117 KB |
| Magazine | circa 1,67 MB | circa 282 KB |
| Login | circa 343 KB | circa 46 KB |

Le risposte riportano:

```text
oxygen-full-page-cache: uncacheable
```

Il **TTFB (Time to First Byte)** osservato dal punto di test è variato indicativamente tra 4 e 8 secondi. Il dato non sostituisce un test geografico da Milano né il monitoraggio degli utenti reali, ma è sufficiente per richiedere un approfondimento.

#### Impatto

- peggioramento della conversione;
- maggiore consumo di CPU e capacità server-side;
- aumento del costo di rendering;
- maggior rischio durante picchi, campagne e lanci prodotto;
- tempi più lunghi per crawler e dispositivi mobili;
- ridotta efficacia del CDN.

#### Possibili cause

- dati eccessivi serializzati nella risposta;
- rendering di contenuti non visibili inizialmente;
- 41 collegamenti `hreflang` per pagina;
- cookie creati per ogni visitatore anonimo;
- homepage personalizzata e quindi non cacheabile;
- caricamento anticipato di dati che potrebbero essere richiesti on demand.

#### Remediation

- misurare Core Web Vitals e TTFB tramite Real User Monitoring;
- introdurre caching edge con una strategia `stale-while-revalidate`;
- non creare il cookie carrello finché l'utente non interagisce con il carrello;
- separare contenuto pubblico cacheabile da informazioni personalizzate;
- ridurre i dati serializzati dal server;
- paginare e caricare progressivamente gli articoli del Magazine;
- definire performance budget per HTML, JavaScript, immagini e API;
- eseguire test di picco prima delle principali campagne marketing.

---

### CFG-01 — Durata dei cookie probabilmente errata

**Gravità:** Bassa/Media  
**Stato:** Confermato

Il sito principale imposta:

```text
Max-Age=2592000000
```

su cookie come:

- `country`;
- `language`;
- `cartId`.

Il valore equivale a circa 30.000 giorni, cioè oltre 82 anni.

È probabile una confusione tra secondi e millisecondi:

```text
30 giorni = 2.592.000 secondi
```

e non:

```text
2.592.000.000 secondi
```

I browser moderni possono applicare limiti inferiori, ma la configurazione server resta errata.

#### Remediation

- definire una durata coerente con la finalità di ogni cookie;
- ridurre la durata del carrello;
- documentare la retention;
- verificare la coerenza con cookie policy e consenso;
- eliminare cookie non necessari per utenti anonimi.

Gli altri attributi osservati sul sito principale risultano invece corretti:

```text
HttpOnly; Secure; SameSite=Lax
```

---

### CFG-02 — `security.txt` assente

**Gravità:** Bassa  
**Stato:** Confermato

| URL | Risultato |
| --- | --- |
| `/security.txt` | HTTP 404 |
| `/.well-known/security.txt` | HTTP 500 |

L'assenza del file non crea direttamente una vulnerabilità, ma rende meno efficace la segnalazione responsabile di problemi di sicurezza.

#### Remediation

Pubblicare:

```text
https://veralab.it/.well-known/security.txt
```

con almeno:

```text
Contact: mailto:security@veralab.it
Expires: <data ISO 8601>
Preferred-Languages: it, en
Canonical: https://veralab.it/.well-known/security.txt
Policy: https://veralab.it/security-policy
```

Valutare anche:

- chiave PGP;
- programma di vulnerability disclosure;
- tempi attesi di presa in carico;
- safe harbor per ricercatori che rispettano la policy.

**Riferimento:** [RFC 9116 — A File Format to Aid in Security Vulnerability Disclosure](https://www.rfc-editor.org/rfc/rfc9116.html)

---

### CFG-03 — Esposizione di tecnologie e versioni

**Gravità:** Bassa  
**Stato:** Confermato

Il sito principale espone:

```text
powered-by: Shopify, Oxygen, Hydrogen
server: cloudflare
```

Il portale B2B espone:

```text
server: Apache/2.4.29 (Ubuntu)
```

Apache 2.4.29 è una versione nominalmente molto vecchia. Tuttavia il solo banner non dimostra la presenza di vulnerabilità perché Ubuntu può applicare patch di sicurezza retroportate mantenendo il numero di versione originario.

#### Remediation

- verificare versione reale del sistema operativo e stato del supporto;
- verificare i pacchetti installati e gli aggiornamenti di sicurezza;
- confermare l'eventuale copertura Extended Security Maintenance;
- pianificare upgrade se il sistema non è supportato;
- ridurre il dettaglio del banner:

  ```apache
  ServerTokens Prod
  ServerSignature Off
  ```

---

### CFG-04 — Header di sicurezza secondari mancanti

**Gravità:** Bassa  
**Stato:** Confermato sul sito principale

Non risultano impostati esplicitamente:

- `Referrer-Policy`;
- `Permissions-Policy`;
- `Cross-Origin-Opener-Policy`;
- `Cross-Origin-Resource-Policy`.

Non tutti questi header devono essere applicati indiscriminatamente: l'uso di servizi terzi, iframe, virtual try-on e componenti Shopify richiede una configurazione compatibile.

Possibile baseline:

```http
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Le funzionalità che richiedono fotocamera o altri permessi devono essere autorizzate esclusivamente sulle pagine e origini necessarie.

---

## 4. Controlli con esito positivo

Sono stati rilevati anche diversi elementi correttamente configurati:

### Dominio principale

- Redirect da HTTP a HTTPS funzionante.
- Redirect da `www.veralab.it` a `veralab.it`.
- Header HSTS con durata di un anno:

  ```text
  Strict-Transport-Security: max-age=31536000
  ```

- Cookie principali con:

  ```text
  HttpOnly; Secure; SameSite=Lax
  ```

- `X-Content-Type-Options: nosniff`.
- Metodo HTTP `TRACE` disabilitato con risposta 405.
- Nessuno stack trace evidente nelle pagine 500 analizzate.
- CDN Cloudflare.

### TLS

- Valutazione SSL Labs: **A+**.
- Supporto limitato a TLS 1.2 e TLS 1.3.
- Cipher suite moderne.
- Certificato valido al momento della verifica.

### Frontend e asset

- I source map dei bundle JavaScript campionati restituiscono 404.
- Il parametro di ricerca testato viene codificato correttamente nell'HTML; non è emersa una riflessione XSS immediata.
- Il dominio tecnico Shopify esposto nel frontend richiede autenticazione e restituisce accesso negato.

### Checkout e landing Shopify

- Redirect HTTP verso HTTPS.
- `X-Frame-Options: DENY`.
- CSP con `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff`.
- Pagine marcate `noindex` dove appropriato.

---

## 5. Priorità di intervento

### Entro 24 ore

1. Forzare HTTPS su tutto il portale B2B.
2. Correggere gli attributi dei cookie B2B.
3. Attivare HSTS sul B2B.
4. Verificare che nessun link, email o QR code punti al B2B in HTTP.
5. Correggere il redirect di `/blogs/news`.
6. Valutare immediatamente la configurazione CORS dell'API.

### Entro 7 giorni

1. Correggere le route inesistenti affinché restituiscano 404.
2. Eliminare soft 404 e redirect generici alla homepage.
3. Introdurre `frame-ancestors` e `X-Frame-Options`.
4. Attivare CSP in modalità `Report-Only`.
5. Configurare alerting su error ratio 5xx.
6. Verificare patching e supporto del server B2B.
7. Correggere la durata dei cookie.
8. Pubblicare `security.txt`.

### Entro 30 giorni

1. Portare la CSP in enforcement.
2. Ridurre il payload HTML e i dati serializzati.
3. Introdurre caching edge controllato.
4. Implementare Real User Monitoring.
5. Definire performance budget e Security Definition of Done.
6. Eseguire un penetration test autenticato su:
   - account cliente;
   - loyalty;
   - B2B;
   - checkout e carrello;
   - API;
   - virtual try-on;
   - integrazioni CRM, ERP e marketing.

---

## 6. Monitoraggio e governance raccomandati

### Monitoraggio 5xx

Creare alert basati sul rapporto:

```text
numero risposte 5xx / numero richieste totali
```

con segmentazione per:

- route;
- release;
- paese e lingua;
- dispositivo;
- dipendenza esterna;
- richiesta GraphQL o API;
- codice `x-request-id`.

Evitare alert basati esclusivamente sul numero assoluto di errori.

### Synthetic monitoring

Controllare periodicamente:

- homepage;
- ricerca;
- scheda prodotto;
- login;
- creazione account;
- aggiunta al carrello;
- avvio checkout;
- Magazine;
- store locator;
- API critiche;
- portale B2B.

I controlli devono verificare non solamente HTTP 200, ma anche contenuto atteso, redirect, tempi di risposta e assenza di errori JavaScript.

### Security governance

- inventario di domini, sottodomini e owner;
- Software Bill of Materials;
- vulnerability scanning delle dipendenze;
- patch policy con tempi definiti;
- gestione centralizzata di CSP, CORS e security header;
- threat modeling per loyalty, omnicanalità e integrazione retail;
- incident response ed escalation;
- vulnerability disclosure policy;
- test di sicurezza nelle pipeline di delivery.

---

## 7. Conclusioni

Non sono emerse prove di compromissione o accesso non autorizzato ai dati. Sono però presenti problemi concreti e riproducibili che richiedono intervento.

La priorità assoluta è il portale B2B: una pagina di autenticazione non dovrebbe mai essere utilizzabile tramite HTTP e i relativi cookie di sessione devono essere protetti.

Sul sito principale, l'assenza di CSP e protezione anti-iframe non rappresenta da sola una compromissione, ma riduce significativamente la difesa in profondità. La gestione incoerente di 404 e 500, insieme alle pagine non cacheabili e ai grandi payload HTML, evidenzia inoltre un problema di qualità architetturale e operativa che può avere impatto diretto su:

- conversione;
- affidabilità;
- costi;
- osservabilità;
- capacità di sostenere campagne e picchi;
- qualità SEO.

Il quadro complessivo non suggerisce la necessità di sostituire Shopify. Indica piuttosto la necessità di rafforzare la governance dell'architettura headless, delle integrazioni e dei componenti legacy esterni alla piattaforma Shopify.

---

## 8. Riferimenti

- [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP HTTP Strict Transport Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- [RFC 9116 — security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)

