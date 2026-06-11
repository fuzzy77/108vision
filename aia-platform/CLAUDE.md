# CLAUDE.md — 108 AI Platform

## Project Overview

108 AI is a multi-tenant AI infrastructure platform for SMEs. It provides managed AI assistants powered by LLMs (DeepSeek, Qwen/Alibaba, with optional Claude/GPT fallback), with knowledge base management, conversation history, desktop agent integration, and usage-based billing.

**Brand:** 108 AI (by 108 Vision)
**Domain:** api.108ai.dev

## Architecture

```
                    ┌─────────────┐
                    │   Traefik   │  (reverse proxy, SSL)
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐  ┌─────┴─────┐  ┌──────┴──────┐
   │   Gateway   │  │ Dashboard │  │   Client    │
   │  (API/BFF)  │  │  (Admin)  │  │  (Widget)   │
   └──────┬──────┘  └───────────┘  └─────────────┘
          │
   ┌──────┴──────────────────────────┐
   │         Service Layer           │
   ├─────────┬──────────┬───────────┤
   │ LiteLLM │ Qdrant   │ PostgreSQL│
   │(AI Gate)│(Vectors) │ (Data)    │
   └─────────┴──────────┴───────────┘
          │                    │
   ┌──────┴─────┐      ┌──────┴──────┐
   │   Redis    │      │ 108 AI      │
   │(cache/jobs)│      │ Desktop     │
   └────────────┘      │ Agent       │
                       └─────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Reverse Proxy | Traefik v3 | SSL termination, routing, rate limiting |
| Database | PostgreSQL 16 + pgvector | Relational data + vector embeddings |
| Cache | Redis 7 | Sessions, rate limiting, job queues |
| Vector DB | Qdrant | Knowledge base semantic search |
| AI Gateway | LiteLLM | Model routing, cost tracking, fallbacks |
| Runtime | Node.js 20 + TypeScript | Application services |
| Monorepo | npm workspaces | Code sharing across apps |
| Desktop Agent | Node.js + esbuild | On-premise OS-level capabilities |

## AI Model Strategy

All LLM calls go through LiteLLM. **Primary providers: DeepSeek + Alibaba (Qwen).**

| Tier | Primary | Fallback | Cost (input/output per 1M) |
|------|---------|----------|---------------------------|
| `fast-cheap` | DeepSeek V3 | Qwen3-8B | $0.27/$1.10 |
| `balanced` | DeepSeek R1 (reasoning) | Qwen3-32B | $0.55/$2.19 |
| `powerful` | Qwen3-235B-A22B | DeepSeek R1 | $1.20/$4.00 |
| `coding` | DeepSeek V3 | Qwen3-30B-A3B | $0.27/$1.10 |
| `vision` | Qwen-VL-Max | DeepSeek V3 | varies |
| `embedding` | Alibaba text-embedding-v3 | OpenAI ada-3-small | ~$0.02/1M |

### Why DeepSeek + Alibaba

- **Cost**: 5-10x cheaper than Claude/GPT for equivalent quality on most tasks
- **Performance**: DeepSeek R1 competitive with Claude Sonnet on reasoning; Qwen3-235B competitive on complex tasks
- **Independence**: no dependency on US providers for core operations
- **Fallback**: Claude/GPT can be added per-tenant as premium tier if needed

## Project Structure

```
aia-platform/
├── apps/
│   ├── gateway/          # API gateway (Hono)
│   ├── dashboard/        # Admin dashboard (React + Vite)
│   ├── client/           # Embeddable chat widget (React)
│   └── local-agent/      # 108 AI Desktop Agent (Node.js)
├── packages/
│   ├── shared/           # Types, utils, constants
│   ├── ai-client/        # LiteLLM client wrapper
│   ├── auth/             # Authentication (Better Auth)
│   └── desktop-bridge/   # Native OS bindings for desktop agent
├── infrastructure/       # Docker configs, init scripts
├── scripts/              # Setup and deploy automation
├── templates/            # Prompt templates, system prompts
└── docs/                 # Technical documentation
```

## Package Naming Convention

All packages use `@108ai/` scope:

| Package | Purpose |
|---------|---------|
| `@108ai/shared` | Shared types and utilities |
| `@108ai/ai-client` | LiteLLM client wrapper |
| `@108ai/auth` | Authentication package |
| `@108ai/desktop-bridge` | Native OS bindings |
| `@108ai/desktop` | Desktop agent (the `108ai` CLI binary) |

## Development

### Prerequisites

- Docker & Docker Compose v2
- Node.js 20+
- npm 10+

### Quick Start

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your API keys (DEEPSEEK_API_KEY, DASHSCOPE_API_KEY)

# 2. Start infrastructure
make up

# 3. Verify services
make status
make llm-health
make qdrant-health
```

### Environment Variables (critical)

| Variable | Purpose |
|----------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API (V3 + R1) |
| `DASHSCOPE_API_KEY` | Alibaba DashScope (Qwen models) |
| `OPENAI_API_KEY` | Fallback embeddings (optional) |
| `LITELLM_MASTER_KEY` | LiteLLM admin key |
| `JWT_SECRET` | Auth token signing |
| `POSTGRES_PASSWORD` | Database |

## Coding Conventions

### TypeScript

- Strict mode enabled
- ESM modules (no CommonJS)
- Zod for runtime validation
- Result pattern for expected errors (no exceptions for business logic)

### Database

- All queries via parameterized statements (SQL injection prevention)
- Tenant isolation enforced at query level (always filter by tenant_id)
- Migrations managed via versioned SQL scripts

### API Design

- REST with JSON responses
- Error format: `{ "error": { "code": "...", "message": "..." } }`
- Authentication: JWT Bearer tokens
- Rate limiting per tenant/plan

### AI Integration

- All LLM calls go through LiteLLM (never call providers directly)
- Model selection by tier: `fast-cheap`, `balanced`, `powerful`, `coding`, `vision`
- Always track token usage for billing
- Implement timeout + retry on all AI calls

## Multi-Tenancy Model

- **Data isolation**: All tables include `tenant_id`; queries MUST filter by tenant
- **Configuration**: Per-tenant config in `shared.tenants.config` JSONB
- **Limits**: Enforced by plan (conversations/month, KB size, allowed models)
- **API Keys**: Tenant-scoped, hashed in DB, prefix for identification

## Security

- Never log API keys or PII
- JWT tokens with short expiry (15min access, 7d refresh)
- Rate limiting at Traefik and application level
- Input validation on all endpoints (Zod schemas)
- CORS restricted to tenant-configured domains

## Deployment

- Target: Hetzner VPS (Ubuntu 24.04)
- Deploy via `make deploy` or `./scripts/deploy.sh`
- Zero-downtime: Docker Compose recreates only changed services
- Backups: Daily automated + pre-deploy snapshots
