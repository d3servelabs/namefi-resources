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

## What the first real run showed (2026-09-02)

Measured, not inferred. Four findings, each one a trap for the next person.

**One task per request.** The endpoint takes a JSON array and looks like a batch
API. It is not: it processes the first task and returns `40000 You can set only
one task at a time` for the rest, at HTTP 200. Billing is per task, so splitting
is free. Before the account was verified the same body failed with HTTP 403 /
`40104` instead, which named account state, not batching — two different problems
that produce the same symptom, and the 403 masked the other one.

**One bad keyword kills the whole task.** Google Ads caps a keyword at 10 words
and 80 characters, and DataForSEO fails the entire task if any single keyword
breaks it. Three 11-word questions zeroed out a 400-keyword task. Over-limit
queries are now held back and reported as unmeasurable rather than submitted.

**Our own target queries were the wrong shape.** Of 400 English queries written
for the September slate, hit rate by length: 3 words 41%, 4 words 10%, 5 words
7%, **6+ words 0%**. 168 of them were 6 words or longer — article titles and
noun piles (`ICANN registration data policy autonomous registrant`), not things
a person types. A null against a query like that measures the query's authoring,
not the demand, so **do not rank a backlog on hand-written long-tail queries**.
Harvest real ones with `keywords_for_keywords` instead: one task, 20 short seeds,
$0.09, returned 8,920 real queries at a 3-word median.

**Short seeds import demand that is not ours.** Harvested on the seeds above,
4,203 of 8,520 queries — 4.37M searches/month, more than half the total — belong
to other industries that share our acronyms: `did` is dissociative identity
disorder (201,000/mo), `registry` is baby and wedding registries (90,500/mo),
`mcp` and `seo` likewise. Filter to industry anchors before attributing anything.

### The Baidu gap, now with a number

Same harvest run against the Chinese market: **40,390 searches/month** across
1,183 Chinese queries, against **1,806,160/month** for English — Google's view of
Chinese demand is roughly **2% the size** of its English one, and `域名注册`
shows 1,600/mo where `domain name registration` shows 33,100 in the US. That is
the Baidu gap measured rather than asserted. **A zh-CN volume from this stack
must never be ranked against an en volume**: they are not the same quantity.

### What this data cannot do yet

It cannot re-rank the slate. Attributing harvested queries to candidates by
shared glossary term gives term-level demand wearing an article-level label: the
one candidate whose term is `dns` absorbs all 1,161 generic DNS queries, and six
unrelated ICANN articles tie at exactly the same number. Sound attribution needs
one seed per candidate — 100 seeds, 5 tasks, $0.45.

## Adding a provider

Implement `VolumeProvider` in `provider.ts` and add it to the list in `index.ts`.
The interface exists so the source can be swapped without touching callers, which
is what the pipeline's keyword data stack asks for. A Google Ads API provider is
the obvious next one: it is the same upstream, free, and needs an approved
developer token plus OAuth2, which DataForSEO does not.
