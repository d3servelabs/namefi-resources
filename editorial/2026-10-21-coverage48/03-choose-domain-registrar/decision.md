# This package completes the registrar selection guide locally

G19 is target 3 in the authorized 48-target batch.
The new English page answers how to choose a registrar.
The registrar glossary defines the role and gives only a brief selection checklist.
The account-security guide answers account hardening after provider selection.
The transfer guide answers migration after provider selection.
Neither existing guide replaces the complete selection task.
The assigned slug remains `choose-domain-registrar`.

## The English source and one German translation share the same scope

The guide compares holding costs, account recovery, DNS choices, and exit procedures.
The guide includes three documented provider examples without claiming a universal winner.
English uses US technical English. German addresses readers in Germany with formal `Sie`.
German preserves every source section, comparison row, question, qualification, and citation.
The termbase supplies Registrar, Registry, DNS, and Transfer-Sperre.
API, DNSSEC, U2F, TOTP, AuthInfo, and provider names retain their established forms.
The opened German IONOS article supplies additional domain-provider terminology precedent.
No native human language assessment or deployed rendering occurred during local preparation.
The owner waived independent review and hosted CI during creation.

## Germany has direct selection demand that fits the guide

Google Ads historical metrics use Google Search and separate language and geographic targets.
The three `ads-*.json` files preserve requests, retrieval timestamps, close variants, averages, and complete monthly series.
The reporting period is October 2025 through September 2026.
The estimates describe search activity, not promised visits or SEO difficulty.
Overlapping query groups are not summed.

| Locale and market | Query groups and average monthly searches | Decision |
| --- | --- | --- |
| German, Germany, language 1001, geography 2276 | `bester domain anbieter`: 260; `domain anbieter vergleich`: 210; `domain registrieren anbieter`: no metrics returned, UNKNOWN | Select German for Germany. Direct comparison intent matches all four sections. |
| Spanish, Mexico, language 1003, geography 2484 | `mejor registrador de dominios`: 10, close variant `mejores registradores de dominios`; `donde comprar dominio`: 170; `mejor proveedor de dominios`: 10 | Defer. Most measured activity concerns where to buy. A Mexico-specific seller, invoicing, and currency comparison would better address that broad query. |
| Japanese, Japan, language 1005, geography 2392 | `ドメイン おすすめ`: 260; `ドメイン 取得 おすすめ`: 880, close variant `ドメイン取得 おすすめ`; `ドメイン 取得 比較`: 70 | Defer. Search results emphasize domestic services, acquisition and renewal prices, and local adjustment fees. A domestic-provider evidence set would improve intent fit. |

The selection applies no universal numeric threshold.
German requires one maintained translation and retains the source's provider-neutral task.
Spanish and Japanese demand is present. Deferral does not mean zero demand.
The other supported locales remain unmeasured and UNKNOWN.
New regional source research and a comparison brief could justify later Spanish or Japanese translations.

The local search-result inspection used native queries on 2026-10-21.
The search tool does not expose a country-locked or personalized Google rank.
The observations establish visible language-market intent, not exact local rankings.
Opened German results include [checkdomain's comparison](https://www.checkdomain.de/blog/domains-hosting/domain-anbieter-im-vergleich/) and [IONOS's comparison](https://www.ionos.de/digitalguide/domains/domainverwaltung/domain-anbieter-vergleich-der-besten-provider/).
Both results combine costs, features, and support with provider-specific recommendations.
The guide adds a reusable checklist for recovery and provider exit without an asserted winner.
Mexican results included purchase pages, `.mx` comparisons, and a registrar-selection article.
Japanese results included acquisition-service tables and renewal-cost comparisons.
The Japanese ScaleWhite page failed to open. Its snippet supplies no factual evidence for published claims.

## Search Console supplements the demand estimates with observed visibility

The private root supplement covers final web data from 2026-09-21 through 2026-10-18.
The supplement uses query, page, and country dimensions.
The committed `gsc-summary.json` contains only topic-relevant market aggregates and selection-query rows.
Germany has 53 impressions and zero clicks across 11 broad registrar rows.
The query `bester domain registrar` accounts for 22 impressions across two German rows.
Mexico has 43 impressions and zero clicks across six broad registrar rows.
The exact Mexican selection query has one impression.
Japan has 1,264 impressions and six clicks across 125 broad matching rows.
Most Japanese rows concern individual extensions rather than registrar selection.
Those broad totals do not measure direct selection demand.
Missing query rows do not establish absent market demand.

The [source evidence](source-evidence.md) maps eight opened primary sources to the article claims.

## The expected locale URLs include only actual translations

- English: `https://namefi.io/r/en/blog/choose-domain-registrar/`
- German: `https://namefi.io/r/de/blog/choose-domain-registrar/`

Each actual locale should self-canonicalize through the existing renderer.
Only English and German qualify for reciprocal language alternates for this slug.
English supplies the x-default.
The package adds no unsupported frontmatter SEO fields.
The package keeps same-locale fallback routes and identical ordered relationship slugs.
Deployed canonical and language-alternate checks remain for the coordinator after authorized publication.

## Five generated images passed local inspection

The image manifest preserves dimensions, file hashes, returned API usage, and inspection outcomes.
The package contains a 1200 × 630 cover and four 1200 × 675 inline illustrations.
All images use gpt-image-2 high and the official composited Namefi logo.
The cover and DNS diagram each required a second attempt.
The first cover invented prices. The first DNS diagram implied an unclear service flow.
The final images remove those defects and preserve the required margins and logo reserves.
First-attempt API usage for the two replaced images was overwritten and remains unavailable.
The five final API usage records remain intact. No complete seven-call token total is claimed.

## Local sanity passed without remote operations

`bun data:validate` passed with 37 existing warnings.
The locale checker found zero locale and relationship mismatches across 4,057 files.
`bun lint:mdx` passed.
The scoped link check found zero blocking errors and four accepted German fallback links.
The locale files have identical external URL multisets, five section headings, ten table lines, five final questions, and four inline images.
The local sanity record preserves these checks and the translation coverage limits.
No push, pull request, code review, hosted CI, merge, or publication occurred.
The coordinator must complete deployed checks after the remote-operation gate reopens.

## The usage records preserve actual counters and measurement limits

The session metadata identifies `gpt-6.1-sol`.
The phase record preserves UTC research, writing, translation, and image timestamps.
The actual usage record contains nearest-prior cumulative token events for recorded boundaries.
Those events are actual session counters, but event timing prevents exact phase attribution.
Input counters include cached input. Output counters include reasoning output.
No estimate substitutes for an unavailable exact boundary.
