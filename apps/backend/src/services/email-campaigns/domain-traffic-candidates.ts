import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export const MAX_DOMAINS_PER_TRAFFIC_SURGE_EMAIL = 5;

export type DomainTrafficSignal = {
  domain: NamefiNormalizedDomain;
  weeklyQueries: number;
};

export type DomainTrafficCandidate = {
  userId: string;
  domains: DomainTrafficSignal[];
};

function compareDomainTrafficSignals(
  a: DomainTrafficSignal,
  b: DomainTrafficSignal,
) {
  const trafficDifference = b.weeklyQueries - a.weeklyQueries;
  if (trafficDifference !== 0) return trafficDifference;
  return a.domain.localeCompare(b.domain);
}

export function aggregateDomainTrafficCandidatesByUser(
  candidates: DomainTrafficCandidate[],
  {
    maxDomainsPerUser = MAX_DOMAINS_PER_TRAFFIC_SURGE_EMAIL,
  }: {
    maxDomainsPerUser?: number;
  } = {},
): DomainTrafficCandidate[] {
  if (maxDomainsPerUser <= 0) return [];

  const domainsByUser = new Map<
    string,
    Map<NamefiNormalizedDomain, DomainTrafficSignal>
  >();

  for (const candidate of candidates) {
    const domainsByName =
      domainsByUser.get(candidate.userId) ??
      new Map<NamefiNormalizedDomain, DomainTrafficSignal>();

    for (const signal of candidate.domains) {
      const existing = domainsByName.get(signal.domain);
      if (!existing || signal.weeklyQueries > existing.weeklyQueries) {
        domainsByName.set(signal.domain, signal);
      }
    }

    domainsByUser.set(candidate.userId, domainsByName);
  }

  return Array.from(domainsByUser.entries())
    .map(([userId, domainsByName]) => ({
      userId,
      domains: Array.from(domainsByName.values())
        .sort(compareDomainTrafficSignals)
        .slice(0, maxDomainsPerUser),
    }))
    .filter((candidate) => candidate.domains.length > 0)
    .sort((a, b) => a.userId.localeCompare(b.userId));
}
