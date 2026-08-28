# 108 Vision — AIA Platform

## Stack

- TypeScript strict (no `any`, no unsafe `as`)
- ESM only — no CommonJS
- Runtime: Node.js 20
- API: Hono
- ORM: Drizzle + PostgreSQL 16 + pgvector
- Frontend: React 19 + Vite 6 + Tailwind 4 + shadcn/ui
- AI Gateway: LiteLLM (all LLM calls through it — never direct provider)
- Vector DB: Qdrant
- Cache: Redis 7
- Monorepo: npm workspaces (@108ai/* packages)
- Desktop Agent: esbuild bundled binary

## Struttura monorepo

```
aia-platform/
├── apps/
│   ├── gateway/          # Hono API (BFF)
│   ├── dashboard/        # React admin dashboard
│   ├── client/           # Embeddable widget
│   └── local-agent/      # Desktop Agent
├── packages/
│   ├── shared/           # @108ai/shared — types, utils
│   ├── ai-client/        # @108ai/ai-client — LiteLLM wrapper
│   ├── auth/             # @108ai/auth — Better Auth
│   └── desktop-bridge/   # @108ai/desktop-bridge — OS bindings
└── infrastructure/       # Docker, init scripts
```

## Code Rules — TypeScript

- `strict: true` in tsconfig — no exceptions
- No `any` — use `unknown` + type guard if needed
- No unsafe `as` cast without comment explaining why
- Zod for all runtime validation (API input, env vars, LLM output)
- Result pattern for expected errors — exceptions only for unexpected failures
- All packages export from `./dist/`, never `.ts` source

## Code Rules — Multi-Tenancy

- **EVERY** query with tenant-scoped data MUST filter by `tenant_id`
- API keys are tenant-scoped, hashed in DB (never store plain text)
- Per-tenant config in `shared.tenants.config` JSONB
- Enforce plan limits: conversations/month, KB size, allowed models

## Code Rules — AI Integration

- **All LLM calls via LiteLLM** — never call providers (DeepSeek, Anthropic, OpenAI) directly
- Model selection by tier: `fast-cheap`, `balanced`, `powerful`, `coding`, `vision`
- Always track token usage for billing accuracy
- Implement timeout + retry on all AI calls
- Validate all LLM output with Zod schemas at boundary

## Code Rules — Security

- Never log API keys, secrets, or PII
- JWT tokens: short expiry (15min access, 7d refresh)
- Rate limiting at Traefik + application level
- CORS restricted to tenant-configured domains
- Input validation on all endpoints (Zod schemas)

## Code Rules — React

- Components: PascalCase, file: `kebab-case.tsx`
- Custom hooks: `useXxx` in `use-xxx.ts`
- Server state via TanStack Query — never fetch in useEffect
- Local UI state via useState/useReducer — no global store for server state
- Error boundaries for async/AI components
- No prop drilling beyond 2 levels — use context or state manager

## Architecture

Do not create a new service/package until the boundary is demonstrated.

Before introducing new infrastructure:
1. problem solved
2. business impact
3. operational cost
4. alternative
5. migration risk

## Decisions

- Reversible: decide quickly, document only if useful
- Irreversible (API contract, DB schema, billing model, auth flow): create ADR in `docs/`

## AI Routing (questo progetto)

- Implementazione (TypeScript, Hono, React): DeepSeek V4 Pro (default)
- Analisi parallele (molti file): DeepSeek V4 Flash subagents (task)
- Architettura multi-tenant, AI pipeline design: Qwen3.8 (slow/plan)
- Review sicurezza/qualità: DeepSeek V4 Pro (advisor)
