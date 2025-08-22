import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { logger } from '#lib/logger';
import { adminProcedure, createTRPCRouter } from '../../base';
import {
  SCHEDULE_REGISTRY,
  getAllSchedules,
  getAllScheduleStatuses,
} from '../../../temporal/schedules';

export const schedulesRouter = createTRPCRouter({
  getAllSchedules: adminProcedure.query(async () => {
    try {
      return getAllSchedules().map((schedule) => {
        return {
          config: schedule.config,
        };
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get all schedules');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve schedules',
      });
    }
  }),

  getScheduleStatuses: adminProcedure.query(async () => {
    try {
      return await getAllScheduleStatuses();
    } catch (error) {
      logger.error({ error }, 'Failed to get schedule statuses');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve schedule statuses',
      });
    }
  }),

  getSchedulesByCategory: adminProcedure
    .input(
      z.object({
        category: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { category } = input;
        const schedules = getAllSchedules().map((schedule) => {
          return {
            config: schedule.config,
          };
        });
        return schedules.filter(
          (schedule) => schedule.config.category === category,
        );
      } catch (error) {
        logger.error(
          { error, category: input.category },
          'Failed to get schedules by category',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve schedules by category',
        });
      }
    }),

  submitSchedule: adminProcedure
    .input(
      z.object({
        scheduleId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { scheduleId } = input;
        const schedule = SCHEDULE_REGISTRY[scheduleId];
        if (!schedule) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Schedule ${scheduleId} not found`,
          });
        }

        await schedule.submit();
        logger.info({ scheduleId }, 'Schedule submitted successfully');

        return {
          success: true,
          message: `Schedule ${scheduleId} submitted successfully`,
        };
      } catch (error) {
        logger.error(
          { error, scheduleId: input.scheduleId },
          'Failed to submit schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit schedule',
          cause: error,
        });
      }
    }),

  triggerSchedule: adminProcedure
    .input(
      z.object({
        scheduleId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { scheduleId } = input;
      const schedule = SCHEDULE_REGISTRY[scheduleId];
      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Schedule ${scheduleId} not found`,
        });
      }

      try {
        await schedule.trigger();
        logger.info({ scheduleId }, 'Schedule triggered successfully');

        return {
          success: true,
          message: `Schedule ${scheduleId} triggered successfully`,
        };
      } catch (error) {
        logger.error(
          { error, scheduleId: input.scheduleId },
          'Failed to trigger schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger schedule',
          cause: error,
        });
      }
    }),

  pauseSchedule: adminProcedure
    .input(
      z.object({
        scheduleId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { scheduleId } = input;
      const schedule = SCHEDULE_REGISTRY[scheduleId];
      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Schedule ${scheduleId} not found`,
        });
      }
      try {
        await schedule.pause();
        logger.info({ scheduleId }, 'Schedule paused successfully');

        return {
          success: true,
          message: `Schedule ${scheduleId} paused successfully`,
        };
      } catch (error) {
        logger.error(
          { error, scheduleId: input.scheduleId },
          'Failed to pause schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to pause schedule',
          cause: error,
        });
      }
    }),

  unpauseSchedule: adminProcedure
    .input(
      z.object({
        scheduleId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { scheduleId } = input;
      const schedule = SCHEDULE_REGISTRY[scheduleId];
      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Schedule ${scheduleId} not found`,
        });
      }
      try {
        await schedule.unpause();
        logger.info({ scheduleId }, 'Schedule unpaused successfully');

        return {
          success: true,
          message: `Schedule ${scheduleId} unpaused successfully`,
        };
      } catch (error) {
        logger.error(
          { error, scheduleId: input.scheduleId },
          'Failed to unpause schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unpause schedule',
          cause: error,
        });
      }
    }),

  deleteSchedule: adminProcedure
    .input(
      z.object({
        scheduleId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { scheduleId } = input;
      const schedule = SCHEDULE_REGISTRY[scheduleId];
      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Schedule ${scheduleId} not found`,
        });
      }

      try {
        await schedule.delete();
        logger.info({ scheduleId }, 'Schedule deleted successfully');

        return {
          success: true,
          message: `Schedule ${scheduleId} deleted successfully`,
        };
      } catch (error) {
        logger.error(
          { error, scheduleId: input.scheduleId },
          'Failed to delete schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete schedule',
          cause: error,
        });
      }
    }),

  getScheduleStatus: adminProcedure
    .input(
      z.object({
        scheduleId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const { scheduleId } = input;
      const schedule = SCHEDULE_REGISTRY[scheduleId];
      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Schedule ${scheduleId} not found`,
        });
      }
      try {
        return schedule.getStatus();
      } catch (error) {
        logger.error(
          { error, scheduleId: input.scheduleId },
          'Failed to get schedule status',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get schedule status',
          cause: error,
        });
      }
    }),
});
