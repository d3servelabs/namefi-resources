import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
// NOTE: workflow code — only `import type` from `@namefi-astra/db` (erased at
// compile time). A value import would pull the DB client + env into the
// deterministic workflow bundle. Mirrors `PENDING_NFT_TX_HASH_PLACEHOLDER` in
// `packages/db/src/schemas/onchain-indexers/namefi-nft-with-pending.ts`.
import type { InFlightNftChangeType } from '@namefi-astra/db/schemas/managed-indexer-data';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { catchAndAlertLocally } from './catch-and-alert-locally';
import { typedProxyActivities } from './typed-proxy-activities';

/** Placeholder tx hash used when an op resolves without a string hash. */
const PENDING_NFT_TX_HASH_PLACEHOLDER = '0x0';

/**
 * The optimistic NFT state an in-flight operation expects to produce. Only the
 * field(s) the `changeType` owns need to be set; the rest fall through to the
 * real NFT row in the overlay.
 */
export type PreNftTxExpectedState = {
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  /** MINTING: the recipient of the new NFT. */
  ownerAddress?: string | null;
  /** MINTING + CHANGING_EXPIRATION. */
  expirationTimeInSeconds?: number | null;
  /** MINTING (false) + CHANGING_LOCK. */
  isLocked?: boolean | null;
};

export type PreNftTxOptions<T> = {
  /**
   * Best-effort deferred follow-up run after the op confirms — e.g. record the
   * resolved tx hash on an order item (mintTxHash for register/import,
   * extendTxHash for renew). Receives the op's result (the tx hash for our
   * mint/expiration/lock ops). Failures are alerted but never fail the operation.
   */
  onConfirmed?: (result: T) => Promise<unknown>;
};

/**
 * Wrap a deferred on-chain NFT operation with an optimistic in-flight overlay.
 *
 * 1. Inserts an in-flight row (PENDING) so the app immediately shows the expected
 *    state ("Minting…", "Updating expiration…", "Updating lock…").
 * 2. Runs `op()` (typically `executeChild(mintNamefiNFT|setExpiration|lock)`).
 * 3. On success: marks the row CONFIRMED with the real tx hash and runs the
 *    optional `onConfirmed` deferred action (e.g. recording the tx on an order
 *    item) best-effort.
 * 4. On failure: marks the row FAILED (it drops out of the overlay) and alerts,
 *    then re-throws so the wrapping workflow surfaces the failure.
 *
 * It deliberately does NOT do the per-op TTL delete — that lives in the ABANDON
 * wrapper workflows (so the 2-day timer survives the parent).
 *
 * Must be called inside a Temporal workflow. `onConfirmed` runs in the same
 * workflow context, so it can close over the caller's serializable inputs
 * (orderId/orderItemId) and call any proxied activity.
 */
export async function preNftTx<T>(
  changeType: InFlightNftChangeType,
  expected: PreNftTxExpectedState,
  op: () => Promise<T>,
  options?: PreNftTxOptions<T>,
): Promise<{ id: string; result: T }> {
  const {
    insertInFlightNftTxRow,
    markInFlightNftTxConfirmed,
    markInFlightNftTxFailed,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: { ...shortRunningOpts },
  });

  const { criticalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  const info = workflow.workflowInfo();

  const { id } = await insertInFlightNftTxRow({
    changeType,
    chainId: expected.chainId,
    normalizedDomainName: expected.normalizedDomainName,
    ownerAddress: expected.ownerAddress ?? null,
    expirationTimeInSeconds: expected.expirationTimeInSeconds ?? null,
    isLocked: expected.isLocked ?? null,
    workflowId: info.workflowId,
    runId: info.runId,
  });

  try {
    const result = await op();
    const txHash =
      typeof result === 'string' ? result : PENDING_NFT_TX_HASH_PLACEHOLDER;

    await markInFlightNftTxConfirmed({ id, txHash });

    if (options?.onConfirmed) {
      // Deferred follow-up (e.g. record the tx on the order item now that it's
      // known — the item was already marked SUCCEEDED on registrar success).
      // Best-effort — must not fail the operation.
      await catchAndAlertLocally(() => options.onConfirmed!(result), {
        message: 'Deferred NFT tx onConfirmed action failed',
        details: {
          changeType,
          normalizedDomainName: expected.normalizedDomainName,
        },
      });
    }

    return { id, result };
  } catch (error: any) {
    await catchAndAlertLocally(
      () =>
        markInFlightNftTxFailed({
          id,
          error: error?.message ?? String(error),
        }),
      {
        message: 'Failed to mark in-flight NFT tx row as FAILED',
        details: { id, normalizedDomainName: expected.normalizedDomainName },
      },
    );

    await catchAndAlertLocally(
      () =>
        criticalAlertNamefi({
          title: `Deferred NFT operation failed (${changeType}) for ${expected.normalizedDomainName}`,
          message: `A deferred ${changeType} operation failed. The optimistic state has been cleared; manual follow-up may be required.`,
          workflowId: info.workflowId,
          runId: info.runId,
          operation: 'PRE_NFT_TX',
          error: error?.message ?? String(error),
        }),
      {
        message: 'Failed to send critical alert for failed deferred NFT op',
        details: { normalizedDomainName: expected.normalizedDomainName },
      },
    );

    throw error;
  }
}
