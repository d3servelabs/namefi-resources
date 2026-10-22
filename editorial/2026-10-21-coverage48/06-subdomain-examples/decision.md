# This update answers concrete subdomain questions

The writer updated G36 at the existing `subdomain-examples` slug on 2026-10-21.
The English title and reader job remain unchanged.
The update adds URL parts, misleading hostname examples, provider subdomain limits, record targets, known-host queries, and sourced retirement risks.
The sibling `subdomain-vs-subdirectory` page owns the full architecture and SEO comparison.
The sibling FQDN guide owns absolute names and search suffix troubleshooting.
The terminology guide owns the broader domain vocabulary.
No equivalent article was created.

## The writer defers Hindi and Tamil translations for India

The direct Ads v26 requests used Namefi MCC 3505976042 and `GOOGLE_SEARCH`.
The writer fetched the initial results on 2026-10-21 UTC.
The coordinator repeated the Hindi request with the correct language on 2026-10-22 UTC.
The raw sanitized request and response records live beside this file.
The records preserve every submitted and returned query, monthly estimate, and close-variant field returned by Ads.
Ads did not return a close-variant group for these requests.

| Locale and country | Separate targets | Returned demand | Decision |
| --- | --- | --- | --- |
| Hindi, India | languageConstants/1023; geoTargetConstants/2356 | `subdomain kya hai`: average 10, all twelve months 10. `subdomain kaise banaye`: average 10, August 2026 20, other months 10. Period October 2025–September 2026. | Defer. The measured terms fit introductory/setup intent, but the small observed demand does not yet justify maintaining a complete Hindi guide and its DNS/provider instructions. |
| Tamil, India | languageConstants/1130; geoTargetConstants/2356 | Four native-script query rows returned without keywordMetrics. The missing average and monthly series are UNKNOWN. | Defer. Ads provides no usable estimate for the submitted native queries. Terminology and actual query coverage need further market evidence before selection. |

Hindi native-script rows also lack keywordMetrics, so the writer does not treat Hindi native-script demand as zero.
The two Romanized Hindi queries express Hindi intent; the writer did not substitute an English keyword volume.
The writer did not sum overlapping query estimates or infer SEO difficulty from advertising competition.
Other locale and region pairs remain unevaluated, with demand UNKNOWN.
No new locale was selected. The assignment has no existing translations.

## Search results identify an opening without establishing its size

The writer searched `सबडोमेन उदाहरण क्या है` and `subdomain kya hai India` on 2026-10-21.
The results include Hindi provider help and Romanized Hindi guides.
[Tumblr's Hindi DNS instructions](https://help.tumblr.com/hi/dns-%E0%A4%AE%E0%A5%88%E0%A4%A8%E0%A5%87%E0%A4%9C%E0%A4%AE%E0%A5%87%E0%A4%82%E0%A4%9F/) supply blog and gallery examples beneath a parent domain.
The results also include cPanel setup tutorials and introductory lists.
An operationally precise examples guide could address the gap between a label, DNS, hosting and HTTPS.
The corrected request's small measured Romanized query demand supports revisiting Hindi after stronger relevant query or site visibility evidence.

The writer searched `துணை டொமைன் எடுத்துக்காட்டு` and `"சப்டொமைன்" இந்தியா`.
The first search returned mostly unrelated Tamil material; the second returned no relevant result in the tool response.
These observations do not prove absent demand or establish a useful opportunity.
The search tool did not expose a country-location control, so these are target-language, India-qualified intent observations, not a verified Google India rank sample.
A future decision needs India-localized Tamil SERPs and broader native query validation.

The sanitized GSC record shows no matched page/query/country rows for this slug.
The supplement covers final web data from 2026-09-21 through 2026-10-18.
The absence describes observed site visibility only.
The writer does not convert missing rows into a market-demand estimate.

## Primary sources support the changes

The writer opened the following sources on 2026-10-21 UTC.

- RFC 9499 section 2 defines whole-label subdomain relationships and CNAME aliases.
- Cloudflare's Create subdomain records guide supplies hosting acceptance, record types, redirects and HTTPS responsibilities.
- Cloudflare's Universal SSL limitations page distinguishes full setup from CNAME setup and deeper hostname coverage.
- MDN's cookie guide explains Domain scope and host-only cookies.
- GitHub's What is GitHub Pages page supplies the default provider hostname, project path, and public-repository Free availability.
- ISC BIND 9's dig manual supplies known-name lookup and record-type query syntax.
- Microsoft's dangling-DNS guide supplies the Azure resource retirement example. The tool displayed an authorization banner, but returned the full public explanatory article and remediation steps.

The publishable article links directly to the supporting pages.
The writer did not use search snippets to support technical claims.

## The local package preserves the authorized boundary

The writer ran only local content sanity and image checks.
The writer did not push, open or edit a pull request, run hosted CI, request code review, or create subagents.
The expected URL is `https://namefi.io/r/en/blog/subdomain-examples/`.
The only real locale is English, with English self-canonical and English x-default expectations.
The update does not add unsupported SEO frontmatter keys.
The existing README inventory remains accurate at its current level of detail.
The coordinator owns shared README changes.

## The coordinator corrected the Hindi request language

The initial Hindi record used Danish criterion `1009`.
Google lists Hindi as `1023`, Danish as `1009`, and Tamil as `1130` in its [official language table](https://developers.google.com/google-ads/api/data/codes-formats).
The coordinator marks the original response `INVALID_FOR_HINDI` in `ads-hi-invalid-danish-1009.json`.
The coordinator repeated the same five queries with Hindi `1023`, India `2356`, and `GOOGLE_SEARCH`.
The corrected response in `ads-hi.json` retains the returned twelve-month series and every omitted metric.
The corrected response still gives each Romanized query an average of 10 monthly searches.
The three native-script queries still omit metrics and remain UNKNOWN.
The corrected evidence retains the Hindi deferral and does not establish zero demand.
The English article, Tamil evidence, and published locale set do not change.
The correction uses one read-only historical-metrics request and creates no campaign, PR, or review.
The coordinator records actual cumulative usage checkpoints in `hindi-correction-usage.json`; these counters include shared coordination work and do not isolate an API bill.
