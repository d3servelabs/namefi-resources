/**
 * x402 USDC Transfer Workflow
 *
 * Handles USDC transfers for x402 refunds with retry logic for gas price issues.
 * Follows the same pattern as mint.workflow.ts for transaction handling.
 */

import * as workflow from '@temporalio/workflow';
import type {
  PreparedTxOnlySerializableParams,
  TxPrepareResult,
} from '../../activities/mint/mint.activities';
import { TEMPORAL_ENUMS } from '../../shared/enums';
import { shortRunningOpts } from '../../shared';
import { staggeredSendRace } from '../../shared/workflow-helpers/staggered-send-race';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { makeDoubleCommitReconciler } from '../mint-double-commit-reconciliation';

/**
 * Sends a prepared USDC transfer using the pinned-nonce staggered-parallel race,
 * with bounded nonce re-pin recovery (1b) and admin-gated double-commit
 * reconciliation (2) — a double USDC refund moves money out, so a human decides.
 *
 * Same idempotency guarantee as the mint path: one pinned nonce reused across
 * escalating-gas replacements, so the chain mines at most one. See
 * {@link staggeredSendRace}. Signature preserved for existing callers.
 */
async function _signAndSendX402TransactionWithRetry(
  tx: PreparedTxOnlySerializableParams,
  chainId: number,
  maxAttempts = 5,
) {
  const { getX402SignerNonce, sendX402PreparedTransaction } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.MINT,
      options: {
        startToCloseTimeout: '30 seconds',
        retry: { maximumAttempts: 1 },
      },
    });
  const { getX402TransactionConfirmation } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  return staggeredSendRace({
    preparedTx: tx,
    chainId,
    label: 'x402-usdc-transfer',
    activities: {
      getSignerNonce: getX402SignerNonce,
      sendPreparedTransaction: sendX402PreparedTransaction,
      getTransactionConfirmation: getX402TransactionConfirmation,
    },
    config: {
      lanes: maxAttempts,
      initialGasPriceMultiplier: 1.05,
      maxGasPriceMultiplier: 1.2,
    },
    recovery: {
      maxNonceRepins: 2,
      onDoubleCommit: makeDoubleCommitReconciler({
        policy: 'WAIT_FOR_ADMIN',
        label: 'x402-usdc-transfer',
        chainId,
      }),
    },
  });
}

export interface TransferUsdcX402Input {
  chainId: number;
  toAddress: `0x${string}`;
  amountInUsdCents: number;
}

/**
 * Transfer USDC for x402 refund
 *
 * Prepares and sends a USDC transfer transaction with retry logic
 * for handling gas price issues.
 *
 * @param input - Transfer parameters
 * @returns Transaction hash
 */
export async function transferUsdcX402Workflow(
  input: TransferUsdcX402Input,
): Promise<string> {
  const { prepareTxToTransferUsdc } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const prepareResult: TxPrepareResult = await prepareTxToTransferUsdc(
    input.chainId,
    input.toAddress,
    input.amountInUsdCents,
  );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare USDC transfer transaction: ${prepareResult.error.message}`,
    );
  }

  return await _signAndSendX402TransactionWithRetry(
    prepareResult.preparedTx,
    input.chainId,
  );
}

transferUsdcX402Workflow.generateId = (input: TransferUsdcX402Input) => {
  return `transfer-usdc-x402-[${input.toAddress}]-[${input.chainId}]-[${input.amountInUsdCents}]`;
};
