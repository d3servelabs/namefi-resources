import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { describe, expect, it } from 'vitest';
import {
  formatCompactTrafficQueryCount,
  formatDomainCountLabel,
  formatLookupMetric,
  getDomainTrafficSurgeEmailTitle,
  getSuggestedDomainsHeading,
  normalizeTrafficQueryCount,
} from './domain-traffic-surge';

const domain = (value: string) => namefiNormalizedDomainSchema.parse(value);

describe('domain traffic surge formatting', () => {
  it('normalizes traffic counts before display', () => {
    expect(normalizeTrafficQueryCount(1.2)).toBe(1);
    expect(normalizeTrafficQueryCount(1.6)).toBe(2);
    expect(normalizeTrafficQueryCount(-10)).toBe(0);
  });

  it('formats compact counts across key thresholds', () => {
    expect(formatCompactTrafficQueryCount(999)).toBe('999');
    expect(formatCompactTrafficQueryCount(1_000)).toBe('1k');
    expect(formatCompactTrafficQueryCount(1_500)).toBe('1.5k');
    expect(formatCompactTrafficQueryCount(9_999)).toBe('10k');
    expect(formatCompactTrafficQueryCount(10_000)).toBe('10k');
    expect(formatCompactTrafficQueryCount(94_320)).toBe('94k');
    expect(formatCompactTrafficQueryCount(1_250_000)).toBe('1.3M');
  });

  it('formats rounded lookup labels', () => {
    expect(formatLookupMetric(1)).toBe('1 lookup');
    expect(formatLookupMetric(2)).toBe('2 lookups');
    expect(formatLookupMetric(94_320)).toBe('94k lookups');
  });

  it('formats domain count labels', () => {
    expect(formatDomainCountLabel(1)).toBe('1 domain');
    expect(formatDomainCountLabel(2)).toBe('2 domains');
  });

  it('builds subject titles from traffic data', () => {
    expect(
      getDomainTrafficSurgeEmailTitle({
        domains: [],
        fallbackSubject: '[Namefi] Activity measured on your domains',
      }),
    ).toBe('[Namefi] Activity measured on your domains');

    expect(
      getDomainTrafficSurgeEmailTitle({
        domains: [{ domain: domain('brightlabs.com'), weeklyQueries: 94_320 }],
        fallbackSubject: 'fallback',
      }),
    ).toBe('94k lookups for brightlabs.com');

    expect(
      getDomainTrafficSurgeEmailTitle({
        domains: [
          { domain: domain('brightlabs.io'), weeklyQueries: 41_880 },
          { domain: domain('brightlabs.com'), weeklyQueries: 94_320 },
        ],
        fallbackSubject: 'fallback',
      }),
    ).toBe('136k lookups across 2 domains');
  });

  it('uses aggregate suggestion copy for multiple heating domains', () => {
    expect(getSuggestedDomainsHeading()).toBe(
      'Similar domains to the ones heating up',
    );
  });
});
