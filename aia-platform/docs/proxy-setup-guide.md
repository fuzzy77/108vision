# 108 AI Proxy — Setup Guide

Connect your favorite AI tools (Claude Code, Cursor, Continue, aider, Open WebUI) to the 108 AI gateway for tracked, knowledge-enhanced AI usage.

## How It Works

```
Your Tool → 108 AI Gateway → LiteLLM → AI Provider (DeepSeek, Qwen, etc.)
                 ↓
    Usage Tracking + Budget + RAG (optional)
```

Every request is:
- Authenticated via your API key
- **Governed** — AI governance principles (uncertainty markers, ask-before-proceed, risk evaluation) are always injected
- Tracked for billing (tokens, cost, model used)
- Budget-enforced (auto-downgrade when near limit)
- Rate-limited per plan (starter: 20/min, growth: 60/min, scale: 200/min)
- Optionally enriched with your Knowledge Base context

## Endpoints

| Endpoint | Format | Used By |
|----------|--------|---------|
| `POST /v1/chat/completions` | OpenAI | Cursor, Continue, aider, Open WebUI |
| `POST /v1/messages` | Anthropic | Claude Code |
| `GET /v1/models` | OpenAI | All tools (model discovery) |
| `POST /v1/embeddings` | OpenAI | Embedding clients |
| `GET/POST /mcp` | MCP (SSE) | Claude Code, Cursor, Continue (tools) |

## Available Models

Any of these names will be mapped to internal tiers:

| Client-facing name | Internal tier | Description |
|---|---|---|
| `gpt-4o`, `gpt-4`, `claude-sonnet-*` | balanced | General purpose, good quality/cost ratio |
| `gpt-4o-mini`, `gpt-3.5-turbo`, `claude-haiku-*` | fast-cheap | Fast, economical |
| `gpt-4-turbo`, `o1`, `claude-opus-*` | powerful | Maximum quality |
| `deepseek-coder`, `codestral` | coding | Code-optimized |
| `fast-cheap`, `balanced`, `powerful`, `coding` | (direct) | Use tier names directly |

## Setup by Tool

### Claude Code

```bash
export ANTHROPIC_BASE_URL="https://YOUR-GATEWAY-URL/v1"
export ANTHROPIC_API_KEY="sk-108-..."
```

### Cursor

Settings → Models → Add Model:
- Provider: **OpenAI**
- Base URL: `https://YOUR-GATEWAY-URL/v1`
- API Key: `sk-108-...`
- Model: `gpt-4o` (or any name from the table above)

### Continue (VS Code / JetBrains)

In `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "108 AI",
      "provider": "openai",
      "model": "gpt-4o",
      "apiBase": "https://YOUR-GATEWAY-URL/v1",
      "apiKey": "sk-108-..."
    }
  ]
}
```

### aider

```bash
export OPENAI_API_BASE="https://YOUR-GATEWAY-URL/v1"
export OPENAI_API_KEY="sk-108-..."
aider --model gpt-4o
```

### Open WebUI

Admin Settings → Connections → OpenAI API:
- URL: `https://YOUR-GATEWAY-URL/v1`
- API Key: `sk-108-...`

### MCP Server (Knowledge Base access)

For Claude Code (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "108ai": {
      "url": "https://YOUR-GATEWAY-URL/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer sk-108-..."
      }
    }
  }
}
```

For Continue (`~/.continue/config.json`):

```json
{
  "mcpServers": [
    {
      "name": "108ai-knowledge",
      "url": "https://YOUR-GATEWAY-URL/mcp",
      "headers": { "Authorization": "Bearer sk-108-..." }
    }
  ]
}
```

**MCP Tools available:**
- `search_knowledge` — Semantic search in your organization's Knowledge Base
- `get_memories` — Retrieve persistent memories
- `store_memory` — Save new persistent memories
- `list_agents` — List configured AI agents
- `list_documents` — List Knowledge Base documents

## API Key Scopes

Configure scopes on your API key to enable features:

| Scope | Effect |
|-------|--------|
| `chat` | Default. Allows standard chat API usage |
| `proxy` | Enables proxy endpoint access |
| `proxy:rag` | Auto-injects Knowledge Base context into every request |
| `proxy:memory` | Auto-injects relevant persistent memories |

**Recommendation:** Leave RAG off for coding tools (Cursor, Claude Code, aider) — they manage their own context. Enable it for Open WebUI or general-purpose chat.

## Verifying Connection

```bash
# Quick test (should return model list)
curl https://YOUR-GATEWAY-URL/v1/models \
  -H "Authorization: Bearer sk-108-..."

# Chat test
curl https://YOUR-GATEWAY-URL/v1/chat/completions \
  -H "Authorization: Bearer sk-108-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hello"}]}'
```

## AI Governance (automatic)

All requests through the proxy automatically include 108 AI's governance principles:

- **Certainty markers** — AI marks claims as [verified], [probable], [unverified], [unknown]
- **Ask before proceed** — AI asks for clarification instead of assuming
- **Explain reasoning** — AI explains what it does and why
- **Declare uncertainty** — AI flags uncertainty before conclusions
- **Checkpoint irreversible** — AI asks confirmation before irreversible actions
- **Don't decide for user** — AI proposes options with trade-offs
- **Evaluate risk/benefit** — AI declares risks before acting

These principles apply regardless of which tool you use (Cursor, Claude Code, aider, etc.). This is a core differentiator vs using providers directly — your AI assistant is always governed, always transparent.

Per-tenant principle overrides (enable/disable specific principles) are configurable via the Dashboard → Agents page.

## Monitoring Usage

All proxy requests appear in the Dashboard → Billing page with type `proxy_openai` or `proxy_anthropic`. You can see:
- Per-model token breakdown
- Daily cost trends
- **Source breakdown** (chat vs proxy_openai vs proxy_anthropic vs proxy_mcp)
