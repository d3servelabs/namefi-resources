import { z } from 'zod';
import {
  adminProcedureWithPermissions,
  createTRPCRouter,
  publicProcedure,
  withRequiredPermissions,
} from '../base';
import { namefiNormalizedDomainSchema, Permission } from '@namefi-astra/utils';
import { createGA4Client, type DateRange } from '../../lib/analytics_client';
import { secrets } from '../../lib/env';
import { createLogger } from '#lib/logger';
import { dnsRcodes } from '../../lib/dns/rcodes';
import { parseDnsAnalyticsReportData } from '#lib/analytics-parser';

const logger = createLogger({ module: 'analytics-router' });

// Helper function to create dimension filters
function createDimensionFilters(input: {
  publicSuffix?: string;
  publicSuffixPlusOne?: string;
  domainRegex?: string;
}) {
  const filters: any[] = [
    {
      fieldName: 'eventName',
      stringFilter: { matchType: 'EXACT', value: 'dns_query' },
    },
  ];

  if (input.publicSuffix) {
    filters.push({
      fieldName: 'customEvent:public_suffix',
      stringFilter: { matchType: 'EXACT', value: input.publicSuffix },
    });
  }

  if (input.publicSuffixPlusOne) {
    filters.push({
      fieldName: 'customEvent:public_suffix_plus_one',
      stringFilter: { matchType: 'EXACT', value: input.publicSuffixPlusOne },
    });
  }

  if (input.domainRegex) {
    filters.push({
      fieldName: 'customEvent:domain',
      stringFilter: { matchType: 'FULL_REGEXP', value: input.domainRegex },
    });
  }

  return filters.length === 1
    ? { filter: filters[0] }
    : {
        andGroup: {
          expressions: filters.map((filter) => ({ filter })),
        },
      };
}

// Helper function to convert RCODE numbers to names with format: NOERROR(RCODE:0)
function mapRcodesToNames(data: any) {
  if (!data?.rows) return data;

  return {
    ...data,
    rows: data.rows.map((row: any) => {
      const rcode = row.dimensionValues?.[0]?.value;

      if (rcode === '(not set)' || !rcode) {
        return {
          ...row,
          dimensionValues: [
            {
              ...row.dimensionValues[0],
              value: '(not set)',
            },
            ...row.dimensionValues.slice(1),
          ],
        };
      }

      const rcodeName = dnsRcodes.get(rcode); // Use string key, not number

      // Format as: NOERROR(RCODE:0)
      const formattedValue = rcodeName
        ? `${rcodeName}(${rcode})`
        : `RCODE:${rcode}`;

      return {
        ...row,
        dimensionValues: [
          {
            ...row.dimensionValues[0],
            value: formattedValue,
          },
          ...row.dimensionValues.slice(1),
        ],
      };
    }),
  };
}

// Helper function to normalize DNSSEC status and combine "No DNSSEC" entries
function mapDnssecStatus(data: any) {
  if (!data?.rows) return data;

  const statusMap = new Map<string, number>();

  // Group and sum counts by normalized status
  data.rows.forEach((row: any) => {
    const dnssecStatus = row.dimensionValues?.[0]?.value;
    const count = Number.parseInt(row.metricValues?.[0]?.value || '0');

    let normalizedStatus = dnssecStatus;
    if (
      dnssecStatus === '(not set)' ||
      !dnssecStatus ||
      dnssecStatus === 'false' ||
      dnssecStatus === '0'
    ) {
      normalizedStatus = 'No DNSSEC';
    } else if (dnssecStatus === 'true' || dnssecStatus === '1') {
      normalizedStatus = 'DNSSEC Enabled';
    }

    statusMap.set(
      normalizedStatus,
      (statusMap.get(normalizedStatus) || 0) + count,
    );
  });

  // Convert back to the expected format
  const combinedRows = Array.from(statusMap.entries()).map(
    ([status, count]) => ({
      dimensionValues: [{ value: status }],
      metricValues: [{ value: count.toString() }],
    }),
  );

  return {
    ...data,
    rows: combinedRows,
  };
}

let client: ReturnType<typeof createGA4Client>;
// Create GA4 client
function createClient() {
  if (client) {
    return client;
  }

  if (!secrets.GA4_PROPERTY_ID) {
    throw new Error('GA4_PROPERTY_ID environment variable is required');
  }

  client = createGA4Client({
    propertyId: secrets.GA4_PROPERTY_ID,
    keyFilename: secrets.GA4_KEY_FILE_PATH,
  });
  return client;
}

const gaDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const gaRelativeDayRegex = /^(today|yesterday|\d+daysAgo)$/;
const gaDateToken = z
  .string()
  .refine((v) => gaDateRegex.test(v) || gaRelativeDayRegex.test(v), {
    message: 'Use YYYY-MM-DD, today, yesterday, or NdaysAgo',
  });

const dateRangeSchema = z.object({
  startDate: gaDateToken.default('7daysAgo'),
  endDate: gaDateToken.default('today'),
});

export const getDashboardOverviewInputSchema = z.object({
  startDate: gaDateToken,
  endDate: gaDateToken,
  publicSuffix: z.string().optional(),
  publicSuffixPlusOne: z.string().optional(),
});
export async function getDashboardOverview(
  input: z.infer<typeof getDashboardOverviewInputSchema>,
) {
  const client = createClient();
  const dateRange: DateRange = {
    startDate: input.startDate,
    endDate: input.endDate,
  };

  logger.debug(
    {
      dateRange,
      publicSuffix: input.publicSuffix,
      publicSuffixPlusOne: input.publicSuffixPlusOne,
    },
    'Getting dashboard overview',
  );

  const dimensionFilter = createDimensionFilters(input);
  try {
    // Use runReport method directly
    const [
      topDomains,
      queriesByResponseCode,
      queriesByType,
      cacheHitRatio,
      topClientIps,
      dnssecStats,
      hourlyVolume,
      dailyVolume,
      publicSuffix,
      publicSuffixPlusOne,
    ] = await Promise.all([
      // Top domains
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:domain' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 20,
      }),
      // Queries by response code
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:rcode' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      // Queries by type
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:query_type' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      // Cache hit ratio
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:cache_hit' }],
        dimensionFilter,
      }),
      // Top client IPs
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:client_ip' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 15,
      }),
      // DNSSEC stats
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:dnssec' }],
        dimensionFilter,
      }),
      // Hourly volume
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'dateHour' }],
        dimensionFilter,
        orderBys: [{ dimension: { dimensionName: 'dateHour' }, desc: false }],
      }),
      // Daily volume
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'date' }],
        dimensionFilter,
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      }),
      // Public suffix
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:public_suffix' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
      // Public suffix plus one
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:public_suffix_plus_one' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
    ]);

    return {
      topDomains,
      queriesByResponseCode: mapRcodesToNames(queriesByResponseCode),
      queriesByType,
      cacheHitRatio,
      topClientIps,
      dnssecStats: mapDnssecStatus(dnssecStats),
      hourlyVolume,
      dailyVolume,
      publicSuffix,
      publicSuffixPlusOne,
    };
  } catch (error) {
    logger.error({ error }, 'Error getting dashboard overview');
    throw error;
  }
}

const trailingDotRegex = /\.?$/;
// Remove trailing dot from domain name
function removeTrailingDot(domainName: string) {
  return domainName.replace(trailingDotRegex, '');
}

// Build FULL_REGEXP for record/host name that matches optional subdomains of a domain
function buildRecordNameRegex(domainName: string) {
  const normalized = namefiNormalizedDomainSchema.parse(
    removeTrailingDot(domainName),
  );
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `^(?:.*\\.)?${escaped}\\.?$`;
}

export const getFullReportByRecordNameInputSchema = z.object({
  startDate: gaDateToken,
  endDate: gaDateToken,
  domainName: z.string().min(1),
});

export async function getFullReportByRecordName(
  input: z.infer<typeof getFullReportByRecordNameInputSchema>,
) {
  const client = createClient();
  const dateRange: DateRange = {
    startDate: input.startDate,
    endDate: input.endDate,
  };

  const domainRegex = buildRecordNameRegex(input.domainName);

  logger.debug(
    {
      dateRange,
      domainName: input.domainName,
      domainRegex,
    },
    'Getting full report by record name',
  );

  const dimensionFilter = createDimensionFilters({ domainRegex });
  try {
    const [
      topDomains,
      queriesByResponseCode,
      queriesByType,
      cacheHitRatio,
      topClientIps,
      dnssecStats,
      hourlyVolume,
      dailyVolume,
      publicSuffix,
      publicSuffixPlusOne,
    ] = await Promise.all([
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:domain' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 20,
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:rcode' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:query_type' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:cache_hit' }],
        dimensionFilter,
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:client_ip' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 15,
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:dnssec' }],
        dimensionFilter,
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'dateHour' }],
        dimensionFilter,
        orderBys: [{ dimension: { dimensionName: 'dateHour' }, desc: false }],
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'date' }],
        dimensionFilter,
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:public_suffix' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
      client.runReport({
        dateRanges: [dateRange],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'customEvent:public_suffix_plus_one' }],
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
    ]);

    return {
      topDomains,
      queriesByResponseCode: mapRcodesToNames(queriesByResponseCode),
      queriesByType,
      cacheHitRatio,
      topClientIps,
      dnssecStats: mapDnssecStatus(dnssecStats),
      hourlyVolume,
      dailyVolume,
      publicSuffix,
      publicSuffixPlusOne,
    };
  } catch (error) {
    logger.error({ error }, 'Error getting full report by record name');
    throw error;
  }
}

export const analyticsRouter = createTRPCRouter({
  /**
   * Get comprehensive dashboard overview
   */
  getDashboardOverview: adminProcedureWithPermissions(Permission.READ_ANALYTICS)
    .input(getDashboardOverviewInputSchema)
    .query(async ({ input }) => {
      return getDashboardOverview(input);
    }),

  /**
   * Get queries by public suffix
   */
  getByPublicSuffix: adminProcedureWithPermissions(Permission.READ_ANALYTICS)
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(50),
        ...dateRangeSchema.shape,
      }),
    )
    .query(async ({ input }) => {
      const client = createClient();
      const dateRange: DateRange = {
        startDate: input.startDate,
        endDate: input.endDate,
      };

      return client.getByPublicSuffix(dateRange, input.limit);
    }),

  /**
   * Get queries by public suffix plus one
   */
  getByPublicSuffixPlusOne: adminProcedureWithPermissions(
    Permission.READ_ANALYTICS,
  )
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(50),
        ...dateRangeSchema.shape,
      }),
    )
    .query(async ({ input }) => {
      const client = createClient();
      const dateRange: DateRange = {
        startDate: input.startDate,
        endDate: input.endDate,
      };

      return client.getByPublicSuffixPlusOne(dateRange, input.limit);
    }),

  /**
   * Get full report filtered by record name (domain and subdomains)
   */
  getFullReportByRecordName: adminProcedureWithPermissions(
    Permission.READ_ANALYTICS,
  )
    .input(getFullReportByRecordNameInputSchema)
    .query(async ({ input }) => {
      return getFullReportByRecordName(input);
    }),

  /**
   * Get full report filtered by record name and public suffix
   */
  getParsedReportByRecordName: withRequiredPermissions(publicProcedure, [
    Permission.READ_ANALYTICS,
  ])
    .input(getFullReportByRecordNameInputSchema)
    .query(async ({ input }) => {
      const report = await getFullReportByRecordName(input);
      return parseDnsAnalyticsReportData(report, {
        includeIpDetails: false,
      });
    }),
});
