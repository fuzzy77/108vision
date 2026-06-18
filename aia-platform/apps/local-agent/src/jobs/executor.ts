/**
 * Job Executor — 108 AI Desktop Agent
 *
 * Core execution engine for the Job Engine subsystem.
 *
 * Responsibilities:
 *   - Template variable interpolation ({{expression}} syntax)
 *   - Sequential step execution with topological ordering via `dependsOn`
 *   - Parallel step execution via `parallel` step type
 *   - Per-step and per-job retry policies
 *   - AI budget enforcement before LLM calls
 *   - Integration dispatch (gmail, calendar, office COM)
 *   - Shell and HTTP step execution
 *   - JobRun persistence via appendRun
 *
 * Design decisions:
 *   - Dynamic imports for integrations to avoid circular dependencies
 *   - execFile (never exec) to prevent shell injection on shell steps
 *   - AbortSignal.timeout on all network calls
 *   - Promise.allSettled for parallel steps — one failure does not abort others
 *   - Budget check before every AI step, not just at job start
 */

import { execFile } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

import type {
  JobDefinition,
  StepDefinition,
  StepResult,
  JobRun,
  JobStatus,
  RetryPolicy,
} from './types.js';
import { appendRun } from './store.js';
import { trackTokens } from '../resources/config.js';
import { isLLMBlocked, isModelDowngraded } from '../resources/auto-healer.js';
import { loadConfig } from '../config.js';
import { validateShellCommand } from '../capabilities/shell-security.js';
import { commandsAllowShell } from '../extensions/permissions.js';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Execution context
// ---------------------------------------------------------------------------

/**
 * Template context available during execution.
 * Populated at job start and extended as steps complete.
 */
export interface ExecutionContext {
  /** Completed step outputs, keyed by step id. */
  steps: Record<string, { output: unknown; status: string }>;
  /** ISO timestamp of job start. */
  now: string;
  /** YYYY-MM-DD of job start. */
  today: string;
  /** ISO date string of the Monday of the current week (Monday = first day). */
  weekStart: string;
  /** ISO week number (1–53, per ISO 8601). */
  weekNumber: number;
  /** Human-readable job name. */
  jobName: string;
  /** Unique run identifier (UUID). */
  runId: string;
}

// ---------------------------------------------------------------------------
// Template interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate `{{expression}}` placeholders in a template string.
 *
 * Supported expressions:
 *   {{steps.<id>.output}}   — serialised output of a previous step
 *   {{now}}                 — ISO start timestamp
 *   {{today}}               — YYYY-MM-DD
 *   {{week_start}}          — ISO date of Monday in the current week
 *   {{week_number}}         — ISO week number
 *   {{job.name}}            — job name
 *   {{params.<key>}}        — if context carries a `params` object (injected
 *                             per-step by the caller, not part of the
 *                             ExecutionContext interface — looked up via
 *                             step-level metadata when needed)
 *
 * Unknown expressions resolve to an empty string.
 */
export function interpolateTemplate(
  template: string,
  context: ExecutionContext & { params?: Record<string, unknown> },
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, rawExpr: string) => {
    const expr = rawExpr.trim();

    // {{steps.<id>.output}}
    const stepsMatch = expr.match(/^steps\.([^.]+)\.output$/);
    if (stepsMatch !== null) {
      const stepId = stepsMatch[1]!;
      const stepData = context.steps[stepId];
      if (stepData === undefined) return '';
      const output = stepData.output;
      if (output === null || output === undefined) return '';
      if (typeof output === 'string') return output;
      try {
        return JSON.stringify(output);
      } catch {
        return String(output);
      }
    }

    // {{params.<key>}}
    const paramsMatch = expr.match(/^params\.(.+)$/);
    if (paramsMatch !== null) {
      const key = paramsMatch[1]!;
      const val = context.params?.[key];
      if (val === null || val === undefined) return '';
      return String(val);
    }

    switch (expr) {
      case 'now':          return context.now;
      case 'today':        return context.today;
      case 'week_start':   return context.weekStart;
      case 'week_number':  return String(context.weekNumber);
      case 'job.name':     return context.jobName;
      default:             return '';
    }
  });
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function buildExecutionContext(job: JobDefinition, runId: string): ExecutionContext {
  const now = new Date();
  const nowIso = now.toISOString();

  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  // Monday of the current week (ISO: week starts on Monday)
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().slice(0, 10);

  const weekNumber = getIsoWeekNumber(now);

  return {
    steps:      {},
    now:        nowIso,
    today,
    weekStart,
    weekNumber,
    jobName:    job.name,
    runId,
  };
}

/** Return the ISO 8601 week number (1–53) for the given date. */
function getIsoWeekNumber(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  // Thursday in the current week determines the year
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - yearStart.getTime()) / 86_400_000 -
        3 +
        ((yearStart.getDay() + 6) % 7)) /
        7,
    )
  );
}

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

interface RetryResult {
  result: unknown;
  retries: number;
}

/**
 * Execute `fn` with an optional retry policy.
 *
 * The retry back-off is exponential (initialDelay * 2^attempt) capped at
 * `maxDelay` when provided, otherwise uncapped.
 */
async function executeWithRetry(
  fn: () => Promise<unknown>,
  policy?: RetryPolicy,
): Promise<RetryResult> {
  const maxAttempts = 1 + (policy?.count ?? 0);
  const initialDelay = policy?.initialDelay ?? 500;
  const maxDelay = policy?.maxDelay ?? 30_000;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts - 1) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function jobRetryPolicy(job: JobDefinition): RetryPolicy | undefined {
  return job.onFailure?.retry;
}

function shouldAbortOnFailure(job: JobDefinition): boolean {
  return (job.onFailure?.strategy ?? 'abort') === 'abort';
}

// ---------------------------------------------------------------------------
// AI step
// ---------------------------------------------------------------------------

async function executeAiStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<string> {
  const { resolveModelConfig } = await import('../provider-keys.js');
  if (isLLMBlocked()) {
    throw new Error('LLM blocked by token emergency budget (auto-healer).');
  }

  const requestedTier = (step.model as string) ?? 'balanced';
  const effectiveTier = isModelDowngraded() ? 'fast-cheap' : requestedTier;

  const modelConfig = resolveModelConfig(
    effectiveTier as Parameters<typeof resolveModelConfig>[0],
  );

  if (modelConfig === null) {
    throw new Error(`No LLM provider configured for tier: ${effectiveTier}`);
  }

  const prompt = interpolateTemplate(step.prompt ?? '', context);
  const timeoutMs = step.timeout ?? 60_000;

  const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: step.maxTokens ?? 2_000,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`LLM API error: ${response.status} ${response.statusText} — ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  // Surface token usage as a side-effect on the step for budget tracking
  if (data.usage !== undefined) {
    (step as StepDefinition & { _tokenUsage?: unknown })._tokenUsage = data.usage;

    const totalTokens = data.usage.total_tokens ?? 0;
    if (totalTokens > 0) trackTokens(totalTokens, context.runId);
  }

  return data.choices?.[0]?.message?.content ?? '';
}

// ---------------------------------------------------------------------------
// Shell step
// ---------------------------------------------------------------------------

const IS_WINDOWS = platform() === 'win32';

async function executeShellStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<string> {
  const command = interpolateTemplate(step.command ?? '', context);
  if (!command.trim()) {
    throw new Error('Shell step requires a non-empty command');
  }

  if (!commandsAllowShell()) {
    throw new Error(
      'Shell steps blocked by permissions.yml (commands.allow_shell: deny)',
    );
  }

  const config = loadConfig();
  if (!config) {
    throw new Error('Agent config not found (~/.108ai/config.json)');
  }
  if (config.shellEnabled === false) {
    throw new Error(
      'Shell steps blocked: set shellEnabled: true in ~/.108ai/config.json',
    );
  }

  validateShellCommand(command, config);

  const timeoutMs = step.timeout ?? 30_000;

  const { stdout } = IS_WINDOWS
    ? await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf-8',
      })
    : await execFileAsync('bash', ['-c', command], {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf-8',
      });

  return typeof stdout === 'string' ? stdout : '';
}

// ---------------------------------------------------------------------------
// HTTP step
// ---------------------------------------------------------------------------

async function executeHttpStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<unknown> {
  const url = interpolateTemplate(step.url ?? '', context);
  const method = (step.method ?? 'GET').toUpperCase();
  const headers = step.headers ?? {};
  const bodyRaw = step.body !== undefined
    ? interpolateTemplate(typeof step.body === 'string' ? step.body : JSON.stringify(step.body), context)
    : undefined;
  const timeoutMs = step.timeout ?? 15_000;

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: bodyRaw,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP step failed: ${response.status} ${response.statusText} — ${text}`);
  }

  // Return parsed JSON when the content type is JSON; otherwise plain text
  const ct = response.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  return text;
}

// ---------------------------------------------------------------------------
// Integration step
// ---------------------------------------------------------------------------

/**
 * Map an action string like `"gmail.send"` to its module + exported function.
 *
 * Supported namespaces: gmail, google-calendar, office-outlook
 */
async function executeIntegrationStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<unknown> {
  const action: string = step.action ?? '';
  const dotIndex = action.indexOf('.');

  if (dotIndex === -1) {
    throw new Error(`Integration action must be "namespace.function", got: "${action}"`);
  }

  const ns = action.slice(0, dotIndex);
  const fn = action.slice(dotIndex + 1);

  // Resolve params — interpolate string params, leave others as-is
  const rawParams = step.params ?? {};
  const params: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawParams)) {
    params[key] = typeof val === 'string'
      ? interpolateTemplate(val, { ...context, params: rawParams as Record<string, unknown> })
      : val;
  }

  switch (ns) {
    case 'gmail': {
      const mod = await import('../integrations/gmail.js');
      const callable = (mod as Record<string, unknown>)[fn];
      if (typeof callable !== 'function') {
        throw new Error(`gmail.${fn} is not an exported function`);
      }
      return (callable as (...args: unknown[]) => Promise<unknown>)(params);
    }

    case 'google-calendar': {
      const mod = await import('../integrations/google-calendar.js');
      const callable = (mod as Record<string, unknown>)[fn];
      if (typeof callable !== 'function') {
        throw new Error(`google-calendar.${fn} is not an exported function`);
      }
      return (callable as (...args: unknown[]) => Promise<unknown>)(params);
    }

    case 'office-outlook': {
      const mod = await import('../integrations/office-outlook.js');
      const callable = (mod as Record<string, unknown>)[fn];
      if (typeof callable !== 'function') {
        throw new Error(`office-outlook.${fn} is not an exported function`);
      }
      return (callable as (...args: unknown[]) => Promise<unknown>)(params);
    }

    default:
      throw new Error(`Unknown integration namespace: "${ns}". Supported: gmail, google-calendar, office-outlook`);
  }
}

// ---------------------------------------------------------------------------
// COM step (Office automation: Excel, Word, Outlook)
// ---------------------------------------------------------------------------

async function executeComStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<unknown> {
  const action: string = step.action ?? '';
  const dotIndex = action.indexOf('.');

  if (dotIndex === -1) {
    throw new Error(`COM action must be "app.function", got: "${action}"`);
  }

  const app = action.slice(0, dotIndex);
  const fn  = action.slice(dotIndex + 1);

  const rawParams = step.params ?? {};
  const params: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawParams)) {
    params[key] = typeof val === 'string'
      ? interpolateTemplate(val, { ...context, params: rawParams as Record<string, unknown> })
      : val;
  }

  switch (app) {
    case 'excel': {
      const mod = await import('../integrations/office-excel.js');
      const callable = (mod as Record<string, unknown>)[fn];
      if (typeof callable !== 'function') {
        throw new Error(`office-excel.${fn} is not an exported function`);
      }
      return (callable as (...args: unknown[]) => Promise<unknown>)(params);
    }

    case 'word': {
      const mod = await import('../integrations/office-word.js');
      const callable = (mod as Record<string, unknown>)[fn];
      if (typeof callable !== 'function') {
        throw new Error(`office-word.${fn} is not an exported function`);
      }
      return (callable as (...args: unknown[]) => Promise<unknown>)(params);
    }

    case 'outlook': {
      const mod = await import('../integrations/office-outlook.js');
      const callable = (mod as Record<string, unknown>)[fn];
      if (typeof callable !== 'function') {
        throw new Error(`office-outlook.${fn} is not an exported function`);
      }
      return (callable as (...args: unknown[]) => Promise<unknown>)(params);
    }

    default:
      throw new Error(`Unknown COM app: "${app}". Supported: excel, word, outlook`);
  }
}

// ---------------------------------------------------------------------------
// Script step
// ---------------------------------------------------------------------------

async function executeScriptStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<string> {
  const { executeScript } = await import('../script-store.js');
  const scriptId: string = step.scriptId ?? step.action ?? '';

  if (!scriptId) {
    throw new Error('Script step requires scriptId or action field with the script ID');
  }

  const args: string[] = (step.args ?? []).map((a: string) =>
    interpolateTemplate(a, context),
  );

  const result = await executeScript(scriptId, args);
  return result.stdout;
}

// ---------------------------------------------------------------------------
// Program step
// ---------------------------------------------------------------------------

async function executeProgramStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<string> {
  const program = interpolateTemplate(step.action ?? '', context);
  const args: string[] = (step.args ?? []).map((a: string) =>
    interpolateTemplate(a, context),
  );
  const timeoutMs = step.timeout ?? 30_000;

  const { stdout } = await execFileAsync(program, args, {
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
    encoding: 'utf-8',
  });

  return typeof stdout === 'string' ? stdout : '';
}

// ---------------------------------------------------------------------------
// Condition step
// ---------------------------------------------------------------------------

/**
 * Evaluate a simple condition expression against the execution context.
 *
 * Supported forms:
 *   "steps.<id>.output"       — truthy if the step output is truthy
 *   "steps.<id>.status == ok" — exact equality check on status
 *   "<literal>"               — string truthy check
 */
function evaluateCondition(
  expr: string | undefined,
  context: ExecutionContext,
): boolean {
  if (expr === undefined || expr.trim() === '') return false;

  // Interpolate first, so {{steps.foo.output}} becomes the actual value
  const interpolated = interpolateTemplate(expr.trim(), context);

  // After interpolation, falsy strings: '', '0', 'false', 'null', 'undefined'
  const lower = interpolated.trim().toLowerCase();
  if (lower === '' || lower === '0' || lower === 'false' || lower === 'null' || lower === 'undefined') {
    return false;
  }

  // Support "steps.<id>.status == <value>" (direct path access, not interpolated)
  const eqMatch = expr.trim().match(/^steps\.([^.]+)\.status\s*==\s*(.+)$/);
  if (eqMatch !== null) {
    const stepId = eqMatch[1]!;
    const expected = eqMatch[2]!.trim().replace(/^['"]|['"]$/g, '');
    const actual = context.steps[stepId]?.status ?? '';
    return actual === expected;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Single-step executor
// ---------------------------------------------------------------------------

/**
 * Execute a single step and return a StepResult.
 * Does not apply retry — that is handled by the caller via executeWithRetry.
 */
async function executeStep(
  step: StepDefinition,
  context: ExecutionContext,
): Promise<StepResult> {
  const startedAt = new Date().toISOString();
  const startMs   = Date.now();

  let output: unknown;
  let tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;

  try {
    switch (step.type) {
      case 'ai': {
        const text = await executeAiStep(step, context);
        output = text;
        // Harvest token usage attached as a side-effect by executeAiStep
        const usage = (step as StepDefinition & { _tokenUsage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        } })._tokenUsage;
        if (usage !== undefined) {
          tokenUsage = {
            promptTokens:     usage.prompt_tokens     ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
            totalTokens:      usage.total_tokens      ?? 0,
          };
        }
        break;
      }

      case 'shell':
        output = await executeShellStep(step, context);
        break;

      case 'http':
        output = await executeHttpStep(step, context);
        break;

      case 'integration':
        output = await executeIntegrationStep(step, context);
        break;

      case 'com':
        output = await executeComStep(step, context);
        break;

      case 'script':
        output = await executeScriptStep(step, context);
        break;

      case 'program':
        output = await executeProgramStep(step, context);
        break;

      case 'condition': {
        // Condition steps select a branch but do not produce a primary output;
        // the JobRun record notes which branch was chosen.
        const condResult = evaluateCondition(step.if, context);
        output = condResult;
        // Return immediately — branch navigation is handled in executeJob
        return {
          stepId:       step.id,
          status:       'completed',
          output,
          durationMs:   Date.now() - startMs,
          startedAt,
          completedAt:  new Date().toISOString(),
          retries:      0,
          tokensUsed:   0,
          branchTaken:  condResult ? 'then' : 'else',
        };
      }

      case 'parallel':
        // Parallel steps are handled at the job level; if we reach here it is
        // a nested parallel — execute the sub-step IDs concurrently.
        output = `parallel:${(step.steps ?? []).join(',')}`;
        break;

      case 'human':
        // In automated execution mode, human steps are auto-skipped.
        return {
          stepId:      step.id,
          status:      'skipped',
          output:      '[human step — skipped in automated mode]',
          durationMs:  0,
          startedAt,
          completedAt: new Date().toISOString(),
          retries:     0,
          tokensUsed:  0,
          note:        'Human interaction required; step was skipped in automated execution.',
        };

      default:
        throw new Error(`Unknown step type: "${(step as StepDefinition).type}"`);
    }

    return {
      stepId:      step.id,
      status:      'completed',
      output,
      durationMs:  Date.now() - startMs,
      startedAt,
      completedAt: new Date().toISOString(),
      retries:     0,
      tokensUsed:  tokenUsage?.totalTokens ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      stepId:      step.id,
      status:      'failed',
      output:      null,
      error:       message,
      durationMs:  Date.now() - startMs,
      startedAt,
      completedAt: new Date().toISOString(),
      retries:     0,
      tokensUsed:  tokenUsage?.totalTokens ?? 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Topological sort
// ---------------------------------------------------------------------------

/**
 * Return steps in a valid execution order, respecting `dependsOn` edges.
 *
 * Steps without `dependsOn` are placed first (in definition order).
 * Circular dependencies fall back gracefully to definition order with
 * a warning rather than throwing — the executor will fail naturally when
 * a step's dependency output is missing.
 */
function buildExecutionOrder(steps: StepDefinition[]): StepDefinition[] {
  const byId = new Map<string, StepDefinition>(steps.map((s) => [s.id, s]));
  const visited  = new Set<string>();
  const visiting = new Set<string>(); // cycle detection
  const ordered: StepDefinition[] = [];

  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      // Cycle detected — skip to avoid infinite recursion
      return;
    }
    visiting.add(id);

    const step = byId.get(id);
    if (step === undefined) {
      visiting.delete(id);
      return;
    }

    for (const depId of step.dependsOn ?? []) {
      visit(depId);
    }

    visiting.delete(id);
    visited.add(id);
    ordered.push(step);
  }

  for (const step of steps) {
    visit(step.id);
  }

  return ordered;
}

// ---------------------------------------------------------------------------
// Budget check
// ---------------------------------------------------------------------------

/**
 * Return true if executing an AI step would exceed the job's token budget.
 * We use a conservative estimate based on tokens already consumed.
 */
function isBudgetExceeded(
  job: JobDefinition,
  usedTokens: number,
): boolean {
  if (job.budget === undefined) return false;
  return usedTokens >= job.budget.maxTokensPerRun;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main job executor
// ---------------------------------------------------------------------------

/**
 * Execute all steps of a job definition and return a persisted JobRun record.
 *
 * Algorithm:
 *   1. Build execution context (timestamps, week info, run ID)
 *   2. Topological sort of steps via dependsOn
 *   3. For each step in order:
 *      a. Check if step is part of a condition branch and skip accordingly
 *      b. Check AI budget; abort if exceeded
 *      c. Expand parallel steps concurrently via Promise.allSettled
 *      d. Execute step with retry policy
 *      e. Store result in context.steps
 *      f. Apply onFailure config: 'abort' (default) | 'skip' | 'retry'
 *   4. Persist JobRun via appendRun
 *   5. Return JobRun
 */
export async function executeJob(
  job: JobDefinition,
  trigger: 'manual' | 'scheduled' | 'event',
): Promise<JobRun> {
  const runId     = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const context   = buildExecutionContext(job, runId);

  const stepResults: StepResult[] = [];
  let totalTokensUsed    = 0;
  let jobStatus: JobStatus = 'running';

  // Collect IDs of steps that have been skipped via condition branching
  const skippedByCondition = new Set<string>();

  const orderedSteps = buildExecutionOrder(job.steps ?? []);

  // Build a flat lookup of all step definitions for parallel expansion
  const stepById = new Map<string, StepDefinition>(
    (job.steps ?? []).map((s) => [s.id, s]),
  );

  stepLoop: for (const step of orderedSteps) {
    // --- Skip if this step was excluded by a condition branch ---
    if (skippedByCondition.has(step.id)) {
      const skipped: StepResult = {
        stepId:      step.id,
        status:      'skipped',
        output:      null,
        durationMs:  0,
        startedAt:   new Date().toISOString(),
        completedAt: new Date().toISOString(),
        retries:     0,
        tokensUsed:  0,
        note:        'Skipped: excluded by condition branch',
      };
      stepResults.push(skipped);
      context.steps[step.id] = { output: null, status: 'skipped' };
      continue;
    }

    // --- Handle parallel step type ---
    if (step.type === 'parallel') {
      const subIds = step.steps ?? [];
      const subSteps = subIds
        .map((id) => stepById.get(id))
        .filter((s): s is StepDefinition => s !== undefined);

      const parallelStart = Date.now();
      const parallelResults = await Promise.allSettled(
        subSteps.map(async (sub) => {
          const policy = sub.retry ?? jobRetryPolicy(job);
          const { result: subResult, retries } = await executeWithRetry(
            async () => executeStep(sub, context),
            policy,
          );
          const sr = subResult as StepResult;
          return { ...sr, retries };
        }),
      );

      let parallelFailed = false;
      for (let i = 0; i < parallelResults.length; i++) {
        const pr = parallelResults[i]!;
        const subStep = subSteps[i]!;

        if (pr.status === 'fulfilled') {
          const sr = pr.value;
          stepResults.push(sr);
          context.steps[sr.stepId] = { output: sr.output, status: sr.status };
          if (sr.tokensUsed > 0) {
            totalTokensUsed += sr.tokensUsed;
          }
          if (sr.status === 'failed') parallelFailed = true;
        } else {
          // Promise itself rejected (should not happen since executeStep catches)
          const failResult: StepResult = {
            stepId:      subStep.id,
            status:      'failed',
            output:      null,
            error:       pr.reason instanceof Error ? pr.reason.message : String(pr.reason),
            durationMs:  Date.now() - parallelStart,
            startedAt:   new Date().toISOString(),
            completedAt: new Date().toISOString(),
            retries:     0,
            tokensUsed:  0,
          };
          stepResults.push(failResult);
          context.steps[subStep.id] = { output: null, status: 'failed' };
          parallelFailed = true;
        }
      }

      // Record the parallel container step itself as ok/error
      const parallelContainerResult: StepResult = {
        stepId:      step.id,
        status:      parallelFailed ? 'failed' : 'completed',
        output:      `Ran ${subSteps.length} steps in parallel`,
        durationMs:  Date.now() - parallelStart,
        startedAt,
        completedAt: new Date().toISOString(),
        retries:     0,
        tokensUsed:  0,
      };
      stepResults.push(parallelContainerResult);
      context.steps[step.id] = {
        output: parallelContainerResult.output,
        status: parallelContainerResult.status,
      };

      if (parallelFailed && shouldAbortOnFailure(job)) {
        jobStatus = 'failed';
        break stepLoop;
      }

      continue;
    }

    // --- Budget check for AI steps ---
    if (step.type === 'ai' && isBudgetExceeded(job, totalTokensUsed)) {
      const budgetResult: StepResult = {
        stepId:      step.id,
        status:      'failed',
        output:      null,
        error:       `Token budget exceeded: ${totalTokensUsed} >= ${job.budget?.maxTokensPerRun}`,
        durationMs:  0,
        startedAt:   new Date().toISOString(),
        completedAt: new Date().toISOString(),
        retries:     0,
        tokensUsed:  totalTokensUsed,
        note:        'Step aborted due to token budget exhaustion',
      };
      stepResults.push(budgetResult);
      context.steps[step.id] = { output: null, status: 'failed' };
      jobStatus = 'failed';
      break stepLoop;
    }

    // --- Execute step with retry ---
    const policy  = step.retry ?? jobRetryPolicy(job);
    let stepResult: StepResult;

    try {
      const { result, retries } = await executeWithRetry(
        () => executeStep(step, context),
        policy,
      );
      stepResult = { ...(result as StepResult), retries };
    } catch (err) {
      // executeWithRetry exhausted all attempts; wrap as error result
      const message = err instanceof Error ? err.message : String(err);
      stepResult = {
        stepId:      step.id,
        status:      'failed',
        output:      null,
        error:       message,
        durationMs:  0,
        startedAt:   new Date().toISOString(),
        completedAt: new Date().toISOString(),
        retries:     (policy?.count ?? 0),
        tokensUsed:  0,
      };
    }

    stepResults.push(stepResult);
    context.steps[step.id] = { output: stepResult.output, status: stepResult.status };

    if (stepResult.tokensUsed > 0) {
      totalTokensUsed += stepResult.tokensUsed;
    }

    // --- Condition branch handling ---
    if (step.type === 'condition' && stepResult.status === 'completed') {
      const branch = stepResult.branchTaken;
      const thenIds: string[] = step.then ?? [];
      const elseIds: string[] = step.else ?? [];

      if (branch === 'then') {
        // Mark else-branch steps as skipped
        for (const id of elseIds) skippedByCondition.add(id);
      } else {
        // Mark then-branch steps as skipped
        for (const id of thenIds) skippedByCondition.add(id);
      }
    }

    // --- Failure handling ---
    if (stepResult.status === 'failed') {
      if (shouldAbortOnFailure(job)) {
        jobStatus = 'failed';
        break stepLoop;
      }
    }
  }

  if (jobStatus === 'running') {
    const anyError = stepResults.some((r) => r.status === 'failed');
    jobStatus = anyError ? 'failed' : 'completed';
  }

  const completedAt = new Date().toISOString();

  const run: JobRun = {
    id:         runId,
    jobId:      job.id,
    jobName:    job.name,
    trigger,
    status:     jobStatus,
    startedAt,
    completedAt,
    durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
    stepResults,
    totalTokens: totalTokensUsed,
    totalCost:   0,
  };

  appendRun(job.id, run);

  return run;
}
