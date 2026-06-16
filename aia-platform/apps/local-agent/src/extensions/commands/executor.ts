import { auditLog } from '../../security.js';
import { callGatewayChat } from '../gateway-llm.js';
import type { ExtensionShellContext, RegisteredCommand } from '../types.js';
import { buildCommandContext, resolveCommandParams } from './context.js';
import { runCommandHook } from './hooks.js';
import { renderTemplate } from './template.js';

const MAX_HOOK_DEPTH = 2;

export interface CommandExecutionResult {
  output: string;
  tokens: number;
  model: string;
  source: 'builtin' | 'yaml';
}

/**
 * Execute a registered command (builtin handler or YAML prompt pipeline).
 */
export async function executeRegisteredCommand(
  entry: RegisteredCommand,
  args: string[],
  shellCtx: ExtensionShellContext,
  hookDepth = 0,
): Promise<CommandExecutionResult> {
  const started = Date.now();
  const def = entry.definition;

  try {
    if (hookDepth < MAX_HOOK_DEPTH && def.hooks?.before) {
      await runCommandHook(def.hooks.before, args, shellCtx, hookDepth);
    }

    if (entry.handler) {
      const output = await entry.handler(args, shellCtx);
      auditLog({
        timestamp: new Date().toISOString(),
        action: `command.${def.name}`,
        params: { args, origin: entry.origin },
        result: 'allowed',
        durationMs: Date.now() - started,
      });

      if (hookDepth < MAX_HOOK_DEPTH && def.hooks?.after) {
        await runCommandHook(def.hooks.after, args, shellCtx, hookDepth);
      }

      return { output, tokens: 0, model: 'builtin', source: 'builtin' };
    }

    if (!def.prompt?.trim()) {
      throw new Error(`Command "${def.name}" non ha prompt né handler`);
    }

    const params = resolveCommandParams(def.params, args);
    const context = await buildCommandContext(def.context, params, shellCtx);
    const prompt = renderTemplate(def.prompt, { params, context });

    const llmResult = await callGatewayChat(shellCtx, prompt, {
      model: def.output?.model ?? 'fast-cheap',
      maxTokens: def.output?.max_tokens ?? 2000,
    });

    auditLog({
      timestamp: new Date().toISOString(),
      action: `command.${def.name}`,
      params: { args, origin: entry.origin, model: llmResult.model },
      result: 'allowed',
      durationMs: Date.now() - started,
    });

    if (hookDepth < MAX_HOOK_DEPTH && def.hooks?.after) {
      await runCommandHook(def.hooks.after, args, shellCtx, hookDepth);
    }

    return {
      output: llmResult.content,
      tokens: llmResult.tokens,
      model: llmResult.model,
      source: 'yaml',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    auditLog({
      timestamp: new Date().toISOString(),
      action: `command.${def.name}`,
      params: { args, origin: entry.origin },
      result: 'error',
      reason: message,
      durationMs: Date.now() - started,
    });
    throw err;
  }
}
