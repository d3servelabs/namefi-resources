import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { protos } from '@google-analytics/data';
import { parseDnsAnalyticsReportData } from '#lib/analytics-parser';

vi.mock('#temporal/client', () => ({
  temporalClient: {
    workflow: {
      start: vi.fn(),
      getHandle: vi.fn(),
      list: vi.fn(),
    },
    connection: {
      ensureConnected: vi.fn(),
    },
    workflowService: {
      listWorkflowExecutions: vi.fn(),
    },
  },
}));

// Mock env for GA property id
vi.mock('../../../lib/env', () => {
  return {
    config: {
      ALLOW_ALL_ORIGINS: true,
      ALLOW_LOGIN_NOTIFICATIONS: false,
      ALLOWED_CHAINS: {
        DNS_SERVING_ALLOWED_NFT_CHAINS: [11155111],
        NFSC_BALANCE_ALLOWED_CHAINS: [11155111],
        NFT_ALLOWED_CHAINS: [11155111],
      },
      DEV_NFSC_ENABLED: false,
      DEV_NFSC_SIGNUP_MINT_AMOUNT: 0,
      LOG_LEVEL: 'debug',
      NAMEFI_FIRST_PARTY_HOSTNAMES: ['namefi.test'],
    },
    secrets: {
      ALCHEMY_API_KEY: 'test-alchemy-api-key',
      API_AUTH_KEY: 'test-api-key',
      GA4_DNS_PROPERTY_ID: 'test-property-id',
      GA4_APP_PROPERTY_ID: 'test-app-property-id',
      GA4_KEY_FILE_PATH: undefined,
      PRIVY_SIGNATURE_VERIFICATION_KEY: undefined,
      PRIVY_WEBHOOK_SECRET: undefined,
      STRIPE_SECRET_KEY: 'sk_test_analytics_router',
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

function row3(
  firstDimValue: string,
  secondDimValue: string,
  thirdDimValue: string,
  count: number,
): protos.google.analytics.data.v1beta.IRow {
  return {
    dimensionValues: [
      { value: firstDimValue },
      { value: secondDimValue },
      { value: thirdDimValue },
    ],
    metricValues: [{ value: String(count) }],
  } as any;
}

// Mock GA4 client factory to return deterministic data across requested dimensions
vi.mock('../../../lib/analytics_client', () => {
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
        return { rows: [row('0', 200), row('3', 50), row('3abc', 5)] } as any; // 0=NOERROR, 3=NXDOMAIN
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
    createGA4DnsAnalyticsClient: (_config: any) => ({
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

vi.mock('@google-analytics/data', () => {
  return {
    BetaAnalyticsDataClient: class {
      async runReport(request: {
        dimensions?: Array<{ name?: string | null }>;
      }) {
        const dimensionNames =
          request.dimensions?.map((dimension) => dimension.name) ?? [];

        if (dimensionNames[0] === 'eventName' && dimensionNames.length === 1) {
          return [
            {
              rows: [
                row('user_begin_search', 1000),
                row('order_placed', 700),
                row('payment_processed', 650),
                row('domain_acquisition_started', 640),
                row('domain_acquisition_finished', 630),
                row('dns_records_propagated', 520),
                row('parking_finished', 500),
                row('payment_refunded', 70),
                row('order_finished_email_sent', 480),
                row('order_finished_email_opened', 300),
              ],
            },
          ];
        }

        if (
          dimensionNames[0] === 'eventName' &&
          dimensionNames[1] === 'customEvent:status' &&
          dimensionNames[2] === 'customEvent:order_status'
        ) {
          return [
            {
              rows: [
                row3('payment_processed', 'SUCCESS', '(not set)', 610),
                row3('payment_processed', 'FAILURE', '(not set)', 40),
                row3(
                  'domain_acquisition_finished',
                  'SUCCESS',
                  '(not set)',
                  560,
                ),
                row3('domain_acquisition_finished', 'FAILURE', '(not set)', 50),
                row3('domain_acquisition_finished', 'TIMEOUT', '(not set)', 20),
                row3('parking_finished', 'SUCCESS', '(not set)', 480),
                row3('parking_finished', 'TIMEOUT', '(not set)', 20),
                row3(
                  'order_finished_email_sent',
                  '(not set)',
                  'COMPLETED',
                  420,
                ),
                row3('order_finished_email_sent', '(not set)', 'FAILED', 60),
              ],
            },
          ];
        }

        return [{ rows: [] }];
      }
    },
  };
});

vi.mock('@google-analytics/admin', () => {
  return {
    AnalyticsAdminServiceClient: class {
      async createCustomDimension() {
        return [{}];
      }

      async createCustomMetric() {
        return [{}];
      }
    },
  };
});

const {
  getDashboardOverview,
  getCheckoutFlowOverview,
  getFullReportByRecordName,
} = await import('../analyticsRouter');

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
    expect(rcodes).toContain('RCODE:3abc');
    expect(rcodes).not.toContain('NXDOMAIN(3abc)');

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

  it('returns parsed checkout flow overview for funnel and sankey charts', async () => {
    const parsed = await getCheckoutFlowOverview({
      startDate: '7daysAgo',
      endDate: 'today',
      eventSource: 'all',
    });

    expect(parsed.summary.beginSearchCount).toBe(1000);
    expect(parsed.summary.orderPlacedCount).toBe(700);
    expect(parsed.summary.domainAcquisitionFinishedSuccessCount).toBe(560);
    expect(parsed.summary.refundedCount).toBe(70);
    expect(parsed.summary.conversionRatePercent).toBe(70.0);
    expect(parsed.summary.completionRatePercent).toBe(80.0);

    expect(parsed.funnel[0]).toEqual({
      eventName: 'user_begin_search',
      label: 'Begin Search',
      value: 1000,
    });
    expect(parsed.funnel[parsed.funnel.length - 1]).toEqual({
      eventName: 'order_finished_email_opened',
      label: 'Order Email Opened',
      value: 300,
    });

    expect(parsed.sankeyDomainAcquisition.nodes.length).toBeGreaterThan(0);
    expect(parsed.sankeyDomainAcquisition.links.length).toBeGreaterThan(0);
    expect(parsed.sankeyCheckout.nodes.length).toBeGreaterThan(0);
    expect(parsed.sankeyCheckout.links.length).toBeGreaterThan(0);

    expect(
      parsed.sankey.nodes.some(
        (node) => node.id === 'domain_acquisition_finished__SUCCESS',
      ),
    ).toBe(true);
    expect(
      parsed.sankey.nodes.some(
        (node) => node.id === 'domain_acquisition_finished__FAILURE',
      ),
    ).toBe(true);
    expect(
      parsed.sankey.nodes.some((node) =>
        node.id.startsWith('order_finished_email_sent__'),
      ),
    ).toBe(true);

    expect(
      parsed.sankey.links.some(
        (link) =>
          link.source === 'user_begin_search' && link.target === 'order_placed',
      ),
    ).toBe(true);
    expect(
      parsed.sankey.links.some(
        (link) =>
          link.source === 'domain_acquisition_finished__FAILURE' &&
          link.target === 'payment_refunded',
      ),
    ).toBe(true);
    expect(
      parsed.sankey.links.some(
        (link) =>
          link.source === 'payment_refunded' &&
          link.target.startsWith('order_finished_email_sent__'),
      ),
    ).toBe(true);
  });
});
