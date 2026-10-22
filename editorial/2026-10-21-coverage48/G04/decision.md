# G04 improves the existing ISP resolver comparison

The writer updated `content/blog/en/isp-dns-vs-public-resolver.md` on October 21, 2026, America/Los_Angeles. The writer retained the title, slug, reader task, and existing relationship lists. The update distinguishes ISP address discovery from resolver replacement, documents the Xfinity view-setting limitation without inventing an unsupported edit procedure, and explains that Google addresses are not ISP addresses. The new device-test illustration replaces the fourth inline reference. The previous fourth asset remains available for historical consumers.

## The measured demand supports English and defers new translations

`demand.json` preserves each exact request and response, returned close variants, averages, monthly series, language, geography, network, and UTC fetch time. Google Ads v26 supplied historical metrics through Namefi MCC 3505976042. The request used GOOGLE_SEARCH, separate country and language targets, and the default API historical window. Returned monthly series identify the actual period. Missing metrics are UNKNOWN, not zero. The official Google Ads language table confirmed every language criterion before requests. Two 429 responses interrupted the sequence. Later requests completed the remaining markets. The failures did not replace successful records.

| Locale and region | Observed average monthly searches | Decision and intent |
| --- | --- | --- |
| en / United States | Spectrum DNS servers 880; Comcast DNS 720; Xfinity DNS 720; AT&T DNS servers 590; ISP DNS vs public DNS 10 | Update the existing English page. Provider queries require an explicit distinction between address discovery and comparison. Do not add close-variant groups into an inflated total. |
| es / United States | Native Xfinity and comparison queries UNKNOWN | Defer. No measured Spanish comparison demand supports the maintenance cost. UNKNOWN does not establish absence of demand. |
| es / Mexico | DNS Telmex 210; comparison and provider-change phrases UNKNOWN | Defer. Results emphasize Telmex modem-specific setup and outage recovery. A direct translation would retain US equipment examples and omit the model-specific job. |
| de / Germany | Telekom DNS server 880; DNS Anbieter wechseln 10; direct comparison UNKNOWN | Defer. Results emphasize Telekom/Speedport addresses, controls, and faults. The small generic change query does not justify a broad comparison translation without local equipment coverage. |
| fr / France | DNS Orange 720; comparison/change phrases UNKNOWN | Defer. Results emphasize Orange address lists, Livebox controls, and troubleshooting. A comparison translation would not satisfy the central device-specific job. |
| zh-CN / China | ISP DNS 10; change DNS 10; direct comparison UNKNOWN | Defer. The broad change query also overlaps the existing resolver-selection and setup guides. The narrow evidence does not justify another complete locale page. |
| ja / Japan | Two native ISP comparison/change phrases UNKNOWN | Defer. The sample does not establish sufficient relevant measured demand. |
| ko / South Korea | Two native ISP comparison/change phrases UNKNOWN | Defer. The sample does not establish sufficient relevant measured demand. |
| ar / Egypt | Two native ISP change/provider phrases UNKNOWN | Defer. The sample does not establish sufficient relevant measured demand. |
| hi / India | Two native ISP/change phrases UNKNOWN | Defer. Hindi criterion 1023 was used. The sample does not establish sufficient relevant measured demand. |
| ta / India | Two native ISP/change phrases UNKNOWN | Defer. Tamil criterion 1130 was used. The sample does not establish sufficient relevant measured demand. |

The writer inspected web search results for Telmex, Telekom and Orange native queries. Search results supplied intent evidence only, not published technical claims. Relevant result URLs included `https://roams.mx/companias-telefonicas/telmex/guias/internet/dns/`, `https://communaute.orange.fr/t5/ma-connexion/Livebox-4-fibre-Comment-changer-de-serveur-DNS/m-p/1122078`, and the Telekom community Speedport Hybrid DNS discussion. The search tool does not expose a guaranteed country-specific Google SERP, so locale ranking and exact Google result order remain unavailable. The conservative decision does not claim market exhaustiveness.

The supplied GSC supplement observed no matching rows for this article during September 21–October 18, 2026. `gsc.json` preserves the scoped aggregate and limitations. Missing GSC rows do not establish zero market demand. No existing translations exist at the assigned base, so the update exposes no translation contradictions.

## Opened primary sources support the added and retained distinctions

The writer opened these sources on October 21, 2026, America/Los_Angeles (October 22 UTC):

- https://www.xfinity.com/support/articles/xfi-advanced-settings — the DNS Server row describes viewing the network configuration. The article does not infer a universal inability to edit every Comcast product.
- https://developers.google.com/speed/public-dns/docs/using — operator change, Google addresses, device/router procedures, and rollback preparation.
- https://developers.google.com/speed/public-dns/privacy — operator-specific temporary/permanent logging policy and advertising-use limits.
- https://developers.google.com/speed/public-dns/docs/performance — network latency, caching, and cache misses.
- https://developers.cloudflare.com/1.1.1.1/encryption/ — DoH and DoT support.
- https://datatracker.ietf.org/doc/html/rfc9076 — resolver visibility, network paths, and transport privacy limits.
- https://developers.google.com/google-ads/api/data/codes-formats — exact Ads language IDs.

The existing public-resolver selection guide and targeted-nslookup guide cover adjacent provider selection and command syntax. The update preserves the assigned ISP-versus-replacement comparison rather than duplicating either guide.

## The package includes one new inspected illustration

The writer used a private immutable copy of the repository inline generator, `gpt-image-2`, and high quality. The copy retains the successful full API response before parsing and saves immutable sanitized usage. The writer did not edit the running attempt. Attempt 1 succeeded with 455 input tokens and 5,488 output tokens, total 5,943. `image-usage.json` preserves returned detail fields and the final hash.

The final JPEG measures 1200 × 675. Visual inspection passed spelling, logo placement, framing, margins, and factual meaning. The cover and inline images 01–03 remain relevant and were visually inspected through the prior contact sheet. The old 04 asset remains unchanged but no longer appears in this article. No regeneration or lost usage occurred.

## Local sanity confirms the content package

The writer ran data:validate, lint:mdx, and the focused article link audit. Data validation passed with 37 existing warnings. The article link audit reported zero broken links, missing locales, locale mismatches, relationship mismatches, or fallback warnings. The writer verified all referenced image files and dimensions. Shared README files need no content change because collection structure and asset conventions remain unchanged. The writer did not run hosted CI or review tools.

The actual locale URL set contains only `https://namefi.io/r/en/blog/isp-dns-vs-public-resolver/`. English remains the source and x-default target. No new alternate locale exists. The application owns canonical and hreflang rendering; deployed verification remains pending because this package is local only.

The actual model reported by the session counters is `gpt-6.1-sol`. `usage-checkpoints.json` preserves emitted cumulative counters with event timestamps. Research and image work overlapped. The initial research-end checkpoint preceded the final rate-limit recovery, so a separate research-complete checkpoint records completion. Translation was not selected and has no translation execution usage. No unavailable component is represented as zero.
