import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { preNftTx } from '../shared/workflow-helpers/pre-nft-tx';
import { awaitInFlightNftTxIndexedThenDelete } from '../shared/workflow-helpers/await-in-flight-nft-tx-indexed';
import { mintNamefiNFT, setExpirationForNamefiNft } from './mint.workflow';

export type OptimisticMintNamefiNftWorkflowInput = {
  chainId: number;
  toAddress: `0x${string}`;
  normalizedDomainName: NamefiNormalizedDomain;
  expirationTimeInSeconds: number;
  /** Optional order linkage so the resolved mint tx is recorded on the item. */
  orderId?: string;
  orderItemId?: string;
};

/**
 * Background wrapper that mints a Namefi NFT non-blocking. Started as an ABANDON
 * child by `acquireDomainWorkflow` (traditional domains only) so the registrar
 * flow / order completes immediately while the on-chain mint runs here. Inserts
 * the optimistic MINTING row up front (via `preNftTx`), mints, records the
 * deferred order mint tx, triggers an index sync, then runs the per-op timer.
 */
export async function optimisticMintNamefiNftWorkflow(
  input: OptimisticMintNamefiNftWorkflowInput,
): Promise<void> {
  const { getConfig, recordOrderMintTransaction } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });
  const { triggerSyncPonderIndex } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: { ...shortRunningOpts },
  });

  const { orderId, orderItemId } = input;

  const { id } = await preNftTx(
    'MINTING',
    {
      chainId: input.chainId,
      normalizedDomainName: input.normalizedDomainName,
      ownerAddress: input.toAddress,
      expirationTimeInSeconds: input.expirationTimeInSeconds,
      isLocked: false,
    },
    () =>
      workflow.executeChild(mintNamefiNFT, {
        taskQueue: TEMPORAL_QUEUES.MINT,
        args: [
          {
            chainId: input.chainId,
            toAddress: input.toAddress,
            normalizedDomainName: input.normalizedDomainName,
            expirationTimeInSeconds: input.expirationTimeInSeconds,
          },
        ],
        workflowId: `mint-namefi-nft-${input.normalizedDomainName}`,
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      }),
    // Deferred action: record the mint tx on the order item once it's known.
    orderId && orderItemId
      ? {
          onConfirmed: (txHash) =>
            recordOrderMintTransaction({ orderId, orderItemId, txHash }),
        }
      : undefined,
  );

  // Prompt the indexer so reconciliation can remove the optimistic row as soon
  // as the real NFT row lands (best-effort; mirrors the old acquire behavior).
  const isManagedIndexEnabled = await getConfig('PONDER_INDEXER_URL');
  if (isManagedIndexEnabled) {
    await catchAndAlertLocally(triggerSyncPonderIndex, {
      message:
        'Failed to trigger Ponder index sync after deferred mint completed',
      details: {
        normalizedDomainName: input.normalizedDomainName,
        workflowId: workflow.workflowInfo().workflowId,
      },
    });
  }

  // Per-op cleanup: poll until the mint is reflected in the index (overlay drops
  // it / reconciliation removes the row), then delete — instead of a flat 2-day
  // wait. Reconciliation/sweep are the other safety nets; the 2-day insert TTL is
  // the ultimate backstop for an op that never gets indexed.
  await awaitInFlightNftTxIndexedThenDelete({
    id,
    normalizedDomainName: input.normalizedDomainName,
  });
}

optimisticMintNamefiNftWorkflow.generateId = (input: {
  normalizedDomainName: NamefiNormalizedDomain;
}) => `optimistic-mint-nft-${input.normalizedDomainName}`;

export type OptimisticSetExpirationWorkflowInput = {
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  expirationTimeInSeconds: number;
  /** Optional order linkage so the resolved extend tx is recorded on the item. */
  orderId?: string;
  orderItemId?: string;
};

/**
 * Background wrapper that updates a Namefi NFT's expiration non-blocking. Started
 * as an ABANDON child by `extendDomainRegistrationWorkflow` so the renewal flow
 * returns as soon as the registrar extension succeeds, while the on-chain
 * expiration update runs here behind an optimistic CHANGING_EXPIRATION overlay.
 */
export async function optimisticSetExpirationForNamefiNftWorkflow(
  input: OptimisticSetExpirationWorkflowInput,
): Promise<void> {
  const { recordOrderExtendTransaction } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  const { orderId, orderItemId } = input;

  const { id } = await preNftTx(
    'CHANGING_EXPIRATION',
    {
      chainId: input.chainId,
      normalizedDomainName: input.normalizedDomainName,
      expirationTimeInSeconds: input.expirationTimeInSeconds,
    },
    () =>
      workflow.executeChild(setExpirationForNamefiNft, {
        taskQueue: TEMPORAL_QUEUES.MINT,
        workflowId: `set-expiration-for-namefi-nft-${input.normalizedDomainName}-${input.chainId}-${input.expirationTimeInSeconds}`,
        args: [
          input.chainId,
          input.normalizedDomainName,
          input.expirationTimeInSeconds,
        ],
        retry: { maximumAttempts: 5 },
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      }),
    // Deferred action: record the extend tx on the order item once it's known.
    orderId && orderItemId
      ? {
          onConfirmed: (txHash) =>
            recordOrderExtendTransaction({ orderId, orderItemId, txHash }),
        }
      : undefined,
  );

  // Poll until the expiration change is reflected in the index, then delete the
  // optimistic row (instead of a flat 2-day wait). See the mint wrapper above.
  await awaitInFlightNftTxIndexedThenDelete({
    id,
    normalizedDomainName: input.normalizedDomainName,
  });
}

optimisticSetExpirationForNamefiNftWorkflow.generateId = (input: {
  normalizedDomainName: NamefiNormalizedDomain;
  chainId: number;
  expirationTimeInSeconds: number;
}) =>
  `optimistic-set-expiration-nft-${input.normalizedDomainName}-${input.chainId}-${input.expirationTimeInSeconds}`;
