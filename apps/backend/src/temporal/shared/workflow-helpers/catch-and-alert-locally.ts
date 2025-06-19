import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { typedProxyActivities } from './typed-proxy-activities';

/**
 * Executes a function and catches any errors, sending alerts through Temporal activities.
 * This utility should only be used within Temporal workflows.
 *
 * @param catchable - The async function to be executed and monitored
 * @param options - Additional options for error reporting
 * @param options.details - Additional details to include in the alert
 * @param options.message - Custom error message to include in the alert
 * @returns A promise that resolves to the result of the catchable function
 * @throws If the alert activity fails
 * @remarks Alert failures are silently ignored to prevent workflow disruption
 *
 * @remarks
 * This function must only be used within Temporal workflows as it depends on Temporal's workflow context.
 */
export async function catchAndAlertLocally<T>(
  /** The async function to be executed and monitored */
  catchable: () => Promise<T>,
  /** Additional options for error reporting */
  options?: {
    /** Additional details to include in the alert */
    details?: any;
    /** Custom error message to include in the alert */
    message?: string;
  },
): Promise<T | undefined> {
  const { generalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumInterval: '1 minute',
        maximumAttempts: 10,
      },
    },
  });
  try {
    const result = await catchable();
    return result;
  } catch (error: any) {
    workflow.log.error(error);

    const info = workflow.workflowInfo();

    try {
      await generalAlertNamefi({
        title: `Workflow Partial Failure (${info.workflowId})`,
        workflowId: info.workflowId,
        runId: info.runId,
        error,
        ...(options ?? {}),
      });
    } catch (error) {}
  }
}
