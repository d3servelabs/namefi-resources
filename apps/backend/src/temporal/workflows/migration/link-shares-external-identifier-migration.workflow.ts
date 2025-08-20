import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS } from '../../shared/enums';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';

type BackfillResult = {
  processed: number;
  updated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
};

export async function linkSharesExternalIdentifierMigrationWorkflow(): Promise<BackfillResult> {
  const {
    getAllTwitterLinkShares,
    resolveExternalIdentifierFromTweet,
    updateLinkShareExternalIdentifier,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '1 hour',
      retry: { maximumAttempts: 1 },
    },
  });

  const result: BackfillResult = {
    processed: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  // Read entire set once and process without retries
  const items = await getAllTwitterLinkShares();
  if (items.length === 0) return result;

  workflow.log.info('Link shares external identifier migration', {
    count: items.length,
  });

  for (const item of items) {
    result.processed++;
    try {
      const resolved = await resolveExternalIdentifierFromTweet(item.postUrl);
      if (!resolved.success || !resolved.externalIdentifier) {
        result.failed++;
        result.errors.push({ id: item.id, error: resolved.error || 'Unknown' });
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

  return result;
}
