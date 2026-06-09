import * as workflow from '@temporalio/workflow';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { NamefiFeedAutoScanSource } from '../../services/namefi-feed/ingestion.service';
import { longRunningOpts, TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { generateNamefiFeedListingLogosWorkflow } from './namefi-feed-listing-logo.workflow';

export type NamefiFeedIngestionWorkflowInput =
  | {
      trigger: 'scheduled';
      requestedByUserId?: string | null;
      sources?: NamefiFeedAutoScanSource[];
    }
  | {
      trigger: 'manual';
      requestedByUserId?: string | null;
      sources?: NamefiFeedAutoScanSource[];
      tweets?: string[];
      includeReplies?: boolean;
      ignoreAutoScanEnabled?: boolean;
    };

export type NamefiFeedIngestionWorkflowResult = {
  runId: string;
  status: 'completed' | 'skipped';
};

const MAX_PROCESS_BATCHES = 200;

const {
  startNamefiFeedIngestionRun,
  scanNamefiFeedXPosts,
  scanNamefiFeedAutoPosts,
  ingestManualNamefiFeedPosts,
  processNamefiFeedPosts,
  completeNamefiFeedRun,
  failNamefiFeedRun,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...longRunningOpts,
    startToCloseTimeout: '30 minutes',
  },
});

export async function namefiFeedIngestionWorkflow(
  input: NamefiFeedIngestionWorkflowInput,
): Promise<NamefiFeedIngestionWorkflowResult> {
  const workflowId = workflow.workflowInfo().workflowId;
  let runId: string | null = null;

  try {
    const run = await startNamefiFeedIngestionRun({
      workflowId,
      trigger: input.trigger,
      requestedByUserId: input.requestedByUserId,
    });
    runId = run.runId;

    const isXOnlyScan = input.sources?.length === 1 && input.sources[0] === 'x';
    const enqueueResult =
      input.trigger === 'manual' && (input.tweets?.length ?? 0) > 0
        ? await ingestManualNamefiFeedPosts({
            runId,
            tweets: input.tweets ?? [],
            includeReplies: input.includeReplies,
          })
        : isXOnlyScan
          ? await scanNamefiFeedXPosts({
              runId,
              ignoreAutoScanEnabled:
                input.trigger === 'manual'
                  ? input.ignoreAutoScanEnabled
                  : false,
            })
          : await scanNamefiFeedAutoPosts({
              runId,
              sources: input.sources,
              ignoreAutoScanEnabled:
                input.trigger === 'manual'
                  ? input.ignoreAutoScanEnabled
                  : false,
            });

    if ('skipped' in enqueueResult && enqueueResult.skipped) {
      await completeNamefiFeedRun({
        runId,
        status: 'skipped',
        metadata: { enqueueResult },
      });
      return { runId, status: 'skipped' };
    }

    const processResult = {
      processedPostCount: 0,
      listingUpsertedCount: 0,
      logoCandidateDomains: [] as NamefiNormalizedDomain[],
      skippedPostCount: 0,
      failedPostCount: 0,
      remainingPostCount: 0,
      batches: 0,
    };

    for (
      let batchIndex = 0;
      batchIndex < MAX_PROCESS_BATCHES;
      batchIndex += 1
    ) {
      const batch = await processNamefiFeedPosts({ runId });
      processResult.batches += 1;
      processResult.processedPostCount += batch.processedPostCount;
      processResult.listingUpsertedCount += batch.listingUpsertedCount;
      for (const domain of batch.logoCandidateDomains ?? []) {
        if (!processResult.logoCandidateDomains.includes(domain)) {
          processResult.logoCandidateDomains.push(domain);
        }
      }
      processResult.skippedPostCount += batch.skippedPostCount;
      processResult.failedPostCount += batch.failedPostCount;
      processResult.remainingPostCount = batch.remainingPostCount;

      const changedPostCount =
        batch.processedPostCount +
        batch.skippedPostCount +
        batch.failedPostCount;
      if (batch.remainingPostCount === 0 || changedPostCount === 0) {
        break;
      }
    }

    if (processResult.remainingPostCount > 0) {
      throw new Error(
        `Namefi feed ingestion left ${processResult.remainingPostCount} pending posts after ${processResult.batches} batches.`,
      );
    }

    const completedRunId = runId;
    if (
      completedRunId &&
      workflow.patched('namefi-feed-listing-logo-generation-v1') &&
      processResult.logoCandidateDomains.length > 0
    ) {
      await catchAndAlertLocally(
        async () => {
          await workflow.startChild(generateNamefiFeedListingLogosWorkflow, {
            args: [
              {
                domains: processResult.logoCandidateDomains,
                batchId: completedRunId,
              },
            ],
            workflowId: `namefi-feed-listing-logo-generation-[${completedRunId}]`,
            taskQueue: TEMPORAL_QUEUES.DEFAULT,
            retry: { maximumAttempts: 1 },
            parentClosePolicy: 'ABANDON',
          });
        },
        {
          message: `Failed to start Namefi feed listing logo generation for run ${completedRunId}`,
          details: {
            runId: completedRunId,
            domains: processResult.logoCandidateDomains,
          },
        },
      );
    }

    await completeNamefiFeedRun({
      runId,
      status: 'completed',
      metadata: {
        enqueueResult,
        processResult,
      },
    });
    return { runId, status: 'completed' };
  } catch (error) {
    if (runId) {
      try {
        await failNamefiFeedRun({
          runId,
          errorMessage: describeWorkflowError(error),
        });
      } catch (failureRecordError) {
        workflow.log.warn('Failed to record Namefi feed ingestion failure', {
          errorMessage: describeWorkflowError(failureRecordError),
        });
      }
    }
    throw error;
  }
}

function describeWorkflowError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Namefi feed ingestion failed.';
}
