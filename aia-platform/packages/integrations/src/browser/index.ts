/**
 * @aia/integrations/browser — Browser automation and web scraping for AI agents.
 */

export { BrowserService, getBrowserService } from './browser.service.js';
export { BrowserPool, getBrowserPool, shutdownBrowserPool } from './browser.pool.js';
export { WebScraper, getWebScraper } from './web-scraper.js';
export type {
  BrowserAction,
  BrowserActionType,
  BrowseResult,
  BrowserSession,
  BrowserPoolConfig,
  CrawlOptions,
  CrawledPage,
  FormField,
  PageForm,
  PageLink,
  ScrapeResult,
  ScrapeWithMetadataResult,
  StructuredData,
  TableData,
} from './types.js';
