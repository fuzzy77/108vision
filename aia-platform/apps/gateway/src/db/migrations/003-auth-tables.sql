-- Migration 003: Authentication tables
-- Adds session management, password reset, and email verification support.
-- Required by the Better Auth integration in the @aia/auth package.

-- -----------------------------------------------------------
-- Sessions (server-side session tracking for token revocation)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON shared.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON shared.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON shared.sessions(expires_at);

-- -----------------------------------------------------------
-- Password Reset Tokens
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON shared.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON shared.password_reset_tokens(token);

-- -----------------------------------------------------------
-- Email Verification Tokens
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON shared.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON shared.email_verification_tokens(token);

-- -----------------------------------------------------------
-- ALTER users table: add email_verified column if missing
-- -----------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'shared'
      AND table_name = 'users'
      AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE shared.users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- -----------------------------------------------------------
-- Cleanup job: auto-delete expired sessions (can be run via cron/Hangfire)
-- -----------------------------------------------------------
-- To purge expired sessions periodically:
--   DELETE FROM shared.sessions WHERE expires_at < NOW();
--   DELETE FROM shared.password_reset_tokens WHERE expires_at < NOW();
--   DELETE FROM shared.email_verification_tokens WHERE expires_at < NOW();

-- -----------------------------------------------------------
-- Apply updated_at trigger to sessions table
-- -----------------------------------------------------------
DROP TRIGGER IF EXISTS trg_update_sessions ON shared.sessions;
CREATE TRIGGER trg_update_sessions
  BEFORE UPDATE ON shared.sessions
  FOR EACH ROW
  EXECUTE FUNCTION shared.update_updated_at();
