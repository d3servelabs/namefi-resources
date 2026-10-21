# The .ch update corrects registration and search guidance

Topic O03 / order 10 updates `content/tld/en/ch.md` in place.
The original title, date, slug, authors, priority, and relationships remain.
The writing uses American English. The research date is October 21, 2026.

## Primary policies support the revised claims

The writer personally opened the sources below. IANA establishes delegation, not eligibility.

| Source | Evidence used |
| --- | --- |
| https://www.nic.ch/terms/agb/ | Version 11, effective January 1, 2021. Sections 2.5–2.6 require accurate data and permit an authority-triggered Swiss correspondence address request within 30 days. Sections 3.1.1–3.1.2 cover contact details, 3–63 characters, exceptions, reserved names, and refusal grounds. |
| https://www.nic.ch/support/general/ | Foreign applicants can register. Registrars set retail prices. Auth-Code supports registrar transfer. Hosting and email require separate setup. |
| https://www.nic.ch/terms/ | Municipal-name protections and third-party rights. |
| https://www.nic.ch/terms/disputes/ | Rights disputes can use civil action or the registry dispute process. |
| https://www.nic.ch/terms/disputes/proceedings/ | Conciliation precedes a possible expert decision. The article does not invent a UDRP test or quote fees. |
| https://www.nic.ch/transfer/ | Direct sales stopped January 1, 2015. Customer transfer finished May 2016. |
| https://www.nic.ch/statistics/domains/ | Switch dates its registry role to 1990, correcting the old since-1987 claim. |
| https://www.nic.ch/support/idn/ | Character-list limits and software compatibility caveat. |
| https://www.nic.ch/whois/domaininfo/ | Since January 1, 2021, public lookup withholds holder data. Disclosure requires identity and overriding legitimate interest. Buying interest does not qualify. |
| https://www.bakom.admin.ch/en/ch-internet-domain-names | Switch operates under OFCOM authority. |
| https://www.iana.org/domains/root/db/ch.html | Switzerland, current operator, May 20, 1987 delegation. |
| https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites | Geographic signal and generic-ccTLD list. No ranking or international exclusion guarantee. |
| https://www.bar.admin.ch/en/the-confederation-before-1798 | Latin designation and CH abbreviation, paragraph under From the Switzers to the Swiss. |
| https://www.presseportal.ch/fr/pm/100004516/100471895 | Switch's February 2004 press release announces March 1, 2004 IDN introduction. Direct HTTPS returned 200 and 68,451 bytes after web fetch failed. Private scratch retains HTML. |
| https://www.nic.ch/registrars/ | Contractual registrar list. ICANN accreditation alone does not establish a .ch relationship. |

The writer opened admin.ch and srf.ch for retained public examples.
The update removes unsupported spam-reputation, guaranteed deliverability, Swiss trust, and categorical two-letter reservation claims.
The update removes unsupported current tcrn.ch and umresear.ch examples rather than implying present operation.
The update replaces the inaccurate .com registry comparison and unnecessary neighboring eligibility claims with focused .ch advice.
The update preserves useful 1987, 2004, 2015–2016, and 2021 history with sources.
The writer attempted the former Federal Chancellery PDF links through web and direct HTTPS.
The PDF fetches failed, so the article instead cites the opened Federal Archives page.
The writer read `domain-hacks-explained.md` for overlap. The .ch page owns country, eligibility, and buying intent. The existing article owns general domain-hack explanation.
Only English `ch.md` exists in the source tree, so no existing translations need contradiction repairs.

## Measured Swiss demand does not require new translations

The writer fetched direct Google Ads historical metrics for Switzerland separately by language.
The companion JSON retains every returned monthly series and request target.
All requests used GOOGLE_SEARCH, geoTargetConstants/2756, and October 2025–September 2026 returned periods.
German used languageConstants/1001. French used languageConstants/1002.
These approximate estimates describe searches, not visits. The writer did not add keyword groups together.

| Content locale and market | Query | Average monthly searches | Decision |
| --- | --- | ---: | --- |
| de / Switzerland | ch domain | 480 | Defer |
| de / Switzerland | ch domain kaufen | 210 | Defer |
| de / Switzerland | ch domain registrieren | 140 | Defer |
| fr / Switzerland | nom de domaine ch | 50 | Defer |
| fr / Switzerland | domaine ch | 30 | Defer |
| fr / Switzerland | acheter domaine ch | 10 | Defer |

The writer searched German and French Swiss queries and opened https://www.hostpoint.ch/domains/ch/ and https://www.hostpoint.ch/fr/domaines/ch/.
Those local pages already answer eligibility and purchasing questions with registration tools.
The writer also opened https://www.nic.ch/de/support/general/, which supplies primary local registration guidance.
The search service does not expose a Swiss geolocation control. This is a language-and-country-qualified results review, not a verified Google Switzerland ranking snapshot.
The German estimates show demand. The available results do not yet establish a distinct informational gap worth another maintained translation.
The French estimates show narrower demand with the same purchase-oriented fit.
The decision defers both locales pending a verified Swiss SERP gap or new query-level visibility. The decision does not label either market zero.
Native review availability and maintenance cost remain UNKNOWN, not an invented monetary cost or universal volume threshold.
Other locale/region pairs remain unmeasured and UNKNOWN. The writer did not select new translations.

The private GSC supplement covers September 21–October 18, 2026, final web data.
O03 matched 13 observed rows, 17 impressions, and zero clicks across all reported countries.
The country aggregate contains no Swiss row. Missing Swiss visibility is not zero Swiss market demand.
The public record excludes whole-site raw GSC data and account identifiers.

## The topic includes inspected house images

The existing `content/assets/ch-og.jpg` remains relevant and measures 1200 × 630.
The writer opened the cover and confirmed readable text, official top-right logo, and empty bottom reserve.
The writer generated `content/assets/ch-01-registry-registrar.jpg` using the repository inline script and gpt-image-2 high.
The 1200 × 675 final image shows Holder → Registrar → Switch.
The writer opened the final image and checked text, edge margins, official logo, crop, and meaning.
The generic contact details illustrate a holder record, not a real registrant.
The single generation attempt passed. No retry occurred.
The immutable scratch sidecar preserves the returned usage before any overwrite.
Image usage: 455 input text tokens, 5,488 output image tokens, 5,943 total tokens.
The API did not return a model field. The request explicitly used gpt-image-2 high.

## Local sanity completes the package

- `TMPDIR=/private/tmp bun run data:validate`: passed, 37 existing missing-locale-directory warnings.
- `TMPDIR=/private/tmp bun run lint:mdx`: passed.
- `bun run links:locale`: 0 locale mismatches and 0 relationship mismatches.
- `bun run links:audit`: 0 broken, 0 missing-locale, 0 locale-mismatch, 0 relationship-mismatch, 512 missing-translation fallback notices.
- Frontmatter FAQ synchronization passed across 1,633 FAQs and 369 pages.
- `git diff --check`: passed.
- Both referenced images exist at the required dimensions.

Expected published URL: https://namefi.io/r/en/tld/ch/.
Only English exists. The renderer should emit an English self canonical and English x-default.
No deployed canonical or hreflang check has run because the task is local-only.
No push, PR operation, hosted CI, code review, or third-party review occurred.
The coordinator owns shared README changes. No shared README update is necessary for one TLD update and one conventionally named illustration.
Actual phase counters appear in `10-ch-usage.json`. The counters are cumulative emitted snapshots and can lag the exact phase boundary.
The image phase overlaps research and writing. Aggregation must not double-add overlapping phase deltas, cached input, or reasoning output.
