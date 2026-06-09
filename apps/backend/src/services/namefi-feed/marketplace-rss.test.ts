import { describe, expect, it } from 'vitest';
import {
  NAMEFI_FEED_MARKETPLACE_RSS_FEEDS,
  parseNamefiFeedMarketplaceRss,
  shouldQueueNamefiFeedMarketplaceRssItem,
} from './marketplace-rss';

describe('Namefi feed marketplace RSS parsing', () => {
  it('parses NamePros marketplace RSS items with exact source metadata', () => {
    const feed = NAMEFI_FEED_MARKETPLACE_RSS_FEEDS.find(
      (candidate) => candidate.id === 'namepros-buy-domains',
    );
    if (!feed) {
      throw new Error('Expected NamePros buy domains feed to be configured.');
    }

    const [item] = parseNamefiFeedMarketplaceRss(
      `<?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
        <channel>
          <item>
            <title>DomainNameTalk.com Perfect for domain name ventures! (23yo)</title>
            <description><![CDATA[Just $2,888 $1,688, and it's all yours]]></description>
            <pubDate>Tue, 09 Jun 2026 05:58:26 +0000</pubDate>
            <link>https://www.namepros.com/threads/domainnametalk-com-perfect-for-domain-name-ventures-23yo.1356325/</link>
            <guid>https://www.namepros.com/threads/domainnametalk-com-perfect-for-domain-name-ventures-23yo.1356325/</guid>
            <author>internext-14468@namepros.email (internext)</author>
            <category domain="https://www.namepros.com/forums/buy-now-minimum-500.221/"><![CDATA[Buy Now: Minimum $500]]></category>
            <dc:creator>internext</dc:creator>
            <content:encoded><![CDATA[<div class="bbWrapper">DomainNameTalk.com<br />Former forum operated by WebHostingTalk.com<br />Just $2,888 $1,688</div>]]></content:encoded>
          </item>
        </channel>
      </rss>`,
      feed,
    );

    if (!item) {
      throw new Error('Expected NamePros RSS item to parse.');
    }

    expect(item.feed.source).toBe('namepros');
    expect(item.externalPostId).toBe('1356325');
    expect(item.authorUsername).toBe('internext');
    expect(item.category).toBe('Buy Now: Minimum $500');
    expect(item.sourceUrl).toBe(
      'https://www.namepros.com/threads/domainnametalk-com-perfect-for-domain-name-ventures-23yo.1356325/',
    );
    expect(item.domains).toContain('domainnametalk.com');
    expect(item.text).toContain('Category: Buy Now: Minimum $500');
    expect(shouldQueueNamefiFeedMarketplaceRssItem(item)).toBe(true);
  });

  it('parses DNForum RSS items with exact source metadata', () => {
    const feed = NAMEFI_FEED_MARKETPLACE_RSS_FEEDS.find(
      (candidate) => candidate.id === 'dnforum-com-domain-market',
    );
    if (!feed) {
      throw new Error('Expected DNForum .com market feed to be configured.');
    }

    const [item] = parseNamefiFeedMarketplaceRss(
      `<?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
        <channel>
          <item>
            <title>nxm.com for sale</title>
            <pubDate>Tue, 09 Jun 2026 03:02:08 +0000</pubDate>
            <link>https://www.dnforum.com/threads/nxm-com-for-sale.634918/</link>
            <guid isPermaLink="false">634918</guid>
            <author>invalid@example.com (candybroker)</author>
            <category domain="https://www.dnforum.com/forums/com-domain-marketplace/"><![CDATA[.com Domain Market]]></category>
            <dc:creator>candybroker</dc:creator>
            <content:encoded><![CDATA[<div class="bbWrapper"><a href="http://nxm.com"><b>nxm.com</b></a> $21,500 usd for sale</div>]]></content:encoded>
          </item>
        </channel>
      </rss>`,
      feed,
    );

    if (!item) {
      throw new Error('Expected DNForum RSS item to parse.');
    }

    expect(item.feed.source).toBe('dnforum');
    expect(item.externalPostId).toBe('634918');
    expect(item.authorUsername).toBe('candybroker');
    expect(item.category).toBe('.com Domain Market');
    expect(item.candidateUrls).toContain(
      'https://www.dnforum.com/threads/nxm-com-for-sale.634918/',
    );
    expect(item.domains).toContain('nxm.com');
    expect(shouldQueueNamefiFeedMarketplaceRssItem(item)).toBe(true);
  });

  it('does not queue categories outside the exact feed allowlist', () => {
    const feed = NAMEFI_FEED_MARKETPLACE_RSS_FEEDS.find(
      (candidate) => candidate.id === 'namepros-buy-domains',
    );
    if (!feed) {
      throw new Error('Expected NamePros buy domains feed to be configured.');
    }

    const [item] = parseNamefiFeedMarketplaceRss(
      `<?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>any .io transfer code anywhere ?</title>
            <pubDate>Tue, 09 Jun 2026 06:14:58 +0000</pubDate>
            <link>https://www.namepros.com/threads/any-io-transfer-code-anywhere.1389331/</link>
            <guid>https://www.namepros.com/threads/any-io-transfer-code-anywhere.1389331/</guid>
            <author>UncleBrand-991544@namepros.email (UncleBrand)</author>
            <category><![CDATA[Domain Coupons and Offers]]></category>
            <description><![CDATA[there are no .io transfer deal today]]></description>
          </item>
        </channel>
      </rss>`,
      feed,
    );

    if (!item) {
      throw new Error('Expected NamePros coupon RSS item to parse.');
    }

    expect(item.feed.source).toBe('namepros');
    expect(item.category).toBe('Domain Coupons and Offers');
    expect(shouldQueueNamefiFeedMarketplaceRssItem(item)).toBe(false);
  });
});
