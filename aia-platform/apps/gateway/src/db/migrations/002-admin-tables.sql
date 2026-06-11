-- Migration 002: Admin/Dashboard tables
-- Adds agent_templates, usage_daily, and invitations tables for consultant dashboard.

-- -----------------------------------------------------------
-- Agent Templates (marketplace)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  system_prompt TEXT NOT NULL,
  model_preference VARCHAR(50) NOT NULL DEFAULT 'balanced',
  temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.7,
  icon VARCHAR(100),
  is_public BOOLEAN NOT NULL DEFAULT true,
  install_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_templates_category ON shared.agent_templates(category);
CREATE INDEX idx_agent_templates_is_public ON shared.agent_templates(is_public);

-- -----------------------------------------------------------
-- Usage Daily (aggregated usage per tenant/model/day)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  model VARCHAR(50) NOT NULL,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  requests_count INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_usage_daily_tenant_date_model UNIQUE (tenant_id, date, model)
);

CREATE INDEX idx_usage_daily_tenant_id ON shared.usage_daily(tenant_id);
CREATE INDEX idx_usage_daily_date ON shared.usage_daily(date);
CREATE INDEX idx_usage_daily_tenant_date ON shared.usage_daily(tenant_id, date);

-- -----------------------------------------------------------
-- Invitations (user invitations for onboarding)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client_user',
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT chk_invitation_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

CREATE INDEX idx_invitations_tenant_id ON shared.invitations(tenant_id);
CREATE INDEX idx_invitations_token ON shared.invitations(token);
CREATE INDEX idx_invitations_email ON shared.invitations(email);
