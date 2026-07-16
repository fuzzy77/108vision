import { type ModelTier, MODEL_TIERS } from '@aia/shared';

// LiteLLM tier names that exist in config but not in the TS type system.
// We pass them through as strings — LiteLLM resolves them to actual models.
type LiteLLMTier = ModelTier | 'coding' | 'vision';

const MODEL_MAP: Record<string, LiteLLMTier> = {
  // OpenAI model names
  'gpt-4o': MODEL_TIERS.BALANCED,
  'gpt-4o-mini': MODEL_TIERS.FAST_CHEAP,
  'gpt-4-turbo': MODEL_TIERS.POWERFUL,
  'gpt-4': MODEL_TIERS.BALANCED,
  'gpt-3.5-turbo': MODEL_TIERS.FAST_CHEAP,
  'o1': MODEL_TIERS.POWERFUL,
  'o1-mini': MODEL_TIERS.BALANCED,
  'o1-preview': MODEL_TIERS.POWERFUL,
  'o3': MODEL_TIERS.POWERFUL,
  'o3-mini': MODEL_TIERS.BALANCED,

  // Anthropic model names
  'claude-3-5-sonnet-20241022': MODEL_TIERS.BALANCED,
  'claude-sonnet-4-20250514': MODEL_TIERS.BALANCED,
  'claude-3-opus-20240229': MODEL_TIERS.POWERFUL,
  'claude-opus-4-20250514': MODEL_TIERS.POWERFUL,
  'claude-3-haiku-20240307': MODEL_TIERS.FAST_CHEAP,
  'claude-haiku-4-5-20251001': MODEL_TIERS.FAST_CHEAP,

  // DeepSeek / Qwen (direct provider names)
  'deepseek-chat': MODEL_TIERS.FAST_CHEAP,
  'deepseek-reasoner': MODEL_TIERS.BALANCED,
  'deepseek-coder': 'coding',
  'qwen-max': MODEL_TIERS.POWERFUL,
  'qwen-turbo': MODEL_TIERS.FAST_CHEAP,
  'codestral': 'coding',

  // Direct tier names (passthrough — includes LiteLLM tiers not in TS type)
  'fast-cheap': MODEL_TIERS.FAST_CHEAP,
  'balanced': MODEL_TIERS.BALANCED,
  'powerful': MODEL_TIERS.POWERFUL,
  'coding': 'coding',
  'vision': 'vision',
};

/**
 * Maps a client-facing model name to the LiteLLM tier used internally.
 * Returns a string that LiteLLM will route to the configured provider.
 */
export function mapModelToTier(requestedModel: string): string {
  const mapped = MODEL_MAP[requestedModel];
  if (mapped) return mapped;

  // Fuzzy match: if model name contains a known tier keyword
  const lower = requestedModel.toLowerCase();
  if (lower.includes('opus') || lower.includes('turbo') || lower.includes('max')) {
    return MODEL_TIERS.POWERFUL;
  }
  if (lower.includes('haiku') || lower.includes('mini') || lower.includes('cheap')) {
    return MODEL_TIERS.FAST_CHEAP;
  }
  if (lower.includes('code') || lower.includes('coder')) {
    return 'coding';
  }

  // Default fallback
  return MODEL_TIERS.BALANCED;
}

export function tierToDisplayModel(tier: string): string {
  switch (tier) {
    case MODEL_TIERS.FAST_CHEAP: return 'gpt-4o-mini';
    case MODEL_TIERS.BALANCED: return 'gpt-4o';
    case MODEL_TIERS.POWERFUL: return 'gpt-4-turbo';
    case 'coding': return 'deepseek-coder';
    case 'vision': return 'gpt-4o';
    default: return 'gpt-4o';
  }
}

export interface SupportedModel {
  id: string;
  tier: string;
  description: string;
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  { id: 'gpt-4o', tier: MODEL_TIERS.BALANCED, description: 'Balanced model for general tasks' },
  { id: 'gpt-4o-mini', tier: MODEL_TIERS.FAST_CHEAP, description: 'Fast and cost-efficient' },
  { id: 'gpt-4-turbo', tier: MODEL_TIERS.POWERFUL, description: 'Most capable, higher cost' },
  { id: 'deepseek-coder', tier: 'coding', description: 'Optimized for code generation' },
  { id: 'claude-sonnet-4-20250514', tier: MODEL_TIERS.BALANCED, description: 'Balanced (Anthropic naming)' },
  { id: 'claude-opus-4-20250514', tier: MODEL_TIERS.POWERFUL, description: 'Powerful (Anthropic naming)' },
  { id: 'claude-haiku-4-5-20251001', tier: MODEL_TIERS.FAST_CHEAP, description: 'Fast (Anthropic naming)' },
  { id: 'fast-cheap', tier: MODEL_TIERS.FAST_CHEAP, description: 'Direct tier: fast and cheap' },
  { id: 'balanced', tier: MODEL_TIERS.BALANCED, description: 'Direct tier: balanced' },
  { id: 'powerful', tier: MODEL_TIERS.POWERFUL, description: 'Direct tier: powerful' },
  { id: 'coding', tier: 'coding', description: 'Direct tier: coding optimized' },
];
