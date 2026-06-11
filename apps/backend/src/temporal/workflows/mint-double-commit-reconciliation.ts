/**
 * Double-commit reconciliation — the embedded subflow for case (2) of the mint
 * failure model: two of our transactions mined across re-pin rounds (the rare
 * RPC receipt-lag false-positive of the 1b re-pin recovery).
 *
 * `makeDoubleCommitReconciler` builds the `onDoubleCommit` callback that
 * `staggeredSendRace` invokes with the >1 confirmed hashes. The callback returns
 * the canonical hash to keep, or throws a non-retryable failure. Behavior is
 * chosen per operation by `ReconciliationPolicy`:
 *
 *   - AUTOFIX        — neutralize the duplicate(s) with a compensating action
 *                      (NFSC mint → charge the over-minted amount back), keep
 *                      the canonical hash. Leaves an audit ticket.
 *   - WAIT_FOR_ADMIN — open a decision gate and block until an admin RESPONDs
 *                      with the hash to keep (or CANCELs). Used for double
 *                      charge, where over-charging a user needs human judgment.
 *   - CRITICAL_ALERT — alert + throw. Used where a double-commit is practically
 *                      impossible (NFT mint reverts on a duplicate tokenId).
 *   - PROCEED        — accept the duplicate and keep the canonical hash (for
 *                      idempotent-ish operations).
 */

import * as workflow from '@temporalio/workflow';
import type { Hash } from 'viem';
import { criticalAlertWithTicket } from '../shared/workflow-helpers/critical-alert-with-ticket';
import { createDecisionGateRegistry } from '../shared/workflow-helpers/decision-gate';
import { runWithKnownGate } from '../shared/workflow-helpers/known-gates';

export type ReconciliationPolicy =
  | 'AUTOFIX'
  | 'WAIT_FOR_ADMIN'
  | 'CRITICAL_ALERT'
  | 'PROCEED';

/** Admin-decision window for a WAIT_FOR_ADMIN double-commit gate. */
const DOUBLE_COMMIT_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface DoubleCommitReconcilerConfig {
  policy: ReconciliationPolicy;
  /** Context label, e.g. 'mint:mintNfsc'. */
  label: string;
  chainId: number;
  /** Surfaced to admins (WAIT_FOR_ADMIN) and woven into alerts. */
  evidenceParams?: Record<string, unknown>;
  /**
   * AUTOFIX compensating action. Receives the EXTRA winners (every confirmed
   * hash except the canonical `winners[0]`). For NFSC mint this charges the
   * over-minted amount back. Required when `policy === 'AUTOFIX'`.
   */
  autofix?: (extraWinners: Hash[]) => Promise<void>;
}

/**
 * Build the `onDoubleCommit` callback for {@link staggeredSendRace}'s `recovery`.
 * Resolves to the canonical winner to keep, or throws a non-retryable failure.
 */
export function makeDoubleCommitReconciler(
  config: DoubleCommitReconcilerConfig,
): (winners: Hash[]) => Promise<Hash> {
  const { policy, label, chainId, evidenceParams, autofix } = config;

  return async (winners: Hash[]): Promise<Hash> => {
    const canonical = winners[0];
    const extras = winners.slice(1);
    workflow.log.error(
      `[${label}] DOUBLE-COMMIT (policy=${policy}) winners=${winners.join(', ')}`,
    );

    switch (policy) {
      case 'PROCEED':
        workflow.log.warn(
          `[${label}] double-commit accepted (PROCEED); keeping ${canonical}`,
        );
        return canonical;

      case 'AUTOFIX': {
        if (!autofix) {
          throw workflow.ApplicationFailure.create({
            type: 'double-commit/autofix-misconfigured',
            nonRetryable: true,
            message: `[${label}] AUTOFIX policy requires an autofix action`,
          });
        }
        await autofix(extras);
        // Audit trail — the duplicate is neutralized, but a human should know.
        await criticalAlertWithTicket({
          title: `[${label}] double-commit auto-fixed`,
          message: `Auto-fixed ${extras.length} duplicate commit(s); kept ${canonical}, neutralized ${extras.join(', ')}.`,
          priority: 2,
          extraData: { chainId, winners, canonical, ...evidenceParams },
        });
        return canonical;
      }

      case 'WAIT_FOR_ADMIN': {
        const registry = createDecisionGateRegistry();
        return runWithKnownGate<never, Hash>({
          registry,
          gateKind: 'mint-double-commit',
          interactionId: 'mint-double-commit',
          // No retriable action — throwing opens the gate immediately.
          action: async (): Promise<never> => {
            throw workflow.ApplicationFailure.create({
              type: 'double-commit/awaiting-admin',
              message: `[${label}] double-commit awaiting admin decision`,
            });
          },
          alertSeverity: 'critical',
          alertPriority: 1,
          alertMessage: `[${label}] double-commit detected (${winners.join(', ')}). RESPOND { keepHash } to keep one, or CANCEL to fail.`,
          alertDetails: { chainId, winners, canonical, ...evidenceParams },
          allowedActors: ['ADMIN'],
          allowedActions: ['RESPOND', 'CANCEL'],
          timeoutMs: DOUBLE_COMMIT_DECISION_TIMEOUT_MS,
          onTimeout: { kind: 'throw' },
          evidenceParams: { chainId, winners, canonical, ...evidenceParams },
          validateResponse: (raw) => {
            const keep = (raw as { keepHash?: string } | undefined)?.keepHash;
            // No keepHash (missing or empty) → keep the canonical winner.
            if (!keep) {
              return canonical;
            }
            // A provided keepHash must be one of the confirmed winners.
            if (!winners.includes(keep as Hash)) {
              throw new Error(`keepHash ${keep} is not a confirmed winner`);
            }
            return keep as Hash;
          },
        });
      }

      case 'CRITICAL_ALERT':
        await criticalAlertWithTicket({
          title: `[${label}] double-commit (manual intervention required)`,
          message: `Unexpected double-commit; winners=${winners.join(', ')}. No auto-fix for this operation.`,
          priority: 1,
          extraData: { chainId, winners, canonical, ...evidenceParams },
        });
        throw workflow.ApplicationFailure.create({
          type: 'double-commit/critical',
          nonRetryable: true,
          message: `[${label}] double-commit; winners=${winners.join(', ')}`,
        });

      default: {
        const _exhaustive: never = policy;
        throw workflow.ApplicationFailure.create({
          type: 'double-commit/unknown-policy',
          nonRetryable: true,
          message: `[${label}] unhandled reconciliation policy ${String(_exhaustive)}`,
        });
      }
    }
  };
}
