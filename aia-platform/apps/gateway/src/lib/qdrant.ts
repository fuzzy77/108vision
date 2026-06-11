import { QdrantClient } from '@qdrant/js-client-rest';
import { getEnv } from './env.js';

let _client: QdrantClient | null = null;

export function getQdrant(): QdrantClient {
  if (!_client) {
    const env = getEnv();
    _client = new QdrantClient({ url: env.QDRANT_URL });
  }
  return _client;
}

export function getCollectionName(tenantId: string): string {
  return `kb_${tenantId.replace(/-/g, '_')}`;
}

/**
 * Ensures a Qdrant collection exists for a given tenant.
 * Creates it if it does not exist. Safe to call multiple times.
 */
export async function ensureCollection(tenantId: string): Promise<void> {
  const client = getQdrant();
  const collectionName = getCollectionName(tenantId);

  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === collectionName);

  if (!exists) {
    await client.createCollection(collectionName, {
      vectors: {
        size: 1536, // text-embedding-3-small dimension
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    });
  }
}
