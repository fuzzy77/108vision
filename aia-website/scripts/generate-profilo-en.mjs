import fs from 'fs';
import path from 'path';

const slugs = ['full-stack-ai', 'software-manager', 'team-leader'];
const enDir = path.join('src/pages/en/profilo');
fs.mkdirSync(enDir, { recursive: true });

for (const slug of slugs) {
  fs.writeFileSync(
    path.join(enDir, `${slug}.astro`),
    `---
import ProfiloPage from '@/components/pages/ProfiloPage.astro';
---

<ProfiloPage locale="en" profileSlug="${slug}" />
`,
    'utf8',
  );
}

console.log('Created EN profilo wrappers');
