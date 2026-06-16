import { auditLog } from '../../security.js';
import { callGatewayChat } from '../gateway-llm.js';
import { loadPermissions, skillsAllowLlm } from '../permissions.js';
import type { ExtensionShellContext, LoadedPersonaAgent, PersonaChatResult } from '../types.js';
import {
  applyPersonaRestrictions,
  buildPersonaUserMessage,
  getPersonaLlmOptions,
} from './context.js';
import { appendPersonaHistory } from './history.js';
import { resolvePersonaAgent } from './registry.js';
import { loadKnowledgeBlock } from '../knowledge/loader.js';
import {
  buildAgentToolsSystemAppend,
  executeAgentMcpCalls,
} from './mcp-tools.js';

export interface ChatWithPersonaOptions {
  includeHistory?: boolean;
  persistHistory?: boolean;
}

export async function chatWithPersona(
  persona: LoadedPersonaAgent,
  userMessage: string,
  shellCtx: ExtensionShellContext,
  options?: ChatWithPersonaOptions,
): Promise<PersonaChatResult> {
  const started = Date.now();

  if (!skillsAllowLlm()) {
    throw new Error(
      'LLM disabilitato. Imposta skills.allow_llm: true in ~/.108ai/permissions.yml',
    );
  }

  const includeHistory = options?.includeHistory ?? true;
  const persistHistory = options?.persistHistory ?? true;

  const payload = buildPersonaUserMessage(persona, userMessage, includeHistory);
  const llmOpts = getPersonaLlmOptions(persona);
  const knowledgeBlock = await loadKnowledgeBlock(persona.definition.knowledge, userMessage);
  const systemPrompt =
    llmOpts.systemPrompt +
    buildAgentToolsSystemAppend(persona) +
    knowledgeBlock;

  const llmResult = await callGatewayChat(shellCtx, payload, {
    systemPrompt,
    model: llmOpts.model,
    maxTokens: llmOpts.maxTokens,
  });

  const mcpRound = await executeAgentMcpCalls(persona, llmResult.content);
  let combinedOutput = mcpRound.cleaned;
  let totalTokens = llmResult.tokens;

  if (mcpRound.toolLog) {
    const followUp = await callGatewayChat(
      shellCtx,
      `Risultati tool MCP:\n${mcpRound.toolLog}\n\nRisposta precedente (senza blocchi mcp):\n${mcpRound.cleaned}\n\nIntegra i risultati in una risposta finale per l'utente.`,
      {
        systemPrompt: llmOpts.systemPrompt,
        model: llmOpts.model,
        maxTokens: llmOpts.maxTokens,
      },
    );
    combinedOutput = followUp.content;
    totalTokens += followUp.tokens;
  }

  const { output, disclaimer } = applyPersonaRestrictions(persona, combinedOutput);

  if (persistHistory) {
    const perms = loadPermissions();
    appendPersonaHistory(
      persona.definition.name,
      userMessage,
      output,
      perms.agents.max_conversation_length,
    );
  }

  auditLog({
    timestamp: new Date().toISOString(),
    action: `persona.${persona.definition.name}`,
    params: {
      model: llmResult.model,
      tokens: llmResult.tokens,
    },
    result: 'allowed',
    durationMs: Date.now() - started,
  });

  return {
    output,
    tokens: totalTokens,
    model: llmResult.model,
    agentName: persona.definition.name,
    disclaimer,
  };
}

export async function chatWithPersonaByName(
  name: string,
  userMessage: string,
  shellCtx: ExtensionShellContext,
  options?: ChatWithPersonaOptions,
): Promise<PersonaChatResult> {
  const persona = resolvePersonaAgent(name);
  if (!persona) {
    throw new Error(`Agent non trovato: ${name}`);
  }
  return chatWithPersona(persona, userMessage, shellCtx, options);
}
