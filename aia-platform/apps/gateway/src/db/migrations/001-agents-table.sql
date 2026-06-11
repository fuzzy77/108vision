-- ============================================================
-- AIA Platform — Agents Table Migration
-- ============================================================
-- Adds the agents table to support configurable AI assistants per tenant.
-- Idempotent: safe to re-run (uses IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS shared.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'balanced',
    temperature NUMERIC(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 4096,
    knowledge_base_ids UUID[] DEFAULT '{}',
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_tenant ON shared.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_active ON shared.agents(tenant_id, is_active);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trg_update_agents ON shared.agents;
CREATE TRIGGER trg_update_agents
    BEFORE UPDATE ON shared.agents
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
