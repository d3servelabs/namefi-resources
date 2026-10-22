# G38 improves the existing domain forwarding guide

The writer updates `content/blog/en/domain-forwarding-redirects.md` in place.
The source revision is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The writer retains the existing title, slug, reader task, cover, and four useful illustrations.
The update adds fragment inheritance, authentication boundaries, canonical annotations, and a concrete acceptance sheet.
The examples use reserved example domains. The writer changed no live service.

## Primary sources support the added behavior

The writer opened RFC 9110, Google Search Central, Cloudflare, WHATWG, MDN, and the curl manual on 2026-10-21 Pacific time.
RFC 9110 sections 7.1 and 10.2.2 establish fragment exclusion and inheritance.
Section 15.4 supports separate authentication checks during automatic redirection.
The canonical URL guide distinguishes search signals from browser navigation.
The Google migration guide supports direct final targets and consistent canonical annotations.
The curl manual supports `--location`, `--max-redirs`, and header dumping.
The published article cites each source inline and retains fetched dates.

The writer read the full existing guide before editing.
The overlap check covered `cname-vs-a-record`, `domain-vs-hosting`, and `dns-record-types-guide`.
The base has no separate English www/non-www or canonical guide.
Those pages explain DNS or service boundaries. This page retains the distinct URL-forwarding task.

## Market evidence defers two specific translations

The official Ads language table confirms German 1001 and French 1002.
The official 2026-10-06 geographic CSV confirms Germany 2276 and France 2250 as active countries.
The files `47-geo-ids.json`, `47-ads-de-DE.json`, and `47-ads-fr-FR.json` preserve the exact requests and responses.
The requests use Namefi MCC 3505976042, API v26, GOOGLE_SEARCH, and separate language and country targets.
The API fetched both requests at 2026-10-22 02:20 UTC, which is 2026-10-21 Pacific time.
The monthly series spans October 2025 through September 2026.
These figures estimate searches. The figures do not predict visits or SEO difficulty.

| Locale and region | Returned keyword | Average monthly searches | Decision |
| --- | --- | --- | --- |
| German, Germany | domain weiterleitung | 90 | Defer |
| German, Germany | url weiterleitung | 70 | Defer |
| German, Germany | domain umleiten | 40 | Defer |
| German, Germany | domain masking | 10 | Defer |
| French, France | redirection nom de domaine | 40 | Defer |
| French, France | redirection domaine | 10 | Defer |
| French, France | redirection url | 170 | Defer |
| French, France | masquage domaine | UNKNOWN | Defer |

The returned rows contain no closeVariants arrays. The writer does not sum overlapping terms.
The missing French masking metric remains UNKNOWN.
The GSC topic aggregate records no matching rows for this slug during 2026-09-21 through 2026-10-18.
The aggregate measures observed site visibility. No matching row does not prove zero market demand.
The writer did not treat the observed zero counts as zero market demand.

The German search inspection found provider-specific HTTPS configuration and troubleshooting instructions.
The writer opened checkdomain's first-party HTTPS forwarding instructions.
The French inspection found provider dashboard instructions and generic redirect tooling.
The writer opened Gandi's first-party French forwarding guide.
Those observations support configuration intent, but do not establish an unmet localized protocol-guide opportunity.
The French 170 estimate concerns generic URLs, while the domain-specific phrases return 40 and 10.
The German domain phrases show modest demand, with specific provider workflows already answering the immediate configuration task.
The writer defers both complete translations for this batch because evidence of incremental localized value remains weak relative to maintaining the long protocol guide.
This decision uses no universal numerical threshold and claims no measured translation cost.
A follow-up should test provider-neutral troubleshooting queries and inspect country-specific impressions after English publication.
Other locale and region pairs remain unevaluated, with demand UNKNOWN.
No existing translation uses this slug, so this update exposes no stale translated claim.
The ten content locales include de and fr. The decision does not require runtime changes.

German intent source: https://www.checkdomain.de/support/domains/nutzung-einrichtung-domains/meine-weitergeleitete-domain-ist-nicht-via-https-erreichbar/
French intent source: https://docs.gandi.net/fr/noms_domaine/operations_courantes/redirection_web.html
Language source: https://developers.google.com/google-ads/api/data/codes-formats
Geographic source: https://developers.google.com/static/google-ads/api/data/geo/geotargets-2026-10-06.csv.zip

## One new illustration explains browser fragment handling

The new asset is `content/assets/domain-forwarding-redirects-05-fragment-handling.jpg`.
The house inline generator uses gpt-image-2 at high quality and composites the official Namefi logo.
Attempt 1 produced the accepted 1200 × 675 JPEG. The writer opened the final file for visual inspection.
The text, example domains, fragment labels, logo, cream background, and margins passed inspection.
The image adds a distinct concept. The four existing inline illustrations and cover remain useful.
The private scratch folder preserves the complete response before image parsing and the immutable attempt usage sidecar.
Attempt 1 reports 455 input tokens, 5488 output tokens, and 5943 total tokens.
The API reports zero image input tokens and 5488 image output tokens within those totals.
The writer made no retry and lost no image-attempt usage.

## The local package preserves validation and usage evidence

The writer runs only local sanity checks during creation.
`data:validate` passed with 13 tests, zero failures, and 37 existing warnings.
`lint:mdx` passed.
`links:locale` checked 4055 files with zero locale mismatches and zero relationship mismatches.
A focused link check resolved each article body route.
An image check found the cover and all five inline assets at the expected dimensions.
`git diff --check` passed.
The private scratch directory contains validation logs and `usage-checkpoints.json`.
The model identifier in emitted session metadata is `gpt-6.1-sol`.
The capture helper records actual cumulative counters and timestamps.
Research and image work overlap. The research-start capture follows initial instruction reading.
The combined research-end/writing-start capture follows the first article edit.
Those boundaries cannot isolate exact research and writing usage. Missing phase separation remains unavailable.
Cached input belongs within input tokens. Reasoning output belongs within output tokens.
The coordinator must not add those subsets twice.

The writer reviewed ancestor README files. Existing descriptions still apply, so no shared README needs an edit.
The expected content URL is https://namefi.io/r/en/blog/domain-forwarding-redirects/.
The corresponding development URL is https://namefi.dev/r/en/blog/domain-forwarding-redirects/.
No new translation URL or runtime route enters this package.
The writer performs no remote write, review, hosted CI, merge, or release.
