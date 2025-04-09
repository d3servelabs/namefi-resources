import {
  type PaymentProviderDetails,
  type PaymentUpdate,
  type RefundUpdate,
  db,
  paymentProviderSchema,
  paymentStatusSchema,
  paymentsTable,
  refundsTable,
  usersTable,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { isNil } from 'ramda';
import Stripe from 'stripe';
import { usersService } from '#services/index';
import {
  CreateNewPaymentFailure,
  CreateNewRefundFailure,
  MissingNfscPaymentDetailsError,
  MissingPaymentProviderReferenceId,
  NegativeAmountInUsdCentsError,
  NfscPaymentCaptureNotSupportedError,
  PaymentNotFoundError,
  PaymentNotReadyForCaptureError,
  StripeRefundsNotSupportedError,
  UpdatePaymentFailure,
  UpdateRefundFailure,
} from '#services/payments/errors';
import { PaymentMethodNotFoundError } from '#services/stripePayments/errors';
import type { CreateStripePaymentIntentInput } from '#services/stripePayments/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function captureStripePayment({
  amountToCaptureInUsdCents,
  paymentId,
}: { amountToCaptureInUsdCents: number; paymentId: string }) {
  const { paymentProvider, paymentProviderReferenceId, status } =
    await getPaymentDetails({ paymentId });

  if (paymentProvider !== paymentProviderSchema.Values.STRIPE) {
    throw new NfscPaymentCaptureNotSupportedError();
  }

  if (isNil(paymentProviderReferenceId)) {
    throw new MissingPaymentProviderReferenceId({ paymentId });
  }

  if (status !== paymentStatusSchema.Values.REQUIRES_CAPTURE) {
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

export async function createPayment({
  amountInUsdCents,
  paymentProviderDetails,
}: {
  amountInUsdCents: number;
  paymentProviderDetails: PaymentProviderDetails;
}) {
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
    { status: paymentStatusSchema.Values.CREATED },
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

export async function createRefund({
  paymentId,
  amountToRefundInUsdCents,
}: { paymentId: string; amountToRefundInUsdCents: number }) {
  if (amountToRefundInUsdCents < 0) {
    throw new NegativeAmountInUsdCentsError({
      amountInUsdCents: amountToRefundInUsdCents,
    });
  }

  const { paymentProvider, nfscPaymentDetails } = await getPaymentDetails({
    paymentId,
  });

  if (paymentProvider === paymentProviderSchema.Values.STRIPE) {
    throw new StripeRefundsNotSupportedError();
  }

  if (!nfscPaymentDetails) {
    throw new MissingNfscPaymentDetailsError({ paymentId });
  }

  const newRefundInsertValues = Object.assign({
    amountInUSDCents: amountToRefundInUsdCents,
    paymentId,
    status: 'CREATED',
    chainId: nfscPaymentDetails.chainId,
    walletAddress: nfscPaymentDetails.walletAddress,
  });

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
    capture_method: 'manual',
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

export type UpdatePaymentInput = Pick<
  PaymentUpdate,
  'status' | 'paymentProviderReferenceId'
> &
  Required<Pick<PaymentUpdate, 'id'>>;

export async function updatePayment({
  id,
  status,
  paymentProviderReferenceId,
}: UpdatePaymentInput) {
  const [updatedPayment] = await db
    .update(paymentsTable)
    .set({
      status,
      paymentProviderReferenceId,
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

export type PaymentActivities = {
  createPayment: typeof createPayment;
  getPaymentDetails: typeof getPaymentDetails;
  createStripePaymentIntent: typeof createStripePaymentIntent;
  updatePayment: typeof updatePayment;
  createRefund: typeof createRefund;
  updateRefund: typeof updateRefund;
};
