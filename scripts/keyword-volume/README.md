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
| `dataforseo` | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | Google Ads search volume, resold |

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
measure the whole slate in both languages. DataForSEO's minimum account funding
is $50, which is the real cost; at that rate it covers the entire slate a few
hundred times over.

## Adding a provider

Implement `VolumeProvider` in `provider.ts` and add it to the list in `index.ts`.
The interface exists so the source can be swapped without touching callers, which
is what the pipeline's keyword data stack asks for. A Google Ads API provider is
the obvious next one: it is the same upstream, free, and needs an approved
developer token plus OAuth2, which DataForSEO does not.
