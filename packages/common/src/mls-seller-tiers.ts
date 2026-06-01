export const MLS_SELLER_TIERS = [
  {
    id: 'domain-whale',
    label: 'Domain Whale',
    minimumDomains: 50,
    description: '50+ portfolio domains',
  },
  {
    id: 'market-maker',
    label: 'Market Maker',
    minimumDomains: 25,
    description: '25+ portfolio domains',
  },
  {
    id: 'portfolio-builder',
    label: 'Portfolio Builder',
    minimumDomains: 10,
    description: '10+ portfolio domains',
  },
] as const;

export type MlsSellerTier = (typeof MLS_SELLER_TIERS)[number];
export type MlsSellerTierId = MlsSellerTier['id'];

export function getMlsSellerTier(
  domainCount: number | null | undefined,
): MlsSellerTier | null {
  const normalizedDomainCount = normalizeDomainCount(domainCount);

  return (
    MLS_SELLER_TIERS.find(
      (tier) => normalizedDomainCount >= tier.minimumDomains,
    ) ?? null
  );
}

export function getMlsListingSellerDomainCount(
  otherDomainsCount: number | null | undefined,
) {
  return normalizeDomainCount(otherDomainsCount) + 1;
}

export function getMlsSellerTierDomainCount({
  feedDomainsCount,
  namefiDomainsCount,
  overlappingDomainsCount = 0,
}: {
  feedDomainsCount: number | null | undefined;
  namefiDomainsCount: number | null | undefined;
  overlappingDomainsCount?: number | null | undefined;
}) {
  const normalizedFeedDomainsCount = normalizeDomainCount(feedDomainsCount);
  const normalizedNamefiDomainsCount = normalizeDomainCount(namefiDomainsCount);
  const normalizedOverlappingDomainsCount = Math.min(
    normalizeDomainCount(overlappingDomainsCount),
    normalizedFeedDomainsCount,
    normalizedNamefiDomainsCount,
  );

  return (
    normalizedFeedDomainsCount +
    normalizedNamefiDomainsCount -
    normalizedOverlappingDomainsCount
  );
}

function normalizeDomainCount(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}
