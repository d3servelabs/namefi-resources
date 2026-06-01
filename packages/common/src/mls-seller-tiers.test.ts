import { describe, expect, it } from 'vitest';

import {
  getMlsListingSellerDomainCount,
  getMlsSellerTier,
  getMlsSellerTierDomainCount,
} from './mls-seller-tiers';

describe('getMlsSellerTier', () => {
  it('leaves casual listers unbadged', () => {
    expect(getMlsSellerTier(0)).toBeNull();
    expect(getMlsSellerTier(9)).toBeNull();
    expect(getMlsSellerTier(null)).toBeNull();
  });

  it('resolves the first tier at ten listed domains', () => {
    expect(getMlsSellerTier(10)?.id).toBe('portfolio-builder');
    expect(getMlsSellerTier(24)?.id).toBe('portfolio-builder');
  });

  it('resolves the middle tier at twenty five listed domains', () => {
    expect(getMlsSellerTier(25)?.id).toBe('market-maker');
    expect(getMlsSellerTier(49)?.id).toBe('market-maker');
  });

  it('resolves the top tier at fifty listed domains', () => {
    expect(getMlsSellerTier(50)?.id).toBe('domain-whale');
    expect(getMlsSellerTier(250)?.id).toBe('domain-whale');
  });
});

describe('getMlsListingSellerDomainCount', () => {
  it('derives total seller domains from the listing row other-domain count', () => {
    expect(getMlsListingSellerDomainCount(0)).toBe(1);
    expect(getMlsListingSellerDomainCount(9)).toBe(10);
  });
});

describe('getMlsSellerTierDomainCount', () => {
  it('combines feed and Namefi portfolio counts', () => {
    expect(
      getMlsSellerTierDomainCount({
        feedDomainsCount: 8,
        namefiDomainsCount: 12,
      }),
    ).toBe(20);
  });

  it('subtracts known overlaps between feed and Namefi portfolios', () => {
    expect(
      getMlsSellerTierDomainCount({
        feedDomainsCount: 30,
        namefiDomainsCount: 18,
        overlappingDomainsCount: 7,
      }),
    ).toBe(41);
  });
});
