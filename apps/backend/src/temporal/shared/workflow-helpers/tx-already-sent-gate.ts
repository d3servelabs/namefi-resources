/**
 * `tx-already-sent` admin gate.
 *
 * When the pre-re-pin nonce-collision check finds that a NON-idempotent op's
 * exact calldata already landed on-chain (`staggeredSendRace` recovery,
 * `alreadySentPolicy: 'WAIT_FOR_ADMIN'`), a human decides whether to accept that
 * landed transaction or fail. Unlike double-commit there is a SINGLE known hash
 * and no admin-supplied payload — RESPOND accepts the landed tx, CANCEL (or
 * timeout) fails.
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import { createDecisionGateRegistry } from './decision-gate';
import { runWithKnownGate } from './known-gates';

/** Admin-decision window for a `tx-already-sent` gate. */
const TX_ALREADY_SENT_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface TxAlreadySentGateConfig {
  /** Context label, e.g. 'mint:mintNfsc'. */
  label: string;
  chainId: number;
  /** Surfaced to the admin and woven into the alert. */
  evidenceParams?: Record<string, unknown>;
}

/**
 * Build the `onAlreadySentNeedsAdmin` callback for `staggeredSendRace`'s
 * `recovery`. Opens the `tx-already-sent` gate; resolves to the landed hash on
 * admin accept (RESPOND), or throws a non-retryable failure on CANCEL/timeout.
 */
export function makeTxAlreadySentResolver(
  config: TxAlreadySentGateConfig,
): (landedTxHash: Hash) => Promise<Hash> {
  const { label, chainId, evidenceParams } = config;
  return async (landedTxHash) => {
    workflow.log.warn(
      `[${label}] tx may already have been sent (${landedTxHash}); awaiting admin decision`,
    );
    const registry = createDecisionGateRegistry();
    return runWithKnownGate<never, Hash>({
      registry,
      gateKind: 'tx-already-sent',
      interactionId: 'tx-already-sent',
      // No retriable action — throwing opens the gate immediately.
      action: async (): Promise<never> => {
        throw workflow.ApplicationFailure.create({
          type: 'tx-already-sent/awaiting-admin',
          message: `[${label}] transaction may already be sent — awaiting admin decision`,
        });
      },
      alertSeverity: 'critical',
      alertPriority: 1,
      alertMessage: `[${label}] a transaction matching this call may already have been sent at the pinned nonce (${landedTxHash}). RESPOND to accept it, or CANCEL to fail.`,
      alertDetails: { chainId, landedTxHash, ...evidenceParams },
      allowedActors: ['ADMIN'],
      allowedActions: ['RESPOND', 'CANCEL'],
      timeoutMs: TX_ALREADY_SENT_DECISION_TIMEOUT_MS,
      onTimeout: { kind: 'throw' },
      evidenceParams: { chainId, landedTxHash, ...evidenceParams },
      // The hash is known workflow-side; RESPOND (no payload) accepts it.
      validateResponse: () => landedTxHash,
    });
  };
}
