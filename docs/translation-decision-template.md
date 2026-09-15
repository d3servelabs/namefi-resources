# Translation decision record

Copy this record into the editorial task or PR for one article × locale × region.
It implements [Translation selection](../.claude/rules/content.md#translation-selection);
English publication needs no record. This is a blank template, not measured evidence.

## Record

- Source: `content/<collection>/en/<slug>.md` or `.mdx`; commit: `UNKNOWN`;
  source URL (when published): `UNKNOWN`.
- Target: content locale/variant: `UNKNOWN`; country/region: `UNKNOWN`;
  intended reader and search intent: `UNKNOWN`.
- Decision: `DEFER`; owner: `UNKNOWN`; decision date (UTC): `UNKNOWN`;
  rationale and evidence references: `UNKNOWN`.

### Google Ads Keyword Planner — primary demand evidence

Use `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics` for the target
queries. Save a redacted request/response artifact and link its exact rows.
Method reference: [Google Ads historical metrics](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics).

- Evidence artifact: `UNKNOWN`; API version: `UNKNOWN`; fetched at (ISO-8601 UTC): `UNKNOWN`.
- Request language name/constant: `UNKNOWN`; geographic names/constants: `UNKNOWN`;
  `keyword_plan_network`: `UNKNOWN`. Record these explicitly; a content locale
  does not define a country, and one country's demand does not represent a language.
- Requested period (year-month range or API default): `UNKNOWN`;
  actual returned months: `UNKNOWN`. Retain the provider's month labels.

Repeat a row for each actual target-market query submitted. Preserve the returned
keyword and close-variant group; do not double-count groups in a total.

| Target query / submitted keyword | Returned text + close variants | Avg. monthly searches (approx. searches/month) | Monthly volumes (year-month: approx. searches) | Exact evidence row + missing-data reason |
|---|---|---|---|---|
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN — not yet fetched |

Keep unsubmitted queries, request failures, absent rows, and missing metrics
distinct. Use `UNKNOWN` with a reason, never zero-fill. A reported zero remains
a sourced estimate with limits, not proof of no demand. Advertising competition
and bids are not SEO difficulty or a requirement to run an ad campaign.

### Supporting evidence

- **Search Console:** exact report/export link: `UNKNOWN`; fetched at (UTC):
  `UNKNOWN`; property: `UNKNOWN`; inclusive start/end dates (**PT**): `UNKNOWN`;
  query/page/country/device filters and search type: `UNKNOWN`.
  Query rows, impressions (count), clicks (count), average position (rank), and
  limitations: `UNKNOWN`. Country is not a language filter. Sparse or absent
  rows do not veto a market; [GSC returns a limited set of rows](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).
- **SERP:** exact target queries: `UNKNOWN`; search engine, language, region,
  device, and checked-at UTC timestamp: `UNKNOWN`; captured results/evidence:
  `UNKNOWN`. List observed competing URLs, dominant intent/formats, and the
  specific gap this article could answer: `UNKNOWN`. Explain why a translated
  answer can compete; a search-result count is not an opportunity score.
- **Cost:** translation: `UNKNOWN`; native review/LQA: `UNKNOWN`; ongoing update
  burden and review interval: `UNKNOWN`. Cite a quote, measured prior run, or
  sourced calculation for every number. Specify money as currency + integer
  minor units and time as minutes/hours; no invented budget or cost threshold.

### Decision and follow-up

Choose `TRANSLATE`, `DEFER`, or `DO_NOT_PRIORITIZE` for this candidate. Explain
how relevant demand, SERP opportunity, and the cost evidence support it. With
insufficient demand evidence, use `DEFER` and name the missing evidence; do not
infer that the market has no demand. No universal volume cutoff applies.

- Selected scope and rationale: `UNKNOWN`.
- Uncertainty / next evidence needed: `UNKNOWN`.
- Revisit trigger or date (UTC): `UNKNOWN`; owner: `UNKNOWN`.
- After publication: exact translated URL and source revision: `UNKNOWN`;
  monitor query coverage, impressions, and organic visibility. Purchase
  conversions are not the current selection gate.

**Access:** the policy and blank template are repository documentation. Keep raw
Ads/GSC exports, account identifiers, and cost records in a reviewer-accessible
private location; include only an appropriate redacted summary in a public PR.
Local credentials use [GuestSafe](~/.agents/skills/guestsafe/SKILL.md), injected
only into the target process. Never include tokens or credential values here.
