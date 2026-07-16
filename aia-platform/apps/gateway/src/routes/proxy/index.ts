import { Hono } from 'hono';
import { proxyAuthMiddleware } from '../../middleware/proxy-auth.js';
import { proxyRateLimitMiddleware } from '../../middleware/rate-limit.js';
import { proxyErrorHandler } from '../../middleware/proxy-error-handler.js';
import { openaiProxy } from './openai.js';
import { anthropicProxy } from './anthropic.js';
import { modelsRouter } from './models.js';
import { embeddingsRouter } from './embeddings.js';

const proxyRouter = new Hono();

// Error handler for proxy routes (OpenAI format)
proxyRouter.onError(proxyErrorHandler);

// Auth: extract API key from Bearer/x-api-key header, resolve tenant
proxyRouter.use('*', proxyAuthMiddleware);

// Rate limiting per tenant/plan
proxyRouter.use('*', proxyRateLimitMiddleware);

// Mount endpoints
proxyRouter.route('/', openaiProxy);      // POST /chat/completions
proxyRouter.route('/', anthropicProxy);   // POST /messages (Anthropic format)
proxyRouter.route('/', modelsRouter);     // GET /models, GET /models/:id
proxyRouter.route('/', embeddingsRouter); // POST /embeddings

export { proxyRouter };
