/**
 * Site Audit — standalone ESM script (no build required)
 * Usage: node site-audit-run.mjs <url> [url2 ...]
 */

const PROBE_TIMEOUT_MS = 10_000;
const UA = '108AI-SiteAudit/1.0';

const SECURITY_PATHS = ['/', '/robots.txt', '/sitemap.xml', '/404-not-exist-probe'];
const HEALTH_PATHS   = ['/products.json', '/cart.js', '/blogs/news', '/collections.json'];

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
};

function col(s, ...c) { return c.join('') + s + C.reset; }
function sev(s) {
  return s === 'critical' || s === 'high' ? C.red :
         s === 'medium' ? C.yellow :
         s === 'low'    ? C.dim   : C.cyan;
}
function icon(s) {
  return s === 'critical' || s === 'high' ? '✖' :
         s === 'medium' ? '!' :
         s === 'low'    ? '~' : '✓';
}

// ─── HTTP probe ───────────────────────────────────────────────────────────────
async function probeUrl(url, method = 'GET') {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  const t0   = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*' },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const buf  = await res.arrayBuffer();
    const body = Buffer.from(buf).toString('utf-8').slice(0, 4096);
    const hdrs = {};
    res.headers.forEach((v, k) => { hdrs[k.toLowerCase()] = v; });
    return { ok: true, status: res.status, ttfb: Date.now() - t0, finalUrl: res.url, headers: hdrs, body, size: buf.byteLength };
  } catch (e) {
    return { ok: false, status: 0, ttfb: Date.now() - t0, finalUrl: url, headers: {}, body: '', size: 0, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

async function probeStatus(base, path) {
  const url  = base.replace(/\/$/, '') + path;
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  const t0   = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'User-Agent': UA }, signal: ctrl.signal, redirect: 'follow' });
    await res.text();
    return { path, status: res.status, ttfb: Date.now() - t0 };
  } catch {
    return { path, status: 0, ttfb: Date.now() - t0 };
  } finally {
    clearTimeout(t);
  }
}

// ─── Checks ───────────────────────────────────────────────────────────────────
function checkSecurity(p) {
  const h = p.headers;
  const findings = [];

  // HTTPS
  if (!p.finalUrl.startsWith('https://')) {
    findings.push({ sev: 'critical', cat: 'security', title: 'HTTPS non attivo', detail: 'Traffico in chiaro.', rec: 'Abilitare HTTPS + redirect 301.' });
  }

  // HSTS
  const hsts = h['strict-transport-security'];
  if (!hsts) {
    findings.push({ sev: 'high', cat: 'security', title: 'HSTS assente', detail: 'Strict-Transport-Security mancante.', rec: 'Aggiungere: max-age=31536000; includeSubDomains; preload' });
  } else {
    const ma = parseInt((/max-age=(\d+)/i.exec(hsts) ?? [])[1] ?? '0', 10);
    if (ma < 31536000) {
      findings.push({ sev: 'medium', cat: 'security', title: `HSTS max-age troppo basso (${ma}s)`, detail: hsts, rec: 'Portare max-age ad almeno 31536000.' });
    } else {
      findings.push({ sev: 'info', cat: 'security', title: `HSTS OK (${ma}s)`, detail: hsts });
    }
  }

  // CSP
  const csp = h['content-security-policy'] ?? h['content-security-policy-report-only'];
  if (!csp) {
    findings.push({ sev: 'high', cat: 'security', title: 'Content-Security-Policy assente', detail: 'Vulnerabile a XSS.', rec: "Aggiungere CSP con nonce/hash, evitare 'unsafe-inline'." });
  } else {
    const issues = [];
    if (csp.includes("'unsafe-inline'")) issues.push("'unsafe-inline'");
    if (csp.includes("'unsafe-eval'"))   issues.push("'unsafe-eval'");
    if (csp.includes('*'))               issues.push('wildcard *');
    if (issues.length) {
      findings.push({ sev: 'medium', cat: 'security', title: 'CSP presente ma permissivo', detail: `Direttive rischiose: ${issues.join(', ')}`, rec: 'Rimuovere unsafe-inline, usare nonce.' });
    } else {
      findings.push({ sev: 'info', cat: 'security', title: 'CSP configurato', detail: csp.slice(0, 100) + '…' });
    }
  }

  // X-Frame-Options
  if (!h['x-frame-options'] && !csp?.includes('frame-ancestors')) {
    findings.push({ sev: 'medium', cat: 'security', title: 'X-Frame-Options assente', detail: 'Sito embeddabile via iframe (clickjacking).', rec: 'X-Frame-Options: DENY oppure CSP frame-ancestors.' });
  } else if (h['x-frame-options']) {
    findings.push({ sev: 'info', cat: 'security', title: `X-Frame-Options: ${h['x-frame-options']}`, detail: '' });
  }

  // X-Content-Type-Options
  if (!h['x-content-type-options']) {
    findings.push({ sev: 'low', cat: 'security', title: 'X-Content-Type-Options assente', detail: 'MIME sniffing possibile.', rec: 'Aggiungere: X-Content-Type-Options: nosniff' });
  } else {
    findings.push({ sev: 'info', cat: 'security', title: `X-Content-Type-Options: ${h['x-content-type-options']}`, detail: '' });
  }

  // Referrer-Policy
  if (!h['referrer-policy']) {
    findings.push({ sev: 'low', cat: 'security', title: 'Referrer-Policy assente', detail: 'URL completo inviato ai siti terzi come Referer.', rec: 'Referrer-Policy: strict-origin-when-cross-origin' });
  } else {
    findings.push({ sev: 'info', cat: 'security', title: `Referrer-Policy: ${h['referrer-policy']}`, detail: '' });
  }

  // Permissions-Policy
  if (!h['permissions-policy']) {
    findings.push({ sev: 'low', cat: 'security', title: 'Permissions-Policy assente', detail: 'App terze parti (iframe) possono accedere a camera/microfono/geolocalizzazione.', rec: 'Permissions-Policy: camera=(), microphone=(), geolocation=()' });
  }

  // Info leakage
  if (h['x-powered-by']) {
    findings.push({ sev: 'low', cat: 'security', title: `X-Powered-By: ${h['x-powered-by']}`, detail: 'Espone stack tecnologico.', rec: 'Rimuovere header X-Powered-By.' });
  }
  if (h['server'] && /\d/.test(h['server'])) {
    findings.push({ sev: 'low', cat: 'security', title: `Server con versione: ${h['server']}`, detail: 'Espone versione software.', rec: 'Configurare server header generico.' });
  }

  return findings;
}

function checkPerformance(p) {
  const h = p.headers;
  const findings = [];

  // TTFB
  if      (p.ttfb > 3000) findings.push({ sev: 'high',   cat: 'performance', title: `TTFB molto alto: ${p.ttfb}ms`, detail: 'Il browser aspetta > 3s prima del primo byte.', rec: 'Abilitare CDN edge cache. Ottimizzare query lente.' });
  else if (p.ttfb > 1500) findings.push({ sev: 'medium', cat: 'performance', title: `TTFB elevato: ${p.ttfb}ms`, detail: 'Google raccomanda < 800ms.', rec: 'Ottimizzare caching server-side.' });
  else if (p.ttfb > 800)  findings.push({ sev: 'info',   cat: 'performance', title: `TTFB accettabile: ${p.ttfb}ms`, detail: 'Margine di miglioramento con caching aggressivo.' });
  else                     findings.push({ sev: 'info',   cat: 'performance', title: `TTFB ottimo: ${p.ttfb}ms`, detail: 'Rispetta soglie Core Web Vitals.' });

  // Compression
  const enc = h['content-encoding'];
  if (!enc) {
    findings.push({ sev: 'medium', cat: 'performance', title: 'Compressione HTTP assente', detail: 'Risposta non compressa (gzip/brotli).', rec: 'Abilitare brotli/gzip sul CDN/server.' });
  } else {
    findings.push({ sev: 'info', cat: 'performance', title: `Compressione: ${enc}`, detail: 'Trasferimento dati ottimizzato.' });
  }

  // CDN detection
  const cdnHeaders = { 'cf-ray': 'Cloudflare', 'x-amz-cf-id': 'AWS CloudFront', 'x-fastly-request-id': 'Fastly', 'x-vercel-id': 'Vercel', 'x-cache': 'Cache layer' };
  const cdnFound = Object.entries(cdnHeaders).find(([k]) => h[k]);
  if (cdnFound) {
    findings.push({ sev: 'info', cat: 'performance', title: `CDN: ${cdnFound[1]}`, detail: `${cdnFound[0]}: ${h[cdnFound[0]]}` });
  } else {
    // Check Shopify-specific
    if (h['x-shopify-stage'] || h['x-request-id']?.includes('shopify') || p.finalUrl.includes('myshopify')) {
      findings.push({ sev: 'info', cat: 'performance', title: 'CDN: Shopify CDN (Fastly)', detail: 'Hosting Shopify include CDN globale.' });
    } else {
      findings.push({ sev: 'medium', cat: 'performance', title: 'CDN non identificato', detail: 'Nessun header CDN riconosciuto.', rec: 'Valutare Cloudflare o Fastly per ridurre latenza globale.' });
    }
  }

  // Cache-Control
  const cc = h['cache-control'] ?? '';
  if (!cc || cc.includes('no-store') || cc.includes('no-cache')) {
    findings.push({ sev: 'low', cat: 'performance', title: `Cache-Control: "${cc || 'assente'}"`, detail: 'Homepage non cacheable o cache disabilitata.', rec: 'Usare stale-while-revalidate per HTML.' });
  } else {
    findings.push({ sev: 'info', cat: 'performance', title: `Cache-Control: ${cc}`, detail: '' });
  }

  // Response size
  if (p.size > 500_000) {
    findings.push({ sev: 'medium', cat: 'performance', title: `Risposta HTML pesante: ${Math.round(p.size/1024)}KB`, detail: 'Pagina > 500KB suggerisce JS inline o contenuto non ottimizzato.', rec: 'Abilitare Brotli, lazy loading, split CSS/JS.' });
  }

  // Stack detection
  const stackHints = [];
  if (h['x-shopify-stage'])         stackHints.push('Shopify');
  if (h['x-wix-request-id'])        stackHints.push('Wix');
  if (h['x-wp-total'])              stackHints.push('WordPress');
  if (h['server']?.includes('nginx')) stackHints.push('Nginx');
  if (h['server']?.includes('apache')) stackHints.push('Apache');
  if (p.body.includes('cdn.shopify.com')) stackHints.push('Shopify (body)');
  if (p.body.includes('wp-content')) stackHints.push('WordPress (body)');
  if (stackHints.length) {
    findings.push({ sev: 'info', cat: 'performance', title: `Stack rilevato: ${[...new Set(stackHints)].join(', ')}`, detail: '' });
  }

  return findings;
}

function checkResilience(main, paths) {
  const findings = [];

  if (!main.ok || main.status === 0) {
    findings.push({ sev: 'critical', cat: 'resilience', title: 'Sito non raggiungibile', detail: main.error ?? 'Timeout o connessione rifiutata.', rec: 'Verificare DNS, server, firewall.' });
    return findings;
  }

  if (main.status >= 500) {
    findings.push({ sev: 'critical', cat: 'resilience', title: `Homepage → HTTP ${main.status}`, detail: 'Errore server sulla homepage.', rec: 'Controllare log server, dipendenze, DB.' });
  } else if (main.status >= 400) {
    findings.push({ sev: 'high', cat: 'resilience', title: `Homepage → HTTP ${main.status}`, detail: 'La homepage non è accessibile.', rec: 'Verificare configurazione server e DNS.' });
  } else {
    findings.push({ sev: 'info', cat: 'resilience', title: `Homepage → HTTP ${main.status}`, detail: `TTFB ${main.ttfb}ms → ${main.finalUrl}` });
  }

  // 5xx su health paths
  const failing5xx = paths.filter(p => HEALTH_PATHS.includes(p.path) && p.status >= 500);
  if (failing5xx.length) {
    findings.push({ sev: 'high', cat: 'resilience', title: `Endpoint con 5xx: ${failing5xx.map(p => p.path).join(', ')}`, detail: failing5xx.map(p => `${p.path} → ${p.status} (${p.ttfb}ms)`).join(' | '), rec: 'Audit app di terze parti. Verificare conflitti nel tema.' });
  }

  // Soft 404
  const probe404 = paths.find(p => p.path === '/404-not-exist-probe');
  if (probe404?.status === 200) {
    findings.push({ sev: 'medium', cat: 'resilience', title: 'Soft 404 rilevato', detail: 'URL inesistente risponde HTTP 200 invece di 404.', rec: 'Configurare pagine 404 con status HTTP corretto.' });
  } else if (probe404) {
    findings.push({ sev: 'info', cat: 'resilience', title: `404 handler: HTTP ${probe404.status}`, detail: 'Il server gestisce correttamente le URL inesistenti.' });
  }

  // robots.txt
  const robots = paths.find(p => p.path === '/robots.txt');
  if (robots?.status === 200) {
    findings.push({ sev: 'info', cat: 'resilience', title: `robots.txt → HTTP ${robots.status} (${robots.ttfb}ms)`, detail: '' });
  } else {
    findings.push({ sev: 'low', cat: 'resilience', title: `robots.txt → HTTP ${robots?.status ?? 0}`, detail: 'Crawler indicizzano tutto senza limitazioni.', rec: 'Creare robots.txt con Disallow su /cart, /checkout, /account.' });
  }

  // sitemap.xml
  const sitemap = paths.find(p => p.path === '/sitemap.xml');
  if (sitemap?.status === 200) {
    findings.push({ sev: 'info', cat: 'resilience', title: `sitemap.xml → HTTP ${sitemap.status} (${sitemap.ttfb}ms)`, detail: '' });
  } else {
    findings.push({ sev: 'low', cat: 'resilience', title: `sitemap.xml → HTTP ${sitemap?.status ?? 0}`, detail: 'Sitemap non disponibile.', rec: 'Generare e publicare sitemap.xml.' });
  }

  // Path lenti
  const slow = paths.filter(p => p.ttfb > 3000 && p.status < 500 && p.status > 0);
  if (slow.length) {
    findings.push({ sev: 'medium', cat: 'resilience', title: `Path lenti (>3s): ${slow.map(p => p.path).join(', ')}`, detail: slow.map(p => `${p.path} ${p.ttfb}ms`).join(' | '), rec: 'Abilitare caching per questi path.' });
  }

  // Status di tutti i path
  for (const p of paths.filter(p => SECURITY_PATHS.concat(HEALTH_PATHS).includes(p.path) && p.path !== '/404-not-exist-probe')) {
    const isExpected = p.path === '/robots.txt' || p.path === '/sitemap.xml' || p.path === '/' ? 200 : null;
    const s = p.status >= 500 ? 'high' : p.status >= 400 ? 'medium' : 'info';
    if (!findings.some(f => f.detail?.includes(p.path) || f.title?.includes(p.path))) {
      findings.push({ sev: s, cat: 'resilience', title: `${p.path} → HTTP ${p.status} (${p.ttfb}ms)`, detail: '' });
    }
  }

  return findings;
}

function checkSeo(p) {
  const body = p.body.toLowerCase();
  const findings = [];

  if (!body.includes('rel="canonical"') && !body.includes("rel='canonical'")) {
    findings.push({ sev: 'medium', cat: 'seo', title: 'Tag canonical assente', detail: 'Contenuti duplicati possono causare penalizzazioni.', rec: 'Aggiungere <link rel="canonical"> in ogni pagina.' });
  } else {
    findings.push({ sev: 'info', cat: 'seo', title: 'Tag canonical presente', detail: '' });
  }

  if (!body.includes('application/ld+json')) {
    findings.push({ sev: 'medium', cat: 'seo', title: 'Structured data (JSON-LD) assente', detail: 'Senza schema markup Google non genera rich results.', rec: 'Aggiungere JSON-LD: Product, BreadcrumbList, Organization.' });
  } else {
    findings.push({ sev: 'info', cat: 'seo', title: 'Structured data (JSON-LD) presente', detail: '' });
  }

  if (!body.includes('property="og:') && !body.includes("property='og:")) {
    findings.push({ sev: 'low', cat: 'seo', title: 'Open Graph tags assenti', detail: 'Anteprime social subottimali.', rec: 'Aggiungere og:title, og:description, og:image.' });
  } else {
    findings.push({ sev: 'info', cat: 'seo', title: 'Open Graph tags presenti', detail: '' });
  }

  if (!body.includes('name="description"') && !body.includes("name='description'")) {
    findings.push({ sev: 'low', cat: 'seo', title: 'Meta description assente', detail: 'Google genera snippet arbitrario.', rec: '120-160 caratteri per ogni pagina.' });
  } else {
    findings.push({ sev: 'info', cat: 'seo', title: 'Meta description presente', detail: '' });
  }

  return findings;
}

// ─── Score ────────────────────────────────────────────────────────────────────
function score(findings) {
  const w = { critical: 25, high: 15, medium: 7, low: 3, info: 0 };
  const ded = findings.filter(f => f.sev !== 'info').reduce((s, f) => s + (w[f.sev] ?? 0), 0);
  const sc = Math.max(0, 100 - ded);
  const grade = sc >= 90 ? 'A' : sc >= 75 ? 'B' : sc >= 60 ? 'C' : sc >= 45 ? 'D' : 'F';
  return { score: sc, grade };
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render(url, main, findings, duration) {
  const { score: sc, grade } = score(findings);
  const gc = sc >= 75 ? C.green : sc >= 50 ? C.yellow : C.red;

  const counts = {
    critical: findings.filter(f => f.sev === 'critical').length,
    high:     findings.filter(f => f.sev === 'high').length,
    medium:   findings.filter(f => f.sev === 'medium').length,
    low:      findings.filter(f => f.sev === 'low').length,
    info:     findings.filter(f => f.sev === 'info').length,
  };

  const lines = [''];
  lines.push(col(`  SITE AUDIT — ${url}`, C.bold));
  lines.push(col(`  ${duration}ms totali`, C.dim));
  lines.push('');
  lines.push(`  Grade: ${gc}${C.bold}${grade}${C.reset}  Score: ${gc}${sc}/100${C.reset}`);
  lines.push(
    `  ${C.red}${counts.critical} critico  ${counts.high} alto${C.reset}  ` +
    `${C.yellow}${counts.medium} medio${C.reset}  ` +
    `${C.dim}${counts.low} basso${C.reset}  ` +
    `${C.cyan}${counts.info} info${C.reset}`
  );
  if (main.ok) {
    lines.push('');
    lines.push(col(`  HTTP ${main.status}  TTFB ${main.ttfb}ms  ${main.finalUrl}`, C.dim));
  }

  const cats = [
    { key: 'security',    label: 'SECURITY',    color: C.magenta },
    { key: 'performance', label: 'PERFORMANCE', color: C.blue },
    { key: 'resilience',  label: 'RESILIENZA',  color: C.cyan },
    { key: 'seo',         label: 'SEO',         color: C.green },
  ];

  for (const cat of cats) {
    const catF    = findings.filter(f => f.cat === cat.key && f.sev !== 'info');
    const catInfo = findings.filter(f => f.cat === cat.key && f.sev === 'info');
    if (!catF.length && !catInfo.length) continue;
    lines.push('');
    lines.push(col(`  ${cat.label}`, cat.color, C.bold));
    lines.push(col(`  ${'─'.repeat(52)}`, C.dim));
    for (const f of catF) {
      lines.push(`  ${sev(f.sev)}${icon(f.sev)} ${C.bold}${f.title}${C.reset}`);
      if (f.detail) lines.push(col(`    ${f.detail}`, C.dim));
      if (f.rec)    lines.push(`    ${C.cyan}→ ${f.rec}${C.reset}`);
    }
    for (const f of catInfo) {
      lines.push(`  ${C.cyan}✓ ${C.dim}${f.title}${C.reset}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function audit(rawUrl) {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const base = url.replace(/\/$/, '');

  const t0 = Date.now();
  process.stdout.write(`\n  Auditing ${col(base, C.bold, C.cyan)} ...\n`);

  const [main, ...paths] = await Promise.all([
    probeUrl(base),
    ...[...SECURITY_PATHS, ...HEALTH_PATHS].map(p => probeStatus(base, p)),
  ]);

  const findings = [
    ...checkSecurity(main),
    ...checkPerformance(main),
    ...checkResilience(main, paths),
    ...checkSeo(main),
  ];

  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => order[a.sev] - order[b.sev]);

  const duration = Date.now() - t0;
  console.log(render(url, main, findings, duration));

  // JSON output
  const out = {
    url, timestamp: new Date().toISOString(), durationMs: duration,
    summary: {
      score: score(findings).score,
      grade: score(findings).grade,
      critical: findings.filter(f => f.sev === 'critical').length,
      high:     findings.filter(f => f.sev === 'high').length,
      medium:   findings.filter(f => f.sev === 'medium').length,
      low:      findings.filter(f => f.sev === 'low').length,
    },
    findings: findings.filter(f => f.sev !== 'info'),
    rawHeaders: main.headers,
  };
  return out;
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────
const urls = process.argv.slice(2);
if (!urls.length) {
  console.error('Usage: node site-audit-run.mjs <url> [url2 ...]\nExample: node site-audit-run.mjs veralab.it overskin.com');
  process.exit(1);
}

for (const url of urls) {
  await audit(url);
}
