import { describe, expect, it } from 'vitest';
import { deriveNfscMintReconciliation } from './nfsc-reconciliation';

const WINDOW_START = '2026-05-15T00:00:00.000Z';
const CHECKED_AT = '2026-05-15T00:01:00.000Z';

const base = {
  windowStart: WINDOW_START,
  checkedAt: CHECKED_AT,
  concurrentMints: [] as { id: string; nfscAmount: string }[],
  concurrentCharges: [] as { id: string; amountInUSDCents: number }[],
  concurrentRefunds: [] as { id: string; amountInUSDCents: number }[],
};

describe('deriveNfscMintReconciliation', () => {
  it('returns OK when the observed delta matches the expected delta', () => {
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 25,
      balanceBefore: 10,
      balanceAfter: 35,
    });
    expect(result.outcome).toBe('OK');
    expect(result.unexplainedDelta).toBe(0);
  });

  it('treats sub-epsilon differences as OK (18-decimal float tolerance)', () => {
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 25 + 1e-12,
      balanceBefore: 0,
      balanceAfter: 25 + 1e-12,
    });
    expect(result.outcome).toBe('OK');
  });

  it('treats a difference at exactly the epsilon as OK (the check is <=)', () => {
    // `expectedDelta: 0` keeps the (actualDelta - expectedDelta) subtraction
    // exact — adding 1e-9 to a larger value (e.g. 25) can drift by a few ULPs
    // and make the boundary test flaky.
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 0,
      actualDelta: 1e-9,
      balanceBefore: 0,
      balanceAfter: 1e-9,
    });
    expect(result.outcome).toBe('OK');
  });

  it('flags an unjustified anomaly when the difference is just over the epsilon', () => {
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 0,
      actualDelta: 2e-9,
      balanceBefore: 0,
      balanceAfter: 2e-9,
    });
    expect(result.outcome).toBe('UNJUSTIFIED_ANOMALY');
  });

  it('justifies a surplus explained by a concurrent top-up mint', () => {
    // Minted 25, but the balance moved by 40 — another 15 NFSC top-up landed.
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 40,
      balanceBefore: 0,
      balanceAfter: 40,
      concurrentMints: [{ id: 'item-2', nfscAmount: '15' }],
    });
    expect(result.outcome).toBe('JUSTIFIED_ANOMALY');
    expect(result.unexplainedDelta).toBe(0);
    expect(result.concurrentMintItemIds).toEqual(['item-2']);
  });

  it('justifies a shortfall explained by a concurrent NFSC charge/spend', () => {
    // Minted 25, but the balance only moved by 5 — the wallet spent 20 NFSC.
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 5,
      balanceBefore: 30,
      balanceAfter: 35,
      concurrentCharges: [{ id: 'payment-9', amountInUSDCents: 2000 }],
    });
    expect(result.outcome).toBe('JUSTIFIED_ANOMALY');
    expect(result.unexplainedDelta).toBe(0);
    expect(result.concurrentChargePaymentIds).toEqual(['payment-9']);
  });

  it('justifies a surplus explained by a concurrent NFSC refund', () => {
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 35,
      balanceBefore: 0,
      balanceAfter: 35,
      concurrentRefunds: [{ id: 'refund-3', amountInUSDCents: 1000 }],
    });
    expect(result.outcome).toBe('JUSTIFIED_ANOMALY');
    expect(result.unexplainedDelta).toBe(0);
  });

  it('nets concurrent mints, charges and refunds together', () => {
    // expected 25; +10 mint, -30 charge, +5 refund => explained -15;
    // actual = 25 + (-15) = 10, so the residual is exactly 0.
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 10,
      balanceBefore: 100,
      balanceAfter: 110,
      concurrentMints: [{ id: 'm', nfscAmount: '10' }],
      concurrentCharges: [{ id: 'c', amountInUSDCents: 3000 }],
      concurrentRefunds: [{ id: 'r', amountInUSDCents: 500 }],
    });
    expect(result.outcome).toBe('JUSTIFIED_ANOMALY');
    expect(result.unexplainedDelta).toBeCloseTo(0, 9);
  });

  it('flags an unjustified anomaly when a residual remains', () => {
    // Minted 25, balance moved by 12, and nothing concurrent explains the -13.
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 12,
      balanceBefore: 0,
      balanceAfter: 12,
    });
    expect(result.outcome).toBe('UNJUSTIFIED_ANOMALY');
    expect(result.unexplainedDelta).toBe(-13);
  });

  it('flags an unjustified anomaly when concurrent activity only partially explains the gap', () => {
    // expected 25, actual 50 (+25 surplus); a 10 concurrent mint leaves +15 unexplained.
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 50,
      balanceBefore: 0,
      balanceAfter: 50,
      concurrentMints: [{ id: 'm', nfscAmount: '10' }],
    });
    expect(result.outcome).toBe('UNJUSTIFIED_ANOMALY');
    expect(result.unexplainedDelta).toBe(15);
  });

  it('echoes balances, sums and concurrent ids into the result for auditability', () => {
    const result = deriveNfscMintReconciliation({
      ...base,
      expectedDelta: 25,
      actualDelta: 25,
      balanceBefore: 7,
      balanceAfter: 32,
      concurrentMints: [{ id: 'm1', nfscAmount: '1' }],
      concurrentCharges: [{ id: 'c1', amountInUSDCents: 100 }],
      concurrentRefunds: [{ id: 'r1', amountInUSDCents: 100 }],
    });
    expect(result.balanceBefore).toBe(7);
    expect(result.balanceAfter).toBe(32);
    expect(result.sumConcurrentMints).toBe(1);
    expect(result.sumConcurrentCharges).toBe(1);
    expect(result.sumConcurrentRefunds).toBe(1);
    expect(result.concurrentMintItemIds).toEqual(['m1']);
    expect(result.concurrentChargePaymentIds).toEqual(['c1']);
    expect(result.concurrentRefundIds).toEqual(['r1']);
    expect(result.windowStart).toBe(WINDOW_START);
    expect(result.checkedAt).toBe(CHECKED_AT);
  });
});
