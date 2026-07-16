import { type ModelTier, MODEL_TIERS } from '@aia/shared';
import { createAIClient } from '@aia/ai-client';
import { getEnv } from '../lib/env.js';

const CLASSIFY_PROMPT = `Classify this user message into ONE complexity tier. Reply with ONLY the tier name, nothing else.

Tiers:
- fast-cheap: simple questions, greetings, translations, summaries, formatting, factual lookups
- balanced: analysis, comparisons, multi-step reasoning, planning, detailed explanations
- powerful: complex strategy, creative writing with constraints, multi-domain synthesis, ambiguous problems requiring deep reasoning
- coding: code generation, debugging, refactoring, technical implementation

Message: """
{MESSAGE}
"""

Tier:`;

export async function classifyMessageTier(
  message: string,
  allowedTiers: string[],
): Promise<ModelTier> {
  const env = getEnv();
  const aiClient = createAIClient({
    baseUrl: env.LITELLM_URL,
    apiKey: env.LITELLM_MASTER_KEY,
    timeoutMs: 5000,
    maxRetries: 1,
  });

  try {
    const response = await aiClient.chat({
      model: MODEL_TIERS.FAST_CHEAP as ModelTier,
      messages: [
        { role: 'user', content: CLASSIFY_PROMPT.replace('{MESSAGE}', message.slice(0, 500)) },
      ],
      temperature: 0,
      maxTokens: 10,
    });

    const raw = response.choices[0]?.message.content?.trim().toLowerCase() ?? '';
    const tier = raw.replace(/[^a-z-]/g, '');

    if (allowedTiers.includes(tier)) {
      return tier as ModelTier;
    }

    // Fallback: if classified tier not in allowed, pick the closest allowed
    const priority: string[] = ['fast-cheap', 'balanced', 'powerful', 'coding', 'vision'];
    const classifiedIdx = priority.indexOf(tier);

    // Find the closest allowed tier at or below the classified level
    for (let i = classifiedIdx; i >= 0; i--) {
      if (allowedTiers.includes(priority[i]!)) {
        return priority[i] as ModelTier;
      }
    }
    // If nothing below, pick the lowest allowed
    for (const t of priority) {
      if (allowedTiers.includes(t)) return t as ModelTier;
    }

    return MODEL_TIERS.FAST_CHEAP as ModelTier;
  } catch {
    // On classification failure, default to balanced (safe middle ground)
    if (allowedTiers.includes('balanced')) return 'balanced' as ModelTier;
    return (allowedTiers[0] ?? MODEL_TIERS.FAST_CHEAP) as ModelTier;
  }
}
