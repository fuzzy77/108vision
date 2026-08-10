import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.108vision.it',
  output: 'static',
  adapter: vercel(),
  redirects: {
    '/wellbeing-app': '/wellbeing',
    '/en/wellbeing-app': '/en/wellbeing',
    '/fractional-cto': '/direzione-tecnica',
    '/en/fractional-cto': '/en/direzione-tecnica',
    '/factory': '/software-in-mano',
    '/en/factory': '/en/software-in-mano',
    '/sviluppo-progetto': '/software-in-mano',
    '/en/sviluppo-progetto': '/en/software-in-mano',
    '/sviluppo': '/software-in-mano',
    '/en/sviluppo': '/en/software-in-mano',
  },
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
