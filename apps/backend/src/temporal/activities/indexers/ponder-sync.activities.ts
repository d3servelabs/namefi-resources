/**
 * Activities for syncing on-chain data from a remote Ponder indexer.
 * Used in dev/local environments to avoid running a separate Ponder instance.
 *
 * The "since block" used to fetch incremental data is derived per chain from
 * the largest block already stored in the corresponding managed table, rather
 * than from a shared checkpoint. This keeps chains with different head-block
 * numbers from drifting against a single shared cursor.
 */

import { db as database } from '@namefi-astra/db';
import {
  managedNamefiNftTable,
  managedBurnedNamefiNftLogTable,
  managedTransferLogTable,
  managedExpirationChangeLogTable,
} from '@namefi-astra/db/schemas/managed-indexer-data';
import { sql } from 'drizzle-orm';
import { splitEvery } from 'ramda';
import { createLogger } from '#lib/logger';
import { config, secrets } from '#lib/env';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import { PonderSqlClient } from '#lib/ponder-client';
import type {
  PonderNamefiNft,
  PonderBurnedNamefiNftLog,
  PonderTransferLog,
  PonderExpirationChangeLog,
  PonderTableName,
} from '#lib/ponder-client';

const logger = createLogger({ name: 'ponder-sync-activities' });

const BATCH_SIZE = 500;

/**
 * Get a configured Ponder client instance
 */
export function getPonderClient(): PonderSqlClient {
  const ponderUrl = config.PONDER_INDEXER_URL;
  if (!ponderUrl) {
    throw new Error(
      'PONDER_INDEXER_URL is not configured. Cannot sync from remote Ponder indexer.',
    );
  }
  return new PonderSqlClient(ponderUrl, secrets.PONDER_INDEXER_API_KEY);
}

/**
 * Per-chain breakdown of a single table sync.
 */
export type PerChainSyncResult = {
  chainId: number;
  recordsFetched: number;
  recordsSynced: number;
  /** The sinceBlock we used for this chain on this run (null = full fetch). */
  sinceBlock: string | null;
  /** Max block observed in fetched records (null = no records). */
  lastSyncedBlock: string | null;
  error?: string;
};

/**
 * Result of a sync operation for a single table.
 *
 * Top-level totals are aggregated across chains and preserved for callers that
 * only care about overall counts. `perChain` holds the per-chain breakdown.
 */
export type TableSyncResult = {
  tableName: PonderTableName;
  perChain: PerChainSyncResult[];
  recordsFetched: number;
  recordsSynced: number;
  /** Max `lastSyncedBlock` across all chains for this table. */
  lastSyncedBlock: string | null;
  executionTimeMs: number;
  error?: string;
};

/**
 * Result of syncing all tables
 */
export type AllTablesSyncResult = {
  results: Record<PonderTableName, TableSyncResult>;
  totalRecordsSynced: number;
  executionTimeMs: number;
};

/**
 * Return the largest block number already stored in the managed table for
 * each chain. Used as the per-chain `sinceBlock` on the next Ponder fetch.
 *
 * Returns an empty map when the table has no rows. Chains absent from the map
 * trigger a full backfill for that chain on the next sync.
 */
async function getMaxBlockByChain(
  tableName: PonderTableName,
): Promise<Map<number, bigint>> {
  let rows: Array<{ chainId: number; maxBlock: string | null }>;

  switch (tableName) {
    case 'NamefiNft':
      rows = await database
        .select({
          chainId: managedNamefiNftTable.chainId,
          maxBlock: sql<
            string | null
          >`MAX(${managedNamefiNftTable.lastUpdatedBlock})`,
        })
        .from(managedNamefiNftTable)
        .groupBy(managedNamefiNftTable.chainId);
      break;
    case 'BurnedNamefiNftLog':
      rows = await database
        .select({
          chainId: managedBurnedNamefiNftLogTable.chainId,
          maxBlock: sql<
            string | null
          >`MAX(${managedBurnedNamefiNftLogTable.burnedBlock})`,
        })
        .from(managedBurnedNamefiNftLogTable)
        .groupBy(managedBurnedNamefiNftLogTable.chainId);
      break;
    case 'TransferLog':
      rows = await database
        .select({
          chainId: managedTransferLogTable.chainId,
          maxBlock: sql<
            string | null
          >`MAX(${managedTransferLogTable.blockNumber})`,
        })
        .from(managedTransferLogTable)
        .groupBy(managedTransferLogTable.chainId);
      break;
    case 'ExpirationChangeLog':
      rows = await database
        .select({
          chainId: managedExpirationChangeLogTable.chainId,
          maxBlock: sql<
            string | null
          >`MAX(${managedExpirationChangeLogTable.blockNumber})`,
        })
        .from(managedExpirationChangeLogTable)
        .groupBy(managedExpirationChangeLogTable.chainId);
      break;
  }

  const result = new Map<number, bigint>();
  for (const row of rows) {
    if (row.maxBlock != null) {
      result.set(row.chainId, BigInt(row.maxBlock));
    }
  }
  return result;
}

function warnOnOrphanChains(
  tableName: PonderTableName,
  maxByChain: Map<number, bigint>,
  allowedChainIds: readonly number[],
): void {
  const allowed = new Set(allowedChainIds);
  for (const chainId of maxByChain.keys()) {
    if (!allowed.has(chainId)) {
      logger.warn(
        { tableName, chainId },
        'Managed table has rows for chain not in ALLOWED_CHAINS; skipping sync for this chain',
      );
    }
  }
}

function aggregatePerChainResults(
  perChain: PerChainSyncResult[],
): Pick<
  TableSyncResult,
  'recordsFetched' | 'recordsSynced' | 'lastSyncedBlock'
> {
  let recordsFetched = 0;
  let recordsSynced = 0;
  let maxBlock: bigint | null = null;
  for (const r of perChain) {
    recordsFetched += r.recordsFetched;
    recordsSynced += r.recordsSynced;
    if (r.lastSyncedBlock != null) {
      const v = BigInt(r.lastSyncedBlock);
      if (maxBlock == null || v > maxBlock) maxBlock = v;
    }
  }
  return {
    recordsFetched,
    recordsSynced,
    lastSyncedBlock: maxBlock?.toString() ?? null,
  };
}

/**
 * Sync NamefiNft records from remote Ponder indexer
 */
export async function syncNamefiNftsFromPonder(
  forceFullSync = false,
): Promise<TableSyncResult> {
  const startTime = Date.now();
  const tableName: PonderTableName = 'NamefiNft';

  logger.info({ forceFullSync }, 'Starting NamefiNft sync from Ponder');

  try {
    const client = getPonderClient();
    const chainIds = getConfiguredAllowedChainIds();
    const maxByChain = forceFullSync
      ? new Map<number, bigint>()
      : await getMaxBlockByChain(tableName);
    warnOnOrphanChains(tableName, maxByChain, chainIds);

    const perChain: PerChainSyncResult[] = [];

    for (const chainId of chainIds) {
      const sinceBlock = maxByChain.get(chainId);
      try {
        const records = await client.fetchNamefiNfts({ sinceBlock, chainId });

        if (records.length === 0) {
          perChain.push({
            chainId,
            recordsFetched: 0,
            recordsSynced: 0,
            sinceBlock: sinceBlock?.toString() ?? null,
            lastSyncedBlock: sinceBlock?.toString() ?? null,
          });
          logger.info(
            { tableName, chainId, sinceBlock },
            'No new NamefiNft records for chain',
          );
          continue;
        }

        const transformedRecords = records.map((r: PonderNamefiNft) => ({
          tokenId: r.token_id,
          normalizedDomainName: r.normalized_domain_name,
          expirationTimeInSeconds: r.expiration_time_in_seconds,
          isLocked: r.is_locked,
          ownerAddress: r.owner_address,
          chainId: r.chain_id,
          lastUpdatedBlock: r.last_updated_block,
          lastUpdatedTimestamp: r.last_updated_timestamp,
          syncedAt: new Date(),
        }));

        const maxBlock = records.reduce(
          (max: bigint, r: PonderNamefiNft) =>
            BigInt(r.last_updated_block) > max
              ? BigInt(r.last_updated_block)
              : max,
          sinceBlock ?? 0n,
        );

        const batches = splitEvery(BATCH_SIZE, transformedRecords);
        const syncedCount = await database.transaction(async (tx) => {
          let count = 0;
          for (const batch of batches) {
            const result = await tx
              .insert(managedNamefiNftTable)
              .values(batch)
              .onConflictDoUpdate({
                target: [
                  managedNamefiNftTable.tokenId,
                  managedNamefiNftTable.chainId,
                ],
                set: {
                  normalizedDomainName: sql.raw(
                    'EXCLUDED.normalized_domain_name',
                  ),
                  expirationTimeInSeconds: sql.raw(
                    'EXCLUDED.expiration_time_in_seconds',
                  ),
                  isLocked: sql.raw('EXCLUDED.is_locked'),
                  ownerAddress: sql.raw('EXCLUDED.owner_address'),
                  lastUpdatedBlock: sql.raw('EXCLUDED.last_updated_block'),
                  lastUpdatedTimestamp: sql.raw(
                    'EXCLUDED.last_updated_timestamp',
                  ),
                  syncedAt: sql.raw('EXCLUDED.synced_at'),
                },
              });
            count += result.rowCount ?? 0;
          }
          return count;
        });

        perChain.push({
          chainId,
          recordsFetched: records.length,
          recordsSynced: syncedCount,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: maxBlock.toString(),
        });

        logger.info(
          {
            tableName,
            chainId,
            sinceBlock,
            recordsFetched: records.length,
            recordsSynced: syncedCount,
            maxBlock,
          },
          'NamefiNft chain sync completed',
        );
      } catch (chainError) {
        const errorMessage =
          chainError instanceof Error ? chainError.message : String(chainError);
        logger.error(
          { error: chainError, tableName, chainId },
          'NamefiNft chain sync failed',
        );
        perChain.push({
          chainId,
          recordsFetched: 0,
          recordsSynced: 0,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: null,
          error: errorMessage,
        });
      }
    }

    const totals = aggregatePerChainResults(perChain);
    logger.info({ tableName, ...totals, perChain }, 'NamefiNft sync completed');

    return {
      tableName,
      perChain,
      ...totals,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync NamefiNft from Ponder');
    return {
      tableName,
      perChain: [],
      recordsFetched: 0,
      recordsSynced: 0,
      lastSyncedBlock: null,
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Sync BurnedNamefiNftLog records from remote Ponder indexer
 */
export async function syncBurnedNftLogsFromPonder(
  forceFullSync = false,
): Promise<TableSyncResult> {
  const startTime = Date.now();
  const tableName: PonderTableName = 'BurnedNamefiNftLog';

  logger.info(
    { forceFullSync },
    'Starting BurnedNamefiNftLog sync from Ponder',
  );

  try {
    const client = getPonderClient();
    const chainIds = getConfiguredAllowedChainIds();
    const maxByChain = forceFullSync
      ? new Map<number, bigint>()
      : await getMaxBlockByChain(tableName);
    warnOnOrphanChains(tableName, maxByChain, chainIds);

    const perChain: PerChainSyncResult[] = [];

    for (const chainId of chainIds) {
      const sinceBlock = maxByChain.get(chainId);
      try {
        const records = await client.fetchBurnedNftLogs({
          sinceBlock,
          chainId,
        });

        if (records.length === 0) {
          perChain.push({
            chainId,
            recordsFetched: 0,
            recordsSynced: 0,
            sinceBlock: sinceBlock?.toString() ?? null,
            lastSyncedBlock: sinceBlock?.toString() ?? null,
          });
          logger.info(
            { tableName, chainId, sinceBlock },
            'No new BurnedNamefiNftLog records for chain',
          );
          continue;
        }

        const transformedRecords = records.map(
          (r: PonderBurnedNamefiNftLog) => ({
            tokenId: r.token_id,
            normalizedDomainName: r.normalized_domain_name,
            fromAddress: r.from_address,
            chainId: r.chain_id,
            burnedBlock: r.burned_block,
            burnedTimestamp: r.burned_timestamp,
            transactionHash: r.transaction_hash,
            expirationTimeAtBurn: r.expiration_time_at_burn,
            syncedAt: new Date(),
          }),
        );

        const maxBlock = records.reduce(
          (max: bigint, r: PonderBurnedNamefiNftLog) =>
            BigInt(r.burned_block) > max ? BigInt(r.burned_block) : max,
          sinceBlock ?? 0n,
        );

        const batches = splitEvery(BATCH_SIZE, transformedRecords);
        const syncedCount = await database.transaction(async (tx) => {
          let count = 0;
          for (const batch of batches) {
            const result = await tx
              .insert(managedBurnedNamefiNftLogTable)
              .values(batch)
              .onConflictDoNothing();
            count += result.rowCount ?? 0;
          }
          return count;
        });

        perChain.push({
          chainId,
          recordsFetched: records.length,
          recordsSynced: syncedCount,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: maxBlock.toString(),
        });

        logger.info(
          {
            tableName,
            chainId,
            sinceBlock,
            recordsFetched: records.length,
            recordsSynced: syncedCount,
            maxBlock,
          },
          'BurnedNamefiNftLog chain sync completed',
        );
      } catch (chainError) {
        const errorMessage =
          chainError instanceof Error ? chainError.message : String(chainError);
        logger.error(
          { error: chainError, tableName, chainId },
          'BurnedNamefiNftLog chain sync failed',
        );
        perChain.push({
          chainId,
          recordsFetched: 0,
          recordsSynced: 0,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: null,
          error: errorMessage,
        });
      }
    }

    const totals = aggregatePerChainResults(perChain);
    logger.info(
      { tableName, ...totals, perChain },
      'BurnedNamefiNftLog sync completed',
    );

    return {
      tableName,
      perChain,
      ...totals,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync BurnedNamefiNftLog from Ponder');
    return {
      tableName,
      perChain: [],
      recordsFetched: 0,
      recordsSynced: 0,
      lastSyncedBlock: null,
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Sync TransferLog records from remote Ponder indexer
 */
export async function syncTransferLogsFromPonder(
  forceFullSync = false,
): Promise<TableSyncResult> {
  const startTime = Date.now();
  const tableName: PonderTableName = 'TransferLog';

  logger.info({ forceFullSync }, 'Starting TransferLog sync from Ponder');

  try {
    const client = getPonderClient();
    const chainIds = getConfiguredAllowedChainIds();
    const maxByChain = forceFullSync
      ? new Map<number, bigint>()
      : await getMaxBlockByChain(tableName);
    warnOnOrphanChains(tableName, maxByChain, chainIds);

    const perChain: PerChainSyncResult[] = [];

    for (const chainId of chainIds) {
      const sinceBlock = maxByChain.get(chainId);
      try {
        const records = await client.fetchTransferLogs({
          sinceBlock,
          chainId,
        });

        if (records.length === 0) {
          perChain.push({
            chainId,
            recordsFetched: 0,
            recordsSynced: 0,
            sinceBlock: sinceBlock?.toString() ?? null,
            lastSyncedBlock: sinceBlock?.toString() ?? null,
          });
          logger.info(
            { tableName, chainId, sinceBlock },
            'No new TransferLog records for chain',
          );
          continue;
        }

        const transformedRecords = records.map((r: PonderTransferLog) => ({
          tokenId: r.token_id,
          normalizedDomainName: r.normalized_domain_name,
          fromAddress: r.from_address,
          toAddress: r.to_address,
          chainId: r.chain_id,
          blockNumber: r.block_number,
          blockTimestamp: r.block_timestamp,
          transactionHash: r.transaction_hash,
          isBurn: r.is_burn,
          syncedAt: new Date(),
        }));

        const maxBlock = records.reduce(
          (max: bigint, r: PonderTransferLog) =>
            BigInt(r.block_number) > max ? BigInt(r.block_number) : max,
          sinceBlock ?? 0n,
        );

        const batches = splitEvery(BATCH_SIZE, transformedRecords);
        const syncedCount = await database.transaction(async (tx) => {
          let count = 0;
          for (const batch of batches) {
            const result = await tx
              .insert(managedTransferLogTable)
              .values(batch)
              .onConflictDoNothing();
            count += result.rowCount ?? 0;
          }
          return count;
        });

        perChain.push({
          chainId,
          recordsFetched: records.length,
          recordsSynced: syncedCount,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: maxBlock.toString(),
        });

        logger.info(
          {
            tableName,
            chainId,
            sinceBlock,
            recordsFetched: records.length,
            recordsSynced: syncedCount,
            maxBlock,
          },
          'TransferLog chain sync completed',
        );
      } catch (chainError) {
        const errorMessage =
          chainError instanceof Error ? chainError.message : String(chainError);
        logger.error(
          { error: chainError, tableName, chainId },
          'TransferLog chain sync failed',
        );
        perChain.push({
          chainId,
          recordsFetched: 0,
          recordsSynced: 0,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: null,
          error: errorMessage,
        });
      }
    }

    const totals = aggregatePerChainResults(perChain);
    logger.info(
      { tableName, ...totals, perChain },
      'TransferLog sync completed',
    );

    return {
      tableName,
      perChain,
      ...totals,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync TransferLog from Ponder');
    return {
      tableName,
      perChain: [],
      recordsFetched: 0,
      recordsSynced: 0,
      lastSyncedBlock: null,
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Sync ExpirationChangeLog records from remote Ponder indexer
 */
export async function syncExpirationChangeLogsFromPonder(
  forceFullSync = false,
): Promise<TableSyncResult> {
  const startTime = Date.now();
  const tableName: PonderTableName = 'ExpirationChangeLog';

  logger.info(
    { forceFullSync },
    'Starting ExpirationChangeLog sync from Ponder',
  );

  try {
    const client = getPonderClient();
    const chainIds = getConfiguredAllowedChainIds();
    const maxByChain = forceFullSync
      ? new Map<number, bigint>()
      : await getMaxBlockByChain(tableName);
    warnOnOrphanChains(tableName, maxByChain, chainIds);

    const perChain: PerChainSyncResult[] = [];

    for (const chainId of chainIds) {
      const sinceBlock = maxByChain.get(chainId);
      try {
        const records = await client.fetchExpirationChangeLogs({
          sinceBlock,
          chainId,
        });

        if (records.length === 0) {
          perChain.push({
            chainId,
            recordsFetched: 0,
            recordsSynced: 0,
            sinceBlock: sinceBlock?.toString() ?? null,
            lastSyncedBlock: sinceBlock?.toString() ?? null,
          });
          logger.info(
            { tableName, chainId, sinceBlock },
            'No new ExpirationChangeLog records for chain',
          );
          continue;
        }

        const transformedRecords = records.map(
          (r: PonderExpirationChangeLog) => ({
            tokenId: r.token_id,
            normalizedDomainName: r.normalized_domain_name,
            previousExpiration: r.previous_expiration,
            newExpiration: r.new_expiration,
            changedBy: r.changed_by,
            chainId: r.chain_id,
            blockNumber: r.block_number,
            blockTimestamp: r.block_timestamp,
            transactionHash: r.transaction_hash,
            source: r.source,
            syncedAt: new Date(),
          }),
        );

        const maxBlock = records.reduce(
          (max: bigint, r: PonderExpirationChangeLog) =>
            BigInt(r.block_number) > max ? BigInt(r.block_number) : max,
          sinceBlock ?? 0n,
        );

        const batches = splitEvery(BATCH_SIZE, transformedRecords);
        const syncedCount = await database.transaction(async (tx) => {
          let count = 0;
          for (const batch of batches) {
            const result = await tx
              .insert(managedExpirationChangeLogTable)
              .values(batch)
              .onConflictDoNothing();
            count += result.rowCount ?? 0;
          }
          return count;
        });

        perChain.push({
          chainId,
          recordsFetched: records.length,
          recordsSynced: syncedCount,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: maxBlock.toString(),
        });

        logger.info(
          {
            tableName,
            chainId,
            sinceBlock,
            recordsFetched: records.length,
            recordsSynced: syncedCount,
            maxBlock,
          },
          'ExpirationChangeLog chain sync completed',
        );
      } catch (chainError) {
        const errorMessage =
          chainError instanceof Error ? chainError.message : String(chainError);
        logger.error(
          { error: chainError, tableName, chainId },
          'ExpirationChangeLog chain sync failed',
        );
        perChain.push({
          chainId,
          recordsFetched: 0,
          recordsSynced: 0,
          sinceBlock: sinceBlock?.toString() ?? null,
          lastSyncedBlock: null,
          error: errorMessage,
        });
      }
    }

    const totals = aggregatePerChainResults(perChain);
    logger.info(
      { tableName, ...totals, perChain },
      'ExpirationChangeLog sync completed',
    );

    return {
      tableName,
      perChain,
      ...totals,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync ExpirationChangeLog from Ponder');
    return {
      tableName,
      perChain: [],
      recordsFetched: 0,
      recordsSynced: 0,
      lastSyncedBlock: null,
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Sync all tables from remote Ponder indexer
 */
export async function syncAllPonderTables(
  forceFullSync = false,
): Promise<AllTablesSyncResult> {
  const startTime = Date.now();

  logger.info({ forceFullSync }, 'Starting full Ponder sync');

  const results: Record<PonderTableName, TableSyncResult> = {
    NamefiNft: await syncNamefiNftsFromPonder(forceFullSync),
    BurnedNamefiNftLog: await syncBurnedNftLogsFromPonder(forceFullSync),
    TransferLog: await syncTransferLogsFromPonder(forceFullSync),
    ExpirationChangeLog:
      await syncExpirationChangeLogsFromPonder(forceFullSync),
  };

  const totalRecordsSynced = Object.values(results).reduce(
    (sum, r) => sum + r.recordsSynced,
    0,
  );

  logger.info(
    {
      totalRecordsSynced,
      executionTimeMs: Date.now() - startTime,
      tableResults: Object.fromEntries(
        Object.entries(results).map(([k, v]) => [
          k,
          { synced: v.recordsSynced, error: v.error },
        ]),
      ),
    },
    'Full Ponder sync completed',
  );

  return {
    results,
    totalRecordsSynced,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Check if Ponder sync is configured and available
 */
export async function isPonderSyncEnabled(): Promise<boolean> {
  if (!config.PONDER_INDEXER_URL) {
    return false;
  }

  try {
    const client = getPonderClient();
    return await client.healthCheck();
  } catch {
    return false;
  }
}

// Export activities for Temporal registration
export const PonderSyncActivities = {
  syncNamefiNftsFromPonder,
  syncBurnedNftLogsFromPonder,
  syncTransferLogsFromPonder,
  syncExpirationChangeLogsFromPonder,
  syncAllPonderTables,
  isPonderSyncEnabled,
};
