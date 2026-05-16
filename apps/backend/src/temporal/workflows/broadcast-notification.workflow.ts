import type {
  NotificationBodyType,
  NotificationPriority,
} from '@namefi-astra/common/shared-schemas';
import * as workflow from '@temporalio/workflow';
import pMap from 'p-map';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface BroadcastNotificationWorkflowInput {
  title: string;
  subtitle?: string;
  body: string;
  bodyType?: NotificationBodyType;
  /** Defaults to `'normal'` if omitted. */
  priority?: NotificationPriority;
  /** `metadata.source` label written on every row in the broadcast. */
  source: string;
}

/** Users per bulk-insert activity call. */
const USER_BATCH_SIZE = 500;
/** Bulk-insert activities run in parallel up to this many at a time. */
const BATCH_CONCURRENCY = 3;

/**
 * Fan out a single in-app notification to every user. Loads all user
 * ids, chunks them, and runs chunked bulk inserts in parallel.
 *
 * A failed chunk is counted, not fatal — the rest of the broadcast still
 * lands. Started fire-and-forget by `admin.notifications.adminBroadcast`.
 */
export async function broadcastNotificationWorkflow(
  input: BroadcastNotificationWorkflowInput,
): Promise<{ created: number; failed: number }> {
  const { listAllUserIdsForBroadcast, createInAppNotificationsBulk } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.NOTIFY,
      options: {
        ...shortRunningOpts,
        startToCloseTimeout: '2 minutes',
        // The bulk insert is not naturally idempotent — `notificationsTable`
        // rows get fresh random UUIDs on every activity attempt and there's
        // no unique constraint to collide on. If we let Temporal retry an
        // activity that partially succeeded (say, chunks 1–2 inserted, then
        // the activity timed out before returning), the retry would
        // re-insert those chunks and users would see the same notification
        // twice. Cap attempts at 1 so chunk failures stay at-most-once;
        // the per-batch try/catch below already treats a failed chunk as
        // non-fatal, surfacing it in the workflow's `failed` count.
        retry: { maximumAttempts: 1 },
      },
    });

  const userIds = await listAllUserIdsForBroadcast();

  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += USER_BATCH_SIZE) {
    batches.push(userIds.slice(i, i + USER_BATCH_SIZE));
  }

  const perBatch = await pMap(
    batches,
    async (batch) => {
      try {
        const { created } = await createInAppNotificationsBulk({
          userIds: batch,
          title: input.title,
          subtitle: input.subtitle,
          body: input.body,
          bodyType: input.bodyType,
          priority: input.priority,
          source: input.source,
        });
        return { created, attempted: batch.length };
      } catch (error) {
        // Best-effort per chunk — a failed batch is counted, not fatal,
        // so one bad chunk doesn't sink the whole broadcast. Log so an
        // operator can diagnose systematic issues (DB outage, activity
        // misconfig, auth) without having to correlate the empty
        // `failed` delta with worker logs.
        workflow.log.error('Broadcast batch failed', {
          batchSize: batch.length,
          source: input.source,
          title: input.title,
          error: error instanceof Error ? error.message : String(error),
        });
        return { created: 0, attempted: batch.length };
      }
    },
    { concurrency: BATCH_CONCURRENCY },
  );

  const created = perBatch.reduce((sum, batch) => sum + batch.created, 0);
  const attempted = perBatch.reduce((sum, batch) => sum + batch.attempted, 0);
  return { created, failed: attempted - created };
}

/**
 * Each broadcast is a unique one-shot — key the id on the start time.
 * Called caller-side (the tRPC handler), so `Date.now()` is fine here.
 */
broadcastNotificationWorkflow.generateId = (): string => {
  return `broadcast-notification-[${Date.now()}]`;
};
