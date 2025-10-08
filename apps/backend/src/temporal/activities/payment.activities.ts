import {
  type PaymentProviderDetails,
  type PaymentUpdate,
  type RefundInsert,
  type RefundUpdate,
  db,
  paymentProviderSchema,
  paymentStatusSchema,
  paymentsTable,
  refundsTable,
  usersTable,
} from '@namefi-astra/db';
import { eq, inArray } from 'drizzle-orm';
import { isNil, indexBy, prop } from 'ramda';
import Stripe from 'stripe';
import { usersService } from '#services/index';
import {
  CreateNewPaymentFailure,
  CreateNewRefundFailure,
  MissingPaymentProviderReferenceId,
  NegativeAmountInUsdCentsError,
  NfscPaymentCaptureNotSupportedError,
  PaymentNotFoundError,
  PaymentNotReadyForCaptureError,
  UpdatePaymentFailure,
  UpdateRefundFailure,
} from '#services/payments/errors';
import { PaymentMethodNotFoundError } from '#services/stripe-payments/errors';
import type { CreateStripePaymentIntentInput } from '#services/stripe-payments/types';
import type { PaymentProvider } from '@namefi-astra/db/types';
import {
  CHAINS,
  checksumWalletAddressSchema,
  resolveOrFallback,
  type ChecksumWalletAddress,
} from '@namefi-astra/utils';
import { getChain } from '@namefi-astra/utils';
import { config, secrets } from '#lib/env';
import { isNotNil, isNotEmpty } from 'ramda';
import { switchCaseOrDefault, resolve } from '@namefi-astra/utils';
import type { Chain } from 'viem';
import { logger } from '#lib/logger';
import { getNfscBalanceInUSD } from './mint.activities';
import { privyClient } from '../../trpc/utils';
import type { WalletWithMetadata } from '@privy-io/server-auth';
import { $withTransaction } from '@namefi-astra/db';
import { ApplicationFailure } from '@temporalio/common';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

export async function captureStripePayment({
  amountToCaptureInUsdCents,
  paymentId,
}: {
  amountToCaptureInUsdCents: number;
  paymentId: string;
}) {
  const { paymentProvider, paymentProviderReferenceId, status } =
    await getPaymentDetails({ paymentId });

  if (paymentProvider !== paymentProviderSchema.enum.STRIPE) {
    throw new NfscPaymentCaptureNotSupportedError();
  }

  if (isNil(paymentProviderReferenceId)) {
    throw new MissingPaymentProviderReferenceId({ paymentId });
  }

  if (status !== paymentStatusSchema.enum.REQUIRES_CAPTURE) {
    throw new PaymentNotReadyForCaptureError({
      paymentId,
      paymentProviderReferenceId,
    });
  }

  const capturedStripePaymentIntent = await stripe.paymentIntents.capture(
    paymentProviderReferenceId,
    { amount_to_capture: amountToCaptureInUsdCents },
  );

  return { capturedStripePaymentIntent };
}

export async function createPayment(
  {
    amountInUsdCents,
    paymentProviderDetails,
  }: {
    amountInUsdCents: number;
    paymentProviderDetails: PaymentProviderDetails;
  },
  { tx }: { tx?: typeof db } = {},
) {
  return $withTransaction(
    async (tx) => {
      if (amountInUsdCents < 0) {
        throw new NegativeAmountInUsdCentsError({ amountInUsdCents });
      }

      const newPaymentInsertValues = Object.assign(
        {
          amountInUSDCents: amountInUsdCents,
          paymentProvider: paymentProviderDetails.paymentProvider,
        },
        paymentProviderDetails.paymentProvider === 'STRIPE'
          ? {
              stripePaymentDetails: paymentProviderDetails.stripePaymentDetails,
            }
          : {
              nfscPaymentDetails: paymentProviderDetails.nfscPaymentDetails,
            },
        { status: paymentStatusSchema.enum.CREATED },
      );

      const [newPayment] = await tx
        .insert(paymentsTable)
        .values(newPaymentInsertValues)
        .returning();

      if (isNil(newPayment)) {
        throw new CreateNewPaymentFailure();
      }

      return newPayment;
    },
    { deferrable: true, isolationLevel: 'serializable' },
    tx,
  );
}

export async function createRefund({
  paymentId,
  amountToRefundInUsdCents,
}: {
  paymentId: string;
  amountToRefundInUsdCents: number;
}) {
  if (amountToRefundInUsdCents < 0) {
    throw new NegativeAmountInUsdCentsError({
      amountInUsdCents: amountToRefundInUsdCents,
    });
  }

  const { nfscPaymentDetails } = await getPaymentDetails({
    paymentId,
  });

  const newRefundInsertValues: RefundInsert = nfscPaymentDetails
    ? {
        amountInUSDCents: amountToRefundInUsdCents,
        paymentId,
        status: 'CREATED',
        chainId: nfscPaymentDetails.chainId,
        walletAddress: nfscPaymentDetails.walletAddress,
      }
    : {
        amountInUSDCents: amountToRefundInUsdCents,
        paymentId,
        status: 'CREATED',
      };

  const [newRefund] = await db
    .insert(refundsTable)
    .values(newRefundInsertValues)
    .returning();

  if (isNil(newRefund)) {
    throw new CreateNewRefundFailure();
  }

  return newRefund;
}

export async function getPaymentDetails({ paymentId }: { paymentId: string }) {
  const payment = await db.query.paymentsTable.findFirst({
    columns: {
      amountInUSDCents: true,
      status: true,
      paymentProvider: true,
      paymentProviderReferenceId: true,
      nfscPaymentDetails: true,
      stripePaymentDetails: true,
    },
    where: eq(paymentsTable.id, paymentId),
  });

  if (!payment) {
    throw new PaymentNotFoundError({ paymentId });
  }

  return payment;
}

export async function getMultiplePaymentsDetails(input: {
  paymentIds: string[];
}) {
  const paymentIds = Array.from(new Set(input.paymentIds));
  if (paymentIds.length === 0) {
    return {};
  }
  const payments = await db.query.paymentsTable.findMany({
    columns: {
      id: true,
      amountInUSDCents: true,
      status: true,
      paymentProvider: true,
      paymentProviderReferenceId: true,
      nfscPaymentDetails: true,
      stripePaymentDetails: true,
    },
    where: inArray(paymentsTable.id, paymentIds),
  });

  if (!payments.length || payments.length !== paymentIds.length) {
    throw ApplicationFailure.create({
      message: 'Some payments not found',
      details: [{ paymentIds }],
    });
  }

  return indexBy(prop('id'), payments);
}

export async function getRefundDetails({ refundId }: { refundId: string }) {
  const refund = await db.query.refundsTable.findFirst({
    columns: {
      amountInUSDCents: true,
      paymentId: true,
      paymentProviderReferenceId: true,
      status: true,
    },
    where: eq(refundsTable.id, refundId),
  });

  if (!refund) {
    throw new Error(`Could not find Refund with ID: ${refundId}`);
  }

  return refund;
}

export async function createStripePaymentIntent({
  totalAmountInUsdCents,
  userId,
  confirmationTokenId,
  paymentMethodId,
}: Omit<CreateStripePaymentIntentInput, 'stripeCustomerId'> & {
  userId: string;
}) {
  let { stripeCustomerId } = await usersService.getUserStripeCustomerId({
    userId,
  });

  if (!stripeCustomerId) {
    const customer: Stripe.Response<Stripe.Customer> =
      await stripe.customers.create({ name: userId });

    const [userWithStripeCustomerId] = await db
      .update(usersTable)
      .set({
        stripeCustomerId: customer.id,
      })
      .where(eq(usersTable.id, userId))
      .returning({ stripeCustomerId: usersTable.stripeCustomerId });

    stripeCustomerId = userWithStripeCustomerId.stripeCustomerId as string;
  }

  if (paymentMethodId) {
    const customerPaymentMethods: Stripe.PaymentMethod[] = (
      await stripe.customers.listPaymentMethods(stripeCustomerId)
    ).data;

    const customerHasPaymentMethod = customerPaymentMethods.some(
      (paymentMethod) => paymentMethod.id === paymentMethodId,
    );

    if (!customerHasPaymentMethod) {
      throw new PaymentMethodNotFoundError({
        stripeCustomerId,
        paymentMethodId,
      });
    }
  }

  const stripePaymentIntent = await stripe.paymentIntents.create({
    amount: totalAmountInUsdCents,
    currency: 'usd',
    capture_method: 'automatic',
    customer: stripeCustomerId,
    confirm: true,
    automatic_payment_methods: {
      allow_redirects: 'never',
      enabled: true,
    },
    payment_method: paymentMethodId,
    confirmation_token: confirmationTokenId,
  });

  return { stripePaymentIntent };
}

export async function createStripeRefund({
  amountToRefundInUsdCents,
  stripePaymentIntentId,
}: {
  amountToRefundInUsdCents: number;
  stripePaymentIntentId: string;
}) {
  if (amountToRefundInUsdCents < 0) {
    throw new NegativeAmountInUsdCentsError({
      amountInUsdCents: amountToRefundInUsdCents,
    });
  }

  const stripeRefund = await stripe.refunds.create({
    amount: amountToRefundInUsdCents,
    payment_intent: stripePaymentIntentId,
  });

  return { stripeRefund };
}

export async function getStripeRefundStatus({
  stripeRefundId,
}: {
  stripeRefundId: string;
}) {
  const refund = await stripe.refunds.retrieve(stripeRefundId);

  return refund.status;
}

export type UpdatePaymentInput = Pick<
  PaymentUpdate,
  'status' | 'paymentProviderReferenceId' | 'amountInUSDCents'
> &
  Required<Pick<PaymentUpdate, 'id'>>;

export async function updatePayment({
  id,
  status,
  paymentProviderReferenceId,
  amountInUSDCents,
}: UpdatePaymentInput) {
  const [updatedPayment] = await db
    .update(paymentsTable)
    .set({
      status,
      paymentProviderReferenceId,
      amountInUSDCents,
    })
    .where(eq(paymentsTable.id, id))
    .returning({
      status: paymentsTable.status,
      paymentProviderReferenceId: paymentsTable.paymentProviderReferenceId,
    });

  if (isNil(updatedPayment)) {
    throw new UpdatePaymentFailure({ paymentId: id });
  }

  return updatedPayment;
}

export type UpdateRefundInput = Pick<
  RefundUpdate,
  'status' | 'paymentProviderReferenceId'
> &
  Required<Pick<RefundUpdate, 'id'>>;

export async function updateRefund({
  status,
  id,
  paymentProviderReferenceId,
}: UpdateRefundInput) {
  const [updatedRefund] = await db
    .update(refundsTable)
    .set({
      status,
      paymentProviderReferenceId,
    })
    .where(eq(refundsTable.id, id))
    .returning({
      status: refundsTable.status,
      paymentProviderReferenceId: refundsTable.paymentProviderReferenceId,
    });

  if (isNil(updatedRefund)) {
    throw new UpdateRefundFailure({ refundId: id });
  }

  return updatedRefund;
}

export async function getPreferredEvmWalletAddressToBeCharged(
  userId: string,
): Promise<ChecksumWalletAddress> {
  const user = await db.query.usersTable.findFirst({
    where: (usersTable, { eq }) => eq(usersTable.id, userId),
  });
  if (!user) {
    throw new Error('User not found');
  }
  const privyUser = await privyClient.getUser(user.privyUserId);
  if (!privyUser) {
    throw new Error('Privy user not found');
  }
  const walletAddress = (
    privyUser.linkedAccounts.find(
      (account) =>
        account.type === 'wallet' && account.chainType === 'ethereum',
    ) as WalletWithMetadata | undefined
  )?.address;
  if (!walletAddress) {
    throw new Error('Wallet address not found');
  }
  const result = checksumWalletAddressSchema.safeParse(walletAddress);
  if (!result.success) {
    throw new Error('Invalid wallet address');
  }
  return result.data;
}

/**
 * Determines which payment methods are available based on allowed chains and mock registrar settings
 *
 * @returns Array of available NamefiPaymentType payment methods
 *
 * The logic:
 * 1. Checks if live payment methods should be disabled via USE_MOCK_REGISTRARS
 * 2. Gets allowed chains from config and filters out non-testnet chains if using mocks
 * 3. Maps each allowed chain to its corresponding NFSC payment method(s)
 */
export async function determineAvailablePaymentMethods(
  amountInUsd: number,
  userId: string,
): Promise<{
  availablePaymentMethods: PaymentProvider[];
  walletAddressToBeCharged: ChecksumWalletAddress;
  stripePreferredPaymentMethodId?: string;
}> {
  const walletAddressToBeCharged =
    await getPreferredEvmWalletAddressToBeCharged(userId);

  // Check if we should disable live payment methods (non-testnet chains)
  const disableLivePaymentMethods = config.DISALLOW_LIVE_PAYMENT_METHODS; // TODO:  true if USE_MOCK_REGISTRARS; Add to global config

  // Get allowed chains and filter out non-testnet chains if using mocks
  const allowedChains: Chain[] = config.ALLOWED_CHAINS.map((chain) =>
    getChain(chain),
  ).filter(
    (chain) =>
      isNotNil(chain) && !(!chain.testnet && disableLivePaymentMethods),
  ) as Chain[];

  // Map each chain to its corresponding NFSC payment method(s)
  const paymentMethodsFromChains = (
    await Promise.all(
      allowedChains.map(async (chain) => {
        const paymentMethod = switchCaseOrDefault(
          chain.id,
          {
            [CHAINS.base.id]: paymentProviderSchema.enum.NFSC_BASE, // Base chain -> NFSC on Base
            [CHAINS.mainnet.id]: paymentProviderSchema.enum.NFSC_ETHEREUM, // Mainnet -> NFSC on Ethereum
            [CHAINS.sepolia.id]:
              paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA,
          },
          null, // Default to null for unhandled chains
        );
        if (paymentMethod === null) {
          return null;
        }
        const nfscBalanceInUsd = await getNfscBalanceInUSD(
          chainIdFromPaymentMethod(paymentMethod),
          walletAddressToBeCharged,
        );
        if (nfscBalanceInUsd >= amountInUsd) {
          return paymentMethod;
        }
        return null;
      }),
    )
  ).filter((paymentMethod) => paymentMethod !== null);

  const stripePreferredPaymentMethod =
    await getPreferredPaymentMethodForNamefiUser({ namefiUserId: userId });
  if (isNotNil(stripePreferredPaymentMethod)) {
    return {
      availablePaymentMethods: [
        ...paymentMethodsFromChains,
        paymentProviderSchema.enum.STRIPE,
      ],
      walletAddressToBeCharged,
      stripePreferredPaymentMethodId: stripePreferredPaymentMethod.id,
    };
  }
  return {
    availablePaymentMethods: paymentMethodsFromChains,
    walletAddressToBeCharged,
  };
}

export function chainIdFromPaymentMethod(
  paymentMethod: PaymentProvider,
): number {
  switch (paymentMethod) {
    case paymentProviderSchema.enum.NFSC_BASE:
      return CHAINS.base.id;
    case paymentProviderSchema.enum.NFSC_ETHEREUM:
      return CHAINS.mainnet.id;
    case paymentProviderSchema.enum.STRIPE:
      throw new Error(
        'STRIPE payment method does not have an associated chain ID',
      );
    default:
      throw new Error(`Invalid payment method: ${paymentMethod}`);
  }
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 *
 * @param namefiUserId - The ID of the Namefi user
 * @returns The Stripe customer ID for the Namefi user
 */
export async function getStripeCustomerIdOrThrow(
  namefiUserId: string,
): Promise<string> {
  const user = await db.query.usersTable.findFirst({
    where: (usersTable, { eq }) => eq(usersTable.id, namefiUserId),
  });
  logger.info({ user }, 'Retrieved User');
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.stripeCustomerId) {
    logger.warn('User has no Stripe Customer ID');
    throw new Error('User has no Stripe Customer ID');
  }

  return user.stripeCustomerId;
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 *
 * @param namefiUserId - The ID of the Namefi user
 * @returns The default Stripe payment method for the Namefi user
 */
export async function getDefaultStripePaymentMethodForNamefiUserOrThrow({
  namefiUserId,
}: {
  namefiUserId: string;
}): Promise<Stripe.PaymentMethod | null> {
  const stripeCustomerIdResponse = await resolve(
    getStripeCustomerIdOrThrow(namefiUserId),
  );
  if (stripeCustomerIdResponse.failed) {
    logger.error(
      { namefiUserId, error: stripeCustomerIdResponse.error },
      'Failed to get Stripe Customer ID',
    );
    throw new Error(
      `Failed to get Stripe Customer ID for user ${namefiUserId}`,
    );
  }
  const stripeCustomerId = stripeCustomerIdResponse.result;

  const customer: Stripe.Customer | Stripe.DeletedCustomer =
    await stripe.customers.retrieve(stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    });
  logger.info({ customer }, 'Retrieved Stripe Customer');

  if (customer.deleted) {
    logger.warn(
      "Tried to get a deleted Stripe Customer's default payment method",
    );
    throw new Error(
      "Tried to get a deleted Stripe Customer's default payment method",
    );
  }

  if (isNotNil(customer.invoice_settings?.default_payment_method)) {
    return customer.invoice_settings
      ?.default_payment_method as Stripe.PaymentMethod;
  }

  return null;
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 *
 * @param namefiUserId - The ID of the Namefi user
 * @returns The preferred payment method for the Namefi user
 */
export async function getPreferredPaymentMethodForNamefiUser({
  namefiUserId,
}: {
  namefiUserId: string;
}): Promise<StripePaymentMethod | null> {
  const defaultPaymentMethod: Stripe.PaymentMethod | null =
    await resolveOrFallback(
      getDefaultStripePaymentMethodForNamefiUserOrThrow({
        namefiUserId,
      }),
      null,
    );

  if (
    isNotNil(defaultPaymentMethod) &&
    defaultPaymentMethod.type === 'card' &&
    isNotNil(defaultPaymentMethod.card)
  ) {
    return {
      id: defaultPaymentMethod.id,
      fingerprint: defaultPaymentMethod.card.fingerprint ?? undefined,
      type: 'CREDIT_CARD',
      cardDetails: {
        brand: defaultPaymentMethod.card.brand,
        expMonth: defaultPaymentMethod.card.exp_month,
        expYear: defaultPaymentMethod.card.exp_year,
        last4: defaultPaymentMethod.card.last4,
      },
    };
  }

  const stripeCustomerId = await resolveOrFallback(
    getStripeCustomerIdOrThrow(namefiUserId),
    undefined,
  );
  if (isNil(stripeCustomerId)) {
    return null;
  }

  const userPaymentMethods = await resolveOrFallback(
    getStripeCustomerPaymentMethods({
      stripeCustomerId,
    }),
    [] as StripePaymentMethod[],
  );

  for (const paymentMethod of userPaymentMethods) {
    if (
      isNotNil(paymentMethod.cardDetails) &&
      isNotEmpty(paymentMethod.cardDetails)
    ) {
      return paymentMethod;
    }
  }

  return null;
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 *
 * @param stripeCustomerId - The ID of the Stripe customer
 * @returns An array of Stripe payment methods
 */
export async function getStripeCustomerPaymentMethods({
  stripeCustomerId,
}: {
  stripeCustomerId: string;
}): Promise<StripePaymentMethod[]> {
  const stripeCustomerPaymentMethods =
    await stripe.customers.listPaymentMethods(stripeCustomerId);
  return stripeCustomerPaymentMethods.data.map((stripePaymentMethod) => {
    if (
      stripePaymentMethod.type === 'card' &&
      isNotNil(stripePaymentMethod.card)
    ) {
      return {
        id: stripePaymentMethod.id,
        fingerprint: stripePaymentMethod.card.fingerprint ?? undefined,
        type: 'CREDIT_CARD',
        cardDetails: {
          brand: stripePaymentMethod.card.brand ?? '',
          expMonth: stripePaymentMethod.card.exp_month,
          expYear: stripePaymentMethod.card.exp_year,
          last4: stripePaymentMethod.card.last4,
        },
      };
    }
    return {
      id: stripePaymentMethod.id,
      fingerprint: null,
      type: 'CREDIT_CARD',
      cardDetails: null,
    };
  });
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 * Represents the details of a Stripe credit card payment method
 *
 * @property brand - The brand of the credit card
 * @property expMonth - The expiration month of the credit card
 * @property expYear - The expiration year of the credit card
 * @property last4 - The last 4 digits of the credit card number
 */
export interface StripeCardDetails {
  brand: string;
  expMonth: number;
  expYear: number;
  last4: string;
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 * Represents a Stripe payment method
 *
 * @property id - The ID of the payment method
 * @property fingerprint - The fingerprint of the payment method
 * @property type - The type of the payment method
 * @property cardDetails - The details of the credit card payment method
 */
export interface StripePaymentMethod {
  id: string;
  fingerprint?: string | null | undefined;
  type: 'CREDIT_CARD';
  cardDetails?: StripeCardDetails | null | undefined;
}

/**
 * TODO: Migrated From Legacy Codebase, Review if this is needed
 *
 * @param namefiUserId - The ID of the Namefi user
 * @returns The default Stripe payment method for the Namefi user
 */
export async function getStripePaymentMethodPublicIdentifier({
  paymentMethodId,
}: {
  paymentMethodId: string;
}): Promise<string | null> {
  const stripePaymentMethod =
    await stripe.paymentMethods.retrieve(paymentMethodId);

  switch (stripePaymentMethod.type) {
    case 'card':
      return stripePaymentMethod.card?.last4 ?? null;
    default:
      logger.warn(
        { stripePaymentMethod },
        'Unsupported Stripe Payment Method Type',
      );
      return null;
  }
}
