import { createLogger } from '#lib/logger';
import {
  createNotification,
  type CreateNotificationInput,
  type NotificationRow,
} from './create-notification';

/**
 * Best-effort in-app notification write.
 *
 * Used by email-sending temporal activities: after the email has gone
 * out, drop a row in the inbox table. If that write fails (DB blip,
 * Redis down, etc.) we log a warning and move on — the email is the
 * source of truth, the in-app row is a UX nicety and must never fail
 * the parent activity.
 */
const logger = createLogger({ module: 'try-create-notification' });

export async function tryCreateInAppNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow | null> {
  try {
    return await createNotification(input);
  } catch (error) {
    logger.warn(
      { error, userId: input.userId, source: input.metadata?.source },
      'failed to create in-app notification; email path already completed',
    );
    return null;
  }
}
