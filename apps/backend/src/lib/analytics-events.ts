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
