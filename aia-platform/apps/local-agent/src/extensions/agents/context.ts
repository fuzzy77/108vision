import type { LoadedPersonaAgent, PersonaContextWindow, PersonaHistoryMessage } from '../types.js';
import { loadPermissions } from '../permissions.js';
import { loadPersonaHistory } from './history.js';
import { compressConversationMessages } from '../../hardening/prompt-compress.js';

export function selectHistoryWindow(
  history: PersonaHistoryMessage[],
  contextWindow?: PersonaContextWindow,
): PersonaHistoryMessage[] {
  const strategy = contextWindow?.strategy ?? 'sliding';
  const maxMessages = contextWindow?.max_messages ?? 20;

  if (strategy === 'full') {
    return history;
  }

  return history.slice(-maxMessages);
}

export function formatHistoryForPrompt(
  messages: PersonaHistoryMessage[],
  contextWindow?: PersonaContextWindow,
): string {
  if (messages.length === 0) return '';

  const strategy = contextWindow?.strategy ?? 'sliding';
  const maxMessages = contextWindow?.max_messages ?? 20;
  const summarizeAfter = contextWindow?.summarize_after ?? maxMessages;

  if (strategy === 'summarize' && messages.length > summarizeAfter) {
    const older = messages.slice(0, -maxMessages);
    const recent = messages.slice(-maxMessages);
    const summary = compressConversationMessages(
      older.map((m) => ({ role: m.role, content: m.content })),
      8,
      400,
    );
    const recentBlock = recent
      .map((m) => {
        const label = m.role === 'user' ? 'Utente' : 'Assistente';
        return `${label}: ${m.content}`;
      })
      .join('\n\n');

    return `[Riepilogo conversazione precedente]\n${summary}\n\n${recentBlock}`;
  }

  return messages
    .map((m) => {
      const label = m.role === 'user' ? 'Utente' : 'Assistente';
      return `${label}: ${m.content}`;
    })
    .join('\n\n');
}

export function buildPersonaUserMessage(
  persona: LoadedPersonaAgent,
  input: string,
  includeHistory: boolean,
): string {
  if (!includeHistory) {
    return input;
  }

  const perms = loadPermissions();
  const maxLen = Math.min(
    persona.definition.restrictions?.max_conversation_length ??
      perms.agents.max_conversation_length,
    perms.agents.max_conversation_length,
  );

  const rawHistory = loadPersonaHistory(persona.definition.name).slice(-maxLen);
  const contextWindow = persona.definition.context_window;

  const block =
    contextWindow?.strategy === 'summarize'
      ? formatHistoryForPrompt(rawHistory, contextWindow)
      : formatHistoryForPrompt(selectHistoryWindow(rawHistory, contextWindow));
  if (!block) return input;

  return `Cronologia conversazione con questo agente:\n${block}\n\nNuovo messaggio utente:\n${input}`;
}

export function getPersonaLlmOptions(persona: LoadedPersonaAgent): {
  systemPrompt: string;
  model: string;
  maxTokens: number;
  temperature?: number;
} {
  return {
    systemPrompt: persona.definition.system_prompt,
    model: persona.definition.model ?? 'balanced',
    maxTokens: persona.definition.max_tokens ?? 3000,
    temperature: persona.definition.temperature,
  };
}

const DISCLAIMER_TEXT =
  '\n\n---\n⚠️ *Nota*: questa risposta ha scopo informativo e non sostituisce un professionista abilitato.';

export function applyPersonaRestrictions(
  persona: LoadedPersonaAgent,
  output: string,
): { output: string; disclaimer?: string } {
  const restrictions = persona.definition.restrictions;
  if (!restrictions?.disclaimer_required) {
    return { output };
  }

  if (output.includes('non sostituisce')) {
    return { output, disclaimer: DISCLAIMER_TEXT };
  }

  return {
    output: output + DISCLAIMER_TEXT,
    disclaimer: DISCLAIMER_TEXT,
  };
}
