import { Hono } from 'hono';
import { SUPPORTED_MODELS } from './model-mapping.js';

const modelsRouter = new Hono();

modelsRouter.get('/models', (c) => {
  const now = Math.floor(Date.now() / 1000);

  const models = SUPPORTED_MODELS.map((m) => ({
    id: m.id,
    object: 'model' as const,
    created: now,
    owned_by: '108ai',
  }));

  return c.json({
    object: 'list' as const,
    data: models,
  });
});

modelsRouter.get('/models/:modelId', (c) => {
  const modelId = c.req.param('modelId');
  const model = SUPPORTED_MODELS.find((m) => m.id === modelId);

  if (!model) {
    return c.json(
      { error: { message: `Model '${modelId}' not found`, type: 'not_found_error', code: 'model_not_found' } },
      404,
    );
  }

  return c.json({
    id: model.id,
    object: 'model' as const,
    created: Math.floor(Date.now() / 1000),
    owned_by: '108ai',
  });
});

export { modelsRouter };
