import Stripe from 'stripe';
import { secrets } from '#lib/env';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

export async function createCustomer({ name }: Stripe.CustomerCreateParams) {
  const stripeCustomer: Stripe.Response<Stripe.Customer> =
    await stripe.customers.create({ name });
  return stripeCustomer;
}

export async function createCustomerSession({
  stripeCustomerId,
}: {
  stripeCustomerId: string;
}) {
  const customerSession: Stripe.Response<Stripe.CustomerSession> =
    await stripe.customerSessions.create({
      customer: stripeCustomerId,
      components: {
        payment_element: {
          enabled: true,
        },
      },
    });

  return { customerSession };
}

export async function createSetupIntent({
  stripeCustomerId,
}: { stripeCustomerId: string }) {
  const { customerSession } = await createCustomerSession({
    stripeCustomerId,
  });

  const setupIntent: Stripe.Response<Stripe.SetupIntent> =
    await stripe.setupIntents.create({
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
    });

  return {
    setupIntentClientSecret: setupIntent.client_secret,
    customerSessionClientSecret: customerSession.client_secret,
  };
}

export async function createPaymentIntent({
  totalAmountInUsdCents,
  stripeCustomerId,
  paymentMethodId,
}: {
  totalAmountInUsdCents: number;
  stripeCustomerId: string;
  paymentMethodId: string;
}) {
  const customerHasPaymentMethod = await getCustomerHasPaymentMethod({
    paymentMethodId,
    stripeCustomerId,
  });

  if (!customerHasPaymentMethod) {
    throw new Error(
      'The provided Stripe.PaymentMethod ID is not associated with this Stripe.Customer',
    );
  }

  const stripePaymentIntent = await stripe.paymentIntents.create({
    amount: totalAmountInUsdCents,
    currency: 'usd',
    capture_method: 'manual',
    customer: stripeCustomerId,
    confirm: true,
    payment_method: paymentMethodId,
  });

  return { stripePaymentIntent };
}

export async function capturePaymentIntent({
  amountToCaptureInUsdCents,
  stripePaymentIntentId,
}: { amountToCaptureInUsdCents: number; stripePaymentIntentId: string }) {
  const capturedStripePaymentIntent = await stripe.paymentIntents.capture(
    stripePaymentIntentId,
    { amount_to_capture: amountToCaptureInUsdCents },
  );
  return { capturedStripePaymentIntent };
}

export async function getCustomerPaymentMethods({
  stripeCustomerId,
}: { stripeCustomerId: string }) {
  const paymentMethods =
    await stripe.customers.listPaymentMethods(stripeCustomerId);
  return { customerPaymentMethods: paymentMethods.data };
}

export async function getCustomerHasPaymentMethod({
  paymentMethodId,
  stripeCustomerId,
}: { paymentMethodId: string; stripeCustomerId: string }) {
  const { customerPaymentMethods } = await getCustomerPaymentMethods({
    stripeCustomerId,
  });

  return customerPaymentMethods.some(
    (paymentMethod) => paymentMethod.id === paymentMethodId,
  );
}

export async function deleteCustomerPaymentMethod({
  paymentMethodToDeleteId,
  stripeCustomerId,
}: {
  paymentMethodToDeleteId: string;
  stripeCustomerId: string;
}) {
  const customerHasPaymentMethod = await getCustomerHasPaymentMethod({
    paymentMethodId: paymentMethodToDeleteId,
    stripeCustomerId,
  });

  if (!customerHasPaymentMethod) {
    throw new Error(
      'The provided Stripe.PaymentMethod ID is not associated with this Stripe.Customer',
    );
  }

  await stripe.paymentMethods.detach(paymentMethodToDeleteId);
  return { isSuccess: true };
}
