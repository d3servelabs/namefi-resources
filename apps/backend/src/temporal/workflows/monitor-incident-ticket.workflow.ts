import type { Duration } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { min } from 'ramda';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

const RESOLVED_SIGNAL = workflow.defineSignal('incidentResolved');

/**
 * Escalation sleep timers.
 * Re-alerts at: 2h, 4h, 8h, 12h, 24h, then every 24h.
 */
const ESCALATION_TIMERS: Duration[] = [
  '2 hours',
  '2 hours',
  '4 hours',
  '4 hours',
  '12 hours',
  '24 hours',
];

/** Duration string to approximate hours for display. */
function durationToHours(d: Duration): number {
  if (typeof d === 'string') {
    const match = d.match(/^(\d+)\s*(hours?|minutes?|days?)/);
    if (!match) return 1;
    const val = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith('minute')) return val / 60;
    if (unit.startsWith('day')) return val * 24;
    return val;
  }
  return 1;
}

export interface MonitorIncidentTicketInput {
  taskId: string;
  taskUrl: string;
  originalAlert: {
    title: string;
    message: string;
    extraData?: any;
  };
}

export async function monitorIncidentTicketWorkflow(
  input: MonitorIncidentTicketInput,
): Promise<void> {
  const { getIncidentTicketStatus, sendIncidentEscalationToSlack } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        ...shortRunningOpts,
      },
    });

  let signalResolved = false;
  workflow.setHandler(RESOLVED_SIGNAL, () => {
    signalResolved = true;
  });

  let escalationLevel = 0;
  let totalHoursOpen = 0;

  while (true) {
    const sleepDuration =
      ESCALATION_TIMERS[min(escalationLevel, ESCALATION_TIMERS.length - 1)];

    await Promise.race([
      workflow.condition(() => signalResolved),
      workflow.sleep(sleepDuration),
    ]);

    if (signalResolved) {
      workflow.log.info('Incident resolved via signal');
      return;
    }

    totalHoursOpen += durationToHours(sleepDuration);

    // Check ticket status
    let status: {
      status: string;
      assignees: string[];
      isResolved: boolean;
      isPickedUp: boolean;
    };
    try {
      status = await getIncidentTicketStatus({ taskId: input.taskId });
    } catch (error) {
      workflow.log.warn(
        `Failed to check ticket status, will retry next cycle: ${error}`,
      );
      escalationLevel++;
      continue;
    }

    if (status.isResolved) {
      workflow.log.info(
        `Incident ticket ${input.taskId} resolved with status: ${status.status}`,
      );
      return;
    }

    // Determine severity label
    const severity =
      escalationLevel <= 2
        ? 'REMINDER'
        : escalationLevel <= 4
          ? 'ESCALATION'
          : 'CRITICAL';

    const pickedUpText = status.isPickedUp
      ? status.assignees.length > 0
        ? `Assigned to: ${status.assignees.join(', ')}`
        : 'Picked up (no assignee listed)'
      : 'No assignee yet';

    try {
      await sendIncidentEscalationToSlack({
        title: `[${severity}] ${input.originalAlert.title}`,
        message: `Incident ticket open for ~${Math.round(totalHoursOpen)}h. ${pickedUpText}.`,
        ticketUrl: input.taskUrl,
        escalationLevel,
        hoursOpen: Math.round(totalHoursOpen),
      });
    } catch (error) {
      workflow.log.warn(`Failed to send escalation to Slack: ${error}`);
    }

    escalationLevel++;
  }
}
