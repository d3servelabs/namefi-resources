import type { PaymentStatus } from '@namefi-astra/db';
import type Stripe from 'stripe';

// TODO: move to temporal, used only by apps/backend/src/temporal/workflows/finalize-payment-workflow.ts, apps/backend/src/temporal/workflows/finalize-payment-workflow.ts, apps/backend/src/temporal/workflows/capture-stripe-workflow.ts, apps/backend/src/temporal/workflows/capture-stripe-workflow.ts, apps/backend/src/temporal/workflows/chargeUser.workflow.ts, apps/backend/src/temporal/workflows/chargeUser.workflow.ts
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
