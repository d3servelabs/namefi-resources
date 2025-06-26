import type { PaymentStatus, RefundStatus } from '@namefi-astra/db/types';
import type Stripe from 'stripe';

export function stripePaymentIntentStatusToPaymentStatus({
  paymentIntentStatus,
}: {
  paymentIntentStatus: Stripe.PaymentIntent.Status;
}): PaymentStatus {
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

export type StripeRefundStatus =
  | 'pending'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export function stripeRefundStatusToRefundStatus({
  stripeRefundStatus,
}: {
  stripeRefundStatus: StripeRefundStatus;
}): RefundStatus {
  switch (stripeRefundStatus) {
    case 'pending':
      return 'PROCESSING';
    case 'requires_action':
      return 'REQUIRES_ACTION';
    case 'succeeded':
      return 'SUCCEEDED';
    case 'failed':
      return 'FAILED';
    case 'canceled':
      return 'CANCELLED';

    default:
      return 'PROCESSING';
  }
}
