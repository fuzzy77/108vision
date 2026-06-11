-- Migration 004: Integration tables
-- Adds email accounts, action requests, and generic integration configs.
-- Required by the @aia/integrations package for email and AI agent actions.

-- -----------------------------------------------------------
-- Email Accounts (per-tenant email integrations)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('imap', 'microsoft', 'google')),
  email VARCHAR(255) NOT NULL,
  config_encrypted TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_tenant_id ON shared.email_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_status ON shared.email_accounts(tenant_id, status);

-- Ensure one email address per tenant (cannot connect same email twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_tenant_email
  ON shared.email_accounts(tenant_id, email);

-- -----------------------------------------------------------
-- Action Requests (AI agent action approval workflow)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.action_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
  agent_id UUID,
  action VARCHAR(100) NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('read_only', 'low_risk', 'high_risk')),
  description TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved', 'executed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES shared.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_action_requests_tenant_id ON shared.action_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_status ON shared.action_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_action_requests_user_id ON shared.action_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_created_at ON shared.action_requests(created_at DESC);

-- -----------------------------------------------------------
-- Integration Configs (generic integration settings per tenant)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config_encrypted TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_tenant_id ON shared.integration_configs(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_configs_tenant_type_name
  ON shared.integration_configs(tenant_id, type, name);

-- -----------------------------------------------------------
-- Apply updated_at triggers
-- -----------------------------------------------------------
DROP TRIGGER IF EXISTS trg_update_email_accounts ON shared.email_accounts;
CREATE TRIGGER trg_update_email_accounts
  BEFORE UPDATE ON shared.email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION shared.update_updated_at();

DROP TRIGGER IF EXISTS trg_update_integration_configs ON shared.integration_configs;
CREATE TRIGGER trg_update_integration_configs
  BEFORE UPDATE ON shared.integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION shared.update_updated_at();
