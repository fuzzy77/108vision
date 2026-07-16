-- ============================================================
-- AIA Platform — Core Schema
-- ============================================================
-- Multi-tenant platform tables.
-- Executed automatically on first container start.
-- Idempotent: safe to re-run (uses IF NOT EXISTS).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS shared;

-- -----------------------------------------------------------
-- Tenants (each SME customer is a tenant)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    config JSONB DEFAULT '{}',
    plan_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON shared.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON shared.tenants(status);

-- -----------------------------------------------------------
-- Users
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'client_user'
        CHECK (role IN ('platform_admin', 'tenant_admin', 'tenant_operator', 'client_user')),
    name VARCHAR(255),
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON shared.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON shared.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON shared.users(role);

-- -----------------------------------------------------------
-- Plans (subscription tiers)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    max_conversations_month INT DEFAULT 1000,
    max_kb_documents INT DEFAULT 500,
    max_kb_size_mb INT DEFAULT 1024,
    allowed_models TEXT[] DEFAULT ARRAY['fast-cheap', 'balanced'],
    price_eur_month NUMERIC(10,2) DEFAULT 0,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans (idempotent via ON CONFLICT)
INSERT INTO shared.plans (name, max_conversations_month, max_kb_documents, max_kb_size_mb, allowed_models, price_eur_month, features)
VALUES
    ('starter', 200, 100, 256, ARRAY['fast-cheap'], 300.00, '{"support": "email", "custom_branding": false}'),
    ('professional', 1000, 500, 1024, ARRAY['fast-cheap', 'balanced'], 500.00, '{"support": "priority", "custom_branding": true}'),
    ('enterprise', 5000, 2000, 5120, ARRAY['fast-cheap', 'balanced', 'powerful'], 800.00, '{"support": "dedicated", "custom_branding": true, "sla": "99.9%"}')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------
-- API Keys (per-tenant keys for programmatic access)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['chat'],
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON shared.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON shared.api_keys(key_prefix);

-- -----------------------------------------------------------
-- Usage Tracking
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    model_name VARCHAR(50) NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost_eur NUMERIC(10,6) DEFAULT 0,
    request_type VARCHAR(30) DEFAULT 'chat',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_tenant_date ON shared.usage_records(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_model ON shared.usage_records(model_name);

-- -----------------------------------------------------------
-- Knowledge Base Documents
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.kb_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('upload', 'url', 'api', 'manual')),
    source_url TEXT,
    content_hash VARCHAR(64),
    chunk_count INT DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error', 'deleted')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_docs_tenant ON shared.kb_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_status ON shared.kb_documents(status);

-- -----------------------------------------------------------
-- Conversations
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    title VARCHAR(500),
    channel VARCHAR(30) DEFAULT 'web' CHECK (channel IN ('web', 'api', 'whatsapp', 'widget')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON shared.conversations(tenant_id, created_at DESC);

-- -----------------------------------------------------------
-- Messages
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES shared.conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_used VARCHAR(50),
    tokens_used INT DEFAULT 0,
    feedback_score SMALLINT CHECK (feedback_score BETWEEN -1 AND 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON shared.messages(conversation_id, created_at);

-- -----------------------------------------------------------
-- Platform Settings (admin key/value config store)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES shared.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- Add FK from tenants to plans (deferred to avoid circular dep)
-- -----------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_tenants_plan'
    ) THEN
        ALTER TABLE shared.tenants
            ADD CONSTRAINT fk_tenants_plan
            FOREIGN KEY (plan_id) REFERENCES shared.plans(id) ON DELETE SET NULL;
    END IF;
END $$;

-- -----------------------------------------------------------
-- Updated_at trigger function
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION shared.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------
-- Memories (persistent AI memory per tenant)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(30) DEFAULT 'general',
    source VARCHAR(20) DEFAULT 'user',
    conversation_id UUID,
    embedding vector(1024),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_tenant ON shared.memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON shared.memories(tenant_id, category);

-- -----------------------------------------------------------
-- Action Requests (desktop agent action approval queue)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.action_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'low',
    params JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_requests_tenant ON shared.action_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_status ON shared.action_requests(status);

-- Apply trigger to tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['tenants', 'users', 'kb_documents', 'conversations', 'memories', 'action_requests'])
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_update_%I ON shared.%I; CREATE TRIGGER trg_update_%I BEFORE UPDATE ON shared.%I FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();',
            t, t, t, t
        );
    END LOOP;
END $$;
