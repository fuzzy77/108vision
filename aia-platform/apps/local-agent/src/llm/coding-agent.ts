/**
 * Coding Agent — Multi-turn tool-use loop for code tasks.
 *
 * This is the 108ai equivalent of Claude Code's coding loop:
 * prompt → read files → edit → run tests → verify → respond.
 *
 * Uses Vercel AI SDK's native tool-use with maxSteps for automatic
 * multi-turn execution without regex parsing or manual follow-up calls.
 */

import type { ModelMessage } from 'ai';
import { callDirectLlm, type DirectLlmResult, type ModelTier } from './ai-sdk-direct.js';
import { createCodingTools } from './coding-tools.js';
import type { AgentConfig } from '../config.js';

export interface CodingAgentOptions {
  task: string;
  context?: string;
  tier?: ModelTier;
  model?: string;
  maxRoundtrips?: number;
  systemPrompt?: string;
  config: AgentConfig;
}

export interface CodingAgentResult {
  response: string;
  toolCalls: DirectLlmResult['toolCalls'];
  usage: DirectLlmResult['usage'];
  model: string;
  roundtrips: number;
}

const DEFAULT_SYSTEM = `You are a skilled software engineer working on the user's codebase.
You have tools to read files, edit files, search code, list directories, and run shell commands.

Guidelines:
- Read files BEFORE editing to understand context
- Use editFile for surgical modifications (it supports fuzzy matching)
- Use writeFile only for new files
- After editing, verify the change is correct (re-read or run tests if applicable)
- Be concise in your final response — report what you did and any issues found
- If a task requires multiple file changes, do them all before responding`;

export async function runCodingAgent(opts: CodingAgentOptions): Promise<CodingAgentResult> {
  const tools = createCodingTools(opts.config);

  const messages: ModelMessage[] = [];

  if (opts.context) {
    messages.push({ role: 'user', content: opts.context });
    messages.push({ role: 'assistant', content: 'Understood. Ready for the task.' });
  }

  messages.push({ role: 'user', content: opts.task });

  const result = await callDirectLlm({
    messages,
    system: opts.systemPrompt ?? DEFAULT_SYSTEM,
    tier: opts.tier ?? 'coding',
    model: opts.model,
    tools,
    maxToolRoundtrips: opts.maxRoundtrips ?? 15,
    maxTokens: 8192,
  });

  return {
    response: result.text,
    toolCalls: result.toolCalls,
    usage: result.usage,
    model: result.model,
    roundtrips: result.roundtrips,
  };
}
