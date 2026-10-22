# G37 adds address distinctions to the existing terminology guide

The English article keeps its slug, title and investor glossary job. The update adds URL anatomy, hostname context, the domain name space, FQDN notation and public-suffix caveats. The existing `what-is-domain` article serves a broader introductory job. No new competing URL was created.

## Primary sources support the changed technical claims

Sources opened October 21, 2026: RFC 9499 section 2 (domain name, hostname, FQDN), RFC 3986 section 3 (URL components), RFC 1034 section 3.1 (namespace tree), MDN URL.hostname (hostname and IP address), Public Suffix List/list (public suffix definition), IANA .ai and .io delegation records (ccTLD category), RFC 5737 section 3 (documentation IP address). Published content links to each source directly. No archive snapshot was captured.

The source article had no external citations. The changed technical portion no longer presents `namefi.io` as resolving to a private example address. All nine existing translations receive the same narrow correction and remove .ai/.io from new-gTLD examples. The original investment examples, platform recommendations, price suggestions and product claims remain outside this focused technical update. The writer has not verified those legacy claims.

## Mexico-specific demand selects the existing Spanish article for refresh

Google Ads historical metrics use MCC 3505976042, Google Search only, Spanish language 1003, Mexico geo 2484. The API returned October 2025–September 2026 monthly series. Fetch timestamps, requests, returned close variants and full monthly series appear in the adjacent evidence JSON files. Missing closeVariants fields mean the API did not return a close-variant list.

| Market | Query | Average monthly searches | Decision |
| --- | --- | ---: | --- |
| Mexico, Spanish | dominio y url | 20 | Update existing es article |
| Mexico, Spanish | diferencia entre dominio y url | 20 | Update existing es article |
| Mexico, Spanish | qué es un dominio | 2900 | Supporting broad demand |
| Mexico, Spanish | nombre de host | 210 | Supporting technical demand |
| Germany, German | was ist eine domain | 4400 | Defer expansion of existing de article |
| Germany, German | domain und url unterschied | Unknown | API returned no keyword metrics |
| Germany, German | hostname domain unterschied | Unknown | API returned no keyword metrics |
| Japan, Japanese | ドメイン URL 違い; ホスト名 ドメイン 違い; ドメインとは | Unknown | HTTP 429 prevented a metric result |

Spanish search results showed domain-versus-URL explainers and hostname documentation. The writer opened Google web.dev in es-419 and MDN Spanish host documentation to confirm technical intent and terminology. The small direct distinction demand complements the broader domain and host demand. The existing complete Spanish page makes a focused refresh economical. The selection does not use a universal volume threshold.

The es article preserves all existing sections and adds the complete English technical addition in Spanish for Mexico. The translation preserves code, citations and relationship slugs. Term choices: nombre de dominio, nombre de host, esquema, puerto, ruta, consulta, fragmento. No human native-language review occurred, per the user's creation-stage review waiver.

No new locale is warranted: every currently supported non-English locale already has a page. The de, ja, ar, fr, hi, ko, ta and zh-CN pages retain their prior prose beyond the two factual repairs. Their new English sections remain untranslated and explicitly deferred. Root later supplied fresh GSC observed-site data for September 21–October 18, 2026. The adjacent aggregate records exact-slug filtering and Mexico country key mex. The observed table contains 123 matching slug rows across countries and 1 Mexico rows. Missing matches do not establish zero market demand. The translation decision still rests on Google Ads market-specific evidence. Unqueried markets remain unknown rather than zero.

## The package records image and sanity evidence

The package generates a cover and one inline diagram with gpt-image-2 high using the repository generators. The scratch copies replace curl credential arguments with an environment-reading Python HTTP consumer and retain API usage metadata. The official Namefi logo comes from the repository skill's SVG source. Image QC and local sanity results follow in the handoff evidence.

Expected existing locale URLs: https://namefi.io/r/{locale}/blog/domain-terminology-guide/ for en, es, de, fr, ar, hi, ja, ko, ta and zh-CN. The expected locale set does not change. The renderer owns self-canonical, reciprocal hreflang and English x-default behavior. This content-only update adds no SEO frontmatter keys.

Root supplied the session JSONL path after drafting. The adjacent usage JSON retains actual cumulative counters and the actual backend model gpt-6.1-sol. Exact phase boundaries remain unavailable. The usage record includes actual image API usage. Research start and image start were not captured as UTC checkpoints. Later phase timestamps come from the local UTC clock. No code review, third-party review, hosted CI or deployment occurred.

The cover passed visual QC on attempt one. The inline diagram passed on attempt two after the writer removed an ambiguous brace. Local data validation passed with 37 existing warnings. MDX lint passed. The focused English/Spanish link audit found zero broken links and zero locale or relationship mismatches. All ten locales pass the global same-locale check.
