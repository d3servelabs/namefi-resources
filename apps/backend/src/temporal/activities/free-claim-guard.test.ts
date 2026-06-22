import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { describe, expect, it } from 'vitest';
import {
  CLAIM_GUARD_REASONS,
  deriveClaimGuardInfo,
  evaluateClaimGuard,
  getFreeClaimPolicy,
} from './free-claim-guard';

/**
 * Pure unit coverage for the free-claim premium / max-price guard. No DB or
 * registrar IO — the logic under test is intentionally isolated in
 * `free-claim-guard.ts` so it can be tested without the registrar import chain.
 */

describe('getFreeClaimPolicy', () => {
  it('defaults to blocking premium and no cap when metadata is absent/empty', () => {
    expect(getFreeClaimPolicy({ metadata: undefined })).toEqual({
      allowPremium: false,
    });
    expect(getFreeClaimPolicy({ metadata: {} })).toEqual({
      allowPremium: false,
    });
    expect(getFreeClaimPolicy({ metadata: null })).toEqual({
      allowPremium: false,
    });
  });

  it('reads allowPremium and maxPrice from metadata', () => {
    expect(getFreeClaimPolicy({ metadata: { allowPremium: true } })).toEqual({
      allowPremium: true,
    });
    expect(getFreeClaimPolicy({ metadata: { maxPrice: 50 } })).toEqual({
      allowPremium: false,
      maxPrice: 50,
    });
    expect(
      getFreeClaimPolicy({ metadata: { allowPremium: true, maxPrice: 100 } }),
    ).toEqual({ allowPremium: true, maxPrice: 100 });
  });

  it('ignores unrelated metadata keys (e.g. gift metadata)', () => {
    expect(
      getFreeClaimPolicy({
        metadata: {
          source: 'GIFT',
          sourceId: 'abc',
          personalMessage: 'hi',
        },
      }),
    ).toEqual({ allowPremium: false });
  });

  it('falls back to safe defaults for malformed metadata', () => {
    expect(getFreeClaimPolicy({ metadata: 'not-an-object' })).toEqual({
      allowPremium: false,
    });
    // Negative maxPrice fails the positive() check -> whole parse fails -> default.
    expect(getFreeClaimPolicy({ metadata: { maxPrice: -5 } })).toEqual({
      allowPremium: false,
    });
  });
});

describe('evaluateClaimGuard', () => {
  it('blocks a premium domain when allowPremium is false', () => {
    const result = evaluateClaimGuard(
      { allowPremium: false },
      { isPremium: true, registrationPriceUsd: 10 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain(CLAIM_GUARD_REASONS.PREMIUM_NOT_ALLOWED);
    }
  });

  it('allows a premium domain when allowPremium is true', () => {
    expect(
      evaluateClaimGuard(
        { allowPremium: true },
        { isPremium: true, registrationPriceUsd: 999 },
      ),
    ).toEqual({ ok: true });
  });

  it('blocks a non-premium domain priced above maxPrice', () => {
    const result = evaluateClaimGuard(
      { allowPremium: false, maxPrice: 50 },
      { isPremium: false, registrationPriceUsd: 80 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain(CLAIM_GUARD_REASONS.MAX_PRICE_EXCEEDED);
    }
  });

  it('allows a non-premium domain priced at or below maxPrice', () => {
    expect(
      evaluateClaimGuard(
        { allowPremium: false, maxPrice: 50 },
        { isPremium: false, registrationPriceUsd: 30 },
      ),
    ).toEqual({ ok: true });
    expect(
      evaluateClaimGuard(
        { allowPremium: false, maxPrice: 50 },
        { isPremium: false, registrationPriceUsd: 50 },
      ),
    ).toEqual({ ok: true });
  });

  it('blocks when a cap is set but the price is unknown (conservative)', () => {
    const result = evaluateClaimGuard(
      { allowPremium: false, maxPrice: 50 },
      { isPremium: false, registrationPriceUsd: null },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain(CLAIM_GUARD_REASONS.MAX_PRICE_EXCEEDED);
    }
  });

  it('allows a normal domain under default policy (no cap, not premium)', () => {
    expect(
      evaluateClaimGuard(
        { allowPremium: false },
        { isPremium: false, registrationPriceUsd: 12 },
      ),
    ).toEqual({ ok: true });
    // Unknown price is fine when no cap is set.
    expect(
      evaluateClaimGuard(
        { allowPremium: false },
        { isPremium: false, registrationPriceUsd: null },
      ),
    ).toEqual({ ok: true });
  });
});

describe('deriveClaimGuardInfo', () => {
  const makeInfo = (
    overrides: Partial<DomainAvailabilityInfo>,
  ): DomainAvailabilityInfo => ({
    domain: 'example.com' as NamefiNormalizedDomain,
    availability: true,
    pricingDetails: {
      registrationPrice: {
        type: 'PER_YEAR',
        price: { amount: 12, currency: 'USD' },
      },
      renewalPrice: {
        type: 'PER_YEAR',
        price: { amount: 12, currency: 'USD' },
      },
      importPrice: {
        type: 'PER_YEAR',
        price: { amount: 12, currency: 'USD' },
      },
    },
    currentOwner: undefined,
    importable: false,
    supported: true,
    isPremium: false,
    ...overrides,
  });

  it('returns defaults for undefined info', () => {
    expect(deriveClaimGuardInfo(undefined)).toEqual({
      isPremium: false,
      registrationPriceUsd: null,
    });
  });

  it('extracts premium flag and 1-year registration price', () => {
    expect(deriveClaimGuardInfo(makeInfo({ isPremium: true }))).toEqual({
      isPremium: true,
      registrationPriceUsd: 12,
    });
  });

  it('returns null price when pricing details are missing', () => {
    expect(
      deriveClaimGuardInfo(makeInfo({ pricingDetails: undefined })),
    ).toEqual({ isPremium: false, registrationPriceUsd: null });
  });

  it('returns null price when the 1-year registration price cannot be computed', () => {
    // MULTI_YEAR map with no year-1 entry makes computeChargesInUsdOrThrow throw,
    // which deriveClaimGuardInfo swallows to null.
    const info = makeInfo({
      pricingDetails: {
        registrationPrice: {
          type: 'MULTI_YEAR',
          price: { 2: { amount: 50, currency: 'USD' } },
        },
        renewalPrice: {
          type: 'PER_YEAR',
          price: { amount: 12, currency: 'USD' },
        },
        importPrice: {
          type: 'PER_YEAR',
          price: { amount: 12, currency: 'USD' },
        },
      },
    });
    expect(deriveClaimGuardInfo(info)).toEqual({
      isPremium: false,
      registrationPriceUsd: null,
    });
  });
});
