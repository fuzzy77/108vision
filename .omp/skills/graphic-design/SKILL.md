---
name: graphic-design
description: Visual/graphic design guidelines for 108 Vision — typography, color, layout, brand, asset export, design-to-code via Figma.
---

# Graphic Design — 108 Vision

## Quando usare

Attiva `/skill:graphic-design` per: scelta di palette/tipografia, layout di schermate o landing, gerarchia visiva, export di asset, o quando converti un design Figma in codice (React Native/Astro).

## Principi (prima di ogni scelta)

1. **Gerarchia** — un solo elemento domina; il resto si ordina per importanza.
2. **Contrasto** — il testo deve leggersi (WCAG AA: ratio ≥ 4.5:1 corpo, ≥ 3:1 grandi).
3. **Allineamento** — tutto su una griglia; niente elementi "quasi" allineati.
4. **Prossimità** — elementi correlati vicini; usa lo spazio, non i bordi, per raggruppare.
5. **Coerenza** — una palette, una scala tipografica, un radius system ovunque.

## Tipografia

- Scala limitata (es. 12 / 14 / 16 / 20 / 24 / 32) — non inventare misure.
- Massimo 2 font: uno display (titoli) + uno text (corpo).
- Interlinea ~1.4–1.5 sul corpo; `fontWeight` solo per enfasi reale.

## Colore

- Regola **60-30-10**: 60% neutro, 30% secondario, 10% accento.
- Definisci **token** (non valori sparsi): `bg`, `surface`, `text`, `primary`, `accent`, `border`, `success`, `danger`.
- Contrasto testo/sfondo verificato su ogni coppia.
- Brand 108 Vision: fonte di verità in `tracks/brand/design-system.md` (palette slate + primary blue). Per l'app `aia-app/` i token sono in `src/lib/theme.ts`.

## Layout e spaziatura

- Scala di spacing fissa (es. 4/8/16/24/32) — mai padding "a occhio".
- Radius system (sm/md/lg) coerente tra card, input, bottoni.
- Griglia 12 colonne su web; su mobile pensa a colonna singola con card.
- Touch target mobile ≥ 44×44 pt.

## Asset e export

| Asset | Formato | Note |
|---|---|---|
| Icone UI | SVG (web) / PNG @1x @2x @3x (mobile) | `@expo/vector-icons` o asset statici |
| Foto/immagini | WebP (web), JPEG/PNG | compress prima del commit |
| Logo/splash | PNG con trasparenza | dimensioni da `app.json` |
| Favicon | PNG 32/180 | `assets/images/favicon.png` |

## Design-to-code (Figma → codice)

1. Leggi il design con **Figma MCP** (`figma-developer-mcp` o `Figma-Context-MCP`): componenti, token, spacing.
2. Estrai i **token** prima del markup (colori, typography, spacing) — non hardcodare valori dal canvas.
3. Costruisci un **componente riusabile** per pattern ripetuti (card, button, input).
4. Verifica visivamente: `browser` (web) o screenshot via Expo MCP (mobile); `inspect_image` per analizzare il risultato.

## Accessibilità (non opzionale)

- Contrasto AA su tutto il testo.
- Stati `disabled`/`focus`/`hover` visibili, non solo colore.
- Testo alternativo su immagini informative.
- Riduci l'animazione con `prefers-reduced-motion`.

## Checklist di consegna

- [ ] Una sola palette + token coerenti
- [ ] Scala tipografica e di spacing rispettate
- [ ] Contrasto AA verificato
- [ ] Asset compressi e nei formati giusti
- [ ] Verifica visiva reale (screenshot/browser), non "a occhio"
