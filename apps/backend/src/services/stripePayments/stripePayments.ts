import type { PaymentStatus } from '@namefi-astra/db';
import Stripe from 'stripe';
import { secrets } from '#lib/env';
import { PaymentMethodNotFoundError } from './errors';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

export function stripePaymentIntentStatusToPaymentStatus({
  paymentIntentStatus,
}: { paymentIntentStatus: Stripe.PaymentIntent.Status }): PaymentStatus {
  switch (paymentIntentStatus) {
    // Intermediate steps
    case 'processing':
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method':
      return 'PROCESSING';

    case 'canceled':
      return 'CANCELLED';
    case 'requires_capture':
      return 'REQUIRES_CAPTURE';
    case 'succeeded':
      return 'SUCCEEDED';

    default:
      return 'PROCESSING';
  }
}

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
  confirmationToken,
}: {
  totalAmountInUsdCents: number;
  stripeCustomerId: string;
  paymentMethodId?: string;
  confirmationToken?: string;
}) {
  if (paymentMethodId) {
    const customerHasPaymentMethod = await getCustomerHasPaymentMethod({
      paymentMethodId,
      stripeCustomerId,
    });

    if (!customerHasPaymentMethod) {
      throw new PaymentMethodNotFoundError({
        stripeCustomerId,
        paymentMethodId,
      });
    }
  }

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = Object.assign(
    {
      amount: totalAmountInUsdCents,
      currency: 'usd',
      capture_method:
        'manual' as Stripe.PaymentIntentCreateParams.CaptureMethod,
      customer: stripeCustomerId,
      confirm: true,
      automatic_payment_methods: {
        allow_redirects: 'never',
        enabled: true,
      } as Stripe.PaymentIntentCreateParams.AutomaticPaymentMethods,
    },
    paymentMethodId ? { payment_method: paymentMethodId } : null,
    confirmationToken ? { confirmation_token: confirmationToken } : null,
  );

  const stripePaymentIntent =
    await stripe.paymentIntents.create(paymentIntentParams);

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
    throw new PaymentMethodNotFoundError({
      stripeCustomerId,
      paymentMethodId: paymentMethodToDeleteId,
    });
  }

  await stripe.paymentMethods.detach(paymentMethodToDeleteId);
  return { isSuccess: true };
}
