---
name: ai-engineering
description: AI system design guidelines for AIA Platform — LiteLLM routing, RAG, evaluation, cost optimization.
---

# AI Engineering Guidelines

## Principle: System, Not Demo

A production AI system handles failures. For every LLM integration:

1. Input validation (Zod)
2. Prompt design (system + user separation)
3. Retrieval strategy (RAG: retrieve first, then generate)
4. Output validation (Zod schema on LLM response)
5. Cost tracking (token usage per tenant)
6. Fallback behavior (what happens when LLM fails?)
7. Monitoring (latency, error rate, cost per call)

## Evaluation Before Enthusiasm

Before shipping an AI feature: build a golden dataset.

```
Golden dataset structure:
- 20-50 representative inputs
- Expected outputs (manually validated)
- Edge cases (empty input, very long input, adversarial)
- Evaluation metric (exact match / semantic similarity / human rating)
```

Without evaluation: you have a slot machine, not an AI system.

## RAG Pattern

```
User query
    │
    ▼
Embed query (text-embedding-v3)
    │
    ▼
Qdrant semantic search (top-k chunks)
    │
    ▼
Rerank / filter by relevance score
    │
    ▼
Build prompt: system + context chunks + user message
    │
    ▼
LiteLLM call (appropriate tier)
    │
    ▼
Validate output (Zod)
    │
    ▼
Return to user
```

Never inject raw full documents into prompts. Always retrieve and filter.

## Cost Routing

| Task | Tier | Models |
|---|---|---|
| Classification, extraction, triage | `fast-cheap` | DeepSeek V3, Qwen3-8B |
| Code generation, summarization, drafting | `balanced` | DeepSeek R1, Qwen3-32B |
| Architecture, complex reasoning, planning | `powerful` | Qwen3-235B, DeepSeek R1 |
| Image understanding | `vision` | Qwen-VL-Max |
| Embeddings | `embedding` | text-embedding-v3 |

Rule: if a cheaper tier passes your golden dataset eval, use it.

## Prompt Design

```typescript
// System prompt: role + constraints + output format
// User prompt: task + context

const systemPrompt = `You are a task classifier for a business AI assistant.
Classify the user's message into exactly one category.
Return JSON matching this schema: { "category": "...", "confidence": 0.0-1.0 }
Categories: coding, architecture, research, writing, other`;

// Output format in system prompt, not user prompt
// Output validation always:
const result = ClassificationSchema.parse(JSON.parse(llmResponse.content));
```

## Security

- Prompt injection: treat all user content as untrusted, never include raw user input in system prompts
- Data leakage: never include other tenants' data in context
- Over-trust: always validate LLM output before acting on it
- Rate limiting: per-tenant, per-endpoint limits

## Multi-Agent Pattern

Use multi-agent only when the gain is demonstrated:

```
JUSTIFIED:
- Parallel document processing (N workers)
- Independent verification (implementer + reviewer)
- Specialized agents (coding agent + security agent)

NOT JUSTIFIED:
- "It seems cleaner"
- "Future scalability"
- Task easily handled by a single call
```

Every agent hop adds: latency, cost, surface for errors.
