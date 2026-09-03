-- ============================================================
-- 108 Vision — Bootstrap schema su Neon (DB: aia_platform)
-- ============================================================
-- Richiede: repo clonato in /opt/108vision/repos/108vision
-- Esegui come utente deploy da /opt/108vision:
--   psql "$NEON_DATABASE_URL" -f bootstrap-neon.sql
-- Idempotente (IF NOT EXISTS ovunque); sicuro da ri-eseguire.
-- \ir è relativo alla directory di QUESTO file.
-- ============================================================
\set ON_ERROR_STOP on

-- --- Estensioni (su Neon sono trusted; il role owner del DB può crearle) ---
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- --- Schema core (crea schema `shared` + tabelle piattaforma, piani, triggers) ---
\ir repos/108vision/aia-platform/infrastructure/postgres/init/02-schemas.sql

-- --- Migrations gateway 001→008 ---
-- Nota: 02-schemas crea già shared.memories; la 006 è IF NOT EXISTS e si
-- limita ad aggiungere indici GIN/ivfflat + trigger (nessun conflitto).
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/001-agents-table.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/002-admin-tables.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/003-auth-tables.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/004-integrations.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/005-usage-tracking.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/006-memories.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/007-proxy-config.sql
\ir repos/108vision/aia-platform/apps/gateway/src/db/migrations/008-kb-chunks.sql

-- I database `litellm` e `wellbeing` vanno creati a parte (console Neon o:
--   psql "$NEON_DATABASE_URL" -c 'CREATE DATABASE litellm'   /   'CREATE DATABASE wellbeing')
-- — le loro tabelle sono auto-migrate rispettivamente da LiteLLM e dalla API .NET.
SELECT 'bootstrap-neon: OK — schema shared pronto' AS result;
