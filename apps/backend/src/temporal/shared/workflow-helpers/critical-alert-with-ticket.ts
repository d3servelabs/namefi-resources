import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { typedProxyActivities } from './typed-proxy-activities';

/**
 * Sends a critical alert (Slack + logger.fatal) and creates a ClickUp incident ticket.
 * If the ticket is created and monitoring is enabled, starts a monitoring child workflow
 * that polls the ticket and re-alerts with escalating severity until the ticket is resolved.
 *
 * This helper must only be used within Temporal workflows.
 */
export async function criticalAlertWithTicket(args: {
  title: string;
  message: string;
  extraData?: any;
  priority?: 1 | 2 | 3 | 4;
  /** Create a ClickUp incident ticket. Defaults to true. */
  createIncident?: boolean;
  /** Start a monitoring workflow for the ticket. Defaults to true. */
  monitorIncident?: boolean;
}): Promise<{ taskId: string; taskUrl: string } | null> {
  const { criticalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumInterval: '1 minute',
        maximumAttempts: 10,
      },
    },
  });

  // criticalAlertNamefi now handles both Slack alert and ClickUp ticket creation
  let ticket: { taskId: string; taskUrl: string } | null = null;
  let shouldMonitor = false;
  try {
    const result = await criticalAlertNamefi(args, {
      createIncident: args.createIncident,
      monitorIncident: args.monitorIncident,
      incidentPriority: args.priority,
    });
    ticket = result?.ticket ?? null;
    shouldMonitor = result?.shouldMonitor ?? false;
  } catch (error) {
    workflow.log.warn(`criticalAlertNamefi failed: ${error}`);
    return null;
  }

  if (!ticket) {
    return null;
  }

  // Start monitoring workflow as a detached child (fire-and-forget)
  if (shouldMonitor) {
    try {
      await workflow.startChild('monitorIncidentTicketWorkflow', {
        args: [
          {
            taskId: ticket.taskId,
            taskUrl: ticket.taskUrl,
            originalAlert: {
              title: args.title,
              message: args.message,
              extraData: args.extraData,
            },
          },
        ],
        workflowId: `monitor-incident-[${ticket.taskId}]-[${Date.now()}]`,
        workflowRunTimeout: '7 days',
        taskQueue: 'default_task_queue',
        parentClosePolicy:
          workflow.ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
      });
    } catch (error) {
      workflow.log.warn(
        `Failed to start incident monitoring workflow: ${error}`,
      );
    }
  }

  return ticket;
}
