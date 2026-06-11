/**
 * @aia/integrations/browser — Type definitions for browser automation.
 */

// ---------------------------------------------------------------------------
// Browser Action Types
// ---------------------------------------------------------------------------

export type BrowserActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'screenshot'
  | 'extract'
  | 'wait'
  | 'scroll';

export interface BrowserAction {
  type: BrowserActionType;
  selector?: string;
  url?: string;
  value?: string;
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Browse Results
// ---------------------------------------------------------------------------

export interface FormField {
  name: string;
  type: string;
  id: string;
  placeholder: string;
  required: boolean;
  value: string;
}

export interface PageForm {
  id: string;
  action: string;
  method: string;
  fields: FormField[];
}

export interface PageLink {
  text: string;
  href: string;
}

export interface BrowseResult {
  url: string;
  title: string;
  content?: string;
  screenshot?: string;
  links?: PageLink[];
  forms?: PageForm[];
  statusCode?: number;
}

// ---------------------------------------------------------------------------
// Table Extraction
// ---------------------------------------------------------------------------

export interface TableData {
  headers: string[];
  rows: string[][];
}

// ---------------------------------------------------------------------------
// Structured Data Extraction
// ---------------------------------------------------------------------------

export interface StructuredData {
  jsonLd: Record<string, unknown>[];
  openGraph: Record<string, string>;
  meta: Record<string, string>;
  headings: { level: number; text: string }[];
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

export interface BrowserSession {
  id: string;
  tenantId: string;
  createdAt: number;
  lastActivity: number;
  currentUrl: string;
  pageTitle: string;
}

export interface BrowserPoolConfig {
  maxSessionsPerTenant: number;
  sessionTimeoutMs: number;
  maxConcurrentSessions: number;
  blockedResourceTypes: string[];
  blockedDomains: string[];
  defaultUserAgent: string;
  defaultViewport: { width: number; height: number };
}

// ---------------------------------------------------------------------------
// Crawl Options
// ---------------------------------------------------------------------------

export interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
  sameDomainOnly: boolean;
  respectRobotsTxt: boolean;
  delayMs: number;
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  depth: number;
  links: string[];
}

// ---------------------------------------------------------------------------
// Scrape Results
// ---------------------------------------------------------------------------

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface ScrapeWithMetadataResult extends ScrapeResult {
  metaDescription: string;
  headings: { level: number; text: string }[];
  author: string;
  publishedDate: string;
  language: string;
}
