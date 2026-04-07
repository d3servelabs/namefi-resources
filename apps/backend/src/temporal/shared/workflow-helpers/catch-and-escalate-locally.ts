import * as workflow from '@temporalio/workflow';
import { criticalAlertWithTicket } from './critical-alert-with-ticket';

/**
 * Executes a function and catches any errors, sending a critical alert with
 * ClickUp ticket creation and starting an incident monitoring workflow.
 *
 * This is the escalating variant of `catchAndAlertLocally`. Use this for
 * critical operations where failures must be tracked as incident tickets.
 *
 * This function must only be used within Temporal workflows.
 */
export async function catchAndEscalateLocally<T>(
  catchable: () => Promise<T>,
  options?: {
    details?: any;
    message?: string;
    priority?: 1 | 2 | 3 | 4;
  },
): Promise<T | undefined> {
  try {
    const result = await catchable();
    return result;
  } catch (error: any) {
    workflow.log.error(error);

    const info = workflow.workflowInfo();

    try {
      await criticalAlertWithTicket({
        title: `Workflow Critical Failure (${info.workflowId})`,
        message: options?.message ?? String(error),
        extraData: {
          workflowId: info.workflowId,
          runId: info.runId,
          error: error?.message ?? String(error),
          ...(options?.details ?? {}),
        },
        priority: options?.priority,
      });
    } catch (_alertError) {
      // Silently ignore alert failures to prevent workflow disruption
    }
  }
}
