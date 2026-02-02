import { db, dnsRecordsTable } from '@namefi-astra/db';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { recordSchema } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { assoc, isNotNil, map, pickBy, pluck } from 'ramda';
import { z } from 'zod';
import { logger } from '#lib/logger';
import { queryActiveNameserversChangeWorkflow } from '#lib/domains/nameservers';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import {
  createRecord,
  createRecordInputSchema,
  deleteRecord,
  getZoneRecords,
  updateRecord,
  updateRecordInputSchema,
  validateZone,
} from '../../services/dns/service';
import { temporalClient } from '../../temporal/client';
import {
  enableDnssecWorkflow,
  getEnableDnssecProgressQuery,
  type EnableDnssecStepId,
} from '../../temporal/workflows/enable-dnssec.workflow';
import {
  disableDnssecWorkflow,
  getDisableDnssecProgressQuery,
  type DisableDnssecStepId,
} from '../../temporal/workflows/disable-dnssec.workflow';
import {
  changeNameserversWorkflow,
  getChangeNameserversProgressQuery,
  type ChangeNameserversStepId,
} from '../../temporal/workflows/change-nameservers.workflow';
import {
  getResetNameserversProgressQuery,
  type ResetNameserversStepId,
} from '../../temporal/workflows/reset-nameservers.workflow';
import {
  getProgressMemoKey,
  type WorkflowProgressState,
  type WorkflowStep,
} from '../../temporal/shared/workflow-helpers/workflow-progress';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { assertAuthenticatedUserIsDomainOwner } from '../guards/assert-domain-owner';

type EnableDnssecProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<EnableDnssecStepId> | null;
};

type EnableDnssecProgressPayload = EnableDnssecProgressSnapshot & {
  domainName: string;
  fetchedAt: string;
};

type DisableDnssecProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<DisableDnssecStepId> | null;
};

type DisableDnssecProgressPayload = DisableDnssecProgressSnapshot & {
  domainName: string;
  fetchedAt: string;
};

type ChangeNameserversProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<
    ChangeNameserversStepId | ResetNameserversStepId
  > | null;
  workflowType: 'change-nameservers' | 'reset-nameservers' | null;
};

type ChangeNameserversProgressPayload = ChangeNameserversProgressSnapshot & {
  domainName: string;
  fetchedAt: string;
};

const fetchEnableDnssecWorkflowSnapshot = async (
  domainName: PunycodeDomainName,
): Promise<EnableDnssecProgressSnapshot> => {
  const workflowId = enableDnssecWorkflow.generateId({ domainName });
  const handle = temporalClient.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: WorkflowProgressState<EnableDnssecStepId> | null = null;
    const isQueryable =
      workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED';
    if (isQueryable) {
      try {
        state = await handle.query(getEnableDnssecProgressQuery);
      } catch (error) {
        logger.debug(
          { error, workflowId, domainName },
          'Enable DNSSEC workflow state query failed',
        );
        state = null;
      }
    }

    return {
      workflowStatus,
      runId: description.runId,
      state,
    };
  } catch (error) {
    logger.debug(
      { error, workflowId, domainName },
      'Failed to fetch enable DNSSEC workflow snapshot',
    );

    return {
      workflowStatus: 'NOT_FOUND',
      runId: null,
      state: null,
    };
  }
};

const fetchDisableDnssecWorkflowSnapshot = async (
  domainName: PunycodeDomainName,
): Promise<DisableDnssecProgressSnapshot> => {
  const workflowId = disableDnssecWorkflow.generateId({ domainName });
  const handle = temporalClient.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: WorkflowProgressState<DisableDnssecStepId> | null = null;
    const isQueryable =
      workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED';
    if (isQueryable) {
      try {
        state = await handle.query(getDisableDnssecProgressQuery);
      } catch (error) {
        logger.debug(
          { error, workflowId, domainName },
          'Disable DNSSEC workflow state query failed',
        );
        state = null;
      }
    }

    return {
      workflowStatus,
      runId: description.runId,
      state,
    };
  } catch (error) {
    logger.debug(
      { error, workflowId, domainName },
      'Failed to fetch disable DNSSEC workflow snapshot',
    );

    return {
      workflowStatus: 'NOT_FOUND',
      runId: null,
      state: null,
    };
  }
};

/**
 * Map of progress query names to their query definitions.
 * Used to dynamically query nested workflow progress.
 */
const progressQueryMap: Record<string, any> = {
  getChangeNameserversProgress: getChangeNameserversProgressQuery,
  getResetNameserversProgress: getResetNameserversProgressQuery,
  getEnableDnssecProgress: getEnableDnssecProgressQuery,
  getDisableDnssecProgress: getDisableDnssecProgressQuery,
};

/**
 * Query substeps for a step that has nested workflow info.
 * Returns the nested workflow's steps as substeps.
 */
async function queryNestedWorkflowSubsteps(
  step: WorkflowStep<string>,
): Promise<WorkflowStep<string>[] | undefined> {
  const { nestedWorkflow } = step;
  if (!nestedWorkflow) return undefined;

  const { workflowId, runId, progressQueryName } = nestedWorkflow;
  const queryDef = progressQueryMap[progressQueryName];

  if (!queryDef) {
    logger.debug(
      { progressQueryName, workflowId },
      'Unknown progress query name for nested workflow',
    );
    return undefined;
  }

  try {
    // Get handle to the nested workflow
    // For embedded workflows, workflowId and runId are the same as parent
    // For child workflows, runId may be empty - the handle will use the latest run
    const handle = temporalClient.workflow.getHandle(
      workflowId,
      runId || undefined,
    );

    // Check if the workflow is queryable
    const description = await handle.describe();
    const isQueryable =
      description.status.name === 'RUNNING' ||
      description.status.name === 'COMPLETED';

    if (!isQueryable) return undefined;

    // Query the nested workflow's progress
    const nestedState = (await handle.query(queryDef)) as
      | WorkflowProgressState<string>
      | undefined;
    return nestedState?.steps ?? undefined;
  } catch (error) {
    logger.debug(
      { error, workflowId, progressQueryName },
      'Failed to query nested workflow substeps',
    );
    return undefined;
  }
}

/**
 * Populate substeps for all steps that have nested workflow info.
 */
async function populateSubsteps<TStepId extends string>(
  state: WorkflowProgressState<TStepId>,
): Promise<WorkflowProgressState<TStepId>> {
  const stepsWithSubsteps = await Promise.all(
    state.steps.map(async (step) => {
      // Only query substeps for steps that have started and are not skipped
      // PENDING: step hasn't started yet
      // SKIPPED: step was skipped, no substeps to show
      if (
        step.status === 'PENDING' ||
        step.status === 'SKIPPED' ||
        !step.nestedWorkflow
      ) {
        return step;
      }

      const substeps = await queryNestedWorkflowSubsteps(step);
      if (substeps) {
        return { ...step, substeps };
      }
      return step;
    }),
  );

  return {
    ...state,
    steps: stepsWithSubsteps,
  };
}

/**
 * Try to get progress state from workflow memo.
 * Used as a fallback when query fails (e.g., for completed workflows).
 * @param description - The workflow description containing memo
 * @param workflowType - The workflow type to get progress for (e.g., 'enableDnssec', 'changeNameservers')
 */
function getProgressFromMemo<TStepId extends string>(
  description: { memo?: Record<string, unknown> },
  workflowType: string,
): WorkflowProgressState<TStepId> | null {
  try {
    const memo = description.memo;
    const memoKey = getProgressMemoKey(workflowType);
    if (memo && memoKey in memo) {
      return memo[memoKey] as WorkflowProgressState<TStepId>;
    }
  } catch (error) {
    logger.debug({ error }, 'Failed to read progress from memo');
  }
  return null;
}

const fetchChangeNameserversWorkflowSnapshot = async (
  domainName: PunycodeDomainName,
  workflowId?: string,
  runId?: string,
): Promise<ChangeNameserversProgressSnapshot> => {
  // Use provided workflowId or fall back to standard pattern (without brackets)
  const effectiveWorkflowId =
    workflowId ??
    changeNameserversWorkflow.generateId({
      domainName,
      nameservers: [],
    });
  const handle = temporalClient.workflow.getHandle(effectiveWorkflowId, runId);

  // Detect workflow type from the workflowId
  const isResetWorkflow = effectiveWorkflowId.startsWith('reset-nameservers-');
  const workflowType: 'change-nameservers' | 'reset-nameservers' =
    isResetWorkflow ? 'reset-nameservers' : 'change-nameservers';

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: WorkflowProgressState<
      ChangeNameserversStepId | ResetNameserversStepId
    > | null = null;

    // Try to query progress state
    const isQueryable =
      workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED';
    if (isQueryable) {
      try {
        // Query the appropriate progress query based on workflow type
        let rawState: WorkflowProgressState<
          ChangeNameserversStepId | ResetNameserversStepId
        >;
        if (isResetWorkflow) {
          rawState = await handle.query(getResetNameserversProgressQuery);
        } else {
          rawState = await handle.query(getChangeNameserversProgressQuery);
        }

        // Populate substeps from nested workflows
        state = await populateSubsteps(rawState);
      } catch (error) {
        logger.debug(
          { error, workflowId: effectiveWorkflowId, domainName, workflowType },
          'Nameservers workflow state query failed, trying memo',
        );
        // Query failed, try to read from memo (useful for completed workflows)
        const memoWorkflowType = isResetWorkflow
          ? 'resetNameservers'
          : 'changeNameservers';
        const memoState = await getProgressFromMemo<
          ChangeNameserversStepId | ResetNameserversStepId
        >(description, memoWorkflowType);
        if (memoState) {
          state = await populateSubsteps(memoState);
        }
      }
    } else {
      // Workflow is not queryable (e.g., TERMINATED, TIMED_OUT), try memo
      const memoWorkflowType = isResetWorkflow
        ? 'resetNameservers'
        : 'changeNameservers';
      const memoState = await getProgressFromMemo<
        ChangeNameserversStepId | ResetNameserversStepId
      >(description, memoWorkflowType);
      if (memoState) {
        state = await populateSubsteps(memoState);
      }
    }

    return {
      workflowStatus,
      runId: description.runId,
      state,
      workflowType,
    };
  } catch (error) {
    logger.debug(
      { error, workflowId: effectiveWorkflowId, domainName },
      'Failed to fetch nameservers workflow snapshot',
    );

    return {
      workflowStatus: 'NOT_FOUND',
      runId: null,
      state: null,
      workflowType: null,
    };
  }
};

export const dnsRecordsRouter = createTRPCRouter({
  /**
   * Get DNS records for a domain
   */
  getRecords: publicProcedure
    .input(
      z.object({
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .query(({ input }) => {
      // In a real implementation, we may want to check permissions
      // before returning records, but for DNS we might allow public reading
      return getZoneRecords(input.zoneName);
    }),

  /**
   * Add a new DNS record
   */
  createDnsRecord: protectedProcedure
    .input(createRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { zoneName } = input;

      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      return createRecord(input);
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .input(updateRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

      return updateRecord(input);
    }),

  /**
   * Delete a DNS record by ID
   */
  deleteRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(
      async ({ input: { zoneName: normalizedDomainName, id }, ctx }) => {
        await assertAuthenticatedUserIsDomainOwner(
          normalizedDomainName,
          ctx.user,
        );

        await deleteRecord(id, normalizedDomainName);

        return { success: true };
      },
    ),

  /**
   * Update multiple DNS records
   */
  updateRecords: protectedProcedure
    .input(
      z.object({
        records: z.array(updateRecordInputSchema.omit({ zoneName: true })),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { zoneName, records } = input;
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

      // First, verify that all records exist and belong to the specified domain
      const existingRecords = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          and(
            inArray(dnsRecordsTable.id, pluck('id', records)),
            eq(dnsRecordsTable.zoneName, zoneName),
          ),
        );

      if (existingRecords?.length !== records.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Some DNS records are not found or do not belong to this domain',
        });
      }
      // Validate the zone with the updated record
      await validateZone(zoneName, {
        updatedRecords: records,
      });

      const updatedRecords = await db.transaction(async (tx) => {
        const multiStatementSql = sql.join(
          records.map((record) =>
            tx
              .update(dnsRecordsTable)
              .set(pickBy(isNotNil, record))
              .where(
                and(
                  eq(dnsRecordsTable.id, record.id),
                  eq(dnsRecordsTable.zoneName, zoneName),
                ),
              )
              .returning()
              .getSQL(),
          ),
          sql`;\n`,
        );
        return tx.execute(multiStatementSql.inlineParams());
      });

      return updatedRecords;
    }),

  /**
   * Create DNS records
   */
  createRecords: protectedProcedure
    .input(
      z.object({
        records: z.array(recordSchema),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input: { zoneName, records }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      // Validate the zone with the new record
      await validateZone(zoneName, {
        addedRecords: records,
      });

      const addedRecords = await db
        .insert(dnsRecordsTable)
        .values(map(assoc('zoneName', zoneName), records))
        .returning();
      return addedRecords;
    }),

  /**
   * Delete DNS records by IDs
   */
  deleteRecords: protectedProcedure
    .input(
      z.object({
        recordsIds: z.array(z.string()),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input: { zoneName, recordsIds }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      const records = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          and(
            inArray(dnsRecordsTable.id, recordsIds),
            eq(dnsRecordsTable.zoneName, zoneName),
          ),
        );

      if (records?.length !== recordsIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Some DNS records are not found or do not belong to this domain',
        });
      }

      // Validate the zone with the deleted records
      await validateZone(zoneName, {
        deletedRecords: records,
      });

      await db
        .delete(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.zoneName, zoneName),
            inArray(dnsRecordsTable.id, recordsIds),
          ),
        );

      return { success: true };
    }),

  /**
   * Park a domain
   */
  parkDomain: protectedProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        overrideExistingRecords: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      const result = await parkDomain(
        input.normalizedDomainName,
        input.overrideExistingRecords,
      );

      return result;
    }),

  /**
   * Check if a domain is parked
   */
  isDomainParked: publicProcedure
    .input(z.object({ normalizedDomainName: namefiNormalizedDomainSchema }))
    .query(({ input }) => isDomainParked(input.normalizedDomainName)),

  /**
   * Get DNSSEC enable workflow progress for a domain.
   * Returns the current state of the workflow if running or completed.
   */
  getEnableDnssecProgress: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ ctx, input }): Promise<EnableDnssecProgressPayload> => {
      const { domainName } = input;

      await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

      // Cast to PunycodeDomainName since NamefiNormalizedDomain is compatible
      const snapshot = await fetchEnableDnssecWorkflowSnapshot(
        domainName as PunycodeDomainName,
      );

      return {
        ...snapshot,
        domainName,
        fetchedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get DNSSEC disable workflow progress for a domain.
   * Returns the current state of the workflow if running or completed.
   */
  getDisableDnssecProgress: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ ctx, input }): Promise<DisableDnssecProgressPayload> => {
      const { domainName } = input;

      await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

      // Cast to PunycodeDomainName since NamefiNormalizedDomain is compatible
      const snapshot = await fetchDisableDnssecWorkflowSnapshot(
        domainName as PunycodeDomainName,
      );

      return {
        ...snapshot,
        domainName,
        fetchedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get change nameservers workflow progress for a domain.
   * Returns the current state of the workflow if running or completed.
   * Includes substeps from embedded workflows (e.g., disable DNSSEC).
   */
  getChangeNameserversProgress: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(
      async ({ ctx, input }): Promise<ChangeNameserversProgressPayload> => {
        const { domainName } = input;

        await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

        // First, query for any active nameservers change workflow to get the correct workflowId
        // This handles both change-nameservers and reset-nameservers workflows
        const activeWorkflow = await queryActiveNameserversChangeWorkflow(
          domainName as PunycodeDomainName,
        );

        // Cast to PunycodeDomainName since NamefiNormalizedDomain is compatible
        const snapshot = await fetchChangeNameserversWorkflowSnapshot(
          domainName as PunycodeDomainName,
          activeWorkflow?.workflowId,
          activeWorkflow?.runId,
        );

        return {
          ...snapshot,
          domainName,
          fetchedAt: new Date().toISOString(),
        };
      },
    ),
});
