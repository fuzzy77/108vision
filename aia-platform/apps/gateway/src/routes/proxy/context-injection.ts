import { hybridRagService } from '../../services/hybrid-rag.service.js';
import { memoryService } from '../../services/memory.service.js';
import { principlesService } from '../../services/principles.service.js';
import type { ProxyConfig } from '../../middleware/proxy-auth.js';

interface ChatMessage {
  role: string;
  content: string | null | unknown[];
  [key: string]: unknown;
}

/**
 * Injects AI governance principles into the message array.
 * Called ALWAYS on proxy requests — this is a core differentiator.
 * Principles are prepended to the first system message (or a new one is created).
 */
export function injectGovernance(messages: ChatMessage[]): ChatMessage[] {
  const principlesBlock = principlesService.compilePrinciplesPrompt({});
  if (!principlesBlock) return messages;

  if (messages[0]?.role === 'system' && typeof messages[0].content === 'string') {
    // Prepend principles to existing system message
    return [
      { ...messages[0], content: `${principlesBlock}\n\n---\n\n${messages[0].content}` },
      ...messages.slice(1),
    ];
  }

  // No system message exists — create one with just principles
  return [
    { role: 'system', content: principlesBlock },
    ...messages,
  ];
}

export async function injectContext(
  messages: ChatMessage[],
  tenantId: string,
  config: ProxyConfig,
): Promise<ChatMessage[]> {
  if (!config.ragEnabled && !config.memoryEnabled) {
    return messages;
  }

  // Extract the last user message for context retrieval
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg || typeof lastUserMsg.content !== 'string') {
    return messages;
  }

  const query = lastUserMsg.content;
  const contextParts: string[] = [];

  // RAG retrieval
  if (config.ragEnabled) {
    const ragResult = await hybridRagService.retrieveHybridContext(query, tenantId, {
      vectorTopK: config.ragTopK,
      minVectorScore: config.ragMinScore,
      useGraph: true,
    });

    if (ragResult.success && ragResult.data.vectorChunks.length > 0) {
      const chunks = ragResult.data.vectorChunks
        .map((c, i) => `[${i + 1}] ${c.content}`)
        .join('\n\n');
      contextParts.push(`[Knowledge Base Context]\n${chunks}`);

      if (ragResult.data.graphContext?.relations.length) {
        const entities = ragResult.data.graphContext.entities;
        const nameMap = new Map(entities.map((e: { id: string; name: string }) => [e.id, e.name]));
        const rels = ragResult.data.graphContext.relations
          .slice(0, 10)
          .map((r: { sourceId: string; type: string; targetId: string }) => {
            const source = nameMap.get(r.sourceId) ?? r.sourceId;
            const target = nameMap.get(r.targetId) ?? r.targetId;
            return `${source} → ${r.type} → ${target}`;
          })
          .join('\n');
        contextParts.push(`[Graph Relationships]\n${rels}`);
      }
    }
  }

  // Memory retrieval
  if (config.memoryEnabled) {
    try {
      const memoryBlock = await memoryService.getRelevantForChat(tenantId, query);
      if (memoryBlock) {
        contextParts.push(`[Persistent Memory]\n${memoryBlock}`);
      }
    } catch {
      // Non-critical
    }
  }

  if (contextParts.length === 0) {
    return messages;
  }

  // Inject context as a system message.
  // If the client already has a system message, insert context AFTER it (so client's system prompt takes priority).
  // If not, prepend it as the first message.
  const contextContent = `The following context from the organization's knowledge base may be relevant to the user's request. Use it if helpful, ignore if not.\n\n${contextParts.join('\n\n---\n\n')}`;

  if (messages[0]?.role === 'system') {
    // Insert after existing system message
    const contextMessage: ChatMessage = { role: 'system', content: contextContent };
    return [messages[0], contextMessage, ...messages.slice(1)];
  }

  const contextMessage: ChatMessage = { role: 'system', content: contextContent };
  return [contextMessage, ...messages];
}
