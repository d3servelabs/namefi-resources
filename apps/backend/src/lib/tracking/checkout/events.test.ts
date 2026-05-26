import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ga4Mocks = {
  sendGA4Event: vi.fn(),
};

type CheckoutTrackingLoggerMocks = {
  debug: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  fatal: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  trace: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
};
const loggerMockGlobal = globalThis as typeof globalThis & {
  __checkoutTrackingLoggerMocks?: CheckoutTrackingLoggerMocks;
};
if (!loggerMockGlobal.__checkoutTrackingLoggerMocks) {
  loggerMockGlobal.__checkoutTrackingLoggerMocks = {
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  };
}
const loggerMocks = loggerMockGlobal.__checkoutTrackingLoggerMocks;

vi.mock('#lib/ga4-measurement', () => ({
  sendGA4Event: ga4Mocks.sendGA4Event,
}));

vi.mock('#lib/logger', () => ({
  logger: loggerMocks,
  createLogger: vi.fn(() => loggerMocks),
}));

const {
  emitOrderPlacedIfTracked,
  gaEventDomainAcquisitionStarted,
  gaEventOrderFinishedEmailOpened,
  gaEventOrderPlaced,
  gaEventPaymentRefunded,
  gaEventPaymentSuccess,
  gaEventPurchase,
  gaEventUserBeginSearch,
} = await import('./events');

describe('checkout GA events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ga4Mocks.sendGA4Event.mockResolvedValue(undefined);
  });

  it('sends order_placed with the browser GA identity', async () => {
    await gaEventOrderPlaced({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      orderId: 'order-1',
      amountUsdCents: 1299,
      itemCount: 2,
      paymentCount: 1,
      orderSource: 'checkout',
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: '12345.67890',
      event: {
        name: 'order_placed',
        params: expect.objectContaining({
          user_id: 'user-1',
          order_id: 'order-1',
          session_id: 1716012345,
          engagement_time_msec: 1,
          amount_usd_cents: 1299,
          item_count: 2,
          payment_count: 1,
          order_source: 'checkout',
        }),
      },
    });
  });

  it('skips browser checkout events without a GA client id', async () => {
    await gaEventOrderPlaced({
      userId: 'user-1',
      orderId: 'order-1',
      amountUsdCents: 1299,
      itemCount: 2,
      paymentCount: 1,
      orderSource: 'checkout',
    });

    expect(ga4Mocks.sendGA4Event).not.toHaveBeenCalled();
  });

  it('skips downstream browser checkout events without a GA client id', async () => {
    await gaEventPaymentSuccess({
      userId: 'user-1',
      orderId: 'order-1',
      amountUsdCents: 1299,
      paymentCount: 1,
      paymentProvider: 'STRIPE',
    });

    await gaEventDomainAcquisitionStarted({
      userId: 'user-1',
      orderId: 'order-1',
      orderItemId: 'item-1',
      normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
      operationType: 'REGISTER',
    });

    expect(ga4Mocks.sendGA4Event).not.toHaveBeenCalled();
  });

  it('does not emit order_placed when the resolved tracking context is disabled', async () => {
    await emitOrderPlacedIfTracked({
      tracking: {
        trackGaEvents: false,
        reason: 'PRIVACY',
      },
      userId: 'user-1',
      order: {
        id: 'order-1',
        amountInUSDCents: 1299,
        items: [{ id: 'item-1' }, { id: 'item-2' }],
      },
      paymentCount: 1,
      orderSource: 'checkout',
    });

    expect(ga4Mocks.sendGA4Event).not.toHaveBeenCalled();
  });

  it('redacts disabled tracking identity from skip logs', async () => {
    await emitOrderPlacedIfTracked({
      tracking: {
        trackGaEvents: false,
        reason: 'PRIVACY',
        identity: {
          clientId: '12345.67890',
          sessionId: 1716012345,
        },
      },
      userId: 'user-1',
      order: {
        id: 'order-1',
        amountInUSDCents: 1299,
        items: [{ id: 'item-1' }],
      },
      paymentCount: 1,
      orderSource: 'checkout',
    });

    expect(loggerMocks.info).toHaveBeenCalledWith(
      {
        orderId: 'order-1',
        userId: 'user-1',
        gaEventTrackingReason: 'PRIVACY',
        gaEventSource: undefined,
      },
      'Skipping GA order_placed event because tracking is disabled',
    );
    expect(JSON.stringify(loggerMocks.info.mock.calls[0]?.[0])).not.toContain(
      '12345.67890',
    );
    expect(JSON.stringify(loggerMocks.info.mock.calls[0]?.[0])).not.toContain(
      '1716012345',
    );
    expect(ga4Mocks.sendGA4Event).not.toHaveBeenCalled();
  });

  it('sends api checkout events without a browser GA client id', async () => {
    await gaEventOrderPlaced({
      userId: 'user-1',
      identity: {
        eventSource: 'api',
      },
      orderId: 'order-1',
      amountUsdCents: 1299,
      itemCount: 2,
      paymentCount: 1,
      orderSource: 'instant_buy',
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: undefined,
      event: {
        name: 'order_placed',
        params: expect.objectContaining({
          user_id: 'user-1',
          event_source: 'api',
          order_id: 'order-1',
          amount_usd_cents: 1299,
          item_count: 2,
          payment_count: 1,
          order_source: 'instant_buy',
        }),
      },
    });
  });

  it('sends standard ecommerce purchase only for completed items', async () => {
    await gaEventPurchase({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      orderId: 'order-1',
      items: [
        {
          itemId: 'example.com',
          itemName: 'example.com',
          amountInUSDCents: 1500,
        },
        {
          itemId: 'example.xyz',
          itemName: 'example.xyz',
          amountInUSDCents: 1210,
        },
      ],
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: '12345.67890',
      event: {
        name: 'purchase',
        params: expect.objectContaining({
          user_id: 'user-1',
          order_id: 'order-1',
          transaction_id: 'order-1',
          session_id: 1716012345,
          engagement_time_msec: 1,
          currency: 'USD',
          value: 27.1,
          items: [
            {
              item_id: 'example.com',
              item_name: 'example.com',
              price: 15,
              quantity: 1,
            },
            {
              item_id: 'example.xyz',
              item_name: 'example.xyz',
              price: 12.1,
              quantity: 1,
            },
          ],
        }),
      },
    });
  });

  it('skips purchase when no completed items are provided', async () => {
    await gaEventPurchase({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      orderId: 'order-1',
      items: [],
    });

    expect(loggerMocks.info).toHaveBeenCalledWith(
      { orderId: 'order-1' },
      'Skipping GA purchase event because no items were provided',
    );
    expect(ga4Mocks.sendGA4Event).not.toHaveBeenCalled();
  });

  it('sends custom payment_refunded for actual refund completion', async () => {
    await gaEventPaymentRefunded({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      orderId: 'order-1',
      amountUsdCents: 3000,
      paymentCount: 1,
      paymentProvider: 'STRIPE',
      refundAmountUsdCents: 1500,
      refundType: 'PARTIAL',
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: '12345.67890',
      event: {
        name: 'payment_refunded',
        params: expect.objectContaining({
          user_id: 'user-1',
          order_id: 'order-1',
          session_id: 1716012345,
          engagement_time_msec: 1,
          amount_usd_cents: 3000,
          payment_count: 1,
          payment_provider: 'STRIPE',
          refund_amount_usd_cents: 1500,
          refund_type: 'PARTIAL',
        }),
      },
    });
  });

  it('sends email-open events without browser or API identity as email sourced', async () => {
    await gaEventOrderFinishedEmailOpened({
      userId: 'user-1',
      orderId: 'order-1',
      emailId: 'email-open-1',
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenCalledWith({
      userId: undefined,
      clientId: undefined,
      event: {
        name: 'order_finished_email_opened',
        params: expect.objectContaining({
          event_source: 'email',
          email_distinct_id: 'email-open-1',
        }),
      },
    });
    expect(ga4Mocks.sendGA4Event.mock.calls[0]?.[0].event.params).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        order_id: 'order-1',
      }),
    );
  });

  it('treats an empty email-open identity as email sourced', async () => {
    await gaEventOrderFinishedEmailOpened({
      userId: 'user-1',
      orderId: 'order-1',
      identity: {},
      emailId: 'email-open-1',
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenCalledWith({
      userId: undefined,
      clientId: undefined,
      event: {
        name: 'order_finished_email_opened',
        params: expect.objectContaining({
          event_source: 'email',
          email_distinct_id: 'email-open-1',
        }),
      },
    });
  });

  it('keeps downstream checkout events on the same GA client and session', async () => {
    await gaEventPaymentSuccess({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      orderId: 'order-1',
      amountUsdCents: 1299,
      paymentCount: 1,
      paymentProvider: 'STRIPE',
    });

    await gaEventDomainAcquisitionStarted({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      orderId: 'order-1',
      orderItemId: 'item-1',
      normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
      operationType: 'REGISTER',
      registrarKey: 'namefi',
      durationInYears: 1,
      chainId: 8453,
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        clientId: '12345.67890',
        event: expect.objectContaining({
          name: 'payment_processed',
          params: expect.objectContaining({
            session_id: 1716012345,
            engagement_time_msec: 1,
          }),
        }),
      }),
    );
    expect(ga4Mocks.sendGA4Event).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        clientId: '12345.67890',
        event: expect.objectContaining({
          name: 'domain_acquisition_started',
          params: expect.objectContaining({
            session_id: 1716012345,
            engagement_time_msec: 1,
          }),
        }),
      }),
    );
  });

  it('sends begin-search with session engagement only when session id is present', async () => {
    await gaEventUserBeginSearch({
      userId: undefined,
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      searchTerm: '  Alpha  ',
      parentDomain: '  0x.city  ',
    });
    await gaEventUserBeginSearch({
      userId: undefined,
      identity: {
        clientId: '12345.67890',
      },
      searchTerm: 'Beta',
    });

    expect(ga4Mocks.sendGA4Event).toHaveBeenNthCalledWith(1, {
      userId: undefined,
      clientId: '12345.67890',
      event: {
        name: 'user_begin_search',
        params: {
          search_term: 'Alpha',
          parent_domain: '0x.city',
          session_id: 1716012345,
          engagement_time_msec: 1,
        },
      },
    });
    expect(ga4Mocks.sendGA4Event).toHaveBeenNthCalledWith(2, {
      userId: undefined,
      clientId: '12345.67890',
      event: {
        name: 'user_begin_search',
        params: {
          search_term: 'Beta',
          parent_domain: undefined,
          session_id: undefined,
          engagement_time_msec: undefined,
        },
      },
    });
  });

  it('redacts GA client id from begin-search failure logs', async () => {
    const error = new Error('ga unavailable');
    ga4Mocks.sendGA4Event.mockRejectedValueOnce(error);

    await gaEventUserBeginSearch({
      userId: 'user-1',
      identity: {
        clientId: '12345.67890',
        sessionId: 1716012345,
      },
      searchTerm: 'example',
    });

    expect(loggerMocks.warn).toHaveBeenCalledWith(
      {
        error,
        userId: 'user-1',
        hasClientId: true,
        eventSource: undefined,
        searchTerm: 'example',
      },
      'Failed to send GA search event',
    );
    expect(JSON.stringify(loggerMocks.warn.mock.calls[0]?.[0])).not.toContain(
      '12345.67890',
    );
  });

  it('skips begin-search events without a GA client id', async () => {
    await gaEventUserBeginSearch({
      userId: 'user-1',
      identity: undefined,
      searchTerm: 'Alpha',
    });
    await gaEventUserBeginSearch({
      userId: 'user-1',
      identity: {
        sessionId: 1716012345,
      },
      searchTerm: 'Beta',
    });

    expect(ga4Mocks.sendGA4Event).not.toHaveBeenCalled();
  });
});
