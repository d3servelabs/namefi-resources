import {
  type PaymentProviderDetails,
  type PaymentStatus,
  type RefundStatus,
  db,
  paymentProviderSchema,
  paymentStatusSchema,
  paymentsTable,
  refundsTable,
  usersTable,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { isNil } from 'ramda';
import { stripePaymentService, usersService } from '#services/index';
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

  const { capturedStripePaymentIntent } =
    await stripePaymentService.capturePaymentIntent({
      stripePaymentIntentId: paymentProviderReferenceId,
      amountToCaptureInUsdCents,
    });
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

  if (paymentProvider === 'STRIPE') {
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

export async function updateRefund({
  updateRefundData,
  refundId,
}: {
  updateRefundData: {
    paymentProviderReferenceId?: string;
    refundStatus?: RefundStatus;
  };
  refundId: string;
}) {
  const [updatedRefund] = await db
    .update(refundsTable)
    .set({
      status: updateRefundData?.refundStatus ?? undefined,
      paymentProviderReferenceId:
        updateRefundData?.paymentProviderReferenceId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(refundsTable.id, refundId))
    .returning({
      status: refundsTable.status,
      paymentProviderReferenceId: refundsTable.paymentProviderReferenceId,
    });

  if (isNil(updatedRefund)) {
    throw new UpdateRefundFailure({ refundId });
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
