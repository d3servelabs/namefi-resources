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
  clientId, // required if userId is not provided
  // userId,
});
```

Notes:
- Either `clientId` or `userId` is required.
- `params` values that are `undefined` are stripped before sending.
- Use `debug: true` on `sendGA4Event`/`sendGA4Events` to hit the GA4 debug endpoint.
