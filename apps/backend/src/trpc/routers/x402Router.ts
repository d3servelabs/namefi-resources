import { x402Contract } from '@namefi-astra/common/contract/x402-contract';
import { publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { temporalClient } from '../../temporal/client';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import {
  getX402PurchaseProgressQuery,
  type X402PurchaseStepId,
} from '../../temporal/workflows/x402/process-x402-purchase.workflow';
import {
  getOrderProgressQuery,
  type ProcessOrderWorkflowPublicState,
} from '../../temporal/workflows/processOrder.workflow';
import {
  getProgressMemoKey,
  type WorkflowProgressState,
  type WorkflowStep,
} from '../../temporal/shared/workflow-helpers/workflow-progress';
import { db } from '@namefi-astra/db';
import { x402PurchasesTable } from '@namefi-astra/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '#lib/logger';

type X402PurchaseProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<X402PurchaseStepId> | null;
};

type X402PurchaseProgressPayload = X402PurchaseProgressSnapshot & {
  purchaseId: string;
  domain: string | null;
  purchaseStatus: string | null;
  buyerWallet: string | null;
  amountInUsdCents: number | null;
  network: string | null;
  settlementTxHash: string | null;
  orderId: string | null;
  fetchedAt: string;
};

/**
 * Convert ProcessOrderWorkflowPublicState.steps to WorkflowStep format for substeps.
 */
function convertOrderStepsToSubsteps(
  orderState: ProcessOrderWorkflowPublicState | null,
): WorkflowStep<string>[] | undefined {
  if (!orderState) return undefined;
  return orderState.steps.map((step) => ({
    id: step.id,
    status: step.status,
    message: step.message,
    startedAt: step.startedAt,
    completedAt: step.completedAt,
  }));
}

/**
 * Query substeps for the processing-order step from processOrderWorkflow.
 */
async function queryOrderSubsteps(
  step: WorkflowStep<X402PurchaseStepId>,
): Promise<WorkflowStep<string>[] | undefined> {
  const { nestedWorkflow } = step;
  if (!nestedWorkflow) return undefined;

  try {
    const handle = temporalClient.workflow.getHandle(
      nestedWorkflow.workflowId,
      nestedWorkflow.runId || undefined,
    );
    const description = await handle.describe();
    const isQueryable =
      description.status.name === 'RUNNING' ||
      description.status.name === 'COMPLETED';

    if (!isQueryable) return undefined;

    const orderState = await handle.query(getOrderProgressQuery);
    return convertOrderStepsToSubsteps(orderState);
  } catch (error) {
    logger.debug(
      { error, workflowId: nestedWorkflow.workflowId },
      'Failed to query order substeps',
    );
    return undefined;
  }
}

/**
 * Populate substeps for the processing-order step.
 */
async function populateOrderSubsteps(
  state: WorkflowProgressState<X402PurchaseStepId>,
): Promise<WorkflowProgressState<X402PurchaseStepId>> {
  const stepsWithSubsteps = await Promise.all(
    state.steps.map(async (step) => {
      if (
        step.id !== 'processing-order' ||
        step.status === 'PENDING' ||
        step.status === 'SKIPPED' ||
        !step.nestedWorkflow
      ) {
        return step;
      }

      const substeps = await queryOrderSubsteps(step);
      return substeps ? { ...step, substeps } : step;
    }),
  );

  return { ...state, steps: stepsWithSubsteps };
}

/**
 * Try to get progress state from workflow memo.
 */
function getProgressFromMemo(description: {
  memo?: Record<string, unknown>;
}): WorkflowProgressState<X402PurchaseStepId> | null {
  try {
    const memo = description.memo;
    const memoKey = getProgressMemoKey('x402Purchase');
    if (memo && memoKey in memo) {
      return memo[memoKey] as WorkflowProgressState<X402PurchaseStepId>;
    }
  } catch (error) {
    logger.debug({ error }, 'Failed to read x402 progress from memo');
  }
  return null;
}

const fetchX402PurchaseWorkflowSnapshot = async (
  purchaseId: string,
): Promise<X402PurchaseProgressSnapshot> => {
  const workflowId = `x402-purchase-[${purchaseId}]`;
  const handle = temporalClient.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: WorkflowProgressState<X402PurchaseStepId> | null = null;

    const isQueryable =
      workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED';
    if (isQueryable) {
      try {
        const rawState = await handle.query(getX402PurchaseProgressQuery);
        state = await populateOrderSubsteps(rawState);
      } catch (error) {
        logger.debug(
          { error, workflowId, purchaseId },
          'x402 purchase workflow state query failed, trying memo',
        );
        const memoState = getProgressFromMemo(description);
        if (memoState) {
          state = await populateOrderSubsteps(memoState);
        }
      }
    } else {
      // Workflow not queryable, try memo
      const memoState = getProgressFromMemo(description);
      if (memoState) {
        state = await populateOrderSubsteps(memoState);
      }
    }

    return {
      workflowStatus,
      runId: description.runId,
      state,
    };
  } catch (error) {
    logger.debug(
      { error, workflowId, purchaseId },
      'Failed to fetch x402 purchase workflow snapshot',
    );

    return {
      workflowStatus: 'NOT_FOUND',
      runId: null,
      state: null,
    };
  }
};

export const x402Router = createContractTRPCRouter<typeof x402Contract>({
  /**
   * Get x402 purchase workflow progress.
   * Public endpoint - anyone with the purchaseId can check status.
   */
  getX402PurchaseProgress: publicProcedure
    .input(x402Contract.getX402PurchaseProgress.input)
    .output(x402Contract.getX402PurchaseProgress.output)
    .query(async ({ input }): Promise<X402PurchaseProgressPayload> => {
      const purchase = await db.query.x402PurchasesTable.findFirst({
        where: eq(x402PurchasesTable.id, input.purchaseId),
      });

      if (!purchase) {
        return {
          workflowStatus: 'NOT_FOUND',
          runId: null,
          state: null,
          purchaseId: input.purchaseId,
          domain: null,
          purchaseStatus: null,
          buyerWallet: null,
          amountInUsdCents: null,
          network: null,
          settlementTxHash: null,
          orderId: null,
          fetchedAt: new Date().toISOString(),
        };
      }

      const snapshot = await fetchX402PurchaseWorkflowSnapshot(
        input.purchaseId,
      );

      return {
        ...snapshot,
        purchaseId: input.purchaseId,
        domain: purchase.normalizedDomainName,
        purchaseStatus: purchase.status,
        buyerWallet: purchase.buyerWalletAddress,
        amountInUsdCents: purchase.amountInUSDCents,
        network: purchase.network,
        settlementTxHash: purchase.settlementTxHash,
        orderId: purchase.orderId,
        fetchedAt: new Date().toISOString(),
      };
    }),
});
