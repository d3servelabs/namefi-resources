import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NegativeAmountInUsdCentsError } from '#services/payments/errors';
import { PaymentMethodNotFoundError } from '#services/stripe-payments/errors';

const stripeMocks = vi.hoisted(() => ({
  paymentIntentsCreate: vi.fn(),
  refundsCreate: vi.fn(),
  customersCreate: vi.fn(),
  listPaymentMethods: vi.fn(),
}));

const usersServiceMocks = vi.hoisted(() => ({
  getUserStripeCustomerId: vi.fn(),
}));

const dbMocks = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { update, set, where, returning };
});

vi.mock('stripe', () => ({
  default: class MockStripe {
    paymentIntents = { create: stripeMocks.paymentIntentsCreate };
    refunds = { create: stripeMocks.refundsCreate };
    customers = {
      create: stripeMocks.customersCreate,
      listPaymentMethods: stripeMocks.listPaymentMethods,
    };
  },
}));

vi.mock('@namefi-astra/db', () => ({
  db: { update: dbMocks.update, query: {} },
  $withTransaction: vi.fn(),
  paymentProviderSchema: { enum: {} },
  paymentStatusSchema: { enum: {} },
  paymentsTable: {},
  ordersTable: {},
  refundsTable: {},
  usersTable: { id: 'users.id', stripeCustomerId: 'users.stripeCustomerId' },
}));

vi.mock('@namefi-astra/db/types', () => ({
  buildPaymentStatusLifecycleTransition: vi.fn(() => ({})),
  buildRefundStatusLifecycleTransition: vi.fn(() => ({})),
}));

vi.mock('@namefi-astra/utils', () => ({
  CHAINS: {},
  checksumWalletAddressSchema: {},
  resolveOrFallback: vi.fn(),
  getChain: vi.fn(),
  switchCaseOrDefault: vi.fn(),
  resolve: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  isNull: vi.fn(),
  or: vi.fn(),
}));

vi.mock('#lib/env', () => ({
  config: {},
  secrets: { STRIPE_SECRET_KEY: 'sk_test_mock' },
}));

vi.mock('#lib/env/allowed-chains', () => ({
  getAllowedChainsForNfscBalance: vi.fn(() => []),
}));

vi.mock('#lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  },
}));

vi.mock('#services/index', () => ({
  usersService: usersServiceMocks,
}));

vi.mock('./mint/mint.activities', () => ({
  getNfscBalanceInUSD: vi.fn(),
}));

vi.mock('../../trpc/utils', () => ({
  getPrivyUserLinkedEthereumChecksumWalletAddresses: vi.fn(),
  privyClient: {},
}));

import {
  createStripePaymentIntent,
  createStripeRefund,
} from './payment.activities';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createStripePaymentIntent', () => {
  it('passes the idempotency key to stripe.paymentIntents.create so retries cannot double-charge', async () => {
    usersServiceMocks.getUserStripeCustomerId.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
    });
    stripeMocks.listPaymentMethods.mockResolvedValue({
      data: [{ id: 'pm_1' }],
    });
    stripeMocks.paymentIntentsCreate.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
    });

    const { stripePaymentIntent } = await createStripePaymentIntent({
      totalAmountInUsdCents: 1299,
      userId: 'user-1',
      paymentMethodId: 'pm_1',
      idempotencyKey: 'payment-intent-payment-1',
    });

    expect(stripePaymentIntent.id).toBe('pi_1');
    expect(stripeMocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
    expect(stripeMocks.paymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1299,
        currency: 'usd',
        customer: 'cus_existing',
        confirm: true,
        payment_method: 'pm_1',
      }),
      { idempotencyKey: 'payment-intent-payment-1' },
    );
  });

  it('does not create a Stripe customer when the user already has one', async () => {
    usersServiceMocks.getUserStripeCustomerId.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
    });
    stripeMocks.paymentIntentsCreate.mockResolvedValue({ id: 'pi_1' });

    await createStripePaymentIntent({
      totalAmountInUsdCents: 500,
      userId: 'user-1',
      idempotencyKey: 'key-1',
    });

    expect(stripeMocks.customersCreate).not.toHaveBeenCalled();
  });

  it('creates a missing Stripe customer with a deterministic per-user idempotency key', async () => {
    usersServiceMocks.getUserStripeCustomerId.mockResolvedValue({
      stripeCustomerId: null,
    });
    stripeMocks.customersCreate.mockResolvedValue({ id: 'cus_new' });
    dbMocks.returning.mockResolvedValue([{ stripeCustomerId: 'cus_new' }]);
    stripeMocks.paymentIntentsCreate.mockResolvedValue({ id: 'pi_1' });

    await createStripePaymentIntent({
      totalAmountInUsdCents: 500,
      userId: 'user-42',
      idempotencyKey: 'key-1',
    });

    expect(stripeMocks.customersCreate).toHaveBeenCalledTimes(1);
    expect(stripeMocks.customersCreate).toHaveBeenCalledWith(
      { name: 'user-42' },
      { idempotencyKey: 'create-stripe-customer-user-42' },
    );
    expect(stripeMocks.paymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_new' }),
      { idempotencyKey: 'key-1' },
    );
  });

  it('rejects an unknown payment method before creating a PaymentIntent', async () => {
    usersServiceMocks.getUserStripeCustomerId.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
    });
    stripeMocks.listPaymentMethods.mockResolvedValue({
      data: [{ id: 'pm_other' }],
    });

    await expect(
      createStripePaymentIntent({
        totalAmountInUsdCents: 500,
        userId: 'user-1',
        paymentMethodId: 'pm_missing',
        idempotencyKey: 'key-1',
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNotFoundError);
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });
});

describe('createStripeRefund', () => {
  it('passes the idempotency key to stripe.refunds.create so retries cannot double-refund', async () => {
    stripeMocks.refundsCreate.mockResolvedValue({
      id: 're_1',
      status: 'succeeded',
    });

    const { stripeRefund } = await createStripeRefund({
      amountToRefundInUsdCents: 250,
      stripePaymentIntentId: 'pi_1',
      idempotencyKey: 'refund-refund-1',
    });

    expect(stripeRefund.id).toBe('re_1');
    expect(stripeMocks.refundsCreate).toHaveBeenCalledTimes(1);
    expect(stripeMocks.refundsCreate).toHaveBeenCalledWith(
      { amount: 250, payment_intent: 'pi_1' },
      { idempotencyKey: 'refund-refund-1' },
    );
  });

  it('rejects negative amounts before calling Stripe', async () => {
    await expect(
      createStripeRefund({
        amountToRefundInUsdCents: -1,
        stripePaymentIntentId: 'pi_1',
        idempotencyKey: 'refund-refund-1',
      }),
    ).rejects.toBeInstanceOf(NegativeAmountInUsdCentsError);
    expect(stripeMocks.refundsCreate).not.toHaveBeenCalled();
  });
});
