/**
 * Activities for syncing on-chain data from a remote Ponder indexer.
 * Used in dev/local environments to avoid running a separate Ponder instance.
 */

import { db as database } from '@namefi-astra/db';
import {
  managedNamefiNftTable,
  managedBurnedNamefiNftLogTable,
  managedTransferLogTable,
  managedExpirationChangeLogTable,
  syncCheckpointsTable,
} from '@namefi-astra/db/schemas/managed-indexer-data';
import { eq, sql } from 'drizzle-orm';
import { splitEvery } from 'ramda';
import { createLogger } from '#lib/logger';
import { config, secrets } from '#lib/env';
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
 * Result of a sync operation for a single table
 */
export type TableSyncResult = {
  tableName: PonderTableName;
  recordsFetched: number;
  recordsSynced: number;
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
 * Get the last synced block for a table from checkpoints
 */
export async function getLastSyncCheckpoint(
  tableName: PonderTableName,
): Promise<bigint | null> {
  const result = await database
    .select()
    .from(syncCheckpointsTable)
    .where(eq(syncCheckpointsTable.tableName, tableName))
    .limit(1);

  if (result.length === 0 || !result[0].lastSyncedBlock) {
    return null;
  }

  return BigInt(result[0].lastSyncedBlock);
}

/**
 * Update the sync checkpoint for a table
 */
async function updateSyncCheckpoint(
  tableName: PonderTableName,
  lastSyncedBlock: bigint,
  recordsSynced: number,
): Promise<void> {
  await database
    .insert(syncCheckpointsTable)
    .values({
      tableName,
      lastSyncedBlock: lastSyncedBlock.toString(),
      lastSyncedAt: new Date(),
      recordsSynced,
    })
    .onConflictDoUpdate({
      target: syncCheckpointsTable.tableName,
      set: {
        lastSyncedBlock: lastSyncedBlock.toString(),
        lastSyncedAt: new Date(),
        recordsSynced: sql`${syncCheckpointsTable.recordsSynced} + ${recordsSynced}`,
      },
    });
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

    // Get last synced block unless forcing full sync
    const sinceBlock = forceFullSync
      ? undefined
      : ((await getLastSyncCheckpoint(tableName)) ?? undefined);

    logger.info({ sinceBlock }, 'Fetching NamefiNft records');

    // Fetch records from Ponder
    const records = await client.fetchNamefiNfts({
      sinceBlock,
    });

    if (records.length === 0) {
      logger.info('No new NamefiNft records to sync');
      return {
        tableName,
        recordsFetched: 0,
        recordsSynced: 0,
        lastSyncedBlock: sinceBlock?.toString() ?? null,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Transform and upsert records
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

    let syncedCount = 0;
    const batches = splitEvery(BATCH_SIZE, transformedRecords);

    await database.transaction(async (tx) => {
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
              normalizedDomainName: sql.raw('EXCLUDED.normalized_domain_name'),
              expirationTimeInSeconds: sql.raw(
                'EXCLUDED.expiration_time_in_seconds',
              ),
              isLocked: sql.raw('EXCLUDED.is_locked'),
              ownerAddress: sql.raw('EXCLUDED.owner_address'),
              lastUpdatedBlock: sql.raw('EXCLUDED.last_updated_block'),
              lastUpdatedTimestamp: sql.raw('EXCLUDED.last_updated_timestamp'),
              syncedAt: sql.raw('EXCLUDED.synced_at'),
            },
          });
        syncedCount += result.rowCount ?? 0;
      }
    });

    // Get the max block from synced records
    const maxBlock = records.reduce(
      (max: bigint, r: PonderNamefiNft) =>
        BigInt(r.last_updated_block) > max ? BigInt(r.last_updated_block) : max,
      sinceBlock ?? 0n,
    );

    // Update checkpoint
    await updateSyncCheckpoint(tableName, maxBlock, syncedCount);

    logger.info(
      { recordsFetched: records.length, recordsSynced: syncedCount, maxBlock },
      'NamefiNft sync completed',
    );

    return {
      tableName,
      recordsFetched: records.length,
      recordsSynced: syncedCount,
      lastSyncedBlock: maxBlock?.toString(),
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync NamefiNft from Ponder');
    return {
      tableName,
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

    const sinceBlock = forceFullSync
      ? undefined
      : ((await getLastSyncCheckpoint(tableName)) ?? undefined);

    const records = await client.fetchBurnedNftLogs({ sinceBlock });

    if (records.length === 0) {
      logger.info('No new BurnedNamefiNftLog records to sync');
      return {
        tableName,
        recordsFetched: 0,
        recordsSynced: 0,
        lastSyncedBlock: sinceBlock?.toString() ?? null,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const transformedRecords = records.map((r: PonderBurnedNamefiNftLog) => ({
      tokenId: r.token_id,
      normalizedDomainName: r.normalized_domain_name,
      fromAddress: r.from_address,
      chainId: r.chain_id,
      burnedBlock: r.burned_block,
      burnedTimestamp: r.burned_timestamp,
      transactionHash: r.transaction_hash,
      expirationTimeAtBurn: r.expiration_time_at_burn,
      syncedAt: new Date(),
    }));

    let syncedCount = 0;
    const batches = splitEvery(BATCH_SIZE, transformedRecords);

    await database.transaction(async (tx) => {
      for (const batch of batches) {
        const result = await tx
          .insert(managedBurnedNamefiNftLogTable)
          .values(batch)
          .onConflictDoNothing();
        syncedCount += result.rowCount ?? 0;
      }
    });

    const maxBlock = records.reduce(
      (max: bigint, r: PonderBurnedNamefiNftLog) =>
        BigInt(r.burned_block) > max ? BigInt(r.burned_block) : max,
      sinceBlock ?? 0n,
    );

    await updateSyncCheckpoint(tableName, maxBlock, syncedCount);

    logger.info(
      { recordsFetched: records.length, recordsSynced: syncedCount, maxBlock },
      'BurnedNamefiNftLog sync completed',
    );

    return {
      tableName,
      recordsFetched: records.length,
      recordsSynced: syncedCount,
      lastSyncedBlock: maxBlock?.toString(),
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync BurnedNamefiNftLog from Ponder');
    return {
      tableName,
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

    const sinceBlock = forceFullSync
      ? undefined
      : ((await getLastSyncCheckpoint(tableName)) ?? undefined);

    const records = await client.fetchTransferLogs({ sinceBlock });

    if (records.length === 0) {
      logger.info('No new TransferLog records to sync');
      return {
        tableName,
        recordsFetched: 0,
        recordsSynced: 0,
        lastSyncedBlock: sinceBlock?.toString() ?? null,
        executionTimeMs: Date.now() - startTime,
      };
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

    let syncedCount = 0;
    const batches = splitEvery(BATCH_SIZE, transformedRecords);

    await database.transaction(async (tx) => {
      for (const batch of batches) {
        const result = await tx
          .insert(managedTransferLogTable)
          .values(batch)
          .onConflictDoNothing();
        syncedCount += result.rowCount ?? 0;
      }
    });

    const maxBlock = records.reduce(
      (max: bigint, r: PonderTransferLog) =>
        BigInt(r.block_number) > max ? BigInt(r.block_number) : max,
      sinceBlock ?? 0n,
    );

    await updateSyncCheckpoint(tableName, maxBlock, syncedCount);

    logger.info(
      { recordsFetched: records.length, recordsSynced: syncedCount, maxBlock },
      'TransferLog sync completed',
    );

    return {
      tableName,
      recordsFetched: records.length,
      recordsSynced: syncedCount,
      lastSyncedBlock: maxBlock?.toString(),
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync TransferLog from Ponder');
    return {
      tableName,
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

    const sinceBlock = forceFullSync
      ? undefined
      : ((await getLastSyncCheckpoint(tableName)) ?? undefined);

    const records = await client.fetchExpirationChangeLogs({ sinceBlock });

    if (records.length === 0) {
      logger.info('No new ExpirationChangeLog records to sync');
      return {
        tableName,
        recordsFetched: 0,
        recordsSynced: 0,
        lastSyncedBlock: sinceBlock?.toString() ?? null,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const transformedRecords = records.map((r: PonderExpirationChangeLog) => ({
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
    }));

    let syncedCount = 0;
    const batches = splitEvery(BATCH_SIZE, transformedRecords);

    await database.transaction(async (tx) => {
      for (const batch of batches) {
        const result = await tx
          .insert(managedExpirationChangeLogTable)
          .values(batch)
          .onConflictDoNothing();
        syncedCount += result.rowCount ?? 0;
      }
    });

    const maxBlock = records.reduce(
      (max: bigint, r: PonderExpirationChangeLog) =>
        BigInt(r.block_number) > max ? BigInt(r.block_number) : max,
      sinceBlock ?? 0n,
    );

    await updateSyncCheckpoint(tableName, maxBlock, syncedCount);

    logger.info(
      { recordsFetched: records.length, recordsSynced: syncedCount, maxBlock },
      'ExpirationChangeLog sync completed',
    );

    return {
      tableName,
      recordsFetched: records.length,
      recordsSynced: syncedCount,
      lastSyncedBlock: maxBlock?.toString(),
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, 'Failed to sync ExpirationChangeLog from Ponder');
    return {
      tableName,
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
  getLastSyncCheckpoint,
  syncNamefiNftsFromPonder,
  syncBurnedNftLogsFromPonder,
  syncTransferLogsFromPonder,
  syncExpirationChangeLogsFromPonder,
  syncAllPonderTables,
  isPonderSyncEnabled,
};
