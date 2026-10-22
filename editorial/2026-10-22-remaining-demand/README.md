# The completed batch leaves six clear priority article gaps

This inventory reconciliation uses Resources commit `91dbd445c19d1c90358068f947ec64b25bf19b06`.
The source is the US-English Google Ads plan from October 21, 2026.
The plan used US location 2840, English language 1000, and Google Search.
The monthly estimates cover October 2025 through September 2026.
This audit makes no new keyword, GSC, or Analytics requests.

## The approved 48-topic batch has no remaining packages

All 48 topic packages shipped through PRs335–382.
G01/G02 share one English page, leaving 47 distinct English pages.
The batch created seven English pages and updated 40 English pages.
The batch does not imply another fixed batch of 48 topics.
The 167 published language pages include existing translations.
The 167-page total does not measure newly written translations.

## Two denominators produce different remaining work

| Scope | Selected intent clusters | Clear new articles remaining | Existing pages to recheck | Other work |
| --- | ---: | ---: | ---: | --- |
| All eligible intents | 37 | 6 | 8 | Eight product intents and one unresolved certificate intent |
| Articles and references only | 36 | 8 | 10 | One unresolved certificate intent |

The original all-intent selection contained seven new-article candidates.
The completed registrar guide removes one candidate.
The six remaining candidates address DNS cache clearing, inexpensive registration,
NXDOMAIN diagnosis, certificate types, DMARC deployment, and certificate installation.
The article-only selection also adds free certificates and dynamic DNS.
The six candidates therefore become eight candidates in the article-only scope.

The existing-page counts identify pages outside the completed 48-topic assignments.
The counts request a scope and quality recheck, rather than mandatory rewrites.
The pages already exist and may already answer the intended questions.
The article-only scope adds domain valuation and DNS propagation to that recheck.
The unresolved certificate-purchase intent may require separate pages or product work.
The unresolved intent has no fixed article count.

The eight product intents cover registration, ownership lookup, availability,
DNS lookup, SPF checking, MX checking, DNS leak testing, and certificate checking.
A functional and indexing audit must establish actual product gaps.
An informational article cannot establish fulfillment of a tool or purchase intent.

## The model does not establish 90 percent of actual impressions

The finite discovery library contains 21,172 eligible groups and 178 intent clusters.
The 37-cluster union represents 92.93% of the reported demand index.
The same union represents 91.35% of the repeated-vector sensitivity index.
Google estimates and repeated variants prevent treating either index as unique searches.
The discovery process does not prove exhaustive market coverage.
Publishing matching pages does not prove indexing, rankings, or impression share.
GSC observes this site's impressions and cannot measure unseen market impressions.
Analytics observes visits and behavior rather than total market search demand.

The all-intent and article-only percentages use different denominators.
Neither percentage can serve as a promised future traffic result.
The six or eight article counts identify candidates within the existing model.
Further certificate intent validation may change those counts.

## Translation demand still requires a separate market denominator

The US-English scope requires no translations to satisfy its language scope.
A separate multi-market target requires locale-specific keyword discovery and deduplication.
The completed batch measured selected topic-language-country combinations.
Those measurements do not establish a complete translation backlog.
The remaining demand-qualified translation count is unknown, rather than zero.
Unsupported languages also require runtime support before publication.

## The checked-in inputs reproduce the inventory counts

`us-en-clusters.json` preserves the original 178-cluster model.
`remaining.json` records the counts and exact remaining page paths.
The final batch metrics supply the deduplicated English paths.
Reproduce the reconciliation from the repository root:

```sh
python3 scripts/content-batch/coverage.py --clusters editorial/2026-10-22-remaining-demand/us-en-clusters.json
```

The script preserves the original intent decisions.
The script does not introduce new topics or start article creation.
