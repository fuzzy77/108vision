import { auditLog } from '../../security.js';
import { callGatewayChat } from '../gateway-llm.js';
import { loadKnowledgeBlock } from '../knowledge/loader.js';
import { loadPermissions, skillsAllowLlm } from '../permissions.js';
import { assertToolsRequired } from '../tools-check.js';
import type { ExtensionShellContext, LoadedSkill, SkillExecutionResult } from '../types.js';
import { parseCommandArgs } from '../commands/context.js';
import {
  buildSkillContext,
  formatSkillContextBlock,
  resolveSkillParams,
} from './context.js';

export interface ExecuteSkillOptions {
  args?: string[];
  trigger?: 'explicit' | 'implicit';
}

/**
 * Full skill lifecycle: permissions → context → LLM → optional review notice.
 */
export async function executeSkill(
  skill: LoadedSkill,
  userMessage: string,
  shellCtx: ExtensionShellContext,
  options?: ExecuteSkillOptions,
): Promise<SkillExecutionResult> {
  const started = Date.now();
  const manifest = skill.manifest;

  try {
    if (!skillsAllowLlm()) {
      throw new Error(
        'LLM disabilitato per skills. Imposta skills.allow_llm: true in permissions.yml',
      );
    }

    assertToolsRequired(manifest.tools_required);

    const parsed = parseCommandArgs(options?.args ?? []);
    const flagParams: Record<string, string | number | boolean> = { ...parsed.flags };
    for (let i = 0; i < parsed.positional.length; i++) {
      const def = manifest.params?.[i];
      if (def && parsed.positional[i] !== undefined) {
        flagParams[def.name] = parsed.positional[i] ?? '';
      }
    }

    const params = resolveSkillParams(manifest.params, flagParams, userMessage);
    const skillContext = await buildSkillContext(
      manifest.context,
      skill.directory,
      params,
      userMessage,
      shellCtx,
    );

    const contextBlock = formatSkillContextBlock(skillContext);
    const knowledgeBlock = await loadKnowledgeBlock(manifest.knowledge, userMessage);
    const userPayload = [
      `Richiesta utente:\n${userMessage.trim()}`,
      contextBlock ? `\nContesto:\n${contextBlock}` : '',
      knowledgeBlock,
    ]
      .filter(Boolean)
      .join('\n');

    const llmResult = await callGatewayChat(shellCtx, userPayload, {
      model: manifest.model ?? 'balanced',
      maxTokens: manifest.max_tokens ?? 2000,
      systemPrompt: skill.systemPrompt,
    });

    const perms = loadPermissions();
    const needsReview =
      manifest.output?.review_before_send === true && perms.skills.require_review;

    let output = llmResult.content;
    if (needsReview) {
      output += '\n\n---\n*[Review richiesto — verifica la bozza prima di inviare]*';
      if (manifest.output?.action_after) {
        output += `\n*Azione suggerita: ${manifest.output.action_after} (non eseguita automaticamente in CLI)*`;
      }
    }

    auditLog({
      timestamp: new Date().toISOString(),
      action: `skill.${manifest.name}`,
      params: {
        trigger: options?.trigger ?? 'explicit',
        model: llmResult.model,
      },
      result: 'allowed',
      durationMs: Date.now() - started,
    });

    return {
      output,
      tokens: llmResult.tokens,
      model: llmResult.model,
      skillName: manifest.name,
      needsReview,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    auditLog({
      timestamp: new Date().toISOString(),
      action: `skill.${manifest.name}`,
      params: { trigger: options?.trigger },
      result: 'error',
      reason: message,
      durationMs: Date.now() - started,
    });
    throw err;
  }
}
