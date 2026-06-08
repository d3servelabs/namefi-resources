import { describe, expect, it } from 'vitest';
import {
  formatNamefiFeedSalesDigestInsight,
  type NamefiFeedSalesDigestInsight,
  type NamefiFeedSalesDigestPromptContext,
} from './sales-digest';

describe('formatNamefiFeedSalesDigestInsight', () => {
  it('uses the actual digest run window in rendered copy', () => {
    const insight: NamefiFeedSalesDigestInsight = {
      topPicks: [
        {
          domain: 'example.com',
          thesis: 'Short, familiar, and easy to reuse across buyer categories.',
          tweetTake:
            'The name is clean enough for broad demand while staying simple.',
          tweetPoints: [
            'Clear commercial utility across several buyer types.',
            'Simple structure supports resale liquidity.',
          ],
        },
      ],
    };
    const context: NamefiFeedSalesDigestPromptContext = {
      runMeta: {
        startIso: '2026-06-08T00:00:00.000Z',
        endIso: '2026-06-08T06:00:00.000Z',
        generatedAtIso: '2026-06-08T06:00:00.000Z',
      },
      marketStats: {
        totalListings: 2,
        uniqueDomains: 2,
        sampledListings: 2,
        omittedListings: 0,
        pricedListings: 0,
        buyNowListings: 0,
        usdPricedListings: 0,
        requiredTopPicks: 1,
        medianAskUsd: null,
        topTlds: [],
        lengthBuckets: [],
        topPatterns: [],
      },
      taxonomyHints: {
        liquidPatterns: [],
        brandableSignals: [],
        riskSignals: [],
      },
      listings: [],
    };

    const rendered = formatNamefiFeedSalesDigestInsight(insight, context);

    expect(rendered).toContain('6-hour window');
    expect(rendered).toContain('6h window');
    expect(rendered).not.toContain('last 24 hours');
    expect(rendered).not.toContain('24h window');
  });

  it('counts additional domains by unique domain, not listing rows', () => {
    const insight: NamefiFeedSalesDigestInsight = {
      topPicks: [
        {
          domain: 'alpha.com',
          thesis: 'Short, familiar, and easy to reuse across buyer categories.',
          tweetTake:
            'The name is clean enough for broad demand while staying simple.',
          tweetPoints: [
            'Clear commercial utility across several buyer types.',
            'Simple structure supports resale liquidity.',
          ],
        },
      ],
    };
    const context: NamefiFeedSalesDigestPromptContext = {
      runMeta: {
        startIso: '2026-06-08T00:00:00.000Z',
        endIso: '2026-06-09T00:00:00.000Z',
        generatedAtIso: '2026-06-09T00:00:00.000Z',
      },
      marketStats: {
        totalListings: 4,
        uniqueDomains: 2,
        sampledListings: 4,
        omittedListings: 0,
        pricedListings: 0,
        buyNowListings: 0,
        usdPricedListings: 0,
        requiredTopPicks: 1,
        medianAskUsd: null,
        topTlds: [],
        lengthBuckets: [],
        topPatterns: [],
      },
      taxonomyHints: {
        liquidPatterns: [],
        brandableSignals: [],
        riskSignals: [],
      },
      listings: [
        buildPromptListing('alpha.com', 'https://x.com/a/status/1'),
        buildPromptListing('alpha.com', 'https://x.com/a/status/2'),
        buildPromptListing('beta.com', 'https://x.com/b/status/1'),
        buildPromptListing('beta.com', 'https://x.com/b/status/2'),
      ],
    };

    const rendered = formatNamefiFeedSalesDigestInsight(insight, context);

    expect(rendered).toContain('More: 1 additional domain');
    expect(rendered).not.toContain('More: 3 additional domains');
  });
});

function buildPromptListing(
  domain: string,
  sourceTweetUrl: string,
): NamefiFeedSalesDigestPromptContext['listings'][number] {
  return {
    domain,
    tld: 'com',
    sldLength: domain.split('.')[0]?.length ?? domain.length,
    patternTags: [],
    askingPriceRaw: null,
    askingCurrency: null,
    askingUsd: null,
    hasBuyNow: false,
    purchaseUrl: null,
    seller: null,
    sellerListingsInWindow: 1,
    messageSnippet: null,
    sourceTweetUrl,
    listedAt: '2026-06-08T00:00:00.000Z',
  };
}
