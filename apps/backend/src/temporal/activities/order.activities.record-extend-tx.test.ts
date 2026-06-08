import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit coverage for `recordOrderExtendTransaction` — the RENEW analogue of
 * `recordOrderMintTransaction`. Asserts the success write (item + order
 * metadata) and the error / no-partial-write behavior when the order item or
 * order is missing. The DB is mocked (this repo has no DB harness), mirroring
 * the module-mock pattern in `x402.activities.test.ts`.
 */

const loggerMocks = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
};

const dbMocks = {
  transaction: vi.fn(),
};

vi.mock('@namefi-astra/db', () => ({
  db: dbMocks,
  ordersTable: { id: 'orders.id', metadata: 'orders.metadata' },
  orderItemsTable: {
    id: 'orderItems.id',
    orderId: 'orderItems.orderId',
    metadata: 'orderItems.metadata',
  },
  orderNfscItemsTable: {},
  paymentsTable: {},
  refundsTable: {},
  orderStatusSchema: { enum: {} },
  paymentStatusSchema: { enum: {} },
  refundStatusSchema: { enum: {} },
}));

vi.mock('@namefi-astra/db/types', () => ({
  buildOrderStatusLifecycleTransition: vi.fn(() => ({})),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq'),
  and: vi.fn(() => 'and'),
  sql: Object.assign(
    vi.fn(() => 'sql'),
    { raw: vi.fn(() => 'sql.raw') },
  ),
  inArray: vi.fn(),
  ne: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  isNotNull: vi.fn(),
}));

vi.mock('#lib/logger', () => ({ logger: loggerMocks }));
vi.mock('#lib/env', () => ({ config: {}, secrets: {} }));
vi.mock('#services/orders/orders.service', () => ({ orderService: {} }));
vi.mock('../../mail/email-links', () => ({ NamefiEmailLinks: {} }));
vi.mock('./notify.activities', () => ({
  sendStyledEmailNotificationForUser: vi.fn(),
}));
vi.mock('./payment.activities', () => ({
  getPreferredEvmWalletAddressToBeCharged: vi.fn(),
}));
vi.mock('./domain/renew.activities', () => ({ sendAlertToSlack: vi.fn() }));
vi.mock('./order-helpers/nfsc-reconciliation', () => ({
  deriveNfscMintReconciliation: vi.fn(),
  NFSC_RECONCILIATION_WINDOW_SLACK_MS: 0,
}));
vi.mock('#lib/tracking/checkout/events', () => ({
  gaEventDomainAcquisitionFinished: vi.fn(),
  gaEventDomainAcquisitionStarted: vi.fn(),
  gaEventOrderItemProcessingFinished: vi.fn(),
  gaEventOrderItemProcessingStarted: vi.fn(),
  gaEventOrderFinishedEmailOpened: vi.fn(),
  gaEventOrderFinishedEmailSent: vi.fn(),
  gaEventOrderItemsProcessingFinished: vi.fn(),
  gaEventOrderItemsProcessingStarted: vi.fn(),
  gaEventOrderProcessingFinished: vi.fn(),
  gaEventOrderProcessingStarted: vi.fn(),
  gaEventPaymentFailed: vi.fn(),
  gaEventPaymentRefunded: vi.fn(),
  gaEventPaymentSuccess: vi.fn(),
  gaEventPurchase: vi.fn(),
}));

const { recordOrderExtendTransaction } = await import('./order.activities');

/** Chainable mock for `tx.update(...).set(...).where(...).returning(...)`. */
function makeUpdateChain(returningValue: Array<{ id: string }>) {
  const chain = {
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve(returningValue)),
  };
  return chain;
}

describe('recordOrderExtendTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes extendTransaction on the item and extendTransactions on the order', async () => {
    const itemChain = makeUpdateChain([{ id: 'item-1' }]);
    const orderChain = makeUpdateChain([{ id: 'order-1' }]);
    const tx = {
      update: vi
        .fn()
        .mockReturnValueOnce(itemChain)
        .mockReturnValueOnce(orderChain),
    };
    dbMocks.transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => cb(tx),
    );

    await recordOrderExtendTransaction({
      orderId: 'order-1',
      orderItemId: 'item-1',
      txHash: '0xabc',
    });

    expect(dbMocks.transaction).toHaveBeenCalledTimes(1);
    // Both the order item and the order metadata are updated.
    expect(tx.update).toHaveBeenCalledTimes(2);
    expect(tx.update).toHaveBeenNthCalledWith(1, expect.anything());
    expect(itemChain.returning).toHaveBeenCalledTimes(1);
    expect(orderChain.returning).toHaveBeenCalledTimes(1);
    expect(loggerMocks.debug).toHaveBeenCalled();
  });

  it('throws and does not update the order when the order item is missing', async () => {
    const itemChain = makeUpdateChain([]); // item not found
    const tx = { update: vi.fn().mockReturnValueOnce(itemChain) };
    dbMocks.transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => cb(tx),
    );

    await expect(
      recordOrderExtendTransaction({
        orderId: 'order-1',
        orderItemId: 'missing-item',
        txHash: '0xabc',
      }),
    ).rejects.toThrow(/Order item not found when recording extend metadata/);

    // It bailed before touching the order (the tx rolls back — no partial write).
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(loggerMocks.debug).not.toHaveBeenCalled();
  });

  it('throws when the order is missing', async () => {
    const itemChain = makeUpdateChain([{ id: 'item-1' }]);
    const orderChain = makeUpdateChain([]); // order not found
    const tx = {
      update: vi
        .fn()
        .mockReturnValueOnce(itemChain)
        .mockReturnValueOnce(orderChain),
    };
    dbMocks.transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => cb(tx),
    );

    await expect(
      recordOrderExtendTransaction({
        orderId: 'missing-order',
        orderItemId: 'item-1',
        txHash: '0xabc',
      }),
    ).rejects.toThrow(/Order not found when recording extend metadata/);
    expect(loggerMocks.debug).not.toHaveBeenCalled();
  });
});
