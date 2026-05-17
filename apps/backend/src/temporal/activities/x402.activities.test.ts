import { beforeEach, describe, expect, it, vi } from 'vitest';

const buyerWalletAddress = '0x0000000000000000000000000000000000000001';
const receiverWalletAddress = '0x0000000000000000000000000000000000000002';
const resolvedTracking = {
  trackGaEvents: true,
  reason: 'API',
  identity: {
    eventSource: 'api',
  },
} as const;

const loggerMocks = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
const dbMocks = {
  transaction: vi.fn(),
  update: vi.fn(),
};
const txMocks = {
  insert: vi.fn(),
  update: vi.fn(),
};
const trackingMocks = {
  resolveApiCheckoutTracking: vi.fn(),
  toGaEventTracking: vi.fn(),
  emitOrderPlacedIfTracked: vi.fn(),
};
const instantBuyMocks = {
  validateDomainForInstantPurchase: vi.fn(),
};

vi.mock('@namefi-astra/db', () => ({
  db: dbMocks,
}));

vi.mock('@namefi-astra/db/schema', () => ({
  orderItemsTable: {},
  ordersTable: {},
  paymentsTable: {},
  usersTable: {},
  x402PurchasesTable: {
    id: 'x402Purchases.id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq'),
}));

vi.mock('#lib/env', () => ({
  config: {
    X402_DEFAULT_NFT_CHAINID: undefined,
  },
}));

vi.mock('#lib/logger', () => ({
  createLogger: vi.fn(() => loggerMocks),
}));

vi.mock('../../trpc/utils', () => ({
  privyClient: {},
}));

vi.mock('../../lib/instant-buy', () => ({
  validateDomainForInstantPurchase:
    instantBuyMocks.validateDomainForInstantPurchase,
}));

vi.mock('#lib/x402/helpers', () => ({
  buildX402ExactPaymentOption: vi.fn(),
  centsToUsdc: vi.fn(),
  decryptX402PaymentPayloadSignature: vi.fn(),
  encryptX402PaymentPayloadSignature: vi.fn(({ paymentPayload }) => ({
    paymentPayload,
    paymentPayloadEncryptionVersion: 'v1',
  })),
  getX402ResourceServer: vi.fn(),
  hasEncryptedX402PaymentPayloadSignature: vi.fn(() => false),
  parseChainIdFromNetwork: vi.fn(() => 8453),
  resolveX402PaymentPayloadEncryptionPrivateKey: vi.fn(() => 'private-key'),
}));

vi.mock('#lib/tracking/checkout/context', () => ({
  resolveApiCheckoutTracking: trackingMocks.resolveApiCheckoutTracking,
  toGaEventTracking: trackingMocks.toGaEventTracking,
}));

vi.mock('#lib/tracking/checkout/events', () => ({
  emitOrderPlacedIfTracked: trackingMocks.emitOrderPlacedIfTracked,
}));

const { createX402Order } = await import('./x402.activities');

function makeInsertResult(row: Record<string, unknown>) {
  return {
    values: vi.fn(() => ({
      returning: vi.fn(async () => [row]),
    })),
  };
}

function makeUpdateResult() {
  return {
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  };
}

function queueSuccessfulOrderWrites() {
  txMocks.insert
    .mockReturnValueOnce(makeInsertResult({ id: 'order-1' }))
    .mockReturnValueOnce(makeInsertResult({ id: 'order-item-1' }))
    .mockReturnValueOnce(makeInsertResult({ id: 'payment-1' }));
  txMocks.update.mockReturnValue(makeUpdateResult());
}

function makeInput() {
  return {
    amountInUsdCents: 1299,
    buyerWalletAddress,
    durationInYears: 1,
    network: 'base',
    normalizedDomainName: 'example.com',
    paymentPayload: {},
    purchaseId: 'purchase-1',
    receiverWalletAddress,
    userId: 'user-1',
  } as unknown as Parameters<typeof createX402Order>[0];
}

describe('createX402Order analytics tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queueSuccessfulOrderWrites();
    dbMocks.transaction.mockImplementation(async (callback) =>
      callback(txMocks),
    );
    instantBuyMocks.validateDomainForInstantPurchase.mockResolvedValue({
      isValid: true,
      registrar: 'namefi',
    });
    trackingMocks.resolveApiCheckoutTracking.mockResolvedValue(
      resolvedTracking,
    );
    trackingMocks.toGaEventTracking.mockImplementation((tracking) => ({
      trackGaEvents: tracking.trackGaEvents,
      reason: tracking.reason,
      eventSource: tracking.identity?.eventSource,
    }));
    trackingMocks.emitOrderPlacedIfTracked.mockResolvedValue(undefined);
  });

  it('returns converted GA tracking and emits order_placed for x402 orders', async () => {
    const result = await createX402Order(makeInput());

    expect(result.gaEventTracking).toEqual({
      trackGaEvents: true,
      reason: 'API',
      eventSource: 'api',
    });
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith({
      tracking: resolvedTracking,
      userId: 'user-1',
      order: {
        id: 'order-1',
        amountInUSDCents: 1299,
        items: ['example.com'],
      },
      paymentCount: 1,
      orderSource: 'instant_buy',
    });
  });

  it('does not fail the committed x402 order when checkout tracking resolution fails', async () => {
    trackingMocks.resolveApiCheckoutTracking.mockRejectedValueOnce(
      new Error('tracking unavailable'),
    );

    const result = await createX402Order(makeInput());

    expect(result).toEqual(
      expect.objectContaining({
        orderId: 'order-1',
        paymentId: 'payment-1',
        gaEventTracking: {
          trackGaEvents: false,
          reason: 'OTHER',
          eventSource: undefined,
        },
      }),
    );
    expect(loggerMocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        userId: 'user-1',
      }),
      'Failed to resolve checkout tracking for x402 order',
    );
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith(
      expect.objectContaining({
        tracking: {
          trackGaEvents: false,
          reason: 'OTHER',
        },
      }),
    );
  });
});
