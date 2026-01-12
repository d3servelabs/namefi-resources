import * as EmailSubscriptionSyncActivities from './email-subscription-sync.activities';
import * as CampaignCandidateCollectionActivities from './campaign-candidate-collection.activities';
import * as CampaignAutoGrantClaimsActivities from './campaign-grant-claims.activities';
import { config, secrets } from '#lib/env';
import { logger } from '#lib/logger';
import { db } from '@namefi-astra/db';
import { updateNamefiNftIndex } from '../mint/namefi-nft';
import { triggerNamefiGptCronJob } from './triggerNamefiGptCronJob';
import { triggerUpdateNamefiNftIndex } from '../../schedules/update-namefi-nft-index';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';
import { getTemporalWorkflowRunUrl } from './get-workflow-url';
import { Context } from '@temporalio/activity';

export const defaultTaskQueueActivities = {
  ...EmailSubscriptionSyncActivities,
  ...CampaignCandidateCollectionActivities,
  ...CampaignAutoGrantClaimsActivities,
  getNamefiUsers: async () => {
    const users = await db.query.usersTable.findMany();
    return users;
  },
  generalAlertNamefi: async (
    args: { title: string; extraData: any; message: string } & any,
  ) => {
    logger.error(
      {
        context: '[Temporal] generalAlertNamefi',
        ...args,
      },
      'generalAlertNamefi',
    );
  },
  criticalAlertNamefi: async (
    args: { title: string; extraData: any; message: string } & any,
  ) => {
    logger.fatal(
      {
        context: '[Temporal] criticalAlertNamefi',
        ...args,
      },
      'criticalAlertNamefi',
    );

    try {
      await sendTemporalAlertToSlack(args);
    } catch (error) {
      logger.error(
        {
          context: '[Temporal] criticalAlertNamefi',
          error,
        },
        'sendTemporalAlertToSlack failed',
      );
    }
  },
  getConfig: async (key: keyof typeof config) => config[key],
  updateNamefiNftIndex,
  triggerUpdateNamefiNftIndex,
  triggerNamefiGptCronJob,
  addCategoriesToDomainsWithNoCategories,
  getTemporalWorkflowRunUrl,
};

export async function sendTemporalAlertToSlack(
  args: { title: string; extraData: any; message: string } & any,
): Promise<void> {
  const { title, extraData, message, ...rest } = args;
  const ctx = Context.current();

  const webhookUrl = secrets.NAMEFI_ALERT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    ctx.log.warn('No Slack webhook URL configured, skipping Slack Alert');
    return;
  }

  const { workflowId, runId } = ctx.info.workflowExecution;
  const workflowType = ctx.info.workflowType;
  const taskQueue = ctx.info.taskQueue;

  try {
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `[Temporal] ${title}`,
            emoji: true,
          },
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🔴 Triggered, Workflow Failed (Type: ${workflowType}, Id: ${workflowId})`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Message: ${message}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Workflow:* ${workflowType}`,
            },

            {
              type: 'mrkdwn',
              text: `*WorkflowId:* ${workflowId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Run:* ${runId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Task Queue:* ${taskQueue}`,
            },
            ...(!!extraData && typeof extraData === 'object'
              ? Object.entries(extraData).map(([key, value]) => ({
                  type: 'mrkdwn',
                  text: `*${key}:*\n${value}`,
                }))
              : []),
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Go To Workflows',
              },
              url: await getTemporalWorkflowRunUrl(workflowId, runId),
              style: 'primary',
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to send alert to Slack');
    throw error;
  }
}
