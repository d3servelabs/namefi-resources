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
  order_source?: 'checkout' | 'instant_buy';
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
