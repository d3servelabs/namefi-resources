import * as EmailSubscriptionSyncActivities from './email-subscription-sync.activities';
import * as CampaignCandidateCollectionActivities from './campaign-candidate-collection.activities';
import * as CampaignAutoGrantClaimsActivities from './campaign-grant-claims.activities';
import * as EmailCampaignActivities from './email-campaigns.activities';
import { config, secrets } from '#lib/env';
import * as X402Activities from '../x402.activities';
import { logger } from '#lib/logger';
import { db } from '@namefi-astra/db';
import { updateNamefiNftIndex } from '../mint/namefi-nft';
import { triggerNamefiGptCronJob } from './triggerNamefiGptCronJob';
import { triggerUpdateNamefiNftIndex } from '../../schedules/update-namefi-nft-index';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';
import { getTemporalWorkflowRunUrl } from './get-workflow-url';
import { Context } from '@temporalio/activity';
import { triggerSyncPonderIndex } from '#temporal/schedules/sync-ponder-index';
import * as ChainConfigs from '#lib/env/allowed-chains';
import { mapObjIndexed } from 'ramda';
import { createClickUpTask, getClickUpTask } from '#lib/clickup/index';
import { temporalClient } from '#temporal/client';
import type { monitorIncidentTicketWorkflow } from '../../workflows/monitor-incident-ticket.workflow';

type AsyncReturningFunction<A extends any[], R> = (...args: A) => Promise<R>;
type ReturningFunction<A extends any[], R> = (...args: A) => Promise<R> | R;
type AsyncifyReturningFunction<F extends ReturningFunction<any, any>> =
  AsyncReturningFunction<Parameters<F>, Awaited<ReturnType<F>>>;

function convertSyncFnToActivity<
  A extends any[],
  R,
  F extends ReturningFunction<A, R>,
>(fn: F): AsyncReturningFunction<A, R> {
  return async (...args: A) => fn(...args);
}
const mapConvertSyncFnToActivity = mapObjIndexed(convertSyncFnToActivity) as <
  O extends Record<any, ReturningFunction<any, any>>,
>(
  obj: O,
) => { [k in keyof O]: AsyncifyReturningFunction<O[k]> };

export const defaultTaskQueueActivities = {
  ...EmailSubscriptionSyncActivities,
  ...CampaignCandidateCollectionActivities,
  ...CampaignAutoGrantClaimsActivities,
  ...EmailCampaignActivities,
  ...X402Activities,
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
    options?: SendTemporalAlertOptions,
  ): Promise<SendTemporalAlertResult> => {
    logger.fatal(
      {
        context: '[Temporal] criticalAlertNamefi',
        ...args,
      },
      'criticalAlertNamefi',
    );

    try {
      return await sendTemporalAlertToSlack(args, options);
    } catch (error) {
      logger.error(
        {
          context: '[Temporal] criticalAlertNamefi',
          error,
        },
        'sendTemporalAlertToSlack failed',
      );
      return { ticket: null, monitoringStarted: false };
    }
  },
  getConfig: async <K extends keyof typeof config>(key: K) => config[key],
  updateNamefiNftIndex,
  triggerUpdateNamefiNftIndex,
  triggerSyncPonderIndex,
  triggerNamefiGptCronJob,
  addCategoriesToDomainsWithNoCategories,
  getTemporalWorkflowRunUrl,
  ...mapConvertSyncFnToActivity(ChainConfigs),
  createIncidentTicket,
  getIncidentTicketStatus,
  sendIncidentEscalationToSlack,
};

export interface SendTemporalAlertOptions {
  /** Create a ClickUp incident ticket alongside the Slack alert. Defaults to true. */
  createIncident?: boolean;
  /** Start a monitoring workflow that polls the ticket and re-alerts. Defaults to true. Ignored if createIncident is false. */
  monitorIncident?: boolean;
  /** ClickUp ticket priority: 1=Urgent, 2=High, 3=Normal, 4=Low. Defaults to 1 (Urgent). */
  incidentPriority?: 1 | 2 | 3 | 4;
}

export interface SendTemporalAlertResult {
  /** ClickUp ticket info, or null if ticket was not created */
  ticket: { taskId: string; taskUrl: string } | null;
  /** Whether a monitoring workflow was started */
  monitoringStarted: boolean;
}

export async function sendTemporalAlertToSlack(
  args: { title: string; extraData: any; message: string } & any,
  options?: SendTemporalAlertOptions,
): Promise<SendTemporalAlertResult> {
  const { title, extraData, message, ...rest } = args;
  const ctx = Context.current();
  const shouldCreateIncident = options?.createIncident ?? true;
  const shouldMonitor = options?.monitorIncident ?? true;

  const { workflowId, runId } = ctx.info.workflowExecution;
  const workflowType = ctx.info.workflowType;
  const taskQueue = ctx.info.taskQueue;

  // Create ClickUp incident ticket first so we can include it in the Slack message
  let ticket: { taskId: string; taskUrl: string } | null = null;
  if (shouldCreateIncident) {
    try {
      ticket = await createIncidentTicket({
        title,
        message,
        extraData,
        priority: options?.incidentPriority,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to create ClickUp incident ticket');
    }
  }

  // Send Slack alert with ticket link if available
  const webhookUrl = secrets.NAMEFI_ALERT_SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const actionButtons: Array<Record<string, unknown>> = [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Go To Workflows',
          },
          url: await getTemporalWorkflowRunUrl(workflowId, runId),
          style: 'primary',
        },
      ];

      if (ticket) {
        actionButtons.push({
          type: 'button',
          text: {
            type: 'plain_text',
            text: `View Ticket (${ticket.taskId})`,
          },
          url: ticket.taskUrl,
        });
      }

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
          ...(ticket
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Incident Ticket:* <${ticket.taskUrl}|${ticket.taskId}>`,
                  },
                },
              ]
            : []),
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
            elements: actionButtons,
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
    }
  } else {
    ctx.log.warn('No Slack webhook URL configured, skipping Slack Alert');
  }

  // Start monitoring workflow if ticket was created and monitoring is enabled
  let monitoringStarted = false;
  if (shouldMonitor && ticket) {
    try {
      await temporalClient.workflow.start<typeof monitorIncidentTicketWorkflow>(
        'monitorIncidentTicketWorkflow',
        {
          args: [
            {
              taskId: ticket.taskId,
              taskUrl: ticket.taskUrl,
              originalAlert: { title, message, extraData },
            },
          ],
          workflowId: `monitor-incident-[${ticket.taskId}]-[${Date.now()}]`,
          workflowRunTimeout: '7 days',
          taskQueue: 'default_task_queue',
        },
      );
      monitoringStarted = true;
    } catch (error) {
      logger.error({ error }, 'Failed to start incident monitoring workflow');
    }
  }

  return { ticket, monitoringStarted };
}

async function createIncidentTicket(args: {
  title: string;
  message: string;
  extraData?: any;
  priority?: 1 | 2 | 3 | 4;
}) {
  const token = secrets.CLICKUP_API_TOKEN;
  const listId = secrets.CLICKUP_INCIDENT_LIST_ID;
  const ctx = Context.current();

  if (!token || !listId) {
    ctx.log.warn(
      'ClickUp not configured (missing CLICKUP_API_TOKEN or CLICKUP_INCIDENT_LIST_ID), skipping ticket creation',
    );
    return null;
  }

  const { workflowId, runId } = ctx.info.workflowExecution;
  const workflowType = ctx.info.workflowType;
  const taskQueue = ctx.info.taskQueue;
  const temporalUrl = await getTemporalWorkflowRunUrl(workflowId, runId);

  const extraDataText =
    args.extraData && typeof args.extraData === 'object'
      ? Object.entries(args.extraData)
          .map(([key, value]) => `- **${key}:** ${value}`)
          .join('\n')
      : '';

  const description = [
    '## Incident Alert',
    '',
    `**Message:** ${args.message}`,
    '',
    '### Workflow Details',
    `- **Workflow Type:** ${workflowType}`,
    `- **Workflow ID:** ${workflowId}`,
    `- **Run ID:** ${runId}`,
    `- **Task Queue:** ${taskQueue}`,
    `- **Temporal URL:** ${temporalUrl}`,
    ...(extraDataText ? ['', '### Additional Data', extraDataText] : []),
    '',
    '---',
    '*Auto-created by Namefi Temporal alert system*',
  ].join('\n');

  const result = await createClickUpTask({
    name: `[Incident] ${args.title}`,
    description,
    priority: args.priority ?? 1,
    tags: ['incident', 'auto-created'],
    listId,
    token,
  });

  logger.info(
    { taskId: result.id, taskUrl: result.url },
    'Created ClickUp incident ticket for %s',
    args.title,
  );

  return { taskId: result.id, taskUrl: result.url };
}

async function getIncidentTicketStatus(args: { taskId: string }) {
  const token = secrets.CLICKUP_API_TOKEN;
  if (!token) {
    throw new Error('CLICKUP_API_TOKEN not configured');
  }

  const task = await getClickUpTask({ taskId: args.taskId, token });
  const normalizedStatus = task.status.toLowerCase();

  const ResolvedStatuses = new Set(['closed', 'done', 'resolved', 'complete']);
  const OpenStatuses = new Set(['to do', 'open']);

  return {
    status: task.status,
    assignees: task.assignees,
    isResolved: ResolvedStatuses.has(normalizedStatus),
    isPickedUp:
      task.assignees.length > 0 || !OpenStatuses.has(normalizedStatus),
  };
}

async function sendIncidentEscalationToSlack(args: {
  title: string;
  message: string;
  ticketUrl: string;
  escalationLevel: number;
  hoursOpen: number;
}) {
  const webhookUrl = secrets.NAMEFI_ALERT_SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn('No Slack webhook URL configured, skipping escalation alert');
    return;
  }

  const severityEmoji =
    args.escalationLevel <= 2
      ? ':large_yellow_circle:'
      : args.escalationLevel <= 4
        ? ':orange_circle:'
        : ':red_circle:';

  const slackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${args.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${severityEmoji} ${args.message}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Hours Open:* ${args.hoursOpen}`,
          },
          {
            type: 'mrkdwn',
            text: `*Escalation Level:* ${args.escalationLevel}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View ClickUp Ticket',
            },
            url: args.ticketUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}
