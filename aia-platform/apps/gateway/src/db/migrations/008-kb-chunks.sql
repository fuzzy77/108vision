-- 008: Knowledge base chunks (pgvector — replaces Qdrant)
-- One shared table, tenant-scoped. Cosine similarity via ivfflat index.

CREATE TABLE IF NOT EXISTS shared.kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES shared.kb_documents(id) ON DELETE CASCADE,
  document_title VARCHAR(500),
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_chunks_tenant ON shared.kb_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON shared.kb_chunks(tenant_id, document_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding ON shared.kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Comments
COMMENT ON TABLE shared.kb_chunks IS 'Knowledge base embeddings stored in pgvector. Retrieved via cosine similarity search, always filtered by tenant_id.';
COMMENT ON COLUMN shared.kb_chunks.embedding IS '1024-dim vector (text-embedding-v3 via LiteLLM) for semantic similarity search';
