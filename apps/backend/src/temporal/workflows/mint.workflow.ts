import { CHAINS_IDS, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import type {
  PreparedTxOnlySerializableParams,
  TxPrepareResult,
} from '../activities/mint/mint.activities';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { shortRunningOpts } from '../shared';
import { staggeredSendRace } from '../shared/workflow-helpers/staggered-send-race';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

/**
 * Sends a prepared transaction using the pinned-nonce staggered-parallel race.
 *
 * Splits sign+send from wait/confirm and reuses ONE nonce for every escalating-gas
 * replacement, so the chain can mine at most one — no double-mint. See
 * {@link staggeredSendRace}. Signature is preserved for all existing callers.
 */
async function _signAndSendTransactionWithRetry(
  tx: PreparedTxOnlySerializableParams,
  chainId: number,
  maxAttempts = 5,
) {
  const {
    getSignerNonce,
    sendPreparedTransaction,
    getInitalGasPriceMultiplier,
    getMaxGasPriceMultiplier,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: { maximumAttempts: 1 },
    },
  });
  const { getTransactionConfirmation } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  const initialGasPriceMultiplier = await getInitalGasPriceMultiplier(chainId);
  const maxGasPriceMultiplier = await getMaxGasPriceMultiplier(chainId);

  return staggeredSendRace({
    preparedTx: tx,
    chainId,
    label: `mint:${workflow.workflowInfo().workflowType}`,
    activities: {
      getSignerNonce,
      sendPreparedTransaction,
      getTransactionConfirmation,
    },
    config: {
      lanes: maxAttempts,
      initialGasPriceMultiplier,
      maxGasPriceMultiplier,
    },
  });
}

export async function mintNamefiNFT({
  chainId,
  toAddress,
  normalizedDomainName,
  expirationTimeInSeconds,
}: {
  chainId: number;
  toAddress: `0x${string}`;
  normalizedDomainName: NamefiNormalizedDomain;
  expirationTimeInSeconds: number;
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
    normalizedDomainName,
    expirationTimeInSeconds,
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

type MintNfscInput = {
  chainId: number;
  account: `0x${string}`;
  amountInUsd: number;
};
export async function mintNfsc(input: MintNfscInput): Promise<string> {
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
    input.chainId,
    input.account,
    input.amountInUsd,
  );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare transaction: ${prepareResult.error.message}`,
    );
  }

  // For gas price too low issues
  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    input.chainId,
  );
}

mintNfsc.generateId = (input: MintNfscInput) => {
  return `mint-nfsc-[${input.account}]-[${input.chainId}]-[${input.amountInUsd}]`;
};

export async function chargeNfscWorkflow(
  chainId: number,
  chargee: `0x${string}`,
  amountInUsd: number,
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
    amountInUsd,
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

export async function setExpirationForNamefiNft(
  chainId: number,
  domainNameLdh: string,
  expirationTimeInUnix: number,
): Promise<string> {
  const { prepareTxToSetExpirationForNamefiNft } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const prepareResult: TxPrepareResult =
    await prepareTxToSetExpirationForNamefiNft(
      chainId,
      domainNameLdh,
      expirationTimeInUnix,
    );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare transaction: ${prepareResult.error.message}`,
    );
  }

  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
  );
}

export async function lockNamefiNftByName({
  chainId,
  domainName,
}: {
  chainId: number;
  domainName: NamefiNormalizedDomain;
}): Promise<string> {
  const { prepareTxToLockNamefiNftByName } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const prepareResult: TxPrepareResult = await prepareTxToLockNamefiNftByName(
    chainId,
    domainName,
  );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare transaction: ${prepareResult.error.message}`,
    );
  }

  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
  );
}
lockNamefiNftByName.generateId = (input: {
  domainName: NamefiNormalizedDomain;
  chainId: number;
}) => {
  return `lock-namefi-nft-${input.chainId}-${input.domainName}`;
};

export async function burnNftByName({
  chainId,
  domainName,
}: {
  chainId: number;
  domainName: NamefiNormalizedDomain;
}): Promise<string> {
  const { prepareTxToBurnNamefiNftByName, getNamefiNftLock } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.MINT,
      options: {
        startToCloseTimeout: '5 seconds',
        retry: {
          maximumAttempts: 1,
        },
      },
    });

  const isLocked = await getNamefiNftLock(chainId, domainName);
  if (!isLocked) {
    throw workflow.ApplicationFailure.create({
      message: `NFT is not locked: ${domainName}, TX will fail`,
      nonRetryable: true,
    });
  }

  const prepareResult: TxPrepareResult = await prepareTxToBurnNamefiNftByName(
    chainId,
    domainName,
  );

  if ('error' in prepareResult) {
    throw new workflow.ApplicationFailure(
      `Failed to prepare transaction: ${prepareResult.error.message}`,
    );
  }

  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
  );
}
burnNftByName.generateId = (input: {
  domainName: NamefiNormalizedDomain;
  chainId: number;
}) => {
  return `burn-namefi-nft-${input.chainId}-${input.domainName}`;
};

export async function ensureNftIsLockedAndBurnByNftName({
  chainId,
  domainName,
}: {
  chainId: number;
  domainName: NamefiNormalizedDomain;
}): Promise<string> {
  const { getNamefiNftLock } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '5 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });
  const isLocked = await getNamefiNftLock(chainId, domainName);
  if (!isLocked) {
    await lockNamefiNftByName({ chainId, domainName });
  }
  return await burnNftByName({ chainId, domainName });
}

ensureNftIsLockedAndBurnByNftName.generateId = (input: {
  domainName: NamefiNormalizedDomain;
  chainId: number;
}) => {
  return `burn-namefi-nft-[${input.chainId}]-[${input.domainName}]`;
};

ensureNftIsLockedAndBurnByNftName.attemptParseId = (id: string) => {
  const parsedWorkflowId =
    /burn-namefi-nft-\[?(?<chainId>\d+)\]?-\[?(?<domainName>.+)\]?/.exec(id);
  if (parsedWorkflowId) {
    const chainId = Number.parseInt(parsedWorkflowId.groups?.chainId || '0');
    if (!Number.isSafeInteger(chainId) || !CHAINS_IDS.includes(chainId)) {
      return null;
    }
    return {
      chainId,
      normalizedDomainName: parsedWorkflowId.groups?.domainName || '',
    };
  }
  return null;
};
