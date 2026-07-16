-- Migration 007: Add proxy_config to API keys for external tool integration
-- Supports configurable RAG/memory injection per API key for proxy endpoints

ALTER TABLE shared.api_keys
  ADD COLUMN IF NOT EXISTS proxy_config jsonb DEFAULT '{}';

COMMENT ON COLUMN shared.api_keys.proxy_config IS
  'Per-key proxy configuration: ragEnabled, memoryEnabled, ragTopK, ragMinScore, defaultAgent';

-- Add index for proxy usage tracking queries
CREATE INDEX IF NOT EXISTS idx_usage_records_request_type
  ON shared.usage_records (request_type)
  WHERE request_type LIKE 'proxy_%';
