/**
 * Pre-re-pin nonce-collision decision.
 *
 * Before `staggeredSendRace` re-pins a fresh nonce on NONCE_EXHAUSTED, it asks
 * `checkNonceAlreadySent` whether our calldata already landed at the pinned
 * nonce, then maps the result + the operation's idempotency policy onto an
 * action. This module holds ONLY the pure decision (no I/O, fully testable); the
 * orchestrator performs the resulting action.
 *
 * Policy by operation:
 *   - PROCEED        — idempotent ops (NFT mint/expiration/lock/burn; chargeNfsc,
 *                      whose `reason` calldata is a reliable idempotency key): if
 *                      our send already landed, accept it; otherwise re-send.
 *   - WAIT_FOR_ADMIN — non-idempotent ops (mintNfsc, transferUsdc): an identical
 *                      calldata is NOT proof of our retry, so a human decides.
 */

import type { Hash } from 'viem';
import type { NonceAlreadySentResult } from '../../activities/default/nonce-collision.activities';

export type AlreadySentPolicy = 'PROCEED' | 'WAIT_FOR_ADMIN';

export type NonceCollisionDecision =
  /** Our calldata did NOT land at this nonce — re-pin a fresh nonce and retry. */
  | { kind: 'REPIN' }
  /** Our calldata already landed and succeeded — use it, do not re-pin. */
  | { kind: 'PROCEED'; winner: Hash }
  /** Our calldata landed; a human must accept it (non-idempotent op). */
  | { kind: 'WAIT_FOR_ADMIN'; winner: Hash }
  /** Our calldata landed but reverted — terminal. */
  | { kind: 'REVERTED'; txHash: Hash }
  /** Consumed but unidentifiable AND non-idempotent — escalate, do not re-pin. */
  | { kind: 'ESCALATE'; onChainNonce: number };

/**
 * Decide what to do on NONCE_EXHAUSTED given the collision-check result and the
 * operation's idempotency policy. See the table in the module docstring.
 */
export function decideNonceCollision(
  result: NonceAlreadySentResult,
  policy: AlreadySentPolicy,
): NonceCollisionDecision {
  switch (result.status) {
    case 'unused':
    case 'conflict':
      // Our calldata is not at this nonce (the slot is free, or a FOREIGN tx took
      // it). Re-pinning and re-sending is safe for every operation — we never
      // successfully broadcast at this nonce.
      return { kind: 'REPIN' };

    case 'matched': {
      // Our exact calldata already consumed the nonce.
      if (result.receiptStatus === 'reverted') {
        return { kind: 'REVERTED', txHash: result.txHash };
      }
      // Succeeded, or receipt unconfirmable — the do-not-resend signal stands.
      return policy === 'PROCEED'
        ? { kind: 'PROCEED', winner: result.txHash }
        : { kind: 'WAIT_FOR_ADMIN', winner: result.txHash };
    }

    case 'consumed_unidentified':
      // Nonce consumed, but we could not prove the tx was ours. Idempotent ops
      // can safely re-pin (a re-send at most reverts); non-idempotent ops must
      // NOT silently re-pin (a re-send could double if it WAS ours) — escalate.
      return policy === 'PROCEED'
        ? { kind: 'REPIN' }
        : { kind: 'ESCALATE', onChainNonce: result.onChainNonce };
  }
}
