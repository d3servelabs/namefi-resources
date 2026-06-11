import { CHAINS_IDS, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import type {
  PreparedTxOnlySerializableParams,
  TxPrepareResult,
} from '../activities/mint/mint.activities';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared/enums';
import {
  type AlreadySentPolicy,
  staggeredSendRace,
  type StaggeredRaceRecovery,
} from '../shared/workflow-helpers/staggered-send-race';
import { makeTxAlreadySentResolver } from '../shared/workflow-helpers/tx-already-sent-gate';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  makeDoubleCommitReconciler,
  type ReconciliationPolicy,
} from './mint-double-commit-reconciliation';

interface SignAndSendOptions {
  /** Number of staggered replacement lanes (default 5). */
  maxAttempts?: number;
  /** Bounded fresh-nonce re-pins on nonce-exhaustion, case 1b (default 2). */
  maxNonceRepins?: number;
  /** Per-operation double-commit policy (case 2). Defaults to CRITICAL_ALERT. */
  reconciliation?: {
    policy: ReconciliationPolicy;
    /** AUTOFIX compensating action over the extra confirmed hashes. */
    autofix?: (extraWinners: Hash[]) => Promise<void>;
    evidenceParams?: Record<string, unknown>;
  };
  /**
   * Pre-re-pin "already sent?" policy. Idempotent ops (NFT mint/lock/burn/
   * expiration; chargeNfsc, whose `reason` calldata is an idempotency key) pass
   * 'PROCEED'. Non-idempotent ops use the default 'WAIT_FOR_ADMIN'.
   */
  alreadySentPolicy?: AlreadySentPolicy;
}

/**
 * Sends a prepared transaction using the pinned-nonce staggered-parallel race,
 * with bounded nonce re-pin recovery (1b) and per-operation double-commit
 * reconciliation (2). Signature stays backward compatible (`(tx, chainId)`).
 *
 * @see {@link staggeredSendRace}, {@link makeDoubleCommitReconciler}.
 */
async function _signAndSendTransactionWithRetry(
  tx: PreparedTxOnlySerializableParams,
  chainId: number,
  options: SignAndSendOptions = {},
) {
  const {
    maxAttempts = 5,
    maxNonceRepins = 2,
    reconciliation,
    alreadySentPolicy = 'WAIT_FOR_ADMIN',
  } = options;
  const label = `mint:${workflow.workflowInfo().workflowType}`;

  // The race orchestrates per-attempt `sendAndConfirmTxWorkflow` children that
  // proxy the mint send/confirm activities themselves (selected via signerKind);
  // here we only read the chain-aware gas bounds.
  const { getInitalGasPriceMultiplier, getMaxGasPriceMultiplier } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.MINT,
      options: {
        startToCloseTimeout: '30 seconds',
        retry: { maximumAttempts: 1 },
      },
    });

  const initialGasPriceMultiplier = await getInitalGasPriceMultiplier(chainId);
  const maxGasPriceMultiplier = await getMaxGasPriceMultiplier(chainId);

  const recovery: StaggeredRaceRecovery = {
    maxNonceRepins,
    onDoubleCommit: makeDoubleCommitReconciler({
      policy: reconciliation?.policy ?? 'CRITICAL_ALERT',
      label,
      chainId,
      autofix: reconciliation?.autofix,
      evidenceParams: reconciliation?.evidenceParams,
    }),
    alreadySentPolicy,
    onAlreadySentNeedsAdmin:
      alreadySentPolicy === 'WAIT_FOR_ADMIN'
        ? makeTxAlreadySentResolver({
            label,
            chainId,
            evidenceParams: reconciliation?.evidenceParams,
          })
        : undefined,
  };

  return staggeredSendRace({
    preparedTx: tx,
    chainId,
    label,
    signerKind: 'mint',
    config: {
      lanes: maxAttempts,
      initialGasPriceMultiplier,
      maxGasPriceMultiplier,
    },
    recovery,
  });
}

/**
 * AUTOFIX for a double NFSC mint: charge the over-minted amount back from the
 * recipient once per extra confirmed mint, with a `void tx(0x…)` reason. The
 * compensating charge runs with a non-recursive (`CRITICAL_ALERT`) policy so an
 * autofix can never recurse into another autofix.
 */
const voidNfscDoubleMint =
  (input: MintNfscInput) =>
  async (extraWinners: Hash[]): Promise<void> => {
    for (const extra of extraWinners) {
      await workflow.executeChild(chargeNfscWorkflow, {
        args: [
          input.chainId,
          input.account,
          input.amountInUsd,
          `void tx(${extra})`,
          '0x',
          'CRITICAL_ALERT',
        ],
        workflowId: `void-nfsc-double-mint-[${input.account}]-[${input.chainId}]-[${extra}]`,
        taskQueue: TEMPORAL_QUEUES.MINT,
        retry: { maximumAttempts: 1 },
      });
    }
  };

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

  // NFT mint is naturally idempotent: a duplicate tokenId reverts on-chain, so a
  // double-commit is practically impossible — alert + fail if it ever happens.
  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
    {
      alreadySentPolicy: 'PROCEED',
      reconciliation: {
        policy: 'CRITICAL_ALERT',
        evidenceParams: { domain: normalizedDomainName, to: toAddress },
      },
    },
  );
}

type MintNfscInput = {
  chainId: number;
  account: `0x${string}`;
  amountInUsd: number;
  /** Override the default double-commit policy (defaults to AUTOFIX). */
  reconciliationPolicy?: ReconciliationPolicy;
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

  // Double NFSC mint auto-fixes by charging the over-minted amount back.
  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    input.chainId,
    {
      reconciliation: {
        policy: input.reconciliationPolicy ?? 'AUTOFIX',
        autofix: voidNfscDoubleMint(input),
        evidenceParams: {
          account: input.account,
          amountInUsd: input.amountInUsd,
        },
      },
    },
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
  reconciliationPolicy: ReconciliationPolicy = 'WAIT_FOR_ADMIN',
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

  // Double charge over-deducts a user; a human decides (refund / accept / fail).
  // The `reason` calldata makes an exact-match identity reliable → PROCEED.
  return await _signAndSendTransactionWithRetry(
    prepareResult.preparedTx,
    chainId,
    {
      alreadySentPolicy: 'PROCEED',
      reconciliation: {
        policy: reconciliationPolicy,
        evidenceParams: { chargee, amountInUsd, reason },
      },
    },
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
    { alreadySentPolicy: 'PROCEED' },
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
    { alreadySentPolicy: 'PROCEED' },
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
    { alreadySentPolicy: 'PROCEED' },
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
