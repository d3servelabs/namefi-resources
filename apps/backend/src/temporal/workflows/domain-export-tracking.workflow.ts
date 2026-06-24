import { executeChild, proxyActivities } from '@temporalio/workflow';
import type { DomainsActivities } from '../activities/domain';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { ensureNftIsLockedAndBurnByNftName } from './mint.workflow';

// Short timeout for simple DB queries
const {
  getLockedNftsForTracking,
  getPendingTransferDomains,
  getActiveAdminReviewDomains,
  collectExportTrackingMetrics,
  sendExportTrackingReportEmail,
  getDomainsEligibleForBurn,
  recordNftBurn,
} = proxyActivities<typeof DomainsActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

// Medium timeout for activities that make external API calls: single-domain
// processing, the pending re-check, and the pre-burn evidence re-verification.
const {
  processSingleDomainExportStatus,
  checkSinglePendingTransfer,
  shouldBurnNft,
} = proxyActivities<typeof DomainsActivities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

// On-chain NFT reads run on the MINT queue (where wallet/RPC config lives),
// same as the burn child workflow.
const { isNamefiNftBurned } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.MINT,
  options: {
    startToCloseTimeout: '30 seconds',
    retry: {
      maximumAttempts: 3,
    },
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
  noSignal: number;
  undetermined: number;
  noChange: number;
  pendingTransfersChecked: number;
  transfersCompleted: number;
  transfersFailed: number;
  nftsBurned: number;
  nftBurnsFailed: number;
  pendingExportEmailsSent: number;
  failedExportEmailsSent: number;
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
    let noSignal = 0;
    let undetermined = 0;
    let noChange = 0;
    let pendingExportEmailsSent = 0;
    let failedExportEmailsSent = 0;

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
          if ('pendingEmailSent' in result && result.pendingEmailSent) {
            pendingExportEmailsSent++;
          }
          if ('failedEmailSent' in result && result.failedEmailSent) {
            failedExportEmailsSent++;
          }

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
            case 'no_signal':
              noSignal++;
              break;
            case 'undetermined':
              undetermined++;
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
        noSignal,
        undetermined,
        noChange,
        pendingExportEmailsSent,
        failedExportEmailsSent,
      });
    }

    // Step 2b: Refresh active NEEDS_ADMIN_REVIEW / UNDETERMINED rows that the
    // locked-NFT scan above did not cover (e.g. a domain whose NFT is no longer
    // enumerated as locked). Without this their `latestEvidence` goes stale
    // while they wait for an admin. Reuses processSingleDomainExportStatus so
    // the same gather + transition logic applies; dedupes against the locked
    // NFTs already processed this tick.
    const processedKeys = new Set(
      lockedNfts.map((nft) => `${nft.chainId}:${nft.normalizedDomainName}`),
    );
    const reviewDomains = (await getActiveAdminReviewDomains()).filter(
      (record) => !processedKeys.has(`${record.chainId}:${record.domain}`),
    );

    if (reviewDomains.length > 0) {
      workflow.log.info('Refreshing admin-review / undetermined rows', {
        count: reviewDomains.length,
      });

      for (let i = 0; i < reviewDomains.length; i += maxConcurrency) {
        const batch = reviewDomains.slice(i, i + maxConcurrency);

        const results = await Promise.all(
          batch.map((record) =>
            processSingleDomainExportStatus({
              domain: record.domain,
              chainId: record.chainId,
              ownerAddress: record.ownerAddress,
            }).catch((error) => {
              workflow.log.error('Failed to refresh admin-review row', {
                domain: record.domain,
                error,
              });
              return { action: 'skipped' as const };
            }),
          ),
        );

        for (const result of results) {
          if ('pendingEmailSent' in result && result.pendingEmailSent) {
            pendingExportEmailsSent++;
          }
          if ('failedEmailSent' in result && result.failedEmailSent) {
            failedExportEmailsSent++;
          }

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
            case 'no_signal':
              noSignal++;
              break;
            case 'undetermined':
              undetermined++;
              break;
            case 'no_change':
              noChange++;
              break;
          }
        }
      }

      workflow.log.info(
        'Completed refreshing admin-review / undetermined rows',
        {
          refreshed: reviewDomains.length,
        },
      );
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
              chainId: record.chainId,
              ownerAddress: record.ownerAddress,
              currentStatus: record.status,
              statusHistory: record.statusHistory,
              clientApprovedAt: record.clientApprovedAt,
              adminVerifiedAt: record.adminVerifiedAt,
            }).catch((error) => {
              workflow.log.error('Failed to check pending transfer', {
                domain: record.domain,
                error,
              });
              return { action: 'undetermined' as const };
            }),
          ),
        );

        // Aggregate results
        for (const result of results) {
          if (result.action === 'completed') {
            transfersCompleted++;
          } else if (result.action === 'failed') {
            transfersFailed++;
            if ('failedEmailSent' in result && result.failedEmailSent) {
              failedExportEmailsSent++;
            }
          }
        }
      }

      workflow.log.info('Completed checking pending transfers', {
        checked: pendingTransfers.length,
        completed: transfersCompleted,
        failed: transfersFailed,
        failedExportEmailsSent,
      });
    }

    // Step 4: Check burn eligibility and burn NFTs
    workflow.log.info('Checking domains eligible for NFT burning');
    const eligibleForBurn = await getDomainsEligibleForBurn();

    let nftsBurned = 0;
    let nftBurnsFailed = 0;

    if (eligibleForBurn.length > 0) {
      workflow.log.info('Processing burn eligibility', {
        count: eligibleForBurn.length,
      });

      for (const record of eligibleForBurn) {
        try {
          const burnCheck = await shouldBurnNft({
            domain: record.domain,
            chainId: record.chainId,
          });

          if (burnCheck.shouldBurn) {
            workflow.log.info('Burning NFT for exported domain', {
              domain: record.domain,
              chainId: record.chainId,
              reason: burnCheck.reason,
            });

            // Idempotency: another environment sharing this NFT contract may
            // have already burned the token. Re-sending the burn TX would
            // revert, so check on-chain first and just record the burn if it's
            // already gone. On an inconclusive read, fall through to the burn
            // (the child workflow has its own guards); never skip on doubt.
            const alreadyBurned = await isNamefiNftBurned(
              record.chainId,
              record.domain,
            ).catch((burnedCheckError) => {
              workflow.log.warn(
                'NFT burned-check failed; proceeding to burn attempt',
                {
                  domain: record.domain,
                  chainId: record.chainId,
                  error: burnedCheckError,
                },
              );
              return false;
            });

            if (alreadyBurned) {
              await recordNftBurn({
                trackingRecordId: record.id,
                domain: record.domain,
                chainId: record.chainId,
                alreadyBurned: true,
              });
              nftsBurned++;
              workflow.log.info(
                'NFT already burned on-chain; recorded without sending a TX',
                {
                  domain: record.domain,
                  chainId: record.chainId,
                },
              );
              continue;
            }

            try {
              const burnTxHash = await executeChild(
                ensureNftIsLockedAndBurnByNftName,
                {
                  workflowId: ensureNftIsLockedAndBurnByNftName.generateId({
                    domainName: record.domain,
                    chainId: record.chainId,
                  }),
                  args: [
                    {
                      chainId: record.chainId,
                      domainName: record.domain,
                    },
                  ],
                  taskQueue: TEMPORAL_QUEUES.MINT,
                },
              );

              // Record successful burn
              await recordNftBurn({
                trackingRecordId: record.id,
                domain: record.domain,
                chainId: record.chainId,
                txHash: burnTxHash,
              });

              nftsBurned++;

              workflow.log.info('NFT burned successfully', {
                domain: record.domain,
                chainId: record.chainId,
                txHash: burnTxHash,
              });
            } catch (burnError) {
              // The burn may have failed precisely because another environment
              // burned the token between our pre-check and the child workflow.
              // Re-check on-chain: if it's already gone, the desired state is
              // reached — record it as already burned instead of a failure.
              const burnedAfterFailure = await isNamefiNftBurned(
                record.chainId,
                record.domain,
              ).catch((burnedCheckError) => {
                workflow.log.warn(
                  'Post-failure burned-check failed; recording burn failure',
                  {
                    domain: record.domain,
                    chainId: record.chainId,
                    error: burnedCheckError,
                  },
                );
                return false;
              });

              if (burnedAfterFailure) {
                await recordNftBurn({
                  trackingRecordId: record.id,
                  domain: record.domain,
                  chainId: record.chainId,
                  alreadyBurned: true,
                });
                nftsBurned++;
                workflow.log.info(
                  'Burn failed but NFT is already gone on-chain; recorded as already burned',
                  {
                    domain: record.domain,
                    chainId: record.chainId,
                    error: burnError,
                  },
                );
                continue;
              }

              nftBurnsFailed++;
              await recordNftBurn({
                trackingRecordId: record.id,
                domain: record.domain,
                chainId: record.chainId,
                error: String(burnError),
              });
              workflow.log.error('Failed to burn NFT', {
                domain: record.domain,
                chainId: record.chainId,
                error: burnError,
              });
            }
          }
        } catch (eligibilityError) {
          workflow.log.error('Failed to check burn eligibility', {
            domain: record.domain,
            error: eligibilityError,
          });
        }
      }

      workflow.log.info('Completed burn eligibility processing', {
        burned: nftsBurned,
        failed: nftBurnsFailed,
      });
    }

    // Step 6: Generate and send report
    workflow.log.info('Generating export tracking report');
    const reportMetrics = await collectExportTrackingMetrics();

    workflow.log.info('Sending export tracking report email', {
      totalTracked: reportMetrics.totalTracked,
    });

    await sendExportTrackingReportEmail(reportMetrics);

    workflow.log.info('Export tracking report sent successfully');

    const output: DomainExportTrackingWorkflowOutput = {
      lockedNftsFound: lockedNfts.length,
      domainsProcessed:
        created + updated + skipped + noSignal + undetermined + noChange,
      created,
      updated,
      skipped,
      noSignal,
      undetermined,
      noChange,
      pendingTransfersChecked: pendingTransfers.length,
      transfersCompleted,
      transfersFailed,
      nftsBurned,
      nftBurnsFailed,
      pendingExportEmailsSent,
      failedExportEmailsSent,
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
