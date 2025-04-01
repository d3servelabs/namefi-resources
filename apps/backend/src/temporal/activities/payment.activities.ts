import {
  type PaymentProvider,
  type PaymentStatus,
  db,
  paymentsTable,
  usersTable,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { isNil } from 'ramda';
import { stripePaymentService, usersService } from '#services/index';
import {
  CreateNewPaymentFailure,
  NegativeAmountInUsdCentsError,
  PaymentNotFoundError,
  UpdatePaymentFailure,
} from '#services/payments/errors';

export async function createPayment({
  amountInUsdCents,
  paymentProvider,
  chainId,
  walletAddress,
}: {
  amountInUsdCents: number;
  paymentProvider: PaymentProvider;
  chainId?: number;
  walletAddress?: string;
}) {
  if (amountInUsdCents < 0) {
    throw new NegativeAmountInUsdCentsError({ amountInUsdCents });
  }

  const newPaymentInsertValues = Object.assign(
    {
      amountInUSDCents: amountInUsdCents,
      paymentProvider,
    },
    chainId && { chainId },
    walletAddress && { walletAddress },
    { status: 'CREATED' as const },
  );

  const [newPayment] = await db
    .insert(paymentsTable)
    .values(newPaymentInsertValues)
    .returning();

  if (isNil(newPayment)) {
    throw new CreateNewPaymentFailure();
  }

  return newPayment;
}

export async function getPaymentDetails({ paymentId }: { paymentId: string }) {
  const payment = await db.query.paymentsTable.findFirst({
    columns: {
      amountInUSDCents: true,
      status: true,
      paymentProvider: true,
      paymentProviderReferenceId: true,
      chainId: true,
      walletAddress: true,
    },
    where: eq(paymentsTable.id, paymentId),
  });

  if (!payment) {
    throw new PaymentNotFoundError({ paymentId });
  }

  return payment;
}

export async function createStripePaymentIntent({
  totalAmountInUsdCents,
  userId,
  confirmationTokenId,
  paymentMethodId,
}: {
  totalAmountInUsdCents: number;
  userId: string;
  confirmationTokenId?: string;
  paymentMethodId?: string;
}) {
  let { stripeCustomerId } = await usersService.getUserStripeCustomerId({
    userId,
  });

  if (!stripeCustomerId) {
    const customer = await stripePaymentService.createCustomer({
      name: userId,
    });

    const [userWithStripeCustomerId] = await db
      .update(usersTable)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning({ stripeCustomerId: usersTable.id });

    stripeCustomerId = userWithStripeCustomerId.stripeCustomerId;
  }

  const { stripePaymentIntent } =
    await stripePaymentService.createPaymentIntent({
      totalAmountInUsdCents,
      stripeCustomerId,
      paymentMethodId,
      confirmationTokenId,
    });

  return { stripePaymentIntent };
}

export async function updatePayment({
  updatePaymentData,
  paymentId,
}: {
  updatePaymentData: {
    paymentProviderReferenceId?: string;
    paymentStatus?: PaymentStatus;
  };
  paymentId: string;
}) {
  const [updatedPayment] = await db
    .update(paymentsTable)
    .set({
      status: updatePaymentData?.paymentStatus ?? undefined,
      paymentProviderReferenceId:
        updatePaymentData?.paymentProviderReferenceId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, paymentId))
    .returning({
      status: paymentsTable.status,
      paymentProviderReferenceId: paymentsTable.paymentProviderReferenceId,
    });

  if (isNil(updatedPayment)) {
    throw new UpdatePaymentFailure({ paymentId });
  }

  return updatedPayment;
}

export type PaymentActivities = {
  createPayment: typeof createPayment;
  getPaymentDetails: typeof getPaymentDetails;
  createStripePaymentIntent: typeof createStripePaymentIntent;
  updatePayment: typeof updatePayment;
};
