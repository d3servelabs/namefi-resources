# This package updates the existing .io reference page

The O01 package preserves `/en/tld/io/` and all nine existing translations.
The English title and historical publication date remain unchanged.
The update answers meaning, origin, eligibility, geographic search treatment, and retirement questions.
The price article answers billing questions. The `.ai` comparison answers the extension-choice question.
The package keeps those separate intents and their existing links.

## The update corrects specific current claims

NIC.IO distinguishes second-level `example.io` from third-level `example.com.io` registrations.
The update removes the universal three-character minimum and unverified IDN support assertion.
The update removes assumed ICANN gTLD grace periods and blanket future-operation assurances.
The update gives the five-year default retirement process and possible approved extension.
The update repairs these material claims in all existing locales and synchronizes visible FAQs with metadata.
The English page also replaces a malformed comparison table with a buyer checklist.

This package does not claim a full factual audit of the untouched historical narrative.
The historical popularity, platform-scale, price, name-availability, and email-reputation prose remains outside the update scope.
Those paragraphs must not receive a blanket “verified” label from this package.
No new locale or full-page translation was selected.
The nine existing translations remain complete pages with narrow factual repairs.

## Primary sources support the changed claims

All sources below were opened on 2026-10-21 UTC.
The source ledger identifies the exact evidence used for each changed factual claim.

| Source | Supported claim |
| --- | --- |
| [NIC.IO allocation rules](https://nic.io/rules.htm) | Rules 3.1 and 4.1 distinguish registration eligibility by level. Rule 3.2 permits controlled allocation of short labels. Sections 5, 7, and 9 address use, spam, and accurate contacts. |
| [NIC.IO terms](https://nic.io/terms.htm) | Sections 18 and 19 govern transfer procedure, fees, and then-current renewal/transfer terms. No universal recovery timeline was inferred. |
| [NIC.IO policy index](https://nic.io/policy.htm) | Registry terms and policies apply to registrations. The “Renewal Policy” link resolves to the allocation-rules page, so the package does not invent redemption deadlines. |
| [IANA .io record](https://www.iana.org/domains/root/db/io.html) | Active country-code delegation, Internet Computer Bureau manager, no displayed retirement date. This record does not establish open eligibility. |
| [Google geographic targeting documentation](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) | Google lists .io among ccTLDs treated as generic for geographic targeting. |
| [ICANN Chagos explanation](https://www.icann.org/en/blogs/details/the-chagos-archipelago-and-the-io-domain-14-11-2024-en) | Sovereignty change and ISO code removal are distinct questions. The article does not predict a shutdown. |
| [IANA retirement process](https://www.iana.org/help/cctld-retirement) | Public notice, default five-year period, approved extension up to five additional years, and possible earlier retirement. |
| [UK Parliament treaty briefing](https://commonslibrary.parliament.uk/research-briefings/cbp-10273/) | UK and Mauritius signed the agreement on 2025-05-22. No current ratification prediction was added. |
| [Yuka explains its domain](https://help.yuka.io/l/fr/article/0crz5kblss-pourquoi-io-comme-nom-de-domaine) | A brand explicitly describes the input/output association. This example does not quantify market recognition. |

The first NIC.IO terms request failed. A subsequent direct open returned the full terms.
The failed request supplied no evidence. IANA’s IDN-table fetch failed and supplied no support for IDN availability.
The update therefore removes the unsupported IDN assertion rather than inferring support from delegation.

## Each locale decision uses its own market evidence

`demand.json` retains direct Google Ads API v26 requests and responses.
Each request specifies language and geography separately, with `GOOGLE_SEARCH` network.
Requests were fetched on 2026-10-21 UTC for Namefi MCC 3505976042.
Returned monthly series cover October 2025 through September 2026 where metrics exist.
The file preserves every returned keyword, close variant, average, and monthly volume.
Absent metrics remain UNKNOWN. Overlapping groups were not added together.
Advertising competition was not treated as organic difficulty.

| Existing locale and market | Returned monthly averages | Decision and search-result fit |
| --- | --- | --- |
| de / Germany | `io domain bedeutung` 90; `io domain kaufen` 50 | Retain and repair. German results mix meaning guides and purchase pages. The reference page fits meaning and eligibility. Defer a full refresh because a complete translation already exists. |
| fr / France | `nom de domaine io` 140; `extension io signification` 10 | Retain and repair. French registrar pages and Yuka’s own explanation match origin and naming intent. Defer a complete rewrite. |
| es / Spain | `dominio io` 260; `que significa dominio io` 10 | Retain and repair. IONOS Spain’s meaning guide shows the same reference intent. Defer a complete rewrite. |
| ja / Japan | `io ドメイン` 1300; `io ドメイン 意味` 30 | Retain and repair. XServer’s Japanese .io page confirms registration and explanation intent. Existing coverage and narrow policy changes favor maintenance over a new page. |
| ko / South Korea | `io 도메인` 320; `io 도메인 뜻` 40 | Retain and repair. Korean results mix explanation and registrar comparisons. The existing reference URL supplies the relevant format. Defer a full refresh. |
| zh-CN / China | returned `io 域名` 40; meaning query UNKNOWN | Retain and repair. Chinese registration pages match buyer intent, but local commercial and compliance context differs. No extra regional adaptation was selected. |
| hi / India | both submitted native queries UNKNOWN | Retain and repair. Hindi results include translated registrar guides. Insufficient measured demand supports deferring full translation work, not deleting the existing page. |
| ta / India | both submitted native queries UNKNOWN | Retain and repair. Results include the existing Namefi page and translated registration pages. Independent local opportunity remains uncertain. Defer a full refresh. |
| ar / Egypt | both submitted native queries UNKNOWN | Retain and repair. Arabic results mix regional registration pages and Egyptian offers. Exact Egypt-specific meaning demand remains uncertain. Defer a full refresh. |

Search-result observations came from native query searches on 2026-10-21.
The search tool does not expose a guaranteed physical search location or a reproducible Google ranking.
These observations establish language and intent fit, not exact national rank or market share.

Opened market examples include [one.com Germany](https://www.one.com/de-de/domains/io/),
[OVHcloud France](https://www.ovhcloud.com/fr/domains/tld/io/),
[IONOS Spain](https://www.ionos.es/digitalguide/dominios/extensiones-de-dominio/que-es-el-dominio-io/),
[XServer Japan](https://www.xdomain.ne.jp/domain/detail/io.php),
[NameBeta Korean](https://namebeta.com/ko/tlds/io), and
[Now.cn](https://www.now.cn/domain/intro_io.php).
Commercial pages establish competing intent only. NIC.IO supplies registration rules.

The sanitized GSC supplement covers 2026-09-21 through 2026-10-18.
O01 has 1,246 observed query/page/country rows, 6,174 impressions, and zero observed clicks.
Country counts include US 4,431, Germany 63, France 74, Spain 36, Japan 34, Korea 6, China 73, India 120, and Egypt 6 impressions.
The observations do not isolate the query language or prove market size.
Missing rows and absent Ads metrics are not zero demand.

No universal numeric demand threshold was used.
A new translation has little incremental value because all supported locales already have the same reference URL.
A complete rewrite would add translation and maintenance work beyond the narrowly changed facts.
Future full refreshes need native-language opportunity analysis and source verification of the remaining historical claims.

## The images explain the update in the required house style

The package generates `content/assets/io-01-registration-levels.jpg` at 1200 × 675.
The image distinguishes `name.io` worldwide applicants from `name.com.io` territory residents.
The package also replaces the existing `content/assets/io-og.jpg` cover at 1200 × 630.
The old cover used an etched style, bottom-left logo, and text across the artwork.
The new cover uses the current repository cover generator and official logo compositing.
The old `io-hero.jpg` remains untouched and unreferenced by this update.

Both images use gpt-image-2 high quality and the repository generation scripts.
Scratch copies change only credential-header handling and safe usage recording.
The scripts inject GuestSafe credentials into the intended image process.
No credential value, response image data, or prompt file enters this package.
`image-usage.json` records returned usage separately for each image attempt.

## The package preserves the locale URL set

Expected final URLs are `https://namefi.io/r/{locale}/tld/io/`, with locale values
`en`, `ar`, `de`, `es`, `fr`, `hi`, `ja`, `ko`, `ta`, and `zh-CN`.
The renderer must keep self canonicals, reciprocal real translations, and English x-default.
No unsupported SEO frontmatter fields were added.
Deployment checks remain pending because this package authorizes local work only.

The package does not push, create or edit a pull request, invoke reviews, or run hosted CI.
The final handoff records the local commit and sanity results.


## Local sanity confirms structural consistency

`TMPDIR=/private/tmp bun run data:validate` passed with 37 pre-existing warnings.
The check found zero locale mismatches and zero relationship mismatches across 4,055 files.
All 1,633 frontmatter FAQs matched their visible answers across ten locales.
`bun run lint:mdx` passed.
A final focused Tamil lint and FAQ synchronization check passed after one existing corrupted suffix was repaired.
The focused topic scan found no Unicode replacement characters, unresolved placeholders, IDN assertion, or old universal minimum-length assertion.

Both final images passed visual inspection.
Cover attempt 1 failed the bottom reserve and invented extra domain labels.
Cover attempt 2 corrected both failures.
The package retains returned usage for all three image calls.
The final cover has 1200 × 630 pixels. The inline image has 1200 × 675 pixels.

Phase metadata records actual emitted cumulative counters and their event timestamps.
The research-start entry uses the first available event rather than an invented exact boundary.
The image-start counter was not captured separately and remains unavailable.
Image generation overlapped research and writing. The final image completion checkpoint follows cover attempt 2.
No estimated token count is labeled as actual.
