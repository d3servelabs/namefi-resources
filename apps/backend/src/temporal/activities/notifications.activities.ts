import {
  createNotification,
  type CreateNotificationInput,
  type NotificationRow,
} from '#lib/notifications/create-notification';

/**
 * Temporal activity wrappers for in-app notifications.
 *
 * Workflows that want to surface a UI event call this via
 * `typedProxyActivities({ temporalEnum: TEMPORAL_ENUMS.NOTIFY })`. The
 * wrapper exists (rather than calling `createNotification` directly from
 * a workflow) because workflows can't touch the database — every DB write
 * must go through an activity.
 */

export async function createInAppNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow> {
  return createNotification(input);
}
