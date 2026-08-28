---
description: Review current changes for quality, security and architecture
---

Review the current changes in this TypeScript / React / Hono project.

Check:

1. **TypeScript correctness**
   - No `any`, no unsafe `as`
   - Zod validation present at all API and LLM boundaries
   - ESM only (no `require()`)

2. **Multi-tenancy**
   - All DB queries filter by `tenant_id`
   - No cross-tenant data leakage risk

3. **AI Integration**
   - All LLM calls go through LiteLLM (never direct provider)
   - Token usage tracked
   - LLM output validated with Zod

4. **Security**
   - No PII in logs
   - No secrets in code
   - Rate limiting in place for new endpoints

5. **React patterns**
   - Server state via TanStack Query (no fetch in useEffect)
   - Error boundaries for async components

Return:
1. Blockers (must fix before merge)
2. Risks
3. Recommendations
4. Verdict (OK / NEEDS CHANGES)
