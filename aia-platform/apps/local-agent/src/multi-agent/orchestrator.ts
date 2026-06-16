/**
 * Multi-Agent Orchestrator — 108 AI Desktop Agent
 *
 * Provides the ability to spawn multiple "worker" agents that execute
 * sub-tasks concurrently, with a coordinating orchestrator that merges results.
 *
 * Design:
 *   - All agents are concurrent LLM calls with separate contexts (no separate
 *     processes). Think of it like a local `Promise.allSettled` over LLM calls.
 *   - Dependency graph (topological sort) mirrors the job executor pattern in
 *     `jobs/executor.ts`. Tasks marked with `dependsOn` wait for the referenced
 *     agents to finish; their output is then injected as `context`.
 *   - Each LLM call uses `resolveModelConfig(tier)` from `provider-keys.ts` so
 *     provider selection follows the same priority/fallback logic as the rest of
 *     the system.
 *   - `Promise.allSettled` is used for parallel waves so one agent failure never
 *     aborts the others — results are collected and surfaced in OrchestrationResult.
 *   - Merge strategies: concatenate | summarize | vote | best | custom.
 *
 * Merge strategy notes:
 *   - `concatenate` : join raw outputs with a separator — no additional LLM call.
 *   - `summarize`   : one LLM call with all outputs + mergePrompt as instruction.
 *   - `vote`        : majority-vote on first line/sentence of each output.
 *   - `best`        : LLM "judge" selects the single best output.
 *   - `custom`      : mergePrompt is a template; agent outputs injected as
 *                     {{agent_<id>}} and {{all_outputs}}.
 */

import type { ModelTier } from '@aia/shared';
import { resolveModelConfig } from '../provider-keys.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AgentRole =
  | 'researcher'
  | 'writer'
  | 'analyst'
  | 'coder'
  | 'reviewer'
  | 'executor'
  | 'custom';

export interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  systemPrompt: string;
  model: ModelTier;
  maxTokens: number;
  /** Hard deadline in milliseconds before the agent call is aborted. */
  timeout: number;
}

export interface AgentTask {
  agentId: string;
  prompt: string;
  /** Additional context block injected before the user prompt. */
  context?: string;
  /**
   * IDs of other agents whose output must be available before this task starts.
   * The completed outputs are automatically appended to `context`.
   */
  dependsOn?: string[];
}

export interface AgentResult {
  agentId: string;
  role: AgentRole;
  name: string;
  output: string;
  tokensUsed: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'timeout';
  error?: string;
}

export interface OrchestrationPlan {
  id: string;
  name: string;
  description?: string;
  agents: AgentConfig[];
  tasks: AgentTask[];
  mergeStrategy: 'concatenate' | 'summarize' | 'vote' | 'best' | 'custom';
  /** Used by the 'summarize', 'best', and 'custom' merge strategies. */
  mergePrompt?: string;
  budget: {
    maxTotalTokens: number;
    maxCostUsd?: number;
  };
}

export interface OrchestrationResult {
  planId: string;
  planName: string;
  agentResults: AgentResult[];
  mergedOutput: string;
  totalTokens: number;
  totalDurationMs: number;
  status: 'completed' | 'partial' | 'failed';
}

// ---------------------------------------------------------------------------
// Agent templates
// ---------------------------------------------------------------------------

const AGENT_TEMPLATES: Record<AgentRole, Omit<AgentConfig, 'id'>> = {
  researcher: {
    role: 'researcher',
    name: 'Ricercatore',
    systemPrompt:
      'Sei un ricercatore preciso. Trova informazioni specifiche e cita le fonti. Rispondi in modo conciso e strutturato.',
    model: 'fast-cheap',
    maxTokens: 2_000,
    timeout: 30_000,
  },
  writer: {
    role: 'writer',
    name: 'Scrittore',
    systemPrompt:
      'Sei un copywriter professionale italiano. Scrivi contenuti chiari, coinvolgenti e orientati al target PMI.',
    model: 'balanced',
    maxTokens: 3_000,
    timeout: 45_000,
  },
  analyst: {
    role: 'analyst',
    name: 'Analista',
    systemPrompt:
      'Sei un analista di business. Esamina dati e situazioni con pensiero critico. Identifica pattern, rischi e opportunità.',
    model: 'balanced',
    maxTokens: 2_500,
    timeout: 45_000,
  },
  coder: {
    role: 'coder',
    name: 'Sviluppatore',
    systemPrompt:
      'Sei uno sviluppatore senior. Scrivi codice pulito, sicuro e ben documentato. TypeScript preferito.',
    model: 'balanced',
    maxTokens: 4_000,
    timeout: 60_000,
  },
  reviewer: {
    role: 'reviewer',
    name: 'Revisore',
    systemPrompt:
      'Sei un revisore esperto. Identifica errori, inconsistenze, problemi di qualità. Sii specifico e costruttivo.',
    model: 'fast-cheap',
    maxTokens: 2_000,
    timeout: 30_000,
  },
  executor: {
    role: 'executor',
    name: 'Esecutore',
    systemPrompt:
      "Sei un agente operativo. Esegui le istruzioni con precisione. Riporta cosa hai fatto e il risultato.",
    model: 'fast-cheap',
    maxTokens: 1_500,
    timeout: 30_000,
  },
  custom: {
    role: 'custom',
    name: 'Agente',
    systemPrompt: '',
    model: 'balanced',
    maxTokens: 2_000,
    timeout: 30_000,
  },
};

/**
 * Return the template for a given role (without an `id`).
 * Callers can spread the result and override individual fields.
 */
export function getAgentTemplate(role: AgentRole): Omit<AgentConfig, 'id'> {
  return { ...AGENT_TEMPLATES[role] };
}

// ---------------------------------------------------------------------------
// Internal LLM call
// ---------------------------------------------------------------------------

interface LlmCallResult {
  content: string;
  tokensUsed: number;
}

async function callAgent(
  agent: AgentConfig,
  userPrompt: string,
  context?: string,
): Promise<LlmCallResult> {
  const modelConfig = resolveModelConfig(agent.model);
  if (modelConfig === null) {
    throw new Error(`No provider configured for model tier: ${agent.model}`);
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: agent.systemPrompt },
  ];

  if (context !== undefined && context.trim() !== '') {
    messages.push({ role: 'user', content: `Contesto:\n${context}` });
  }

  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages,
      max_tokens: agent.maxTokens,
    }),
    signal: AbortSignal.timeout(agent.timeout),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Agent "${agent.name}" LLM error: HTTP ${response.status} — ${body}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens ?? 0;

  return { content, tokensUsed };
}

// ---------------------------------------------------------------------------
// Topological sort for tasks (same pattern as jobs/executor.ts)
// ---------------------------------------------------------------------------

/**
 * Group tasks into sequential waves based on `dependsOn`.
 * Each wave is a set of tasks that can execute in parallel because all their
 * dependencies were satisfied in earlier waves.
 *
 * Silently handles unknown dependency IDs (they are treated as already
 * satisfied). Cycles are broken by ignoring the back-edge — the executor will
 * still produce a result, although dependency output may be missing.
 */
function buildExecutionWaves(tasks: AgentTask[]): AgentTask[][] {
  const remaining = new Set<string>(tasks.map((t) => t.agentId));
  const completed = new Set<string>();
  const waves: AgentTask[][] = [];
  const taskByAgent = new Map<string, AgentTask>(tasks.map((t) => [t.agentId, t]));

  // Guard against infinite loops (e.g., mutual dependency)
  const maxPasses = tasks.length + 1;
  let pass = 0;

  while (remaining.size > 0 && pass < maxPasses) {
    pass++;
    const wave: AgentTask[] = [];

    for (const agentId of remaining) {
      const task = taskByAgent.get(agentId);
      if (task === undefined) {
        remaining.delete(agentId);
        continue;
      }

      const deps = task.dependsOn ?? [];
      // A task is ready when every declared dependency has already completed
      // OR the dependency ID does not exist in this plan (treat as satisfied).
      const allDepsReady = deps.every(
        (depId) => completed.has(depId) || !taskByAgent.has(depId),
      );

      if (allDepsReady) {
        wave.push(task);
      }
    }

    if (wave.length === 0) {
      // Cycle detected or nothing can proceed — push remaining as a single wave
      // to avoid infinite loop, accepting that dependency context will be absent.
      for (const agentId of remaining) {
        const task = taskByAgent.get(agentId);
        if (task !== undefined) wave.push(task);
      }
    }

    for (const task of wave) {
      remaining.delete(task.agentId);
      completed.add(task.agentId);
    }

    if (wave.length > 0) waves.push(wave);
  }

  return waves;
}

// ---------------------------------------------------------------------------
// Merge strategies
// ---------------------------------------------------------------------------

const MERGE_SEPARATOR = '\n---\n';

function mergeAgentOutputs(
  plan: OrchestrationPlan,
  agentResults: AgentResult[],
  _completedResults: Map<string, AgentResult>,
): string {
  const successfulOutputs = agentResults
    .filter((r) => r.status === 'completed')
    .map((r) => r.output);

  if (successfulOutputs.length === 0) {
    return '[Nessun agente ha completato con successo.]';
  }

  switch (plan.mergeStrategy) {
    case 'concatenate':
      return successfulOutputs.join(MERGE_SEPARATOR);

    case 'summarize': {
      // Merge via LLM call — caller must await this; we return a sentinel here
      // and replace it in executeOrchestration after the async call.
      // This path is handled outside this function.
      return '_NEEDS_LLM_MERGE_';
    }

    case 'vote': {
      // Extract the first non-empty line from each output (the "answer").
      const votes = successfulOutputs.map((out) =>
        out.split('\n').find((line) => line.trim() !== '')?.trim() ?? out.trim(),
      );
      const frequency = new Map<string, number>();
      for (const v of votes) {
        frequency.set(v, (frequency.get(v) ?? 0) + 1);
      }
      // Return the candidate with the highest count; ties go to the first one seen.
      let best = votes[0] ?? '';
      let bestCount = 0;
      for (const [candidate, count] of frequency.entries()) {
        if (count > bestCount) {
          best = candidate;
          bestCount = count;
        }
      }
      return best;
    }

    case 'best': {
      // LLM judge — handled outside; return sentinel.
      return '_NEEDS_LLM_MERGE_';
    }

    case 'custom': {
      // LLM call with template — handled outside; return sentinel.
      return '_NEEDS_LLM_MERGE_';
    }

    default:
      return successfulOutputs.join(MERGE_SEPARATOR);
  }
}

/**
 * Perform LLM-based merge for strategies that require it.
 * Returns the merged string, or a fallback concatenation on error.
 */
async function llmMerge(
  plan: OrchestrationPlan,
  agentResults: AgentResult[],
): Promise<string> {
  const successfulResults = agentResults.filter((r) => r.status === 'completed');
  if (successfulResults.length === 0) return '[Nessun agente ha completato con successo.]';

  const mergeModel: ModelTier = 'balanced';
  const modelConfig = resolveModelConfig(mergeModel);
  if (modelConfig === null) {
    // Fallback to concatenation when no provider is available.
    return successfulResults.map((r) => r.output).join(MERGE_SEPARATOR);
  }

  let systemPrompt: string;
  let userPrompt: string;

  const outputsBlock = successfulResults
    .map((r, i) => `### Agente ${i + 1}: ${r.name}\n${r.output}`)
    .join('\n\n');

  switch (plan.mergeStrategy) {
    case 'summarize': {
      systemPrompt =
        'Sei un sintetizzatore esperto. Ricevi gli output di più agenti AI e produci una sintesi coerente e completa.';
      const instruction = plan.mergePrompt?.trim()
        ? plan.mergePrompt
        : 'Sintetizza i seguenti output in una risposta unica, coerente e completa.';
      userPrompt = `${instruction}\n\n${outputsBlock}`;
      break;
    }

    case 'best': {
      systemPrompt =
        "Sei un giudice esperto. Ricevi gli output di più agenti AI e devi selezionare il migliore senza modificarlo.";
      const criteria = plan.mergePrompt?.trim()
        ? `Criteri di valutazione: ${plan.mergePrompt}`
        : '';
      userPrompt = `Seleziona il miglior output tra i seguenti. ${criteria}\n\nRispondi SOLO con l'output selezionato, senza aggiunte o commenti.\n\n${outputsBlock}`;
      break;
    }

    case 'custom': {
      systemPrompt =
        "Sei un agente di sintesi. Segui esattamente le istruzioni fornite nel prompt.";
      const template = plan.mergePrompt ?? 'Combina i seguenti output:\n\n{{all_outputs}}';
      // Inject per-agent outputs into the template via {{agent_<id>}} and {{all_outputs}}
      let rendered = template.replace('{{all_outputs}}', outputsBlock);
      for (const r of successfulResults) {
        rendered = rendered.replaceAll(`{{agent_${r.agentId}}}`, r.output);
      }
      userPrompt = rendered;
      break;
    }

    default:
      return successfulResults.map((r) => r.output).join(MERGE_SEPARATOR);
  }

  try {
    const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4_000,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(`Merge LLM error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? successfulResults.map((r) => r.output).join(MERGE_SEPARATOR);
  } catch {
    // Any merge failure falls back to concatenation — orchestration result is
    // still marked 'partial' by the caller if needed.
    return successfulResults.map((r) => r.output).join(MERGE_SEPARATOR);
  }
}

// ---------------------------------------------------------------------------
// Core orchestration execution
// ---------------------------------------------------------------------------

/**
 * Execute an OrchestrationPlan.
 *
 * Algorithm:
 *   1. Build dependency waves (topological sort).
 *   2. For each wave, run all tasks in parallel via Promise.allSettled.
 *   3. Collect outputs; inject completed dependency outputs into subsequent tasks.
 *   4. Enforce total-token budget (skip remaining tasks if exceeded).
 *   5. Merge results using the configured strategy.
 *   6. Return OrchestrationResult.
 */
export async function executeOrchestration(
  plan: OrchestrationPlan,
): Promise<OrchestrationResult> {
  const globalStart = Date.now();
  const agentByID = new Map<string, AgentConfig>(plan.agents.map((a) => [a.id, a]));
  const completedResults = new Map<string, AgentResult>();
  const allResults: AgentResult[] = [];
  let totalTokens = 0;
  let budgetExceeded = false;

  const waves = buildExecutionWaves(plan.tasks);

  for (const wave of waves) {
    if (budgetExceeded) break;

    // Execute all tasks in this wave in parallel.
    const wavePromises = wave.map(async (task): Promise<AgentResult> => {
      const agent = agentByID.get(task.agentId);

      if (agent === undefined) {
        return {
          agentId: task.agentId,
          role: 'custom',
          name: task.agentId,
          output: '',
          tokensUsed: 0,
          durationMs: 0,
          status: 'failed',
          error: `Agent config not found for id: "${task.agentId}"`,
        };
      }

      // Build context: user-supplied context + outputs from dependency agents.
      const parts: string[] = [];
      if (task.context !== undefined && task.context.trim() !== '') {
        parts.push(task.context);
      }
      for (const depId of task.dependsOn ?? []) {
        const dep = completedResults.get(depId);
        if (dep !== undefined && dep.status === 'completed') {
          parts.push(`Output di ${dep.name}:\n${dep.output}`);
        }
      }
      const combinedContext = parts.length > 0 ? parts.join('\n\n') : undefined;

      const taskStart = Date.now();

      try {
        const { content, tokensUsed } = await callAgent(agent, task.prompt, combinedContext);

        return {
          agentId: agent.id,
          role: agent.role,
          name: agent.name,
          output: content,
          tokensUsed,
          durationMs: Date.now() - taskStart,
          status: 'completed',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isTimeout =
          message.includes('TimeoutError') ||
          message.includes('The operation was aborted') ||
          (err instanceof DOMException && err.name === 'TimeoutError');

        return {
          agentId: agent.id,
          role: agent.role,
          name: agent.name,
          output: '',
          tokensUsed: 0,
          durationMs: Date.now() - taskStart,
          status: isTimeout ? 'timeout' : 'failed',
          error: message,
        };
      }
    });

    const waveSettled = await Promise.allSettled(wavePromises);

    for (const settled of waveSettled) {
      const result: AgentResult =
        settled.status === 'fulfilled'
          ? settled.value
          : {
              agentId: 'unknown',
              role: 'custom' as AgentRole,
              name: 'unknown',
              output: '',
              tokensUsed: 0,
              durationMs: 0,
              status: 'failed',
              error: settled.reason instanceof Error
                ? settled.reason.message
                : String(settled.reason),
            };

      allResults.push(result);
      completedResults.set(result.agentId, result);
      totalTokens += result.tokensUsed;

      if (totalTokens >= plan.budget.maxTotalTokens) {
        budgetExceeded = true;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Merge results
  // ---------------------------------------------------------------------------

  let mergedOutput: string;
  const needsLlm =
    plan.mergeStrategy === 'summarize' ||
    plan.mergeStrategy === 'best' ||
    plan.mergeStrategy === 'custom';

  if (needsLlm) {
    mergedOutput = await llmMerge(plan, allResults);
  } else {
    mergedOutput = mergeAgentOutputs(plan, allResults, completedResults);
  }

  // ---------------------------------------------------------------------------
  // Determine final status
  // ---------------------------------------------------------------------------

  const anyCompleted = allResults.some((r) => r.status === 'completed');
  const anyFailed = allResults.some(
    (r) => r.status === 'failed' || r.status === 'timeout',
  );

  let status: OrchestrationResult['status'];
  if (budgetExceeded && !anyCompleted) {
    status = 'failed';
  } else if (anyFailed || budgetExceeded) {
    status = 'partial';
  } else {
    status = 'completed';
  }

  return {
    planId: plan.id,
    planName: plan.name,
    agentResults: allResults,
    mergedOutput,
    totalTokens,
    totalDurationMs: Date.now() - globalStart,
    status,
  };
}

// ---------------------------------------------------------------------------
// Plan builder (fluent API)
// ---------------------------------------------------------------------------

export class OrchestrationPlanBuilder {
  private plan: OrchestrationPlan;

  constructor(name: string, description?: string) {
    this.plan = {
      id: crypto.randomUUID(),
      name,
      description,
      agents: [],
      tasks: [],
      mergeStrategy: 'concatenate',
      budget: { maxTotalTokens: 50_000 },
    };
  }

  /**
   * Add an agent to the plan.
   * An `id` is auto-generated if not provided.
   * Template defaults for the given `role` are applied as a base.
   */
  addAgent(config: Partial<AgentConfig> & { role: AgentRole }): this {
    const template = AGENT_TEMPLATES[config.role];
    const agent: AgentConfig = {
      ...template,
      ...config,
      id: config.id ?? crypto.randomUUID(),
    };
    this.plan.agents.push(agent);
    return this;
  }

  /**
   * Add a task for a specific agent.
   * @param agentId - Must match the `id` of an agent already added via `addAgent`.
   */
  addTask(
    agentId: string,
    prompt: string,
    opts?: { context?: string; dependsOn?: string[] },
  ): this {
    this.plan.tasks.push({ agentId, prompt, ...opts });
    return this;
  }

  /**
   * Configure how agent outputs are merged into a final result.
   * @param strategy - The merge strategy to apply.
   * @param prompt   - Required for 'summarize', 'best', and 'custom' strategies.
   */
  setMerge(strategy: OrchestrationPlan['mergeStrategy'], prompt?: string): this {
    this.plan.mergeStrategy = strategy;
    if (prompt !== undefined) this.plan.mergePrompt = prompt;
    return this;
  }

  /**
   * Set the token and optional cost budget for the entire plan.
   * Execution stops accepting new tasks once `maxTokens` is reached.
   */
  setBudget(maxTokens: number, maxCost?: number): this {
    this.plan.budget = { maxTotalTokens: maxTokens, maxCostUsd: maxCost };
    return this;
  }

  build(): OrchestrationPlan {
    if (this.plan.agents.length === 0) {
      throw new Error('OrchestrationPlan must contain at least one agent.');
    }
    if (this.plan.tasks.length === 0) {
      throw new Error('OrchestrationPlan must contain at least one task.');
    }
    // Validate that every task references a known agent.
    const agentIds = new Set(this.plan.agents.map((a) => a.id));
    for (const task of this.plan.tasks) {
      if (!agentIds.has(task.agentId)) {
        throw new Error(
          `Task references unknown agentId "${task.agentId}". ` +
            `Add the agent first via addAgent({ id: "${task.agentId}", ... }).`,
        );
      }
    }
    return { ...this.plan };
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new OrchestrationPlanBuilder with the given name.
 *
 * @example
 * const plan = createPlan('My Plan')
 *   .addAgent({ id: 'r1', role: 'researcher' })
 *   .addTask('r1', 'Research the topic: AI in manufacturing')
 *   .setMerge('summarize', 'Provide a 3-bullet summary.')
 *   .setBudget(10_000)
 *   .build();
 */
export function createPlan(name: string, description?: string): OrchestrationPlanBuilder {
  return new OrchestrationPlanBuilder(name, description);
}

// ---------------------------------------------------------------------------
// Quick helper patterns
// ---------------------------------------------------------------------------

/**
 * Research multiple questions in parallel with separate researcher agents.
 * Results are concatenated.
 *
 * @param questions - List of questions to research.
 * @param model     - Model tier for all agents (default: 'fast-cheap').
 */
export async function parallelResearch(
  questions: string[],
  model: ModelTier = 'fast-cheap',
): Promise<OrchestrationResult> {
  if (questions.length === 0) {
    throw new Error('parallelResearch: at least one question is required.');
  }

  const builder = createPlan(
    'Ricerca Parallela',
    `Parallel research across ${questions.length} question(s).`,
  );

  for (let i = 0; i < questions.length; i++) {
    const agentId = `researcher_${i}`;
    builder
      .addAgent({ id: agentId, role: 'researcher', model })
      .addTask(agentId, questions[i]!);
  }

  builder
    .setMerge('concatenate')
    .setBudget(questions.length * 4_000);

  return executeOrchestration(builder.build());
}

/**
 * Writer produces a draft; reviewer critiques it.
 * Results are merged via 'summarize' into a final polished output.
 *
 * @param prompt          - The writing task.
 * @param reviewCriteria  - Optional criteria for the reviewer.
 */
export async function writeAndReview(
  prompt: string,
  reviewCriteria?: string,
): Promise<OrchestrationResult> {
  const writerId   = 'writer_1';
  const reviewerId = 'reviewer_1';

  const reviewPrompt = reviewCriteria
    ? `Rivedi il testo seguente secondo questi criteri: ${reviewCriteria}`
    : 'Rivedi il testo seguente identificando errori, miglioramenti e punti di forza.';

  const mergeInstruction =
    'Produci la versione finale del testo integrando le revisioni del revisore ' +
    "nell'output dello scrittore. Restituisci solo il testo finale, senza metadati.";

  const plan = createPlan('Scrittura e Revisione')
    .addAgent({ id: writerId, role: 'writer' })
    .addAgent({ id: reviewerId, role: 'reviewer' })
    .addTask(writerId, prompt)
    .addTask(reviewerId, reviewPrompt, { dependsOn: [writerId] })
    .setMerge('summarize', mergeInstruction)
    .setBudget(15_000)
    .build();

  return executeOrchestration(plan);
}

/**
 * Analyse a topic from multiple angles in parallel.
 * Results are summarized into a single synthesis.
 *
 * @param topic  - The subject to analyse.
 * @param angles - List of distinct analytical perspectives.
 */
export async function analyzeFromMultipleAngles(
  topic: string,
  angles: string[],
): Promise<OrchestrationResult> {
  if (angles.length === 0) {
    throw new Error('analyzeFromMultipleAngles: at least one angle is required.');
  }

  const builder = createPlan(
    'Analisi Multi-Prospettiva',
    `Analysis of "${topic}" from ${angles.length} angle(s).`,
  );

  for (let i = 0; i < angles.length; i++) {
    const agentId = `analyst_${i}`;
    const angle   = angles[i]!;
    builder
      .addAgent({
        id: agentId,
        role: 'analyst',
        // Specialise each analyst's system prompt with the assigned angle.
        systemPrompt:
          `Sei un analista specializzato nella prospettiva: "${angle}". ` +
          'Esamina il tema assegnato esclusivamente da questa prospettiva. ' +
          'Sii preciso, concreto e strutturato.',
      })
      .addTask(agentId, `Analizza il seguente tema dalla tua prospettiva: ${topic}`);
  }

  const mergeInstruction =
    'Sintetizza le seguenti analisi in un documento coerente che integri ' +
    'tutte le prospettive, evidenziando convergenze, divergenze e conclusioni chiave.';

  builder
    .setMerge('summarize', mergeInstruction)
    .setBudget(angles.length * 5_000);

  return executeOrchestration(builder.build());
}
