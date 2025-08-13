import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../base';
import { createGA4Client, type DateRange } from '../../lib/analytics_client';
import { secrets } from '../../lib/env';
import { createLogger } from '#lib/logger';
import { dnsRcodes } from '../../lib/dns/rcodes';

const logger = createLogger({ module: 'analytics-router' });

// Helper function to create dimension filters
function createDimensionFilters(input: {
  publicSuffix?: string;
  publicSuffixPlusOne?: string;
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

const dashboardInputSchema = z.object({
  startDate: gaDateToken,
  endDate: gaDateToken,
  publicSuffix: z.string().optional(),
  publicSuffixPlusOne: z.string().optional(),
});

export const analyticsRouter = createTRPCRouter({
  /**
   * Get comprehensive dashboard overview
   */
  getDashboardOverview: adminProcedure
    .input(dashboardInputSchema)
    .query(async ({ input }) => {
      const client = createClient();
      const dateRange: DateRange = {
        startDate: input.startDate,
        endDate: input.endDate,
      };

      logger.info(
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
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:domain' }],
            dimensionFilter,
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
            limit: 20,
          }),
          // Queries by response code
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:rcode' }],
            dimensionFilter,
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          }),
          // Queries by type
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:query_type' }],
            dimensionFilter,
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          }),
          // Cache hit ratio
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:cache_hit' }],
            dimensionFilter,
          }),
          // Top client IPs
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:client_ip' }],
            dimensionFilter,
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
            limit: 15,
          }),
          // DNSSEC stats
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:dnssec' }],
            dimensionFilter,
          }),
          // Hourly volume
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'dateHour' }],
            dimensionFilter,
            orderBys: [
              { dimension: { dimensionName: 'dateHour' }, desc: false },
            ],
          }),
          // Daily volume
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'date' }],
            dimensionFilter,
            orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
          }),
          // Public suffix
          client['runReport']({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:public_suffix' }],
            dimensionFilter,
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
            limit: 10,
          }),
          // Public suffix plus one
          client['runReport']({
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
    }),

  /**
   * Get queries by public suffix
   */
  getByPublicSuffix: adminProcedure
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
  getByPublicSuffixPlusOne: adminProcedure
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
});
