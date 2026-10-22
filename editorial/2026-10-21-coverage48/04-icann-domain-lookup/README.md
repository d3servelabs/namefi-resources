# G28 improves interpretation of incomplete ICANN results

The assignment updates `content/blog/en/icann-domain-lookup.md` in place.
The source page dates from October 21, 2026, so this change preserves the title, slug and reader task.
The additions distinguish missing fields from failed requests and map two EPP codes to their displayed RDAP labels.
The topic remains separate from the protocol comparison and domain-age guides.

## The writer defers Spanish translations for Spain and Mexico

The writer fetched direct Google Ads historical metrics on October 21, 2026.
`ads-ES.json` and `ads-MX.json` preserve requests, returned close variants and monthly series.
The period covers October 2025 through September 2026.
Each request uses Spanish `languageConstants/1003` and Google Search only.
Spain uses `geoTargetConstants/2724`. Mexico uses `geoTargetConstants/2484`.

| Returned keyword | Spain average | Mexico average | Intent assessment |
| --- | ---: | ---: | --- |
| icann lookup | 720 | 320 | Primarily navigation to the official tool |
| whois icann | 480 | 140 | Primarily navigation to registration lookup |
| datos de registro de dominio | 10 | 10 | Broad registration-data interest |
| consulta icann | UNKNOWN | UNKNOWN | No returned metric |
| buscar dominio icann | UNKNOWN | UNKNOWN | No returned metric |
| consulta de dominios icann | UNKNOWN | UNKNOWN | No returned metric |
| consultar propietario de dominio | UNKNOWN | UNKNOWN | No returned metric |

The response returns no close variants for these rows.
UNKNOWN means unavailable, never zero demand.
The writer does not add navigational metrics together as an article-demand estimate.

Spanish searches with explicit Spain and Mexico context returned the official lookup and ICANN guidance.
The Mexico-context search also returned a `.com.mx` RDAP tool.
The Spain-context search returned a `.es` hosting-provider nameserver guide.
The search tool did not guarantee country-locked ranking.
A direct Google request with `hl=es&gl=es` failed, so the writer does not claim a verified local ranking.
Observed results support tool-seeking intent but do not establish sufficient demand for this interpretation guide.
The writer defers both evaluated markets because explanatory demand remains uncertain and a full translation adds maintenance work.
The decision uses no universal volume threshold.
Other locales remain unevaluated, rather than rejected.

Searches used `"whois icann" España consulta dominio` and `"consulta icann" México dominio`.
Observed destination examples include:

- https://lookup.icann.org/whois/es/?q=lsc.us
- https://www.icann.org/resources/pages/search-2013-03-22-es
- https://ecosistemadigital.com.mx/herramientas-gratuitas/verificador-dominio/
- https://hostico.es/faq/como-puedo-ver-que-nameservidores-estan-alocados-a-mi-dominio/

`gsc-supplement.json` contains only relevant observed Spain/Mexico ICANN rows.
The final web-data period runs September 21 through October 18, 2026.
The supplement contains no exact lookup-intent match for the two markets.
The broader ICANN rows do not prove demand for the assigned article.
Missing observed rows do not mean zero market demand.

## Opened primary sources support the additions

The writer opened the following primary sources on October 21, 2026.
The writer also read the complete existing article and the overlapping WHOIS/RDAP and domain-age guides.

| Source | Relevant support |
| --- | --- |
| https://www.icann.org/en/contracted-parties/registry-operators/registration-data-access-protocol/information-for-rdap-users-31-08-2018-en | Browser RDAP client, current WHOIS scope |
| https://datatracker.ietf.org/doc/html/rfc9083#section-4.5 | Event actions, dates and object context |
| https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en | EPP-to-RDAP mapping, transfer prohibition and DNS hold |
| https://www.icann.org/rdrs-en | Nonpublic data requests and participating registrars |
| https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en | Public lookup first, RDRS or direct registrar request afterward |
| https://www.icann.org/es/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-es | Spanish terminology and official lookup recommendation |

The recovery table gives editorial investigation steps, not guaranteed causes.
No lookup result serves as proof of availability or seller identity.
The writer did not claim a live lookup of the hypothetical domain.
The FAQ endpoint returned no readable body and supplied no factual support.

## The package preserves images and records actual usage

`images.json` lists five reused assets and one generated 1200 × 675 asset.
The new recovery illustration uses the repository inline generator and official logo.
The scratch adaptation changes credential transport to an inherited header file descriptor and saves API usage.
The image passed visual inspection on the first attempt.
The actual API usage totals 5,926 tokens: 438 input tokens and 5,488 output tokens.
The API did not return a model identifier, so the manifest separates the requested model from the response.
`phases.json` records available checkpoints and identifies unavailable phase-entry times.
Writer token counters remain unavailable in this agent context.

## The local handoff keeps remote operations closed

Expected published URL: `https://namefi.io/r/en/blog/icann-domain-lookup`.
The locale set remains English only. The renderer owns canonical and language-alternate behavior.
No translated file or invented SEO frontmatter key enters this package.
Shared README files need no functional changes because the directory roles remain accurate.
The writer does not push, open a pull request, run hosted CI, request review, merge or release.

Local `data:validate` passed with 37 warnings. Local `lint:mdx` passed.
The focused link check reported zero broken links and zero locale or relationship mismatches.
`sanity.json` preserves the results. Scratch logs remain under `/private/tmp/namefi-stack48/04-icann-domain-lookup/`.
