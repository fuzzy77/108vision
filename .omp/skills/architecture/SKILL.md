---
name: architecture
description: Architecture review skill for 108 Vision — trade-off analysis, ADR, bounded contexts, multi-tenant design.
---

# Architecture Review

## When to Use

Invoke `/skill:architecture` before:
- Introducing a new service or package
- Changing API contracts
- Modifying multi-tenant isolation logic
- Adding new infrastructure components
- Making irreversible database schema changes

## Review Process

1. **Identify the problem**: Is this solving the real problem or the declared one?
2. **Identify constraints**: Business, compliance, operational, team capacity.
3. **Distinguish reversible vs irreversible**: Type 1 (hard to reverse) vs Type 2 (easy to reverse).
4. **Evaluate at least 2 alternatives**: Never accept the first solution as the only option.
5. **Analyze coupling**: Does this add new dependencies between bounded contexts?
6. **Estimate blast radius**: What breaks if this fails?

## Questions to Ask

```
- What assumption does this design rest on?
- What would need to be true for it to fail?
- What is the operational cost of this?
- What is the rollback plan?
- Is this the simplest adequate solution?
- Does this create a distributed monolith (services that know too much about each other)?
- What is the team's cognitive load to maintain this?
```

## AIA Platform Specific

| Boundary | Rule |
|---|---|
| LLM calls | Always via LiteLLM — never direct provider |
| Tenant data | All queries filter by `tenant_id` |
| Auth | All endpoints via Better Auth middleware |
| Cost | Every LLM call tracks tokens per tenant |
| Vector search | Via Qdrant only — no other vector store |

## For Irreversible Decisions: Create ADR

Use `/adr` command. Include:
- Why this option over alternatives
- What we're giving up (trade-offs)
- How to roll back if wrong
- Who made the decision and when
