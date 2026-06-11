/**
 * @aia/graph — Database initialization and schema setup.
 *
 * Creates constraints, indexes, and full-text search indexes
 * required by the knowledge graph.
 */

import { type Result, success, failure, AppError } from '@aia/shared';
import { runQuery } from './client.js';

/**
 * Initialize the Neo4j graph database schema.
 * Creates constraints, indexes, and full-text search configurations.
 * Safe to run multiple times (idempotent).
 */
export async function initializeGraphSchema(): Promise<Result<void>> {
  const operations: Array<{ name: string; cypher: string }> = [
    // Uniqueness constraint on entity ID
    {
      name: 'constraint_entity_id',
      cypher: `CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
               FOR (e:Entity) REQUIRE e.id IS UNIQUE`,
    },
    // Uniqueness constraint on relation ID
    {
      name: 'constraint_relation_id',
      cypher: `CREATE CONSTRAINT relation_id_unique IF NOT EXISTS
               FOR ()-[r:GRAPH_REL]-() REQUIRE r.id IS UNIQUE`,
    },
    // Index on entity tenantId for multi-tenant filtering
    {
      name: 'index_entity_tenant',
      cypher: `CREATE INDEX entity_tenant_idx IF NOT EXISTS
               FOR (e:Entity) ON (e.tenantId)`,
    },
    // Index on entity type for filtering
    {
      name: 'index_entity_type',
      cypher: `CREATE INDEX entity_type_idx IF NOT EXISTS
               FOR (e:Entity) ON (e.type)`,
    },
    // Index on entity sourceDocumentId for document-level operations
    {
      name: 'index_entity_document',
      cypher: `CREATE INDEX entity_document_idx IF NOT EXISTS
               FOR (e:Entity) ON (e.sourceDocumentId)`,
    },
    // Composite index for tenant + name lookups
    {
      name: 'index_entity_tenant_name',
      cypher: `CREATE INDEX entity_tenant_name_idx IF NOT EXISTS
               FOR (e:Entity) ON (e.tenantId, e.normalizedName)`,
    },
    // Full-text index on entity names for search
    {
      name: 'fulltext_entity_names',
      cypher: `CREATE FULLTEXT INDEX entity_fulltext_idx IF NOT EXISTS
               FOR (e:Entity) ON EACH [e.name, e.normalizedName]`,
    },
  ];

  for (const op of operations) {
    const result = await runQuery(op.cypher);
    if (!result.success) {
      // Full-text index creation may fail if it already exists with different config.
      // Log but continue for non-critical indexes.
      if (op.name.startsWith('fulltext_')) {
        console.log(JSON.stringify({
          level: 'warn',
          message: `Graph schema setup: ${op.name} skipped`,
          reason: result.error.message,
        }));
        continue;
      }
      return failure(
        new AppError(
          'GRAPH_SCHEMA_INIT_FAILED',
          `Failed to create ${op.name}: ${result.error.message}`,
          500,
        ),
      );
    }
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Graph schema initialized successfully',
    operationsRun: operations.length,
  }));

  return success(undefined);
}

/**
 * Verify that APOC plugin is available.
 * Returns the APOC version if available, null otherwise.
 */
export async function checkApocAvailable(): Promise<string | null> {
  const result = await runQuery<{ version: string }>(
    `RETURN apoc.version() AS version`,
  );

  if (!result.success) {
    return null;
  }

  const record = result.data.records[0];
  if (!record) {
    return null;
  }

  return record.get('version') as string;
}
