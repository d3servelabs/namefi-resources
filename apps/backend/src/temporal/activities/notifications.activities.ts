import type {
  NotificationBodyType,
  NotificationPriority,
} from '@namefi-astra/common/shared-schemas';
import {
  db,
  notificationsTable,
  type NotificationMetadata,
} from '@namefi-astra/db';
import { splitEvery } from 'ramda';
import {
  createNotification,
  type CreateNotificationInput,
  type NotificationRow,
} from '#lib/notifications/create-notification';

/**
 * Temporal activity wrappers for in-app notifications.
 *
 * Workflows that want to surface a UI event call these via
 * `typedProxyActivities({ temporalEnum: TEMPORAL_ENUMS.NOTIFY })`. The
 * wrappers exist (rather than calling `createNotification` directly from
 * a workflow) because workflows can't touch the database — every DB
 * write must go through an activity.
 */

export async function createInAppNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow> {
  return createNotification(input);
}

/**
 * Fetch every user id, for a system-wide notification broadcast. Mirrors
 * the load-all-users pattern in the autorenew daily workflow — the user
 * table is small enough to materialize fully; no cursor pagination.
 */
export async function listAllUserIdsForBroadcast(): Promise<string[]> {
  const rows = await db.query.usersTable.findMany({
    columns: { id: true },
  });
  return rows.map((row) => row.id);
}

const BULK_INSERT_CHUNK_SIZE = 500;

export type CreateInAppNotificationsBulkInput = {
  userIds: string[];
  title: string;
  subtitle?: string | null;
  body: string;
  bodyType?: NotificationBodyType;
  /** Defaults to `'normal'` if omitted. See `CreateNotificationInput.priority`. */
  priority?: NotificationPriority;
  /** `metadata.source` label written on every row in the batch. */
  source: string;
};

/**
 * Insert the same notification for many users, chunked. Used by the
 * broadcast workflow.
 *
 * Deliberately does NOT invalidate the per-user Redis unread-count cache
 * — that would be thousands of DELs per broadcast. The 60s cache TTL
 * plus the bell's 10s poll let counts self-heal, which is an acceptable
 * lag for a broadcast.
 */
export async function createInAppNotificationsBulk(
  input: CreateInAppNotificationsBulkInput,
): Promise<{ created: number }> {
  const metadata: NotificationMetadata = { source: input.source };
  const priority = input.priority ?? 'normal';
  const rows = input.userIds.map((userId) => ({
    userId,
    title: input.title,
    subtitle: input.subtitle ?? null,
    body: input.body,
    bodyType: input.bodyType ?? 'plain',
    priority,
    relatedResources: [],
    metadata,
  }));

  let created = 0;
  for (const chunk of splitEvery(BULK_INSERT_CHUNK_SIZE, rows)) {
    const inserted = await db
      .insert(notificationsTable)
      .values(chunk)
      .returning({ id: notificationsTable.id });
    created += inserted.length;
  }
  return { created };
}
