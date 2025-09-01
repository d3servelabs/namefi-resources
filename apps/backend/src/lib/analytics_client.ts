import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { protos } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsConfig {
  propertyId: string;
  credentials?: any;
  keyFilename?: string;
}

type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse;

export class GA4AnalyticsClient {
  private client: BetaAnalyticsDataClient;
  private adminClient: AnalyticsAdminServiceClient;
  private propertyId: string;

  constructor(config: AnalyticsConfig) {
    this.propertyId = config.propertyId;
    this.client = new BetaAnalyticsDataClient({
      credentials: config.credentials,
      keyFilename: config.keyFilename,
    });
    this.adminClient = new AnalyticsAdminServiceClient({
      credentials: config.credentials,
      keyFilename: config.keyFilename,
    });
  }

  async runReport(
    request: protos.google.analytics.data.v1beta.IRunReportRequest,
  ): Promise<RunReportResponse> {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      ...request,
    });
    return response;
  }

  async createCustomDimensions(): Promise<void> {
    const customDimensions = [
      {
        parameterName: 'domain',
        displayName: 'DNS Query Domain Name',
        description: 'The domain name queried in DNS requests',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'public_suffix',
        displayName: 'Public Suffix',
        description:
          'The public suffix of the domain name queried in DNS requests (e.g. "com", "br", "co.uk", "co.jp", etc.)',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'public_suffix_plus_one',
        displayName: 'Public Suffix Plus One Label',
        description:
          'The public suffix of the domain name queried in DNS requests + 1 label, e.g. "example.com", "example.com.br"',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'ttl',
        displayName: 'DNS TTL',
        description: 'Time-to-live value for DNS responses',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'rcode',
        displayName: 'DNS Response Code',
        description: 'DNS response code (NOERROR, NXDOMAIN, etc.)',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'query_type',
        displayName: 'DNS Query Type',
        description: 'DNS query type (A, AAAA, MX, TXT, etc.)',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'cache_hit',
        displayName: 'DNS Cache Hit',
        description: 'Whether the DNS query was served from cache',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'country',
        displayName: 'Client Country/Region',
        description: 'Country code of the DNS query client',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'dnssec',
        displayName: 'DNSSEC Status',
        description: 'DNSSEC validation status for the DNS response',
        scope: 'EVENT' as const,
      },
      {
        parameterName: 'client_ip',
        displayName: 'Client IP Address',
        description: 'IP address of the DNS query client',
        scope: 'EVENT' as const,
      },
    ];

    const results = [];

    for (const dimension of customDimensions) {
      try {
        console.log(`Creating custom dimension: ${dimension.displayName}`);

        const [response] = await this.adminClient.createCustomDimension({
          parent: `properties/${this.propertyId}`,
          customDimension: dimension,
        });

        results.push({
          success: true,
          dimension: dimension.displayName,
          response: response.name,
        });

        console.log(`✓ Created: ${dimension.displayName} (${response.name})`);
      } catch (error: any) {
        if (error.code === 6) {
          // ALREADY_EXISTS error
          console.log(`↪ Already exists: ${dimension.displayName}`);
          results.push({
            success: true,
            dimension: dimension.displayName,
            response: 'Already exists',
          });
        } else {
          console.error(
            `✗ Failed to create ${dimension.displayName}:`,
            error.message,
          );
          results.push({
            success: false,
            dimension: dimension.displayName,
            error: error.message,
          });
        }
      }
    }

    console.log('\nCustom Dimension Creation Summary:');
    console.log('==================================');
    results.forEach((result) => {
      const status = result.success ? '✓' : '✗';
      console.log(
        `${status} ${result.dimension}: ${result.response || result.error}`,
      );
    });

    console.log(
      '\nNote: Custom dimensions may take 24-48 hours to start collecting data.',
    );
  }

  async getTopDomains(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
    limit = 50,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:domain' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }

  async getByPublicSuffix(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
    limit = 50,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:public_suffix' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }

  async getByPublicSuffixPlusOne(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
    limit = 50,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:public_suffix_plus_one' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }

  async getQueriesByResponseCode(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:rcode' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
  }

  async getQueriesByType(
    dateRange: DateRange = { startDate: '1daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:query_type' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
  }

  async getCacheHitRatio(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:cache_hit' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
    });
  }

  async getQueriesByCountry(
    dateRange: DateRange = { startDate: '30daysAgo', endDate: 'today' },
    limit = 20,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:country' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }

  async getDnssecStats(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:dnssec' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
    });
  }

  async getResponseSizeDistribution(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
      dimensions: [{ name: 'dateHour' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'dateHour' }, desc: false }],
    });
  }

  async getTopClientIps(
    dateRange: DateRange = { startDate: '1daysAgo', endDate: 'today' },
    limit = 100,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:client_ip' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }

  async getQueriesByDomainPattern(
    pattern = '.com',
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'customEvent:domain' },
        { name: 'customEvent:query_type' },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'dns_query',
                },
              },
            },
            {
              filter: {
                fieldName: 'customEvent:domain',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: pattern,
                },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
  }

  async getTtlDistribution(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
    minEvents = 10,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
      dimensions: [{ name: 'customEvent:ttl' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      metricFilter: {
        filter: {
          fieldName: 'eventCount',
          numericFilter: {
            operation: 'GREATER_THAN',
            value: {
              int64Value: minEvents.toString(),
            },
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
  }

  async getHourlyQueryVolume(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'dateHour' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'dateHour' }, desc: false }],
    });
  }

  async getDailyQueryVolume(
    dateRange: DateRange = { startDate: '30daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'date' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });
  }

  async getQueryLatency(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
      dimensions: [{ name: 'customEvent:query_type' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
  }

  async getErrorRateByDomain(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
    limit = 50,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'customEvent:domain' },
        { name: 'customEvent:rcode' },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'dns_query',
                },
              },
            },
            {
              filter: {
                fieldName: 'customEvent:rcode',
                stringFilter: {
                  matchType: 'PARTIAL_REGEXP',
                  value: '^(?!NOERROR).*',
                },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }

  async getTopDomainsWithDetails(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
    limit = 50,
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'customEvent:domain' },
        { name: 'customEvent:query_type' },
        { name: 'customEvent:rcode' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'dns_query',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });
  }
}

export const createGA4Client = (
  config: AnalyticsConfig,
): GA4AnalyticsClient => {
  return new GA4AnalyticsClient(config);
};
