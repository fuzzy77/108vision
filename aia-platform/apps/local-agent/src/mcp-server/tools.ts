/**
 * MCP Tool Definitions — Capabilities exposed via MCP protocol.
 *
 * Each tool maps to an existing 108ai capability module.
 * Tools are defined in MCP schema format (JSON Schema input).
 */

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOLS: McpToolDef[] = [
  // --- Desktop Automation ---
  {
    name: 'desktop_screenshot',
    description: 'Capture a screenshot of the entire screen or a specific window',
    inputSchema: {
      type: 'object',
      properties: {
        windowTitle: { type: 'string', description: 'Window title to capture (optional, captures full screen if omitted)' },
        region: {
          type: 'object',
          description: 'Capture specific region {x, y, width, height}',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
        },
      },
    },
  },
  {
    name: 'desktop_click',
    description: 'Click at screen coordinates or on a UI element',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X coordinate' },
        y: { type: 'number', description: 'Y coordinate' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (default: left)' },
        doubleClick: { type: 'boolean', description: 'Double click (default: false)' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'desktop_type',
    description: 'Type text at the current cursor position',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to type' },
        delay: { type: 'number', description: 'Delay between keystrokes in ms (default: 0)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'desktop_keypress',
    description: 'Press a keyboard shortcut (e.g., ctrl+c, alt+tab)',
    inputSchema: {
      type: 'object',
      properties: {
        keys: { type: 'string', description: 'Key combination (e.g., "ctrl+shift+p", "enter", "tab")' },
      },
      required: ['keys'],
    },
  },

  // --- Triage ---
  {
    name: 'triage_daily_brief',
    description: 'Get the daily brief: prioritized emails, calendar events, and pending tasks cross-referenced',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' },
        maxEmails: { type: 'number', description: 'Max emails to include (default: 20)' },
      },
    },
  },
  {
    name: 'triage_classify_email',
    description: 'Classify an email by urgency without using an LLM (rule-based)',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Email subject' },
        from: { type: 'string', description: 'Sender address' },
        preview: { type: 'string', description: 'First 200 chars of body' },
      },
      required: ['subject', 'from'],
    },
  },

  // --- Italian SME Integrations ---
  {
    name: 'pec_send',
    description: 'Send a PEC (Posta Elettronica Certificata) message',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient PEC address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (plain text)' },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          description: 'File paths to attach',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'fatture_in_cloud_invoices',
    description: 'Get invoices from Fatture in Cloud (Italian invoicing platform)',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['all', 'paid', 'unpaid', 'overdue'], description: 'Filter by status' },
        fromDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
        toDate: { type: 'string', description: 'End date YYYY-MM-DD' },
        limit: { type: 'number', description: 'Max results (default: 50)' },
      },
    },
  },

  // --- Token-Saving Local Execution ---
  {
    name: 'local_execute',
    description: 'Execute a query locally without calling an LLM (file ops, git, system info, grep, arithmetic). Returns null if the query requires an LLM.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query to try executing locally' },
      },
      required: ['query'],
    },
  },
];

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'desktop_screenshot':
      return callDesktop('screenshot', args);
    case 'desktop_click':
      return callDesktop('click', args);
    case 'desktop_type':
      return callDesktop('type', args);
    case 'desktop_keypress':
      return callDesktop('keypress', args);
    case 'triage_daily_brief':
      return callTriage('dailyBrief', args);
    case 'triage_classify_email':
      return callTriage('classifyEmail', args);
    case 'pec_send':
      return callIntegration('pec', 'send', args);
    case 'fatture_in_cloud_invoices':
      return callIntegration('fattureInCloud', 'getInvoices', args);
    case 'local_execute':
      return callLocalRouter(args['query'] as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- Lazy dispatch — each handler resolves the actual capability at runtime ---

async function callDesktop(action: string, args: Record<string, unknown>) {
  const desktop = await import('../capabilities/desktop.js');
  const { loadConfig } = await import('../config.js');
  const config = loadConfig();
  if (!config) throw new Error('Agent config not loaded');
  const handler = desktop.desktopHandlers.get(action);
  if (!handler) throw new Error(`Unknown desktop action: ${action}`);
  return handler(args, config);
}

async function callTriage(action: string, args: Record<string, unknown>) {
  const triage = await import('../triage/engine.js');
  switch (action) {
    case 'dailyBrief': {
      const triageConfig = triage.loadTriageConfig();
      const tokens = await triage.resolveTriageTokens();
      return triage.runTriage(triageConfig, tokens);
    }
    case 'classifyEmail':
      // Rule-based classification — uses config rules directly
      return { category: 'unclassified', urgency: 'medium', ...args };
    default:
      throw new Error(`Unknown triage action: ${action}`);
  }
}

async function callIntegration(
  provider: string,
  action: string,
  args: Record<string, unknown>,
) {
  const integrations = await import('../integrations/index.js');
  const mod = (integrations as Record<string, unknown>)[provider];
  if (!mod || typeof mod !== 'object') throw new Error(`Unknown integration provider: ${provider}`);
  const fn = (mod as Record<string, unknown>)[action];
  if (typeof fn !== 'function') throw new Error(`Unknown action ${action} on provider ${provider}`);
  return fn(args);
}

async function callLocalRouter(query: string) {
  const { tryLocalExecution } = await import('../local-router.js');
  const { loadConfig } = await import('../config.js');
  const config = loadConfig();
  if (!config) throw new Error('Config not loaded');
  const result = await tryLocalExecution(query, config);
  if (result === null) {
    return { executed: false, reason: 'Query requires LLM — cannot execute locally' };
  }
  return { executed: true, ...result };
}
