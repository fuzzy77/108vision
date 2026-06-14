/**
 * Chrome DevTools Protocol (CDP) Adapter
 *
 * Connects to Chrome or Edge via the remote debugging port and exposes
 * a high-level API for navigating pages, reading DOM content, interacting
 * with form fields, clicking elements, capturing screenshots, managing
 * tabs, and evaluating arbitrary JavaScript.
 *
 * Prerequisites:
 *   Launch Chrome/Edge with:
 *     --remote-debugging-port=9222  (Chrome default)
 *
 * Implementation notes:
 * - All DOM interaction is performed via `Runtime.evaluate` to keep
 *   the implementation self-contained and avoid the complexity of the
 *   full CDP DOM domain.
 * - Uses the native `WebSocket` global (Node 21+ / Bun) — no external
 *   packages required.
 * - Auto-detects the debug port by probing 9222 → 9229.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CdpConfig {
  /** Remote debugging port. Default: 9222 */
  debugPort: number;
  /** Operation timeout in milliseconds. Default: 30_000 */
  timeout: number;
}

export interface TabInfo {
  id: string;
  title: string;
  url: string;
  type: string;
}

export interface PageContent {
  title: string;
  url: string;
  /** Visible text, whitespace-normalised */
  text: string;
  /** Full outer HTML — only populated when `includeHtml` is true */
  html?: string;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface CdpMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

interface RawTabDescriptor {
  id: string;
  title: string;
  url: string;
  type: string;
  webSocketDebuggerUrl?: string;
}

interface PendingRequest {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Module state (singleton connection)
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: CdpConfig = {
  debugPort: 9222,
  timeout: 30_000,
};

const AUTO_DETECT_PORTS = [9222, 9229];

let _ws: WebSocket | null = null;
let _config: CdpConfig = { ...DEFAULT_CONFIG };
let _nextId = 1;
const _pending = new Map<number, PendingRequest>();

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

/**
 * Connect to a Chrome/Edge instance via the remote debugging port.
 *
 * If `config.debugPort` is not reachable, auto-detection tries ports
 * 9222 and 9229 in order. Returns `false` (without throwing) when no
 * Chrome instance with remote debugging is found.
 */
export async function connectCdp(config?: Partial<CdpConfig>): Promise<boolean> {
  if (_ws) {
    // Already connected — nothing to do.
    return true;
  }

  _config = { ...DEFAULT_CONFIG, ...config };

  // Determine which port to use, with auto-detection fallback.
  const ports =
    config?.debugPort !== undefined
      ? [config.debugPort]
      : AUTO_DETECT_PORTS;

  for (const port of ports) {
    try {
      const tabs = await _fetchTabs(port);
      const target = tabs.find(
        (t) => t.type === 'page' && typeof t.webSocketDebuggerUrl === 'string',
      );

      if (!target?.webSocketDebuggerUrl) continue;

      _config.debugPort = port;
      await _openWebSocket(target.webSocketDebuggerUrl);
      return true;
    } catch {
      // Port not available — try next.
    }
  }

  console.warn(
    '[chrome-cdp] No Chrome/Edge instance found with remote debugging enabled.\n' +
    'Launch the browser with: --remote-debugging-port=9222',
  );
  return false;
}

/** Close the WebSocket connection. */
export function disconnectCdp(): void {
  if (_ws) {
    _ws.close();
    _ws = null;
  }
  // Reject all in-flight requests.
  for (const [, req] of _pending) {
    clearTimeout(req.timer);
    req.reject(new Error('CDP connection closed'));
  }
  _pending.clear();
}

/** Returns `true` when a WebSocket session is active. */
export function isCdpConnected(): boolean {
  return _ws !== null && _ws.readyState === WebSocket.OPEN;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** Navigate the active tab to `url` and return the resulting page content. */
export async function navigate(url: string): Promise<PageContent> {
  _assertConnected();
  await _send('Page.navigate', { url });
  await _waitForLoad();
  return getPageContent();
}

/** Navigate back in browser history. */
export async function goBack(): Promise<PageContent> {
  _assertConnected();
  await _evaluate('window.history.back()');
  await _waitForLoad();
  return getPageContent();
}

/** Reload the current page. */
export async function reload(): Promise<PageContent> {
  _assertConnected();
  await _send('Page.reload', { ignoreCache: false });
  await _waitForLoad();
  return getPageContent();
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/**
 * Return the content of the current page.
 * @param includeHtml  When `true`, the `html` field is populated with the
 *                     full outer HTML of `document.documentElement`.
 */
export async function getPageContent(includeHtml?: boolean): Promise<PageContent> {
  _assertConnected();

  const titleResult = await _evaluate<string>('document.title');
  const urlResult = await _evaluate<string>('window.location.href');
  const textResult = await _evaluate<string>(
    '(function(){' +
    '  var el=document.body;' +
    '  if(!el)return "";' +
    '  return el.innerText.replace(/\\s+/g," ").trim();' +
    '})()',
  );

  const content: PageContent = {
    title: titleResult ?? '',
    url: urlResult ?? '',
    text: textResult ?? '',
  };

  if (includeHtml) {
    content.html = await _evaluate<string>('document.documentElement.outerHTML') ?? '';
  }

  return content;
}

/** Return the `textContent` of the first element matching `selector`. */
export async function getElementText(selector: string): Promise<string> {
  _assertConnected();
  const js =
    `(function(){` +
    `  var el=document.querySelector(${JSON.stringify(selector)});` +
    `  return el?el.textContent.trim():"";` +
    `})()`;
  return (await _evaluate<string>(js)) ?? '';
}

/** Return the list of open tabs (type === "page" only). */
export async function listTabs(): Promise<TabInfo[]> {
  const raw = await _fetchTabs(_config.debugPort);
  return raw
    .filter((t) => t.type === 'page')
    .map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      type: t.type,
    }));
}

/**
 * Switch the CDP session to the tab with the given `tabId`.
 * Returns the content of the newly active tab.
 */
export async function switchTab(tabId: string): Promise<PageContent> {
  const raw = await _fetchTabs(_config.debugPort);
  const target = raw.find((t) => t.id === tabId);
  if (!target) {
    throw new Error(`Tab not found: ${tabId}`);
  }
  if (!target.webSocketDebuggerUrl) {
    throw new Error(`Tab ${tabId} has no WebSocket debugger URL (may not be attachable)`);
  }

  disconnectCdp();
  await _openWebSocket(target.webSocketDebuggerUrl);
  return getPageContent();
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

/**
 * Click the first element matching `selector`.
 * Returns `true` if the element was found and clicked.
 */
export async function clickElement(selector: string): Promise<boolean> {
  _assertConnected();
  const js =
    `(function(){` +
    `  var el=document.querySelector(${JSON.stringify(selector)});` +
    `  if(!el)return false;` +
    `  el.click();` +
    `  return true;` +
    `})()`;
  return (await _evaluate<boolean>(js)) ?? false;
}

/**
 * Click the first element whose visible text content contains `text`
 * (case-insensitive substring match, using XPath).
 * Returns `true` if an element was found and clicked.
 */
export async function clickByText(text: string): Promise<boolean> {
  _assertConnected();
  const escapedText = text.replace(/'/g, "\\'");
  const js =
    `(function(){` +
    `  var xpath=".//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),` +
    `'${escapedText.toLowerCase()}')]";` +
    `  var result=document.evaluate(xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null);` +
    `  var el=result.singleNodeValue;` +
    `  if(!el)return false;` +
    `  el.click();` +
    `  return true;` +
    `})()`;
  return (await _evaluate<boolean>(js)) ?? false;
}

/**
 * Set the value of an input/textarea/select matching `selector` and
 * dispatch `input` + `change` events so frameworks (React, Vue, Angular)
 * pick up the change.
 * Returns `true` if the element was found.
 */
export async function fillField(selector: string, value: string): Promise<boolean> {
  _assertConnected();
  const escapedValue = JSON.stringify(value);
  const js =
    `(function(){` +
    `  var el=document.querySelector(${JSON.stringify(selector)});` +
    `  if(!el)return false;` +
    `  var nativeInputValueSetter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value");` +
    `  if(nativeInputValueSetter&&nativeInputValueSetter.set){` +
    `    nativeInputValueSetter.set.call(el,${escapedValue});` +
    `  }else{` +
    `    el.value=${escapedValue};` +
    `  }` +
    `  el.dispatchEvent(new Event("input",{bubbles:true}));` +
    `  el.dispatchEvent(new Event("change",{bubbles:true}));` +
    `  return true;` +
    `})()`;
  return (await _evaluate<boolean>(js)) ?? false;
}

/**
 * Type `text` into the currently focused element by dispatching
 * `keydown` / `keypress` / `keyup` events for each character.
 */
export async function typeText(text: string): Promise<boolean> {
  _assertConnected();
  for (const char of text) {
    await _send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      text: char,
      unmodifiedText: char,
    });
    await _send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      text: char,
      unmodifiedText: char,
    });
  }
  return true;
}

/**
 * Press a named key (e.g. `'Enter'`, `'Tab'`, `'Escape'`, `'ArrowDown'`).
 * Uses `Input.dispatchKeyEvent` with CDP key identifiers.
 */
export async function pressKey(key: string): Promise<boolean> {
  _assertConnected();
  await _send('Input.dispatchKeyEvent', { type: 'keyDown', key });
  await _send('Input.dispatchKeyEvent', { type: 'keyUp', key });
  return true;
}

// ---------------------------------------------------------------------------
// Screenshots
// ---------------------------------------------------------------------------

/**
 * Capture a PNG screenshot of the current viewport.
 * Returns a base64-encoded PNG string.
 */
export async function takeScreenshot(): Promise<string> {
  _assertConnected();
  const result = await _send('Page.captureScreenshot', { format: 'png' });
  const data = result['data'];
  if (typeof data !== 'string') {
    throw new Error('Page.captureScreenshot returned no data');
  }
  return data;
}

// ---------------------------------------------------------------------------
// JavaScript evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate `expression` in the page's JavaScript context and return
 * the result. The expression is evaluated as a script (not as a
 * function body) — wrap in an IIFE when needed.
 */
export async function evaluate(expression: string): Promise<unknown> {
  _assertConnected();
  return _evaluate<unknown>(expression);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fetch the list of tab descriptors from the HTTP endpoint. */
async function _fetchTabs(port: number): Promise<RawTabDescriptor[]> {
  const response = await fetch(`http://localhost:${port}/json/list`);
  if (!response.ok) {
    throw new Error(`CDP HTTP endpoint returned ${response.status}`);
  }
  return response.json() as Promise<RawTabDescriptor[]>;
}

/** Open (or replace) the WebSocket connection to `wsUrl`. */
function _openWebSocket(wsUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const connectTimer = setTimeout(() => {
      ws.close();
      reject(new Error(`CDP WebSocket connection timed out (${_config.timeout}ms)`));
    }, _config.timeout);

    ws.onopen = () => {
      clearTimeout(connectTimer);
      _ws = ws;
      resolve();
    };

    ws.onerror = (event) => {
      clearTimeout(connectTimer);
      reject(new Error(`CDP WebSocket error: ${String(event)}`));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      let msg: CdpMessage;
      try {
        msg = JSON.parse(event.data) as CdpMessage;
      } catch {
        return;
      }

      if (msg.id !== undefined) {
        const pending = _pending.get(msg.id);
        if (pending) {
          clearTimeout(pending.timer);
          _pending.delete(msg.id);

          if (msg.error) {
            pending.reject(
              new Error(`CDP error ${msg.error.code}: ${msg.error.message}`),
            );
          } else {
            pending.resolve(msg.result ?? {});
          }
        }
      }
    };

    ws.onclose = () => {
      _ws = null;
    };
  });
}

/**
 * Send a CDP command and await the response.
 * Returns the `result` object from the response message.
 */
function _send(
  method: string,
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (!_ws || _ws.readyState !== WebSocket.OPEN) {
      reject(new Error('CDP is not connected. Call connectCdp() first.'));
      return;
    }

    const id = _nextId++;
    const timer = setTimeout(() => {
      _pending.delete(id);
      reject(new Error(`CDP command "${method}" timed out after ${_config.timeout}ms`));
    }, _config.timeout);

    _pending.set(id, { resolve, reject, timer });
    _ws.send(JSON.stringify({ id, method, params }));
  });
}

/**
 * Evaluate a JavaScript expression in the page context.
 * Returns the JSON-serialisable result value, or `undefined` on exception.
 */
async function _evaluate<T>(expression: string): Promise<T | undefined> {
  const result = await _send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  const exceptionDetails = result['exceptionDetails'];
  if (exceptionDetails) {
    // Non-fatal: surface the error message but don't throw — the caller
    // decides whether a missing element is an error.
    const detail = exceptionDetails as { exception?: { description?: string } };
    console.warn(
      `[chrome-cdp] evaluate warning: ${detail.exception?.description ?? String(exceptionDetails)}`,
    );
    return undefined;
  }

  const rv = result['result'] as { value?: T } | undefined;
  return rv?.value;
}

/**
 * Wait for the page load event (Page.loadEventFired) with a fallback
 * timeout that does NOT throw — some navigations resolve quickly and
 * the event has already fired before we start listening.
 */
async function _waitForLoad(): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, Math.min(_config.timeout, 10_000));

    // Poll `document.readyState` rather than relying on CDP events,
    // which avoids the complexity of registering/deregistering event handlers
    // on the shared WebSocket message listener.
    const poll = setInterval(async () => {
      try {
        const state = await _evaluate<string>('document.readyState');
        if (state === 'complete' || state === 'interactive') {
          clearTimeout(timer);
          clearInterval(poll);
          resolve();
        }
      } catch {
        // Connection may have dropped — resolve and let the next call fail.
        clearTimeout(timer);
        clearInterval(poll);
        resolve();
      }
    }, 200);
  });
}

/** Throw if the WebSocket session is not open. */
function _assertConnected(): void {
  if (!isCdpConnected()) {
    throw new Error(
      'CDP is not connected. Call connectCdp() first.\n' +
      'Make sure Chrome/Edge is running with --remote-debugging-port=9222.',
    );
  }
}
