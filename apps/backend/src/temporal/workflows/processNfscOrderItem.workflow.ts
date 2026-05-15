import { orderStatusSchema } from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { resolve } from '../../utils/resolve';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { mintNfsc } from './mint.workflow';

export interface ProcessNfscOrderItemWorkflowInput {
  orderId: string;
  nfscItemId: string;
  userId: string;
  chainId: number;
  recipientWalletAddress: `0x${string}`;
  /** NFSC token amount to mint, as a decimal string (1 USD = 1 NFSC). */
  nfscAmount: string;
  /** Amount charged for this item, in USD cents. */
  amountInUsdCents: number;
}

/**
 * Tolerance for comparing NFSC balances read on-chain (an 18-decimal token
 * formatted into a JS `number`), so exact equality is unsafe.
 */
const NFSC_BALANCE_EPSILON = 1e-9;

/**
 * Process a single NFSC top-up order item:
 * 1. read the recipient wallet's on-chain NFSC balance (before),
 * 2. mint the NFSC via the existing `mintNfsc` workflow,
 * 3. record the mint transaction hash,
 * 4. read the balance again (after),
 * 5. reconcile the observed delta against the minted amount — netting out
 *    concurrent NFSC mints/charges/refunds on the same wallet+chain — and, if
 *    the discrepancy is unexplained, raise a critical alert to Namefi.
 *
 * The mint transaction is confirmed on-chain before reconciliation runs, so an
 * anomaly is an observability concern: it alerts but never fails the item.
 * Balance-read failures are best-effort and never fail the item either.
 */
export async function processNfscOrderItemWorkflow(
  input: ProcessNfscOrderItemWorkflowInput,
): Promise<void> {
  const { orderId, nfscItemId, userId, chainId, recipientWalletAddress } =
    input;
  const expectedDelta = Number(input.nfscAmount);

  // Balance reads run on the MINT queue (on-chain read). Retried, but
  // best-effort: a failure must not fail the order.
  const { getNfscBalanceInUSD } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: { maximumAttempts: 3 },
    },
  });

  // DB writes, reconciliation and alerting run on the DEFAULT queue.
  const {
    updateOrderNfscItemStatusOrThrow,
    recordNfscMintTransaction,
    reconcileNfscMint,
    criticalAlertNamefi,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  try {
    // Marks the item PROCESSING and anchors the reconciliation window's lower
    // bound (via `started_at`).
    const [markProcessingError] = await resolve(
      updateOrderNfscItemStatusOrThrow({
        nfscItemId,
        status: orderStatusSchema.enum.PROCESSING,
      }),
    );
    if (markProcessingError) {
      throw markProcessingError;
    }

    // 1. Before balance — best-effort.
    const [beforeError, balanceBeforeValue] = await resolve(
      getNfscBalanceInUSD(chainId, recipientWalletAddress),
    );
    const balanceBefore = beforeError ? null : balanceBeforeValue;
    if (beforeError) {
      workflow.log.warn(
        `NFSC balance read (before) failed for item ${nfscItemId}: ${
          beforeError instanceof Error
            ? beforeError.message
            : String(beforeError)
        }`,
      );
    }

    // 2. Mint. Explicit, collision-safe workflow id keyed by the order item —
    // `mintNfsc.generateId` collides for identical (account, chainId, amount).
    const mintTxHash = await workflow.executeChild(mintNfsc, {
      args: [
        {
          chainId,
          account: recipientWalletAddress,
          amountInUsd: expectedDelta,
        },
      ],
      workflowId: `mint-nfsc-order-item-[${nfscItemId}]`,
      taskQueue: TEMPORAL_QUEUES.MINT,
      retry: { maximumAttempts: 1 },
      workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
      parentClosePolicy: 'REQUEST_CANCEL',
    });

    // 3. Record the mint transaction — best-effort; alert but do not fail.
    const [recordError] = await resolve(
      recordNfscMintTransaction({ orderId, nfscItemId, txHash: mintTxHash }),
    );
    if (recordError) {
      await criticalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        title: 'Failed to record NFSC mint transaction',
        message: `Failed to record NFSC mint transaction metadata for item ${nfscItemId}`,
        operation: 'PROCESS_NFSC_ORDER_ITEM',
        extraData: { orderId, nfscItemId, mintTxHash },
        error:
          recordError instanceof Error
            ? recordError.message
            : String(recordError),
      });
    }

    // 4. After balance — best-effort.
    const [afterError, balanceAfterValue] = await resolve(
      getNfscBalanceInUSD(chainId, recipientWalletAddress),
    );
    const balanceAfter = afterError ? null : balanceAfterValue;
    if (afterError) {
      workflow.log.warn(
        `NFSC balance read (after) failed for item ${nfscItemId}: ${
          afterError instanceof Error ? afterError.message : String(afterError)
        }`,
      );
    }

    // 5. Reconcile — only when both balance reads succeeded.
    if (balanceBefore !== null && balanceAfter !== null) {
      const actualDelta = balanceAfter - balanceBefore;
      if (Math.abs(actualDelta - expectedDelta) <= NFSC_BALANCE_EPSILON) {
        workflow.log.info('NFSC mint balance check OK', {
          nfscItemId,
          expectedDelta,
          actualDelta,
        });
      } else {
        // Candidate anomaly — let the activity try to justify it against
        // concurrent NFSC activity on the same wallet+chain.
        const reconciliation = await reconcileNfscMint({
          orderId,
          nfscItemId,
          chainId,
          recipientWalletAddress,
          expectedDelta,
          actualDelta,
          balanceBefore,
          balanceAfter,
        });

        if (reconciliation.outcome === 'UNJUSTIFIED_ANOMALY') {
          // Alert Namefi, but never fail the item — the mint tx confirmed
          // on-chain. catchAndAlertLocally guards against the alert itself
          // throwing.
          await catchAndAlertLocally(
            async () => {
              await criticalAlertNamefi(
                {
                  workflowInfo: workflow.workflowInfo(),
                  title: 'Unjustified NFSC mint balance anomaly',
                  message:
                    `NFSC mint for item ${nfscItemId} produced an unexplained ` +
                    `balance delta: expected ${expectedDelta}, observed ${actualDelta}, ` +
                    `unexplained ${reconciliation.unexplainedDelta}.`,
                  operation: 'PROCESS_NFSC_ORDER_ITEM',
                  extraData: {
                    orderId,
                    nfscItemId,
                    userId,
                    chainId,
                    recipientWalletAddress,
                    mintTxHash,
                    reconciliation,
                  },
                  error: 'NFSC mint balance anomaly could not be reconciled',
                },
                { incidentPriority: 1 },
              );
            },
            {
              message: `Failed to emit NFSC anomaly alert for item ${nfscItemId}`,
              details: { orderId, nfscItemId },
            },
          );
        } else {
          workflow.log.info('NFSC mint balance anomaly reconciled', {
            nfscItemId,
            outcome: reconciliation.outcome,
            unexplainedDelta: reconciliation.unexplainedDelta,
          });
        }
      }
    } else {
      workflow.log.warn(
        `NFSC mint reconciliation skipped for item ${nfscItemId}: a balance read failed (best-effort)`,
      );
    }

    // 6. Mark the item SUCCEEDED — the mint confirmed on-chain regardless of
    // the reconciliation outcome.
    const [markSucceededError] = await resolve(
      updateOrderNfscItemStatusOrThrow({
        nfscItemId,
        status: orderStatusSchema.enum.SUCCEEDED,
      }),
    );
    if (markSucceededError) {
      throw markSucceededError;
    }
  } catch (e) {
    workflow.log.error(
      `Failed to process NFSC order item ${nfscItemId} for order ${orderId}: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );

    const [markFailedError] = await resolve(
      updateOrderNfscItemStatusOrThrow({
        nfscItemId,
        status: orderStatusSchema.enum.FAILED,
      }),
    );
    if (markFailedError) {
      workflow.log.error(
        `Failed to update NFSC order item ${nfscItemId} status to ${orderStatusSchema.enum.FAILED}: ${
          markFailedError instanceof Error
            ? markFailedError.message
            : String(markFailedError)
        }`,
      );
    }

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Process NFSC Order Item Failed: ${
        e instanceof Error ? e.message : String(e)
      }`,
      cause: e instanceof Error ? e : new Error(String(e)),
    });
  }
}
