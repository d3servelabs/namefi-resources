import type { ScheduleOverlapPolicy, Workflow } from '../../types/temporal';
import type { Duration } from '@temporalio/common';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin schedules sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/schedulesRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminSchedulesContract>`. Procedures use
 * `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 *
 * `ScheduleConfig`, `ScheduleStatus`, and `ScheduleGroup` are mirrored
 * structurally from `apps/backend/src/temporal/schedules/types.ts` — that
 * backend file itself depends on `@temporalio/client` /
 * `@temporalio/common` types, which are now direct deps of common.
 */

// ---------------------------------------------------------------------------
// Structural mirrors of backend's schedule types. Backend is in
// `apps/backend/src/temporal/schedules/types.ts`; keeping a sibling copy
// here means any divergence surfaces as a contract-assignment error at the
// router file.
// ---------------------------------------------------------------------------

type ScheduleCategory =
  | 'indexer'
  | 'reporting'
  | 'notification'
  | 'hunt'
  | 'maintenance';

type ScheduleConfigLike<T extends Workflow = Workflow> = {
  scheduleId: string;
  workflowId: string;
  name: string;
  description: string;
  groupId?: string;
  cronExpressions: string[];
  taskQueue: string;
  overlapPolicy: ScheduleOverlapPolicy;
  args?: Parameters<T>;
  workflowExecutionTimeout?: Duration;
  workflowRunTimeout?: Duration;
  catchupWindow?: Duration;
  pauseOnFailure?: boolean;
  owner: string;
  category: ScheduleCategory;
};

type ScheduleStatusLike = {
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
};

type ScheduleGroupLike = {
  groupId: string;
  name: string;
  description: string;
  category: ScheduleCategory;
  priority?: number;
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const scheduleIdInputSchema = z.object({
  scheduleId: z.string().min(1),
});

const categoryInputSchema = z.object({
  category: z.string().min(1),
});

const optionalGroupIdInputSchema = z.object({
  groupId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

const scheduleActionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const scheduleConfigListSchema = z.array(
  z.object({
    config: z.custom<ScheduleConfigLike>(() => true),
  }),
);

const scheduleStatusListSchema = z.array(
  z.union([
    z.object({
      scheduleId: z.string(),
      status: z.custom<ScheduleStatusLike>(() => true),
    }),
    z.object({
      scheduleId: z.string(),
      error: z.any(),
    }),
  ]),
);

const scheduleStatusSchema = z.custom<ScheduleStatusLike>(() => true);

const scheduleGroupSchema = z.custom<ScheduleGroupLike>(() => true);

const scheduleGroupsSchema = z.array(scheduleGroupSchema);

/**
 * `getSchedulesByGroup` returns `NamefiSchedule<any>[]`, which on the wire
 * is effectively the `{ config }` portion (the methods don't serialize).
 * We model it as the opaque backend shape so the contract is honest about
 * what the backend declares, while the client still only sees JSON fields.
 */
const namefiScheduleListSchema = z.array(
  z.custom<{ config: ScheduleConfigLike }>(() => true),
);

export const adminSchedulesContract = createContract(
  { softOutput: true },
  {
    getAllSchedules: {
      type: 'query',
      input: z.void(),
      output: scheduleConfigListSchema,
    },
    getScheduleStatuses: {
      type: 'query',
      input: z.void(),
      output: scheduleStatusListSchema,
    },
    getSchedulesByCategory: {
      type: 'query',
      input: categoryInputSchema,
      output: scheduleConfigListSchema,
    },
    submitSchedule: {
      type: 'mutation',
      input: scheduleIdInputSchema,
      output: scheduleActionOutputSchema,
    },
    triggerSchedule: {
      type: 'mutation',
      input: scheduleIdInputSchema,
      output: scheduleActionOutputSchema,
    },
    pauseSchedule: {
      type: 'mutation',
      input: scheduleIdInputSchema,
      output: scheduleActionOutputSchema,
    },
    unpauseSchedule: {
      type: 'mutation',
      input: scheduleIdInputSchema,
      output: scheduleActionOutputSchema,
    },
    deleteSchedule: {
      type: 'mutation',
      input: scheduleIdInputSchema,
      output: scheduleActionOutputSchema,
    },
    getScheduleStatus: {
      type: 'query',
      input: scheduleIdInputSchema,
      output: scheduleStatusSchema,
    },
    getAllScheduleGroups: {
      type: 'query',
      input: z.void(),
      output: scheduleGroupsSchema,
    },
    getSchedulesByGroup: {
      type: 'query',
      input: optionalGroupIdInputSchema,
      output: namefiScheduleListSchema,
    },
    getScheduleGroup: {
      type: 'query',
      input: optionalGroupIdInputSchema,
      output: scheduleGroupSchema,
    },
  },
);

export type AdminSchedulesContract = typeof adminSchedulesContract;
