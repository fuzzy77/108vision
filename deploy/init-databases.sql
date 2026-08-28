-- Crea database aggiuntivi (il DB principale aia_platform viene creato da POSTGRES_DB)
CREATE DATABASE litellm;
CREATE DATABASE wellbeing;

-- Estensioni
\c aia_platform
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c wellbeing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
