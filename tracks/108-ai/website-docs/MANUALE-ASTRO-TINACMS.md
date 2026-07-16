# Manuale — Astro 5 + TinaCMS nel sito 108 Vision

Questo documento spiega come funzionano insieme Astro 5 e TinaCMS **nel contesto specifico del sito `aia-website/`**. Non è un tutorial generico — parte dalla struttura reale del progetto.

---

## 1. Architettura in due righe

**Astro 5** genera il sito: routing, layout, componenti, build statica.  
**TinaCMS** gestisce due cose distinte:
- **Editor visuale** (`/admin`) per modificare content files senza toccare il codice
- **Schema dei content files** (`tina/config.ts`) che definisce quali campi espone l'editor

Il sito funziona perfettamente **senza TinaCMS** — i content files sono semplici `.md`, `.mdx`, `.json` su disco. TinaCMS è solo un layer di editing sopra.

```
┌─────────────────────────────────────────────────────────┐
│                     Developer                           │
│   Modifica src/i18n/**, src/pages/**, src/components/** │
└──────────────────────┬──────────────────────────────────┘
                       │ codice
┌──────────────────────▼──────────────────────────────────┐
│                    Astro 5                              │
│  Routing file-based · Layouts · Components · i18n API  │
│  output: 'static' + API route /api/subscribe (SSR)     │
└──────────────────────┬──────────────────────────────────┘
                       │ legge content files
┌──────────────────────▼──────────────────────────────────┐
│               Content Layer                             │
│  content/blog/**   → post del blog (Markdown)           │
│  content/pages/**  → page data (MDX, TinaCMS managed)   │
│  content/global/   → settings.json (nav, footer, social)│
└──────────────────────┬──────────────────────────────────┘
                       │ editor visuale (opzionale)
┌──────────────────────▼──────────────────────────────────┐
│               TinaCMS                                   │
│  /admin → editor visuale (locale: file su disco)        │
│  Vercel/Cloud → editor visuale con Git sync             │
└─────────────────────────────────────────────────────────┘
```

**Importante**: la maggior parte del contenuto del sito (copy delle service page, pricing, i18n) **non passa per TinaCMS** — è hardcoded nei file `src/i18n/pages/*.ts`. TinaCMS gestisce solo blog post e le tre collezioni definite in `tina/config.ts`.

---

## 2. Struttura del progetto

```
aia-website/
├── src/
│   ├── pages/              ← routing Astro (file = URL)
│   │   ├── index.astro     → /
│   │   ├── fractional-cto.astro → /fractional-cto
│   │   ├── en/             → /en/* (versione inglese)
│   │   ├── blog/[slug].astro → /blog/:slug (dinamico)
│   │   ├── risorse/        → /risorse/* (lead magnet)
│   │   └── api/subscribe.ts → POST /api/subscribe (SSR)
│   ├── components/
│   │   ├── *.astro         ← componenti shared (Header, Footer, SEOHead...)
│   │   └── pages/          ← componenti "page" (contengono il vero HTML)
│   ├── layouts/
│   │   ├── BaseLayout.astro   ← layout default (header + footer)
│   │   ├── BlogLayout.astro
│   │   ├── CleanLayout.astro  ← senza header/footer (profili CV)
│   │   ├── LeadMagnetLayout.astro
│   │   └── ServiceLayout.astro
│   ├── i18n/
│   │   ├── config.ts       ← definisce Locale = 'it' | 'en'
│   │   ├── routes.ts       ← Set<string> delle route tradotte
│   │   ├── utils.ts        ← helper: localizedPath, getAlternateLocaleUrl...
│   │   ├── ui.ts           ← traduzioni UI globali (nav, footer, CTA)
│   │   └── pages/*.ts      ← contenuto per-pagina (it + en)
│   └── styles/global.css
├── tina/
│   └── config.ts           ← schema TinaCMS (3 collections)
├── content/
│   ├── blog/               ← post del blog (Markdown)
│   └── global/settings.json ← settings globali (nav, social, footer)
├── public/
│   └── pdf/                ← PDF dei lead magnet
└── astro.config.mjs        ← config Astro: output static, vercel adapter, i18n
```

---

## 3. Come funziona il routing in Astro 5

### Routing file-based

Ogni file in `src/pages/` diventa una URL:

| File | URL |
|------|-----|
| `src/pages/index.astro` | `/` |
| `src/pages/fractional-cto.astro` | `/fractional-cto` |
| `src/pages/blog/[slug].astro` | `/blog/:slug` (dinamico) |
| `src/pages/risorse/grazie.astro` | `/risorse/grazie` |
| `src/pages/api/subscribe.ts` | `POST /api/subscribe` |

### i18n: italiano (default) + inglese

Il sito usa `output: 'static'` con `i18n.defaultLocale: 'it'`. La logica è:

- Pagine in `src/pages/*.astro` → URL italiane (senza prefisso, es. `/fractional-cto`)
- Pagine in `src/pages/en/*.astro` → URL inglesi (con prefisso `/en/`, es. `/en/fractional-cto`)
- Ogni pagina è un file separato — non c'è routing automatico i18n

**Struttura tipo di una pagina**:
```astro
---
// src/pages/fractional-cto.astro
import FractionalCtoPage from '@/components/pages/FractionalCtoPage.astro';
---
<FractionalCtoPage locale="it" />
```
```astro
---
// src/pages/en/fractional-cto.astro
import FractionalCtoPage from '@/components/pages/FractionalCtoPage.astro';
---
<FractionalCtoPage locale="en" />
```

Il componente `FractionalCtoPage.astro` gestisce entrambe le lingue via `locale` prop.

### Route dinamiche (blog)

Per le route dinamiche come `/blog/[slug]`, Astro richiede `getStaticPaths()` in build statica:

```astro
---
// src/pages/blog/[slug].astro
import { getBlogSlugs } from '@/i18n/pages/blog';

export function getStaticPaths() {
  return getBlogSlugs().map((slug) => ({
    params: { slug },
    props: { slug },
  }));
}
---
<BlogPostPage locale="it" slug={slug} />
```

`getBlogSlugs()` legge i post definiti in `src/i18n/pages/blog.ts` e restituisce l'array degli slug. Ogni slug genera una pagina statica separata.

### L'eccezione: `/api/subscribe`

L'endpoint `/api/subscribe` ha `export const prerender = false` — è l'unica route SSR (serverless function su Vercel). Non viene prerenderizzata staticamente.

---

## 4. Come funziona il sistema i18n

Il sito **non usa** Astro i18n routing automatico — usa un sistema custom basato su TypeScript.

### Dove vive il contenuto

Quasi tutto il contenuto è in `src/i18n/pages/<nome-pagina>.ts`:

```typescript
// src/i18n/pages/fractional-cto.ts
export const ui = {
  it: {
    'fcto.title': 'Fractional CTO | 108 Vision',
    'fcto.heroTitle': 'Il tuo CTO part-time,...',
    'fcto.pricing.base.price': '3.000 EUR/mese',
    // ...decine di chiavi
  },
  en: {
    'fcto.title': 'Fractional CTO | 108 Vision',
    'fcto.heroTitle': 'Your part-time CTO...',
    // ...
  }
}
```

Poi in `src/i18n/utils.ts` ci sono helper che costruiscono oggetti strutturati:
```typescript
export function getFractionalCtoContent(locale: Locale) {
  return {
    hero: { title: ui[locale]['fcto.heroTitle'] },
    pricing: { ... },
    // ...
  };
}
```

E nel componente:
```astro
---
// src/components/pages/FractionalCtoPage.astro
import { getFractionalCtoContent } from '@/i18n/utils';
const content = getFractionalCtoContent(locale);
---
<h1>{content.hero.title}</h1>
```

### Traduzioni UI globali

Le stringhe condivise (nav, CTA, footer, form labels) sono in `src/i18n/ui.ts`:
```typescript
import { useTranslations } from '@/i18n';
const t = useTranslations(locale);
t.nav.contact // → "Contatti" o "Contact"
```

### Cambio lingua

Il componente `LanguageSwitcher.astro` usa `getAlternateLocaleUrl()` da `utils.ts`. Questa funzione controlla `translatedRoutes` (in `routes.ts`) — se la pagina corrente non ha traduzione, rimanda alla homepage nella lingua target.

**Quando aggiungi una nuova pagina**: devi aggiungerla manualmente a `translatedRoutes` in `src/i18n/routes.ts`, altrimenti il language switcher non funziona correttamente.

---

## 5. TinaCMS: le tre collezioni

`tina/config.ts` definisce tre collezioni. Capire cosa fa ognuna è fondamentale.

### Collezione `blog`

**Path**: `content/blog/`  
**Format**: Markdown (`.md`)  
**Usata da**: `src/i18n/pages/blog.ts`

I post del blog sono gestiti come Markdown. TinaCMS offre l'editor visuale per creare/modificare post. Campi definiti: `title`, `date`, `author`, `excerpt`, `cover_image`, `tags`, `body`.

> **Attenzione**: il blog al momento ha i contenuti hardcoded in `src/i18n/pages/blog.ts`, non letti dai file Markdown in `content/blog/`. Se vuoi usare i file MD come fonte di verità, devi aggiornare `getBlogSlugs()` e `getBlogPost()` per leggere da filesystem via `import.meta.glob` o Astro Content Collections.

### Collezione `page`

**Path**: `content/pages/`  
**Format**: MDX  
**Usata da**: non ancora integrata nelle service page

Questa collezione è preparata per gestire i contenuti delle service page tramite TinaCMS, ma le pagine correnti (`fractional-cto`, `architettura`, ecc.) leggono ancora da `src/i18n/pages/*.ts`. È un'architettura ibrida: la migrazione verso TinaCMS per le service page è un lavoro futuro.

### Collezione `global`

**Path**: `content/global/settings.json`  
**Format**: JSON  
**Usata da**: potenzialmente Header, Footer, social links

Contiene nav items, footer links, social URLs. La UI di TinaCMS non permette creare/eliminare il file (è `allowedActions: { create: false, delete: false }`), solo modificare i valori.

---

## 6. Modalità locale vs cloud di TinaCMS

### Modalità locale (sviluppo)

```bash
cd aia-website
npm run dev
# oppure: tinacms dev -c "astro dev"
```

TinaCMS in locale:
- Avvia un server GraphQL locale
- Legge/scrive i content files direttamente su disco
- **Non richiede** `TINA_CLIENT_ID` né `TINA_TOKEN`
- Editor visuale su `http://localhost:4321/admin`

Le variabili `TINA_CLIENT_ID` e `TINA_TOKEN` in `tina/config.ts` vengono passate come stringhe vuote — TinaCMS le ignora e usa il filesystem locale.

### Modalità cloud (Vercel)

In produzione, TinaCMS usa TinaCloud:
- `TINA_CLIENT_ID` e `TINA_TOKEN` devono essere impostati nelle env vars di Vercel
- Le modifiche fatte via `/admin` vengono committate su GitHub via TinaCloud
- `TINA_BRANCH` (o `VERCEL_GIT_COMMIT_REF`) determina su quale branch lavorare

**Senza queste credenziali su Vercel**, l'editor `/admin` su produzione non funziona, ma il **sito** funziona normalmente (il build legge i file, non usa TinaCloud).

---

## 7. Layout system

Cinque layout, ognuno con uno scopo preciso:

| Layout | Usa quando |
|--------|-----------|
| `BaseLayout.astro` | Tutte le pagine standard (header + footer) |
| `ServiceLayout.astro` | Service page con breadcrumb e sezioni standard |
| `BlogLayout.astro` | Post del blog |
| `LeadMagnetLayout.astro` | Landing page guide PDF (form download) |
| `CleanLayout.astro` | Profili CV (`/profilo/*`) — solo contenuto, no header/footer |

I layout si usano nei componenti `pages/*.astro`, non direttamente nelle page file:

```astro
---
// src/components/pages/FractionalCtoPage.astro
import ServiceLayout from '@/layouts/ServiceLayout.astro';
---
<ServiceLayout title={content.meta.title} description={content.meta.description} locale={locale}>
  <!-- contenuto pagina -->
</ServiceLayout>
```

---

## 8. Come si fa: compiti comuni

### Aggiungere un post al blog

1. Crea `content/blog/nuovo-post.md` con frontmatter:
   ```markdown
   ---
   title: "Titolo del post"
   date: "2026-01-15"
   author: "Elios Scoglio"
   excerpt: "Breve descrizione per la card..."
   tags: ["AI", "PMI"]
   ---
   Corpo del post...
   ```

2. Aggiungi l'entry in `src/i18n/pages/blog.ts` — aggiungi lo slug a `getBlogSlugs()` e il contenuto strutturato all'array `posts` (in entrambe le lingue se serve).

3. Aggiungi lo slug a `translatedRoutes` in `src/i18n/routes.ts` se vuoi la versione EN.

> In alternativa puoi usare l'editor visuale: `npm run dev` → `localhost:4321/admin` → sezione Blog → New post.

### Modificare il copy di una service page

1. Apri `src/i18n/pages/<nome-pagina>.ts`
2. Modifica la stringa nella chiave corrispondente (sia in `it` che in `en` se serve)
3. Salva — Astro aggiorna in hot reload

Non serve toccare il componente né la page file.

### Aggiungere una nuova service page

1. Crea `src/i18n/pages/nuova-pagina.ts` con le traduzioni IT+EN
2. Crea `src/components/pages/NuovaPaginaPage.astro` usando `ServiceLayout`
3. Crea `src/pages/nuova-pagina.astro` e `src/pages/en/nuova-pagina.astro`
4. Aggiungi `/nuova-pagina` a `translatedRoutes` in `src/i18n/routes.ts`
5. Se serve lead magnet: aggiungi `src/pages/risorse/guida-nuova-pagina.astro` + versione EN

### Modificare navigazione / footer

Due opzioni:

- **Via TinaCMS editor**: `localhost:4321/admin` → Global Settings → Nav/Footer. Modifica `content/global/settings.json`.
- **Via codice**: modifica direttamente `content/global/settings.json` o i file `src/i18n/ui.ts` se il nav è hardcoded lì.

### Aggiungere un'immagine

Metti il file in `public/` (es. `public/images/nome.png`). Nel componente:
```astro
<img src="/images/nome.png" alt="..." />
```

Per upload via TinaCMS editor: le immagini vanno in `public/uploads/` (configurato in `tina/config.ts` → `media.tina.mediaRoot`).

---

## 9. Build e output

```bash
# Build completa (TinaCMS prebuild + Astro build)
npm run build:tina

# Build solo Astro (senza rigenerare schema TinaCMS)
npm run build

# Preview locale del build
npm run preview
```

### Cosa genera il build

- `dist/` — output statico del sito (HTML, CSS, JS)
- `public/admin/` — editor TinaCMS (cartella `admin` generata da TinaCMS build)
- `.vercel/output/` — formato Vercel (generato dall'adapter)

La route `/api/subscribe` resta come Vercel Serverless Function (non nella cartella `dist/`), grazie all'adapter `@astrojs/vercel`.

### Differenza tra `build` e `build:tina`

| Comando | Cosa fa |
|---------|---------|
| `npm run build` | Solo `astro build` — più veloce, non rigeneravit schema TinaCMS |
| `npm run build:tina` | `tinacms build` + `astro build` — necessario se hai modificato `tina/config.ts` |

In CI/Vercel viene sempre usato `build:tina` (configurato in `vercel.json`).

---

## 10. Gotcha specifici di questo progetto

### Il contenuto delle service page NON è in TinaCMS

Tutto il copy (hero title, pricing, feature list, FAQ) è in `src/i18n/pages/*.ts`. TinaCMS gestisce solo blog e `content/pages/` (MDX), che al momento non è collegato alle service page. Se cerchi dove cambiare "3.000 EUR/mese" per il FCTO, è in `src/i18n/pages/fractional-cto.ts`, non in TinaCMS.

### Hot reload di TinaCMS in locale può essere lento

Il server GraphQL locale di TinaCMS può impiegare 3-5 secondi al primo avvio. Se il browser mostra una pagina bianca al primo carico, aspetta che il terminale mostri `TinaCMS server started`.

### `@/` è alias per `src/`

In `tsconfig.json` è configurato `@/*` → `src/*`. Negli import usa sempre `@/components/...`, non path relativi.

### Build fallisce con "prerender: false" senza adapter

Se rimuovi `adapter: vercel()` da `astro.config.mjs`, il build fallisce perché `/api/subscribe` ha `prerender = false`. L'output statico puro non supporta route SSR. Il workaround è rimuovere l'endpoint, ma perdi il form funzionante.

### `translatedRoutes` è manuale

Non viene generato automaticamente. Se crei una nuova pagina e non la aggiungi a `src/i18n/routes.ts`, il language switcher porta l'utente alla homepage invece che alla pagina tradotta.

### Le env var di TinaCMS Cloud vanno su Vercel, non nel repo

`TINA_CLIENT_ID` e `TINA_TOKEN` sono segreti TinaCloud. Non metterli mai in `.env` committato. Vanno solo in Vercel → Project Settings → Environment Variables.

---

## 11. Flusso di sviluppo tipico

```
Modifica copy/contenuto
  → src/i18n/pages/<pagina>.ts
  → hot reload immediato

Modifica componente/layout
  → src/components/** o src/layouts/**
  → hot reload immediato

Aggiungi post blog
  → content/blog/ (o via /admin)
  → aggiorna src/i18n/pages/blog.ts

Modifica TinaCMS schema
  → tina/config.ts
  → riavvia dev server

Verifica build production
  → npm run build:tina && npm run preview
  → controlla http://localhost:4321
```

---

*108 Vision — aia-website: Astro 5 + TinaCMS + Tailwind 4 + Vercel*
