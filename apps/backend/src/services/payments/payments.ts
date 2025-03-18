import { db, type paymentProviderEnum, paymentsTable } from '@namefi-astra/db';
import { isNil } from 'ramda';
import {
  CreateNewPaymentFailure,
  NegativeAmountInUsdCentsError,
} from './errors';

export async function createPayment({
  amountInUsdCents,
  paymentProvider,
}: {
  amountInUsdCents: number;
  paymentProvider: (typeof paymentProviderEnum.enumValues)[number];
}) {
  if (amountInUsdCents < 0) {
    throw new NegativeAmountInUsdCentsError({ amountInUsdCents });
  }

  const [newPayment] = await db
    .insert(paymentsTable)
    .values({
      amountInUSDCents: amountInUsdCents,
      paymentProvider: paymentProvider,
    })
    .returning();

  if (isNil(newPayment)) {
    throw new CreateNewPaymentFailure();
  }

  return newPayment;
}
