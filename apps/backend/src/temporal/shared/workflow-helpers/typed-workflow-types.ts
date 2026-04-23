import type { Workflow } from '@temporalio/common';
import type { QueryDefinition } from '@temporalio/common';
import type { WorkflowProgressState } from './workflow-progress';

/**
 * A workflow function that has a static `generateId` method.
 * This is the convention used across the codebase for deterministic workflow IDs.
 */
export type WorkflowWithGenerateId<W extends Workflow = Workflow> = W & {
  generateId: (...args: Parameters<W>) => string;
};

/**
 * A workflow function that has a static `progressQuery` property.
 */
export type WorkflowWithProgressQuery<W extends Workflow = Workflow> = W & {
  progressQuery: QueryDefinition<WorkflowProgressState<string>>;
};

/**
 * Check if a workflow function has a `generateId` method at runtime.
 */
export function hasGenerateId<W extends Workflow>(
  wf: W,
): wf is W & { generateId: (...args: Parameters<W>) => string } {
  return typeof (wf as Record<string, unknown>).generateId === 'function';
}

/**
 * Check if a workflow function has a `progressQuery` property at runtime.
 */
export function hasProgressQuery<W extends Workflow>(
  wf: W,
): wf is W & {
  progressQuery: QueryDefinition<WorkflowProgressState<string>>;
} {
  return (wf as Record<string, unknown>).progressQuery != null;
}
