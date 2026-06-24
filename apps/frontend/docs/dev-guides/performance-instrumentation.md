# Performance instrumentation (RUM)

Lightweight, real-user timing for the interactions that gate perceived speed —
**app-shell hydration**, **sidebar activation**, and **sign-in**. Each milestone
is recorded as a `PerformanceMeasure` (so it shows up in the DevTools Performance
timeline) and routed to two outputs:

- **Console** — when the `?perf=1` teammate flag is on. Anyone with the link can
  profile a real session, in any environment including production.
- **Datadog** — for a sampled percentage of all sessions, so we can watch
  real-traffic percentiles and prove before/after on optimizations.

Source: [`src/lib/perf/marks.ts`](../../src/lib/perf/marks.ts),
[`src/lib/perf/flag.ts`](../../src/lib/perf/flag.ts),
[`src/hooks/use-perf-flag.ts`](../../src/hooks/use-perf-flag.ts).

## Metrics catalog

| Metric | Measured from → to | What it tells you |
|---|---|---|
| `app.hydrate` | navigation start → app-shell provider's first commit | when the shell became interactive (TTI proxy) |
| `sidebar.hydrated_mounted` | navigation start → the `ssr:false` sidebar chunk mounts | chunk-fetch latency after hydration |
| `sidebar.activate` | navigation start → auth resolves and the real sidebar items render | the full "sidebar is ready" lag |
| `signin.click_to_modal` | Sign-In click → Privy login modal shown | the headline sign-in number |
| `signin.click_to_authed` | Sign-In click → authentication settled | the full sign-in funnel |

`app.hydrate` / `sidebar.*` are measured relative to navigation start.
`signin.*` are measured from the login request: the span is anchored in
`requestLogin` (the single funnel every entry point goes through — sidebar
button, error page, hunt vote, post-auth intent) and resolved by the auth
runtime, so it's always timed from the current attempt, never a stale one.

## Enable it for a teammate (`?perf=1`)

Append `?perf=1` to any URL:

```
https://namefi.io/?perf=1
```

- Sets a localStorage flag, so it **survives navigation** (the param strips
  itself from the URL after it's read).
- Every milestone prints to the console:
  `[perf] signin.click_to_modal 842ms (@1203ms)` — duration, then the absolute
  time since navigation start.
- A force-flagged session **also ships to Datadog** regardless of the sample
  rate, so a teammate's run shows up in dashboards too.
- Turn it off with `?perf=0`.

You can also inspect the spans in **DevTools → Performance → User Timing** (record,
reload/interact, stop) — each metric appears as a labeled measure.

## Production sampling (`PERF_SAMPLE_RATE`)

A configurable percentage of sessions ship their measures to Datadog with no
console noise. The decision is rolled **once per browser tab** and cached in
sessionStorage, so a sampled session reports every milestone consistently.

| Environment | `PERF_SAMPLE_RATE` |
|---|---|
| production | `10` |
| development / preview | `100` |
| local | `100` (Datadog forwarding is off locally, so this just exercises the path) |
| test | `0` |

Defined in [`src/lib/env/schema.ts`](../../src/lib/env/schema.ts) (default `10`)
and per-environment in `src/lib/env/configs/*.ts`. Set to `0` to disable
automatic sampling without removing the instrumentation.

## Reading the data in Datadog

Measures are sent through the existing idle-loaded
[`@datadog/browser-logs`](../../src/lib/datadog/logs.ts) client (no extra SDK
weight) as info logs with `message:perf.measure`:

```jsonc
{
  "message": "perf.measure",
  "metric": "signin.click_to_modal",
  "duration_ms": 842,
  "at_ms": 1203
  // appVersion / deployCommitSha are attached as Datadog global context
}
```

To build dashboards/monitors:

1. **One-time setup:** in Datadog → Logs, promote `@metric` (string) and
   `@duration_ms` (number) to **facets** so they're queryable.
2. Query `service:namefi-astra-frontend @message:perf.measure`.
3. Group by `@metric`, graph `p75` / `p95` of `@duration_ms`. Split by
   `@version` to compare deploys (before/after an optimization).

## Adding a new measure

```ts
import { startPerfSpan, recordPerfSince, recordPerfNow } from '@/lib/perf/marks';

// Page-load milestone (relative to navigation start), e.g. in a mount effect:
recordPerfNow('search.first_results');

// Interaction span: anchor at the trigger, resolve at one or more milestones.
// One start can anchor several ends (e.g. click → modal, click → done).
startPerfSpan('checkout');                              // on click
recordPerfSince('checkout', 'checkout.click_to_paid');  // when settled
```

Guidelines:

- Use a stable, dotted `area.milestone` name — it becomes the `@metric` facet.
- Calls are no-ops on the server and wrapped in try/catch; they never throw into
  a user flow, and the gating reads are cheap, so calling from hot paths is safe.
- Pass small, **non-PII** extra fields only (e.g. `{ authenticated: true }`).
  Everything in the extra object is sent to Datadog verbatim.

## Privacy & cost

- Only first-party timing numbers are sent (durations + the metric name), through
  our own backend proxy — no third-party tracker and no personal data.
- This path is independent of cookie/measurement consent because it is
  first-party observability, the same classification as the existing Datadog
  error logging.
- Cost scales with `PERF_SAMPLE_RATE` × the number of milestones per session.
  Lower the rate (or set it to `0`) if log volume becomes a concern.
