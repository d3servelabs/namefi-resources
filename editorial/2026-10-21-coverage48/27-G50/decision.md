# G50 explains domain levels without replacing related guides

This package updates `content/blog/en/what-is-domain.md` from base `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The existing title, slug, introductory reader task, URL example, and ordered relationships remain.
The article adds root, complete second-level names, nested subdomains, and registration boundaries.
The terminology guide remains the investor vocabulary reference.
The subdomain examples guide remains the operational service and hostname reference.
The TLD guide remains the extension-category and selection reference.

## Primary sources support the revised explanation

The writer opened RFC 1034 sections 2.4 and 3.1, RFC 9499 sections 2 and 9, IANA's root database, Nominet lookup examples, MDN's URL guide, ICANN registrar and registry listings, and JPNIC's domain explanation on 2026-10-21 local time.
RFC 8499 redirected to a page marking the document obsolete. The article therefore uses RFC 9499.
Sources support the claims directly through inline links and the source section.
Nominet's lookup form explicitly accepts `example.co.uk` and `example.uk`.
JPNIC's explanation also confirms the Japanese educational search intent.

## Japanese demand supports one complete translation refresh

Google Ads API v26 historical metrics use Google Search only, separate language and country targets, and Namefi MCC 3505976042.
The writer checked every requested language criterion against Google's official codes-and-formats table before requests.
The request files preserve queries, actual returned text, close variants when returned, monthly series, average metrics, and fetch UTC.
The returned period is October 2025 through September 2026. No estimate is an actual visitor count.

| Locale and market | Average monthly searches for requested topic queries | Decision |
| --- | --- | --- |
| ja / Japan 2392 / language 1005 | ドメイン 階層 50; トップ レベル ドメイン 1300; セカンド レベル ドメイン 170 | Refresh the existing Japanese page completely. Exact hierarchy demand and the 170 second-level query complement broader TLD interest. JPNIC confirms local explanatory intent. |
| de / Germany 2276 / language 1001 | second level domain 210; top level domain 6600; domain ebenen UNKNOWN | Retain existing translation and repair contradictions. Most measured interest belongs to the separate TLD guide. Defer a full refresh to limit duplicate maintenance. |
| es / Spain 2724 / language 1003 | niveles de dominio 10; dominio de segundo nivel 40; dominio de nivel superior 30 | Retain existing translation with factual repairs. Defer full refresh because measured exact interest is smaller and coverage already exists. |
| fr / France 2250 / language 1002 | domaine de second niveau 10; domaine de premier niveau 50; niveaux de domaine UNKNOWN | Retain and repair. Defer full refresh. |
| ar / Egypt 2818 / language 1019 | نطاق المستوى الأعلى 10; other two queries UNKNOWN | Retain and repair. Evidence does not justify a full refresh. |
| hi / India 2356 / language 1023 | All three query metrics UNKNOWN | Retain and repair. Defer full refresh pending usable demand. |
| ta / India 2356 / language 1130 | All three query metrics UNKNOWN | Retain and repair. Defer full refresh pending usable demand. |
| ko / South Korea 2410 / language 1012 | Request returned HTTPError | UNKNOWN, not zero. Retain and repair. Defer demand selection. |
| zh-CN / China 2156 / language 1017 | Request returned HTTPError | UNKNOWN, not zero. Retain and repair. Defer demand selection. |

The GSC supplement covers final web data from 2026-09-21 through 2026-10-18.
G50 has 866 observed impressions and one click across 187 matched rows.
Japan has one observed impression, Germany two, Spain six, and South Korea 315.
The small Japan observation does not establish market size. Ads supplies the demand basis.
Korean GSC interest warrants a future Ads retry, but does not substitute for the failed language-market request.
The package creates no new locale pages and deletes no existing translations.

## Existing translations receive targeted factual repairs

The eight remaining translations retain their existing prose and metadata.
The repairs replace ambiguous bare-label second-level definitions, fix registration-versus-use exclusivity, distinguish accredited registrars from registry agreements, and limit registrar requirements to gTLDs.
The repairs also remove unsupported Namefi comparative-feature claims.
The Japanese refresh covers every English body section, both tables, the image, all source links, the full URL example, and the registration caveats.
The Japanese translation uses native prose and localized metadata, alt text, tables, headings, and source labels.
No human native-language review or rendered production inspection occurred during this local package.
The other eight translations remain shorter than the updated English article by design; the package repairs contradictions without blanket retranslating them.

## Image inspection rejected the first attempt and accepted the second

The final new image is `content/assets/what-is-domain-01-hierarchy.jpg`, 1200×675.
Both English and Japanese reference the image.
The house inline generator used gpt-image-2 with high quality and the official composited Namefi logo.
Attempt 1 preserved the successful private response before parsing. Inspection found a cropped heading at the top, so the writer rejected the image.
Attempt 2 removed the heading and preserved its separate private response before parsing.
Final inspection confirmed all four correct labels, generous cream margins, the top-right official logo, no clipped objects, and the hierarchy arrows.
The final image has no cover caption reserve requirement because the image is inline.
The private response paths are `/private/tmp/namefi-stack48/27-what-is-domain/image-attempt1/resp.json` and `image-attempt2/resp.json`.
Immutable sanitized attempt usage accompanies this record. The attempt scripts never changed during execution.

## Local checks pass while remote operations remain forbidden

`bun run data:validate` passed with 37 existing warnings.
The validator checked 4055 files with zero locale mismatches and zero relationship mismatches.
`bun run lint:mdx` passed.
The focused link audit checked ten files with zero broken links, zero missing locales, zero locale mismatches, and zero relationship mismatches.
The audit reports one permitted Japanese fallback for `subdomain-vs-subdirectory`.
The package adds no manual canonical or hreflang keys. The existing renderer continues handling actual locale pages.
The expected real locale URLs are `https://namefi.io/r/{locale}/blog/what-is-domain/` for `en`, `ar`, `de`, `es`, `fr`, `hi`, `ja`, `ko`, `ta`, and `zh-CN`.
These are expected routes, not verified deployments. English remains x-default under existing renderer behavior.

The writer made no remote writes, pull requests, review requests, hosted CI runs, merges, or deployments.
The writer did not modify shared README, policy, or workflow files.
Session counters report the actual model as gpt-6.1-sol. Counters remain cumulative and include cached input within input totals.
Some checkpoint labels combine adjacent transitions. The research-end/writing-start checkpoint was captured after the initial English write, so it cannot isolate exact English writing usage.
The initial images-end label predates retry 2. The final completion checkpoint records the later boundary.
No missing component is reported as zero. Exact per-stage token attribution is unavailable where boundaries overlap.
