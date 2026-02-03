/**
 * Base class for all Temporal schedules in the Namefi system
 * Provides consistent interface and common functionality
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../client';
import { createLogger } from '#lib/logger';
import type { ScheduleConfig, ScheduleStatus, NamefiSchedule } from './types';
import type { Workflow } from '@temporalio/workflow';
import type { Logger } from '#lib/logger';

export abstract class BaseSchedule<T extends Workflow = Workflow>
  implements NamefiSchedule<T>
{
  protected logger: Logger;

  constructor(public config: ScheduleConfig<T>) {
    this.logger = createLogger({ module: `schedule-${config.scheduleId}` });
  }

  /**
   * Abstract method to get the workflow type
   * Each schedule must implement this to specify their workflow
   */
  protected abstract getWorkflowType(): T;

  /**
   * Static factory method to create schedule instance for a workflow type
   * Each concrete schedule class should override this
   */
  static forWorkflowType<T extends Workflow>(
    workflowType: T,
  ): new (
    config: ScheduleConfig<T>,
  ) => BaseSchedule<T> {
    return class extends BaseSchedule<T> {
      protected getWorkflowType() {
        return workflowType;
      }
    };
  }

  /**
   * Submit/create the schedule
   */
  async submit(): Promise<void> {
    try {
      const workflowType = this.getWorkflowType();

      await temporalClient.schedule.create({
        scheduleId: this.config.scheduleId,
        spec: {
          cronExpressions: this.config.cronExpressions,
        },
        policies: {
          overlap: this.config.overlapPolicy,
          catchupWindow: this.config.catchupWindow as any,
          pauseOnFailure: this.config.pauseOnFailure ?? false,
        },
        action: {
          type: 'startWorkflow',
          workflowType,
          taskQueue: this.config.taskQueue as any,
          workflowId: this.config.workflowId,
          args: this.config.args,
          workflowExecutionTimeout: this.config.workflowExecutionTimeout as any,
          workflowRunTimeout: this.config.workflowRunTimeout as any,
        },
        memo: {
          name: this.config.name,
          description: this.config.description,
          owner: this.config.owner,
          category: this.config.category,
        },
      });

      this.logger.debug(
        {
          scheduleId: this.config.scheduleId,
          name: this.config.name,
          cronExpressions: this.config.cronExpressions,
        },
        'Schedule created successfully',
      );
    } catch (error) {
      this.logger.error(error, 'Failed to create schedule');
      throw error;
    }
  }

  /**
   * Trigger the schedule manually
   */
  async trigger(
    overlapPolicy: ScheduleOverlapPolicy = ScheduleOverlapPolicy.BUFFER_ONE,
  ): Promise<void> {
    try {
      const handle = temporalClient.schedule.getHandle(this.config.scheduleId);
      await handle.trigger(overlapPolicy);

      this.logger.debug(
        {
          scheduleId: this.config.scheduleId,
          overlapPolicy,
        },
        'Schedule triggered manually',
      );
    } catch (error) {
      this.logger.error(error, 'Failed to trigger schedule');
      throw error;
    }
  }

  /**
   * Update the schedule configuration
   */
  async update(updates: Partial<ScheduleConfig<T>>): Promise<void> {
    try {
      const handle = temporalClient.schedule.getHandle(this.config.scheduleId);

      await handle.update((schedule) => {
        if (updates.cronExpressions) {
          (schedule.spec as any).cronExpressions = updates.cronExpressions;
        }
        if (updates.overlapPolicy !== undefined) {
          (schedule.policies as any).overlap = updates.overlapPolicy;
        }
        if (updates.catchupWindow !== undefined) {
          (schedule.policies as any).catchupWindow = updates.catchupWindow;
        }
        return schedule;
      });

      // Update local config
      Object.assign(this.config, updates);

      this.logger.debug(
        {
          scheduleId: this.config.scheduleId,
          updates,
        },
        'Schedule updated successfully',
      );
    } catch (error) {
      this.logger.error(error, 'Failed to update schedule');
      throw error;
    }
  }

  /**
   * Pause the schedule
   */
  async pause(reason = 'Paused via admin action'): Promise<void> {
    try {
      const handle = temporalClient.schedule.getHandle(this.config.scheduleId);
      await handle.pause(reason);

      this.logger.debug(
        {
          scheduleId: this.config.scheduleId,
          reason,
        },
        'Schedule paused',
      );
    } catch (error) {
      this.logger.error(error, 'Failed to pause schedule');
      throw error;
    }
  }

  /**
   * Unpause the schedule
   */
  async unpause(reason = 'Unpaused via admin action'): Promise<void> {
    try {
      const handle = temporalClient.schedule.getHandle(this.config.scheduleId);
      await handle.unpause(reason);

      this.logger.debug(
        {
          scheduleId: this.config.scheduleId,
          reason,
        },
        'Schedule unpaused',
      );
    } catch (error) {
      this.logger.error(error, 'Failed to unpause schedule');
      throw error;
    }
  }

  /**
   * Get current schedule status
   */
  async getStatus(): Promise<ScheduleStatus> {
    try {
      const handle = temporalClient.schedule.getHandle(this.config.scheduleId);
      const description = await handle.describe();

      const pausedStatus = description.state?.paused || false;

      return {
        scheduleId: this.config.scheduleId,
        name: this.config.name,
        description: this.config.description,
        paused: pausedStatus,
        cronExpressions: this.config.cronExpressions,
        nextActionTimes: description.info.nextActionTimes,
        recentActions: description.info.recentActions.map((recentAction) => ({
          scheduledAt: recentAction.scheduledAt,
          takenAt: recentAction.takenAt,
          workflow: recentAction.action.workflow,
        })),
        category: this.config.category,
        owner: this.config.owner,
      };
    } catch (error) {
      this.logger.trace({ error }, 'Failed to get schedule status');
      throw error;
    }
  }

  /**
   * Delete the schedule
   */
  async delete(): Promise<void> {
    try {
      const handle = temporalClient.schedule.getHandle(this.config.scheduleId);
      await handle.delete();

      this.logger.debug(
        {
          scheduleId: this.config.scheduleId,
        },
        'Schedule deleted',
      );
    } catch (error) {
      this.logger.error(error, 'Failed to delete schedule');
      throw error;
    }
  }
}
