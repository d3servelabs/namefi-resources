import { describe, expect, it } from 'vitest';
import { buildDomainSearchOptions } from './domain-search-options';

describe('buildDomainSearchOptions', () => {
  it('includes purchased, Namefi Feed, Outbound, and Studio domains', () => {
    const options = buildDomainSearchOptions({
      userDomains: [{ normalizedDomainName: 'owned.com' }],
      feedListedDomains: [{ domain: 'feed.com' }],
      outboundDomains: [{ domain: 'outbound.com' }],
      studioDomains: [{ domain: 'studio.com', logoCount: 1 }],
      includeStudioDomains: true,
      onlyDomainsWithLogos: false,
    });

    expect(options).toEqual([
      { value: 'owned.com', sources: ['owned'] },
      { value: 'feed.com', sources: ['feed'] },
      { value: 'outbound.com', sources: ['outbound'] },
      { value: 'studio.com', sources: ['studio'] },
    ]);
  });

  it('lets purchased domains win when other sources include the same domain', () => {
    const options = buildDomainSearchOptions({
      userDomains: [{ normalizedDomainName: 'shared.com' }],
      feedListedDomains: [{ domain: 'shared.com' }],
      outboundDomains: [{ domain: 'shared.com' }],
      studioDomains: [{ domain: 'shared.com', logoCount: 1 }],
      includeStudioDomains: true,
      onlyDomainsWithLogos: false,
    });

    expect(options).toEqual([{ value: 'shared.com', sources: ['owned'] }]);
  });

  it('dedupes non-purchased overlaps without dropping source context', () => {
    const options = buildDomainSearchOptions({
      userDomains: [],
      feedListedDomains: [{ domain: 'shared.com' }],
      outboundDomains: [{ domain: 'shared.com' }],
      studioDomains: [{ domain: 'shared.com', logoCount: 1 }],
      includeStudioDomains: true,
      onlyDomainsWithLogos: false,
    });

    expect(options).toEqual([
      { value: 'shared.com', sources: ['feed', 'outbound', 'studio'] },
    ]);
  });

  it('can keep the logo-only Studio selector scoped to domains with logos', () => {
    const options = buildDomainSearchOptions({
      userDomains: [{ normalizedDomainName: 'owned.com' }],
      feedListedDomains: [{ domain: 'feed.com' }],
      outboundDomains: [{ domain: 'outbound.com' }],
      studioDomains: [
        { domain: 'logo.com', logoCount: 1 },
        { domain: 'poster-only.com', logoCount: 0 },
      ],
      includeStudioDomains: true,
      onlyDomainsWithLogos: true,
    });

    expect(options).toEqual([{ value: 'logo.com', sources: ['studio'] }]);
  });
});
