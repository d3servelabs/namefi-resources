# G21 clarifies free-domain commitments and renewal control

This package updates the existing English `free-domain-offers` guide.
The author retained the established title, slug, date, and relationships.
The author added a dated provider comparison, illustrative cost arithmetic,
and a distinction between a lifetime benefit and a prepaid registration term.
The arithmetic uses fictional prices and does not represent provider quotes.

The author compared `domain-vs-hosting` and
`how-much-is-a-domain-understanding-holding-cost` for overlap.
Those articles explain service separation and general holding costs.
This article keeps the narrower promotion, redemption, and exit decision.

## The author opened the primary sources before changing claims

The author fetched the following pages on October 21, 2026, America/Los_Angeles.
The UTC research session crossed midnight into October 22.

| Source | Verified passage and use |
| --- | --- |
| [Wix voucher](https://support.wix.com/en/article/free-domain-voucher) | Initial qualifying yearly/multi-year plans, two-month redemption, payment details, extension list, transfer use, no retroactive refund, privacy exclusion. |
| [WordPress.com credit](https://wordpress.com/support/domains/register-a-free-domain/) | New annual plans, nonexpiring credit, transfer year, no existing-domain renewal, four-extension upgrade credit, cancellation deductions. Page review date: August 19, 2026. |
| [WordPress.com renewal](https://wordpress.com/support/domains/renew-a-domain/) | Separate hosting renewal, owning-account requirement, auto-renew controls, most registrations limited to ten years total. Page review date: August 11, 2026. |
| [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Public repositories on GitHub Free, default github.io addresses, custom-domain support. |
| [ICANN transfer FAQ](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en) | Questions 3, 6, and 8: transfer locks, authorization codes, distinction from hosting changes. |

The article links claims directly to these sources.
No current numeric provider price or universal country eligibility claim was added.

## Three candidate markets have demand but need different offer coverage

The three `ads-*.json` files preserve exact requests and responses.
Each file includes keywords, returned close variants, averages, and monthly series.
Google Ads API v26 used Namefi MCC 3505976042 and `GOOGLE_SEARCH`.
The returned period spans October 2025 through September 2026.
Fetch timestamps fall on October 22 UTC, October 21 in Los Angeles.
The author did not add overlapping keyword estimates together.

| Content locale and region | Language and country targets | Returned average monthly estimates | Decision |
| --- | --- | --- | --- |
| es, Mexico | 1003; 2484 | `dominio gratis` 1000; `dominio gratis para siempre` 50; `registrar dominio gratis` 30 | Defer. Mexico results emphasize local bundles. A translation of two international examples does not yet answer that offer comparison. |
| de, Germany | 1001; 2276 | `domain kostenlos` 390; `kostenlose domain` 1000; `domain dauerhaft kostenlos` UNKNOWN | Defer. German results include continuing bundle benefits, requiring local cancellation and renewal terms beyond this manuscript. |
| ja, Japan | 1005; 2392 | `無料 ドメイン` 1900; `独自 ドメイン 無料` 590; `ドメイン 永久 無料` 40 | Defer. Japanese results emphasize local continuing hosting benefits. A complete offer comparison needs provider-specific renewal and cancellation evidence. |

German UNKNOWN means the returned result lacks metrics, not zero searches.
Japanese returned close variants preserve the submitted forms in the JSON.
One Japanese request returned HTTP 429. One later retry succeeded.

Local-language search inspection used these exact queries:
`dominio gratis para siempre México dominio gratis`,
`domain dauerhaft kostenlos Deutschland`, and `独自ドメイン 無料 永久 日本`.
Search retrieval did not enforce a physical country location or record rankings.
The intent assessment is therefore provisional, not a localized rank measurement.

The author opened [Hostinger Mexico](https://www.hostinger.com/mx/dominios-gratis),
[IONOS Germany](https://www.ionos.de/domains/kostenlose-domain), and
[Onamae Japan](https://www.onamae.com/server/rs/domain/?btn_id=rs_submenu_domain).
Hostinger describes qualifying annual bundles and ordinary renewal afterward.
IONOS distinguishes ongoing included domains from promotional registrations.
Onamae conditions continuing renewal benefits on server use.
These sources support the need for region-specific offer coverage.
An Xserver fetch failed with HTTP 503 and supplies no verified claim.
The mxc.mx page did not expose useful body text and supplies no verified claim.

The GSC supplement covers September 21 through October 18, 2026.
G21 has no matching observed query/page/country rows.
The absent rows do not establish zero market demand.
The private whole-site GSC file remains outside this package.

The author selected no new translations and found no existing translations.
The author used no universal threshold and no English volume proxy.
A future localized comparison needs complete local offer terms and stronger local SERP evidence.
Other locale/region combinations remain unassessed, with UNKNOWN demand.

## The local package preserves image and execution evidence

The image manifest records the actual generated replacement and reused assets.
The author reviewed parent README files and found no inventory change necessary.
The author changed no shared README or policy file.
The usage checkpoints preserve actual emitted model counters and timestamps.
Counters can lag phase actions and are not precise billing attribution.
Image API usage remains separate from writing counters.

Expected URL: https://namefi.io/r/en/blog/free-domain-offers/
The package adds no language alternates or unsupported SEO metadata.
The renderer remains responsible for the English canonical and x-default behavior.
The author performed no deployment verification during local-only preparation.
Remote publication remains gated by the coordinator.
