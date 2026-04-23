import type { Workflow, WithWorkflowArgs } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { type TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../enums';
import { hasGenerateId } from './typed-workflow-types';

type ChildWorkflowOptionsWithoutTaskQueue = Omit<
  workflow.ChildWorkflowOptions,
  'taskQueue' | 'args' | 'workflowId'
> & {
  /** Explicit workflowId. If omitted and the workflow has generateId, it is auto-derived. */
  workflowId?: string;
};

type DefaultChildWorkflowOptionsWithoutTaskQueue = Omit<
  ChildWorkflowOptionsWithoutTaskQueue,
  'workflowId'
>;

type ChildWorkflowOptionsFor<W extends Workflow> = WithWorkflowArgs<
  W,
  workflow.ChildWorkflowOptions
>;

/**
 * Creates typed child workflow runners scoped to a specific task queue.
 * Analogous to `typedProxyActivities` but for child workflows.
 *
 * Auto-derives `workflowId` from `workflow.generateId(args)` when available.
 * Explicit `workflowId` in options always takes precedence.
 *
 * @example
 * ```typescript
 * const childRunner = typedChildWorkflow({ temporalEnum: TEMPORAL_ENUMS.DOMAINS });
 *
 * // executeChild - waits for result
 * const result = await childRunner.executeChild(acquireDomainWorkflow, [input], {
 *   workflowIdReusePolicy: 'ALLOW_DUPLICATE',
 * });
 *
 * // startChild - fire and forget
 * const handle = await childRunner.startChild(domainSetupWorkflow, [input]);
 * ```
 */
export const typedChildWorkflow = <T extends TEMPORAL_ENUMS>({
  temporalEnum,
  options: defaultOptions,
}: {
  temporalEnum: T;
  options?: DefaultChildWorkflowOptionsWithoutTaskQueue;
}) => {
  const taskQueue = TEMPORAL_QUEUES[temporalEnum];

  return {
    executeChild: async <W extends Workflow>(
      workflowFn: W,
      args: Parameters<W>,
      options?: ChildWorkflowOptionsWithoutTaskQueue,
    ): Promise<workflow.WorkflowResultType<W>> => {
      const workflowId =
        options?.workflowId ??
        (hasGenerateId(workflowFn)
          ? workflowFn.generateId(...args)
          : undefined);

      return workflow.executeChild(workflowFn, {
        ...defaultOptions,
        ...options,
        taskQueue,
        args,
        ...(workflowId ? { workflowId } : {}),
      } as unknown as ChildWorkflowOptionsFor<W>);
    },

    startChild: async <W extends Workflow>(
      workflowFn: W,
      args: Parameters<W>,
      options?: ChildWorkflowOptionsWithoutTaskQueue,
    ): Promise<workflow.ChildWorkflowHandle<W>> => {
      const workflowId =
        options?.workflowId ??
        (hasGenerateId(workflowFn)
          ? workflowFn.generateId(...args)
          : undefined);

      return workflow.startChild(workflowFn, {
        ...defaultOptions,
        ...options,
        taskQueue,
        args,
        ...(workflowId ? { workflowId } : {}),
      } as unknown as ChildWorkflowOptionsFor<W>);
    },
  };
};
