import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { protos } from '@google-analytics/data';
import {
  getDashboardOverview,
  getFullReportByRecordName,
} from './analyticsRouter';
import { parseDnsAnalyticsReportData } from '#lib/analytics-parser';

// Mock env for GA property id
vi.mock('../../lib/env', async () => {
  const actual: any = await vi.importActual('../../lib/env');
  return {
    ...actual,
    secrets: {
      ...actual.secrets,
      GA4_PROPERTY_ID: 'test-property-id',
      GA4_KEY_FILE_PATH: undefined,
    },
  };
});

// Build a helper to fabricate GA4 rows
function row(
  dimValue: string,
  count: number,
): protos.google.analytics.data.v1beta.IRow {
  return {
    dimensionValues: [{ value: dimValue }],
    metricValues: [{ value: String(count) }],
  } as any;
}

// Mock GA4 client factory to return deterministic data across requested dimensions
vi.mock('../../lib/analytics_client', () => {
  function makeResponse(
    dim: string,
  ): protos.google.analytics.data.v1beta.IRunReportResponse {
    switch (dim) {
      case 'customEvent:domain':
        return {
          rows: [
            row('example.com', 120),
            row('foo.example.com', 80),
            row('bar.io', 50),
          ],
        } as any;
      case 'customEvent:rcode':
        return { rows: [row('0', 200), row('3', 50)] } as any; // 0=NOERROR, 3=NXDOMAIN
      case 'customEvent:query_type':
        return { rows: [row('A', 180), row('AAAA', 70)] } as any;
      case 'customEvent:cache_hit':
        return { rows: [row('true', 175), row('false', 75)] } as any; // 70% hit
      case 'customEvent:client_ip':
        return {
          rows: [row('1.1.1.1', 90), row('8.8.8.8', 60), row('9.9.9.9', 20)],
        } as any;
      case 'customEvent:dnssec':
        return { rows: [row('true', 120), row('false', 130)] } as any;
      case 'dateHour':
        return {
          rows: [
            row('2025010101', 50),
            row('2025010102', 60),
            row('2025010103', 40),
          ],
        } as any;
      case 'date':
        return {
          rows: [
            row('20250101', 100),
            row('20250102', 100),
            row('20250103', 50),
          ],
        } as any;
      case 'customEvent:public_suffix':
        return { rows: [row('com', 180), row('io', 70)] } as any;
      case 'customEvent:public_suffix_plus_one':
        return { rows: [row('example.com', 150), row('bar.io', 60)] } as any;
      default:
        return { rows: [] } as any;
    }
  }

  return {
    createGA4Client: (_config: any) => ({
      // The router calls client['runReport'] with a request object containing dimensions[0].name
      runReport: async (req: any) => {
        const dimName = req.dimensions?.[0]?.name ?? '';
        return makeResponse(dimName);
      },
      // Also expose these methods in case any code path uses them (not needed for current tests)
      getByPublicSuffix: async (_dr: any, _limit: number) =>
        makeResponse('customEvent:public_suffix'),
      getByPublicSuffixPlusOne: async (_dr: any, _limit: number) =>
        makeResponse('customEvent:public_suffix_plus_one'),
    }),
  };
});

describe('Analytics Router + Parser (e2e-style)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses getDashboardOverview output into frontend-friendly shape', async () => {
    const raw = await getDashboardOverview({
      startDate: '7daysAgo',
      endDate: 'today',
    });
    const parsed = parseDnsAnalyticsReportData(raw as any);

    // Summary
    expect(parsed.summary.totalQueries).toBe(250); // 100 + 100 + 50 from dailyVolume
    expect(parsed.summary.uniqueDomains).toBe(3);
    expect(parsed.summary.uniqueClientIps).toBe(3);
    expect(parsed.summary.cacheHitRatePercent).toBe(70.0);

    // Cache breakdown
    expect(parsed.cacheHitBreakdown.hits).toBe(175);
    expect(parsed.cacheHitBreakdown.misses).toBe(75);
    expect(parsed.cacheHitBreakdown.hitRatePercent).toBe(70.0);

    // Response codes should be mapped by the router helper (e.g., NOERROR(0))
    const rcodes = parsed.queriesByResponseCode.map((r) => r.rcode);
    expect(rcodes.some((r) => r.includes('NOERROR'))).toBe(true);
    expect(rcodes.some((r) => r.includes('NXDOMAIN'))).toBe(true);

    // Top domains
    expect(parsed.topDomains[0]).toEqual({ domain: 'example.com', count: 120 });

    // Volumes
    expect(parsed.hourlyVolume.length).toBeGreaterThan(0);
    expect(parsed.dailyVolume).toEqual([
      { date: '20250101', count: 100 },
      { date: '20250102', count: 100 },
      { date: '20250103', count: 50 },
    ]);

    // Public suffix data
    expect(parsed.publicSuffix).toEqual([
      { publicSuffix: 'com', count: 180 },
      { publicSuffix: 'io', count: 70 },
    ]);
    expect(parsed.publicSuffixPlusOne).toEqual([
      { domain: 'example.com', count: 150 },
      { domain: 'bar.io', count: 60 },
    ]);
  });

  it('respects record-name filtered full report and parses correctly', async () => {
    const raw = await getFullReportByRecordName({
      startDate: '7daysAgo',
      endDate: 'today',
      domainName: 'example.com',
    });
    const parsed = parseDnsAnalyticsReportData(raw as any);

    // We return the same mocked data for simplicity; validate core invariants
    expect(parsed.summary.totalQueries).toBe(250);
    expect(
      parsed.topDomains.find((d) => d.domain === 'example.com')?.count,
    ).toBe(120);
  });
});
