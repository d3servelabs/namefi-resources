import * as workflow from '@temporalio/workflow';
import { longRunningOpts } from '../../shared/commonRunningOptions';
import { TEMPORAL_ENUMS } from '../../shared/enums';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';

type BackfillResult = {
  processed: number;
  updated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
};

export async function linkSharesExternalIdentifierMigrationWorkflow({
  batchSize = 100,
  maxBatches,
  pauseBetweenBatchesMs = 2000,
}: {
  batchSize?: number;
  maxBatches?: number;
  pauseBetweenBatchesMs?: number;
} = {}): Promise<BackfillResult> {
  const {
    getLinkSharesMissingExternalIdentifier,
    resolveExternalIdentifierFromTweet,
    updateLinkShareExternalIdentifier,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...longRunningOpts,
    },
  });

  const result: BackfillResult = {
    processed: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  let batchCount = 0;
  while (true) {
    if (typeof maxBatches === 'number' && batchCount >= maxBatches) break;
    batchCount++;

    const items = await getLinkSharesMissingExternalIdentifier(batchSize);
    if (items.length === 0) break;

    workflow.log.info('Link shares external identifier migration batch', {
      batch: batchCount,
      count: items.length,
    });

    for (const item of items) {
      result.processed++;
      try {
        const resolved = await resolveExternalIdentifierFromTweet(item.postUrl);
        if (!resolved.success || !resolved.externalIdentifier) {
          result.failed++;
          result.errors.push({
            id: item.id,
            error: resolved.error || 'Unknown',
          });
          continue;
        }
        const update = await updateLinkShareExternalIdentifier(
          item.id,
          resolved.externalIdentifier,
        );
        if (update.success) result.updated++;
        else {
          result.failed++;
          result.errors.push({ id: item.id, error: 'DB update failed' });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({
          id: item.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    if (pauseBetweenBatchesMs > 0) {
      await workflow.sleep(pauseBetweenBatchesMs);
    }
  }

  return result;
}
