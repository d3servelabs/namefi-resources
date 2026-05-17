import { describe, expect, it, vi } from 'vitest';
import {
  CheckoutFlowGA4AnalyticsClient,
  createCheckoutFlowDimensionFilter,
} from './analytics-client';

function createTestClient() {
  const runReport = vi.fn(async () => ({ rows: [] }));
  const client = Object.assign(
    Object.create(CheckoutFlowGA4AnalyticsClient.prototype),
    { runReport },
  ) as CheckoutFlowGA4AnalyticsClient & { runReport: typeof runReport };

  return { client, runReport };
}

describe('checkout flow analytics filters', () => {
  it('filters only by checkout event names for all sources', () => {
    expect(createCheckoutFlowDimensionFilter({ eventSource: 'all' })).toEqual({
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: [
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
          ],
        },
      },
    });
  });

  it('filters API checkout events by event_source', () => {
    expect(createCheckoutFlowDimensionFilter({ eventSource: 'api' })).toEqual({
      andGroup: {
        expressions: [
          expect.objectContaining({
            filter: expect.objectContaining({ fieldName: 'eventName' }),
          }),
          {
            filter: {
              fieldName: 'customEvent:event_source',
              stringFilter: {
                matchType: 'EXACT',
                value: 'api',
              },
            },
          },
        ],
      },
    });
  });

  it('excludes API checkout events for non-api reports', () => {
    expect(
      createCheckoutFlowDimensionFilter({ eventSource: 'non_api' }),
    ).toEqual({
      andGroup: {
        expressions: [
          expect.objectContaining({
            filter: expect.objectContaining({ fieldName: 'eventName' }),
          }),
          {
            notExpression: {
              filter: {
                fieldName: 'customEvent:event_source',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'api',
                },
              },
            },
          },
        ],
      },
    });
  });

  it('keeps the default dashboard metric as eventCount', async () => {
    const { client, runReport } = createTestClient();

    await client.getEventCounts();

    expect(runReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
    );
  });

  it('keeps status breakdown reports on the additive eventCount metric', async () => {
    const { client, runReport } = createTestClient();

    await client.getEventCountsByStatus();

    expect(runReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
    );
  });
});
