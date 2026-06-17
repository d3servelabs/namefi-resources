# Namefi.io Traffic — Period-over-Period Comparison

- **Report date:** 2026-06-17
- **Current period:** 2026-05-18 → 2026-06-14 (28 days, ending 3 days ago)
- **Prior period:** 2026-04-20 → 2026-05-17 (preceding 28 days)
- **Source:** Google Analytics 4 (GA4) Data API
- **Property:** `Namefi Astra Production` (GA4 `486742770`) — the live Namefi.io app
- **Primary metric:** **sessions** (see data-quality note below)

## Data-quality caveat (read first)

The prior period reports **1,614 users but only 1,030 sessions**, and desktop
alone shows **1,333 users / 691 sessions**. Users exceeding sessions is a
strong signal of a **bot / spam or attribution spike** in late April–early May,
concentrated on desktop. Consequently the raw "users −67%" headline is mostly
that inflated spike washing out, **not** a real audience collapse. Sessions are
the trustworthy metric here and lead this report; user counts for the prior
window should be treated as unreliable.

## Overall

| Metric | Prior | Current | Δ | % |
|--------|------:|--------:|----:|----:|
| Sessions | 1,030 | 716 | −314 | **−30.5%** |
| Pageviews | 1,785 | 1,444 | −341 | −19.1% |
| Users | 1,614 | 531 | −1,083 | −67.1% *(distorted — see caveat)* |

Real traffic is down ~30% by sessions, ~19% by pageviews.

## Device breakdown (sessions)

| Device | Prior | Current | Δ | % |
|--------|------:|--------:|----:|----:|
| Desktop | 691 | 437 | −254 | −36.8% |
| Mobile | 338 | 277 | −61 | −18.0% |
| Tablet | 1 | 2 | +1 | — |

Desktop fell harder than mobile, so **mobile's share of sessions rose from
32.8% to 38.7%**.

## Page paths — biggest movers (sessions)

**Growing**

| Path | Prior | Current | Δ | Note |
|------|------:|--------:|----:|------|
| `/registration-agreement` | 24 | 78 | +54 (+225%) | |
| `(not set)` | 0 | 39 | +39 | GA attribution gap |
| `/outbound` | 0 | 26 | +26 | new outbound-link route |
| `/payment-methods` | 28 | 53 | +25 (+89%) | |
| `/domains/0x612.click` | 0 | 18 | +18 | individual domain page (new) |
| `/studio` | 0 | 8 | +8 | new |

**Declining**

| Path | Prior | Current | Δ | Note |
|------|------:|--------:|----:|------|
| `/` (home) | 754 | 396 | −358 (−47.5%) | larger than the entire net decline |
| `/my-domains` | 36 | 15 | −21 (−58%) | |
| `/ai-brand-generator` | 22 | 1 | −21 (−95%) | route removed/renamed? |
| `/mls/feed` | 18 | 0 | −18 (−100%) | route removed/renamed? |
| `/feed` | 119 | 103 | −16 (−13%) | |
| `/cart` | 36 | 23 | −13 (−36%) | |

The decline is **overwhelmingly the homepage** (−358 sessions, bigger than the
total net drop) — consistent with the prior-period bot spike hammering `/`.
Meanwhile checkout-funnel pages (`/registration-agreement`, `/payment-methods`)
and individual `/domains/*` pages grew, a healthier mix. Distinct paths:
144 now vs. 154 prior.

## Screen size (sessions)

| Resolution | Prior | Current | Δ | Likely device |
|------------|------:|--------:|----:|---------------|
| 1920×1080 | 216 | 159 | −57 (−26%) | Desktop FHD |
| 1728×1117 | 39 | 106 | +67 (+172%) | MacBook Pro 14" |
| 480×720 | 53 | 86 | +33 (+62%) | Small / zoomed mobile |
| 2560×1440 | 39 | 42 | +3 | Desktop QHD |
| 414×896 | 2 | 30 | +28 (+1400%) | iPhone XR/11 |
| 800×600 | 81 | 26 | −55 (−68%) | Bot / legacy default |
| 1366×768 | 84 | 21 | −63 (−75%) | Budget laptop |
| 1440×900 | 56 | 21 | −35 (−63%) | MacBook Air |
| 1920×10000 | 57 | 15 | −42 (−74%) | **Bot artifact** (10000px tall) |

The declining buckets (`800×600`, `1366×768`, `1920×10000`) are classic
bot/headless fingerprints — their fall reinforces that the prior period was
inflated by non-human desktop traffic. Genuine human resolutions — MacBook Pro
(1728×1117) and real iPhones (414×896, 390×844) — grew.

## Referrer / acquisition

### By channel (sessions)

| Channel | Prior | Current | Δ | % |
|---------|------:|--------:|----:|----:|
| Direct | 517 | 308 | −209 | −40.4% |
| Referral | 185 | 190 | +5 | **+2.7%** |
| Organic Social | 216 | 129 | −87 | −40.3% |
| Organic Search | 99 | 50 | −49 | −49.5% |
| Unassigned | 14 | 33 | +19 | +135.7% |
| AI Assistant | 0 | 3 | +3 | new |

The session decline is concentrated in **Direct, Organic Social, and Organic
Search** (each ~−40–50%). **Referral held flat** — the loss is in the channels
that bots and broad reach inflate (bots usually land as Direct).

### Top sources (source / medium, sessions)

| Source / Medium | Prior | Current | Δ |
|-----------------|------:|--------:|----:|
| (direct) / (none) | 517 | 308 | −209 |
| t.co / referral (X/Twitter) | 172 | 98 | −74 (−43%) |
| google / organic | 80 | 45 | −35 (−44%) |
| x / social | 0 | 21 | +21 (new tag) |
| chatgpt.com | 1 | 15 | +14 (+1400%) |
| d3serve.xyz / referral | 0 | 13 | +13 (new) |
| m.facebook + facebook.com | 41 | 9 | −32 (−78%) |
| r.namefi.dev / referral | 15 | 14 | ≈flat |
| xmlgpt.com / referral | 0 | 8 | +8 (new) |

### By platform (grouping aliases)

- **X / Twitter** (`t.co` + `x/social` + `x.com`): 176 → 123, **−30%**. Still
  the #1 external driver, but cooling.
- **Facebook** (`m.facebook` + `facebook.com`): 41 → 9, **−78%** — nearly gone.
- **AI assistants** (`chatgpt.com` both mediums + `xmlgpt.com`): ~2 → ~26 —
  an emerging channel from near-zero, worth optimizing for.
- **Google organic**: 80 → 45, **−44%** — a real SEO dip worth investigating.

### Referrer notes / data hygiene

- `pageReferrer` is mostly **internal** (top entries are `namefi.io/*`
  self-referrals from in-app navigation, plus blank for direct/app), so it is
  not a clean external-source view; source/medium above is the right lens.
- **Dev traffic leaking into prod:** `http://localhost:5050/domains…` appears
  as a referrer (~33 sessions across two paths) — a local frontend pointed at
  the prod GA property. Minor, but it inflates Referral slightly; consider
  filtering `localhost` out of the prod data stream.

## Bottom line

Stripping the prior-period desktop bot spike, the real story is: traffic down
~30% by sessions, **led almost entirely by the homepage**, while **mobile share
rose** and **deeper-funnel + domain-detail pages grew**. External referral was
steady; the decline is Direct + social reach + organic search. Bright spot:
**AI-assistant referrals appearing for the first time**. Watch-items: **Google
organic (−44%)** and the **Facebook collapse (−78%)**.

## Methodology

GA4 Data API `runReport`, one request per dimension per period:

- `dateRanges`: the two windows above (explicit start/end dates)
- `dimensions`: `deviceCategory`, `pagePath`, `screenResolution`,
  `sessionDefaultChannelGroup`, `sessionSourceMedium`, `pageReferrer`
- `metrics`: `totalUsers`, `sessions`, `screenPageViews`

Authenticated via the read-only service account
(`google-analytics-readonly@d3serve-labs.iam.gserviceaccount.com`, GA Viewer).
Numbers are GA4-reported and subject to consent/measurement gating and GA's
data thresholding on low-volume segments.
