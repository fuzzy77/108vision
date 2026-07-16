/**
 * Site Audit capability — Security, Performance, Resilience checks.
 *
 * Runs all probes in parallel via Promise.allSettled — a slow or failing
 * probe never blocks the rest of the report.
 *
 * Usage (capability):
 *   site.audit  { url: "https://veralab.it" }
 *
 * Usage (CLI intent, via local-router):
 *   108ai audit https://veralab.it
 */

import { isIP } from 'node:net';
import type { AgentConfig } from '../config.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 10_000;
const USER_AGENT = '108AI-SiteAudit/1.0';

// Paths probed for resilience / error detection
const RESILIENCE_PATHS = [
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/404-intentional-probe-do-not-serve', // should 404
];

// Paths that should NOT return 5xx on Shopify / standard stacks
const HEALTH_PATHS = [
  '/products.json',
  '/cart.js',
  '/collections.json',
];

// ─── Public types ─────────────────────────────────────────────────────────────

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditFinding {
  id: string;
  category: 'security' | 'performance' | 'resilience' | 'seo';
  severity: AuditSeverity;
  title: string;
  detail: string;
  recommendation?: string;
}

export interface ProbeResult {
  url: string;
  status: number;
  ttfbMs: number;
  redirectCount: number;
  finalUrl: string;
  headers: Record<string, string>;
  bodySnippet: string;
  contentLength: number;
  error?: string;
}

export interface SiteAuditReport {
  url: string;
  timestamp: string;
  durationMs: number;
  summary: {
    score: number;          // 0-100
    grade: string;          // A-F
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  probe: ProbeResult | null;
  findings: AuditFinding[];
  rawHeaders: Record<string, string>;
}

// ─── HTTP Probe ───────────────────────────────────────────────────────────────

async function probe(rawUrl: string): Promise<ProbeResult> {
  const url = normalizeUrl(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  const start = Date.now();
  let redirectCount = 0;
  let finalUrl = url;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json,*/*' },
      signal: controller.signal,
      redirect: 'follow',
    });

    const ttfbMs = Date.now() - start;
    finalUrl = res.url ?? url;
    redirectCount = countRedirects(url, finalUrl);

    const buffer = await res.arrayBuffer();
    const body = Buffer.from(buffer).toString('utf-8').slice(0, 4096);

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

    return {
      url,
      status: res.status,
      ttfbMs,
      redirectCount,
      finalUrl,
      headers,
      bodySnippet: body,
      contentLength: buffer.byteLength,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ttfbMs: Date.now() - start,
      redirectCount,
      finalUrl,
      headers: {},
      bodySnippet: '',
      contentLength: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeStatus(baseUrl: string, path: string): Promise<{ path: string; status: number; ttfbMs: number }> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });
    await res.text(); // consume body
    return { path, status: res.status, ttfbMs: Date.now() - start };
  } catch {
    return { path, status: 0, ttfbMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Security checks ─────────────────────────────────────────────────────────

function checkSecurity(p: ProbeResult): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const h = p.headers;

  // HTTPS
  if (!p.url.startsWith('https://') && !p.finalUrl.startsWith('https://')) {
    findings.push({
      id: 'sec-no-https',
      category: 'security',
      severity: 'critical',
      title: 'HTTPS non attivo',
      detail: 'Il sito non usa HTTPS. Tutto il traffico è in chiaro.',
      recommendation: 'Abilitare HTTPS e configurare redirect permanente HTTP → HTTPS.',
    });
  } else if (p.url.startsWith('http://') && p.finalUrl.startsWith('https://')) {
    findings.push({
      id: 'sec-http-redirect',
      category: 'security',
      severity: 'medium',
      title: 'HTTP non redirige automaticamente a HTTPS',
      detail: `L'URL HTTP originale viene servito prima del redirect. Redirect count: ${p.redirectCount}.`,
      recommendation: 'Configurare un redirect 301 permanente da HTTP a HTTPS.',
    });
  }

  // HSTS
  const hsts = h['strict-transport-security'];
  if (!hsts) {
    findings.push({
      id: 'sec-no-hsts',
      category: 'security',
      severity: 'high',
      title: 'HSTS assente',
      detail: 'L\'header Strict-Transport-Security non è presente. I browser possono essere degradati a HTTP.',
      recommendation: 'Aggiungere: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    });
  } else {
    const maxAgeMatch = /max-age=(\d+)/i.exec(hsts);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]!, 10) : 0;
    if (maxAge < 31_536_000) {
      findings.push({
        id: 'sec-hsts-short',
        category: 'security',
        severity: 'medium',
        title: `HSTS max-age troppo basso (${maxAge}s)`,
        detail: `Il valore attuale è ${maxAge} secondi. Il minimo raccomandato è 31536000 (1 anno).`,
        recommendation: 'Aumentare max-age ad almeno 31536000 e aggiungere includeSubDomains.',
      });
    } else {
      findings.push({
        id: 'sec-hsts-ok',
        category: 'security',
        severity: 'info',
        title: 'HSTS configurato correttamente',
        detail: `max-age=${maxAge}${hsts.includes('includeSubDomains') ? ', includeSubDomains' : ''}${hsts.includes('preload') ? ', preload' : ''}.`,
      });
    }
  }

  // CSP
  const csp = h['content-security-policy'] ?? h['content-security-policy-report-only'];
  if (!csp) {
    findings.push({
      id: 'sec-no-csp',
      category: 'security',
      severity: 'high',
      title: 'Content-Security-Policy assente',
      detail: 'Senza CSP il sito è vulnerabile a XSS. Particolarmente critico con molte app di terze parti (Shopify, Jebbit, etc.).',
      recommendation: 'Implementare CSP con almeno: default-src \'self\'; script-src con nonce o hash.',
    });
  } else {
    const issues: string[] = [];
    if (csp.includes("'unsafe-inline'")) issues.push("'unsafe-inline' permette XSS inline");
    if (csp.includes("'unsafe-eval'"))  issues.push("'unsafe-eval' permette code injection via eval()");
    if (csp.includes('*'))              issues.push("wildcard '*' annulla la protezione");

    if (issues.length > 0) {
      findings.push({
        id: 'sec-csp-weak',
        category: 'security',
        severity: 'medium',
        title: 'CSP presente ma con direttive permissive',
        detail: issues.join('; '),
        recommendation: 'Sostituire unsafe-inline con nonce/hash. Rimuovere wildcard.',
      });
    } else {
      findings.push({
        id: 'sec-csp-ok',
        category: 'security',
        severity: 'info',
        title: 'Content-Security-Policy presente',
        detail: csp.slice(0, 120) + (csp.length > 120 ? '…' : ''),
      });
    }
  }

  // X-Frame-Options
  const xfo = h['x-frame-options'];
  const cspFrameAncestors = csp?.includes('frame-ancestors');
  if (!xfo && !cspFrameAncestors) {
    findings.push({
      id: 'sec-no-xfo',
      category: 'security',
      severity: 'medium',
      title: 'X-Frame-Options assente',
      detail: 'Il sito può essere incluso in iframe da siti terzi (clickjacking).',
      recommendation: 'Aggiungere: X-Frame-Options: DENY  oppure  CSP: frame-ancestors \'none\'',
    });
  }

  // X-Content-Type-Options
  if (!h['x-content-type-options']) {
    findings.push({
      id: 'sec-no-xcto',
      category: 'security',
      severity: 'low',
      title: 'X-Content-Type-Options assente',
      detail: 'I browser possono fare MIME-sniffing e interpretare risorse con tipo errato.',
      recommendation: 'Aggiungere: X-Content-Type-Options: nosniff',
    });
  }

  // Referrer-Policy
  if (!h['referrer-policy']) {
    findings.push({
      id: 'sec-no-rp',
      category: 'security',
      severity: 'low',
      title: 'Referrer-Policy assente',
      detail: 'Il browser invia l\'URL completo come Referer a siti terzi, incluso path e query string.',
      recommendation: 'Aggiungere: Referrer-Policy: strict-origin-when-cross-origin',
    });
  }

  // Permissions-Policy
  if (!h['permissions-policy']) {
    findings.push({
      id: 'sec-no-pp',
      category: 'security',
      severity: 'low',
      title: 'Permissions-Policy assente',
      detail: 'Senza policy, le app di terze parti (iframe) possono accedere a camera, microfono, geolocalizzazione.',
      recommendation: 'Aggiungere: Permissions-Policy: camera=(), microphone=(), geolocation=()',
    });
  }

  // Server header (info leakage)
  const server = h['server'];
  if (server && /\d/.test(server)) {
    findings.push({
      id: 'sec-server-version',
      category: 'security',
      severity: 'low',
      title: 'Header Server espone versione software',
      detail: `Server: ${server}`,
      recommendation: 'Configurare il server per restituire solo il nome generico senza versione.',
    });
  }

  // X-Powered-By
  if (h['x-powered-by']) {
    findings.push({
      id: 'sec-xpb',
      category: 'security',
      severity: 'low',
      title: 'X-Powered-By espone stack tecnologico',
      detail: `X-Powered-By: ${h['x-powered-by']}`,
      recommendation: 'Rimuovere l\'header X-Powered-By dalla configurazione del server.',
    });
  }

  return findings;
}

// ─── Performance checks ───────────────────────────────────────────────────────

function checkPerformance(p: ProbeResult): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const h = p.headers;

  // TTFB
  if (p.ttfbMs > 3000) {
    findings.push({
      id: 'perf-ttfb-critical',
      category: 'performance',
      severity: 'high',
      title: `TTFB molto alto: ${p.ttfbMs}ms`,
      detail: 'Time To First Byte > 3s. L\'utente aspetta 3+ secondi prima che il browser riceva il primo byte.',
      recommendation: 'Verificare latenza server, query DB lente, cache miss. Abilitare CDN edge caching.',
    });
  } else if (p.ttfbMs > 1500) {
    findings.push({
      id: 'perf-ttfb-high',
      category: 'performance',
      severity: 'medium',
      title: `TTFB elevato: ${p.ttfbMs}ms`,
      detail: 'Time To First Byte > 1.5s. Google raccomanda < 800ms per un buon Core Web Vitals.',
      recommendation: 'Ottimizzare caching server-side (Redis/CDN). Ridurre elaborazione lato server.',
    });
  } else if (p.ttfbMs > 800) {
    findings.push({
      id: 'perf-ttfb-ok',
      category: 'performance',
      severity: 'info',
      title: `TTFB accettabile: ${p.ttfbMs}ms`,
      detail: 'Nella fascia 800ms–1.5s. Margine di miglioramento con caching aggressivo.',
    });
  } else {
    findings.push({
      id: 'perf-ttfb-good',
      category: 'performance',
      severity: 'info',
      title: `TTFB ottimo: ${p.ttfbMs}ms`,
      detail: 'Time To First Byte < 800ms. Rispetta le soglie Google Core Web Vitals.',
    });
  }

  // HTTP/2
  const altSvc = h['alt-svc'] ?? '';
  const via = h['via'] ?? '';
  const http2 = altSvc.includes('h2') || altSvc.includes('h3') || via.includes('HTTP/2');
  if (!http2) {
    findings.push({
      id: 'perf-no-http2',
      category: 'performance',
      severity: 'medium',
      title: 'HTTP/2 non rilevato',
      detail: 'HTTP/2 abilita multiplexing e header compression. Su siti con molte risorse riduce il carico del 20-40%.',
      recommendation: 'Abilitare HTTP/2 sul web server (Nginx, Apache, CDN). Su Shopify è abilitato di default — potrebbe essere un CDN intermedio.',
    });
  } else {
    findings.push({
      id: 'perf-http2-ok',
      category: 'performance',
      severity: 'info',
      title: 'HTTP/2 o HTTP/3 attivo',
      detail: altSvc || via,
    });
  }

  // Compression
  const encoding = h['content-encoding'] ?? '';
  if (!encoding) {
    findings.push({
      id: 'perf-no-compression',
      category: 'performance',
      severity: 'medium',
      title: 'Compressione HTTP assente',
      detail: 'L\'HTML non viene compresso (gzip/brotli). Per pagine > 100KB il trasferimento è inutilmente lento.',
      recommendation: 'Abilitare gzip o brotli sul server/CDN. Su Shopify è attivo per default — controllare proxy intermedi.',
    });
  } else {
    findings.push({
      id: 'perf-compression-ok',
      category: 'performance',
      severity: 'info',
      title: `Compressione attiva: ${encoding}`,
      detail: `La risposta è compressa (${encoding}). Trasferimento dati ridotto.`,
    });
  }

  // Cache-Control
  const cc = h['cache-control'] ?? '';
  if (!cc || cc.includes('no-store') || cc.includes('no-cache')) {
    findings.push({
      id: 'perf-no-cache',
      category: 'performance',
      severity: 'low',
      title: 'Cache-Control non ottimizzato per l\'homepage',
      detail: `Cache-Control: "${cc || '(assente)'}"`,
      recommendation: 'Per contenuto statico usare max-age alto + immutable. Per HTML usare stale-while-revalidate.',
    });
  }

  // CDN detection
  const cdnHeaders = ['cf-ray', 'x-cache', 'x-amz-cf-id', 'x-fastly-request-id', 'x-vercel-id'];
  const cdnDetected = cdnHeaders.find(k => h[k]);
  if (cdnDetected) {
    findings.push({
      id: 'perf-cdn-ok',
      category: 'performance',
      severity: 'info',
      title: 'CDN rilevato',
      detail: `Header CDN trovato: ${cdnDetected}: ${h[cdnDetected]}`,
    });
  } else if (!h['x-shopify-stage'] && !p.finalUrl.includes('shopify.com')) {
    findings.push({
      id: 'perf-no-cdn',
      category: 'performance',
      severity: 'medium',
      title: 'CDN non rilevato',
      detail: 'Nessun header CDN identificato. Il traffico potrebbe colpire il server direttamente.',
      recommendation: 'Valutare Cloudflare, Fastly o AWS CloudFront per ridurre latenza globale e assorbire picchi.',
    });
  }

  // Response size
  if (p.contentLength > 500_000) {
    findings.push({
      id: 'perf-large-response',
      category: 'performance',
      severity: 'medium',
      title: `Risposta HTML pesante: ${Math.round(p.contentLength / 1024)}KB`,
      detail: 'Una pagina HTML > 500KB suggerisce JavaScript inline, CSS non ottimizzato o contenuto non necessario nel documento.',
      recommendation: 'Abilitare compressione Brotli, rimuovere CSS/JS inline, usare lazy loading.',
    });
  }

  return findings;
}

// ─── Resilience checks ────────────────────────────────────────────────────────

function checkResilience(
  main: ProbeResult,
  paths: Array<{ path: string; status: number; ttfbMs: number }>,
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Main probe availability
  if (main.error) {
    findings.push({
      id: 'res-unreachable',
      category: 'resilience',
      severity: 'critical',
      title: 'Sito non raggiungibile',
      detail: main.error,
      recommendation: 'Verificare DNS, server, e configurazione firewall.',
    });
    return findings;
  }

  if (main.status >= 500) {
    findings.push({
      id: 'res-5xx-homepage',
      category: 'resilience',
      severity: 'critical',
      title: `Homepage restituisce ${main.status}`,
      detail: 'Il server risponde con un errore 5xx sulla homepage.',
      recommendation: 'Indagare immediatamente: log server, stato database, servizi dipendenti.',
    });
  }

  // Check 404 handler
  const notFoundProbe = paths.find(p => p.path === '/404-intentional-probe-do-not-serve');
  if (notFoundProbe && notFoundProbe.status === 200) {
    findings.push({
      id: 'res-soft-404',
      category: 'resilience',
      severity: 'medium',
      title: 'Soft 404: pagine non trovate restituiscono HTTP 200',
      detail: 'Una URL inesistente restituisce status 200 invece di 404. Penalizza SEO e complica il monitoring.',
      recommendation: 'Configurare correttamente le pagine 404 con status HTTP 404.',
    });
  }

  // 5xx on health paths
  const failingPaths = paths.filter(p =>
    HEALTH_PATHS.includes(p.path) && p.status >= 500
  );
  if (failingPaths.length > 0) {
    findings.push({
      id: 'res-5xx-endpoints',
      category: 'resilience',
      severity: 'high',
      title: `Endpoint restituiscono 5xx: ${failingPaths.map(p => p.path).join(', ')}`,
      detail: 'Errori 5xx su endpoint che dovrebbero essere sempre disponibili. Indica conflitti tra app, temi o configurazioni.',
      recommendation: 'Audit app di terze parti installate. Verificare conflitti nel tema. Aggiungere alert su questi path.',
    });
  }

  // Slow paths
  const slowPaths = paths.filter(p => p.ttfbMs > 3000 && p.status < 500 && p.status > 0);
  if (slowPaths.length > 0) {
    findings.push({
      id: 'res-slow-paths',
      category: 'resilience',
      severity: 'medium',
      title: `Path lenti (> 3s): ${slowPaths.map(p => `${p.path} (${p.ttfbMs}ms)`).join(', ')}`,
      detail: 'Alcuni endpoint impiegano più di 3 secondi. Durante picchi di traffico possono degradare.',
      recommendation: 'Abilitare caching per questi path. Investigare query lente o elaborazioni server-side.',
    });
  }

  // robots.txt
  const robots = paths.find(p => p.path === '/robots.txt');
  if (!robots || robots.status !== 200) {
    findings.push({
      id: 'res-no-robots',
      category: 'resilience',
      severity: 'low',
      title: 'robots.txt non disponibile',
      detail: `Status: ${robots?.status ?? 'non raggiunto'}. Senza robots.txt i crawler indicizzano tutto.`,
      recommendation: 'Creare un robots.txt che blocchi checkout, cart, account e percorsi admin.',
    });
  } else {
    findings.push({
      id: 'res-robots-ok',
      category: 'resilience',
      severity: 'info',
      title: 'robots.txt presente',
      detail: `Risponde con HTTP ${robots.status} in ${robots.ttfbMs}ms.`,
    });
  }

  // sitemap.xml
  const sitemap = paths.find(p => p.path === '/sitemap.xml');
  if (!sitemap || sitemap.status !== 200) {
    findings.push({
      id: 'res-no-sitemap',
      category: 'resilience',
      severity: 'low',
      title: 'sitemap.xml non disponibile',
      detail: `Status: ${sitemap?.status ?? 'non raggiunto'}.`,
      recommendation: 'Generare e pubblicare una sitemap.xml per facilitare l\'indicizzazione dei motori di ricerca.',
    });
  } else {
    findings.push({
      id: 'res-sitemap-ok',
      category: 'resilience',
      severity: 'info',
      title: 'sitemap.xml presente',
      detail: `Risponde con HTTP ${sitemap.status} in ${sitemap.ttfbMs}ms.`,
    });
  }

  // Redirect chain
  if (main.redirectCount > 2) {
    findings.push({
      id: 'res-redirect-chain',
      category: 'resilience',
      severity: 'medium',
      title: `Catena redirect lunga: ${main.redirectCount} redirect`,
      detail: `Ogni redirect aggiunge latenza e aumenta il rischio di loop. URL finale: ${main.finalUrl}`,
      recommendation: 'Consolidare i redirect in un singolo salto diretto. Aggiornare link interni.',
    });
  }

  return findings;
}

// ─── SEO checks ───────────────────────────────────────────────────────────────

function checkSeo(p: ProbeResult): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const body = p.bodySnippet.toLowerCase();

  // Canonical
  if (!body.includes('rel="canonical"') && !body.includes("rel='canonical'")) {
    findings.push({
      id: 'seo-no-canonical',
      category: 'seo',
      severity: 'medium',
      title: 'Tag canonical non trovato',
      detail: 'Senza canonical, contenuti duplicati (es. parametri URL) possono causare penalizzazioni SEO.',
      recommendation: 'Aggiungere <link rel="canonical" href="..."> nell\'<head> di ogni pagina.',
    });
  } else {
    findings.push({
      id: 'seo-canonical-ok',
      category: 'seo',
      severity: 'info',
      title: 'Tag canonical presente',
      detail: 'Trovato nell\'HTML della homepage.',
    });
  }

  // Structured data
  if (!body.includes('application/ld+json')) {
    findings.push({
      id: 'seo-no-structured-data',
      category: 'seo',
      severity: 'medium',
      title: 'Structured data (JSON-LD) non trovato',
      detail: 'Senza schema markup (Product, BreadcrumbList, Organization) Google non può generare rich results.',
      recommendation: 'Aggiungere JSON-LD per Product, BreadcrumbList, e Organization. Su Shopify alcune app lo gestiscono automaticamente.',
    });
  } else {
    findings.push({
      id: 'seo-structured-data-ok',
      category: 'seo',
      severity: 'info',
      title: 'Structured data (JSON-LD) presente',
      detail: 'Trovato nell\'HTML della homepage.',
    });
  }

  // Open Graph
  if (!body.includes('property="og:') && !body.includes("property='og:")) {
    findings.push({
      id: 'seo-no-og',
      category: 'seo',
      severity: 'low',
      title: 'Open Graph meta tags non trovati',
      detail: 'Senza OG tags le anteprime su social (Facebook, LinkedIn, WhatsApp) usano valori di default.',
      recommendation: 'Aggiungere og:title, og:description, og:image almeno sull\'homepage.',
    });
  }

  // Meta description
  if (!body.includes('name="description"') && !body.includes("name='description'")) {
    findings.push({
      id: 'seo-no-meta-desc',
      category: 'seo',
      severity: 'low',
      title: 'Meta description non trovata',
      detail: 'Google usa la meta description nel snippet dei risultati. Assenza = Google genera testo arbitrario.',
      recommendation: 'Aggiungere <meta name="description" content="..."> con 120-160 caratteri per ogni pagina.',
    });
  }

  return findings;
}

// ─── Score computation ────────────────────────────────────────────────────────

function computeScore(findings: AuditFinding[]): { score: number; grade: string } {
  const weights: Record<AuditSeverity, number> = {
    critical: 25,
    high: 15,
    medium: 7,
    low: 3,
    info: 0,
  };

  const deductions = findings
    .filter(f => f.severity !== 'info')
    .reduce((sum, f) => sum + weights[f.severity], 0);

  const score = Math.max(0, 100 - deductions);

  const grade =
    score >= 90 ? 'A' :
    score >= 75 ? 'B' :
    score >= 60 ? 'C' :
    score >= 45 ? 'D' : 'F';

  return { score, grade };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function siteAudit(
  params: { url: string },
  _config: AgentConfig,
): Promise<SiteAuditReport> {
  const start = Date.now();
  const url = normalizeUrl(params.url);

  // Run all probes in parallel
  const [mainResult, ...pathResults] = await Promise.all([
    probe(url),
    ...RESILIENCE_PATHS.map(p => probeStatus(url, p)),
    ...HEALTH_PATHS.map(p => probeStatus(url, p)),
  ]);

  const allPaths = pathResults;
  const findings: AuditFinding[] = [];

  if (mainResult.error) {
    // Unreachable — only resilience findings
    findings.push(...checkResilience(mainResult, allPaths));
  } else {
    findings.push(
      ...checkSecurity(mainResult),
      ...checkPerformance(mainResult),
      ...checkResilience(mainResult, allPaths),
      ...checkSeo(mainResult),
    );
  }

  // Sort by severity
  const order: Record<AuditSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  const { score, grade } = computeScore(findings);

  const summary = {
    score,
    grade,
    critical: findings.filter(f => f.severity === 'critical').length,
    high:     findings.filter(f => f.severity === 'high').length,
    medium:   findings.filter(f => f.severity === 'medium').length,
    low:      findings.filter(f => f.severity === 'low').length,
    info:     findings.filter(f => f.severity === 'info').length,
  };

  return {
    url,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - start,
    summary,
    probe: mainResult,
    findings,
    rawHeaders: mainResult.headers,
  };
}

// ─── CLI formatter ────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const BLUE   = '\x1b[34m';
const MAGENTA = '\x1b[35m';

function severityColor(s: AuditSeverity): string {
  return s === 'critical' ? RED :
         s === 'high'     ? RED :
         s === 'medium'   ? YELLOW :
         s === 'low'      ? DIM :
         CYAN;
}

function severityIcon(s: AuditSeverity): string {
  return s === 'critical' ? '✖' :
         s === 'high'     ? '✖' :
         s === 'medium'   ? '!' :
         s === 'low'      ? '~' :
         '✓';
}

function gradeColor(grade: string): string {
  return grade === 'A' ? GREEN :
         grade === 'B' ? GREEN :
         grade === 'C' ? YELLOW :
         grade === 'D' ? YELLOW : RED;
}

export function formatAuditReport(report: SiteAuditReport): string {
  const lines: string[] = [];
  const { summary, findings } = report;

  lines.push('');
  lines.push(`  ${BOLD}SITE AUDIT REPORT${RESET}`);
  lines.push(`  ${DIM}${report.url}${RESET}  ${DIM}(${report.durationMs}ms)${RESET}`);
  lines.push('');

  // Score
  const gc = gradeColor(summary.grade);
  lines.push(`  Grade: ${gc}${BOLD}${summary.grade}${RESET}  Score: ${gc}${summary.score}/100${RESET}`);
  lines.push(
    `  ${RED}${summary.critical} critico${RESET}  ` +
    `${RED}${summary.high} alto${RESET}  ` +
    `${YELLOW}${summary.medium} medio${RESET}  ` +
    `${DIM}${summary.low} basso${RESET}  ` +
    `${CYAN}${summary.info} info${RESET}`
  );

  if (report.probe && !report.probe.error) {
    lines.push('');
    lines.push(`  ${DIM}HTTP ${report.probe.status}  TTFB ${report.probe.ttfbMs}ms  ${report.probe.finalUrl}${RESET}`);
  }

  // Findings by category
  const categories: Array<{ key: AuditFinding['category']; label: string; color: string }> = [
    { key: 'security',    label: 'SECURITY',    color: MAGENTA },
    { key: 'performance', label: 'PERFORMANCE', color: BLUE },
    { key: 'resilience',  label: 'RESILIENZA',  color: CYAN },
    { key: 'seo',         label: 'SEO',         color: GREEN },
  ];

  for (const cat of categories) {
    const catFindings = findings.filter(f => f.category === cat.key && f.severity !== 'info');
    const catInfo     = findings.filter(f => f.category === cat.key && f.severity === 'info');

    if (catFindings.length === 0 && catInfo.length === 0) continue;

    lines.push('');
    lines.push(`  ${cat.color}${BOLD}${cat.label}${RESET}`);
    lines.push(`  ${DIM}${'─'.repeat(50)}${RESET}`);

    for (const f of catFindings) {
      const col = severityColor(f.severity);
      const icon = severityIcon(f.severity);
      lines.push(`  ${col}${icon} ${BOLD}${f.title}${RESET}`);
      lines.push(`    ${DIM}${f.detail}${RESET}`);
      if (f.recommendation) {
        lines.push(`    ${CYAN}→ ${f.recommendation}${RESET}`);
      }
    }

    for (const f of catInfo) {
      lines.push(`  ${CYAN}✓ ${DIM}${f.title}${RESET}`);
    }
  }

  lines.push('');
  lines.push(`  ${DIM}Generated: ${report.timestamp}${RESET}`);
  lines.push('');

  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Strip trailing slash for consistency
  return url.replace(/\/$/, '');
}

function countRedirects(original: string, final: string): number {
  if (original === final) return 0;
  // Heuristic: HTTP→HTTPS = 1, different domain = 1+, etc.
  const orig = new URL(original.startsWith('http') ? original : `https://${original}`);
  const fin  = new URL(final.startsWith('http') ? final : `https://${final}`);
  if (orig.hostname === fin.hostname && orig.protocol !== fin.protocol) return 1;
  if (orig.hostname !== fin.hostname) return 2;
  return 1;
}

// Silence unused import warning
void (isIP as unknown);
