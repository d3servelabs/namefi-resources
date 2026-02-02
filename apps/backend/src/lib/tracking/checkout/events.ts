import type { BackendAnalyticsEventName } from '#lib/analytics-events';
import { sendGA4Event, type GA4Event } from '#lib/ga4-measurement';
import { createLogger } from '#lib/logger';
import type { PaymentProvider } from '@namefi-astra/common/payment-provider';
import type { OrderStatus } from '@namefi-astra/common/shared-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

const logger = createLogger({ name: 'tracking-checkout' });

type CheckoutAnalyticsBaseInput = {
  userId?: string;
  orderId?: string;
  normalizedDomainName?: NamefiNormalizedDomain;
  orderItemId?: string;
};

type LogGaEventOrderPlacedInput = CheckoutAnalyticsBaseInput & {
  orderId: string;
  amountUsdCents: number;
  itemCount: number;
  paymentCount: number;
  orderSource?: 'checkout' | 'instant_buy';
};

type CheckoutAnalyticsPaymentsBaseInput = CheckoutAnalyticsBaseInput & {
  amountUsdCents?: number;
  paymentProvider?: string;
  paymentProviders?: string;
  paymentCount: number;
};
type LogGaEventPaymentSuccessInput = CheckoutAnalyticsPaymentsBaseInput;
type LogGaEventPaymentFailedInput = CheckoutAnalyticsPaymentsBaseInput & {
  failureReason?: string;
};
type LogGaEventPaymentRefundedInput = CheckoutAnalyticsPaymentsBaseInput & {
  refundAmountUsdCents: number;
  refundType: 'PARTIAL' | 'FULL';
};
type LogGaEventDomainAcquisitionStartedInput = CheckoutAnalyticsBaseInput & {
  normalizedDomainName: string;
  registrarKey?: string;
  operationType: 'IMPORT' | 'REGISTER';
  durationInYears?: number;
  chainId?: number;
};
type LogGaEventDomainAcquisitionSucceededInput =
  LogGaEventDomainAcquisitionStartedInput;

type LogGaEventDomainAcquisitionFailedInput =
  LogGaEventDomainAcquisitionStartedInput & {
    failureReason?: string;
  };

type LogGaEventDnsRecordsPropagatedInput = CheckoutAnalyticsBaseInput & {
  normalizedDomainName: string;
  dnsProvider: 'NAMEFI' | 'OTHER';
};

type LogGaEventParkingReadyInput = CheckoutAnalyticsBaseInput & {
  normalizedDomainName: string;
  registrarKey?: string;
  optOut: boolean;
  status: 'SUCCESS' | 'TIMEOUT';
};

type LogGaEventOrderFinishedEmailSentInput = CheckoutAnalyticsBaseInput & {
  orderStatus: OrderStatus;
};
type LogGaEventOrderFinishedEmailOpenedInput = CheckoutAnalyticsBaseInput & {
  emailId?: string;
};

type CheckoutEventBaseParams = {
  user_id?: string;
  order_id?: string;
  normalized_domain_name?: string;
  order_item_id?: string;
};

function baseEventParams({
  userId,
  orderId,
  normalizedDomainName,
  orderItemId,
}: CheckoutAnalyticsBaseInput): CheckoutEventBaseParams {
  return {
    user_id: userId,
    order_id: orderId,
    normalized_domain_name: normalizedDomainName,
    order_item_id: orderItemId,
  };
}

async function sendCheckoutEvent<E extends BackendAnalyticsEventName>({
  userId,
  event,
  metadata,
}: {
  userId?: string;
  event: GA4Event<E>;
  metadata?: Record<string, unknown>;
}) {
  try {
    await sendGA4Event({ userId, event });
  } catch (error) {
    logger.warn(
      { error, eventName: event.name, ...metadata },
      'Failed to send GA checkout event',
    );
  }
}

export async function gaEventOrderPlaced(
  input: LogGaEventOrderPlacedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'order_placed',
      params: {
        ...baseEventParams(input),
        order_id: input.orderId,
        amount_usd_cents: input.amountUsdCents,
        item_count: input.itemCount,
        payment_count: input.paymentCount,
        order_source: input.orderSource,
      },
    },
    metadata: {
      orderId: input.orderId,
    },
  });
}

export async function gaEventPaymentSuccess(
  input: LogGaEventPaymentSuccessInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'payment_processed',
      params: {
        ...baseEventParams(input),
        amount_usd_cents: input.amountUsdCents,
        payment_provider: input.paymentProvider,
        payment_providers: input.paymentProviders,
        status: 'SUCCESS',
        payment_count: input.paymentCount,
      },
    },
  });
}

export async function gaEventPaymentFailed(
  input: LogGaEventPaymentFailedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'payment_processed',
      params: {
        ...baseEventParams(input),
        amount_usd_cents: input.amountUsdCents,
        payment_provider: input.paymentProvider,
        payment_providers: input.paymentProviders,
        failure_reason: input.failureReason,
        status: 'FAILURE',
        payment_count: input.paymentCount,
      },
    },
  });
}

export async function gaEventPaymentRefunded(
  input: LogGaEventPaymentRefundedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'payment_refunded',
      params: {
        ...baseEventParams(input),
        amount_usd_cents: input.amountUsdCents,
        payment_provider: input.paymentProvider,
        payment_providers: input.paymentProviders,
        payment_count: input.paymentCount,
        refund_type: input.refundType,
        refund_amount_usd_cents: input.refundAmountUsdCents,
      },
    },
  });
}

export async function gaEventDomainAcquisitionStarted(
  input: LogGaEventDomainAcquisitionStartedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'domain_acquisition_started',
      params: {
        ...baseEventParams(input),
        normalized_domain_name: input.normalizedDomainName,
        registrar_key: input.registrarKey,
        operation_type: input.operationType,
        duration_years: input.durationInYears,
        chain_id: input.chainId,
      },
    },
    metadata: {
      orderId: input.orderId,
      normalizedDomainName: input.normalizedDomainName,
      orderItemId: input.orderItemId,
    },
  });
}

export async function gaEventDomainAcquisitionFinished(
  status: 'SUCCESS' | 'FAILURE',
  input:
    | LogGaEventDomainAcquisitionSucceededInput
    | LogGaEventDomainAcquisitionFailedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'domain_acquisition_finished',
      params: {
        ...baseEventParams(input),
        normalized_domain_name: input.normalizedDomainName,
        status,
        failure_reason:
          'failureReason' in input ? input.failureReason : undefined,
        registrar_key: input.registrarKey,
        operation_type: input.operationType,
        duration_years: input.durationInYears,
        chain_id: input.chainId,
      },
    },
    metadata: {
      orderId: input.orderId,
      normalizedDomainName: input.normalizedDomainName,
      orderItemId: input.orderItemId,
    },
  });
}

export async function gaEventDnsRecordsPropagated(
  input: LogGaEventDnsRecordsPropagatedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'dns_records_propagated',
      params: {
        ...baseEventParams(input),
        normalized_domain_name: input.normalizedDomainName,
        dns_provider: input.dnsProvider,
      },
    },
    metadata: {
      orderId: input.orderId,
      normalizedDomainName: input.normalizedDomainName,
      orderItemId: input.orderItemId,
    },
  });
}

export async function gaEventParkingFinished(
  input: LogGaEventParkingReadyInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'parking_finished',
      params: {
        ...baseEventParams(input),
        normalized_domain_name: input.normalizedDomainName,
        registrar_key: input.registrarKey,
        opt_out: input.optOut,
        status: input.status,
      },
    },
    metadata: {
      orderId: input.orderId,
      normalizedDomainName: input.normalizedDomainName,
      orderItemId: input.orderItemId,
    },
  });
}

export async function gaEventOrderFinishedEmailSent(
  input: LogGaEventOrderFinishedEmailSentInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'order_finished_email_sent',
      params: {
        ...baseEventParams(input),
        order_status: input.orderStatus,
      },
    },
    metadata: {
      orderId: input.orderId,
      orderItemId: input.orderItemId,
    },
  });
}

export async function gaEventOrderFinishedEmailOpened(
  input: LogGaEventOrderFinishedEmailOpenedInput,
): Promise<void> {
  return sendCheckoutEvent({
    userId: input.userId,
    event: {
      name: 'order_finished_email_opened',
      params: {
        ...baseEventParams(input),
        email_distinct_id: input.emailId,
      },
    },
    metadata: {
      orderId: input.orderId,
      orderItemId: input.orderItemId,
    },
  });
}

export async function gaEventUserBeginSearch({
  userId,
  clientId,
  searchTerm,
  parentDomain,
}: {
  userId?: string;
  clientId: string | null;
  searchTerm: string;
  parentDomain?: string;
}) {
  if (!searchTerm) return;
  if (!userId && !clientId) return;
  try {
    await sendGA4Event({
      userId,
      clientId: clientId ?? undefined,
      event: {
        name: 'user_begin_search',
        params: {
          search_term: searchTerm,
          parent_domain: parentDomain,
        },
      },
    });
  } catch (error) {
    logger.warn(
      { error, userId, clientId: clientId ?? undefined, searchTerm },
      'Failed to send GA search event',
    );
  }
}

export async function gaEventPaymentProcessed({
  userId,
  orderId,
  amountInUsdCents,
  paymentCount,
  paymentProviders,
  status,
}: {
  userId: string;
  orderId: string;
  amountInUsdCents: number;
  paymentCount: number;
  paymentProviders: PaymentProvider[];
  status: 'FAILURE' | 'SUCCESS' | 'TIMEOUT';
}) {
  const uniqueProviders = Array.from(new Set(paymentProviders));
  const paymentProvider =
    uniqueProviders.length === 1 ? uniqueProviders[0] : undefined;
  const paymentProvidersParam =
    uniqueProviders.length > 1 ? uniqueProviders.join(',') : undefined;

  try {
    await sendGA4Event({
      userId,
      event: {
        name: 'payment_processed',
        params: {
          user_id: userId,
          order_id: orderId,
          amount_usd_cents: amountInUsdCents,
          payment_count: paymentCount,
          payment_provider: paymentProvider,
          payment_providers: paymentProvidersParam,
          status,
        },
      },
    });
  } catch (error) {
    logger.warn(
      { error, orderId, userId },
      'Failed to send GA payment_processed event',
    );
  }
}
