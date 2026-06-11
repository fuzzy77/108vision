-- ============================================================
-- AIA Platform — PostgreSQL Extensions
-- ============================================================
-- Executed automatically on first container start.
-- Idempotent: safe to re-run.
-- ============================================================

-- UUID generation (v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector similarity search (pgvector)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Trigram-based text search (fuzzy matching)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Full-text search dictionaries (already built-in but ensure availability)
CREATE EXTENSION IF NOT EXISTS "unaccent";
