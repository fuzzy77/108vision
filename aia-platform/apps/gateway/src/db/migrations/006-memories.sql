-- 006: Persistent memory system
-- Allows AI to remember user preferences, project context, and decisions across sessions.

CREATE TABLE shared.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(50) DEFAULT 'general',
  embedding vector(1536),
  source VARCHAR(50) DEFAULT 'user',
  conversation_id UUID REFERENCES shared.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_memories_tenant ON shared.memories(tenant_id);
CREATE INDEX idx_memories_tenant_category ON shared.memories(tenant_id, category);
CREATE INDEX idx_memories_tenant_tags ON shared.memories USING GIN(tags);
CREATE INDEX idx_memories_embedding ON shared.memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON shared.memories
  FOR EACH ROW
  EXECUTE FUNCTION shared.update_updated_at();

-- Comments
COMMENT ON TABLE shared.memories IS 'Persistent AI memory - stores user preferences, project context, decisions. Retrieved via semantic search at conversation start.';
COMMENT ON COLUMN shared.memories.category IS 'Memory type: general, preference, project, decision, person, workflow';
COMMENT ON COLUMN shared.memories.source IS 'How the memory was created: user (explicit ask), auto (AI detected important info), system';
COMMENT ON COLUMN shared.memories.embedding IS '1536-dim vector for semantic similarity search via pgvector';
