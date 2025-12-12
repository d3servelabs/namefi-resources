'use client';

import type { ProgressPhase } from '@/components/ui/progress-timeline';

/**
 * Terminal workflow statuses that indicate the workflow has finished.
 * Use this set to determine if polling should stop.
 */
export const TERMINAL_WORKFLOW_STATUSES = new Set([
  'COMPLETED',
  'FAILED',
  'TERMINATED',
  'TIMED_OUT',
  'CANCELLED',
  'UNKNOWN',
  'NOT_FOUND',
]);

/**
 * Base interface for workflow progress responses.
 * Workflow-specific implementations should match this shape.
 */
export interface WorkflowProgressResponse<TState> {
  workflowStatus: string;
  runId: string | null;
  state: TState | null;
  fetchedAt: string;
}

/**
 * Options for workflow progress hooks.
 */
export interface UseWorkflowProgressOptions {
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Polling interval in milliseconds */
  pollIntervalMs?: number;
}

/**
 * Determines if a workflow has reached a terminal state.
 */
export function isTerminalStatus(status: string): boolean {
  return TERMINAL_WORKFLOW_STATUSES.has(status);
}

/**
 * Get the progress phase from workflow status.
 */
export function getProgressPhase<TState>(
  progress: WorkflowProgressResponse<TState> | null | undefined,
): ProgressPhase {
  if (!progress || !progress.state) {
    return 'loading';
  }
  if (TERMINAL_WORKFLOW_STATUSES.has(progress.workflowStatus)) {
    return 'terminal';
  }
  return 'processing';
}
