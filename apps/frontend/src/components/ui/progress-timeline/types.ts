/**
 * Step status values matching the backend WorkflowStepStatus type.
 */
export type StepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

/**
 * A single step in a timeline, with minimal data from the workflow.
 */
export interface TimelineStep {
  id: string;
  status: StepStatus;
  message?: string;
  /**
   * Substeps for nested/embedded workflows.
   * When present, the step can be expanded to show its substeps in an accordion.
   */
  substeps?: TimelineStep[];
}

/**
 * Display information for a step, used to map step IDs to human-readable labels.
 */
export interface StepDisplayInfo {
  /** The primary label for the step */
  label: string;
  /** A helper/description shown below the label */
  helper: string;
}

/**
 * Phase of workflow progress for UI state decisions.
 */
export type ProgressPhase = 'loading' | 'processing' | 'terminal';
