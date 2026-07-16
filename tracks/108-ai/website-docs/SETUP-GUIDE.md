# 108 Vision — Manuale Completo Setup Infrastruttura

Questa guida copre tutti i passaggi per rendere operativo il sito 108vision.it con:
- Dominio registrato su Aruba
- Email professionale su Zoho Mail
- Sito deployato su Vercel (con Analytics integrato)
- Funnel lead magnet con Brevo (email marketing automation)
- PDF generation dai manuali markdown

---

## Costi totali annui

| Servizio | Piano | Costo |
|----------|-------|-------|
| Dominio .it | Aruba | ~5 EUR/anno |
| Email | Zoho Mail Free (1 utente, 5GB) | 0 EUR |
| Hosting + Analytics | Vercel Free (Hobby) | 0 EUR |
| Email Marketing | Brevo Free (300 email/giorno) | 0 EUR |
| **TOTALE** | | **~5 EUR/anno** |

> Upgrade consigliato dopo i primi clienti: Zoho Mail Lite (12 EUR/anno, 10GB) + Brevo Starter (19 EUR/mese, 20k email/mese, no logo Brevo).

---

## FASE 1: Registrazione Dominio (Aruba)

### 1.1 Crea account Aruba

1. Vai su https://www.aruba.it/domini.aspx
2. Se non hai un account Aruba: ti verrà chiesto di crearlo durante l'acquisto

### 1.2 Registra il dominio

1. Cerca `108vision.it` nella barra di ricerca
2. Seleziona **solo il dominio** (senza hosting, senza email — usiamo Zoho e Vercel)
   - Il prodotto si chiama "Registrazione dominio" (~5 EUR/anno primo anno)
   - **NON** prendere pacchetti hosting o caselle email Aruba
3. Completa l'acquisto:
   - Dati registrante: codice fiscale o P.IVA (obbligatorio per .it)
   - Paga con carta o PayPal
4. Riceverai email di conferma con le credenziali per il pannello Aruba

> Se `108vision.it` non è disponibile: prova `108-vision.it` o `centottovision.it`

### 1.3 Accedi al pannello DNS Aruba

1. Vai su https://admin.aruba.it → login
2. **Hosting/Domini** → seleziona `108vision.it`
3. Cerca la sezione **Gestione DNS** (o "DNS Avanzato")
4. Qui aggiungerai tutti i record per Vercel, Zoho e Brevo

> Nota: il pannello DNS Aruba ha una UI datata ma funziona. I record si propagano in 15-60 minuti (a volte fino a 24h per i .it).

---

## FASE 2: Email con Zoho Mail

### 2.1 Registrati su Zoho Mail

1. Vai su https://www.zoho.com/mail/zohomail-pricing.html
2. Clicca **Forever Free Plan** (in basso, o vai diretto su https://www.zoho.com/mail/free-plan.html)
3. Scegli **Sign up with your domain**
4. Inserisci `108vision.it` come dominio
5. Crea il tuo account admin: `elios@108vision.it`
6. Scegli una password robusta

### 2.2 Verifica proprietà dominio

Zoho ti chiederà di verificare che possiedi il dominio. Scegli **CNAME method** (il più semplice):

1. Zoho ti darà un valore tipo: `zb1234567.zmverify.zoho.eu`
2. Vai su **Aruba** → Gestione DNS → **Aggiungi record**:
   - Tipo: `CNAME`
   - Host: `zb1234567` (la parte prima di `.zmverify.zoho.eu`)
   - Valore: `zmverify.zoho.eu`
3. Salva e attendi 5-15 minuti per la propagazione
4. Torna su Zoho → clicca **Verify**

### 2.3 Configura record MX (ricezione email)

Dopo la verifica, Zoho ti chiede di aggiungere i record MX. Su Aruba → Gestione DNS:

| Tipo | Host | Valore | Priorità |
|------|------|--------|-----------|
| MX | (vuoto o `@`) | `mx.zoho.eu` | 10 |
| MX | (vuoto o `@`) | `mx2.zoho.eu` | 20 |
| MX | (vuoto o `@`) | `mx3.zoho.eu` | 50 |

> Elimina eventuali record MX preesistenti (Aruba mette di default i suoi) prima di aggiungere questi.

### 2.4 Configura SPF (anti-spam in uscita)

Su Aruba → Gestione DNS → Aggiungi record TXT:

| Tipo | Host | Valore |
|------|------|--------|
| TXT | (vuoto o `@`) | `v=spf1 include:zoho.eu ~all` |

### 2.5 Configura DKIM (firma digitale email)

1. Su Zoho Mail: **Admin Console** → **Email Authentication** → **DKIM**
2. Clicca **Add** per il dominio `108vision.it`
3. Zoho genera un selettore (es. `zmail`) e un valore TXT lungo
4. Su Aruba → Gestione DNS → Aggiungi record TXT:

| Tipo | Host | Valore |
|------|------|--------|
| TXT | `zmail._domainkey` | (il valore lungo che Zoho ti mostra) |

5. Torna su Zoho → clicca **Verify**

### 2.6 Configura DMARC

Su Aruba → Gestione DNS → Aggiungi record TXT:

| Tipo | Host | Valore |
|------|------|--------|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; ruf=mailto:info@108vision.it` |

### 2.7 Crea alias email

In Zoho Mail Admin → **Users** → seleziona il tuo utente → **Email Aliases**:

- `info@108vision.it` ← email pubblica principale (usata sul sito)
- `supporto@108vision.it`

Tutte le email a questi indirizzi arrivano nella tua casella principale.

### 2.8 Test

1. Manda un'email da `elios@108vision.it` a un tuo Gmail
2. Verifica che arrivi (non in spam)
3. Rispondi e verifica che arrivi su Zoho
4. Testa con https://www.mail-tester.com — punta a un punteggio >= 8/10

---

## FASE 3: Deploy Sito su Vercel

### 3.1 Crea account Vercel

1. Vai su https://vercel.com/signup
2. Registrati con **GitHub** (collegamento diretto al tuo account GitHub)
3. Piano **Hobby** (gratuito)

### 3.2 Crea repository GitHub (monorepo Vision)

L'intera cartella `Vision/` diventa un repo Git. Vercel punta solo alla sotto-directory `aia-website/`.

```bash
cd c:/Code/Documents/Lavoro/Personale/Vision

# Inizializza il repo (se non già fatto)
git init
git branch -M main
```

Crea un file `.gitignore` nella root `Vision/`:

```gitignore
# Dependencies
node_modules/

# Build output
aia-website/dist/
aia-website/.vercel/
aia-platform/dist/

# Environment
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp

# TinaCMS local
aia-website/.tina/__generated__/
```

Poi pusha su GitHub:

```bash
git add .
git commit -m "Initial commit: 108 Vision monorepo"

# Crea il repo su GitHub (via CLI o da github.com)
gh repo create 108vision --private --source=. --push
# oppure manualmente:
git remote add origin https://github.com/TUO-USERNAME/108vision.git
git push -u origin main
```

> Usa repo **privato** — contiene playbook, pricing, curriculum e materiale commerciale.

### 3.3 Importa su Vercel (monorepo setup)

1. Su Vercel: **Add New Project** → seleziona il repository `108vision`
2. Vercel rileva il monorepo. Configura:
   - **Root Directory**: `aia-website` ← FONDAMENTALE
   - **Framework Preset**: Astro
   - **Build Command**: `npm run build` (usa quello del package.json: `tinacms build && astro build`)
   - **Output Directory**: lascia default (Astro + Vercel adapter gestiscono tutto)
   - **Install Command**: `npm install`
3. Clicca **Deploy**

> **Root Directory = `aia-website`** dice a Vercel: "il mio progetto web sta qui". Il resto del monorepo (tracks/, brand/, aia-platform/) viene ignorato durante il build ma resta nel repo.

### 3.4 Auto-deploy su push

Con il repo collegato, ogni `git push origin main` triggera automaticamente un nuovo deploy su Vercel. I Preview deploy partono per ogni branch/PR.

```bash
# Workflow quotidiano
cd c:/Code/Documents/Lavoro/Personale/Vision
git add aia-website/
git commit -m "Update: descrizione modifica"
git push
# → Vercel deploya automaticamente in ~30 secondi
```

> Solo modifiche dentro `aia-website/` triggerano il build (Vercel ignora il resto grazie al Root Directory setting). Se vuoi che anche modifiche in `tracks/` o `brand/` triggerino un redeploy (es. dopo aggiornamento PDF), vai su **Project Settings → Git → Ignored Build Step** e rimuovi il filtro, oppure triggera manualmente da dashboard.

### 3.4-bis Vercel + Repository Privato — Limitazione Piano Hobby

**Problema**: Il piano Vercel Hobby (gratuito) non supporta il deploy automatico da repository GitHub privati. Se il repo è privato, Vercel non triggera il build su push — il progetto risulta "linked" ma i deploy non partono.

**Soluzione** (workflow manuale finché non si passa a Vercel Pro):

1. **Prima del deploy**: rendi il repo pubblico su GitHub
   - GitHub → Repository → **Settings** → **General** → **Danger Zone** → **Change repository visibility** → **Make public**
2. **Fai il push** delle modifiche:
   ```bash
   git push origin main
   # → Vercel triggera il deploy automaticamente
   ```
3. **Aspetta** che il deploy si completi (~30-60 secondi) — verifica su Vercel Dashboard → Deployments
4. **Rimetti privato**: GitHub → Settings → **Make private**

> Tieni il repo privato per default — contiene playbook, pricing, curriculum e materiale commerciale sensibile. Rendilo pubblico solo per il tempo necessario al deploy.

**Alternativa: deploy manuale senza cambiare visibilità**

Se preferisci non cambiare visibilità, puoi forzare un redeploy dalla CLI di Vercel:

```bash
cd aia-website
npm install -g vercel   # una sola volta

vercel --prod           # deploy immediato dalla macchina locale
```

Con la CLI, Vercel carica il build direttamente dalla tua macchina — il repo può restare privato. Richiede `vercel login` la prima volta.

**Quando passare a Vercel Pro** (~20 USD/mese): non appena il sito è attivo con clienti reali. Pro supporta repo privati nativamente e aggiunge: deploy senza pubblicità Vercel, analytics avanzate, team access, funzioni serverless senza cold start.

### 3.5 Configura dominio custom

1. Su Vercel: **Project Settings** → **Domains**
2. Aggiungi `www.108vision.it` (primario) e `108vision.it` (redirect a www)
3. Vercel ti darà le istruzioni DNS. Su Aruba → Gestione DNS:

| Tipo | Host | Valore |
|------|------|--------|
| A | (vuoto o `@`) | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

4. Su Vercel imposta `www.108vision.it` come **primary domain** (Vercel redirect `108vision.it → www.108vision.it` automaticamente)
5. Attendi 15-60 minuti (propagazione DNS Aruba) → Vercel verifica e genera certificato SSL automaticamente

> Se Vercel non verifica dopo 1 ora: controlla su Aruba che non ci siano record A/CNAME preesistenti per `@` o `www` in conflitto. Eliminali.

### 3.6 Attiva Vercel Analytics

1. Su Vercel: **Project** → **Analytics** tab → **Enable**
2. Conferma (è gratuito nel piano Hobby con limiti generosi)
3. Opzionale: **Speed Insights** tab → **Enable** (performance monitoring)

Il codice è già configurato — gli script `/_vercel/insights/script.js` e `/_vercel/speed-insights/script.js` sono nel layout.

### 3.7 Configura Environment Variables

Su Vercel: **Project Settings** → **Environment Variables**:

| Key | Value | Environment |
|-----|-------|-------------|
| `BREVO_API_KEY` | (la key generata al passo 4.4) | Production, Preview |

---

## FASE 4: Brevo — Email Marketing & Automation

### 4.1 Registrati su Brevo

1. Vai su https://www.brevo.com
2. Clicca **Sign up free**
3. Registrati con `elios@108vision.it` (usa la nuova email)
4. Conferma email
5. Completa il profilo (nome azienda: "108 Vision", settore: "IT/Technology")

### 4.2 Autentica il dominio mittente

1. Su Brevo: **Settings** → **Senders, Domains & Dedicated IPs** → **Domains** tab
2. Clicca **Add a domain** → inserisci `108vision.it`
3. Brevo ti mostra 3 record DNS da aggiungere. Su Aruba → Gestione DNS:

| Tipo | Host | Valore | Note |
|------|------|--------|------|
| TXT | `mail._domainkey` | (DKIM value da Brevo) | Diverso da quello Zoho! |
| TXT | (vuoto o `@`) | (Brevo verification code) | Aggiungilo come SECONDO record TXT |
| CNAME | `mail` | (Brevo tracking domain) | Per tracking aperture |

> Nota: puoi avere più record TXT sullo stesso nome (`@`). SPF va unificato in uno solo:
> `v=spf1 include:zoho.eu include:sendinblue.com ~all`

4. Torna su Brevo → **Verify** su ogni record

### 4.3 Crea Lista contatti

1. **Contacts** → **Lists** → **Create a list**
2. Nome: "Lead Magnet Downloads"
3. Annota il **List ID** (visibile nell'URL o nella lista — tipicamente `3` o `4`)

### 4.4 Genera API Key

1. **Settings** → **SMTP & API** → **API Keys** tab
2. **Generate a new API key**
3. Nome: "108vision-website"
4. Copia la key (mostrata una sola volta!)
5. Aggiungila su Vercel come `BREVO_API_KEY` (vedi passo 3.5)

### 4.5 Configura sender

1. **Settings** → **Senders, Domains & Dedicated IPs** → **Senders** tab
2. **Add a sender**:
   - Nome: `Elios Scoglio | 108 Vision`
   - Email: `info@108vision.it`
3. Conferma (riceverai email di verifica su Zoho — arriva su info@ che è alias del tuo account)

### 4.6 Crea Email Template — Welcome + PDF

1. **Campaigns** → **Templates** → **Create a template**
2. Nome: "Lead Magnet - Welcome"
3. Subject: "Ecco la tua guida gratuita"
4. Contenuto (usa drag & drop editor):

```
Ciao {{contact.FIRSTNAME}},

grazie per aver scaricato la guida!

Se hai problemi con il download, ecco il link diretto:
[Scarica il PDF](https://108vision.it/pdf/...)

Nei prossimi giorni ti manderò:
- Approfondimenti pratici sull'argomento
- Casi studio da PMI italiane
- Un invito a una call strategica gratuita (se ti interessa)

A presto,
Elios Scoglio | 108 Vision
108vision.it
```

### 4.7 Crea Automation — Nurture Sequence

1. **Automations** → **Create an automation** → **Start from scratch**
2. **Entry point**: "A contact is added to a list" → seleziona "Lead Magnet Downloads"
3. **Workflow**:

```
[Trigger: aggiunto alla lista]
    ↓ (attendi 1 minuto)
[Invia email: "Lead Magnet - Welcome" con link PDF]
    ↓ (attendi 3 giorni)
[Invia email: Nurture #1 — "Il problema reale con l'AI nelle PMI"]
    ↓ (attendi 3 giorni)
[Invia email: Nurture #2 — "Come un'azienda da 30 dipendenti ha automatizzato..."]
    ↓ (attendi 3 giorni)
[Invia email: Nurture #3 — "Vuoi chiarezza? 30 minuti, zero impegno"]
    ↓ (attendi 4 giorni)
[Invia email: Nurture #4 — CTA call strategica finale]
```

4. Attiva l'automation

> Le email nurture le trovi pronte nel Content Calendar (`tracks/sales/AI-Content-Calendar.md`, sezione Email Sequence). Copiale nei template Brevo.

---

## FASE 5: Generare i PDF Lead Magnet

### 5.1 Installa dipendenze script

```bash
cd c:/Code/Documents/Lavoro/Personale/Vision/scripts
npm install
```

Requisiti: Node.js 18+ e Chrome/Chromium (Puppeteer lo scarica automaticamente).

### 5.2 Genera tutti i PDF

```bash
node md-to-pdf.js ../tracks/ --output ../aia-website/public/pdf/
```

Output atteso: 15 PDF brandizzati nella cartella `aia-website/public/pdf/`:
- `AI-Adoption-Manuale-PMI.pdf`
- `FCTO-Manuale-FractionalCTO.pdf`
- `ARCH-Manuale-Scaling.pdf`
- `DIGI-Manuale-Trasformazione.pdf`
- `LEAD-Manuale-Leadership.pdf`
- `AGILE-Manuale-AgileDevOps.pdf`
- `WELL-Manuale-Wellbeing.pdf`
- `ZERO-Manuale-FromScratch.pdf`
- `PROJ-Manuale-SviluppoProgetto.pdf`
- `FACT-Manuale-Factory.pdf`
- `COMP-Manuale-ComplianceAIAct.pdf`
- `NOCODE-Manuale-Automation.pdf`
- `DATA-Manuale-Analytics.pdf`
- `PA-Manuale-PubblicaAmministrazione.pdf`
- `AIA-Manuale-Piattaforma.pdf`

### 5.3 Verifica

Apri 2-3 PDF a campione e controlla:
- Cover page con brand 108 Vision
- Formattazione corretta (titoli, tabelle, blockquote)
- CTA finale con link 108vision.it
- Header/footer con numerazione pagine

---

## FASE 6: Deploy Finale e Verifica

### 6.1 Deploy

```bash
cd c:/Code/Documents/Lavoro/Personale/Vision/aia-website
npm install
vercel --prod
```

Oppure se collegato a GitHub: push → deploy automatico.

### 6.2 Checklist post-deploy

- [ ] `https://www.108vision.it` carica correttamente (HTTPS, no errori)
- [ ] `https://108vision.it` redirige a `https://www.108vision.it`
- [ ] Logo 108 visibile in header e footer
- [ ] Pagina `/risorse` mostra tutte le guide
- [ ] Clicca su una guida → landing page con form
- [ ] Compila form con email test → ricevi redirect a `/risorse/grazie`
- [ ] Controlla su Brevo → il contatto appare nella lista
- [ ] Download PDF funziona dalla pagina grazie
- [ ] `/profilo/full-stack-ai` carica (senza header)
- [ ] `/profilo/software-manager` carica (senza header)
- [ ] `/profilo/team-leader` carica (senza header)
- [ ] Vercel Analytics → vedi i primi eventi
- [ ] Manda email da `elios@108vision.it` → non finisce in spam
- [ ] `mail-tester.com` → score >= 8/10

### 6.3 Test funnel completo

1. Apri una finestra in incognito
2. Vai su `108vision.it/risorse/guida-ai-pmi`
3. Compila il form con un'email di test
4. Verifica: redirect a pagina grazie, link PDF funzionante
5. Verifica su Brevo: contatto creato con attributi corretti
6. Se automation attiva: controlla che l'email di welcome arrivi

---

## Record DNS — Riepilogo completo

Dopo tutti i passaggi, i tuoi record DNS su Aruba saranno:

| Tipo | Host | Valore |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `zb*****` | `zmverify.zoho.eu` |
| CNAME | `mail` | (Brevo tracking domain) |
| MX | `@` | `mx.zoho.eu` (priorità 10) |
| MX | `@` | `mx2.zoho.eu` (priorità 20) |
| MX | `@` | `mx3.zoho.eu` (priorità 50) |
| TXT | `@` | `v=spf1 include:zoho.eu include:sendinblue.com ~all` |
| TXT | `@` | (Brevo domain verification code) |
| TXT | `zmail._domainkey` | (DKIM Zoho — valore lungo) |
| TXT | `mail._domainkey` | (DKIM Brevo — valore lungo) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; ruf=mailto:info@108vision.it` |

> Su Aruba puoi avere più record TXT sullo stesso host (`@`). Inseriscili uno per uno.

---

## Troubleshooting

### Email va in spam
- Verifica SPF con https://mxtoolbox.com/spf.aspx → deve includere sia zoho.eu che sendinblue.com
- Verifica DKIM con https://mxtoolbox.com/dkim.aspx
- Verifica DMARC con https://mxtoolbox.com/dmarc.aspx
- Testa deliverability: https://www.mail-tester.com

### Form non funziona (errore 503)
- Controlla che `BREVO_API_KEY` sia impostata su Vercel (Environment Variables)
- Verifica che il deploy sia andato a buon fine (Vercel → Deployments)
- Controlla i log: Vercel → Functions → `/api/subscribe`

### PDF non si scarica
- Verifica che i file siano in `public/pdf/` e che il nome corrisponda esattamente
- Controlla l'URL nella pagina grazie: deve essere `/pdf/NOME-FILE.pdf`

### Dominio non risolve
- DNS propagation Aruba: può richiedere fino a 24-48h per i .it (di solito 15-60 min)
- Verifica: `nslookup 108vision.it` da terminale
- Controlla che non ci siano record A/CNAME preesistenti in conflitto su Aruba
- Se Aruba ha record di default (es. parking page): eliminali tutti prima di aggiungere quelli nuovi

### Zoho non riceve email
- Verifica record MX: https://mxtoolbox.com/MXLookup.aspx
- Controlla che non ci siano altri record MX in conflitto
- Attendi propagazione (max 1h per MX)

---

## Manutenzione periodica

| Cadenza | Azione |
|---------|--------|
| Settimanale | Controlla Brevo → nuovi contatti, bounce rate |
| Mensile | Review Vercel Analytics → pagine top, conversion rate |
| Trimestrale | Aggiorna PDF se i manuali sono cambiati |
| Annuale | Rinnova dominio (auto-rinnovo su Aruba — verifica che sia attivo) |

---

## Sequenza temporale consigliata

```
GIORNO 1 (45 min totali):
├── 10 min: Registra dominio su Aruba
├── 15 min: Setup Zoho Mail + DNS su Aruba
├── 10 min: Collega Vercel + dominio
└── 10 min: Attiva Vercel Analytics

GIORNO 2 (30 min):
├── 15 min: Setup Brevo + DNS authentication
├── 10 min: Genera PDF
└──  5 min: Deploy + test

GIORNO 3 (20 min — dopo verifica DNS):
├── 10 min: Crea automation Brevo
└── 10 min: Test funnel end-to-end
```

Totale effort: ~1.5 ore distribuite su 3 giorni (per dare tempo alla propagazione DNS).

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
