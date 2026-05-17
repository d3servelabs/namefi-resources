# Backend Analytics Events

Backend analytics events are sent via the GA4 Measurement Protocol from the API
using a typed event registry.

## Where events live
- Event registry: `apps/backend/src/lib/analytics-events.ts`
- Sender: `apps/backend/src/lib/ga4-measurement.ts`

## Configuration
- `GA_MEASUREMENT_ID` must be set in backend config (per-environment config file).
- `GA_MEASUREMENT_API_SECRET` must be provided in backend secrets.

## Add a new event
1. Add the event name + params to `BackendAnalyticsEventMap`.
2. Emit it with `sendGA4Event` (or `sendGA4Events`).

```ts
// apps/backend/src/lib/analytics-events.ts
export interface BackendAnalyticsEventMap {
  order_completed: { order_id: string; amount_usd: number };
}
```

```ts
// usage (any backend module)
import { sendGA4Event } from '#lib/ga4-measurement';

await sendGA4Event({
  event: {
    name: 'order_completed',
    params: { order_id: orderId, amount_usd: amountUsd },
  },
  clientId, // required for consented web checkout/search events
  // userId may be included only when measurement consent allows it
});
```

Notes:
- `clientId` from a consented browser GA session is required for web checkout/search events.
- Web checkout/search tracking must also pass backend consent checks. The backend merges the c15t request cookie, the frontend `X-C15T-Measurement-Consent` signal (`granted` or `denied`), and c15t geo auto-grant behavior; a GA client id by itself is not sufficient.
- ORPC/API/MPP/X402 checkout events should set `event_source: api` so GA Data API reports can include or filter them intentionally.
- Transactional email open pixels should set `event_source: email`; this keeps open counts in GA without pretending the email client has browser/API checkout identity. Processed-order emails currently generate the legacy `order_ready_count_only` pixel, so the GA event has an email-open distinct id but no order/user metadata. The `order_ready` payload path can carry signed order/user metadata, but it is not the default processed-order email pixel. Email-only opens should not set top-level GA `user_id` or browser session params unless a browser/API tracking identity is explicitly present.
- The Measurement Protocol sender still has a legacy fallback `client_id` when no `clientId` is provided. Do not treat that as a real user/session id, and do not use it for no-consent web traffic.
- Frontend GA recommended ecommerce events such as `add_to_cart`, `begin_checkout`, and `purchase` are browser-side interaction events. The admin checkout flow dashboard intentionally reads the backend checkout event sequence (`user_begin_search`, `order_placed`, `payment_processed`, etc.) instead.
- See [Analytics Consent Model](./analytics-consent-model.md) for consent-state behavior.
- `params` values that are `undefined` are stripped before sending.
- Use `debug: true` on `sendGA4Event`/`sendGA4Events` to hit the GA4 debug endpoint.
