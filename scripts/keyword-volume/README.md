# keyword-volume

Measured search volume for editorial target queries, per locale.

The editorial backlog's v0 rank key is
`expected_clicks = Σ volume × CTR(expected position)`. **`volume` is the one term
nothing in this workspace can currently supply.** The September 2026 topic slate
ranked on Wikipedia pageviews and Hacker News story counts instead — those are
*positive-only* momentum signals, and the pipeline page classifies them as
"momentum leads only" for exactly that reason: a high number is weak evidence
that people look a concept up, a low or missing number carries no information at
all. This tool replaces them for the volume term.

## Credentials

Nothing here has any. Put them in **`~/ws/d3servelabs/namefi-resources/.env.local`**
— the repo-container root, *not* a worktree — so a `grep` from inside a worktree
cannot find them. They are read from the environment and never logged.

```
bun keywords:volume --providers     # what is configured, what is missing
```

| provider | env vars | what it answers |
| --- | --- | --- |
| `google-ads` | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | **primary** — KeywordPlanIdeaService, free |
| `dataforseo` | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | stopgap — the same data, resold |

A **Test-level** Google Ads developer token cannot return real volume: test
accounts hold no real data. **Basic access is the prerequisite.**

## Calling it from code

`api.ts` is the library entry point; the CLI is one caller of it.

```ts
import { searchVolume, toSpecs } from './scripts/keyword-volume/api.ts';

const specs = toSpecs([{ id: 'C036', en: ['dns records for ai agents'] }]);
const rows  = await searchVolume(specs);          // or { locale: 'zh-CN' }
```

The DataForSEO **password is the API password** generated in the dashboard's
API Access tab, not the account password.

## Usage

```
bun keywords:volume --dry-run                      # print the request bodies, no credentials needed
bun keywords:volume --in queries.json              # fetch, write keyword-volume.json
bun keywords:volume --in queries.json --locale zh-CN
bun keywords:volume --in queries.json --out vol.json
```

Input is one object per candidate, keyed by locale:

```json
[{ "id": "C036", "en": ["dns records for ai agents"], "zh-CN": ["agent 授权 DNS 记录"] }]
```

`LOW-DEMAND` markers are stripped, and identical `(query, locale)` pairs are
de-duplicated, before anything is billed.

## What it will not do

- **It never writes a number it did not receive.** A failed request, a keyword
  absent from the response, and an unconfigured provider all produce `null` with
  a `note` explaining which. None of them produces a zero.
- **It does not answer for mainland China.** Every provider here reads Google.
  Mainland users are on Baidu, so a `zh-CN` row measures overseas Chinese plus
  HK/TW. Each such row carries that caveat in its `note`, and a low value there
  is *not* evidence of low demand. Baidu Index is a separate, unsolved gap.

## Cost

Verified against `dataforseo.com/pricing/keywords-data/google-ads` on 2026-09-02:
the live endpoint is **$0.09 per task, up to 1,000 keywords per task** (the queue
endpoint is $0.06 but takes 1–3 hours). Tasks are chunked to that cap.

The September 2026 slate — 100 candidates, 671 target queries, 640 unique
`(query, locale)` pairs after de-duplication — fits in **2 tasks: $0.18** to
measure the whole slate in both languages.

**You probably do not need to fund the account at all.** Signup carries **$1 in
trial credits** (observed on the registration page, 2026-09-02), which covers the
entire slate roughly five times over. The $50 figure is the minimum *deposit*, not
a cost of entry.

## This provider is meant to be temporary

For search volume, **the Google Ads API supersedes this one**: it is the same
upstream data, and it is free. The only thing DataForSEO buys is time — Google Ads
needs a manager account, an approved developer token (~5 business days for Basic),
a Google Cloud project and OAuth2 credentials, where DataForSEO needs a signup and
an API password. Use this to unblock the backlog now; drop it once Google Ads is
approved.

**Neither closes the Baidu gap.** Checked on 2026-09-02: DataForSEO supports Baidu
for **SERP results only** — it has no Baidu search-volume endpoint, and its keyword
data sources are Google Ads, Bing Ads and Google Trends. Mainland-China demand
remains unmeasured by anything in this stack, and no `zh-CN` number produced here
should be read as covering it.

## Adding a provider

Implement `VolumeProvider` in `provider.ts` and add it to the list in `index.ts`.
The interface exists so the source can be swapped without touching callers, which
is what the pipeline's keyword data stack asks for. A Google Ads API provider is
the obvious next one: it is the same upstream, free, and needs an approved
developer token plus OAuth2, which DataForSEO does not.
