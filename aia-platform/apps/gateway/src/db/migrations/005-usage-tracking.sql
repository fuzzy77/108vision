-- Migration 005: Enable per-request usage tracking and budget enforcement
-- Adds unique constraint on usage_daily for upsert support
-- Adds index on usage_records for tenant+date queries

-- Unique constraint for daily aggregate upsert (tenant + date + model)
ALTER TABLE shared.usage_daily
  ADD CONSTRAINT uq_usage_daily_tenant_date_model
  UNIQUE (tenant_id, date, model);

-- Index for per-request records lookup
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_created
  ON shared.usage_records (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_model
  ON shared.usage_records (tenant_id, model_name, created_at DESC);

-- Index for budget queries (monthly aggregation)
CREATE INDEX IF NOT EXISTS idx_usage_daily_tenant_date
  ON shared.usage_daily (tenant_id, date);
