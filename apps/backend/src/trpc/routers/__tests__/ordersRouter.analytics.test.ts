import { beforeEach, describe, expect, it, vi } from 'vitest';

const walletAddress = '0x0000000000000000000000000000000000000001';
const gaClientId = '123456789.987654321';
const gaSessionId = 123456789;
const resolvedTracking = {
  trackGaEvents: true,
  reason: 'WEB_MEASUREMENT_CONSENT_ACCEPTED',
  identity: {
    clientId: gaClientId,
    sessionId: gaSessionId,
    eventSource: 'web',
  },
} as const;
const convertedTracking = {
  trackGaEvents: true,
  reason: 'WEB_MEASUREMENT_CONSENT_ACCEPTED',
  clientId: gaClientId,
  sessionId: gaSessionId,
  eventSource: 'web',
} as const;

const loggerMocks = {
  debug: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  info: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
};
const dbMocks = {
  query: {
    cartItemsTable: {
      findMany: vi.fn(),
    },
  },
  select: vi.fn(),
  transaction: vi.fn(),
};
const dbSelectMocks = {
  from: vi.fn(),
  where: vi.fn(),
};
const txMocks = {
  delete: vi.fn(),
};
const temporalMocks = {
  workflow: {
    start: vi.fn(),
  },
};
const paymentMocks = {
  createPayment: vi.fn(),
};
const orderServiceMocks = {
  createNfscOrderWithExistingPayments: vi.fn(),
  createOrderWithExistingMultiplePayments: vi.fn(),
  createOrderWithExistingSinglePayment: vi.fn(),
  removeCartItems: vi.fn(),
  validateNfscWalletAddresses: vi.fn(),
};
const cartMocks = {
  validateCartItems: vi.fn(),
};
const instantBuyMocks = {
  validateDomainForInstantPurchaseOrThrow: vi.fn(),
};
const trackingMocks = {
  emitOrderPlacedIfTracked: vi.fn(),
  resolveWebCheckoutTracking: vi.fn(),
  toGaEventTracking: vi.fn(),
};
const privyMocks = {
  getPrivyUserLinkedEthereumChecksumWalletAddresses: vi.fn(),
  privyClient: {
    getUserById: vi.fn(),
  },
};

vi.mock('../../base', async () => {
  const { initTRPC } = await import('@trpc/server');
  const t = initTRPC.context<Record<string, unknown>>().create();
  return {
    createTRPCRouter: t.router,
    protectedProcedure: t.procedure,
    withAudit: (procedure: unknown) => procedure,
  };
});

vi.mock('#lib/logger', () => ({
  logger: loggerMocks,
  createLogger: vi.fn(() => loggerMocks),
}));

vi.mock('@namefi-astra/db', () => ({
  cartItemsTable: {},
  db: dbMocks,
  isMppPayment: vi.fn(
    (details: { paymentProvider?: string }) =>
      details?.paymentProvider === 'MPP',
  ),
  isNfscPayment: vi.fn((details: { paymentProvider?: string }) =>
    details?.paymentProvider?.startsWith('NFSC_'),
  ),
  isX402Payment: vi.fn(
    (details: { paymentProvider?: string }) =>
      details?.paymentProvider === 'X402',
  ),
  orderItemsTable: {},
  ordersTable: {},
  paymentsTable: {},
  poweredbyNamefiDomainsTable: {},
  refundsTable: {},
  userPermissionsTable: {
    permission: 'permission',
    userId: 'userId',
  },
  usersTable: {
    id: 'id',
  },
}));

vi.mock('@namefi-astra/db/types', () => ({
  itemTypeSchema: {
    enum: {
      IMPORT: 'IMPORT',
      REGISTER: 'REGISTER',
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
  desc: vi.fn((value: unknown) => ({ op: 'desc', value })),
  eq: vi.fn((left: unknown, right: unknown) => ({ op: 'eq', left, right })),
  getTableColumns: vi.fn(() => ({})),
  ilike: vi.fn((left: unknown, right: unknown) => ({
    op: 'ilike',
    left,
    right,
  })),
  inArray: vi.fn((left: unknown, right: unknown) => ({
    op: 'inArray',
    left,
    right,
  })),
}));

vi.mock('../../../services/orders/orders.service', () => ({
  buildOrderPaymentMethodsDetails: vi.fn(),
  buildPaymentMethodDetails: vi.fn(),
  createOrderWithWorkflow: vi.fn(),
  ensureOrderOwnership: vi.fn(),
  getMyOrders: vi.fn(),
  getOrderItemsForUser: vi.fn(),
  orderService: orderServiceMocks,
  removeCartItems: orderServiceMocks.removeCartItems,
  validateNfscWalletAddresses: orderServiceMocks.validateNfscWalletAddresses,
}));

vi.mock('../../../temporal/activities/payment.activities', () => ({
  createPayment: paymentMocks.createPayment,
}));

vi.mock('../../../temporal/client', () => ({
  temporalClient: temporalMocks,
}));

vi.mock('../../../temporal/shared', () => ({
  TEMPORAL_QUEUES: {
    DOMAINS: 'domains',
  },
}));

vi.mock('../../../temporal/workflows/processOrder.workflow', () => ({
  getOrderProgressQuery: vi.fn(),
  processOrderWorkflow: vi.fn(),
}));

vi.mock(
  '../../../temporal/workflows/domain-ownership/epp-register-or-import.workflow',
  () => ({
    eppRegisterOrImportProceed: vi.fn(),
  }),
);

vi.mock(
  '../../../temporal/workflows/domain-ownership/sld-register-or-import.workflow',
  () => ({
    sldRegisterOrImportProceed: vi.fn(),
  }),
);

vi.mock('#lib/carts/cart-validation', () => ({
  reflectChangesInCartItemsIfAnyAndReturnSummary: vi.fn(),
  validateCartItems: cartMocks.validateCartItems,
}));

vi.mock('../../../lib/env', () => ({
  config: {},
  secrets: {
    STRIPE_SECRET_KEY: 'sk_test_123',
  },
}));

vi.mock('#lib/env', () => ({
  config: {},
  secrets: {
    API_AUTH_KEY: 'api-key',
    STRIPE_SECRET_KEY: 'sk_test_123',
  },
}));

vi.mock('#lib/auditor', () => ({
  audit: vi.fn(),
  createAuditRecord: vi.fn((record: unknown) => record),
}));

vi.mock('../../../lib/instant-buy', () => ({
  validateDomainForInstantPurchaseOrThrow:
    instantBuyMocks.validateDomainForInstantPurchaseOrThrow,
}));

vi.mock('../../utils', () => ({
  getPrivyUserLinkedEthereumChecksumWalletAddresses:
    privyMocks.getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient: privyMocks.privyClient,
}));

vi.mock('#lib/tracking/checkout/events', () => ({
  emitOrderPlacedIfTracked: trackingMocks.emitOrderPlacedIfTracked,
}));

vi.mock('#lib/tracking/checkout/context', () => ({
  resolveWebCheckoutTracking: trackingMocks.resolveWebCheckoutTracking,
  toGaEventTracking: trackingMocks.toGaEventTracking,
}));

vi.mock('#lib/env/allowed-chains', () => ({
  getAllowedChainsForNft: vi.fn(() => [8453]),
  getAllowedChainsForNftByDomainNames: vi.fn(() => [8453]),
  getConfiguredAllowedChainIds: vi.fn(() => [8453]),
}));

const { ordersRouter } = await import('../ordersRouter');
const { processOrderWorkflow } = await import(
  '../../../temporal/workflows/processOrder.workflow'
);

const stripePaymentProviderDetails = {
  paymentProvider: 'STRIPE',
  stripePaymentDetails: {
    paymentMethodId: 'pm_test_123',
  },
} as const;

const nftMetadata = {
  nftWalletAddress: walletAddress,
  nftChainId: 8453,
};

const baseContext = {
  user: {
    id: 'user-1',
    privyUserId: 'privy-user-1',
  },
  gaClientId,
  gaSessionId,
  consentDomainName: 'app.namefi.test',
  requestMeasurementConsentState: {
    measurement: true,
  },
  getMeasurementConsentAutoGranted: vi.fn(async () => false),
};

const cartItem = {
  id: 'cart-item-1',
  amountInUSDCents: 1200,
  normalizedDomainName: 'example.com',
  durationInYears: 1,
  type: 'REGISTER',
  registrar: 'R53',
  metadata: null,
  encryptionKeyId: null,
  encryptedEppAuthorizationCode: null,
};

function createCaller() {
  return ordersRouter.createCaller(baseContext as never);
}

function makeOrder(id: string) {
  return {
    id,
    userId: 'user-1',
    amountInUSDCents: 1200,
    nftWalletAddress: walletAddress,
    nftChainId: 8453,
    items: [cartItem],
  };
}

function paymentInput(amountInUsdCents = 1200) {
  return {
    amountInUsdCents,
    paymentProviderDetails: stripePaymentProviderDetails,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  dbMocks.query.cartItemsTable.findMany.mockResolvedValue([cartItem]);
  dbMocks.select.mockReturnValue(dbSelectMocks);
  dbSelectMocks.from.mockReturnValue(dbSelectMocks);
  dbSelectMocks.where.mockResolvedValue([]);
  dbMocks.transaction.mockImplementation(async (callback) => callback(txMocks));
  txMocks.delete.mockReturnValue({
    where: vi.fn(async () => undefined),
  });
  paymentMocks.createPayment.mockResolvedValue({
    id: 'payment-1',
    amountInUsdCents: 1200,
  });
  trackingMocks.resolveWebCheckoutTracking.mockResolvedValue(resolvedTracking);
  trackingMocks.toGaEventTracking.mockReturnValue(convertedTracking);
  trackingMocks.emitOrderPlacedIfTracked.mockResolvedValue(undefined);
  cartMocks.validateCartItems.mockResolvedValue(undefined);
  instantBuyMocks.validateDomainForInstantPurchaseOrThrow.mockResolvedValue({
    priceInUsdCents: 1200,
    registrar: 'R53',
  });
  privyMocks.privyClient.getUserById.mockResolvedValue({
    id: 'privy-user-1',
  });
  privyMocks.getPrivyUserLinkedEthereumChecksumWalletAddresses.mockReturnValue([
    walletAddress,
  ]);
});

describe('ordersRouter checkout analytics propagation', () => {
  it('forwards GA tracking to createOrder workflow and order placed analytics', async () => {
    const order = makeOrder('order-create');
    orderServiceMocks.createOrderWithExistingSinglePayment.mockResolvedValue(
      order,
    );

    await createCaller().createOrder({
      cartItemIds: ['cart-item-1'],
      paymentProviderDetails: stripePaymentProviderDetails,
      nftMetadata,
    });

    expect(trackingMocks.resolveWebCheckoutTracking).toHaveBeenCalledWith({
      userId: 'user-1',
      gaIdentity: {
        clientId: gaClientId,
        sessionId: gaSessionId,
      },
      consentDomainName: 'app.namefi.test',
      requestMeasurementConsentState: {
        measurement: true,
      },
      getMeasurementConsentAutoGranted:
        baseContext.getMeasurementConsentAutoGranted,
    });
    expect(temporalMocks.workflow.start).toHaveBeenCalledWith(
      processOrderWorkflow,
      expect.objectContaining({
        args: [
          expect.objectContaining({
            orderId: 'order-create',
            gaEventTracking: convertedTracking,
          }),
        ],
      }),
    );
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith({
      tracking: resolvedTracking,
      userId: 'user-1',
      order,
      paymentCount: 1,
      orderSource: 'checkout',
    });
  });

  it('forwards GA tracking to createOrderV2 workflow and order placed analytics', async () => {
    const order = makeOrder('order-v2');
    orderServiceMocks.createOrderWithExistingMultiplePayments.mockResolvedValue(
      order,
    );

    await createCaller().createOrderV2({
      cartItemIds: ['cart-item-1'],
      payments: [paymentInput()],
      nftMetadata,
    });

    expect(temporalMocks.workflow.start).toHaveBeenCalledWith(
      processOrderWorkflow,
      expect.objectContaining({
        args: [
          expect.objectContaining({
            orderId: 'order-v2',
            gaEventTracking: convertedTracking,
          }),
        ],
      }),
    );
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith({
      tracking: resolvedTracking,
      userId: 'user-1',
      order,
      paymentCount: 1,
      orderSource: 'checkout',
    });
  });

  it('forwards GA tracking to instantBuy workflow and order placed analytics', async () => {
    const order = makeOrder('order-instant-buy');
    orderServiceMocks.createOrderWithExistingMultiplePayments.mockResolvedValue(
      order,
    );

    await createCaller().instantBuy({
      normalizedDomainName: 'example.com',
      durationInYears: 1,
      payments: [paymentInput()],
      nftMetadata,
    });

    expect(temporalMocks.workflow.start).toHaveBeenCalledWith(
      processOrderWorkflow,
      expect.objectContaining({
        args: [
          expect.objectContaining({
            orderId: 'order-instant-buy',
            gaEventTracking: convertedTracking,
          }),
        ],
      }),
    );
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith({
      tracking: resolvedTracking,
      userId: 'user-1',
      order,
      paymentCount: 1,
      orderSource: 'instant_buy',
    });
  });

  it('forwards GA tracking to buyNfsc workflow and order placed analytics', async () => {
    const order = makeOrder('order-nfsc');
    orderServiceMocks.createNfscOrderWithExistingPayments.mockResolvedValue(
      order,
    );

    await createCaller().buyNfsc({
      amountInUsdCents: 1200,
      payments: [paymentInput()],
      recipient: {
        recipientWalletAddress: walletAddress,
        nfscChainId: 8453,
      },
    });

    expect(temporalMocks.workflow.start).toHaveBeenCalledWith(
      processOrderWorkflow,
      expect.objectContaining({
        args: [
          expect.objectContaining({
            orderId: 'order-nfsc',
            gaEventTracking: convertedTracking,
          }),
        ],
      }),
    );
    expect(trackingMocks.emitOrderPlacedIfTracked).toHaveBeenCalledWith({
      tracking: resolvedTracking,
      userId: 'user-1',
      order,
      paymentCount: 1,
      orderSource: 'nfsc_topup',
    });
  });
});
