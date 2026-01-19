/**
 * Backend analytics event registry.
 *
 * Add backend-specific events by extending this interface.
 * Example:
 * interface BackendAnalyticsEventMap {
 *   order_completed: { order_id: string; amount_usd: number };
 * }
 */
// biome-ignore lint/suspicious/noEmptyInterface: Intentional for declaration merging.
export interface BackendAnalyticsEventMap {}

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
