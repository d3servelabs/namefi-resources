import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { render } from '@react-email/render';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  DomainTrafficSurgeTemplate,
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
        fallbackSubject: '[Namefi] Your domains are heating up',
      }),
    ).toBe('[Namefi] Your domains are heating up');

    expect(
      getDomainTrafficSurgeEmailTitle({
        domains: [{ domain: domain('brightlabs.com'), weeklyQueries: 94_320 }],
        fallbackSubject: 'fallback',
      }),
    ).toBe(
      'Your domain is heating up: Namefi measured 94k lookups for brightlabs.com',
    );

    expect(
      getDomainTrafficSurgeEmailTitle({
        domains: [
          { domain: domain('brightlabs.io'), weeklyQueries: 41_880 },
          { domain: domain('brightlabs.com'), weeklyQueries: 94_320 },
        ],
        fallbackSubject: 'fallback',
      }),
    ).toBe(
      'Your domains are heating up: Namefi measured 136k lookups across 2 domains',
    );
  });

  it('uses aggregate suggestion copy for multiple heating domains', () => {
    expect(getSuggestedDomainsHeading()).toBe(
      'Similar domains to the ones heating up',
    );
  });

  it('does not duplicate the top domain summary for multiple heating domains', async () => {
    const html = await render(
      createElement(DomainTrafficSurgeTemplate, {
        recipientName: 'Jordan',
        recipientEmail: 'jordan@example.com',
        domains: [
          { domain: domain('brightlabs.io'), weeklyQueries: 41_880 },
          { domain: domain('brightlabs.com'), weeklyQueries: 94_320 },
        ],
      }),
      { pretty: false },
    );

    expect(html).toContain('Your domains are heating up.');
    expect(html).toContain('Most active domains');
    expect(html).not.toMatch(/Most active domain(?!s)/);
  });

  it('keeps the active domain summary when only one domain heated up', async () => {
    const html = await render(
      createElement(DomainTrafficSurgeTemplate, {
        recipientName: 'Jordan',
        recipientEmail: 'jordan@example.com',
        domains: [{ domain: domain('brightlabs.com'), weeklyQueries: 94_320 }],
      }),
      { pretty: false },
    );

    expect(html).toContain('Your domain is heating up.');
    expect(html).toContain('Active domain');
    expect(html).not.toContain('Most active domains');
  });
});
