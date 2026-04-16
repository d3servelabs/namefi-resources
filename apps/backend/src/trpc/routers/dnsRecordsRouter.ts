import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import { logger } from '#lib/logger';
import { queryActiveNameserversChangeWorkflow } from '#lib/domains/nameservers';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import {
  batchCreateRecords,
  batchDeleteRecords,
  batchUpdateRecords,
  createRecord,
  deleteRecord,
  getZoneRecordsWithManagedRecords,
  updateRecord,
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
import { dnsRecordsContract } from '@namefi-astra/common/dns-records-contract';
import { protectedProcedure, publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { assertAuthenticatedUserIsDomainOwner } from '../guards/assert-domain-owner';

type EnableDnssecProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<EnableDnssecStepId> | null;
};

type DisableDnssecProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<DisableDnssecStepId> | null;
};

type ChangeNameserversProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<
    ChangeNameserversStepId | ResetNameserversStepId
  > | null;
  workflowType: 'change-nameservers' | 'reset-nameservers' | null;
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

/**
 * DNS records router. The wire-shape contract (per-procedure input, output
 * and query/mutation type) lives in `dnsRecordsRouter.contract.ts`; this
 * file owns the procedure definitions including auth/middleware choices.
 *
 * `createContractTRPCRouter<typeof dnsRecordsContract>(...)` enforces — at
 * compile time — that every contract key is implemented as the right
 * procedure type and that the chained `.input()` / `.output()` schemas
 * match the contract.
 */
export const dnsRecordsRouter = createContractTRPCRouter<
  typeof dnsRecordsContract
>({
  getRecords: publicProcedure
    .input(dnsRecordsContract.getRecords.input)
    .output(dnsRecordsContract.getRecords.output)
    .query(({ input }) => getZoneRecordsWithManagedRecords(input.zoneName)),

  createDnsRecord: protectedProcedure
    .input(dnsRecordsContract.createDnsRecord.input)
    .output(dnsRecordsContract.createDnsRecord.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      return createRecord(input);
    }),

  updateRecord: protectedProcedure
    .input(dnsRecordsContract.updateRecord.input)
    .output(dnsRecordsContract.updateRecord.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      return updateRecord(input);
    }),

  deleteRecord: protectedProcedure
    .input(dnsRecordsContract.deleteRecord.input)
    .output(dnsRecordsContract.deleteRecord.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      await deleteRecord(input.id, input.zoneName);
      return { success: true as const };
    }),

  updateRecords: protectedProcedure
    .input(dnsRecordsContract.updateRecords.input)
    .output(dnsRecordsContract.updateRecords.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      return batchUpdateRecords(input.zoneName, input.records);
    }),

  createRecords: protectedProcedure
    .input(dnsRecordsContract.createRecords.input)
    .output(dnsRecordsContract.createRecords.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      return batchCreateRecords(input.zoneName, input.records);
    }),

  deleteRecords: protectedProcedure
    .input(dnsRecordsContract.deleteRecords.input)
    .output(dnsRecordsContract.deleteRecords.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      return batchDeleteRecords(input.zoneName, input.recordsIds);
    }),

  parkDomain: protectedProcedure
    .input(dnsRecordsContract.parkDomain.input)
    .output(dnsRecordsContract.parkDomain.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );
      await parkDomain(
        input.normalizedDomainName,
        input.overrideExistingRecords,
      );
      return { success: true as const };
    }),

  isDomainParked: publicProcedure
    .input(dnsRecordsContract.isDomainParked.input)
    .output(dnsRecordsContract.isDomainParked.output)
    .query(({ input }) => isDomainParked(input.normalizedDomainName)),

  getEnableDnssecProgress: protectedProcedure
    .input(dnsRecordsContract.getEnableDnssecProgress.input)
    .output(dnsRecordsContract.getEnableDnssecProgress.output)
    .query(async ({ ctx, input }) => {
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

  getDisableDnssecProgress: protectedProcedure
    .input(dnsRecordsContract.getDisableDnssecProgress.input)
    .output(dnsRecordsContract.getDisableDnssecProgress.output)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

      const snapshot = await fetchDisableDnssecWorkflowSnapshot(
        domainName as PunycodeDomainName,
      );

      return {
        ...snapshot,
        domainName,
        fetchedAt: new Date().toISOString(),
      };
    }),

  getChangeNameserversProgress: protectedProcedure
    .input(dnsRecordsContract.getChangeNameserversProgress.input)
    .output(dnsRecordsContract.getChangeNameserversProgress.output)
    .query(async ({ ctx, input }) => {
      const { domainName } = input;
      await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

      // First, query for any active nameservers change workflow to get the
      // correct workflowId — this handles both change-nameservers and
      // reset-nameservers workflows.
      const activeWorkflow = await queryActiveNameserversChangeWorkflow(
        domainName as PunycodeDomainName,
      );

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
    }),
});
