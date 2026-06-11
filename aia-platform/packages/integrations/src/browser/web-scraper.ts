/**
 * Web Scraper — High-level scraping utilities built on top of the browser service.
 *
 * Provides simplified methods for:
 * - Single page content extraction (strips HTML, scripts, styles)
 * - Content with metadata (title, description, headings, Open Graph)
 * - Multi-page crawling for knowledge base ingestion
 * - Structured data extraction (JSON-LD, microdata, Open Graph)
 */

import { type Result, success, failure, AppError } from '@aia/shared';
import { getBrowserPool } from './browser.pool.js';
import type {
  CrawlOptions,
  CrawledPage,
  ScrapeResult,
  ScrapeWithMetadataResult,
  StructuredData,
} from './types.js';

const INTERNAL_TENANT_ID = '__scraper_internal__';

export class WebScraper {
  private pool = getBrowserPool();

  /**
   * Scrape a single URL and return clean text content.
   * Creates a temporary session, extracts content, and closes immediately.
   */
  async scrapeUrl(url: string): Promise<Result<ScrapeResult>> {
    const sessionResult = await this.createTempSession();
    if (!sessionResult.success) return sessionResult;

    const sessionId = sessionResult.data;

    try {
      const page = this.pool.getPage(sessionId, INTERNAL_TENANT_ID);

      const parsed = this.validateUrl(url);
      if (!parsed) {
        return failure(new AppError('SCRAPER_INVALID_URL', 'URL must use http or https', 400));
      }

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      const title = await page.title();
      const content = await this.extractCleanText(page);

      const wordCount = content.split(/\s+/).filter(Boolean).length;

      return success({
        url: page.url(),
        title,
        content,
        wordCount,
      });
    } catch (error) {
      return failure(
        new AppError(
          'SCRAPER_FAILED',
          error instanceof Error ? error.message : 'Scraping failed',
          500,
        ),
      );
    } finally {
      await this.pool.closeSession(sessionId, INTERNAL_TENANT_ID).catch(() => {});
    }
  }

  /**
   * Scrape a URL with full metadata extraction.
   */
  async scrapeWithMetadata(url: string): Promise<Result<ScrapeWithMetadataResult>> {
    const sessionResult = await this.createTempSession();
    if (!sessionResult.success) return sessionResult;

    const sessionId = sessionResult.data;

    try {
      const page = this.pool.getPage(sessionId, INTERNAL_TENANT_ID);

      const parsed = this.validateUrl(url);
      if (!parsed) {
        return failure(new AppError('SCRAPER_INVALID_URL', 'URL must use http or https', 400));
      }

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      const title = await page.title();
      const content = await this.extractCleanText(page);
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      const metadata = await page.evaluate(() => {
        const getMeta = (name: string): string => {
          const el =
            document.querySelector(`meta[name="${name}"]`) ??
            document.querySelector(`meta[property="${name}"]`);
          return el?.getAttribute('content') ?? '';
        };

        const headings: { level: number; text: string }[] = [];
        for (let i = 1; i <= 6; i++) {
          const elements = document.querySelectorAll(`h${i}`);
          for (const el of elements) {
            const text = (el.textContent ?? '').trim();
            if (text) {
              headings.push({ level: i, text: text.slice(0, 200) });
            }
          }
        }

        return {
          metaDescription: getMeta('description') || getMeta('og:description'),
          author: getMeta('author') || getMeta('article:author'),
          publishedDate: getMeta('article:published_time') || getMeta('date'),
          language: document.documentElement.lang || '',
          headings,
        };
      });

      return success({
        url: page.url(),
        title,
        content,
        wordCount,
        metaDescription: metadata.metaDescription,
        headings: metadata.headings,
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        language: metadata.language,
      });
    } catch (error) {
      return failure(
        new AppError(
          'SCRAPER_FAILED',
          error instanceof Error ? error.message : 'Scraping with metadata failed',
          500,
        ),
      );
    } finally {
      await this.pool.closeSession(sessionId, INTERNAL_TENANT_ID).catch(() => {});
    }
  }

  /**
   * Crawl a site starting from baseUrl, following links up to maxPages and maxDepth.
   * Returns an array of page contents suitable for KB ingestion.
   */
  async crawlSite(
    baseUrl: string,
    options: Partial<CrawlOptions> = {},
  ): Promise<Result<CrawledPage[]>> {
    const config: CrawlOptions = {
      maxPages: options.maxPages ?? 20,
      maxDepth: options.maxDepth ?? 3,
      sameDomainOnly: options.sameDomainOnly ?? true,
      respectRobotsTxt: options.respectRobotsTxt ?? true,
      delayMs: options.delayMs ?? 1000,
    };

    // Cap limits for safety
    config.maxPages = Math.min(config.maxPages, 100);
    config.maxDepth = Math.min(config.maxDepth, 5);

    const parsed = this.validateUrl(baseUrl);
    if (!parsed) {
      return failure(new AppError('SCRAPER_INVALID_URL', 'Base URL must use http or https', 400));
    }

    const sessionResult = await this.createTempSession();
    if (!sessionResult.success) return sessionResult;

    const sessionId = sessionResult.data;

    try {
      const page = this.pool.getPage(sessionId, INTERNAL_TENANT_ID);
      const baseDomain = parsed.hostname;

      const visited = new Set<string>();
      const queue: { url: string; depth: number }[] = [{ url: baseUrl, depth: 0 }];
      const results: CrawledPage[] = [];

      // Check robots.txt if required
      let disallowedPaths: string[] = [];
      if (config.respectRobotsTxt) {
        disallowedPaths = await this.fetchRobotsTxtDisallowed(page, parsed.origin);
      }

      while (queue.length > 0 && results.length < config.maxPages) {
        const item = queue.shift();
        if (!item) break;

        const normalizedUrl = this.normalizeUrl(item.url);
        if (visited.has(normalizedUrl)) continue;
        visited.add(normalizedUrl);

        // Check robots.txt disallow
        if (this.isDisallowed(normalizedUrl, disallowedPaths)) continue;

        try {
          await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });

          const title = await page.title();
          const content = await this.extractCleanText(page);

          // Skip pages with very little content
          if (content.length < 100) continue;

          // Extract links for further crawling
          const links = await page.evaluate(() => {
            const anchors = document.querySelectorAll('a[href]');
            const hrefs: string[] = [];
            for (const a of anchors) {
              const href = a.getAttribute('href');
              if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                try {
                  hrefs.push(new URL(href, window.location.href).href);
                } catch {
                  // Invalid URL — skip
                }
              }
            }
            return [...new Set(hrefs)];
          });

          results.push({
            url: page.url(),
            title,
            content,
            depth: item.depth,
            links,
          });

          // Queue child links if within depth limit
          if (item.depth < config.maxDepth) {
            for (const link of links) {
              const linkUrl = this.validateUrl(link);
              if (!linkUrl) continue;

              if (config.sameDomainOnly && linkUrl.hostname !== baseDomain) continue;

              const normalized = this.normalizeUrl(link);
              if (!visited.has(normalized)) {
                queue.push({ url: link, depth: item.depth + 1 });
              }
            }
          }

          // Delay between requests to be polite
          if (config.delayMs > 0 && queue.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, config.delayMs));
          }
        } catch {
          // Skip pages that fail to load
          continue;
        }
      }

      return success(results);
    } catch (error) {
      return failure(
        new AppError(
          'SCRAPER_CRAWL_FAILED',
          error instanceof Error ? error.message : 'Crawl failed',
          500,
        ),
      );
    } finally {
      await this.pool.closeSession(sessionId, INTERNAL_TENANT_ID).catch(() => {});
    }
  }

  /**
   * Extract structured data from a URL (JSON-LD, Open Graph, meta tags, headings).
   */
  async extractStructuredData(url: string): Promise<Result<StructuredData>> {
    const sessionResult = await this.createTempSession();
    if (!sessionResult.success) return sessionResult;

    const sessionId = sessionResult.data;

    try {
      const page = this.pool.getPage(sessionId, INTERNAL_TENANT_ID);

      const parsed = this.validateUrl(url);
      if (!parsed) {
        return failure(new AppError('SCRAPER_INVALID_URL', 'URL must use http or https', 400));
      }

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      const data = await page.evaluate(() => {
        // JSON-LD
        const jsonLd: Record<string, unknown>[] = [];
        const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of ldScripts) {
          try {
            const parsed = JSON.parse(script.textContent ?? '');
            if (Array.isArray(parsed)) {
              jsonLd.push(...parsed);
            } else {
              jsonLd.push(parsed);
            }
          } catch {
            // Invalid JSON-LD — skip
          }
        }

        // Open Graph
        const openGraph: Record<string, string> = {};
        const ogMetas = document.querySelectorAll('meta[property^="og:"]');
        for (const meta of ogMetas) {
          const property = meta.getAttribute('property');
          const content = meta.getAttribute('content');
          if (property && content) {
            openGraph[property.replace('og:', '')] = content;
          }
        }

        // Standard meta tags
        const meta: Record<string, string> = {};
        const metaTags = document.querySelectorAll('meta[name]');
        for (const tag of metaTags) {
          const name = tag.getAttribute('name');
          const content = tag.getAttribute('content');
          if (name && content) {
            meta[name] = content;
          }
        }

        // Headings structure
        const headings: { level: number; text: string }[] = [];
        for (let i = 1; i <= 6; i++) {
          const elements = document.querySelectorAll(`h${i}`);
          for (const el of elements) {
            const text = (el.textContent ?? '').trim();
            if (text) {
              headings.push({ level: i, text: text.slice(0, 200) });
            }
          }
        }

        return { jsonLd, openGraph, meta, headings };
      });

      return success(data as StructuredData);
    } catch (error) {
      return failure(
        new AppError(
          'SCRAPER_EXTRACT_FAILED',
          error instanceof Error ? error.message : 'Structured data extraction failed',
          500,
        ),
      );
    } finally {
      await this.pool.closeSession(sessionId, INTERNAL_TENANT_ID).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private async createTempSession(): Promise<Result<string>> {
    try {
      const session = await this.pool.createSession(INTERNAL_TENANT_ID);
      return success(session.id);
    } catch (error) {
      return failure(
        new AppError(
          'SCRAPER_SESSION_FAILED',
          error instanceof Error ? error.message : 'Failed to create scraper session',
          503,
        ),
      );
    }
  }

  private async extractCleanText(page: import('playwright').Page): Promise<string> {
    return page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      const removeSelectors = [
        'script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
        '.cookie-banner', '.ad', '.advertisement', '.popup', '.modal',
      ];

      for (const sel of removeSelectors) {
        const elements = clone.querySelectorAll(sel);
        for (const el of elements) {
          el.remove();
        }
      }

      const mainContent =
        clone.querySelector('main, [role="main"], article, .content, #content') ?? clone;

      const text = (mainContent.textContent ?? '')
        .replace(/[\t ]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return text.slice(0, 100_000);
    });
  }

  private async fetchRobotsTxtDisallowed(
    page: import('playwright').Page,
    origin: string,
  ): Promise<string[]> {
    try {
      const response = await page.goto(`${origin}/robots.txt`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });

      if (!response || response.status() !== 200) return [];

      const text = await page.evaluate(() => document.body.textContent ?? '');
      const lines = text.split('\n');
      const disallowed: string[] = [];
      let inUserAgent = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('user-agent:')) {
          const agent = trimmed.slice('user-agent:'.length).trim();
          inUserAgent = agent === '*' || agent.includes('bot');
        } else if (inUserAgent && trimmed.startsWith('disallow:')) {
          const path = trimmed.slice('disallow:'.length).trim();
          if (path) {
            disallowed.push(path);
          }
        }
      }

      return disallowed;
    } catch {
      return [];
    }
  }

  private isDisallowed(url: string, disallowedPaths: string[]): boolean {
    if (disallowedPaths.length === 0) return false;
    try {
      const parsed = new URL(url);
      for (const path of disallowedPaths) {
        if (parsed.pathname.startsWith(path)) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove fragment and trailing slash
      parsed.hash = '';
      let normalized = parsed.href;
      if (normalized.endsWith('/') && parsed.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  private validateUrl(url: string): URL | null {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      const hostname = parsed.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname === '0.0.0.0' ||
        hostname === '::1'
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}

// Singleton
let scraperInstance: WebScraper | null = null;

export function getWebScraper(): WebScraper {
  if (!scraperInstance) {
    scraperInstance = new WebScraper();
  }
  return scraperInstance;
}
