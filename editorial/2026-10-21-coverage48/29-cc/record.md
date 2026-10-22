# This package updates the existing .cc guide

Order 29 / O06 updates `content/tld/en/cc.md` and repairs all nine existing translations.
The source base is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The branch is `codex/coverage48-29-cc`.
The worktree is `.worktrees/coverage48-29-cc`.
The actual writer model is `gpt-6.1-sol`.
The canonical writer path is `/root/stack48_coordinator/coverage48_29_o06`.

## The existing URL retains its reader purpose

The guide explains the suffix, operator, buyer choices, registration conditions, pricing checks, Google classification, and email considerations.
Sibling `.com`, `.co`, and `.io` guides cover separate suffixes.
The update preserves the established English title and all relationship metadata.
The update replaces unsupported adoption counts, price comparisons, premium-renewal claims, historical eligibility assertions, and inbox-delivery assurances.
Arduino supplies an actual current example instead of an unsupported user count.

## Opened sources support specific claims

All source access occurred on 2026-10-21 America/Los_Angeles, corresponding to 2026-10-22 UTC.

| Opened source | Supported scope |
| --- | --- |
| https://www.iana.org/domains/root/db/cc.html | ccTLD classification, eNIC manager, Verisign technical contact, secure delegation |
| https://www.verisign.com/domain-names/cc-domains/ | Current operator product offering through registrars |
| https://www.verisign.com/resources/become-a-registrar | Operator registration workflow and general 1–10-year term |
| https://www.verisign.com/what-we-do/verisign-registry | Operator lists .cc among its registry services |
| https://faq.webnic.cc/kb/cc/ | WebNIC accepts individuals/businesses from any country, 1–10 years, 1–63 characters, IDN availability |
| https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites | Google includes .cc in its generic ccTLD list |
| https://www.arduino.cc/ | Arduino uses its official .cc website for products, documentation, and community |
| https://support.google.com/mail/answer/81126 | Gmail authentication, DNS, spam and bulk-sender requirements |

The old operator policy URL returned HTTP 200 but redirected to the Verisign homepage.
The URL was `https://www.verisign.com/en_US/company-information/government-relations/tv-cc-domain-name-registration-policies/index.xhtml`.
The final response URL was `https://www.verisign.com/`.
The response did not expose the policy text and provides no eligibility evidence.
The attempted `https://www.verisign.com/assets/cc-registrar-agreement.pdf` did not yield a readable agreement.

A Woktron reproduction of operator rules was opened for investigation only.
The reproduction explicitly dates itself March 17, 2010 and still covers Verisign's former .tv operation.
The reproduction is not a current operator agreement and does not support present registry-wide restrictions.
The reproduction assigns its premium-name provisions to .tv, illustrating why the old .cc premium assertion was unsafe.
The published guide therefore attributes worldwide eligibility to WebNIC's current service statement and tells buyers to verify their chosen registrar's agreement.
The guide does not infer open eligibility from IANA or claim that WebNIC's terms bind every registrar.
A current standalone operator eligibility policy remains unavailable.

## Measured demand does not require new locale pages

Every currently supported non-English locale already contains `cc.md`.
The package adds no locale and does not delete existing translations.
The package repairs exposed factual issues in ar, de, es, fr, hi, ja, ko, ta, and zh-CN.
Existing translation repairs do not depend on a new-translation demand gate.
China, South Korea, and Spain received direct historical-metric checks because topic GSC showed relevant existing exposure.

Google Ads MCC 3505976042 returned historical metrics through API v26 on 2026-10-22 UTC.
All requests used GOOGLE_SEARCH and independent language and country targets.
Official language criteria came from https://developers.google.com/google-ads/api/data/codes-formats.
The criteria are Simplified Chinese 1017, Korean 1012, and Spanish 1003.
Country targets are China 2156, South Korea 2410, and Spain 2724.
The returned monthly period is October 2025 through September 2026.
`demand.json` preserves requests, fetch timestamps, returned close variants, averages, and all monthly series.

| Locale and market | Returned queries and monthly averages | Decision |
| --- | --- | --- |
| zh-CN / China | cc 域名 70; cc 域名 注册 10; cc 域名 是 什么 意思 10 | Maintain existing translation; repair facts without creating another URL |
| ko / South Korea | cc 도메인 140; cc 도메인 등록 UNKNOWN; cc 도메인 뜻 UNKNOWN | Maintain existing translation; missing long-tail metrics do not mean zero |
| es / Spain | dominio cc 140; registrar dominio cc 10; qué es dominio cc UNKNOWN | Maintain existing translation; preserve its existing global Spanish route |

Chinese close variants preserve `cc域名`, `cc域名注册`, and `cc域名是什么意思`.
The Korean and Spanish responses did not return closeVariants arrays.
The query sets address domain meaning and registration rather than generic English proxies.
Search-result intent checks found registrar offers and extension explanations, including Spanish OVHcloud/INWX and Korean domain registration results.
The available result checks are directional and do not simulate a fully localized Google SERP.
No universal volume threshold drove the decision.
Other existing locales received factual repairs only, without claims of measured new-market demand.

The supplied GSC supplement covers 2026-09-21 through 2026-10-18 and query/page/country dimensions.
O06 matched 344 observed rows, 1,502 impressions, and 12 clicks.
South Korea contributed 358 impressions and nine clicks; China contributed 205 impressions and one click.
Spain contributed 181 impressions and no observed clicks.
`gsc.json` preserves only the topic aggregate, not the private whole-site dataset.
Observed GSC rows do not measure total market demand or identify every searcher's language.

## One new image passes visual inspection

`content/assets/cc-og.jpg` is a newly generated 1200 × 630 progressive JPEG.
All ten locale pages reference the cover through `ogImage`.
The adapted repository `og-cover.sh` used `gpt-image-2`, high quality, and native 1216 × 640 generation.
The script composites the official Namefi logo and converts the result to the required final dimensions.
Attempt 1 succeeded; no retry occurred.
The immutable attempt script and complete successful response remain in private scratch.
The response reached private storage before extraction or cleanup.
`image-usage.json` preserves actual returned usage and the final SHA-256.
The API did not return a model field; the request specifies the model.
Visual inspection confirmed spelling, official upper-right logo, cream margins, no cropping, and approximately 22% lower caption reserve.
The old article contained no matching `.cc` illustration to reuse.

## Local sanity checks pass

The final `bun run data:validate` passed, including 13 local tests, with 37 existing warnings.
The final `bun run lint:mdx` passed.
The focused ten-page link audit reported zero broken links, locale mismatches, and relationship mismatches.
One existing Tamil `.xyz` translation fallback remains intentional.
All 1,633 frontmatter FAQs across 369 pages match their body answers.
A first validation exposed one French FAQ quoting mismatch; the correction passed final validation.
Ten-page structural checks preserve 16 sections per locale, required numeric units, own-locale links, and one cover reference per page.
No localized body exactly copies the English body after link normalization.
No hosted CI, review, remote write, pull request, merge, or publication occurred.
The package does not claim native-human language review or deployed rendering verification.
The existing localized pages remain full prose; this update changes matching factual units instead of replacing translations with stubs.

## The locale URL set remains unchanged

The expected production routes are the following actual locale pages.
The renderer should self-canonicalize each locale and emit reciprocal hreflang, with English x-default.
No unsupported SEO frontmatter keys were added.
Deployment checks must verify rendered canonical/hreflang after the owner authorizes publication.

- https://namefi.io/r/en/tld/cc
- https://namefi.io/r/ar/tld/cc
- https://namefi.io/r/de/tld/cc
- https://namefi.io/r/es/tld/cc
- https://namefi.io/r/fr/tld/cc
- https://namefi.io/r/hi/tld/cc
- https://namefi.io/r/ja/tld/cc
- https://namefi.io/r/ko/tld/cc
- https://namefi.io/r/ta/tld/cc
- https://namefi.io/r/zh-CN/tld/cc

## Actual counters have explicit timing limits

`usage-checkpoints.json` preserves actual cumulative emitted counters from the canonical writer session.
Cached input is already inside input; reasoning output is already inside output.
Images, writing, and translation repairs overlapped in this session.
The translation-start checkpoint was captured late during refinement and does not mark the first translated edit.
The image-end checkpoint was captured after visual inspection rather than at the API completion instant.
Separate exact per-phase token allocations are unavailable and must not be inferred as exact from overlapping boundaries.
