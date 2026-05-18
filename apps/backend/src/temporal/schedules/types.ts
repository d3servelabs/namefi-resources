/**
 * Common types and interfaces for Temporal schedules
 */

import type { ScheduleOverlapPolicy, Workflow } from '@temporalio/client';
import type { TEMPORAL_QUEUES } from '../shared';
import type { Duration } from '@temporalio/common';

export interface ScheduleConfig<T extends Workflow> {
  /** Unique schedule identifier */
  scheduleId: string;
  /** Unique workflow identifier */
  workflowId: string;
  /** Display name for the schedule */
  name: string;
  /** Description of what this schedule does */
  description: string;
  /** Group identifier for related schedules (optional) */
  groupId?: string;
  /** Cron expressions for when to run */
  cronExpressions: string[];
  /** Task queue to execute on */
  taskQueue: TEMPORAL_QUEUES;
  /** How to handle overlapping executions */
  overlapPolicy: ScheduleOverlapPolicy;
  /** Workflow arguments (optional) */
  args?: Parameters<T>;
  /** Workflow execution timeout */
  workflowExecutionTimeout?: Duration;
  /** Workflow run timeout */
  workflowRunTimeout?: Duration;
  /** Catchup window for missed executions */
  catchupWindow?: Duration;
  /** Whether to pause on failure */
  pauseOnFailure?: boolean;
  /** Owner/team responsible for this schedule */
  owner: string;
  /** Category/purpose of the schedule */
  category: 'indexer' | 'reporting' | 'notification' | 'hunt' | 'maintenance';
  /**
   * When true, `submit()` is a no-op in production. Use for schedules that
   * must only run in local/development/preview environments.
   */
  nonProductionOnly?: boolean;
}

export interface ScheduleStatus {
  scheduleId: string;
  name: string;
  description: string;
  paused: boolean;
  cronExpressions: string[];
  nextActionTimes: Date[];
  recentActions: Array<{
    scheduledAt: Date;
    takenAt?: Date;
    workflow: {
      workflowId: string;
      firstExecutionRunId: string;
    };
  }>;
  category: string;
  owner: string;
}

export interface ScheduleOperations<T extends Workflow> {
  /** Create/submit the schedule */
  submit(): Promise<void>;
  /** Trigger the schedule manually */
  trigger(overlapPolicy?: ScheduleOverlapPolicy): Promise<void>;
  /** Update the schedule configuration */
  update(updates: Partial<ScheduleConfig<T>>): Promise<void>;
  /** Pause the schedule */
  pause(reason?: string): Promise<void>;
  /** Unpause the schedule */
  unpause(reason?: string): Promise<void>;
  /** Get current schedule status */
  getStatus(): Promise<ScheduleStatus>;
  /** Delete the schedule */
  delete(): Promise<void>;
}

export interface NamefiSchedule<T extends Workflow>
  extends ScheduleOperations<T> {
  /** Schedule configuration */
  config: ScheduleConfig<T>;
}

export interface ScheduleGroup {
  /** Unique group identifier */
  groupId: string;
  /** Display name for the group */
  name: string;
  /** Description of what this group contains */
  description: string;
  /** Category this group belongs to */
  category: 'indexer' | 'reporting' | 'notification' | 'hunt' | 'maintenance';
  /** Priority for display ordering (lower = higher priority) */
  priority?: number;
}
