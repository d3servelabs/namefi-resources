/**
 * Workflow for syncing on-chain data from a remote Ponder indexer.
 * Used in dev/local environments to avoid running a separate Ponder instance.
 *
 * This workflow fetches data from a production Ponder indexer via SQL over HTTP
 * and syncs it to local tables in the managed_indexer_data schema.
 */
import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { PonderTableName } from '../../lib/ponder-client';
import type { TableSyncResult } from '../activities/indexers/ponder-sync.activities';

const {
  syncNamefiNftsFromPonder,
  syncBurnedNftLogsFromPonder,
  syncTransferLogsFromPonder,
  syncExpirationChangeLogsFromPonder,
  syncAllPonderTables,
  isPonderSyncEnabled,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '10m', // Allow time for large data syncs
  },
});

export type SyncPonderIndexWorkflowInput = {
  /**
   * Specific tables to sync. If not provided, syncs all tables.
   */
  tables?: PonderTableName[];

  /**
   * Force a full sync from block 0, ignoring checkpoints.
   * Use with caution for large datasets.
   * @default false
   */
  forceFullSync?: boolean;
};

export type SyncPonderIndexWorkflowOutput = {
  /**
   * Whether Ponder sync is enabled and available
   */
  enabled: boolean;

  /**
   * Results for each synced table
   */
  syncResults: Partial<Record<PonderTableName, TableSyncResult>>;

  /**
   * Total records synced across all tables
   */
  totalRecordsSynced: number;

  /**
   * Total workflow execution time in milliseconds
   */
  workflowExecutionTimeMs: number;

  /**
   * Any errors that occurred during sync
   */
  errors: string[];
};

/**
 * Workflow to sync on-chain data from a remote Ponder indexer.
 *
 * This enables dev/local environments to use production on-chain data
 * without running their own Ponder indexer instance.
 *
 * The workflow:
 * 1. Checks if Ponder sync is enabled (PONDER_INDEXER_URL configured)
 * 2. Fetches data from the remote Ponder indexer via SQL over HTTP
 * 3. Upserts records to local managed_indexer_data tables
 * 4. Tracks sync progress using checkpoints for incremental updates
 */
export async function syncPonderIndexWorkflow(
  input: SyncPonderIndexWorkflowInput = {},
): Promise<SyncPonderIndexWorkflowOutput> {
  const startTime = Date.now();
  const { tables, forceFullSync = false } = input;

  workflow.log.info('Starting Ponder index sync workflow', {
    tables: tables ?? 'all',
    forceFullSync,
  });

  // Check if sync is enabled
  const enabled = await isPonderSyncEnabled();

  if (!enabled) {
    workflow.log.warn(
      'Ponder sync is not enabled. Set PONDER_INDEXER_URL to enable.',
    );
    return {
      enabled: false,
      syncResults: {},
      totalRecordsSynced: 0,
      workflowExecutionTimeMs: Date.now() - startTime,
      errors: ['Ponder sync is not enabled'],
    };
  }

  const syncResults: Partial<Record<PonderTableName, TableSyncResult>> = {};
  const errors: string[] = [];

  // If no specific tables requested, sync all
  if (!tables || tables.length === 0) {
    workflow.log.info('Syncing all Ponder tables');

    const allResults = await syncAllPonderTables(forceFullSync);

    // Copy results
    for (const [tableName, result] of Object.entries(allResults.results)) {
      syncResults[tableName as PonderTableName] = result;
      if (result.error) {
        errors.push(`${tableName}: ${result.error}`);
      }
    }
  } else {
    // Sync specific tables
    workflow.log.info('Syncing specific Ponder tables', { tables });

    for (const tableName of tables) {
      let result: TableSyncResult;

      switch (tableName) {
        case 'NamefiNft':
          result = await syncNamefiNftsFromPonder(forceFullSync);
          break;
        case 'BurnedNamefiNftLog':
          result = await syncBurnedNftLogsFromPonder(forceFullSync);
          break;
        case 'TransferLog':
          result = await syncTransferLogsFromPonder(forceFullSync);
          break;
        case 'ExpirationChangeLog':
          result = await syncExpirationChangeLogsFromPonder(forceFullSync);
          break;
        default:
          workflow.log.warn('Unknown table name', { tableName });
          continue;
      }

      syncResults[tableName] = result;
      if (result.error) {
        errors.push(`${tableName}: ${result.error}`);
      }
    }
  }

  const totalRecordsSynced = Object.values(syncResults).reduce(
    (sum, r) => sum + (r?.recordsSynced ?? 0),
    0,
  );

  const workflowExecutionTimeMs = Date.now() - startTime;

  const output: SyncPonderIndexWorkflowOutput = {
    enabled: true,
    syncResults,
    totalRecordsSynced,
    workflowExecutionTimeMs,
    errors,
  };

  workflow.log.info('Ponder index sync workflow completed', {
    totalRecordsSynced,
    tablesProcessed: Object.keys(syncResults).length,
    errorCount: errors.length,
    executionTimeMs: workflowExecutionTimeMs,
  });

  return output;
}
