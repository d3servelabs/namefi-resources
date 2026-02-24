import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { protos } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import type { AnalyticsConfig, DateRange } from '#lib/analytics_client';
import {
  BACKEND_ANALYTICS_CUSTOM_DIMENSIONS,
  BACKEND_ANALYTICS_CUSTOM_METRICS,
} from '#lib/analytics-events';

export const CHECKOUT_FLOW_EVENT_SEQUENCE = [
  'user_begin_search',
  'order_placed',
  'payment_processed',
  'domain_acquisition_started',
  'domain_acquisition_finished',
  'dns_records_propagated',
  'parking_finished',
  'payment_refunded',
  'order_finished_email_sent',
  'order_finished_email_opened',
] as const;

export type CheckoutFlowEventName =
  (typeof CHECKOUT_FLOW_EVENT_SEQUENCE)[number];

type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse;

export class CheckoutFlowGA4AnalyticsClient {
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

  async getEventCounts(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [...CHECKOUT_FLOW_EVENT_SEQUENCE],
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: CHECKOUT_FLOW_EVENT_SEQUENCE.length,
    });
  }

  async getEventCountsByStatus(
    dateRange: DateRange = { startDate: '7daysAgo', endDate: 'today' },
  ): Promise<RunReportResponse> {
    return this.runReport({
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:status' },
        { name: 'customEvent:order_status' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [...CHECKOUT_FLOW_EVENT_SEQUENCE],
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 500,
    });
  }

  async createCustomDimensions(): Promise<void> {
    const results: Array<{
      success: boolean;
      dimension: string;
      response?: string;
      error?: string;
    }> = [];

    for (const dimension of BACKEND_ANALYTICS_CUSTOM_DIMENSIONS) {
      try {
        console.log(`Creating custom dimension: ${dimension.displayName}`);

        const [response] = await this.adminClient.createCustomDimension({
          parent: `properties/${this.propertyId}`,
          customDimension: dimension,
        });

        results.push({
          success: true,
          dimension: dimension.displayName,
          response: response.name ?? undefined,
        });

        console.log(
          `Created: ${dimension.displayName} (${response.name ?? 'unknown'})`,
        );
      } catch (error: unknown) {
        const errorCode =
          typeof error === 'object' && error !== null && 'code' in error
            ? (error as { code?: unknown }).code
            : undefined;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorCode === 6 || errorCode === '6') {
          console.log(`Already exists: ${dimension.displayName}`);
          results.push({
            success: true,
            dimension: dimension.displayName,
            response: 'Already exists',
          });
          continue;
        }

        console.error(
          `Failed to create ${dimension.displayName}: ${errorMessage}`,
        );
        results.push({
          success: false,
          dimension: dimension.displayName,
          error: errorMessage,
        });
      }
    }

    console.log('\nCustom Dimension Creation Summary:');
    console.log('==================================');
    for (const result of results) {
      const status = result.success ? 'OK' : 'ERR';
      console.log(
        `${status} ${result.dimension}: ${result.response ?? result.error}`,
      );
    }

    console.log(
      '\nNote: Custom dimensions may take 24-48 hours to start collecting data.',
    );
  }

  async createCustomMetrics(): Promise<void> {
    const results: Array<{
      success: boolean;
      metric: string;
      response?: string;
      error?: string;
    }> = [];

    for (const metric of BACKEND_ANALYTICS_CUSTOM_METRICS) {
      try {
        console.log(`Creating custom metric: ${metric.displayName}`);

        const [response] = await this.adminClient.createCustomMetric({
          parent: `properties/${this.propertyId}`,
          customMetric: metric,
        });

        results.push({
          success: true,
          metric: metric.displayName,
          response: response.name ?? undefined,
        });

        console.log(
          `Created: ${metric.displayName} (${response.name ?? 'unknown'})`,
        );
      } catch (error: unknown) {
        const errorCode =
          typeof error === 'object' && error !== null && 'code' in error
            ? (error as { code?: unknown }).code
            : undefined;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorCode === 6 || errorCode === '6') {
          console.log(`Already exists: ${metric.displayName}`);
          results.push({
            success: true,
            metric: metric.displayName,
            response: 'Already exists',
          });
          continue;
        }

        console.error(
          `Failed to create ${metric.displayName}: ${errorMessage}`,
        );
        results.push({
          success: false,
          metric: metric.displayName,
          error: errorMessage,
        });
      }
    }

    console.log('\nCustom Metric Creation Summary:');
    console.log('===============================');
    for (const result of results) {
      const status = result.success ? 'OK' : 'ERR';
      console.log(
        `${status} ${result.metric}: ${result.response ?? result.error}`,
      );
    }

    console.log(
      '\nNote: Custom metrics may take 24-48 hours to start collecting data.',
    );
  }
}

export const createCheckoutFlowGA4Client = (
  config: AnalyticsConfig,
): CheckoutFlowGA4AnalyticsClient => {
  const client = new CheckoutFlowGA4AnalyticsClient(config);
  // client.createCustomDimensions().then(() => {
  //   console.log('Custom dimensions created successfully.');
  // }).catch((error) => {
  //   console.error('Failed to create custom dimensions:', error);
  // });
  return client;
};
