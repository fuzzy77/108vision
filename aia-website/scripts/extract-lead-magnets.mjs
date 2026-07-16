import fs from 'fs';
import path from 'path';

const dir = path.join('src', 'pages', 'risorse');
const files = fs.readdirSync(dir).filter((f) => f.startsWith('guida-') && f.endsWith('.astro'));

function extractProp(content, key) {
  const re = new RegExp(`${key}="([^"]+)"`);
  const m = content.match(re);
  return m ? m[1] : '';
}

function extractBullets(content) {
  const m = content.match(/bullets=\{\[([\s\S]*?)\]\}/);
  if (!m) return [];
  return [...m[1].matchAll(/'((?:\\'|[^'])*)'/g)].map((x) => x[1].replace(/\\'/g, "'"));
}

const items = files.sort().map((file) => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  return {
    slug: file.replace('.astro', ''),
    title: extractProp(content, 'title'),
    description: extractProp(content, 'description'),
    pdfSlug: extractProp(content, 'pdfSlug'),
    heroTitle: extractProp(content, 'heroTitle'),
    heroSubtitle: extractProp(content, 'heroSubtitle'),
    bullets: extractBullets(content),
  };
});

console.log(JSON.stringify(items, null, 2));
