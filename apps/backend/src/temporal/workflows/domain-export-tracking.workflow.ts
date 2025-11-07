import { proxyActivities } from '@temporalio/workflow';
import type { DomainsActivities } from '../activities/domain';
import * as workflow from '@temporalio/workflow';

// Short timeout for simple DB queries
const {
  getLockedNftsForTracking,
  getPendingTransferDomains,
  collectExportTrackingMetrics,
  sendExportTrackingReportEmail,
} = proxyActivities<typeof DomainsActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

// Medium timeout for single domain processing (includes external API calls)
const { processSingleDomainExportStatus, checkSinglePendingTransfer } =
  proxyActivities<typeof DomainsActivities>({
    startToCloseTimeout: '5 minutes',
    retry: {
      maximumAttempts: 3,
    },
  });

export interface DomainExportTrackingWorkflowInput {
  /**
   * Whether to force processing even if no locked NFTs are found
   */
  forceRun?: boolean;

  /**
   * Maximum number of domains to process in parallel
   */
  maxConcurrency?: number;
}

export interface DomainExportTrackingWorkflowOutput {
  lockedNftsFound: number;
  domainsProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  noChange: number;
  pendingTransfersChecked: number;
  transfersCompleted: number;
  transfersFailed: number;
  success: boolean;
}

/**
 * Workflow to track domain export status
 *
 * This workflow uses smaller, focused activities to:
 * 1. Get list of locked NFTs
 * 2. Process each domain individually via activities (parallel execution with batching)
 * 3. Check pending transfers individually via activities (parallel execution with batching)
 * 4. Generate and send export tracking report to reports+exports@d3serve.xyz
 *
 * Benefits:
 * - Better fault isolation (one domain failure doesn't affect others)
 * - Parallel processing with configurable concurrency for better performance
 * - Fine-grained observability
 * - Efficient retries (only failed domains)
 */
export async function domainExportTrackingWorkflow(
  input: DomainExportTrackingWorkflowInput = {},
): Promise<DomainExportTrackingWorkflowOutput> {
  const { forceRun = false, maxConcurrency = 10 } = input;

  workflow.log.info('Starting refactored domain export tracking workflow', {
    forceRun,
    maxConcurrency,
  });

  try {
    // Step 1: Get all locked NFTs
    workflow.log.info('Getting locked NFTs');
    const lockedNfts = await getLockedNftsForTracking();

    workflow.log.info('Found locked NFTs', { count: lockedNfts.length });

    // Step 2: Process each domain in parallel (with concurrency limit)
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let noChange = 0;

    if (lockedNfts.length > 0) {
      workflow.log.info('Processing locked NFTs in parallel');

      // Process in batches to respect concurrency limit
      for (let i = 0; i < lockedNfts.length; i += maxConcurrency) {
        const batch = lockedNfts.slice(i, i + maxConcurrency);

        workflow.log.info('Processing batch', {
          batchStart: i,
          batchSize: batch.length,
        });

        // Process batch in parallel using activities
        const results = await Promise.all(
          batch.map((nft) =>
            processSingleDomainExportStatus({
              domain: nft.normalizedDomainName,
              chainId: nft.chainId,
              ownerAddress: nft.ownerAddress,
            }).catch((error) => {
              workflow.log.error('Failed to process domain', {
                domain: nft.normalizedDomainName,
                error,
              });
              // Return a default result for failed domains
              return { action: 'skipped' as const };
            }),
          ),
        );

        // Aggregate results
        for (const result of results) {
          switch (result.action) {
            case 'created':
              created++;
              break;
            case 'updated':
              updated++;
              break;
            case 'skipped':
              skipped++;
              break;
            case 'no_change':
              noChange++;
              break;
          }
        }
      }

      workflow.log.info('Completed processing locked NFTs', {
        created,
        updated,
        skipped,
        noChange,
      });
    }

    // Step 3: Check pending transfers
    workflow.log.info('Getting pending transfer domains');
    const pendingTransfers = await getPendingTransferDomains();

    workflow.log.info('Found pending transfers to check', {
      count: pendingTransfers.length,
    });

    let transfersCompleted = 0;
    let transfersFailed = 0;

    if (pendingTransfers.length > 0) {
      workflow.log.info('Checking pending transfers in parallel');

      // Process in batches
      for (let i = 0; i < pendingTransfers.length; i += maxConcurrency) {
        const batch = pendingTransfers.slice(i, i + maxConcurrency);

        workflow.log.info('Checking batch', {
          batchStart: i,
          batchSize: batch.length,
        });

        const results = await Promise.all(
          batch.map((record) =>
            checkSinglePendingTransfer({
              id: record.id,
              domain: record.domain,
              currentStatus: record.status,
              statusHistory: record.statusHistory,
            }).catch((error) => {
              workflow.log.error('Failed to check pending transfer', {
                domain: record.domain,
                error,
              });
              return { action: 'still_pending' as const };
            }),
          ),
        );

        // Aggregate results
        for (const result of results) {
          if (result.action === 'completed') {
            transfersCompleted++;
          } else if (result.action === 'failed') {
            transfersFailed++;
          }
        }
      }

      workflow.log.info('Completed checking pending transfers', {
        checked: pendingTransfers.length,
        completed: transfersCompleted,
        failed: transfersFailed,
      });
    }

    // Step 4: Generate and send report
    workflow.log.info('Generating export tracking report');
    const reportMetrics = await collectExportTrackingMetrics();

    workflow.log.info('Sending export tracking report email', {
      totalTracked: reportMetrics.totalTracked,
    });

    await sendExportTrackingReportEmail(reportMetrics);

    workflow.log.info('Export tracking report sent successfully');

    const output: DomainExportTrackingWorkflowOutput = {
      lockedNftsFound: lockedNfts.length,
      domainsProcessed: created + updated + skipped + noChange,
      created,
      updated,
      skipped,
      noChange,
      pendingTransfersChecked: pendingTransfers.length,
      transfersCompleted,
      transfersFailed,
      success: true,
    };

    workflow.log.info(
      'Refactored domain export tracking workflow completed successfully',
      output as unknown as Record<string, unknown>,
    );

    return output;
  } catch (error) {
    workflow.log.error('Refactored domain export tracking workflow failed', {
      error,
    });
    throw error;
  }
}
