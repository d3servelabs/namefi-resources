# This package updates the DNS record selection guide

Order 19 owns G11, `dns-record-types-guide`, from base `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The English page keeps its title, URL, application-dependency structure, and four existing section illustrations.
A new illustration explains the added record-selection table.
The update adds a twelve-row record selection table and five examples with explicit record fields.
The update distinguishes IANA type names from abbreviated queries and explains legacy SPF type publication.
The existing English specialist articles retain their independent AAAA, alias, reverse DNS, and TXT jobs.
No existing translation existed at the assigned slug before this update.

## Direct measurements select Japanese for Japan

The three `ads-*.json` files preserve direct Google Ads historical metrics requests and responses.
The account uses Namefi MCC 3505976042, Google Search only, with separate language and country targets.
The responses cover October 2025 through September 2026 and include monthly series, close variants, and fetch timestamps.
The writer verified Spanish 1003, German 1001, and Japanese 1005 against the official Google Ads codes page before requests.
The writer did not use English keywords as a substitute for native-language queries.

| Pair | Returned query | Average monthly searches | Decision |
| --- | --- | --- | --- |
| Japanese / Japan | dns レコード 種類 | 320 | Select |
| Japanese / Japan | dns レコード 一覧 | 70 | Supports selection |
| Japanese / Japan | dns レコード 設定 例 | 20 | Supports examples |
| Spanish / Mexico | tipos de registros dns | 40 | Defer |
| Spanish / Mexico | registros dns ejemplos | 10 | Defer |
| Spanish / Mexico | registro aaa dns | UNKNOWN | No reported metrics |
| German / Germany | dns record typen | 20 | Defer |
| German / Germany | dns einträge beispiele | 10 | Defer |
| German / Germany | dns eintrag typen | UNKNOWN | No reported metrics |

The Japanese record-selection queries match the general guide's job directly.
The writer opened AWS's Japanese record-type reference to confirm a native-language overview and configuration-example intent:
https://docs.aws.amazon.com/ja_jp/Route53/latest/DeveloperGuide/ResourceRecordTypes.html .
The writer used the repository termbase for Japanese glossary anchors and the reference for ordinary DNS terminology.
The Japanese translation preserves the complete explanation, examples, limitations, citations, images, and change checks.
The translation uses polite technical Japanese for domain administrators.

The writer selected one locale to keep ongoing maintenance proportional to measured intent and demand.
Mexican Spanish and German show relevant but lower measured demand for this specific general guide.
Those markets remain deferred rather than declared commercially worthless.
Other supported locales remain unmeasured and UNKNOWN for this topic.
No universal volume threshold or sum across potentially overlapping queries determines the selection.

The sanitized GSC supplement contains no matching observed query rows for this slug during September 21 through October 18, 2026.
The zero observed rows do not establish zero market demand and do not override the direct Ads measurements.
The package includes only the per-topic aggregate in `checks.json`, not full-site private rows.

## Source and image records preserve the evidence

`sources.json` records opened official sources and the overlap decision.
The writer read the existing English article and the overlapping specialist articles before editing.
The RFC and IANA fetches returned HTTP 200.
Cloudflare rejected the direct Python fetches; the web tool then opened the actual documentation and relevant sections successfully.
No failed fetch counts as evidence.
The article dates use the actual local retrieval date, October 21, 2026.

`images.json` records five reused assets and one newly generated selection diagram, with SHA-256 hashes, dimensions, and visual checks.
The writer opened every final asset and confirmed relevant content, spelling, margins, logo position, and cover caption space.
The existing section diagrams still describe the same dependencies.
The new selection diagram adds an overview of website, email, and authority decisions.
The image uses the house inline script with gpt-image-2 at high quality.
The package preserves available attempt-specific image usage before any retry.
Attempt 1 failed locally after the API request because the writer modified a running scratch script.
Cleanup removed the temporary response before capture; attempt 1 API outcome and returned usage remain UNKNOWN.
The failure record explicitly preserves the missing measurement instead of inventing zero usage.
Attempt 2 uses a fixed script with usage capture before image decoding.
English labels remain in the shared diagrams; Japanese alt text explains every diagram.

## Local sanity checks pass without remote activity

`checks.json` records local validation, locale links, translation invariants, static MDX compilation, and browser preview results.
The writer opened desktop and mobile screenshots of the local Japanese preview.
The static preview shows complete Japanese text and five loaded inline images without page overflow at 390 pixels.
The application shell and deployed canonical/hreflang checks remain future publication checks.
The existing renderer owns self-canonical and reciprocal language metadata for the two actual locale files.
The writer added no unsupported SEO frontmatter.

`usage-checkpoints.json` records actual emitted session counters and model metadata.
Cached input and reasoning output remain subsets rather than additional token charges.
The initial research checkpoint follows instruction loading, so the initial checkpoint is not a full session-start measurement.
The initial reused-image inspection start checkpoint is unavailable; the writer did not invent a counter.
The new image generation has separate start and completion checkpoints.
The writer made no README edits outside this topic folder because the coordinator owns shared batch inventories.
No push, PR action, code review, third-party review, hosted CI, merge, or deployment occurred.
