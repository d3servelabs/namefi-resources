# Namefi.io Mobile vs. Desktop Traffic

- **Report date:** 2026-06-17
- **Data range:** 2026-05-20 → 2026-06-16 (last 28 full days, `28daysAgo`–`yesterday`)
- **Source:** Google Analytics 4 (GA4) Data API, `deviceCategory` dimension
- **Primary property:** `Namefi Astra Production` (GA4 property `486742770`) — the live Namefi.io app

## Summary

**About 36% of Namefi.io visitors come from mobile** (by users), or ~32% by
sessions. Desktop is roughly 2× mobile. Tablet is negligible.

## Namefi Astra Production (property 486742770)

| Device      | Users | % of users | Sessions | % of sessions | Pageviews |
|-------------|------:|-----------:|---------:|--------------:|----------:|
| Desktop     |   246 |      63.1% |      415 |         68.0% |       960 |
| **Mobile**  | **142** | **36.4%** |  **193** |     **31.6%** |       405 |
| Tablet      |     2 |       0.5% |        2 |          0.4% |         2 |
| **Total**   | **390** |          |  **610** |               |     1,367 |

Notes:
- Mobile users engage more lightly: ~2.1 pageviews/session on mobile vs. ~2.3
  on desktop, and fewer sessions per user.
- Desktop drives the majority of both sessions and pageviews.

## Other Namefi properties (same window, for context)

| Property | GA4 ID | Users | Mobile share (users) | Note |
|----------|--------|------:|---------------------:|------|
| `[New] Namefi-Home & Namefi-App` | 414463772 | 36 | 55.6% | Low volume; likely a marketing/landing measurement. Skews mobile but not statistically meaningful. |
| `[Legacy] NamefiApp` | 425289502 | 0 | — | Deprecated; no traffic. |

If "Namefi.io" is taken to mean the marketing home page rather than the app,
that small slice runs majority-mobile — but on far lower volume.

## Methodology

GA4 Data API `runReport` over the property, last 28 full days:

- `dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }]`
- `dimensions: [{ name: 'deviceCategory' }]`
- `metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }]`

Authenticated via a dedicated read-only service account
(`google-analytics-readonly@d3serve-labs.iam.gserviceaccount.com`) granted
Viewer access to the GA account. The `analyticsdata` and `analyticsadmin`
Google APIs are enabled on the `d3serve-labs` GCP project.

## Reproducing this report

1. Ensure the read-only SA key is available and pointed to by
   `GA4_KEY_FILE_PATH` (the SA needs Viewer on the GA property).
2. Run a `runReport` with the parameters above against property `486742770`,
   or use the GA UI: Reports → Tech → Users by Device category, scoped to the
   last 28 days.

> Numbers are GA4-reported and subject to consent/measurement gating and
> GA's data thresholding on low-volume segments.
