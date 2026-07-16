# 108 Vision — Design System

> Versione 1.0 | Giugno 2026
> Questo documento definisce il linguaggio visivo uniforme per tutti i touchpoint 108 Vision: sito web, dashboard, documenti, presentazioni, social.

---

## 1. Logo

### Concept

Il logo combina tre elementi simbolici:
- **"1"** — direzione, leadership, primo passo
- **"0"** — cerchio aperto (enso zen), completezza senza chiusura, apertura al cambiamento
- **"8" / lemniscate** — infinito, iterazione continua, visione senza limite

Il lemniscate (8/infinito) è in **violet** — l'unico elemento di colore nel logo, rappresenta la visione.

### Varianti

| Variante | File | Uso |
|----------|------|-----|
| Full (orizzontale) | `logo/108vision-logo-full.svg` | Header sito, documenti, slide |
| Full white | `logo/108vision-logo-white.svg` | Su sfondi scuri |
| Mark (quadrato) | `logo/108vision-logo-mark.svg` | Favicon, avatar, icona app |

### Clear space

Minimo clear space = altezza della "1" su tutti i lati. Nessun elemento deve invadere questo spazio.

### Dimensioni minime

- Full: min 120px larghezza (web), 30mm (print)
- Mark: min 24px (web), 8mm (print)

### Don't

- Non distorcere le proporzioni
- Non cambiare i colori del lemniscate
- Non aggiungere ombre o effetti
- Non mettere il logo su sfondi che riducono il contrasto sotto 4.5:1

---

## 2. Palette Colori

### Filosofia

Palette dark-first, minimale, con un unico accent viola che richiama il lemniscate del logo. Professionale senza essere corporate. Moderno senza essere trendy.

### Primary — Ink (testo, struttura)

| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `ink-950` | `#0F172A` | 222 47% 11% | Testo principale, logo |
| `ink-900` | `#1E293B` | 217 33% 17% | Heading, nav attiva |
| `ink-800` | `#334155` | 215 25% 27% | Testo secondario |
| `ink-700` | `#475569` | 215 16% 35% | Testo terziario |
| `ink-400` | `#94A3B8` | 215 16% 65% | Placeholder, disabled |
| `ink-200` | `#E2E8F0` | 215 20% 91% | Bordi, divisori |
| `ink-100` | `#F1F5F9` | 210 40% 96% | Background secondario |
| `ink-50` | `#F8FAFC` | 210 40% 98% | Background primario |

### Accent — Violet (brand, CTA, focus)

| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `violet-900` | `#4C1D95` | 263 70% 35% | Hover CTA su dark |
| `violet-800` | `#5B21B6` | 263 69% 42% | CTA hover |
| `violet-700` | `#6D28D9` | 263 70% 50% | **CTA primaria, logo accent** |
| `violet-600` | `#7C3AED` | 263 83% 58% | Link hover |
| `violet-500` | `#8B5CF6` | 259 89% 66% | Link, focus ring |
| `violet-400` | `#A78BFA` | 258 90% 76% | Logo su dark, badge |
| `violet-200` | `#DDD6FE` | 258 89% 92% | Background accent light |
| `violet-100` | `#EDE9FE` | 258 88% 96% | Tag, chip background |
| `violet-50` | `#F5F3FF` | 258 100% 98% | Hover row, highlight |

### Semantic — Feedback

| Token | Hex | Uso |
|-------|-----|-----|
| `success-600` | `#059669` | Conferma, check, online |
| `success-100` | `#D1FAE5` | Background success |
| `warning-600` | `#D97706` | Attenzione, pendente |
| `warning-100` | `#FEF3C7` | Background warning |
| `error-600` | `#DC2626` | Errore, offline, critico |
| `error-100` | `#FEE2E2` | Background error |
| `info-600` | `#2563EB` | Info, link esterno |
| `info-100` | `#DBEAFE` | Background info |

### Gradient (hero, CTA premium)

```css
/* Hero gradient — usare con parsimonia */
--gradient-hero: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4C1D95 100%);

/* CTA gradient */
--gradient-cta: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%);

/* Glow effect (solo su dark background) */
--glow-violet: 0 0 60px rgba(109, 40, 217, 0.3);
```

### Contrasto — Accessibilita WCAG AA

| Combinazione | Ratio | Livello |
|---|---|---|
| ink-950 su ink-50 | 17.4:1 | AAA |
| violet-700 su white | 6.1:1 | AA+ |
| white su violet-700 | 6.1:1 | AA+ |
| white su ink-950 | 17.4:1 | AAA |
| violet-400 su ink-950 | 7.2:1 | AAA |

---

## 3. Tipografia

### Font Stack

| Uso | Font | Fallback |
|-----|------|----------|
| Heading | **Inter** (700, 800) | SF Pro Display, system-ui |
| Body | **Inter** (400, 500) | SF Pro Text, system-ui |
| Code | **JetBrains Mono** (400) | SF Mono, Menlo, monospace |

### Type Scale

| Token | Size | Weight | Line Height | Uso |
|-------|------|--------|-------------|-----|
| `display-xl` | 56px / 3.5rem | 800 | 1.1 | Hero headline |
| `display-lg` | 44px / 2.75rem | 800 | 1.15 | Page title |
| `heading-xl` | 36px / 2.25rem | 700 | 1.2 | Section h1 |
| `heading-lg` | 28px / 1.75rem | 700 | 1.3 | Section h2 |
| `heading-md` | 22px / 1.375rem | 600 | 1.35 | Section h3 |
| `heading-sm` | 18px / 1.125rem | 600 | 1.4 | Card title |
| `body-lg` | 18px / 1.125rem | 400 | 1.75 | Lead paragraph |
| `body-md` | 16px / 1rem | 400 | 1.7 | Body text |
| `body-sm` | 14px / 0.875rem | 400 | 1.6 | Secondary text |
| `caption` | 12px / 0.75rem | 500 | 1.5 | Label, meta |
| `code` | 14px / 0.875rem | 400 | 1.6 | Code snippet |

### Letter Spacing

| Size range | Letter spacing |
|---|---|
| display (44px+) | -0.02em (tight) |
| heading (18-36px) | -0.01em |
| body (14-18px) | 0 (normal) |
| caption (12px) | +0.02em (slightly open) |
| ALL CAPS | +0.05em |

---

## 4. Spacing & Layout

### Spacing Scale (8px base)

| Token | Value | Uso |
|-------|-------|-----|
| `space-1` | 4px | Inline gap minimo |
| `space-2` | 8px | Icon-to-text, tight gap |
| `space-3` | 12px | Form field padding |
| `space-4` | 16px | Card padding compact |
| `space-5` | 20px | Element gap standard |
| `space-6` | 24px | Card padding standard |
| `space-8` | 32px | Section gap mobile |
| `space-10` | 40px | Component gap |
| `space-12` | 48px | Section gap tablet |
| `space-16` | 64px | Section gap desktop |
| `space-20` | 80px | Page section break |
| `space-24` | 96px | Hero padding |

### Grid

| Breakpoint | Token | Columns | Gutter | Margin |
|---|---|---|---|---|
| Mobile | `sm` (< 640px) | 4 | 16px | 16px |
| Tablet | `md` (640-1024px) | 8 | 24px | 32px |
| Desktop | `lg` (1024-1280px) | 12 | 24px | 48px |
| Wide | `xl` (1280px+) | 12 | 32px | auto (max 1200px) |

### Border Radius

| Token | Value | Uso |
|-------|-------|-----|
| `radius-sm` | 4px | Tag, badge |
| `radius-md` | 8px | Input, button |
| `radius-lg` | 12px | Card |
| `radius-xl` | 16px | Modal, dialog |
| `radius-2xl` | 24px | Feature card |
| `radius-full` | 9999px | Avatar, pill |

---

## 5. Elevazione & Ombre

| Token | Value | Uso |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(15,23,42,0.05)` | Input, subtle lift |
| `shadow-md` | `0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.04)` | Card default |
| `shadow-lg` | `0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.04)` | Card hover, dropdown |
| `shadow-xl` | `0 20px 25px rgba(15,23,42,0.10), 0 8px 10px rgba(15,23,42,0.05)` | Modal, floating |
| `shadow-glow` | `0 0 40px rgba(109,40,217,0.15)` | CTA focus, hero element |

---

## 6. Componenti Core

### Buttons

```
Primary:    bg violet-700, text white, radius-md, shadow-sm
            hover: bg violet-800, shadow-md
            active: bg violet-900
            disabled: bg ink-200, text ink-400

Secondary:  bg transparent, border ink-200, text ink-900, radius-md
            hover: bg ink-50, border ink-300
            active: bg ink-100

Ghost:      bg transparent, text ink-700
            hover: bg ink-50, text ink-900

Destructive: bg error-600, text white, radius-md
            hover: bg red-700
```

**Size variants:**

| Size | Padding | Font | Height |
|---|---|---|---|
| sm | 8px 12px | body-sm (14px) | 32px |
| md | 10px 16px | body-md (16px) | 40px |
| lg | 12px 24px | body-md (16px, 500) | 48px |
| xl | 16px 32px | body-lg (18px, 600) | 56px |

### Cards

```
Default:    bg white, border ink-200, radius-lg, shadow-sm, padding space-6
            hover: shadow-md, border ink-300

Featured:   bg white, border violet-200, radius-xl, shadow-md, padding space-8
            left-border: 4px violet-700

Dark:       bg ink-950, text white, radius-xl, shadow-lg, padding space-8
```

### Input Fields

```
Default:    bg white, border ink-200, radius-md, padding 10px 12px
            focus: border violet-500, ring 2px violet-200
            error: border error-600, ring 2px error-100
            disabled: bg ink-100, text ink-400
```

### Badges / Tags

```
Default:    bg ink-100, text ink-700, radius-sm, padding 2px 8px, caption size
Violet:     bg violet-100, text violet-700
Success:    bg success-100, text success-600
Warning:    bg warning-100, text warning-600
Error:      bg error-100, text error-600
```

---

## 7. Iconografia

### Stile

- Linea: stroke 1.5px
- Dimensione base: 20x20px (body), 24x24px (heading), 16x16px (caption)
- Set: **Lucide Icons** (coerente con shadcn/ui)
- Colore: ereditato dal parent (currentColor)

### Icone brand per track

| Track | Icona Lucide |
|-------|------|
| Fractional CTO | `crown` |
| AI Platform | `brain-circuit` |
| AI Adoption | `sparkles` |
| Architettura | `blocks` |
| Trasformazione | `arrow-right-left` |
| Leadership | `users` |
| Agile & DevOps | `rocket` |
| Wellbeing | `heart-pulse` |
| PA | `landmark` |
| Digital Starter | `zap` |
| Sviluppo Progetto | `package` |
| Factory | `factory` |
| Compliance AI Act | `shield-check` |
| No-Code Automation | `workflow` |
| Data & Analytics | `bar-chart-3` |

---

## 8. Motion & Animazione

### Principi

- Subtle, non decorativa — supporta la comprensione
- Nessuna animazione bloccante (no loader a schermo intero senza escape)
- `prefers-reduced-motion`: rispettare sempre

### Timing

| Token | Duration | Easing | Uso |
|-------|----------|--------|-----|
| `motion-fast` | 150ms | ease-out | Hover, focus, toggle |
| `motion-normal` | 250ms | ease-in-out | Expand, collapse, fade |
| `motion-slow` | 400ms | ease-in-out | Page transition, modal |
| `motion-spring` | 500ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Bounce, playful accent |

---

## 9. Template Documenti

### Playbook (uso interno)

```
Header:     bg gradient-hero, logo white, titolo display-lg white
Subtitle:   body-lg violet-400
Body:       bg ink-50, prose styling
Sections:   heading-xl ink-950, border-bottom ink-200
Callout:    bg violet-50, border-left 4px violet-700, body-md
Warning:    bg warning-100, border-left 4px warning-600
Code:       bg ink-950, text white, JetBrains Mono, radius-lg
Tables:     header bg ink-100, border ink-200, striped rows
Footer:     bg ink-950, logo white, "108 Vision — Uso interno"
```

### Manuale (lead magnet cliente)

```
Header:     bg white, logo full color, titolo display-lg ink-950
Subtitle:   body-lg ink-700
Body:       bg white, prose styling
Key insight: bg violet-50, radius-xl, padding space-8, icon sparkles
Sections:   heading-xl ink-950, numbered (01. 02. 03.)
Checklist:  checkmark violet-700, body-md ink-800
CTA box:    bg gradient-cta, text white, radius-xl, center
Footer:     bg ink-50, logo, "108vision.it | Elios Scoglio"
```

### Sito/Copy (pagina web)

```
Hero:       bg gradient-hero OR bg ink-950, headline display-xl white
            subtitle body-lg ink-400, CTA button xl
Sections:   alternating white / ink-50 backgrounds
Cards:      grid 3-col desktop, 1-col mobile, featured card variant
Pricing:    3-tier horizontal, featured middle tier (violet border)
Testimonial: bg ink-50, italic body-lg, attribution caption
Footer:     bg ink-950, logo white, 3 colonne link, social icons
```

### Presentazione / Slide

```
Title slide: bg gradient-hero, logo white center, title display-xl
Content:     bg white, title heading-xl, max 3 bullet points
Diagram:     bg ink-50, Mermaid or SVG center, caption below
Quote:       bg violet-50, large italic body-lg, attribution
Closing:     bg ink-950, logo, claim body-lg violet-400, contact
```

---

## 10. CSS Custom Properties (implementazione)

```css
:root {
  /* Ink */
  --ink-950: #0F172A;
  --ink-900: #1E293B;
  --ink-800: #334155;
  --ink-700: #475569;
  --ink-400: #94A3B8;
  --ink-200: #E2E8F0;
  --ink-100: #F1F5F9;
  --ink-50: #F8FAFC;

  /* Violet */
  --violet-900: #4C1D95;
  --violet-800: #5B21B6;
  --violet-700: #6D28D9;
  --violet-600: #7C3AED;
  --violet-500: #8B5CF6;
  --violet-400: #A78BFA;
  --violet-200: #DDD6FE;
  --violet-100: #EDE9FE;
  --violet-50: #F5F3FF;

  /* Semantic */
  --success-600: #059669;
  --success-100: #D1FAE5;
  --warning-600: #D97706;
  --warning-100: #FEF3C7;
  --error-600: #DC2626;
  --error-100: #FEE2E2;
  --info-600: #2563EB;
  --info-100: #DBEAFE;

  /* Typography */
  --font-sans: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-unit: 4px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.05);
  --shadow-md: 0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.04);
  --shadow-lg: 0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.04);
  --shadow-xl: 0 20px 25px rgba(15,23,42,0.10), 0 8px 10px rgba(15,23,42,0.05);
  --shadow-glow: 0 0 40px rgba(109,40,217,0.15);

  /* Motion */
  --motion-fast: 150ms ease-out;
  --motion-normal: 250ms ease-in-out;
  --motion-slow: 400ms ease-in-out;

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4C1D95 100%);
  --gradient-cta: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%);
}
```

---

## 11. Tailwind Config (per sito e dashboard)

```javascript
// tailwind.config.js — extend section
{
  colors: {
    ink: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      400: '#94A3B8',
      700: '#475569',
      800: '#334155',
      900: '#1E293B',
      950: '#0F172A',
    },
    violet: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
  },
  fontFamily: {
    sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
  },
  boxShadow: {
    sm: '0 1px 2px rgba(15,23,42,0.05)',
    md: '0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.04)',
    lg: '0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.04)',
    xl: '0 20px 25px rgba(15,23,42,0.10), 0 8px 10px rgba(15,23,42,0.05)',
    glow: '0 0 40px rgba(109,40,217,0.15)',
  },
}
```

---

## 12. Uso nei diversi contesti

| Contesto | Logo | Palette dominante | Template |
|----------|------|---|---|
| Sito web | Full color | ink + violet accent | Sito/Copy |
| Dashboard | Mark (nav) | ink-50 bg + violet CTA | App UI |
| Playbook PDF | Full color header | gradient-hero + white | Playbook |
| Manuale PDF | Full color | white + violet accent | Manuale |
| LinkedIn post | Mark su ink-950 | ink-950 bg + white text | Social |
| Slide/Keynote | White su dark | gradient-hero | Presentazione |
| Email | Full color (small) | white bg + violet CTA | Email |
| Favicon | Mark | ink-950 + violet | - |

---

*108 Vision — Design System v1.0*
