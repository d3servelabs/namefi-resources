import { describe, expect, it } from 'vitest';

import { normalizeStripeAmountInSubunits } from '@/lib/stripe-amount';

describe('normalizeStripeAmountInSubunits', () => {
  it('rounds floating-point amounts to integer subunits', () => {
    expect(normalizeStripeAmountInSubunits(1527.9849999849998)).toBe(1528);
    expect(normalizeStripeAmountInSubunits(1527.2)).toBe(1527);
    expect(normalizeStripeAmountInSubunits(0.49)).toBe(0);
  });

  it('clamps negatives to 0', () => {
    expect(normalizeStripeAmountInSubunits(-1)).toBe(0);
    expect(normalizeStripeAmountInSubunits(-1527.9)).toBe(0);
  });

  it('handles non-finite numbers', () => {
    expect(normalizeStripeAmountInSubunits(Number.NaN)).toBe(0);
    expect(normalizeStripeAmountInSubunits(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeStripeAmountInSubunits(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});
