import type { NfscMintReconciliation } from '@namefi-astra/db';

/**
 * Tolerance for comparing NFSC balances. Balances are read on-chain and
 * formatted from an 18-decimal token into a JS `number`, so exact equality is
 * unsafe — anything at/under this threshold is treated as "equal".
 */
export const NFSC_RECONCILIATION_EPSILON = 1e-9;

/**
 * Slack added to the lower bound of the reconciliation window so a concurrent
 * mint/charge/refund that landed inside our balance-read window but started
 * just before this item went PROCESSING is still considered.
 */
export const NFSC_RECONCILIATION_WINDOW_SLACK_MS = 2 * 60 * 1000;

export interface DeriveNfscMintReconciliationInput {
  /** NFSC units this mint was expected to add. */
  expectedDelta: number;
  /** NFSC units actually observed (balanceAfter - balanceBefore). */
  actualDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  /** Other NFSC top-up mints that credited the same wallet+chain in the window. */
  concurrentMints: { id: string; nfscAmount: string }[];
  /** Concurrent NFSC charges/spends from the same wallet+chain (USD cents). */
  concurrentCharges: { id: string; amountInUSDCents: number }[];
  /** Concurrent NFSC refunds crediting the same wallet+chain (USD cents). */
  concurrentRefunds: { id: string; amountInUSDCents: number }[];
  windowStart: string;
  checkedAt: string;
}

/**
 * Pure decision core of `reconcileNfscMint`.
 *
 * Given the observed before/after balance delta and the concurrent NFSC
 * activity on the same wallet+chain, decide whether the discrepancy (if any)
 * is explained:
 *
 * - `OK`: the observed delta already matched the minted amount.
 * - `JUSTIFIED_ANOMALY`: it differed, but is fully explained once concurrent
 *   mints (+), charges (-) and refunds (+) are netted out.
 * - `UNJUSTIFIED_ANOMALY`: it differed and a residual remains — the caller
 *   raises a critical alert.
 *
 * All sums are in NFSC token units; payment/refund amounts are converted from
 * USD cents at the fixed 1 USD = 1 NFSC rate (`/ 100`).
 */
export function deriveNfscMintReconciliation(
  input: DeriveNfscMintReconciliationInput,
): NfscMintReconciliation {
  const sumConcurrentMints = input.concurrentMints.reduce(
    (acc, c) => acc + Number(c.nfscAmount),
    0,
  );
  const sumConcurrentCharges = input.concurrentCharges.reduce(
    (acc, c) => acc + c.amountInUSDCents / 100,
    0,
  );
  const sumConcurrentRefunds = input.concurrentRefunds.reduce(
    (acc, r) => acc + r.amountInUSDCents / 100,
    0,
  );

  const explained =
    sumConcurrentMints - sumConcurrentCharges + sumConcurrentRefunds;
  const unexplainedDelta = input.actualDelta - input.expectedDelta - explained;

  let outcome: NfscMintReconciliation['outcome'];
  if (
    Math.abs(input.actualDelta - input.expectedDelta) <=
    NFSC_RECONCILIATION_EPSILON
  ) {
    outcome = 'OK';
  } else if (Math.abs(unexplainedDelta) <= NFSC_RECONCILIATION_EPSILON) {
    outcome = 'JUSTIFIED_ANOMALY';
  } else {
    outcome = 'UNJUSTIFIED_ANOMALY';
  }

  return {
    outcome,
    balanceBefore: input.balanceBefore,
    balanceAfter: input.balanceAfter,
    expectedDelta: input.expectedDelta,
    actualDelta: input.actualDelta,
    sumConcurrentMints,
    sumConcurrentCharges,
    sumConcurrentRefunds,
    unexplainedDelta,
    concurrentMintItemIds: input.concurrentMints.map((c) => c.id),
    concurrentChargePaymentIds: input.concurrentCharges.map((c) => c.id),
    concurrentRefundIds: input.concurrentRefunds.map((r) => r.id),
    windowStart: input.windowStart,
    checkedAt: input.checkedAt,
  };
}
