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
  // biome-ignore lint/style/useNamingConvention: GA4 event names use snake_case.
  order_placed: OrderPlacedParams;
  // biome-ignore lint/style/useNamingConvention: GA4 event names use snake_case.
  user_begin_search: UserBeginSearchParams;
  // biome-ignore lint/style/useNamingConvention: GA4 event names use snake_case.
  payment_processed: PaymentProcessedParams;
  // biome-ignore lint/style/useNamingConvention: GA4 event names use snake_case.
  domain_acquisition: DomainAcquisitionParams;
  // biome-ignore lint/style/useNamingConvention: GA4 event names use snake_case.
  dns_records_propagated: DnsRecordsPropagatedParams;
  // biome-ignore lint/style/useNamingConvention: GA4 event names use snake_case.
  parking_ready: ParkingReadyParams;
}

type OrderPlacedRequiredParams = {
  [K in
    | 'order_id'
    | 'amount_usd_cents'
    | 'item_count'
    | 'payment_count']: K extends 'order_id' ? string : number;
};

type OrderPlacedOptionalParams = {
  [K in 'order_source']?: 'checkout' | 'instant_buy';
};

type OrderPlacedParams = OrderPlacedRequiredParams & OrderPlacedOptionalParams;

type UserBeginSearchParams = {
  search_term: string;
  parent_domain?: string;
};

type PaymentProcessedParams = {
  order_id: string;
  amount_usd_cents: number;
  payment_count: number;
  payment_provider?: string;
  payment_providers?: string;
};

type DomainAcquisitionParams = {
  order_id: string;
  order_item_id: string;
  normalized_domain_name: string;
  operation_type: 'REGISTER' | 'IMPORT';
  registrar_key?: string;
  duration_years?: number;
  chain_id?: number;
};

type DnsRecordsPropagatedParams = {
  order_id?: string;
  order_item_id: string;
  normalized_domain_name: string;
  record_count: number;
  action_types?: string;
};

type ParkingReadyParams = {
  normalized_domain_name: string;
  override_existing_records?: boolean;
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
