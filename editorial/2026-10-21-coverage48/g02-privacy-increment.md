# G02 strengthens the existing resolver guide without creating a duplicate

The root approved deduplication into G01 on 2026-10-22 UTC.
The original proposed slug was public-dns-privacy-comparison.
The actual English target is choose-public-dns-resolver.
The original base for this incremental package is 09bfbad707ca7505206e2e1234bab9ffbd704870.
The batch therefore has 48 topic packages and 47 unique English URLs.

## The existing page already served the proposed reader intent

The writer read the complete choose-public-dns-resolver and dns-over-https-vs-dns-over-tls articles before changing content.
The selection guide already compared all three providers, their privacy commitments, logs, APNIC, ECS and encryption boundaries.
The transport guide already covered resolver visibility, traffic analysis and fallback.
The writer reported overlap before editing and waited for root approval to strengthen the existing page.
The update preserves G01 address tables, decision process, performance guidance and existing German translation.

## The update distinguishes stored data and policy exceptions

The writer opened the following primary sources on 2026-10-22 UTC:

- https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/ supports ordinary 25-hour deletion, sampled packet exceptions, indefinite aggregate data and APNIC access without client IP.
- https://developers.google.com/speed/public-dns/privacy supports temporary deletion processes, permanent sampled fields, and security/abuse exceptions for retention and cross-service association.
- https://quad9.net/privacy/policy/ supports normal volatile address processing, aggregate counters, permanent aggregate retention and aggregate-data licensing.
- https://quad9.net/privacy/anomalous-conditions/ supports diagnostic collection for software/protocol faults as well as attacks, and permanent archives of cause-related query information.

The guessed /privacy/policy/anomalous/ address failed and supplied no evidence.
The writer added exact inline policy links and the actual anomalous-policy URL to both locale source lists.
The writer checked the new claims against opened policies. The writer did not conduct a separate code review or re-audit every unchanged claim.

## Direct market evidence supports no new translation

The writer validated German criterion 1001 and French criterion 1002 against the official Google Ads codes table before requests:
https://developers.google.com/google-ads/api/data/codes-formats

The direct historical-metrics requests used Namefi MCC 3505976042, GOOGLE_SEARCH, German/Germany geo 2276 and French/France geo 2250 separately.
The sanitized request and complete returned data live in g02-ads-de-DE.json and g02-ads-fr-FR.json.
The fetch date is 2026-10-22 UTC.
The reported series covers October 2025 through September 2026.

| Market | Queries | Result | Decision |
| --- | --- | --- | --- |
| German/Germany | quad9 datenschutz; dns anbieter datenschutz; cloudflare oder quad9; google dns datenschutz; dns server ohne logs | All five results omitted keywordMetrics. Demand is UNKNOWN, not zero. No close variants appeared. | Repair the existing German section for factual parity. The repair does not require new demand qualification. |
| French/France | dns vie privée | Average 10 monthly searches. Every returned monthly value is 10. No close variants appeared. | Defer a new French version. The broad phrase has relevant intent, but the narrow comparison has weak measured support relative to maintaining the complete guide. |
| French/France | quad9 confidentialité; comparatif dns confidentialité; cloudflare ou quad9; google dns confidentialité | All four results omitted keywordMetrics. Demand is UNKNOWN, not zero. | Defer. |

A French search for DNS privacy with the provider names returned provider privacy pages and comparison-oriented material. The writer used the result mix only as qualitative intent evidence, not factual article evidence or a local volume estimate.
The specific source-language search was DNS vie privée Quad9 Cloudflare confidentialité France.
GSC's supplied exact-proposed-slug G02 aggregate had no observed matching rows for 2026-09-21 through 2026-10-18. The proposed page did not exist, so the absence cannot measure market demand.
Other locales remain unmeasured and deferred. The writer did not infer demand from English keywords.

## The existing German article receives the same factual changes

The German revision faithfully translates the new English section, table, citations, image alt text and source note.
The German revision preserves all prior prose outside the changed section and source note.
The writer compared every changed translation unit with English and checked German prose and terminology.
The writer did not claim native human LQA, external review or a rendered-page check.
Ordered related links remain unchanged and use /de/.
English is x-default. The actual locale URL set remains:

- https://namefi.io/r/en/blog/choose-public-dns-resolver/
- https://namefi.io/r/de/blog/choose-public-dns-resolver/

The renderer owns canonical and hreflang generation. No unsupported SEO keys were added.
The writer did not run deployed checks because the package remains local.

## One new image illustrates the data categories

The package adds content/assets/choose-public-dns-resolver-06-privacy-fields.jpg.
Both locale revisions reference the new image.
The existing cover and five existing inline illustrations remain relevant and unchanged.
The new image uses the repository inline generator, gpt-image-2, high quality, native 1536 × 1024, final 1200 × 675.
The private attempt script adapts the safe header handling from the earlier house harness and copies the complete response before parsing.
The immutable complete successful response remains private at /private/tmp/namefi-stack48/25-public-dns-privacy-comparison/image-attempt1.response.private.json.
The sanitized API usage lives in g02-image-attempt1.usage.json.
Only one attempt ran. No response or usage was lost. The writer never edited a running generation script.
The response omitted model, so response model is UNKNOWN. The request explicitly set gpt-image-2.
The API returned input 475 tokens, output 5488 tokens, total 5963 tokens. Image input was 0 and image output was 5488.
The writer opened the final JPEG and inspected every label, all edges, logo and cream reserves.
The image passes spelling, centered margins, no cutoff, official top-right logo, light dot-grid background and conceptual meaning checks.
The illustration presents categories, not identical storage by all providers. Adjacent text states the distinction.
The final JPEG SHA-256 is c9b9ebed24ddd44d0df96fa640894e0290e39f40ab0ee64482ea16d14b30e17c.

## Local sanity checks support the incremental package

The writer ran bun install --frozen-lockfile, data:validate, lint:mdx, focused two-file link audit and git diff --check.
Data validation passed with 37 warnings, 4066 files, zero locale or relationship mismatches and matching FAQ frontmatter.
MDX lint passed.
The focused audit passed with zero broken, missing-locale, locale-mismatch or relationship-mismatch links.
Two existing German links intentionally use runtime English fallback: isp-dns-vs-public-resolver and benchmark-dns-for-gaming.
The writer confirmed referenced image existence and final dimensions.
The writer did not push, create a PR, trigger review, invoke hosted CI, merge or publish.

## Usage counters preserve known boundaries and gaps

The canonical agent path is /root/stack48_coordinator/coverage48_25_g02.
The actual emitted session model is gpt-6.1-sol.
The companion checkpoint JSON retains actual cumulative token counters and event timestamps.
The cached-input value is part of input. Reasoning output is part of output. Neither value should be added again.
Research-start and overlap-research-end checkpoints precede root's changed-scope decision.
Images-start, writing-start and combined English-writing/German-repair-end checkpoints follow the scope change.
The English and German edits ran in the same script. Separate per-language token boundaries are unavailable.
The writer does not label cumulative session totals as exclusive article token usage.
