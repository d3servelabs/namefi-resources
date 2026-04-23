import type {
  WorkflowHandleWithFirstExecutionRunId,
  WorkflowStartOptions,
} from '@temporalio/client';
import type { Workflow } from '@temporalio/common';
import { temporalClient } from './client';
import { type TEMPORAL_ENUMS, TEMPORAL_QUEUES } from './shared/enums';
import {
  hasGenerateId,
  hasProgressQuery,
} from './shared/workflow-helpers/typed-workflow-types';
import type { WorkflowProgressState } from './shared/workflow-helpers/workflow-progress';

type WorkflowClientOptions<W extends Workflow> = Omit<
  WorkflowStartOptions<W>,
  'taskQueue' | 'args' | 'workflowId'
> & {
  /** Explicit workflowId. If omitted and the workflow has generateId, it is auto-derived. */
  workflowId?: string;
};

/** Enhanced handle that adds a typed `queryProgress()` convenience method. */
export type EnhancedWorkflowHandle<W extends Workflow> =
  WorkflowHandleWithFirstExecutionRunId<W> & {
    /** Query progress if the workflow has a progressQuery defined. Returns null if not supported. */
    queryProgress: () => Promise<WorkflowProgressState<string> | null>;
  };

/**
 * Creates a typed workflow client scoped to a specific task queue.
 * Analogous to `typedProxyActivities` but for external workflow invocation.
 *
 * Auto-derives `workflowId` from `workflow.generateId(args)` when available.
 * Explicit `workflowId` in options always takes precedence.
 * Throws if no `workflowId` is resolvable.
 *
 * **Important:** This file imports `@temporalio/client` and must NOT be imported
 * inside workflow code (would break the Temporal sandbox). Use `typedChildWorkflow`
 * from `./workflow-helpers/typed-child-workflow` inside workflows instead.
 *
 * @example
 * ```typescript
 * const workflows = typedWorkflowClient({ temporalEnum: TEMPORAL_ENUMS.DOMAINS });
 *
 * // start - returns enhanced handle with queryProgress()
 * const handle = await workflows.start(changeNameserversWorkflow, [input], {
 *   workflowIdReusePolicy: 'ALLOW_DUPLICATE',
 * });
 * const progress = await handle.queryProgress();
 *
 * // execute - waits for result
 * const result = await workflows.execute(changeNameserversWorkflow, [input]);
 * ```
 */
export const typedWorkflowClient = <T extends TEMPORAL_ENUMS>({
  temporalEnum,
  options: defaultOptions,
}: {
  temporalEnum: T;
  options?: Omit<WorkflowClientOptions<Workflow>, 'workflowId'>;
}) => {
  const taskQueue = TEMPORAL_QUEUES[temporalEnum];

  const resolveWorkflowId = <W extends Workflow>(
    workflowFn: W,
    args: Parameters<W>,
    explicitId?: string,
  ): string => {
    if (explicitId) return explicitId;
    if (hasGenerateId(workflowFn)) return workflowFn.generateId(...args);
    throw new Error(
      `workflowId is required: ${workflowFn.name} does not have a generateId method`,
    );
  };

  const enhanceHandle = <W extends Workflow>(
    handle: WorkflowHandleWithFirstExecutionRunId<W>,
    workflowFn: W,
  ): EnhancedWorkflowHandle<W> => {
    return Object.assign(handle, {
      queryProgress: async () => {
        if (hasProgressQuery(workflowFn)) {
          return handle.query(workflowFn.progressQuery);
        }
        return null;
      },
    });
  };

  return {
    start: async <W extends Workflow>(
      workflowFn: W,
      args: Parameters<W>,
      options?: WorkflowClientOptions<W>,
    ): Promise<EnhancedWorkflowHandle<W>> => {
      const workflowId = resolveWorkflowId(
        workflowFn,
        args,
        options?.workflowId,
      );

      const handle = await temporalClient.workflow.start(workflowFn, {
        ...defaultOptions,
        ...options,
        taskQueue,
        args,
        workflowId,
      } as unknown as WorkflowStartOptions<W>);

      return enhanceHandle(handle, workflowFn);
    },

    execute: async <W extends Workflow>(
      workflowFn: W,
      args: Parameters<W>,
      options?: WorkflowClientOptions<W>,
    ) => {
      const workflowId = resolveWorkflowId(
        workflowFn,
        args,
        options?.workflowId,
      );

      return temporalClient.workflow.execute(workflowFn, {
        ...defaultOptions,
        ...options,
        taskQueue,
        args,
        workflowId,
      } as unknown as WorkflowStartOptions<W>);
    },
  };
};
