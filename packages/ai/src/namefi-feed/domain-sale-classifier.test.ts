import { describe, expect, it } from 'vitest';
import {
  __namefiFeedDomainSaleClassifierInternals,
  namefiFeedDomainSaleOpportunitySchema,
} from './domain-sale-classifier';
import {
  isUnsafeResolvedAddress,
  isValidIpAddress,
} from './domain-sale-classifier-ip-safety';

const {
  createPinnedLookup,
  normalizeUrl,
  resolveRelativeUrl,
  resolveSafeUnfurlHostname,
} = __namefiFeedDomainSaleClassifierInternals;

const detectedDomain = {
  domain: 'example.com',
  context: 'Listed for sale in the post.',
  askingPrice: '2500',
  askingCurrency: 'USD',
  purchaseUrl: 'https://example.com/buy',
  seller: '@seller',
  confidence: 'high' as const,
};

describe('Namefi feed unfurl URL safety', () => {
  it('rejects explicit non-http schemes before auto-prefixing', () => {
    expect(normalizeUrl('mailto:sales@example.com')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('ftp://example.com/listing')).toBeNull();
    expect(normalizeUrl('example.com/listing')).toBe(
      'https://example.com/listing',
    );
  });

  it('rejects hostnames that resolve to any unsafe address', async () => {
    const dnsLookup = async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ];

    await expect(
      resolveSafeUnfurlHostname(new URL('https://example.com'), dnsLookup),
    ).rejects.toThrow('unsafe_url');
  });

  it('returns the vetted address used by pinned fetch lookups', async () => {
    const dnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];

    await expect(
      resolveSafeUnfurlHostname(new URL('https://example.com'), dnsLookup),
    ).resolves.toEqual({ address: '93.184.216.34', family: 4 });
  });

  it('pins dispatcher DNS lookup to the vetted hostname and address', async () => {
    const pinnedLookup = createPinnedLookup('example.com', {
      address: '93.184.216.34',
      family: 4,
    });

    await expect(
      new Promise((resolve, reject) => {
        pinnedLookup('example.com', {}, (error, address, family) => {
          if (error) {
            reject(error);
            return;
          }
          resolve({ address, family });
        });
      }),
    ).resolves.toEqual({ address: '93.184.216.34', family: 4 });

    await expect(
      new Promise((resolve, reject) => {
        pinnedLookup('internal.local', {}, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(null);
        });
      }),
    ).rejects.toThrow('unexpected_lookup_hostname');
  });

  it('normalizes metadata URLs through the same safe URL rules', () => {
    expect(resolveRelativeUrl('/buy', 'https://example.com/listing')).toBe(
      'https://example.com/buy',
    );
    expect(
      resolveRelativeUrl('http://127.0.0.1/buy', 'https://example.com'),
    ).toBeNull();
  });
});

describe('namefiFeedDomainSaleOpportunitySchema', () => {
  it('requires detected opportunities to include domains', () => {
    expect(
      namefiFeedDomainSaleOpportunitySchema.safeParse({
        status: 'domain_sale_detected',
        reasoning: 'Explicit sale post.',
        summary: 'Example is listed.',
        domains: [detectedDomain],
      }).success,
    ).toBe(true);

    expect(
      namefiFeedDomainSaleOpportunitySchema.safeParse({
        status: 'domain_sale_detected',
        reasoning: 'Explicit sale post.',
        summary: 'Example is listed.',
        domains: [],
      }).success,
    ).toBe(false);
  });

  it('requires uncertain opportunities to omit domain candidates', () => {
    expect(
      namefiFeedDomainSaleOpportunitySchema.safeParse({
        status: 'uncertain',
        reasoning: 'The post does not clearly list a domain for sale.',
        summary: null,
        domains: [],
      }).success,
    ).toBe(true);

    expect(
      namefiFeedDomainSaleOpportunitySchema.safeParse({
        status: 'uncertain',
        reasoning: 'The post does not clearly list a domain for sale.',
        summary: null,
        domains: [detectedDomain],
      }).success,
    ).toBe(false);
  });

  it('rejects unsafe purchase URL hostnames', () => {
    expect(
      namefiFeedDomainSaleOpportunitySchema.safeParse({
        status: 'domain_sale_detected',
        reasoning: 'Explicit sale post.',
        summary: 'Example is listed.',
        domains: [
          {
            ...detectedDomain,
            purchaseUrl: 'http://127.0.0.1/buy',
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('isUnsafeResolvedAddress', () => {
  it('distinguishes IP literals from DNS hostnames', () => {
    expect(isValidIpAddress('8.8.8.8')).toBe(true);
    expect(isValidIpAddress('2606:4700:4700::1111')).toBe(true);
    expect(isValidIpAddress('example.com')).toBe(false);
  });

  it('allows public unicast addresses', () => {
    expect(isUnsafeResolvedAddress('8.8.8.8')).toBe(false);
    expect(isUnsafeResolvedAddress('2606:4700:4700::1111')).toBe(false);
  });

  it('blocks unsafe IPv4 ranges', () => {
    expect(isUnsafeResolvedAddress('10.0.0.1')).toBe(true);
    expect(isUnsafeResolvedAddress('100.64.0.1')).toBe(true);
    expect(isUnsafeResolvedAddress('198.18.0.1')).toBe(true);
    expect(isUnsafeResolvedAddress('203.0.113.10')).toBe(true);
  });

  it('blocks normalized unsafe IPv6 ranges', () => {
    expect(isUnsafeResolvedAddress('::')).toBe(true);
    expect(isUnsafeResolvedAddress('0:0:0:0:0:0:0:0')).toBe(true);
    expect(isUnsafeResolvedAddress('::1')).toBe(true);
    expect(isUnsafeResolvedAddress('0:0:0:0:0:0:0:1')).toBe(true);
    expect(isUnsafeResolvedAddress('64:ff9b:1::1')).toBe(true);
    expect(isUnsafeResolvedAddress('2001:db8::1')).toBe(true);
    expect(isUnsafeResolvedAddress('fc00::1')).toBe(true);
    expect(isUnsafeResolvedAddress('fe80::1')).toBe(true);
    expect(isUnsafeResolvedAddress('ff00::1')).toBe(true);
  });

  it('blocks IPv4 embedded in IPv6 literals', () => {
    expect(isUnsafeResolvedAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isUnsafeResolvedAddress('::127.0.0.1')).toBe(true);
    expect(isUnsafeResolvedAddress('0:0:0:0:0:0:127.0.0.1')).toBe(true);
    expect(isUnsafeResolvedAddress('::7f00:1')).toBe(true);
  });
});
