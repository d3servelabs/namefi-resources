import { Context as ActivityContext } from '@temporalio/activity';
import type {
  WorkflowExecutionDescription,
  WorkflowHandle,
} from '@temporalio/client';
import {
  getExecutionContext,
  setExecutionContext,
  createTemporalContext,
  withExecutionContext,
} from '../context';
import type { ExecutionContext } from '../types';
import { temporalClient } from '#temporal/client';

/**
 * Temporal-specific execution context with memo and search attribute access
 */

export interface TemporalExecutionContext extends ExecutionContext {
  type: 'temporal-activity';
  temporal: NonNullable<ExecutionContext['temporal']>;
}

export function getCurrentWorkflowHandle(): WorkflowHandle | undefined {
  const context = getExecutionContext();
  if (!context || !context.temporal) {
    return undefined;
  }
  if (context.temporal.$metadata?.workflowHandle) {
    return context.temporal.$metadata.workflowHandle;
  }
  const workflowExecution = ActivityContext.current().info.workflowExecution;
  context.temporal.$metadata = {
    ...context.temporal.$metadata,
    workflowHandle: temporalClient.workflow.getHandle(
      workflowExecution.workflowId,
      workflowExecution.runId,
    ),
  };
  return context.temporal.$metadata.workflowHandle;
}

export async function getCurrentWorkflowDescription(): Promise<
  WorkflowExecutionDescription | undefined
> {
  const context = getExecutionContext();
  if (!context || !context.temporal) {
    return undefined;
  }

  if (context.temporal.$metadata?.workflowDescription) {
    return context.temporal.$metadata.workflowDescription;
  }
  const workflowHandle = await getCurrentWorkflowHandle();
  context.temporal.$metadata = {
    ...context.temporal.$metadata,
    workflowDescription: await workflowHandle?.describe(),
  };
  return context.temporal.$metadata.workflowDescription;
}

/**
 * Gets memo from the current Temporal context (workflow or activity)
 * Memo is lazily loaded and cached
 */
export async function getMemo(): Promise<Record<string, any> | undefined> {
  const workflowDescription = await getCurrentWorkflowDescription();
  return workflowDescription?.memo;
}

/**
 * Gets search attributes from the current Temporal context
 * Search attributes are lazily loaded and cached
 */
export async function getSearchAttributes(): Promise<
  Record<string, any> | undefined
> {
  const workflowDescription = await getCurrentWorkflowDescription();
  return workflowDescription?.searchAttributes;
}

/**
 * Gets a specific memo value by key
 */
export async function getMemoValue<T = any>(
  key: string,
): Promise<T | undefined> {
  const memo = await getMemo();
  return memo?.[key] as T;
}

/**
 * Gets a specific search attribute value by key
 */
export async function getSearchAttribute<T = any>(
  key: string,
): Promise<T | undefined> {
  const searchAttributes = await getSearchAttributes();
  return searchAttributes?.[key] as T;
}

/**
 * Determines if the current execution is automatic based on search attributes
 * This is a more sophisticated version that can check multiple search attribute patterns
 */
export async function isAutomaticTemporalExecution(): Promise<boolean> {
  const searchAttributes = await getSearchAttributes();

  if (!searchAttributes) {
    return false;
  }

  // Check common patterns for automatic execution
  const automaticIndicators = [
    searchAttributes.isAutomatic === true,
    searchAttributes.automatic === true,
    searchAttributes.triggerType === 'scheduled',
    searchAttributes.triggerType === 'cron',
    searchAttributes.triggerType === 'system',
    searchAttributes.source === 'scheduler',
    searchAttributes.source === 'automation',
  ];

  return automaticIndicators.some(Boolean);
}

/**
 * Sets execution context for Temporal activities with enhanced automatic detection
 */
export function setTemporalActivityContext(activityName?: string): void {
  const activity = ActivityContext.current();

  // Use provided activityName or get from activity info
  const name = activityName || activity.info.activityType;

  setExecutionContext(
    createTemporalContext(
      activity.info.workflowExecution.workflowId,
      activity.info.workflowExecution.runId,
      activity.info.taskQueue,
      name,
    ),
  );
}

/**
 * Sets execution context for Temporal activities with enhanced automatic detection
 */
export function withTemporalActivityContext<T extends any[], R>(
  activityName: string,
  activityFn: (...args: T) => R,
): (...args: T) => R {
  return (...args: T) => {
    const activity = ActivityContext.current();

    // Use provided activityName or get from activity info
    const name = activityName || activity.info.activityType;

    return withExecutionContext(
      createTemporalContext(
        activity.info.workflowExecution.workflowId,
        activity.info.workflowExecution.runId,
        activity.info.taskQueue,
        name,
      ),
      activityFn,
    )(...args);
  };
}

/**
 * Gets the current Temporal execution context if available
 */
export function getTemporalExecutionContext():
  | TemporalExecutionContext
  | undefined {
  const context = getExecutionContext();
  if (context?.type === 'temporal-activity') {
    return context as TemporalExecutionContext;
  }
  return undefined;
}
