import z from 'zod';

export interface ScheduleExecutionResult {
  /** Time that the Action was scheduled for, including jitter */
  scheduledAt: Date;
  /** Time that the Action was actually taken */
  takenAt: Date;
  /** The Action that was taken */
  action: ScheduleExecutionActionResult;
}
export type ScheduleExecutionActionResult =
  ScheduleExecutionStartWorkflowActionResult;
export interface ScheduleExecutionStartWorkflowActionResult {
  type: 'startWorkflow';
  workflow: {
    workflowId: string;
    /**
     * The Run Id of the original execution that was started by the Schedule. If the Workflow retried, did
     * Continue-As-New, or was Reset, the following runs would have different Run Ids.
     */
    firstExecutionRunId: string;
  };
}

export const workflowExecutionStatusNameSchema = z.union([
  z.literal('UNSPECIFIED'),
  z.literal('RUNNING'),
  z.literal('COMPLETED'),
  z.literal('FAILED'),
  z.literal('CANCELLED'),
  z.literal('TERMINATED'),
  z.literal('CONTINUED_AS_NEW'),
  z.literal('TIMED_OUT'),
  z.literal('UNKNOWN'),
]);
export type WorkflowExecutionStatusName = z.infer<
  typeof workflowExecutionStatusNameSchema
>;
export type WorkflowReturnType = Promise<any>;
export type Workflow = (...args: any[]) => WorkflowReturnType;

/**
 * Policy for overlapping Actions.
 */
export const ScheduleOverlapPolicy = {
  /**
   * Don't start a new Action.
   * @default
   */
  SKIP: 'SKIP',
  /**
   * Start another Action as soon as the current Action completes, but only buffer one Action in this way. If another
   * Action is supposed to start, but one Action is running and one is already buffered, then only the buffered one will
   * be started after the running Action finishes.
   */
  BUFFER_ONE: 'BUFFER_ONE',
  /**
   * Allows an unlimited number of Actions to buffer. They are started sequentially.
   */
  BUFFER_ALL: 'BUFFER_ALL',
  /**
   * Cancels the running Action, and then starts the new Action once the cancelled one completes.
   */
  CANCEL_OTHER: 'CANCEL_OTHER',
  /**
   * Terminate the running Action and start the new Action immediately.
   */
  TERMINATE_OTHER: 'TERMINATE_OTHER',
  /**
   * Allow any number of Actions to start immediately.
   *
   * This is the only policy under which multiple Actions can run concurrently.
   */
  ALLOW_ALL: 'ALLOW_ALL',
  /**
   * Use server default (currently SKIP).
   *
   * @deprecated Either leave property `undefined`, or use {@link SKIP} instead.
   */
  UNSPECIFIED: undefined,
} as const;
export type ScheduleOverlapPolicy =
  (typeof ScheduleOverlapPolicy)[keyof typeof ScheduleOverlapPolicy];
