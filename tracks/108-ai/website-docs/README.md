# AIA Website - Elios Scoglio Consulting

Sito web portfolio per consulenza AI & Technology.

## Stack

- **Astro 5** - Static Site Generator
- **TinaCMS** - Git-based visual CMS
- **Tailwind CSS 4** - Utility-first CSS
- **Vercel** - Hosting (free tier)
- **TypeScript** - Type safety

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server with TinaCMS
npx tinacms dev -c "astro dev"

# Or just Astro (without CMS)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  components/    # Reusable Astro components
  layouts/       # Page layouts (Base, Service, Blog)
  pages/         # File-based routing
  styles/        # Global CSS + Tailwind config
content/
  blog/          # Blog posts (Markdown)
  global/        # Site settings (JSON)
  pages/         # Service page content (MDX)
tina/
  config.ts      # TinaCMS schema definition
public/
  favicon.svg    # Site icon
  robots.txt     # SEO robots
```

## Environment Variables

For TinaCMS cloud mode:

```env
TINA_CLIENT_ID=your-client-id
TINA_TOKEN=your-token
TINA_BRANCH=main
```

## Deployment

The site auto-deploys to Vercel on push to `main`. Alternatively, use:

```bash
npm run build
# Output in dist/
```

## TinaCMS Admin

Access the CMS admin at `/admin` after deployment. In development, it runs alongside the dev server.

## License

Private - All rights reserved.
