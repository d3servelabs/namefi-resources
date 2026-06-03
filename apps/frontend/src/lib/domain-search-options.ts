import type {
  DomainSearchOption,
  DomainSearchOptionSource,
} from '@/components/domain-search-combobox';

export type UserDomainOptionInput = {
  normalizedDomainName: string;
};

export type GenerationDomainOptionInput = {
  domain: string;
  logoCount?: number | null;
};

export type FeedListedDomainOptionInput = {
  domain: string;
};

export type OutboundDomainOptionInput = {
  domain: string;
};

export function buildDomainSearchOptions({
  userDomains,
  generationDomains,
  feedListedDomains,
  outboundDomains,
  includeGeneratedDomains,
  onlyDomainsWithLogos,
}: {
  userDomains: UserDomainOptionInput[];
  generationDomains: GenerationDomainOptionInput[];
  feedListedDomains: FeedListedDomainOptionInput[];
  outboundDomains: OutboundDomainOptionInput[];
  includeGeneratedDomains: boolean;
  onlyDomainsWithLogos: boolean;
}) {
  const byDomain = new Map<string, DomainSearchOption>();

  const addDomain = (value: string, source: DomainSearchOptionSource) => {
    const domain = value.trim().toLowerCase();
    if (!domain) return;

    const existing = byDomain.get(domain);
    if (source === 'owned') {
      byDomain.set(domain, { value: domain, sources: ['owned'] });
      return;
    }

    if (existing) {
      if (existing.sources.includes('owned')) return;

      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      return;
    }

    byDomain.set(domain, { value: domain, sources: [source] });
  };

  if (onlyDomainsWithLogos) {
    for (const domain of generationDomains) {
      if ((domain.logoCount ?? 0) > 0) {
        addDomain(domain.domain, 'generated');
      }
    }
    return Array.from(byDomain.values());
  }

  for (const domain of userDomains) {
    addDomain(domain.normalizedDomainName, 'owned');
  }

  for (const domain of feedListedDomains) {
    addDomain(domain.domain, 'feed');
  }

  for (const domain of outboundDomains) {
    addDomain(domain.domain, 'outbound');
  }

  if (includeGeneratedDomains) {
    for (const domain of generationDomains) {
      addDomain(domain.domain, 'generated');
    }
  }

  return Array.from(byDomain.values());
}
