/**
 * Browser Automation Service — Playwright-based browser control for AI agents.
 *
 * Each tenant gets an isolated browser context (no cookie/state leakage).
 * Sessions auto-expire after 5 minutes of inactivity.
 * Max 3 concurrent sessions per tenant.
 *
 * Designed for headless operation only: no visible UI, blocks ads/trackers,
 * uses a standard Chrome user-agent.
 */

import type { Page } from 'playwright';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getBrowserPool } from './browser.pool.js';
import type {
  BrowseResult,
  BrowserSession,
  FormField,
  PageForm,
  PageLink,
  TableData,
} from './types.js';

export class BrowserService {
  private pool = getBrowserPool();

  /**
   * Launch a new browser session for the tenant.
   */
  async createSession(tenantId: string): Promise<Result<BrowserSession>> {
    try {
      const session = await this.pool.createSession(tenantId);
      return success(session);
    } catch (error) {
      return failure(
        new AppError(
          'BROWSER_SESSION_LIMIT',
          error instanceof Error ? error.message : 'Failed to create browser session',
          429,
        ),
      );
    }
  }

  /**
   * Navigate to a URL and return the page state.
   */
  async navigate(
    sessionId: string,
    tenantId: string,
    url: string,
  ): Promise<Result<BrowseResult>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      // Validate URL
      const parsed = this.validateUrl(url);
      if (!parsed) {
        return failure(
          new AppError('BROWSER_INVALID_URL', 'URL must use http or https protocol', 400),
        );
      }

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      const title = await page.title();
      const currentUrl = page.url();

      this.pool.updateSessionState(sessionId, currentUrl, title);

      const content = await this.extractMainContent(page);
      const links = await this.extractPageLinks(page);

      const result: BrowseResult = {
        url: currentUrl,
        title,
        content,
        links: links.slice(0, 50), // Limit to first 50 links
        statusCode: response?.status(),
      };

      return success(result);
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_NAVIGATE_FAILED', 'Navigation failed'));
    }
  }

  /**
   * Take a screenshot of the current page as base64 PNG.
   */
  async screenshot(sessionId: string, tenantId: string): Promise<Result<string>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      const buffer = await page.screenshot({
        type: 'png',
        fullPage: false,
      });

      return success(buffer.toString('base64'));
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_SCREENSHOT_FAILED', 'Screenshot failed'));
    }
  }

  /**
   * Extract text content from the page or a specific selector.
   */
  async extractText(
    sessionId: string,
    tenantId: string,
    selector?: string,
  ): Promise<Result<string>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      let content: string;
      if (selector) {
        const element = await page.$(selector);
        if (!element) {
          return failure(
            new AppError('BROWSER_ELEMENT_NOT_FOUND', `Element not found: ${selector}`, 404),
          );
        }
        content = (await element.textContent()) ?? '';
      } else {
        content = await this.extractMainContent(page);
      }

      return success(content.trim());
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_EXTRACT_FAILED', 'Text extraction failed'));
    }
  }

  /**
   * Extract all links from the current page.
   */
  async extractLinks(sessionId: string, tenantId: string): Promise<Result<PageLink[]>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);
      const links = await this.extractPageLinks(page);
      return success(links);
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_EXTRACT_FAILED', 'Link extraction failed'));
    }
  }

  /**
   * Extract table data from the current page.
   */
  async extractTables(sessionId: string, tenantId: string): Promise<Result<TableData[]>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      const tables = await page.evaluate(() => {
        const results: { headers: string[]; rows: string[][] }[] = [];
        const tableElements = document.querySelectorAll('table');

        for (const table of tableElements) {
          const headers: string[] = [];
          const rows: string[][] = [];

          const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th');
          for (const cell of headerCells) {
            headers.push((cell.textContent ?? '').trim());
          }

          const bodyRows = table.querySelectorAll('tbody tr, tr');
          const startIdx = headers.length > 0 ? 0 : 1;
          const rowElements = Array.from(bodyRows).slice(startIdx);

          for (const row of rowElements) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length === 0) continue;
            const rowData: string[] = [];
            for (const cell of cells) {
              rowData.push((cell.textContent ?? '').trim());
            }
            rows.push(rowData);
          }

          if (headers.length > 0 || rows.length > 0) {
            results.push({ headers, rows });
          }
        }

        return results;
      });

      return success(tables);
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_EXTRACT_FAILED', 'Table extraction failed'));
    }
  }

  /**
   * Click an element on the page.
   */
  async click(
    sessionId: string,
    tenantId: string,
    selector: string,
  ): Promise<Result<BrowseResult>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      await page.click(selector, { timeout: 10_000 });

      // Wait for navigation or network idle
      await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {
        // Page may not navigate on click — that is fine
      });

      const title = await page.title();
      const currentUrl = page.url();
      this.pool.updateSessionState(sessionId, currentUrl, title);

      const content = await this.extractMainContent(page);

      return success({
        url: currentUrl,
        title,
        content,
      });
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_CLICK_FAILED', 'Click failed'));
    }
  }

  /**
   * Fill a form field with a value.
   */
  async fill(
    sessionId: string,
    tenantId: string,
    selector: string,
    value: string,
  ): Promise<Result<{ filled: boolean; selector: string }>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      await page.fill(selector, value, { timeout: 10_000 });

      return success({ filled: true, selector });
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_FILL_FAILED', 'Fill field failed'));
    }
  }

  /**
   * Submit a form by clicking its submit button or pressing Enter.
   */
  async submitForm(
    sessionId: string,
    tenantId: string,
    selector: string,
  ): Promise<Result<BrowseResult>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      // Try to find a submit button within the form
      const submitButton = await page.$(`${selector} [type="submit"], ${selector} button`);
      if (submitButton) {
        await submitButton.click();
      } else {
        // Press Enter on the form's last input
        const lastInput = await page.$(`${selector} input:last-of-type`);
        if (lastInput) {
          await lastInput.press('Enter');
        } else {
          return failure(
            new AppError('BROWSER_SUBMIT_FAILED', 'No submit button or input found in form', 400),
          );
        }
      }

      // Wait for navigation after form submit
      await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {
        // May not navigate (AJAX form)
      });

      const title = await page.title();
      const currentUrl = page.url();
      this.pool.updateSessionState(sessionId, currentUrl, title);

      const content = await this.extractMainContent(page);

      return success({
        url: currentUrl,
        title,
        content,
      });
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_SUBMIT_FAILED', 'Form submission failed'));
    }
  }

  /**
   * Scroll down the page. Returns whether there is more content below.
   */
  async scrollDown(sessionId: string, tenantId: string): Promise<Result<boolean>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      const hasMore = await page.evaluate(() => {
        const scrollBefore = window.scrollY;
        window.scrollBy(0, window.innerHeight);

        // Small delay handled by returning a Promise
        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            const scrollAfter = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            resolve(scrollAfter < maxScroll && scrollAfter !== scrollBefore);
          }, 100);
        });
      });

      return success(hasMore);
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_SCROLL_FAILED', 'Scroll failed'));
    }
  }

  /**
   * Wait for a selector to appear on the page.
   */
  async waitForSelector(
    sessionId: string,
    tenantId: string,
    selector: string,
    timeout = 10_000,
  ): Promise<Result<boolean>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      const maxTimeout = Math.min(timeout, 30_000); // Cap at 30 seconds
      await page.waitForSelector(selector, { timeout: maxTimeout });

      return success(true);
    } catch {
      return success(false);
    }
  }

  /**
   * Close a browser session and free resources.
   */
  async closeSession(sessionId: string, tenantId: string): Promise<Result<void>> {
    try {
      await this.pool.closeSession(sessionId, tenantId);
      return success(undefined);
    } catch (error) {
      return failure(
        this.toAppError(error, 'BROWSER_CLOSE_FAILED', 'Failed to close session'),
      );
    }
  }

  /**
   * Get session information.
   */
  getSessionInfo(sessionId: string, tenantId: string): BrowserSession | null {
    return this.pool.getSessionInfo(sessionId, tenantId);
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract the main content from a page, stripping scripts, styles, and nav.
   */
  private async extractMainContent(page: Page): Promise<string> {
    return page.evaluate(() => {
      // Remove script, style, nav, header, footer, and aside elements
      const clone = document.body.cloneNode(true) as HTMLElement;
      const removeSelectors = [
        'script',
        'style',
        'noscript',
        'nav',
        'header',
        'footer',
        'aside',
        '[role="navigation"]',
        '[role="banner"]',
        '[role="contentinfo"]',
        '.cookie-banner',
        '.ad',
        '.advertisement',
      ];

      for (const sel of removeSelectors) {
        const elements = clone.querySelectorAll(sel);
        for (const el of elements) {
          el.remove();
        }
      }

      // Try to find main content area first
      const mainContent =
        clone.querySelector('main, [role="main"], article, .content, #content') ?? clone;

      // Extract text, normalizing whitespace
      const text = (mainContent.textContent ?? '')
        .replace(/[\t ]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Limit to ~50KB of text to prevent huge payloads
      return text.slice(0, 50_000);
    });
  }

  /**
   * Extract all links from the page.
   */
  private async extractPageLinks(page: Page): Promise<PageLink[]> {
    return page.evaluate(() => {
      const links: { text: string; href: string }[] = [];
      const anchors = document.querySelectorAll('a[href]');

      for (const anchor of anchors) {
        const href = anchor.getAttribute('href');
        const text = (anchor.textContent ?? '').trim();

        if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
          continue;
        }

        // Resolve relative URLs
        let resolvedHref: string;
        try {
          resolvedHref = new URL(href, window.location.href).href;
        } catch {
          continue;
        }

        if (text && resolvedHref) {
          links.push({ text: text.slice(0, 200), href: resolvedHref });
        }
      }

      // Deduplicate by href
      const seen = new Set<string>();
      return links.filter((link) => {
        if (seen.has(link.href)) return false;
        seen.add(link.href);
        return true;
      });
    });
  }

  /**
   * Extract form definitions from the page.
   */
  async extractForms(sessionId: string, tenantId: string): Promise<Result<PageForm[]>> {
    try {
      const page = this.pool.getPage(sessionId, tenantId);

      const forms = await page.evaluate(() => {
        const results: {
          id: string;
          action: string;
          method: string;
          fields: {
            name: string;
            type: string;
            id: string;
            placeholder: string;
            required: boolean;
            value: string;
          }[];
        }[] = [];

        const formElements = document.querySelectorAll('form');
        for (const form of formElements) {
          const fields: {
            name: string;
            type: string;
            id: string;
            placeholder: string;
            required: boolean;
            value: string;
          }[] = [];

          const inputs = form.querySelectorAll('input, select, textarea');
          for (const input of inputs) {
            const el = input as HTMLInputElement;
            if (el.type === 'hidden' || el.type === 'submit') continue;

            fields.push({
              name: el.name || '',
              type: el.type || 'text',
              id: el.id || '',
              placeholder: el.placeholder || '',
              required: el.required,
              value: el.value || '',
            });
          }

          results.push({
            id: form.id || '',
            action: form.action || '',
            method: (form.method || 'GET').toUpperCase(),
            fields,
          });
        }

        return results;
      });

      return success(forms as PageForm[]);
    } catch (error) {
      return failure(this.toAppError(error, 'BROWSER_EXTRACT_FAILED', 'Form extraction failed'));
    }
  }

  /**
   * Validate that a URL is safe to navigate to.
   */
  private validateUrl(url: string): URL | null {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      // Block internal/private IP ranges
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

  /**
   * Convert unknown errors to AppError consistently.
   */
  private toAppError(error: unknown, code: string, fallbackMessage: string): AppError {
    if (error instanceof AppError) return error;
    const message = error instanceof Error ? error.message : fallbackMessage;
    return new AppError(code, message, 500);
  }
}

// Singleton
let serviceInstance: BrowserService | null = null;

export function getBrowserService(): BrowserService {
  if (!serviceInstance) {
    serviceInstance = new BrowserService();
  }
  return serviceInstance;
}
