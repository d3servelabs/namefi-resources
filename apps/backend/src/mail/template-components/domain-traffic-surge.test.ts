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
    expect(getSuggestedDomainsHeading()).toBe('Similar domains available');
  });

  it('renders tiled top domains with Manage DNS links', async () => {
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

    expect(html).toContain(
      'Jordan, congratulations! Your domains are popular.',
    );
    expect(html).toContain('Keep the momentum going.');
    expect(html).toContain('Top Performing Domains');
    expect(html).toContain('Manage DNS');
    expect(html).not.toContain('>Manage DNS<');
    expect(html).toContain('/m/user/domains/brightlabs.com');
    expect(html).toContain('/m/user/domains/brightlabs.io');
    expect(html).toContain('traffic-surge-grid-column');
  });

  it('uses the single-domain variation without suggestions', async () => {
    const html = await render(
      createElement(DomainTrafficSurgeTemplate, {
        recipientName: 'Jordan',
        recipientEmail: 'jordan@example.com',
        domains: [{ domain: domain('brightlabs.com'), weeklyQueries: 94_320 }],
      }),
      { pretty: false },
    );

    expect(html).toContain('Jordan, congratulations! Your domain is popular.');
    expect(html).toContain('Keep the momentum going.');
    expect(html).toContain('Top Performing Domain');
    expect(html).not.toContain('Top Performing Domains');
    expect(html).not.toContain('Similar domains available');
  });

  it('renders suggested domain tiles with add-to-cart actions', async () => {
    const html = await render(
      createElement(DomainTrafficSurgeTemplate, {
        recipientName: 'Jordan',
        recipientEmail: 'jordan@example.com',
        domains: [{ domain: domain('brightlabs.com'), weeklyQueries: 94_320 }],
        suggestedDomains: [
          domain('brightlabshq.com'),
          domain('brightlabsteam.com'),
        ],
      }),
      { pretty: false },
    );

    expect(html).toContain('Similar domains available');
    expect(html).not.toContain('Available now');
    expect(html).toContain('Add brightlabshq.com to cart');
    expect(html).not.toContain('>Add to cart<');
    expect(html).toContain('/m/cart?add_to_cart=brightlabshq.com');
  });
});
