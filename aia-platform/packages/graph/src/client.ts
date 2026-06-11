/**
 * @aia/graph — Neo4j client wrapper.
 *
 * Provides connection management, query execution with Result pattern,
 * and transaction support.
 */

import neo4j, {
  type Driver,
  type Session,
  type QueryResult,
  type ManagedTransaction,
} from 'neo4j-driver';
import { type Result, success, failure, AppError } from '@aia/shared';

export interface Neo4jConfig {
  url: string;
  user: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionTimeoutMs?: number;
}

let _driver: Driver | null = null;
let _config: Neo4jConfig | null = null;

/**
 * Initialize the Neo4j driver. Must be called before any other graph operations.
 */
export function connect(config: Neo4jConfig): void {
  if (_driver) {
    return;
  }

  _driver = neo4j.driver(
    config.url,
    neo4j.auth.basic(config.user, config.password),
    {
      maxConnectionPoolSize: config.maxConnectionPoolSize ?? 50,
      connectionAcquisitionTimeout: config.connectionTimeoutMs ?? 30_000,
      disableLosslessIntegers: true,
    },
  );

  _config = config;
}

/**
 * Close the Neo4j driver and release all connections.
 */
export async function close(): Promise<void> {
  if (_driver) {
    await _driver.close();
    _driver = null;
    _config = null;
  }
}

/**
 * Get the Neo4j driver instance.
 * Throws if not connected.
 */
export function getDriver(): Driver {
  if (!_driver) {
    throw new AppError(
      'NEO4J_NOT_CONNECTED',
      'Neo4j driver is not initialized. Call connect() first.',
      500,
    );
  }
  return _driver;
}

/**
 * Open a new Neo4j session for the configured database.
 */
export function getSession(database?: string): Session {
  const driver = getDriver();
  return driver.session({
    database: database ?? _config?.database ?? 'neo4j',
  });
}

/**
 * Execute a Cypher query and return results using the Result pattern.
 * Handles session lifecycle automatically.
 */
export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params?: Record<string, unknown>,
): Promise<Result<QueryResult<T>>> {
  const session = getSession();

  try {
    const result = await session.run<T>(cypher, params ?? {});
    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Neo4j error';
    return failure(
      new AppError('NEO4J_QUERY_FAILED', `Neo4j query failed: ${message}`, 500),
    );
  } finally {
    await session.close();
  }
}

/**
 * Execute a function within a Neo4j write transaction.
 * Automatically retries on transient failures.
 */
export async function runInTransaction<T>(
  fn: (tx: ManagedTransaction) => Promise<T>,
): Promise<Result<T>> {
  const session = getSession();

  try {
    const result = await session.executeWrite(fn);
    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Neo4j error';
    return failure(
      new AppError('NEO4J_TRANSACTION_FAILED', `Neo4j transaction failed: ${message}`, 500),
    );
  } finally {
    await session.close();
  }
}

/**
 * Execute a function within a Neo4j read transaction.
 * Optimized for read-only operations.
 */
export async function runReadTransaction<T>(
  fn: (tx: ManagedTransaction) => Promise<T>,
): Promise<Result<T>> {
  const session = getSession();

  try {
    const result = await session.executeRead(fn);
    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Neo4j error';
    return failure(
      new AppError('NEO4J_READ_FAILED', `Neo4j read transaction failed: ${message}`, 500),
    );
  } finally {
    await session.close();
  }
}

/**
 * Verify connectivity to Neo4j. Returns true if healthy, false otherwise.
 */
export async function healthCheck(): Promise<boolean> {
  if (!_driver) {
    return false;
  }

  try {
    await _driver.verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}
