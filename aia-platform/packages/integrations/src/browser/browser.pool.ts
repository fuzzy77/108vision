/**
 * Browser Pool — Manages Playwright browser instances and contexts.
 *
 * Design:
 * - Singleton browser instance shared across all tenants (resource efficient)
 * - One isolated BrowserContext per session (no cookie/state leakage)
 * - Session tracking with TTL and automatic cleanup
 * - Hard limit on concurrent sessions to prevent resource exhaustion
 */

import type { Browser, BrowserContext, Page } from 'playwright';
import { nanoid } from 'nanoid';
import type { BrowserPoolConfig, BrowserSession } from './types.js';

const DEFAULT_CONFIG: BrowserPoolConfig = {
  maxSessionsPerTenant: 3,
  sessionTimeoutMs: 5 * 60 * 1000, // 5 minutes
  maxConcurrentSessions: 20,
  blockedResourceTypes: ['media', 'font', 'image'],
  blockedDomains: [
    'googletagmanager.com',
    'google-analytics.com',
    'facebook.net',
    'doubleclick.net',
    'adservice.google.com',
    'analytics.google.com',
    'connect.facebook.net',
    'platform.twitter.com',
  ],
  defaultUserAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  defaultViewport: { width: 1280, height: 720 },
};

interface ManagedSession {
  id: string;
  tenantId: string;
  context: BrowserContext;
  page: Page;
  createdAt: number;
  lastActivity: number;
  currentUrl: string;
  pageTitle: string;
}

export class BrowserPool {
  private browser: Browser | null = null;
  private sessions = new Map<string, ManagedSession>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private config: BrowserPoolConfig;
  private launching: Promise<Browser> | null = null;

  constructor(config: Partial<BrowserPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Lazily launch the shared browser instance.
   * Uses a launch guard to prevent multiple simultaneous launches.
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.launching) {
      return this.launching;
    }

    this.launching = this.launchBrowser();
    try {
      this.browser = await this.launching;
      return this.browser;
    } finally {
      this.launching = null;
    }
  }

  private async launchBrowser(): Promise<Browser> {
    // Dynamic import so Playwright is only loaded when needed
    const { chromium } = await import('playwright');

    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--mute-audio',
      ],
    });

    // Start periodic cleanup if not already running
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(
        () => void this.cleanupExpiredSessions(),
        30_000,
      );
    }

    return browser;
  }

  /**
   * Create a new browser session for a tenant.
   * Each session gets an isolated context with no shared state.
   */
  async createSession(tenantId: string): Promise<BrowserSession> {
    // Enforce per-tenant limit
    const tenantSessionCount = this.getSessionCountForTenant(tenantId);
    if (tenantSessionCount >= this.config.maxSessionsPerTenant) {
      throw new Error(
        `Tenant ${tenantId} has reached the maximum of ${this.config.maxSessionsPerTenant} concurrent sessions`,
      );
    }

    // Enforce global limit
    if (this.sessions.size >= this.config.maxConcurrentSessions) {
      throw new Error(
        `Maximum concurrent sessions (${this.config.maxConcurrentSessions}) reached. Try again later.`,
      );
    }

    const browser = await this.getBrowser();

    const context = await browser.newContext({
      userAgent: this.config.defaultUserAgent,
      viewport: this.config.defaultViewport,
      javaScriptEnabled: true,
      ignoreHTTPSErrors: false,
      locale: 'en-US',
      timezoneId: 'Europe/Rome',
    });

    // Block ads, trackers, and unnecessary resources for speed
    await context.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      const url = request.url();

      // Block specified resource types
      if (this.config.blockedResourceTypes.includes(resourceType)) {
        return route.abort();
      }

      // Block tracker/ad domains
      const hostname = new URL(url).hostname;
      for (const blocked of this.config.blockedDomains) {
        if (hostname.includes(blocked)) {
          return route.abort();
        }
      }

      return route.continue();
    });

    const page = await context.newPage();

    const sessionId = nanoid(21);
    const now = Date.now();

    const session: ManagedSession = {
      id: sessionId,
      tenantId,
      context,
      page,
      createdAt: now,
      lastActivity: now,
      currentUrl: 'about:blank',
      pageTitle: '',
    };

    this.sessions.set(sessionId, session);

    return {
      id: sessionId,
      tenantId,
      createdAt: now,
      lastActivity: now,
      currentUrl: 'about:blank',
      pageTitle: '',
    };
  }

  /**
   * Retrieve a session by ID, validating tenant ownership.
   * Touches the lastActivity timestamp to prevent timeout.
   */
  getSession(sessionId: string, tenantId: string): ManagedSession {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found or expired`);
    }

    if (session.tenantId !== tenantId) {
      throw new Error(`Session ${sessionId} not found or expired`);
    }

    // Touch the session
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Get the Page object for a session.
   */
  getPage(sessionId: string, tenantId: string): Page {
    const session = this.getSession(sessionId, tenantId);
    return session.page;
  }

  /**
   * Update session metadata after navigation.
   */
  updateSessionState(sessionId: string, url: string, title: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.currentUrl = url;
      session.pageTitle = title;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Close a session and free resources.
   */
  async closeSession(sessionId: string, tenantId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return; // Already closed
    }

    if (session.tenantId !== tenantId) {
      throw new Error(`Session ${sessionId} not found or expired`);
    }

    await this.destroySession(sessionId);
  }

  /**
   * Get session info without the page/context (safe to expose).
   */
  getSessionInfo(sessionId: string, tenantId: string): BrowserSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.tenantId !== tenantId) {
      return null;
    }
    return {
      id: session.id,
      tenantId: session.tenantId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      currentUrl: session.currentUrl,
      pageTitle: session.pageTitle,
    };
  }

  /**
   * Count active sessions for a specific tenant.
   */
  getSessionCountForTenant(tenantId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up expired sessions (called periodically).
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.config.sessionTimeoutMs) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      await this.destroySession(id);
    }

    if (expired.length > 0) {
      console.log(JSON.stringify({
        level: 'info',
        message: 'Browser sessions cleaned up',
        expiredCount: expired.length,
        remainingCount: this.sessions.size,
      }));
    }
  }

  /**
   * Destroy a session, closing page and context.
   */
  private async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.delete(sessionId);

    try {
      await session.page.close();
    } catch {
      // Page may already be closed
    }

    try {
      await session.context.close();
    } catch {
      // Context may already be closed
    }
  }

  /**
   * Shut down the pool completely.
   * Closes all sessions and the browser instance.
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const sessionIds = Array.from(this.sessions.keys());
    for (const id of sessionIds) {
      await this.destroySession(id);
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get pool statistics for monitoring.
   */
  getStats(): { totalSessions: number; browserConnected: boolean } {
    return {
      totalSessions: this.sessions.size,
      browserConnected: this.browser?.isConnected() ?? false,
    };
  }
}

// Singleton instance
let poolInstance: BrowserPool | null = null;

export function getBrowserPool(config?: Partial<BrowserPoolConfig>): BrowserPool {
  if (!poolInstance) {
    poolInstance = new BrowserPool(config);
  }
  return poolInstance;
}

export async function shutdownBrowserPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.shutdown();
    poolInstance = null;
  }
}
