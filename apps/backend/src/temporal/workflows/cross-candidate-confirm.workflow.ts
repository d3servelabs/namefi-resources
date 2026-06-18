/**
 * The AUTHORITATIVE cross-candidate confirmation, as a CHILD workflow.
 *
 * The parent (`staggeredSendRace`) runs ONE of these after each batch settles. It
 * polls `getTransactionConfirmation` over ALL candidate hashes TOGETHER (never a
 * single hash — that is what made a slow winner's siblings report LOST) until a
 * verdict or until its bounded `windowMs` elapses:
 *
 *   - CONFIRMED    — exactly one of our hashes mined (the pinned nonce won).
 *   - MULTIPLE     — >1 of our hashes mined (cross-round double-commit; impossible
 *                    within a single nonce, surfaced for the parent's reconciler).
 *   - REVERTED     — our tx mined but reverted (terminal for the round).
 *   - LOST_FOREIGN — the nonce was consumed on-chain and none of our hashes mined,
 *                    sustained past `graceCycles` (a foreign tx took the nonce).
 *   - PENDING      — the nonce is genuinely still open (`latest <= pinned`).
 *
 * It receives a SNAPSHOT of the candidate hashes taken when the parent starts it —
 * safe because the parent only starts this AFTER the batch's children have settled
 * and pushed their hashes, and two siblings can never both mine (≤1 tx per
 * `(account, nonce)`), so a late sibling hash can never hide a double.
 *
 * Extracting the poll loop into a child workflow gives the Temporal UI a single
 * collapsible node per cross-candidate check instead of a run of interleaved
 * confirmation activities cluttering the parent's timeline.
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { SignerKind } from './send-and-confirm-tx.workflow';

export interface CrossCandidateConfirmInput {
  /** Snapshot of every hash any child has broadcast so far this round. */
  candidateHashes: Hash[];
  chainId: number;
  /** The nonce pinned for this round; the poll resolves win/lost/pending against it. */
  pinnedNonce: number;
  confirmations: number;
  /** Bounded poll window; `PENDING` is returned once it elapses with no verdict. */
  windowMs: number;
  pollIntervalMs: number;
  /** Consecutive NONCE_FILLED polls tolerated before concluding LOST_FOREIGN. */
  graceCycles: number;
  /** Selects the mint vs x402 confirmation activity (same signature). */
  signerKind: SignerKind;
  /** Context label for logs and child summaries, e.g. 'mint:mintNfsc'. */
  label: string;
  roundIndex: number;
  batchIndex: number;
}

/** Authoritative verdict from the parent's cross-candidate confirmation poll. */
export type CrossVerdict =
  | { kind: 'CONFIRMED'; winner: Hash }
  | { kind: 'MULTIPLE'; winners: Hash[] }
  | { kind: 'REVERTED'; reverted: Hash; blockNumber: string }
  | { kind: 'LOST_FOREIGN'; onChainNonce: number }
  | { kind: 'PENDING' };

export async function crossCandidateConfirmWorkflow(
  input: CrossCandidateConfirmInput,
): Promise<CrossVerdict> {
  const {
    candidateHashes,
    chainId,
    pinnedNonce,
    confirmations,
    windowMs,
    pollIntervalMs,
    graceCycles,
    signerKind,
  } = input;

  // Confirm routes to DEFAULT (read-only poll; unblocked by the single MINT slot).
  const defaultActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts, summary: 'cross-candidate confirm poll' },
  });
  const reconfirm =
    signerKind === 'x402'
      ? defaultActivities.getX402TransactionConfirmation
      : defaultActivities.getTransactionConfirmation;

  let elapsed = 0;
  let nonceFilledStreak = 0;
  while (true) {
    const confirmation = await reconfirm(
      candidateHashes,
      chainId,
      pinnedNonce,
      confirmations,
    );
    switch (confirmation.kind) {
      case 'CONFIRMED':
        return { kind: 'CONFIRMED', winner: confirmation.winner };
      case 'MULTIPLE_CONFIRMED':
        return { kind: 'MULTIPLE', winners: confirmation.winners };
      case 'REVERTED':
        return {
          kind: 'REVERTED',
          reverted: confirmation.reverted,
          blockNumber: confirmation.blockNumber,
        };
      case 'NONCE_FILLED_NO_CANDIDATE':
        // latest > pinned AND none of OUR hashes have a receipt → a foreign tx
        // took the nonce. Grace a couple cycles against transient RPC nonce-lag.
        nonceFilledStreak += 1;
        if (nonceFilledStreak >= graceCycles) {
          return {
            kind: 'LOST_FOREIGN',
            onChainNonce: confirmation.onChainNonce,
          };
        }
        break;
      default:
        nonceFilledStreak = 0; // PENDING — latest <= pinned, nobody mined yet.
    }
    if (elapsed >= windowMs) return { kind: 'PENDING' };
    const sleepMs = Math.max(1, Math.min(pollIntervalMs, windowMs - elapsed));
    await workflow.sleep(sleepMs, {
      summary: `cross-candidate poll (nonce ${pinnedNonce})`,
    });
    elapsed += sleepMs;
  }
}
