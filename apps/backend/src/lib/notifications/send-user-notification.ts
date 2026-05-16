import { render } from '@react-email/components';
import type {
  NotificationPriority,
  NotificationRelatedResource,
} from '@namefi-astra/common/shared-schemas';
import { createElement } from 'react';
import { createLogger } from '#lib/logger';
import { maybeGetUserEmail } from '#temporal/activities/notify.activities';
import { sendMail } from '../../mail/mail-client';
import { GeneralStyledNotification } from '../../mail/templates/general-styled-notification';
import { createNotification } from './create-notification';

/**
 * Best-effort "notify a user" primitive for non-workflow backend code
 * (synchronous tRPC mutations etc.). Sends the styled email AND writes
 * the in-app inbox row — two independent best-effort lanes, so a failure
 * in one never blocks the other and the function never throws.
 *
 * Temporal workflows should keep using the `sendStyledEmailNotificationForUser`
 * activity instead: it throws on failure so Temporal can retry. This
 * helper is the synchronous-caller counterpart — callers typically
 * `void` it (fire-and-forget) since it can't throw.
 */

const logger = createLogger({ module: 'send-user-notification' });

const NOTIFICATION_EMAIL_BCC = ['customer-email-archive@d3serve.xyz'];

export type SendUserNotificationInput = {
  userId: string;
  title: string;
  /** Email subject — defaults to `title`. */
  subject?: string;
  /** Markdown body, used for both the styled email and the in-app row. */
  messageMarkdown: string;
  /** Whether the email shows the dashboard CTA. Defaults to `true`. */
  showGoToDashboard?: boolean;
  subtitle?: string;
  /** Audibility — see `CreateNotificationInput.priority`. Defaults to `'normal'`. */
  priority?: NotificationPriority;
  relatedResources?: NotificationRelatedResource[];
  /** `metadata.source` label for the in-app row. */
  source?: string;
};

export async function sendUserNotification(
  input: SendUserNotificationInput,
): Promise<{ status: 'SUCCESS' | 'FAILED' }> {
  let emailStatus: 'SUCCESS' | 'FAILED' = 'FAILED';

  // Email lane — best-effort.
  try {
    const userEmail = await maybeGetUserEmail(input.userId);
    if (!userEmail) {
      logger.warn(
        { userId: input.userId },
        'Skipping notification email — no address on file',
      );
    } else {
      const template = createElement(GeneralStyledNotification, {
        title: input.title,
        messageMarkdown: input.messageMarkdown,
        showGoToDashboard: input.showGoToDashboard ?? true,
      });
      const html = await render(template, {
        pretty: false,
        plainText: false,
      });
      const plain = await render(template, {
        pretty: false,
        plainText: true,
      });
      await sendMail({
        to: [userEmail],
        bcc: NOTIFICATION_EMAIL_BCC,
        subject: input.subject ?? input.title,
        content: { html, plain },
      });
      emailStatus = 'SUCCESS';
    }
  } catch (error) {
    logger.warn(
      { error, userId: input.userId },
      'Failed to send notification email',
    );
  }

  // In-app lane — best-effort, independent of the email outcome.
  try {
    await createNotification({
      userId: input.userId,
      title: input.title,
      subtitle: input.subtitle,
      body: input.messageMarkdown,
      bodyType: 'markdown',
      priority: input.priority,
      relatedResources: input.relatedResources ?? [],
      metadata: { source: input.source ?? 'lib:send-user-notification' },
    });
  } catch (error) {
    logger.warn(
      { error, userId: input.userId },
      'Failed to create in-app notification',
    );
  }

  return { status: emailStatus };
}
