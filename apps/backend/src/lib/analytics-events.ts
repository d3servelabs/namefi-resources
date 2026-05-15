/** biome-ignore-all lint/style/useNamingConvention: GA4 recommends snake_case for event names and parameter keys */

/**
 * Backend analytics event registry.
 *
 * Add backend-specific events by extending this interface.
 * Example:
 * interface BackendAnalyticsEventMap {
 *   order_completed: { order_id: string; amount_usd: number };
 * }
 *
 * GA4 recommends snake_case for event names and parameter keys
 */
export interface BackendAnalyticsEventMap {
  user_begin_search: UserBeginSearchParams;

  order_placed: OrderPlacedParams;
  order_processing_started: OrderProcessingStartedParams;
  order_items_processing_started: OrderItemsProcessingStartedParams;
  order_items_processing_finished: OrderItemsProcessingFinishedParams;
  order_processing_finished: OrderProcessingFinishedParams;
  order_item_processing_started: OrderItemProcessingStartedParams;
  order_item_processing_finished: OrderItemProcessingFinishedParams;

  payment_processed: PaymentProcessedParams;
  payment_refunded: PaymentRefundedParams;

  domain_acquisition_started: DomainAcquisitionStartedParams;
  domain_acquisition_finished: DomainAcquisitionFinishedParams;

  dns_records_propagated: DnsRecordsPropagatedParams;
  parking_finished: ParkingReadyParams;

  order_finished_email_sent: CheckoutAnalyticsBaseParams & {
    order_status: string;
  };

  order_finished_email_opened: CheckoutAnalyticsBaseParams & {
    email_distinct_id?: string;
  };
}

export interface BackendAnalyticsCustomDimension {
  parameterName: string;
  displayName: string;
  description: string;
  scope: 'EVENT';
}

export interface BackendAnalyticsCustomMetric {
  parameterName: string;
  displayName: string;
  description: string;
  measurementUnit: 'STANDARD';
  scope: 'EVENT';
}

export const BACKEND_ANALYTICS_CUSTOM_DIMENSIONS = [
  {
    parameterName: 'search_term',
    displayName: 'Search Term',
    description: 'Original search term entered by the user.',
    scope: 'EVENT',
  },
  {
    parameterName: 'parent_domain',
    displayName: 'Parent Domain',
    description: 'Parent domain selected or inferred during search.',
    scope: 'EVENT',
  },
  {
    parameterName: 'user_id',
    displayName: 'User ID',
    description: 'Internal user identifier attached to checkout events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'order_id',
    displayName: 'Order ID',
    description: 'Unique order identifier for checkout events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'normalized_domain_name',
    displayName: 'Normalized Domain Name',
    description: 'Normalized domain associated with the checkout event.',
    scope: 'EVENT',
  },
  {
    parameterName: 'order_item_id',
    displayName: 'Order Item ID',
    description: 'Unique order item identifier associated with the event.',
    scope: 'EVENT',
  },
  {
    parameterName: 'amount_usd_cents',
    displayName: 'Amount USD Cents',
    description: 'Payment amount represented in USD cents.',
    scope: 'EVENT',
  },
  {
    parameterName: 'item_count',
    displayName: 'Item Count',
    description: 'Number of items present in the order.',
    scope: 'EVENT',
  },
  {
    parameterName: 'payment_count',
    displayName: 'Payment Count',
    description: 'Number of payment attempts or payments linked to the event.',
    scope: 'EVENT',
  },
  {
    parameterName: 'order_source',
    displayName: 'Order Source',
    description:
      'Source of order placement such as checkout, instant buy, or NFSC top-up.',
    scope: 'EVENT',
  },
  {
    parameterName: 'payment_provider',
    displayName: 'Payment Provider',
    description: 'Primary payment provider used for the transaction.',
    scope: 'EVENT',
  },
  {
    parameterName: 'payment_providers',
    displayName: 'Payment Providers',
    description: 'Comma-separated payment providers used for the transaction.',
    scope: 'EVENT',
  },
  {
    parameterName: 'status',
    displayName: 'Status',
    description: 'Event status such as SUCCESS, FAILURE, or TIMEOUT.',
    scope: 'EVENT',
  },
  {
    parameterName: 'failure_reason',
    displayName: 'Failure Reason',
    description: 'Failure reason when an operation does not succeed.',
    scope: 'EVENT',
  },
  {
    parameterName: 'refund_type',
    displayName: 'Refund Type',
    description: 'Refund type classification such as FULL or PARTIAL.',
    scope: 'EVENT',
  },
  {
    parameterName: 'refund_needed',
    displayName: 'Refund Needed',
    description: 'Whether a refund is required for the order.',
    scope: 'EVENT',
  },
  {
    parameterName: 'refund_amount_usd_cents',
    displayName: 'Refund Amount USD Cents',
    description: 'Refund amount represented in USD cents.',
    scope: 'EVENT',
  },
  {
    parameterName: 'registrar_key',
    displayName: 'Registrar Key',
    description: 'Registrar key used for domain operations.',
    scope: 'EVENT',
  },
  {
    parameterName: 'operation_type',
    displayName: 'Operation Type',
    description: 'Domain operation type such as REGISTER or IMPORT.',
    scope: 'EVENT',
  },
  {
    parameterName: 'duration_years',
    displayName: 'Duration Years',
    description: 'Domain duration in years for acquisition operations.',
    scope: 'EVENT',
  },
  {
    parameterName: 'chain_id',
    displayName: 'Chain ID',
    description: 'Blockchain chain identifier used for minting operations.',
    scope: 'EVENT',
  },
  {
    parameterName: 'dns_provider',
    displayName: 'DNS Provider',
    description: 'DNS provider selected for domain configuration.',
    scope: 'EVENT',
  },
  {
    parameterName: 'opt_out',
    displayName: 'Parking Opt Out',
    description: 'Whether the user opted out of parking configuration.',
    scope: 'EVENT',
  },
  {
    parameterName: 'order_status',
    displayName: 'Order Status',
    description: 'Order status at the time the order finished email was sent.',
    scope: 'EVENT',
  },
  {
    parameterName: 'item_type',
    displayName: 'Item Type',
    description:
      'Order item operation type such as REGISTER, IMPORT, or RENEW.',
    scope: 'EVENT',
  },
  {
    parameterName: 'domain_name',
    displayName: 'Domain Name',
    description: 'Normalized domain name associated with an order item event.',
    scope: 'EVENT',
  },
  {
    parameterName: 'item_status',
    displayName: 'Item Status',
    description: 'Order item processing status such as SUCCEEDED or FAILED.',
    scope: 'EVENT',
  },
  {
    parameterName: 'email_distinct_id',
    displayName: 'Email Distinct ID',
    description: 'Distinct identifier used for tracking order email opens.',
    scope: 'EVENT',
  },
] as const satisfies readonly BackendAnalyticsCustomDimension[];

export const BACKEND_ANALYTICS_CUSTOM_METRICS = [
  {
    parameterName: 'items_count',
    displayName: 'Items Count',
    description: 'Total number of order items processed in the workflow.',
    measurementUnit: 'STANDARD',
    scope: 'EVENT',
  },
  {
    parameterName: 'success_items_count',
    displayName: 'Success Items Count',
    description:
      'Number of order items that finished successfully in the workflow.',
    measurementUnit: 'STANDARD',
    scope: 'EVENT',
  },
  {
    parameterName: 'failed_items_count',
    displayName: 'Failed Items Count',
    description: 'Number of order items that failed in the workflow.',
    measurementUnit: 'STANDARD',
    scope: 'EVENT',
  },
] as const satisfies readonly BackendAnalyticsCustomMetric[];

type CheckoutAnalyticsBaseParams = {
  user_id?: string;
  order_id?: string;
  normalized_domain_name?: string;
  order_item_id?: string;
};

type OrderPlacedParams = CheckoutAnalyticsBaseParams & {
  order_id: string;
  amount_usd_cents: number;
  item_count: number;
  payment_count: number;
  order_source?: 'checkout' | 'instant_buy' | 'nfsc_topup';
};

type OrderProcessingStartedParams = CheckoutAnalyticsBaseParams;

type OrderItemsProcessingStartedParams = CheckoutAnalyticsBaseParams & {
  items_count: number;
};

type OrderItemsProcessingFinishedParams = CheckoutAnalyticsBaseParams & {
  items_count: number;
  success_items_count: number;
  failed_items_count: number;
};

type OrderProcessingFinishedParams = CheckoutAnalyticsBaseParams & {
  order_status: string;
  refund_needed: boolean;
  refund_type: 'NONE' | 'FULL' | 'PARTIAL';
};

type OrderItemProcessingStartedParams = CheckoutAnalyticsBaseParams & {
  order_item_id: string;
  item_type: 'REGISTER' | 'IMPORT' | 'RENEW';
  domain_name: string;
};

type OrderItemProcessingFinishedParams = OrderItemProcessingStartedParams & {
  item_status: 'SUCCEEDED' | 'FAILED';
};

type PaymentProcessedParams = CheckoutAnalyticsBaseParams & {
  amount_usd_cents?: number;
  payment_provider?: string;
  payment_providers?: string;
  status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
  failure_reason?: string;
  payment_count: number;
};

type PaymentRefundedParams = CheckoutAnalyticsBaseParams & {
  amount_usd_cents?: number;
  payment_provider?: string;
  payment_providers?: string;
  payment_count: number;
  refund_type: 'FULL' | 'PARTIAL';
  refund_amount_usd_cents?: number;
};

type DomainAcquisitionStartedParams = CheckoutAnalyticsBaseParams & {
  normalized_domain_name: string;
  registrar_key?: string;
  operation_type: 'REGISTER' | 'IMPORT';
  duration_years?: number;
  chain_id?: number;
};

type DomainAcquisitionFinishedParams = CheckoutAnalyticsBaseParams & {
  normalized_domain_name: string;
  status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
  failure_reason?: string;
  registrar_key?: string;
  operation_type: 'REGISTER' | 'IMPORT';
  duration_years?: number;
  chain_id?: number;
};

type ParkingReadyParams = CheckoutAnalyticsBaseParams & {
  normalized_domain_name: string;
  registrar_key?: string;
  /** Whether the user opted out of parking */
  opt_out: boolean;
  status: 'SUCCESS' | 'TIMEOUT';
};

type DnsRecordsPropagatedParams = CheckoutAnalyticsBaseParams & {
  normalized_domain_name: string;
  dns_provider?: 'NAMEFI' | 'OTHER';
};

type UserBeginSearchParams = {
  search_term: string;
  parent_domain?: string;
};

export type BackendAnalyticsEventName =
  keyof BackendAnalyticsEventMap extends never
    ? string
    : keyof BackendAnalyticsEventMap;

type FallbackParams = Record<string, unknown>;

export type BackendAnalyticsEventParams<
  EventName extends BackendAnalyticsEventName = BackendAnalyticsEventName,
> = keyof BackendAnalyticsEventMap extends never
  ? FallbackParams | undefined
  : EventName extends keyof BackendAnalyticsEventMap
    ? BackendAnalyticsEventMap[EventName]
    : FallbackParams | undefined;

export type BackendAnalyticsEvent<
  EventName extends BackendAnalyticsEventName = BackendAnalyticsEventName,
> = {
  name: EventName;
  params?: BackendAnalyticsEventParams<EventName>;
};
