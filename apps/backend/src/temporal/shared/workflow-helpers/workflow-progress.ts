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

export interface WorkflowStep<TStepId extends string = string> {
  id: TStepId;
  status: WorkflowStepStatus;
  startedAt?: number;
  completedAt?: number;
  message?: string;
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

export interface WorkflowProgressManager<TStepId extends string> {
  /** The current state object - use this in query handlers */
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

  /** Mark the entire workflow as completed */
  complete: () => void;

  /** Mark the entire workflow as failed */
  fail: (error: string) => void;
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
 * @returns A progress manager with state and helper methods
 *
 * @example
 * ```typescript
 * type DnssecStepId = 'check-support' | 'enable-zone' | 'associate-ds';
 *
 * const progress = createWorkflowProgress<DnssecStepId>([
 *   'check-support',
 *   'enable-zone',
 *   'associate-ds',
 * ]);
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
): WorkflowProgressManager<TStepId> {
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

  const touch = () => {
    state.timestamps.lastUpdatedAt = getTemporalNow();
  };

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
