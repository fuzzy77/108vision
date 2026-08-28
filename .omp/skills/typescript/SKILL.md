---
name: typescript
description: TypeScript strict + ESM coding guidelines for AIA Platform — Zod, Result pattern, Hono, Drizzle.
---

# TypeScript Coding Guidelines — AIA Platform

## Strictness

```typescript
// tsconfig: "strict": true — always

// Never:
function process(data: any) { }              // use unknown + type guard
const user = response as User;               // unsafe cast
import { foo } = require('./foo');           // CommonJS
module.exports = { foo };                    // CommonJS

// Always:
function process(data: unknown) {
  const parsed = UserSchema.parse(data);     // Zod validation
}
```

## Zod Validation

Every external boundary (API input, env vars, LLM output) must be validated with Zod:

```typescript
import { z } from 'zod';

// API input:
const CreateConversationSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().min(1).max(10000),
});

// Env vars:
const EnvSchema = z.object({
  LITELLM_URL: z.string().url(),
  LITELLM_MASTER_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
});

// LLM output:
const ClassificationSchema = z.object({
  category: z.enum(['coding', 'architecture', 'research', 'other']),
  confidence: z.number().min(0).max(1),
});
```

## Result Pattern

```typescript
type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

// Expected errors → Result:
async function getConversation(id: string, tenantId: string): Promise<Result<Conversation>> {
  const row = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)),
  });
  if (!row) return { success: false, error: 'Conversation not found' };
  return { success: true, data: row };
}

// Unexpected errors → throw (caught by error boundary / Hono middleware)
```

## Hono API Routes

```typescript
// Route handler structure:
app.post('/conversations', async (c) => {
  const body = await c.req.json();
  const input = CreateConversationSchema.safeParse(body);
  if (!input.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: input.error.message } }, 400);
  }

  const tenantId = c.get('tenantId'); // from auth middleware
  const result = await conversationService.create(input.data, tenantId);

  if (!result.success) return c.json({ error: { code: 'NOT_FOUND', message: result.error } }, 404);
  return c.json(result.data, 201);
});
```

## Drizzle ORM

```typescript
// Always filter by tenantId on tenant-scoped data:
const conversations = await db.query.conversations.findMany({
  where: and(
    eq(conversations.tenantId, tenantId),  // REQUIRED
    eq(conversations.userId, userId),
  ),
  orderBy: desc(conversations.createdAt),
  limit: 50,
});

// Never load full rows for read-only display — use columns():
const summaries = await db
  .select({ id: conversations.id, title: conversations.title, createdAt: conversations.createdAt })
  .from(conversations)
  .where(eq(conversations.tenantId, tenantId));
```

## LiteLLM Integration

```typescript
// Always via @108ai/ai-client — never call providers directly:
import { aiClient } from '@108ai/ai-client';

// Use tiers, not model names directly:
const response = await aiClient.complete({
  tier: 'fast-cheap',          // or 'balanced', 'powerful', 'coding', 'vision'
  messages: [...],
  tenantId,                    // for cost tracking
});

// Validate output:
const parsed = ClassificationSchema.safeParse(response.content);
if (!parsed.success) throw new Error('LLM returned invalid classification');
```

## Logging

```typescript
// Named properties, never string interpolation in log calls:
logger.info({ tenantId, conversationId }, 'Conversation created');
logger.error({ tenantId, errorCode: err.code }, 'LLM call failed');

// Never log:
logger.info({ email: user.email });   // PII
logger.info({ apiKey });              // secret
```
