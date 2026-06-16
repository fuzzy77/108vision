export type StepType = 'ai' | 'shell' | 'http' | 'integration' | 'com' | 'script' | 'program' | 'condition' | 'parallel' | 'human';

export type TriggerType = 'cron' | 'event' | 'manual';

export type FailureStrategy = 'retry' | 'skip' | 'abort' | 'fallback' | 'notify';

export type JobStatus = 'idle' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'aborted';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface JobTrigger {
  type: TriggerType;
  schedule?: string;           // cron expression (for type: cron)
  /** @deprecated Legacy alias — use schedule */
  cron?: string;
  source?: string;             // event source (for type: event)
  condition?: string;          // event filter (for type: event)
}

export interface RetryPolicy {
  count: number;
  backoff: 'fixed' | 'exponential' | 'linear';
  maxDelay?: number;           // ms
  initialDelay?: number;       // ms (default 1000)
}

export interface FailureConfig {
  strategy: FailureStrategy;
  retry?: RetryPolicy;
  fallbackStep?: string;       // step ID to execute on failure
  notify?: {
    channel: string;           // 'console' | 'desktop' | 'file' | 'telegram'
    message?: string;          // template string
  };
  circuitBreaker?: {
    threshold: number;         // consecutive failures before auto-pause
    resetAfterMs: number;
  };
}

export interface StepDefinition {
  id: string;
  type: StepType;
  description?: string;

  // Type-specific params
  action?: string;             // for integration/com/program
  command?: string;            // for shell
  scriptId?: string;           // for script
  model?: string;              // for ai: 'fast-cheap' | 'balanced' | 'powerful'
  prompt?: string;             // for ai
  url?: string;                // for http
  method?: string;             // for http
  headers?: Record<string, string>; // for http
  body?: string;               // for http (template string)
  params?: Record<string, string>; // generic params (template strings)

  // Condition type
  if?: string;                 // expression for condition step
  then?: string[];             // step IDs to run if true
  else?: string[];             // step IDs to run if false

  // Parallel type
  steps?: string[];            // step IDs to run in parallel

  // Human type
  question?: string;           // prompt to show user
  options?: string[];          // choices

  // Common config
  timeout?: number;            // ms (default 30000)
  retry?: RetryPolicy;
  maxTokens?: number;          // for ai steps
  outputFormat?: 'text' | 'json' | 'markdown';
  dependsOn?: string[];        // step IDs that must complete first
  skipIf?: string;             // expression — skip this step if true
  /** CLI args for script/program steps */
  args?: string[];
  /** Human step: continue if operator does not respond in time */
  continueOnTimeout?: boolean;
}

export interface JobBudget {
  maxTokensPerRun: number;
  maxCostPerRun?: number;      // USD
  monthlyCap?: number;         // USD
  tokensUsedThisMonth?: number;
  costUsedThisMonth?: number;
}

export interface JobDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  trigger: JobTrigger;
  steps: StepDefinition[];
  budget: JobBudget;
  onFailure: FailureConfig;
  metadata: {
    created: string;           // ISO
    updated: string;           // ISO
    owner?: string;
    tags: string[];
  };
  enabled: boolean;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  output: unknown;             // the data produced by this step
  error?: string;
  startedAt: string;           // ISO
  completedAt?: string;        // ISO
  durationMs: number;
  tokensUsed: number;
  retries: number;
  branchTaken?: 'then' | 'else';
  note?: string;
}

export interface JobRun {
  id: string;
  jobId: string;
  jobName: string;
  status: JobStatus;
  trigger: 'manual' | 'scheduled' | 'event';
  startedAt: string;           // ISO
  completedAt?: string;        // ISO
  durationMs: number;
  stepResults: StepResult[];
  totalTokens: number;
  totalCost: number;
  error?: string;
}

export interface JobRunHistory {
  jobId: string;
  runs: JobRun[];
}

// Registry of all jobs
export interface JobRegistry {
  jobs: JobDefinition[];
  updatedAt: string;
}

/** Alias used by CLI layers */
export type Job = JobDefinition;

export interface JobStats {
  totalRuns: number;
  successRuns: number;
  successRate: number;
  totalTokens: number;
  totalCostUsd: number;
  avgDurationMs: number;
  avgCostUsd?: number;
}

export function isJobRunSuccess(run: JobRun): boolean {
  return run.status === 'completed';
}
