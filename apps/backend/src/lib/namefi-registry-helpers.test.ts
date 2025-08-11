import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { keccak256, toBytes } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  hashBasedPercentageRollouted,
  isReservedKeyword,
} from './namefi-registry-helpers';

/**
 * Tests for the percentageRollouted function that determines if a domain name
 * should be included in a percentage-based rollout.
 */
describe('hashBasedPercentageRollouted', () => {
  it('should return false for 0% rollout', () => {
    const testName = 'test.domain';
    expect(hashBasedPercentageRollouted(testName, 0)).toBe(false);
  });

  it('should return true for 100% rollout', () => {
    const testName = 'test.domain';
    expect(hashBasedPercentageRollouted(testName, 100)).toBe(true);
  });

  it('should be consistent for the same domain name', () => {
    const testName = 'consistent.example';
    const result1 = hashBasedPercentageRollouted(testName, 50);
    const result2 = hashBasedPercentageRollouted(testName, 50);
    expect(result1).toBe(result2);
  });

  it('should handle different domain names differently at the same percentage', () => {
    // Using two domain names that hash differently
    const testName1 = 'test1.example';
    const testName2 = 'test2.example';

    // At 50% rollout, some domains should be included and some excluded
    // This test doesn't guarantee different outcomes but tests the implementation
    const result1 = hashBasedPercentageRollouted(testName1, 50);
    const result2 = hashBasedPercentageRollouted(testName2, 50);

    // This test simply verifies our implementation logic
    const hash1 = keccak256(toBytes(testName1));
    const hash2 = keccak256(toBytes(testName2));
    const last4Bytes1 = hash1.slice(-4);
    const last4Bytes2 = hash2.slice(-4);
    const num1 = Number.parseInt(last4Bytes1, 16);
    const num2 = Number.parseInt(last4Bytes2, 16);
    const threshold = (16 ** 4 * 50) / 100;

    // Domains should both be in or both be out when they fall on same side of threshold
    const bothUnderThreshold = num1 < threshold && num2 < threshold;
    const bothOverThreshold = num1 >= threshold && num2 >= threshold;

    // Check if our test domains produce matching results for the same reason
    expect(result1 === result2).toBe(bothUnderThreshold || bothOverThreshold);
  });

  it('should include more domains as the percentage increases', () => {
    const domains = [
      'domain1.example',
      'domain2.example',
      'domain3.example',
      'domain4.example',
      'domain5.example',
    ];

    // Count domains included at different percentages
    const countAt10Percent = domains.filter((domain) =>
      hashBasedPercentageRollouted(domain, 10),
    ).length;
    const countAt50Percent = domains.filter((domain) =>
      hashBasedPercentageRollouted(domain, 50),
    ).length;
    const countAt90Percent = domains.filter((domain) =>
      hashBasedPercentageRollouted(domain, 90),
    ).length;

    // As percentage increases, more domains should be included
    expect(countAt90Percent).toBeGreaterThanOrEqual(countAt50Percent);
    expect(countAt50Percent).toBeGreaterThanOrEqual(countAt10Percent);
  });

  it('should respect the percentage threshold', () => {
    // Test with 1000 random domain names at 30% rollout
    const percentage = 30;
    let includedCount = 0;
    const sampleSize = 10000;

    for (let i = 0; i < sampleSize; i++) {
      const randomDomain = `test-${Math.random().toString(36).substring(2)}.example`;
      if (hashBasedPercentageRollouted(randomDomain, percentage)) {
        includedCount++;
      }
    }

    // Allow for some statistical variance (±2%)
    const lowerBound = ((percentage - 2) / 100) * sampleSize;
    const upperBound = ((percentage + 2) / 100) * sampleSize;
    expect(includedCount).toBeGreaterThanOrEqual(lowerBound);
    expect(includedCount).toBeLessThanOrEqual(upperBound);
  });
});

describe('isReserved', () => {
  const domains = [
    'www.0x.city',
    'blog.0x.city',
    'docs.0x.city',
    'support.0x.city',
    'api.0x.city',
    'dev.0x.city',
    'status.0x.city',
    'shop.0x.city',
    'app.0x.city',
    'login.0x.city',
    'news.0x.city',
    'events.0x.city',
    'careers.0x.city',
    'jobs.0x.city',
    'community.0x.city',
    'forum.0x.city',
    'chat.0x.city',
    'help.0x.city',
    'store.0x.city',
    'account.0x.city',
    'marketing.0x.city',
    'sales.0x.city',
    'engineering.0x.city',
    'legal.0x.city',
    'security.0x.city',
    'assets.0x.city',
    'cdn.0x.city',
    'static.0x.city',
    'media.0x.city',
    'download.0x.city',
    'upload.0x.city',
    'partners.0x.city',
    'affiliate.0x.city',
    'reseller.0x.city',
    'investor.0x.city',
    'press.0x.city',
    'm.0x.city',
    'mobile.0x.city',
    'admin.0x.city',
    'internal.0x.city',
    'intranet.0x.city',
    'hr.0x.city',
    'payroll.0x.city',
    'benefits.0x.city',
    'analytics.0x.city',
    'metrics.0x.city',
    'monitor.0x.city',
    'logs.0x.city',
    'backup.0x.city',
    'storage.0x.city',
    'cloud.0x.city',
    'portal.0x.city',
    'dashboard.0x.city',
    'billing.0x.city',
    'payments.0x.city',
    'invoice.0x.city',
    'subscriptions.0x.city',
    'auth.0x.city',
    'sso.0x.city',
    'vault.0x.city',
    'secure.0x.city',
    'ssl.0x.city',
    'test.0x.city',
    'staging.0x.city',
    'qa.0x.city',
    'sandbox.0x.city',
    'demo.0x.city',
    'beta.0x.city',
    'alpha.0x.city',
    'legacy.0x.city',
    'archive.0x.city',
    'research.0x.city',
    'labs.0x.city',
    'academy.0x.city',
    'learn.0x.city',
    'university.0x.city',
    'explore.0x.city',
    'discover.0x.city',
    'connect.0x.city',
    'network.0x.city',
    'api-docs.0x.city',
    'developer.0x.city',
    'git.0x.city',
    'repo.0x.city',
    'docker.0x.city',
    'kubernetes.0x.city',
    'ci.0x.city',
    'cd.0x.city',
    'status-page.0x.city',
    'uptime.0x.city',
    'myaccount.0x.city',
    'profile.0x.city',
    'settings.0x.city',
    'preferences.0x.city',
    'search.0x.city',
    'maps.0x.city',
    'locations.0x.city',
    'mail.0x.city',
    'email.0x.city',
    'webmail.0x.city',
  ];
  domains.forEach((domain) => {
    it(`should return true for sub domains that would look like a company typical official site: ${domain}`, () => {
      const prefix = domain.split('.')[0];
      expect(
        isReservedKeyword(prefix as NamefiNormalizedDomain),
        `Expected in the "${domain}", the prefix "${prefix}" should be reserved`,
      ).toBe(true);
    });
  });
  it('should return true for domains that are reserved for widely used brand names', () => {
    const reservedDomains = [
      'apple',
      'google',
      'amazon',
      'facebook',
      'twitter',
      'instagram',
      'linkedin',
      'pinterest',
    ];

    reservedDomains.forEach((domain) => {
      expect(isReservedKeyword(domain as NamefiNormalizedDomain)).toBe(true);
    });
  });

  it('should return true for blockchain-specific reserved domains', () => {
    const blockchainReservedDomains = [
      'wallet',
      'staking',
      'swap',
      'bridge',
      'contract',
      'dex',
      'forum',
      'docs',
    ];

    blockchainReservedDomains.forEach((domain) => {
      expect(isReservedKeyword(domain as NamefiNormalizedDomain)).toBe(true);
    });
  });
});
