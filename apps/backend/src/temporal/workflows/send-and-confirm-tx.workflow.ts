/**
 * One attempt of the pinned-nonce send race, as a CHILD workflow.
 *
 * The parent (`staggeredSendRace`) starts one of these per attempt, staggered,
 * all sharing the same pinned `nonce`. Each child broadcasts ONCE at its
 * escalating gas price, then polls for ITS OWN hash until a verdict:
 *
 *   - CONFIRMED       — my tx mined (this attempt won the nonce).
 *   - REVERTED        — my tx mined but reverted (terminal for the round).
 *   - LOST            — the nonce was consumed on-chain and my receipt never
 *                       appeared (after `graceCycles`) → a sibling/foreign tx won.
 *   - PENDING_TIMEOUT — still pending at the deadline with the nonce slot open →
 *                       my tx MAY still mine (terminal; the parent never re-pins).
 *   - NOT_SENT        — never broadcast (benign nonce-race loss, or a real failure).
 *
 * Making each attempt a child workflow gives the Temporal UI an ordered, grouped,
 * collapsible view (instead of interleaved activities). `staticSummary` (set by
 * the parent), `setCurrentDetails` (live), activity `summary`, and named timer
 * `summary` all label the execution.
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import type { PreparedTxOnlySerializableParams } from '../activities/mint/mint.activities';
import type { TxSendOnlyResult } from '../activities/shared/eth-tx-primitives';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export type SignerKind = 'mint' | 'x402';

export interface SendAndConfirmTxInput {
  signerKind: SignerKind;
  preparedTx: PreparedTxOnlySerializableParams;
  chainId: number;
  /** The single nonce pinned by the parent; shared by every attempt in a round. */
  nonce: number;
  gasPriceMultiplier: number;
  confirmations: number;
  pollIntervalMs: number;
  /** This attempt's confirmation budget. */
  timeoutMs: number;
  /** Consecutive NONCE_FILLED polls tolerated before concluding LOST (RPC-lag guard). */
  graceCycles: number;
  /** Context label, e.g. 'mint:mintNfsc'. */
  label: string;
  attempt: number;
  /** The parent's re-pin round index — used for child IDs and observability. */
  roundIndex: number;
}

export type SendAndConfirmTxResult =
  | {
      status: 'CONFIRMED';
      txHash: Hash;
      blockNumber: string;
      nonce: number;
      attempt: number;
    }
  | {
      status: 'REVERTED';
      txHash: Hash;
      blockNumber: string;
      nonce: number;
      attempt: number;
    }
  | {
      status: 'LOST';
      txHash: Hash;
      onChainNonce: number;
      nonce: number;
      attempt: number;
    }
  | { status: 'PENDING_TIMEOUT'; txHash: Hash; nonce: number; attempt: number }
  | {
      status: 'NOT_SENT';
      sendStatus: TxSendOnlyResult['status'];
      error?: string;
      /** True when the send was lost to a sibling (nonce-race), not a real failure. */
      benign: boolean;
      nonce: number;
      attempt: number;
    };

export async function sendAndConfirmTxWorkflow(
  input: SendAndConfirmTxInput,
): Promise<SendAndConfirmTxResult> {
  const {
    signerKind,
    preparedTx,
    chainId,
    nonce,
    gasPriceMultiplier,
    confirmations,
    pollIntervalMs,
    timeoutMs,
    graceCycles,
    label,
    attempt,
  } = input;

  // Send routes to MINT (serialized, broadcast once, never retried).
  const mintActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: { maximumAttempts: 1 },
      summary: `send tx (attempt ${attempt})`,
    },
  });
  // Confirm routes to DEFAULT (read-only poll; unblocked by the single MINT slot).
  const defaultActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      summary: `confirm poll (attempt ${attempt})`,
    },
  });

  const sendTransaction =
    signerKind === 'x402'
      ? mintActivities.sendX402PreparedTransaction
      : mintActivities.sendPreparedTransaction;
  const confirmTransaction =
    signerKind === 'x402'
      ? defaultActivities.getX402TransactionConfirmation
      : defaultActivities.getTransactionConfirmation;

  workflow.setCurrentDetails(
    `attempt ${attempt} · broadcasting · nonce ${nonce} · gas ×${gasPriceMultiplier.toFixed(3)}`,
  );

  const sendResult = await sendTransaction(
    preparedTx,
    chainId,
    nonce,
    gasPriceMultiplier,
  );
  if (sendResult.status !== 'SENT') {
    const benign =
      sendResult.status === 'NONCE_EXPIRED' ||
      sendResult.status === 'REPLACEMENT_UNDERPRICED' ||
      sendResult.status === 'GAS_PRICE_TOO_LOW';
    workflow.setCurrentDetails(
      `attempt ${attempt} · not sent (${sendResult.status})`,
    );
    workflow.log.info(
      `[${label}] attempt ${attempt} not sent: ${sendResult.status}`,
    );
    return {
      status: 'NOT_SENT',
      sendStatus: sendResult.status,
      error: sendResult.error,
      benign,
      nonce,
      attempt,
    };
  }

  const txHash = sendResult.txHash;
  workflow.setCurrentDetails(
    `attempt ${attempt} · sent ${txHash} · awaiting ${confirmations} confs`,
  );
  workflow.log.info(`[${label}] attempt ${attempt} sent ${txHash}`);

  let elapsedMs = 0;
  let nonceFilledStreak = 0;
  let pollCount = 0;

  while (true) {
    const confirmation = await confirmTransaction(
      [txHash],
      chainId,
      nonce,
      confirmations,
    );
    pollCount += 1;
    switch (confirmation.kind) {
      case 'CONFIRMED':
        workflow.setCurrentDetails(
          `attempt ${attempt} · CONFIRMED ${txHash} @ block ${confirmation.blockNumber}`,
        );
        return {
          status: 'CONFIRMED',
          txHash,
          blockNumber: confirmation.blockNumber,
          nonce,
          attempt,
        };
      case 'MULTIPLE_CONFIRMED':
        // Impossible for a single hash; treat as confirmed defensively.
        return {
          status: 'CONFIRMED',
          txHash,
          blockNumber: '0',
          nonce,
          attempt,
        };
      case 'REVERTED':
        workflow.setCurrentDetails(`attempt ${attempt} · REVERTED ${txHash}`);
        return {
          status: 'REVERTED',
          txHash,
          blockNumber: confirmation.blockNumber,
          nonce,
          attempt,
        };
      case 'NONCE_FILLED_NO_CANDIDATE':
        nonceFilledStreak += 1;
        if (nonceFilledStreak >= graceCycles) {
          workflow.setCurrentDetails(
            `attempt ${attempt} · LOST (on-chain nonce ${confirmation.onChainNonce})`,
          );
          return {
            status: 'LOST',
            txHash,
            onChainNonce: confirmation.onChainNonce,
            nonce,
            attempt,
          };
        }
        break;
      default:
        nonceFilledStreak = 0; // PENDING
    }

    if (elapsedMs >= timeoutMs) {
      workflow.setCurrentDetails(
        `attempt ${attempt} · PENDING_TIMEOUT ${txHash}`,
      );
      return { status: 'PENDING_TIMEOUT', txHash, nonce, attempt };
    }

    const sleepMs = Math.min(pollIntervalMs, timeoutMs - elapsedMs);
    workflow.setCurrentDetails(
      `attempt ${attempt} · poll ${pollCount} · ${Math.round(elapsedMs / 1000)}s · ${txHash}`,
    );
    await workflow.sleep(sleepMs, {
      summary: `confirm poll wait (attempt ${attempt})`,
    });
    elapsedMs += sleepMs;
  }
}
