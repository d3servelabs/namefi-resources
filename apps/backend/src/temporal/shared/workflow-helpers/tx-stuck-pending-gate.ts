/**
 * `tx-stuck-pending` admin gate.
 *
 * When a tx stays pending at the pinned nonce after gas is maxed and the
 * auto-retry window (`maxPendingWaitMs`) elapses, `staggeredSendRace` hands off to
 * a human INSTEAD of failing — the distributed signer-nonce lock stays held the
 * whole time so the pending tx is never abandoned (releasing the signer while a tx
 * is pending is exactly what the incident exposed). The admin RESPONDs with one of:
 *   - `MARK_CONFIRMED { txHash }` — admin verified one of OUR candidate txs mined;
 *     return it as the winner.
 *   - `REPIN`                     — admin cleared/replaced the stuck nonce; it is
 *     now safe to re-pin a fresh nonce and retry.
 *   - `KEEP_WAITING`              — keep holding + polling for another window.
 * `CANCEL` (or the 3-day decision timeout) fails the workflow.
 *
 * The admin payload is validated INLINE (mirroring the double-commit gate); a
 * malformed payload is ignored and the gate keeps waiting.
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import { createDecisionGateRegistry } from './decision-gate';
import { runWithKnownGate } from './known-gates';

/** Admin-decision window for a `tx-stuck-pending` gate. */
const TX_STUCK_PENDING_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export type StuckPendingDecision =
  | { kind: 'MARK_CONFIRMED'; txHash: Hash }
  | { kind: 'REPIN' }
  | { kind: 'KEEP_WAITING' };

export interface TxStuckPendingGateArgs {
  pinnedNonce: number;
  /** Every hash we have broadcast at this nonce — the admin can MARK_CONFIRMED one. */
  candidateHashes: Hash[];
  /** Distinguishes successive gate openings in one run (a KEEP_WAITING reopens). */
  waitCycle: number;
}

export interface TxStuckPendingGateConfig {
  /** Context label, e.g. 'mint:chargeNfsc'. */
  label: string;
  chainId: number;
  /** Surfaced to the admin and woven into the alert. */
  evidenceParams?: Record<string, unknown>;
}

/**
 * Build the `onStuckPending` callback for `staggeredSendRace`'s `recovery`. Opens
 * the `tx-stuck-pending` gate and resolves to the admin's decision; throws a
 * non-retryable failure on CANCEL/timeout.
 */
export function makeTxStuckPendingResolver(
  config: TxStuckPendingGateConfig,
): (args: TxStuckPendingGateArgs) => Promise<StuckPendingDecision> {
  const { label, chainId, evidenceParams } = config;
  return async ({ pinnedNonce, candidateHashes, waitCycle }) => {
    workflow.log.warn(
      `[${label}] tx stuck pending at nonce ${pinnedNonce} (gas maxed); awaiting admin decision`,
    );
    const registry = createDecisionGateRegistry();
    // Spread caller-supplied evidence FIRST so the core gate fields always win —
    // `evidenceParams` must never override chainId / pinnedNonce / candidateHashes,
    // or the admin sees wrong evidence for this stuck-pending decision.
    const details = {
      ...evidenceParams,
      chainId,
      pinnedNonce,
      candidateHashes,
    };
    return runWithKnownGate<never, StuckPendingDecision>({
      registry,
      gateKind: 'tx-stuck-pending',
      // Vary per opening so a KEEP_WAITING reopen doesn't collide with the prior
      // armed gate's wait-point in the same run.
      interactionId: `tx-stuck-pending-${waitCycle}`,
      // No retriable action — throwing opens the gate immediately.
      action: async (): Promise<never> => {
        throw workflow.ApplicationFailure.create({
          type: 'tx-stuck-pending/awaiting-admin',
          message: `[${label}] tx stuck pending at nonce ${pinnedNonce} — awaiting admin decision`,
        });
      },
      alertSeverity: 'critical',
      alertPriority: 1,
      alertMessage: `[${label}] a transaction is stuck pending at nonce ${pinnedNonce} (gas maxed). RESPOND { action: 'MARK_CONFIRMED', txHash } | { action: 'REPIN' } | { action: 'KEEP_WAITING' }, or CANCEL to fail.`,
      alertDetails: details,
      allowedActors: ['ADMIN'],
      allowedActions: ['RESPOND', 'CANCEL'],
      timeoutMs: TX_STUCK_PENDING_DECISION_TIMEOUT_MS,
      onTimeout: { kind: 'throw' },
      evidenceParams: details,
      validateResponse: (raw): StuckPendingDecision => {
        const payload = (raw ?? {}) as { action?: string; txHash?: string };
        switch (payload.action) {
          case 'MARK_CONFIRMED': {
            const txHash = payload.txHash;
            // Must be one of OUR candidate hashes — never return an arbitrary hash.
            if (!txHash || !candidateHashes.includes(txHash as Hash)) {
              throw new Error(
                'MARK_CONFIRMED requires a txHash that is one of the candidate hashes',
              );
            }
            return { kind: 'MARK_CONFIRMED', txHash: txHash as Hash };
          }
          case 'REPIN':
            return { kind: 'REPIN' };
          case 'KEEP_WAITING':
            return { kind: 'KEEP_WAITING' };
          default:
            // Malformed/unknown → throw so the gate ignores it and keeps waiting.
            throw new Error(
              `unknown stuck-pending action ${String(payload.action)}`,
            );
        }
      },
    });
  };
}
