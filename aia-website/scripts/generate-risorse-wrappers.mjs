import fs from 'fs';
import path from 'path';

const slugs = fs
  .readdirSync('src/pages/risorse')
  .filter((f) => f.startsWith('guida-') && f.endsWith('.astro'))
  .map((f) => f.replace('.astro', ''));

const itWrapper = (slug) => `---
import LeadMagnetPage from '@/components/pages/LeadMagnetPage.astro';
---

<LeadMagnetPage locale="it" magnetSlug="${slug}" />
`;

const enWrapper = (slug) => `---
import LeadMagnetPage from '@/components/pages/LeadMagnetPage.astro';
---

<LeadMagnetPage locale="en" magnetSlug="${slug}" />
`;

for (const slug of slugs) {
  fs.writeFileSync(path.join('src/pages/risorse', `${slug}.astro`), itWrapper(slug), 'utf8');
  const enDir = path.join('src/pages/en/risorse');
  fs.mkdirSync(enDir, { recursive: true });
  fs.writeFileSync(path.join(enDir, `${slug}.astro`), enWrapper(slug), 'utf8');
}

fs.writeFileSync(
  'src/pages/risorse/index.astro',
  `---
import RisorseIndexPage from '@/components/pages/RisorseIndexPage.astro';
---

<RisorseIndexPage locale="it" />
`,
  'utf8',
);

fs.writeFileSync(
  'src/pages/risorse/grazie.astro',
  `---
import GraziePage from '@/components/pages/GraziePage.astro';
---

<GraziePage locale="it" />
`,
  'utf8',
);

fs.writeFileSync(
  'src/pages/en/risorse/index.astro',
  `---
import RisorseIndexPage from '@/components/pages/RisorseIndexPage.astro';
---

<RisorseIndexPage locale="en" />
`,
  'utf8',
);

fs.writeFileSync(
  'src/pages/en/risorse/grazie.astro',
  `---
import GraziePage from '@/components/pages/GraziePage.astro';
---

<GraziePage locale="en" />
`,
  'utf8',
);

console.log(`Updated ${slugs.length} guides + index + grazie`);
