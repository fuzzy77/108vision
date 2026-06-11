import { readFile, readdir, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname, basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(args) {
  const parsed = { input: null, output: null, filter: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      parsed.output = resolve(args[++i]);
    } else if (args[i] === '--filter' && args[i + 1]) {
      parsed.filter = args[++i];
    } else if (!parsed.input) {
      parsed.input = resolve(args[i]);
    }
  }
  return parsed;
}

function matchesFilter(filename, filter) {
  if (!filter) return true;
  const pattern = filter.replace(/\*/g, '.*');
  return new RegExp(pattern, 'i').test(filename);
}

async function collectFiles(inputPath, filter) {
  const info = await stat(inputPath);
  if (info.isFile()) {
    return [inputPath];
  }

  const files = [];
  const defaultFilter = filter || '*Manuale*';

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (extname(entry.name) === '.md' && matchesFilter(entry.name, defaultFilter)) {
        files.push(fullPath);
      }
    }
  }

  await walk(inputPath);
  return files;
}

function numberSections(html) {
  let counter = 0;
  return html.replace(/<h2(\s[^>]*)?>(.*?)<\/h2>/gi, (match, attrs, text) => {
    counter++;
    const num = String(counter).padStart(2, '0');
    return `<h2${attrs || ''}>${num}. ${text}</h2>`;
  });
}

async function buildHtml(mdPath) {
  const raw = await readFile(mdPath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  const title = frontmatter.title || basename(mdPath, '.md').replace(/[-_]/g, ' ');
  const author = frontmatter.author || 'Elios Scoglio';
  const track = frontmatter.track || '';

  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  let htmlContent = marked.parse(content);
  htmlContent = numberSections(htmlContent);

  const templatePath = join(__dirname, 'template.html');
  const stylesPath = join(__dirname, 'styles.css');

  const [template, styles] = await Promise.all([
    readFile(templatePath, 'utf-8'),
    readFile(stylesPath, 'utf-8'),
  ]);

  const finalHtml = template
    .replace('{{title}}', title)
    .replace('{{title}}', title)
    .replace('{{author}}', author)
    .replace('{{track}}', track)
    .replace('{{styles}}', styles)
    .replace('{{content}}', htmlContent);

  return finalHtml;
}

async function generatePdf(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width: 100%; padding: 12px 40px; font-family: 'Inter', system-ui, sans-serif; font-size: 10px; color: #94A3B8; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: #0F172A;">10<span style="color: #6D28D9;">8</span> Vision</span>
        <span></span>
      </div>
    `,
    footerTemplate: `
      <div style="width: 100%; padding: 12px 40px; font-family: 'Inter', system-ui, sans-serif; font-size: 9px; color: #94A3B8; display: flex; justify-content: space-between; align-items: center;">
        <span>108vision.it | Elios Scoglio</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  return outputPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input) {
    console.error('Usage: node md-to-pdf.js <file.md|directory> [--filter "*pattern*"] [--output <dir>]');
    process.exit(1);
  }

  const files = await collectFiles(args.input, args.filter);

  if (files.length === 0) {
    console.error(`No matching .md files found in: ${args.input}`);
    process.exit(1);
  }

  if (args.output) {
    await mkdir(args.output, { recursive: true });
  }

  console.log(`Converting ${files.length} file(s)...\n`);

  for (const mdPath of files) {
    const name = basename(mdPath, '.md');
    const outputDir = args.output || dirname(mdPath);
    const pdfPath = join(outputDir, `${name}.pdf`);

    try {
      const html = await buildHtml(mdPath);
      await generatePdf(html, pdfPath);
      console.log(`  [ok] ${pdfPath}`);
    } catch (err) {
      console.error(`  [err] ${mdPath}: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

main();
