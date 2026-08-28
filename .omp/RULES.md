# RULES

Hard requirements for the AIA Platform — always apply.

- TypeScript strict: no `any`, no unsafe `as`.
- Multi-tenancy: every tenant-scoped query MUST filter by `tenant_id`.
- All LLM calls via LiteLLM — never a direct provider call.
- Zod validation at every boundary (API input, env vars, LLM output).
- Never log API keys, secrets, or PII.
- ESM only — no `require()` or CommonJS.
