import {
  asc,
  compileQuery,
  createClient,
  gt,
  sql as ponderSql,
} from '@ponder/client';
import * as schema from '@namefi-astra/indexer/schema';
import superjson from 'superjson';
import { createLogger } from '../logger';
import type {
  PonderBurnedNamefiNftLog,
  PonderExpirationChangeLog,
  PonderFetchOptions,
  PonderNamefiNft,
  PonderSqlResponse,
  PonderTransferLog,
} from './types';

const logger = createLogger({ name: 'ponder-client' });
const ponderSchema = schema as any;

type RawPonderQueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount?: number | null;
  meta?: {
    columns: Array<{
      name: string;
      type: string;
    }>;
    rowCount: number;
  };
};

/**
 * Client for querying a remote Ponder indexer via the official @ponder/client SDK.
 * Used to sync on-chain data from a production Ponder instance to local dev environments.
 */
export class PonderSqlClient {
  private baseUrl: string;
  private sqlBaseUrl: string;
  private apiKey?: string;
  private ponderClient: ReturnType<typeof createClient>;

  constructor(baseUrl: string, apiKey?: string) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.sqlBaseUrl = this.baseUrl.endsWith('/sql')
      ? this.baseUrl
      : `${this.baseUrl}/sql`;
    this.apiKey = apiKey;
    this.ponderClient = createClient(this.sqlBaseUrl, { schema });
  }

  private normalizeResult<T>(
    result: RawPonderQueryResult<T>,
  ): PonderSqlResponse<T> {
    return {
      rows: result.rows,
      meta: {
        columns: result.meta?.columns ?? [],
        rowCount:
          result.meta?.rowCount ?? result.rowCount ?? result.rows.length,
      },
    };
  }

  private async executeCompiledQuery<T>(
    query: unknown,
  ): Promise<PonderSqlResponse<T>> {
    const compiledQuery = compileQuery(
      query as Parameters<typeof compileQuery>[0],
    );
    const url = new URL(`${this.sqlBaseUrl}/db`);
    url.searchParams.set('sql', superjson.stringify(compiledQuery));

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { status: response.status, error: errorText },
        'Ponder SQL query failed',
      );
      throw new Error(
        `Ponder SQL query failed: ${response.status} - ${errorText}`,
      );
    }

    const result = (await response.json()) as RawPonderQueryResult<T>;
    return this.normalizeResult(result);
  }

  private async executeQuery<T>(
    sqlQuery: string,
  ): Promise<PonderSqlResponse<T>> {
    return this.executeCompiledQuery<T>(ponderSql.raw(sqlQuery));
  }

  /**
   * Execute a SQL query against the Ponder indexer
   */
  async query<T = Record<string, unknown>>(
    sql: string,
  ): Promise<PonderSqlResponse<T>> {
    logger.debug({ sql: sql.substring(0, 200) }, 'Executing Ponder SQL query');

    const result = await this.executeQuery<T>(sql);

    logger.debug(
      { rowCount: result.meta?.rowCount ?? result.rows.length },
      'Ponder SQL query completed',
    );

    return result;
  }

  /**
   * Fetch NamefiNft records from Ponder
   */
  async fetchNamefiNfts(
    options?: PonderFetchOptions,
  ): Promise<PonderNamefiNft[]> {
    let query = this.ponderClient.db
      .select({
        token_id: ponderSchema.NamefiNft.tokenId,
        normalized_domain_name: ponderSchema.NamefiNft.normalizedDomainName,
        expiration_time_in_seconds:
          ponderSchema.NamefiNft.expirationTimeInSeconds,
        is_locked: ponderSchema.NamefiNft.isLocked,
        owner_address: ponderSchema.NamefiNft.ownerAddress,
        chain_id: ponderSchema.NamefiNft.chainId,
        last_updated_block: ponderSchema.NamefiNft.lastUpdatedBlock,
        last_updated_timestamp: ponderSchema.NamefiNft.lastUpdatedTimestamp,
      })
      .from(ponderSchema.NamefiNft)
      .$dynamic();

    if (options?.sinceBlock !== undefined) {
      query = query.where(
        gt(ponderSchema.NamefiNft.lastUpdatedBlock, options.sinceBlock),
      );
    }

    query = query.orderBy(asc(ponderSchema.NamefiNft.lastUpdatedBlock));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    const result = await this.executeCompiledQuery<PonderNamefiNft>(query);
    return result.rows;
  }

  /**
   * Fetch BurnedNamefiNftLog records from Ponder
   */
  async fetchBurnedNftLogs(
    options?: PonderFetchOptions,
  ): Promise<PonderBurnedNamefiNftLog[]> {
    let query = this.ponderClient.db
      .select({
        token_id: ponderSchema.BurnedNamefiNftLog.tokenId,
        normalized_domain_name:
          ponderSchema.BurnedNamefiNftLog.normalizedDomainName,
        from_address: ponderSchema.BurnedNamefiNftLog.fromAddress,
        chain_id: ponderSchema.BurnedNamefiNftLog.chainId,
        burned_block: ponderSchema.BurnedNamefiNftLog.burnedBlock,
        burned_timestamp: ponderSchema.BurnedNamefiNftLog.burnedTimestamp,
        transaction_hash: ponderSchema.BurnedNamefiNftLog.transactionHash,
        expiration_time_at_burn:
          ponderSchema.BurnedNamefiNftLog.expirationTimeAtBurn,
      })
      .from(ponderSchema.BurnedNamefiNftLog)
      .$dynamic();

    if (options?.sinceBlock !== undefined) {
      query = query.where(
        gt(ponderSchema.BurnedNamefiNftLog.burnedBlock, options.sinceBlock),
      );
    }

    query = query.orderBy(asc(ponderSchema.BurnedNamefiNftLog.burnedBlock));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    const result =
      await this.executeCompiledQuery<PonderBurnedNamefiNftLog>(query);
    return result.rows;
  }

  /**
   * Fetch TransferLog records from Ponder
   */
  async fetchTransferLogs(
    options?: PonderFetchOptions,
  ): Promise<PonderTransferLog[]> {
    let query = this.ponderClient.db
      .select({
        token_id: ponderSchema.TransferLog.tokenId,
        normalized_domain_name: ponderSchema.TransferLog.normalizedDomainName,
        from_address: ponderSchema.TransferLog.fromAddress,
        to_address: ponderSchema.TransferLog.toAddress,
        chain_id: ponderSchema.TransferLog.chainId,
        block_number: ponderSchema.TransferLog.blockNumber,
        block_timestamp: ponderSchema.TransferLog.blockTimestamp,
        transaction_hash: ponderSchema.TransferLog.transactionHash,
        is_burn: ponderSchema.TransferLog.isBurn,
      })
      .from(ponderSchema.TransferLog)
      .$dynamic();

    if (options?.sinceBlock !== undefined) {
      query = query.where(
        gt(ponderSchema.TransferLog.blockNumber, options.sinceBlock),
      );
    }

    query = query.orderBy(asc(ponderSchema.TransferLog.blockNumber));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    const result = await this.executeCompiledQuery<PonderTransferLog>(query);
    return result.rows;
  }

  /**
   * Fetch ExpirationChangeLog records from Ponder
   */
  async fetchExpirationChangeLogs(
    options?: PonderFetchOptions,
  ): Promise<PonderExpirationChangeLog[]> {
    let query = this.ponderClient.db
      .select({
        token_id: ponderSchema.ExpirationChangeLog.tokenId,
        normalized_domain_name:
          ponderSchema.ExpirationChangeLog.normalizedDomainName,
        previous_expiration:
          ponderSchema.ExpirationChangeLog.previousExpiration,
        new_expiration: ponderSchema.ExpirationChangeLog.newExpiration,
        changed_by: ponderSchema.ExpirationChangeLog.changedBy,
        chain_id: ponderSchema.ExpirationChangeLog.chainId,
        block_number: ponderSchema.ExpirationChangeLog.blockNumber,
        block_timestamp: ponderSchema.ExpirationChangeLog.blockTimestamp,
        transaction_hash: ponderSchema.ExpirationChangeLog.transactionHash,
        source: ponderSchema.ExpirationChangeLog.source,
      })
      .from(ponderSchema.ExpirationChangeLog)
      .$dynamic();

    if (options?.sinceBlock !== undefined) {
      query = query.where(
        gt(ponderSchema.ExpirationChangeLog.blockNumber, options.sinceBlock),
      );
    }

    query = query.orderBy(asc(ponderSchema.ExpirationChangeLog.blockNumber));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    const result =
      await this.executeCompiledQuery<PonderExpirationChangeLog>(query);
    return result.rows;
  }

  /**
   * Get the maximum block number for a table (for checkpoint tracking)
   */
  async getMaxBlock(
    table:
      | 'NamefiNft'
      | 'BurnedNamefiNftLog'
      | 'TransferLog'
      | 'ExpirationChangeLog',
  ): Promise<bigint | null> {
    const blockColumn =
      table === 'NamefiNft'
        ? 'last_updated_block'
        : table === 'BurnedNamefiNftLog'
          ? 'burned_block'
          : 'block_number';

    const sql = `SELECT MAX(${blockColumn}) as max_block FROM "${table}"`;
    const result = await this.query<{ max_block: string | null }>(sql);

    const maxBlock = result.rows[0]?.max_block;
    return maxBlock ? BigInt(maxBlock) : null;
  }

  /**
   * Get the count of records in a table
   */
  async getCount(
    table:
      | 'NamefiNft'
      | 'BurnedNamefiNftLog'
      | 'TransferLog'
      | 'ExpirationChangeLog',
    sinceBlock?: bigint,
  ): Promise<number> {
    const blockColumn =
      table === 'NamefiNft'
        ? 'last_updated_block'
        : table === 'BurnedNamefiNftLog'
          ? 'burned_block'
          : 'block_number';

    let sql = `SELECT COUNT(*) as count FROM "${table}"`;

    if (sinceBlock !== undefined) {
      sql += ` WHERE ${blockColumn} > ${sinceBlock.toString()}`;
    }

    const result = await this.query<{ count: string }>(sql);
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  }

  /**
   * Health check - verify connection to Ponder indexer
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as health');
      return true;
    } catch (error) {
      logger.error({ error }, 'Ponder health check failed');
      return false;
    }
  }
}

export * from './types';
