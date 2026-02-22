import type { CheckoutFlowEventName } from './analytics-client';
import {
  CHECKOUT_FLOW_EVENT_LABELS,
  type CheckoutFlowEventsParsed,
  type CheckoutFlowFunnelPoint,
} from './analytics-types';
import { getSuccessCountFromEventWithFallback } from './analytics-shared';

export function buildCheckoutFlowFunnel({
  events,
  eventCountsByName,
}: {
  events: CheckoutFlowEventsParsed;
  eventCountsByName: Record<CheckoutFlowEventName, number>;
}): CheckoutFlowFunnelPoint[] {
  const paymentProcessedSuccessCount = getSuccessCountFromEventWithFallback(
    events.payment_processed,
  );

  return [
    {
      eventName: 'user_begin_search',
      label: CHECKOUT_FLOW_EVENT_LABELS.user_begin_search,
      value: eventCountsByName.user_begin_search,
    },
    {
      eventName: 'order_placed',
      label: CHECKOUT_FLOW_EVENT_LABELS.order_placed,
      value: eventCountsByName.order_placed,
    },
    {
      eventName: 'payment_processed',
      label: 'Payment Processed (Success)',
      value: paymentProcessedSuccessCount,
    },
    {
      eventName: 'order_finished_email_sent',
      label: CHECKOUT_FLOW_EVENT_LABELS.order_finished_email_sent,
      value: eventCountsByName.order_finished_email_sent,
    },
    {
      eventName: 'order_finished_email_opened',
      label: CHECKOUT_FLOW_EVENT_LABELS.order_finished_email_opened,
      value: eventCountsByName.order_finished_email_opened,
    },
  ];
}
