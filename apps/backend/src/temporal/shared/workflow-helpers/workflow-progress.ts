import * as workflow from '@temporalio/workflow';

/**
 * Generic workflow progress state management for Temporal workflows.
 *
 * This module provides a lightweight, type-safe way to track workflow progress
 * with minimal state overhead. The workflow emits step IDs and statuses only;
 * display labels are mapped on the frontend.
 *
 * @example
 * ```typescript
 * type MyStepId = 'step-1' | 'step-2' | 'step-3';
 *
 * const progress = createWorkflowProgress<MyStepId>(['step-1', 'step-2', 'step-3']);
 * workflow.setHandler(myProgressQuery, () => progress.state);
 *
 * progress.startStep('step-1');
 * // ... do work
 * progress.completeStep('step-1');
 * ```
 */

export type WorkflowStepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

/**
 * Information about a nested workflow (embedded or child) for a step.
 * This allows the client to query the nested workflow's progress directly.
 */
export interface StepWorkflowInfo {
  /** The workflow ID of the nested workflow */
  workflowId: string;
  /** The run ID of the nested workflow (for embedded workflows, same as parent) */
  runId: string;
  /** The name of the progress query to call on the nested workflow */
  progressQueryName: string;
}

export interface WorkflowStep<TStepId extends string = string> {
  id: TStepId;
  status: WorkflowStepStatus;
  startedAt?: number;
  completedAt?: number;
  message?: string;
  /**
   * For steps that are embedded/child workflows, this contains the info
   * needed to query the nested workflow's progress from the client.
   */
  nestedWorkflow?: StepWorkflowInfo;
  /**
   * Substeps populated by the client after querying the nested workflow.
   * Not populated by the workflow itself.
   */
  substeps?: WorkflowStep<string>[];
}

export type WorkflowPhase = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface WorkflowProgressState<TStepId extends string = string> {
  steps: WorkflowStep<TStepId>[];
  phase: WorkflowPhase;
  error?: string;
  timestamps: {
    startedAt: number;
    lastUpdatedAt: number;
    completedAt?: number;
  };
}

export interface WorkflowProgressOptions {
  /**
   * The workflow type identifier used to create a unique memo key.
   * This is required to avoid conflicts when embedded workflows share the same memo.
   * The memo key will be `progress-<workflowType>`.
   *
   * @example 'changeNameservers', 'disableDnssec', 'enableDnssec'
   */
  workflowType: string;
}

export interface WorkflowProgressManager<TStepId extends string> {
  /** The current progress state */
  state: WorkflowProgressState<TStepId>;

  /** Mark a step as in progress */
  startStep: (id: TStepId, message?: string) => void;

  /** Mark a step as completed */
  completeStep: (id: TStepId, message?: string) => void;

  /** Mark a step as failed */
  failStep: (id: TStepId, message?: string) => void;

  /** Mark a step as skipped */
  skipStep: (id: TStepId, message?: string) => void;

  /** Update the message for the current step */
  updateMessage: (id: TStepId, message: string) => void;

  /**
   * Set nested workflow info for a step that executes an embedded or child workflow.
   * This allows the client to query the nested workflow's progress directly.
   *
   * For embedded workflows (direct function calls), use the current workflow's ID and runId.
   * For child workflows, use the child's workflow ID and runId.
   *
   * @param stepId - The step ID that contains the nested workflow
   * @param info - The workflow info needed to query the nested workflow's progress
   *
   * @example
   * ```typescript
   * // For embedded workflow (same workflowId/runId as parent)
   * const info = workflow.workflowInfo();
   * progress.setStepNestedWorkflow('disable-dnssec', {
   *   workflowId: info.workflowId,
   *   runId: info.firstExecutionRunId,
   *   progressQueryName: 'getDisableDnssecProgress',
   * });
   * await disableDnssecWorkflow({ domainName });
   *
   * // For child workflow
   * const childHandle = await workflow.startChild(childWorkflow, { ... });
   * progress.setStepNestedWorkflow('child-step', {
   *   workflowId: childHandle.workflowId,
   *   runId: childHandle.firstExecutionRunId,
   *   progressQueryName: 'getChildProgress',
   * });
   * ```
   */
  setStepNestedWorkflow: (stepId: TStepId, info: StepWorkflowInfo) => void;

  /** Mark the entire workflow as completed */
  complete: () => void;

  /** Mark the entire workflow as failed */
  fail: (error: string) => void;
}

/** Prefix for memo keys storing progress state */
export const PROGRESS_MEMO_PREFIX = 'progress';

/**
 * Generate the memo key for a workflow's progress state.
 * @param workflowType - The workflow type identifier
 * @returns The memo key in format `progress-<workflowType>`
 */
export function getProgressMemoKey(workflowType: string): string {
  return `${PROGRESS_MEMO_PREFIX}-${workflowType}`;
}

/**
 * workflowInfo().unsafe.now() might be needed for when we reset workflows,
 * but it's dangorous when it comes to deteminisim or replaying history
 * ``` previous implementation
 *   const info = workflow.workflowInfo();
 *   return info.unsafe?.now ? info.unsafe.now() : Date.now();
 * ```
 * !! Temporal internally patches Date.now() to make determinstic
 */
function getTemporalNow(): number {
  return Date.now();
}

/**
 * Creates a workflow progress manager with type-safe step tracking.
 *
 * @param stepIds - Array of step IDs in execution order
 * @param options - Configuration for progress tracking (workflowType is required)
 * @returns A progress manager with state and helper methods
 *
 * @example
 * ```typescript
 * type DnssecStepId = 'check-support' | 'enable-zone' | 'associate-ds';
 *
 * const progress = createWorkflowProgress<DnssecStepId>(
 *   ['check-support', 'enable-zone', 'associate-ds'],
 *   { workflowType: 'enableDnssec' }
 * );
 *
 * // Expose state via query
 * workflow.setHandler(getDnssecProgressQuery, () => progress.state);
 *
 * // Track progress
 * progress.startStep('check-support');
 * await checkDnssecSupport();
 * progress.completeStep('check-support');
 * ```
 */
export function createWorkflowProgress<TStepId extends string>(
  stepIds: readonly TStepId[],
  options: WorkflowProgressOptions,
): WorkflowProgressManager<TStepId> {
  const memoKey = getProgressMemoKey(options.workflowType);
  const now = getTemporalNow();

  const state: WorkflowProgressState<TStepId> = {
    steps: stepIds.map((id) => ({
      id,
      status: 'PENDING' as const,
    })),
    phase: 'RUNNING',
    timestamps: {
      startedAt: now,
      lastUpdatedAt: now,
    },
  };

  /**
   * Persist progress state to workflow memo.
   * This allows querying progress even after the workflow completes.
   */
  const persistToMemo = () => {
    workflow.upsertMemo({ [memoKey]: state });
  };

  const touch = () => {
    state.timestamps.lastUpdatedAt = getTemporalNow();
    persistToMemo();
  };

  // Initial persist to memo
  persistToMemo();

  const findStep = (id: TStepId): WorkflowStep<TStepId> | undefined => {
    return state.steps.find((step) => step.id === id);
  };

  const setStepStatus = (
    id: TStepId,
    status: WorkflowStepStatus,
    message?: string,
  ) => {
    const step = findStep(id);
    if (!step) {
      workflow.log.warn(`Step "${id}" not found in workflow progress`);
      return;
    }

    const now = getTemporalNow();

    // Update status
    step.status = status;

    // Track timestamps
    if (status === 'IN_PROGRESS') {
      step.startedAt = step.startedAt ?? now;
    }

    if (status === 'COMPLETED' || status === 'FAILED' || status === 'SKIPPED') {
      step.completedAt = now;
    }

    // Update message if provided
    if (message !== undefined) {
      step.message = message;
    }

    touch();
  };

  return {
    state,

    startStep: (id: TStepId, message?: string) => {
      setStepStatus(id, 'IN_PROGRESS', message);
    },

    completeStep: (id: TStepId, message?: string) => {
      setStepStatus(id, 'COMPLETED', message);
    },

    failStep: (id: TStepId, message?: string) => {
      setStepStatus(id, 'FAILED', message);
    },

    skipStep: (id: TStepId, message?: string) => {
      setStepStatus(id, 'SKIPPED', message);
    },

    updateMessage: (id: TStepId, message: string) => {
      const step = findStep(id);
      if (step) {
        step.message = message;
        touch();
      }
    },

    setStepNestedWorkflow: (stepId: TStepId, info: StepWorkflowInfo) => {
      const step = findStep(stepId);
      if (step) {
        step.nestedWorkflow = info;
        touch();
      }
    },

    complete: () => {
      state.phase = 'COMPLETED';
      state.timestamps.completedAt = getTemporalNow();
      touch();
    },

    fail: (error: string) => {
      state.phase = 'FAILED';
      state.error = error;
      state.timestamps.completedAt = getTemporalNow();
      touch();
    },
  };
}
