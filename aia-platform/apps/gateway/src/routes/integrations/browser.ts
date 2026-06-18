/**
 * Browser automation routes — AI agents can navigate, extract, and interact with web pages.
 *
 * Risk levels:
 * - read_only: navigate, screenshot, extract (safe observation)
 * - low_risk: click, crawl (minor page state changes)
 * - high_risk: fill, submit (writes data to external sites)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { getBrowserService, getWebScraper } from '@aia/integrations/browser';

const browser = new Hono();

// --- Validation Schemas ---

const createSessionSchema = z.object({});

const navigateSchema = z.object({
  sessionId: z.string().min(1),
  url: z.string().url().max(2048),
});

const screenshotSchema = z.object({
  sessionId: z.string().min(1),
});

const extractSchema = z.object({
  sessionId: z.string().min(1),
  selector: z.string().max(500).optional(),
  type: z.enum(['text', 'links', 'tables', 'forms']).default('text'),
});

const clickSchema = z.object({
  sessionId: z.string().min(1),
  selector: z.string().min(1).max(500),
});

const fillSchema = z.object({
  sessionId: z.string().min(1),
  selector: z.string().min(1).max(500),
  value: z.string().max(10_000),
});

const submitSchema = z.object({
  sessionId: z.string().min(1),
  selector: z.string().min(1).max(500),
});

const crawlSchema = z.object({
  url: z.string().url().max(2048),
  maxPages: z.number().int().positive().max(100).default(20),
  maxDepth: z.number().int().positive().max(5).default(3),
  sameDomainOnly: z.boolean().default(true),
});

// --- Routes ---

/**
 * GET /api/integrations/browser/crawl-jobs — List crawl job history.
 * Returns empty until persistent job storage is implemented.
 */
browser.get('/crawl-jobs', async (c) => {
  return c.json({ items: [], total: 0 });
});

/**
 * POST /api/integrations/browser/sessions — Create a new browser session.
 */
browser.post('/sessions', async (c) => {
  const tenantId = c.get('tenantId') as string;
  createSessionSchema.parse(await c.req.json().catch(() => ({})));

  const svc = getBrowserService();
  const result = await svc.createSession(tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    session: result.data,
    message: 'Browser session created. Auto-expires after 5 minutes of inactivity.',
  }, 201);
});

/**
 * DELETE /api/integrations/browser/sessions/:id — Close a browser session.
 */
browser.delete('/sessions/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const sessionId = c.req.param('id');

  if (!sessionId) {
    throw new AppError('INVALID_ID', 'Session ID is required', 400);
  }

  const svc = getBrowserService();
  const result = await svc.closeSession(sessionId, tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ message: 'Session closed' });
});

/**
 * POST /api/integrations/browser/navigate — Navigate to a URL.
 * Risk: read_only
 */
browser.post('/navigate', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = navigateSchema.parse(await c.req.json());

  const svc = getBrowserService();
  const result = await svc.navigate(body.sessionId, tenantId, body.url);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * POST /api/integrations/browser/screenshot — Take a screenshot of the current page.
 * Risk: read_only
 */
browser.post('/screenshot', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = screenshotSchema.parse(await c.req.json());

  const svc = getBrowserService();
  const result = await svc.screenshot(body.sessionId, tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    screenshot: result.data,
    format: 'png',
    encoding: 'base64',
  });
});

/**
 * POST /api/integrations/browser/extract — Extract content from the current page.
 * Risk: read_only
 */
browser.post('/extract', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = extractSchema.parse(await c.req.json());

  const svc = getBrowserService();

  switch (body.type) {
    case 'text': {
      const result = await svc.extractText(body.sessionId, tenantId, body.selector);
      if (!result.success) throw result.error;
      return c.json({ type: 'text', content: result.data });
    }
    case 'links': {
      const result = await svc.extractLinks(body.sessionId, tenantId);
      if (!result.success) throw result.error;
      return c.json({ type: 'links', links: result.data, count: result.data.length });
    }
    case 'tables': {
      const result = await svc.extractTables(body.sessionId, tenantId);
      if (!result.success) throw result.error;
      return c.json({ type: 'tables', tables: result.data, count: result.data.length });
    }
    case 'forms': {
      const result = await svc.extractForms(body.sessionId, tenantId);
      if (!result.success) throw result.error;
      return c.json({ type: 'forms', forms: result.data, count: result.data.length });
    }
    default:
      throw new AppError('INVALID_EXTRACT_TYPE', 'Unknown extraction type', 400);
  }
});

/**
 * POST /api/integrations/browser/click — Click an element on the page.
 * Risk: low_risk
 */
browser.post('/click', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = clickSchema.parse(await c.req.json());

  const svc = getBrowserService();
  const result = await svc.click(body.sessionId, tenantId, body.selector);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * POST /api/integrations/browser/fill — Fill a form field.
 * Risk: high_risk (writes data to external site)
 */
browser.post('/fill', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = fillSchema.parse(await c.req.json());

  const svc = getBrowserService();
  const result = await svc.fill(body.sessionId, tenantId, body.selector, body.value);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * POST /api/integrations/browser/submit — Submit a form.
 * Risk: high_risk (sends data to external site)
 */
browser.post('/submit', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = submitSchema.parse(await c.req.json());

  const svc = getBrowserService();
  const result = await svc.submitForm(body.sessionId, tenantId, body.selector);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * POST /api/integrations/browser/crawl — Crawl a site for KB ingestion.
 * Risk: low_risk (reads multiple pages, runs as async job)
 */
browser.post('/crawl', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = crawlSchema.parse(await c.req.json());

  const scraper = getWebScraper();
  const result = await scraper.crawlSite(body.url, {
    maxPages: body.maxPages,
    maxDepth: body.maxDepth,
    sameDomainOnly: body.sameDomainOnly,
  });

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    pages: result.data.map((page) => ({
      url: page.url,
      title: page.title,
      content: page.content,
      depth: page.depth,
      wordCount: page.content.split(/\s+/).filter(Boolean).length,
    })),
    totalPages: result.data.length,
    baseUrl: body.url,
  });
});

export { browser as browserRouter };
