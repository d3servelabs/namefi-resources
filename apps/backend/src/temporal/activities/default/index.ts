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
import { parseDomainName } from '@namefi-astra/utils';
import { getExecutionContext } from '#lib/execution-context/context';
import type { ExecutionContext } from '#lib/execution-context/types';
// Read-only tx confirmation pollers for the staggered-send race. These run on
// the DEFAULT queue so confirmation polling is never blocked by the single MINT
// activity slot.
import { getTransactionConfirmation } from '../mint/mint-tx.activities';
import { getX402TransactionConfirmation } from '../x402-tx.activities';
import { checkNonceAlreadySent } from './nonce-collision.activities';
import {
  acquireNonceLock,
  extendNonceLock,
  releaseNonceLock,
} from './nonce-lock.activities';

const SLACK_TEXT_LIMIT = 3000;
const SLACK_FIELD_LIMIT = 1800;
const SLACK_SECTION_FIELD_LIMIT = 10;

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
  sendOutboundWorkflowFailureAlertToSlack,
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
  ...mapConvertSyncFnToActivity({ parseDomainName }),
  // Read-only confirmation pollers for the pinned-nonce staggered-send race.
  getTransactionConfirmation,
  getX402TransactionConfirmation,
  // Read-only pre-re-pin "did we already send this?" collision check.
  checkNonceAlreadySent,
  // Distributed signer-nonce lock (acquire/heartbeat-extend/release).
  acquireNonceLock,
  extendNonceLock,
  releaseNonceLock,
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

export interface SendOutboundWorkflowFailureAlertToSlackInput {
  title: string;
  message: string;
  extraData?: Record<string, unknown>;
}

export async function sendOutboundWorkflowFailureAlertToSlack(
  input: SendOutboundWorkflowFailureAlertToSlackInput,
): Promise<void> {
  const webhookUrl = secrets.NAMEFI_JUSTAING_ALERT_SLACK_WEBHOOK_URL;
  const ctx = Context.current();

  if (!webhookUrl) {
    ctx.log.warn(
      'No Justaing Slack webhook URL configured, skipping outbound failure alert',
    );
    return;
  }

  const { workflowId, runId } = ctx.info.workflowExecution;
  const workflowType = ctx.info.workflowType;
  const taskQueue = ctx.info.taskQueue;
  const temporalUrl = await getTemporalWorkflowRunUrl(workflowId, runId);
  const fields = [
    { key: 'Workflow', value: workflowType },
    { key: 'WorkflowId', value: workflowId },
    { key: 'Run', value: runId },
    { key: 'Task Queue', value: taskQueue },
    ...Object.entries(input.extraData ?? {}).map(([key, value]) => ({
      key,
      value,
    })),
  ];

  const fieldSections = chunkArray(
    fields.map(({ key, value }) => ({
      type: 'mrkdwn',
      text: `*${key}:*\n${formatSlackValue(value)}`,
    })),
    SLACK_SECTION_FIELD_LIMIT,
  ).map((sectionFields) => ({
    type: 'section',
    fields: sectionFields,
  }));

  const slackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: truncateSlackText(`[Outbound] ${input.title}`, 150),
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${truncateSlackText(input.message, SLACK_TEXT_LIMIT)}`,
        },
      },
      ...fieldSections,
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Go To Workflow',
            },
            url: temporalUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };

  try {
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
    logger.error({ error }, 'Failed to send outbound failure alert to Slack');
  }
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

  const resolvedTitle = resolveIncidentTitle({
    title,
    message,
    workflowType,
    workflowId,
  });

  // Create ClickUp incident ticket first so we can include it in the Slack message
  let ticket: { taskId: string; taskUrl: string } | null = null;
  if (shouldCreateIncident) {
    try {
      ticket = await createIncidentTicket({
        title: resolvedTitle,
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
              text: `[Temporal] ${resolvedTitle}`,
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
              ...(extraData && typeof extraData === 'object'
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
              originalAlert: { title: resolvedTitle, message, extraData },
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

function formatSlackValue(value: unknown) {
  if (value == null) {
    return 'not provided';
  }

  if (typeof value === 'string') {
    return truncateSlackText(value, SLACK_FIELD_LIMIT);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return truncateSlackText(JSON.stringify(value), SLACK_FIELD_LIMIT);
}

function truncateSlackText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 24)}... [truncated]`;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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

  const resolvedTitle = resolveIncidentTitle({
    title: args.title,
    message: args.message,
    workflowType,
    workflowId,
  });

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
    name: `[Incident] ${resolvedTitle}`,
    description,
    priority: args.priority ?? 1,
    tags: ['incident', 'auto-created'],
    listId,
    token,
  });

  logger.info(
    { taskId: result.id, taskUrl: result.url },
    'Created ClickUp incident ticket for %s',
    resolvedTitle,
  );

  return { taskId: result.id, taskUrl: result.url };
}

function resolveIncidentTitle(input: {
  title?: unknown;
  message?: unknown;
  workflowType?: string;
  workflowId?: string;
}): string {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title && title.toLowerCase() !== 'undefined') {
    return title;
  }

  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message) {
    const firstLine = message.split('\n')[0]?.trim() ?? '';
    const snippet =
      firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
    if (snippet) {
      return input.workflowType
        ? `${input.workflowType} failed: ${snippet}`
        : snippet;
    }
  }

  if (input.workflowType && input.workflowId) {
    return `${input.workflowType} failed (${input.workflowId})`;
  }
  if (input.workflowType) {
    return `${input.workflowType} failed`;
  }
  if (input.workflowId) {
    return `Workflow failed (${input.workflowId})`;
  }
  return 'Unknown workflow failure';
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

/**
 * Alert when a 400 or 5XX HTTP response is returned to a user from Hono or
 * tRPC. Resolves the active execution context (user/session/request) and hands
 * the error + context off to {@link sendHttpAlertToSlack}.
 *
 * Only 400 and 5XX codes are alerted; other codes (e.g. 401/403/404 from
 * expected user actions) are ignored.
 */
export async function sendHttpAlert(
  code: number,
  error?: unknown,
  message?: string,
  routeInfo?: ExecutionContext['route'],
  extraData?: Record<string, unknown>,
): Promise<void> {
  if (code !== 400 && code < 500) {
    return;
  }

  let executionContext: ExecutionContext | undefined;
  try {
    executionContext = getExecutionContext();
  } catch {
    // No execution context available outside the request lifecycle.
  }

  // Merge the caller-provided route into the execution context so the alert
  // renders a single coherent context object (userInfo + routeInfo).
  const resolvedContext: ExecutionContext = {
    type: executionContext?.type ?? 'unknown',
    ...executionContext,
    route: {
      ...executionContext?.route,
      ...routeInfo,
      requestId: routeInfo?.requestId ?? executionContext?.user?.requestId,
      statusCode: code,
    },
  };

  const user = resolvedContext.user;
  const requestId = user?.requestId ?? resolvedContext?.route;
  const userTxt = user?.userId ? `[User:${user.userId}]` : '';
  const sessionTxt = user?.sessionId ? `[Session:${user.sessionId}]` : '';
  const requestTxt = user?.requestId ? `[Request:${user.requestId}]` : '';

  const resolvedMessage =
    message ?? (error instanceof Error ? error.message : undefined);

  await sendHttpAlertToSlack({
    title: `${userTxt}${sessionTxt}${requestTxt} User received a ${code}`,
    message: resolvedMessage,
    error,
    executionContext: resolvedContext,
    extraData,
  });
}

export interface SendHttpAlertToSlackInput {
  /** Short headline for the alert. */
  title: string;
  /** Human-readable message; falls back to the error message upstream. */
  message?: string;
  /** The raw error that produced the HTTP response, if any. */
  error?: unknown;
  /** Resolved execution context for the failing request, if available. */
  executionContext?: ExecutionContext;
  /** Any additional structured data to surface in the alert. */
  extraData?: Record<string, unknown>;
}

/**
 * Send an HTTP error alert to the API Slack channel.
 *
 * Unlike {@link sendTemporalAlertToSlack}, this runs from the Hono/tRPC server
 * process — outside any Temporal worker — so it must NOT touch
 * `Context.current()`, create ClickUp incidents, or start monitoring workflows.
 * It surfaces the error details and execution context for debugging, plus a
 * Datadog Logs link scoped to the request id.
 */
export async function sendHttpAlertToSlack(
  input: SendHttpAlertToSlackInput,
): Promise<void> {
  const { title, message, error, executionContext, extraData } = input;

  const webhookUrl = secrets.NAMEFI_API_HTTP_ALERT_SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn('No API Slack webhook URL configured, skipping HTTP alert');
    return;
  }

  const user = executionContext?.user;
  const route = executionContext?.route;
  const errorDetails = formatErrorForSlack(error);
  const datadogUrl = user?.requestId
    ? buildDatadogLogsUrlByRequestId(user.requestId)
    : null;

  const userInfoSection = buildInfoSection('User Info', [
    ['User ID', user?.userId],
    ['Privy User ID', user?.privyUserId],
    ['Session ID', user?.sessionId],
    ['Request ID', user?.requestId],
  ]);

  const routeInfoSection = buildInfoSection('Route Info', [
    ['Source', route?.source],
    ['Method', route?.method],
    ['Path', route?.path],
    ['URL', route?.url],
    ['Request ID', route?.requestId],
    ['Procedure Type', route?.procedureType],
    ['Status', route?.statusCode],
    ['Context Type', executionContext?.type],
  ]);

  const extraFields = Object.entries(extraData ?? {})
    .filter(([, value]) => value != null)
    .map(([key, value]) => ({
      type: 'mrkdwn',
      text: `*${key}:*\n${formatSlackValue(value)}`,
    }));

  const extraFieldSections = chunkArray(
    extraFields,
    SLACK_SECTION_FIELD_LIMIT,
  ).map((sectionFields) => ({
    type: 'section',
    fields: sectionFields,
  }));

  const slackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: truncateSlackText(`[API] ${title}`, 150),
          emoji: true,
        },
      },
      ...(message
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                // Reserve room for the `*Message:*\n` prefix so the composed
                // section text stays within Slack's 3000-char section limit.
                text: `*Message:*\n${truncateSlackText(message, SLACK_TEXT_LIMIT - 16)}`,
              },
            },
          ]
        : []),
      ...(errorDetails
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                // Reserve room for the `*Error:*\n` prefix and the ``` code
                // fences so the composed section text stays within Slack's
                // 3000-char section limit (otherwise Slack returns 400
                // invalid_blocks — long tRPC stacks hit this, short Hono ones
                // don't).
                text: `*Error:*\n\`\`\`${truncateSlackText(errorDetails, SLACK_TEXT_LIMIT - 24)}\`\`\``,
              },
            },
          ]
        : []),
      ...(userInfoSection ? [userInfoSection] : []),
      ...(routeInfoSection ? [routeInfoSection] : []),
      ...extraFieldSections,
      ...(datadogUrl
        ? [
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'View Datadog Logs',
                  },
                  url: datadogUrl,
                  style: 'primary',
                },
              ],
            },
          ]
        : []),
    ],
  };

  try {
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
  } catch (err) {
    logger.error({ error: err }, 'Failed to send HTTP alert to Slack');
  }
}

/**
 * Build a single Slack `section` block listing the non-empty entries under a
 * bold title (e.g. "User Info", "Route Info"). Returns null when every value
 * is empty so the caller can omit the block entirely.
 */
function buildInfoSection(
  title: string,
  entries: Array<[string, unknown]>,
): { type: 'section'; text: { type: 'mrkdwn'; text: string } } | null {
  const lines = entries
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `*${key}:* ${formatSlackValue(value)}`);

  if (lines.length === 0) {
    return null;
  }

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: truncateSlackText(
        `*${title}*\n${lines.join('\n')}`,
        SLACK_TEXT_LIMIT,
      ),
    },
  };
}

const DATADOG_LOGS_WINDOW_MS = 5 * 60_000;

/**
 * Build a Datadog Logs deep link filtered to a single request id, with a
 * ±5 minute window around now (when the alert is emitted).
 */
function buildDatadogLogsUrlByRequestId(requestId: string): string {
  const now = Date.now();
  const params = new URLSearchParams({
    query: `@data.jsonPayload.requestId:${requestId}`,
    agg_m: 'count',
    agg_m_source: 'base',
    agg_t: 'count',
    clustering_pattern_field_path: 'message',
    cols: 'host,service',
    messageDisplay: 'inline',
    refresh_mode: 'sliding',
    storage: 'hot',
    stream_sort: 'desc',
    viz: 'stream',
    from_ts: String(now - DATADOG_LOGS_WINDOW_MS),
    to_ts: String(now + DATADOG_LOGS_WINDOW_MS),
    live: 'true',
  });
  return `https://us5.datadoghq.com/logs?${params.toString()}`;
}

/**
 * Render an unknown error into a readable string (name, message, stack, and
 * nested cause) for inclusion in a Slack alert.
 */
function formatErrorForSlack(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    const parts = [`${error.name}: ${error.message}`];
    if (error.stack) {
      parts.push(error.stack);
    }
    if (error.cause != null) {
      const cause =
        error.cause instanceof Error
          ? `${error.cause.name}: ${error.cause.message}`
          : safeStringify(error.cause);
      parts.push(`Caused by: ${cause}`);
    }
    return parts.join('\n');
  }

  if (typeof error === 'string') {
    return error;
  }

  return safeStringify(error);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
