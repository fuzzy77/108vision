/**
 * Security Layer — Validates all incoming requests before execution.
 *
 * Responsibilities:
 * - Path sandboxing verification (prevent directory traversal)
 * - Action allowlist validation
 * - Rate limiting (max N actions/minute)
 * - Audit logging of all actions
 */

import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, normalize, dirname } from 'node:path';
import { rotateAuditLogIfNeeded } from './hardening/audit-rotation.js';
import type { AgentConfig } from './config.js';
import { getAuditLogPath } from './config.js';
import { assertSafeUrl } from './capabilities/web.js';

// --- Rate Limiter ---

interface RateLimitEntry {
  timestamps: number[];
}

const tenantRateLimitState = new Map<string, RateLimitEntry>();

/**
 * Check if an action is allowed under the rate limit.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(config: AgentConfig): boolean {
  const tenantId = config.tenantId?.trim() || 'default';
  const now = Date.now();
  const windowMs = 60_000; // 1 minute window

  const state = tenantRateLimitState.get(tenantId) ?? { timestamps: [] };

  // Remove timestamps outside the window
  state.timestamps = state.timestamps.filter(
    (ts) => now - ts < windowMs,
  );

  if (state.timestamps.length >= config.maxActionsPerMinute) {
    tenantRateLimitState.set(tenantId, state);
    return false;
  }

  state.timestamps.push(now);
  tenantRateLimitState.set(tenantId, state);
  return true;
}

// --- Path Sandboxing ---

/**
 * Validate that a file path is within allowed directories.
 * Prevents directory traversal attacks (../../ escapes).
 *
 * @returns The resolved absolute path if valid, or null if denied.
 */
export function validatePath(
  rawPath: string,
  allowedDirectories: string[],
): string | null {
  // Resolve to absolute path (handles relative paths, .., etc.)
  const resolvedPath = resolve(normalize(rawPath));

  // Check for null bytes (path injection)
  if (resolvedPath.includes('\0')) {
    return null;
  }

  // Verify the path is under at least one allowed directory
  for (const allowedDir of allowedDirectories) {
    const normalizedAllowed = resolve(normalize(allowedDir));

    // Use platform-aware comparison
    const pathLower = resolvedPath.toLowerCase();
    const allowedLower = normalizedAllowed.toLowerCase();

    if (pathLower === allowedLower || pathLower.startsWith(allowedLower + '/') || pathLower.startsWith(allowedLower + '\\')) {
      return resolvedPath;
    }
  }

  return null;
}

/**
 * Check if a path targets a system directory that should never be accessed.
 */
export function isSystemPath(rawPath: string): boolean {
  const resolvedPath = resolve(normalize(rawPath)).toLowerCase();

  const systemPaths = [
    // Windows
    'c:\\windows',
    'c:\\program files',
    'c:\\program files (x86)',
    'c:\\programdata',
    // macOS / Linux
    '/usr',
    '/bin',
    '/sbin',
    '/etc',
    '/var',
    '/sys',
    '/proc',
    '/boot',
    '/root',
    '/lib',
  ];

  for (const sysPath of systemPaths) {
    if (resolvedPath.startsWith(sysPath)) {
      return true;
    }
  }

  return false;
}

// --- Action Allowlist ---

/**
 * Risk levels for actions:
 * - 'read-only': Does not modify system state; auto-approved when autoApproveReadOnly is true.
 * - 'low-risk':  Minor state change (e.g. window focus, scroll); auto-approved when autoApproveLowRisk is true.
 * - 'high-risk': Can modify application data or trigger side-effects; requires explicit approval
 *               (requireApprovalHighRisk) unless the gateway injects `_approved: true`.
 */
export type ActionRiskLevel = 'read-only' | 'low-risk' | 'high-risk';

/**
 * Master action registry: action name → risk level.
 * Desktop actions are present in this map regardless of whether desktopEnabled is true;
 * the capability handler is responsible for enforcing the desktopEnabled guard.
 */
const ACTION_RISK_LEVELS = new Map<string, ActionRiskLevel>([
  // Filesystem
  ['filesystem.readFile',       'read-only'],
  ['filesystem.writeFile',      'low-risk'],
  ['filesystem.editFile',       'low-risk'],
  ['filesystem.listDirectory',  'read-only'],
  ['filesystem.searchFiles',    'read-only'],
  ['filesystem.grep',           'read-only'],
  ['filesystem.watchDirectory', 'read-only'],
  ['filesystem.getFileInfo',    'read-only'],
  // Shell
  ['shell.execute',             'high-risk'],
  ['shell.executeStream',       'high-risk'],
  ['shell.terminate',           'low-risk'],
  ['shell.getRunning',          'read-only'],
  ['shell.getInfo',             'read-only'],
  // Code
  ['code.readRange',            'read-only'],
  ['code.edit',                 'low-risk'],
  ['code.editMulti',            'low-risk'],
  ['code.write',                'low-risk'],
  // Git
  ['git.status',                'read-only'],
  ['git.diff',                  'read-only'],
  ['git.log',                   'read-only'],
  ['git.commit',                'low-risk'],
  ['git.branch',                'low-risk'],
  ['git.stash',                 'low-risk'],
  ['git.blame',                 'read-only'],
  ['git.push',                  'high-risk'],
  ['git.reset',                 'high-risk'],
  // Search
  ['search.grep',               'read-only'],
  ['search.glob',               'read-only'],
  ['search.find',               'read-only'],
  // Web
  ['web.fetch',                 'low-risk'],
  ['web.search',                'read-only'],
  // Process
  ['process.start',             'high-risk'],
  ['process.stop',              'low-risk'],
  ['process.list',              'read-only'],
  ['process.logs',              'read-only'],
  // Index / Context (Local RAG)
  ['index.build',               'read-only'],
  ['index.search',              'read-only'],
  ['index.status',              'read-only'],
  ['index.clear',               'low-risk'],
  ['context.assemble',          'read-only'],
  // Clipboard
  ['clipboard.read',            'read-only'],
  ['clipboard.write',           'low-risk'],
  // System
  ['system.openUrl',            'low-risk'],
  ['system.openFile',           'low-risk'],
  ['system.showNotification',   'low-risk'],
  ['system.getSystemInfo',      'read-only'],
  // Desktop — read-only
  ['desktop.listWindows',       'read-only'],
  ['desktop.readWindow',        'read-only'],
  ['desktop.readFocused',       'read-only'],
  ['desktop.screenshot',        'read-only'],
  ['desktop.analyzeScreen',     'read-only'],
  ['desktop.getUITree',         'read-only'],
  // Desktop — low-risk
  ['desktop.focusWindow',       'low-risk'],
  ['desktop.scrollWindow',      'low-risk'],
  // Desktop — high-risk
  ['desktop.typeText',          'high-risk'],
  ['desktop.clickElement',      'high-risk'],
  ['desktop.pressHotkey',       'high-risk'],
  ['desktop.mouseClick',        'high-risk'],
  // Triage & Jobs (dashboard consulente)
  ['triage.lastReport',         'read-only'],
  ['triage.schedule',           'read-only'],
  ['triage.run',                'low-risk'],
  ['jobs.list',                 'read-only'],
  ['jobs.get',                  'read-only'],
  ['jobs.scheduler',            'read-only'],
  ['jobs.run',                  'low-risk'],
]);

/**
 * Validate that an action is in the allowlist.
 */
export function isActionAllowed(action: string): boolean {
  return ACTION_RISK_LEVELS.has(action);
}

/**
 * Get the risk level for an action.
 * Returns undefined for unknown actions (they are denied by isActionAllowed).
 */
export function getActionRiskLevel(action: string): ActionRiskLevel | undefined {
  return ACTION_RISK_LEVELS.get(action);
}

/**
 * Get all allowed action names.
 */
export function getAllowedActions(): string[] {
  return Array.from(ACTION_RISK_LEVELS.keys());
}

/**
 * Get all actions grouped by risk level.
 */
export function getActionsByRiskLevel(): Record<ActionRiskLevel, string[]> {
  const groups: Record<ActionRiskLevel, string[]> = {
    'read-only': [],
    'low-risk': [],
    'high-risk': [],
  };
  for (const [action, level] of ACTION_RISK_LEVELS) {
    groups[level].push(action);
  }
  return groups;
}

// --- Audit Logging ---

interface AuditEntry {
  timestamp: string;
  action: string;
  params: Record<string, unknown>;
  result: 'allowed' | 'denied' | 'error';
  reason?: string;
  durationMs?: number;
}

/**
 * Write an audit log entry.
 * Format: one JSON object per line (JSONL).
 */
export function auditLog(entry: AuditEntry): void {
  rotateAuditLogIfNeeded();
  const logPath = getAuditLogPath();

  // Ensure directory exists
  const dir = dirname(logPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const line = JSON.stringify({
    ...entry,
    // Sanitize params: redact sensitive fields and truncate large values
    params: sanitizeForAudit(entry.params),
  }) + '\n';

  try {
    appendFileSync(logPath, line, 'utf-8');
  } catch {
    // Audit log write failure should not crash the agent
    console.error(`[audit] Failed to write audit log to ${logPath}`);
  }
}

/**
 * Sanitize parameters for safe audit logging (no PII, no secrets, truncated values).
 */
function sanitizeForAudit(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const keyLower = key.toLowerCase();

    // Redact sensitive fields
    if (
      keyLower.includes('password') ||
      keyLower.includes('secret') ||
      keyLower.includes('token') ||
      keyLower.includes('key')
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Truncate long string values
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = `${value.slice(0, 200)}... [truncated, ${value.length} chars]`;
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

// --- Combined Security Check ---

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Run all security checks for an incoming action request.
 */
export function performSecurityCheck(
  action: string,
  params: Record<string, unknown>,
  config: AgentConfig,
): SecurityCheckResult {
  // 1. Action allowlist
  if (!isActionAllowed(action)) {
    return { allowed: false, reason: `Action "${action}" is not in the allowlist` };
  }

  // 2. Rate limit
  if (!checkRateLimit(config)) {
    return {
      allowed: false,
      reason: `Rate limit exceeded (max ${config.maxActionsPerMinute} actions/minute)`,
    };
  }

  // 3. Path validation for filesystem, code, shell, git, search, process
  const pathActions = new Set([
    'filesystem.readFile', 'filesystem.writeFile', 'filesystem.editFile',
    'filesystem.listDirectory', 'filesystem.searchFiles', 'filesystem.grep',
    'filesystem.watchDirectory', 'filesystem.getFileInfo',
    'code.readRange', 'code.edit', 'code.editMulti', 'code.write',
    'shell.execute', 'shell.executeStream', 'process.start',
    'search.grep', 'search.glob', 'search.find',
    'git.blame',
    'index.build', 'index.search', 'index.status', 'index.clear',
    'context.assemble',
  ]);

  if (pathActions.has(action) || action.startsWith('git.')) {
    const path = params['path'] as string | undefined;
    const directory = params['directory'] as string | undefined;
    const cwd = params['cwd'] as string | undefined;
    const filePath = params['filePath'] as string | undefined;
    const targetPath = path ?? directory ?? cwd ?? filePath;

    if (targetPath) {
      if (isSystemPath(targetPath)) {
        return { allowed: false, reason: `Access to system path denied: ${targetPath}` };
      }

      const validated = validatePath(targetPath, config.allowedDirectories);
      if (!validated) {
        return {
          allowed: false,
          reason: `Path "${targetPath}" is outside allowed directories: ${config.allowedDirectories.join(', ')}`,
        };
      }
    }
  }

  // Shell opt-in
  if ((action === 'shell.execute' || action === 'shell.executeStream' || action === 'process.start')
    && config.shellEnabled === false) {
    return {
      allowed: false,
      reason: 'Shell execution is disabled. Set shellEnabled: true in config.',
    };
  }

  // Git opt-in
  if (action.startsWith('git.') && config.gitEnabled === false) {
    return {
      allowed: false,
      reason: 'Git capabilities are disabled (gitEnabled: false).',
    };
  }

  // High-risk approval (shell, git push/reset, process)
  const riskLevel = getActionRiskLevel(action);
  if (riskLevel === 'high-risk' && config.riskPreferences.requireApprovalHighRisk) {
    if (params['_approved'] !== true) {
      return {
        allowed: false,
        reason: `High-risk action "${action}" requires gateway approval (_approved: true).`,
      };
    }
  }

  // web.fetch SSRF guard
  if (action === 'web.fetch') {
    const url = params['url'] as string | undefined;
    if (url) {
      try {
        assertSafeUrl(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'URL blocked';
        return { allowed: false, reason: message };
      }
    }
  }

  // 4. Desktop action guards
  if (action.startsWith('desktop.')) {
    // Desktop must be globally enabled
    if (!config.desktopEnabled) {
      return {
        allowed: false,
        reason: 'Desktop capabilities are disabled. Enable via the tray toggle or set desktopEnabled: true in config.',
      };
    }

    const riskLevel = getActionRiskLevel(action);

    // Block high-risk desktop actions at the security layer when approval is required
    // and the gateway has NOT injected the approval flag.
    // The capability handler applies the same check, but this layer provides an
    // early exit before the handler is even looked up.
    if (riskLevel === 'high-risk' && config.riskPreferences.requireApprovalHighRisk) {
      if (params['_approved'] !== true) {
        return {
          allowed: false,
          reason: `High-risk desktop action "${action}" requires explicit gateway approval (_approved: true).`,
        };
      }
    }

    // Check process blocklist
    const targetProcess = params['processName'] as string | undefined;
    if (targetProcess) {
      const blocked = config.blockedProcesses ?? [];
      if (blocked.some((p) => targetProcess.toLowerCase().includes(p.toLowerCase()))) {
        return {
          allowed: false,
          reason: `Process "${targetProcess}" is in the blocked process list.`,
        };
      }

      const allowed = config.allowedProcesses;
      if (allowed && allowed.length > 0) {
        if (!allowed.some((p) => targetProcess.toLowerCase().includes(p.toLowerCase()))) {
          return {
            allowed: false,
            reason: `Process "${targetProcess}" is not in the allowed process list.`,
          };
        }
      }
    }
  }

  return { allowed: true };
}
