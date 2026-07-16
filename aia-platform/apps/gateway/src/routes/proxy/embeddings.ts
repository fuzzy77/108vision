import { Hono } from 'hono';
import { z } from 'zod';
import { usageTrackingService } from '../../services/usage-tracking.service.js';
import { getEnv } from '../../lib/env.js';

const embeddingsRouter = new Hono();

const embeddingSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string(),
  encoding_format: z.enum(['float', 'base64']).optional(),
  dimensions: z.number().int().positive().optional(),
});

embeddingsRouter.post('/embeddings', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;

  const body = await c.req.json();
  const input = embeddingSchema.parse(body);

  const env = getEnv();

  // Forward to LiteLLM embedding endpoint (always uses the 'embedding' tier)
  const litellmBody: Record<string, unknown> = {
    input: input.input,
    model: 'embedding',
  };
  if (input.encoding_format) litellmBody['encoding_format'] = input.encoding_format;
  if (input.dimensions) litellmBody['dimensions'] = input.dimensions;

  const response = await fetch(`${env.LITELLM_URL}/v1/embeddings`, {
    signal: AbortSignal.timeout(60_000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify(litellmBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(JSON.stringify({ level: 'error', message: 'Proxy embedding error', status: response.status, body: errorText.slice(0, 500) }));
    return c.json(
      { error: { message: 'Embedding service temporarily unavailable', type: 'server_error', code: 'embedding_error' } },
      502,
    );
  }

  const data = await response.json() as Record<string, unknown>;

  // Track usage
  const usage = data['usage'] as { prompt_tokens?: number; total_tokens?: number } | undefined;
  if (usage) {
    usageTrackingService.trackRequest({
      tenantId,
      model: 'embedding',
      inputTokens: usage.prompt_tokens ?? usage.total_tokens ?? 0,
      outputTokens: 0,
      requestType: 'proxy_openai',
    }).catch(() => {});
  }

  // Remap model name to what client sent
  data['model'] = input.model;

  return c.json(data);
});

export { embeddingsRouter };
