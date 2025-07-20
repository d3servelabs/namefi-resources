import { ApplicationFailure } from '@temporalio/workflow';
import type { SendMailInput } from '../../mail/mail-client';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export enum NotificationChannel {
  EMAIL = 'email',
}

export type NotifyUserWorkflowInput = {
  userId: string;
  channel: NotificationChannel.EMAIL;
  payload: Pick<SendMailInput, 'subject' | 'content'>;
};

export const notifyUserWorkflow = async (input: NotifyUserWorkflowInput) => {
  const { userId, channel } = input;
  const { sendEmailOrThrow, getUserEmailOrThrow } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: {
      ...shortRunningOpts,
    },
  });

  try {
    if (channel === NotificationChannel.EMAIL) {
      const { subject, content } = input.payload;
      const userEmail = await getUserEmailOrThrow(userId);

      await sendEmailOrThrow({
        to: [userEmail],
        subject,
        content,
      });
    } else {
      throw new Error(`Unsupported notification channel: ${channel}`);
    }
  } catch (error) {
    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Failed to notify user ${userId}`,
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
};
