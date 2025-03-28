import * as workflow from '@temporalio/workflow';
import type {
  MoneyAmount,
  PreparedTxOnlySerializableParams,
  TxPrepareResult,
  TxSendResult,
} from '../activities/mint.activities';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

const TIMEOUT_IN_MS = 120_000;
const MAX_GAS_PRICE_MULTIPLIER = 1.25;
const GAS_PRICE_MULTIPLIER_INCREMENT = 0.05;

function incrementGasPriceMultiplier(gasPriceMultiplier: number) {
  return Math.min(
    gasPriceMultiplier + GAS_PRICE_MULTIPLIER_INCREMENT,
    MAX_GAS_PRICE_MULTIPLIER,
  );
}

async function _signAndSendTransactionWithRetry(
  tx: PreparedTxOnlySerializableParams,
  chainId: number,
  maxAttempts = 5,
) {
  const { signAndSendTransaction } = typedProxyActivities({
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
      sendResult = await signAndSendTransaction(
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
        // TODO(Victor): use sentio.xyz to simulate the error and get the reason. NFI-2934
        throw new workflow.ApplicationFailure(
          `Sign and send transaction failed with status: ${sendResult.status} and error: ${JSON.stringify(
            sendResult.error,
          )}`,
        );
    }
  }
  throw new workflow.ApplicationFailure(
    'Max retries exceeded within mintNfsc workflow',
  );
}

export async function mintNamefiNFT({
  chainId,
  toAddress,
  domainNameLdh,
  expirationTimeInUnix,
}: {
  chainId: number;
  toAddress: `0x${string}`;
  domainNameLdh: string;
  expirationTimeInUnix: number;
}): Promise<string> {
  const { prepareTxToMintNamefiNft } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const prepareResult: TxPrepareResult = await prepareTxToMintNamefiNft(
    chainId,
    toAddress,
    domainNameLdh,
    expirationTimeInUnix,
  );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare transaction: ${prepareResult.error.message}`,
    );
  }

  // For gas price too low issues
  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
  );
}

export async function mintNfsc(
  chainId: number,
  account: `0x${string}`,
  namefiMoneyAmount: MoneyAmount,
): Promise<string> {
  const { prepareTxToMintNfsc } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const prepareResult: TxPrepareResult = await prepareTxToMintNfsc(
    chainId,
    account,
    namefiMoneyAmount,
  );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare transaction: ${prepareResult.error.message}`,
    );
  }

  // For gas price too low issues
  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
  );
}

export async function chargeNfscWorkflow(
  chainId: number,
  chargee: `0x${string}`,
  namefiMoneyAmount: MoneyAmount,
  reason: string,
  extra: `0x${string}`,
): Promise<string> {
  const { prepareTxToChargeNfsc } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const prepareResult: TxPrepareResult = await prepareTxToChargeNfsc(
    chainId,
    chargee,
    namefiMoneyAmount,
    reason,
    extra,
  );

  if ('error' in prepareResult) {
    throw workflow.ApplicationFailure.create({
      message: `Failed to prepare transaction: ${prepareResult.error.message}`,
    });
  }

  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
  );
}
