---
description: Create a conventional commit for the current changes
---

Review `git status` and `git diff --staged`.

Create a conventional commit for these changes.

Format: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

Scopes: `gateway`, `dashboard`, `client`, `local-agent`, `shared`, `ai-client`, `auth`, `infra`

Examples:
- `feat(gateway): add tenant rate limiting middleware`
- `fix(ai-client): handle LiteLLM timeout with retry`
- `refactor(shared): extract TenantConfig Zod schema`

Keep description under 72 characters.
Add body if the WHY is non-obvious.
