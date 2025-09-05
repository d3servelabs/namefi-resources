import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { logger } from '#lib/logger';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
  createTRPCRouter,
} from '../../base';
import { Permission } from '@namefi-astra/utils';
import {
  SCHEDULE_REGISTRY,
  getAllSchedules,
  getAllScheduleStatuses,
  getAllRegisteredScheduleGroups,
  getSchedulesByGroup,
  getScheduleGroup,
} from '../../../temporal/schedules';

export const schedulesRouter = createTRPCRouter({
  getAllSchedules: adminProcedureWithPermissions(
    Permission.READ_SCHEDULES,
  ).query(async () => {
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

  getScheduleStatuses: adminProcedureWithPermissions(
    Permission.READ_SCHEDULES,
  ).query(async () => {
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

  getSchedulesByCategory: adminProcedureWithPermissions(
    Permission.READ_SCHEDULES,
  )
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

  submitSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'scheduled_workflow',
      resourceId: input.scheduleId,
      action: 'submit',
      extraInput: input,
    }),
  )
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

  triggerSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'scheduled_workflow',
      resourceId: input.scheduleId,
      action: 'trigger',
      extraInput: input,
    }),
  )
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

  pauseSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'scheduled_workflow',
      resourceId: input.scheduleId,
      action: 'pause',
      extraInput: input,
    }),
  )
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

  unpauseSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'scheduled_workflow',
      resourceId: input.scheduleId,
      action: 'unpause',
      extraInput: input,
    }),
  )
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

  deleteSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'scheduled_workflow',
      resourceId: input.scheduleId,
      action: 'delete',
      extraInput: input,
    }),
  )
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

  getScheduleStatus: adminProcedureWithPermissions(Permission.READ_SCHEDULES)
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
      } catch (error: any) {
        logger.warn(
          { error: error?.message, scheduleId: input.scheduleId },
          'Failed to get schedule status',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get schedule status',
          cause: error,
        });
      }
    }),

  getAllScheduleGroups: adminProcedureWithPermissions(
    Permission.READ_SCHEDULES,
  ).query(async () => {
    try {
      return getAllRegisteredScheduleGroups();
    } catch (error) {
      logger.error({ error }, 'Failed to get schedule groups');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve schedule groups',
      });
    }
  }),

  getSchedulesByGroup: adminProcedureWithPermissions(Permission.READ_SCHEDULES)
    .input(
      z.object({
        groupId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return getSchedulesByGroup(input.groupId);
      } catch (error) {
        logger.error(
          { error, groupId: input.groupId },
          'Failed to get schedules by group',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve schedules by group',
        });
      }
    }),

  getScheduleGroup: adminProcedureWithPermissions(Permission.READ_SCHEDULES)
    .input(
      z.object({
        groupId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return getScheduleGroup(input.groupId);
      } catch (error) {
        logger.error(
          { error, groupId: input.groupId },
          'Failed to get schedule group',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve schedule group',
        });
      }
    }),
});
