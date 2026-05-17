import { beforeEach, describe, expect, it, vi } from 'vitest';

const walletAddress = '0x0000000000000000000000000000000000000001';
const payerWalletAddress = '0x0000000000000000000000000000000000000002';
const resolvedTracking = {
  trackGaEvents: true,
  reason: 'API',
  identity: {
    eventSource: 'api',
  },
} as const;
const convertedTracking = {
  trackGaEvents: true,
  reason: 'API',
  eventSource: 'api',
} as const;

const loggerMocks = {
  error: vi.fn(),
  warn: vi.fn(),
};
const dbMocks = {
  transaction: vi.fn(),
};
const txMocks = {
  execute: vi.fn(),
  insert: vi.fn(),
  query: {
    orderItemsTable: {
      findFirst: vi.fn(),
    },
  },
};
const temporalMocks = {
  workflow: {
    start: vi.fn(),
  },
};
const trackingMocks = {
  resolveApiCheckoutTracking: vi.fn(),
  toGaEventTracking: vi.fn(),
  emitOrderPlacedIfTracked: vi.fn(),
};
const userMocks = {
  findOrCreateUserFromWallet: vi.fn(),
};

vi.mock('#lib/logger', () => ({
  createLogger: vi.fn(() => loggerMocks),
}));

vi.mock('@namefi-astra/db', () => ({
  db: dbMocks,
}));

vi.mock('@namefi-astra/db/schema', () => ({
  orderItemsTable: {},
  ordersTable: {},
  paymentsTable: {},
}));

vi.mock('@namefi-astra/db/types', () => ({
  itemTypeSchema: {
    enum: {
      REGISTER: 'REGISTER',
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  })),
}));

vi.mock('#temporal/client', () => ({
  temporalClient: temporalMocks,
}));

vi.mock('#temporal/shared', () => ({
  TEMPORAL_QUEUES: {
    DOMAINS: 'domains',
  },
}));

vi.mock('#temporal/workflows/processOrder.workflow', () => ({
  processOrderWorkflow: vi.fn(),
}));

vi.mock('#lib/env/allowed-chains', () => ({
  getDefaultAllowedNftChainId: vi.fn(() => 8453),
}));

vi.mock('#lib/tracking/checkout/context', () => ({
  resolveApiCheckoutTracking: trackingMocks.resolveApiCheckoutTracking,
  toGaEventTracking: trackingMocks.toGaEventTracking,
}));

vi.mock('#lib/tracking/checkout/events', () => ({
  emitOrderPlacedIfTracked: trackingMocks.emitOrderPlacedIfTracked,
}));

vi.mock('#temporal/activities/x402.activities', () => ({
  findOrCreateUserFromWallet: userMocks.findOrCreateUserFromWallet,
}));

vi.mock('./helpers', () => ({
  getWalletAddressFromDid: vi.fn(() => payerWalletAddress),
}));

const { createMppInstantRegistration } = await import('./register-domain');
const { processOrderWorkflow } = await import(
  '#temporal/workflows/processOrder.workflow'
);

function makeInsertResult(row: Record<string, unknown>) {
  return {
    values: vi.fn(() => ({
      returning: vi.fn(async () => [row]),
    })),
  };
}

function queueSuccessfulOrderWrites() {
  txMocks.insert
    .mockReturnValueOnce(makeInsertResult({ id: 'order-1' }))
    .mockReturnValueOnce(makeInsertResult({ id: 'order-item-1' }))
    .mockReturnValueOnce(makeInsertResult({ id: 'payment-1' }));
}

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    credential: {
      challenge: { nonce: 'challenge-1' },
      payload: { type: 'hash' },
      source: 'did:pkh:eip155:1:0x0000000000000000000000000000000000000002',
    },
    durationInYears: 1,
    nftReceivingWalletAddress: walletAddress,
    normalizedDomainName: 'example.com',
    receipt: {
      method: 'tempo',
      reference: 'receipt-1',
      timestamp: '2026-05-20T00:00:00.000Z',
    },
    validation: {
      priceInUsdCents: 1299,
      registrar: 'namefi',
    },
    ...overrides,
  } as unknown as Parameters<typeof createMppInstantRegistration>[0];
}

describe('createMppInstantRegistration analytics tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMocks.execute.mockResolvedValue(undefined);
    txMocks.query.orderItemsTable.findFirst.mockResolvedValue(undefined);
    queueSuccessfulOrderWrites();
    dbMocks.transaction.mockImplementation(async (callback) =>
      callback(txMocks),
    );
    temporalMocks.workflow.start.mockResolvedValue(undefined);
    trackingMocks.resolveApiCheckoutTracking.mockResolvedValue(
      resolvedTracking,
    );
    trackingMocks.toGaEventTracking.mockReturnValue(convertedTracking);
    trackingMocks.emitOrderPlacedIfTracked.mockResolvedValue(undefined);
    userMocks.findOrCreateUserFromWallet.mockResolvedValue({
      userId: 'created-user-1',
    });
  });

  it('passes converted GA tracking to the workflow and emits order_placed for authenticated MPP purchases', async () => {
    await createMppInstantRegistration(
      makeInput({
        user: {
          id: 'user-1',
          privyUserId: 'privy-1',
        },
      }),
    );

    expect(trackingMocks.resolveApiCheckoutTracking).toHaveBeenCalledWith({
      userId: 'user-1',
    });
    expect(trackingMocks.toGaEventTracking).toHaveBeenCalledWith(
      resolvedTracking,
    );
    expect(temporalMocks.workflow.start).toHaveBeenCalledWith(
      processOrderWorkflow,
      expect.objectContaining({
        args: [
          expect.objectContaining({
            gaEventTracking: convertedTracking,
            orderId: 'order-1',
          }),
        ],
        taskQueue: 'domains',
        workflowId: 'process-order-order-1',
      }),
    );
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
    expect(userMocks.findOrCreateUserFromWallet).not.toHaveBeenCalled();
  });

  it('uses the created wallet user when emitting MPP GA tracking for unauthenticated purchases', async () => {
    await createMppInstantRegistration(makeInput());

    expect(userMocks.findOrCreateUserFromWallet).toHaveBeenCalledWith({
      walletAddress,
    });
    expect(trackingMocks.resolveApiCheckoutTracking).toHaveBeenCalledWith({
      userId: 'created-user-1',
    });
    expect(temporalMocks.workflow.start).toHaveBeenCalledWith(
      processOrderWorkflow,
      expect.objectContaining({
        args: [
          expect.objectContaining({
            gaEventTracking: convertedTracking,
            orderId: 'order-1',
          }),
        ],
      }),
    );
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith(
      expect.objectContaining({
        tracking: resolvedTracking,
        userId: 'created-user-1',
        order: {
          id: 'order-1',
          amountInUSDCents: 1299,
          items: ['example.com'],
        },
      }),
    );
  });
});
