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
  TxSendResult,
} from '../../activities/mint/mint.activities';
import { TEMPORAL_ENUMS } from '../../shared/enums';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';

const TIMEOUT_IN_MS = 120_000;
const MAX_GAS_PRICE_MULTIPLIER = 1.25;
const GAS_PRICE_MULTIPLIER_INCREMENT = 0.05;

function incrementGasPriceMultiplier(gasPriceMultiplier: number) {
  return Math.min(
    gasPriceMultiplier + GAS_PRICE_MULTIPLIER_INCREMENT,
    MAX_GAS_PRICE_MULTIPLIER,
  );
}

async function _signAndSendX402TransactionWithRetry(
  tx: PreparedTxOnlySerializableParams,
  chainId: number,
  maxAttempts = 5,
) {
  // Use MINT queue for blockchain transactions
  const { signAndSendX402Transaction } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: TIMEOUT_IN_MS,
      retry: {
        maximumAttempts: 1, // Not using activity retry. We will retry at flow level
      },
    },
  });

  let gasPriceMultiplier = 1.05;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let sendResult: TxSendResult;
    try {
      sendResult = await signAndSendX402Transaction(
        tx,
        chainId,
        TIMEOUT_IN_MS,
        gasPriceMultiplier,
      );
    } catch (error) {
      if (error instanceof workflow.TimeoutFailure) {
        gasPriceMultiplier = incrementGasPriceMultiplier(gasPriceMultiplier);
        workflow.log.info(
          `Activity Timeout, increasing multiplier to ${gasPriceMultiplier} and retrying...`,
        );
        continue;
      }

      workflow.log.error(`Failed to sign and send transaction: ${error}`);
      await workflow.sleep('15 seconds');

      continue;
    }
    switch (sendResult.status) {
      case 'SUCCESS':
        return sendResult.txHash;
      // --------------------------------------------------------
      // -----------------Retriable errors-----------------------
      // --------------------------------------------------------
      //    Gas Increase
      case 'GAS_PRICE_TOO_LOW': //fallthrough
      case 'REPLACEMENT_UNDERPRICED': // fallthrough
        gasPriceMultiplier = incrementGasPriceMultiplier(gasPriceMultiplier);
        workflow.log.info(
          `Gas price too low, increasing multiplier to ${gasPriceMultiplier} and retrying...`,
        );
        continue;
      case 'NONCE_EXPIRED':
        workflow.log.info(
          `Transaction failed ${sendResult.status}, retrying...`,
        );
        await workflow.sleep('15 seconds');
        continue;
      default:
        throw new workflow.ApplicationFailure(
          `Sign and send transaction failed with status: ${sendResult.status} and error: ${JSON.stringify(
            sendResult.error,
          )}`,
        );
    }
  }
  throw new workflow.ApplicationFailure(
    'Max retries exceeded within x402 USDC transfer workflow',
  );
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
