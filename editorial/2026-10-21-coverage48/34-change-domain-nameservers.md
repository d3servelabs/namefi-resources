# The nameserver article now includes direct comparison queries

G40, order 34, updates `content/blog/en/change-domain-nameservers.md` from base `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The existing title, slug, migration procedure, and relationships remain useful.
The update adds five nonrecursive `dig` examples, named-record coverage, provider-feature exceptions, and the delegation-versus-direct-query distinction.
The TTL, glue, DNSSEC, and primary-secondary articles already cover adjacent mechanisms. This update stays within the migration reader job.

## Direct market evidence supports deferring new translations

The companion demand JSON preserves exact requests, responses, monthly series, and missing fields.
Google Ads returned October 2025–September 2026 historical metrics on 2026-10-22 UTC (2026-10-21 Los Angeles).
Both requests used GOOGLE_SEARCH, separate country targets, and separate language targets.
The official Google Ads codes page confirmed German 1001 and Spanish 1003 before requests.
Germany used geoTargetConstants/2276; Mexico used geoTargetConstants/2484.

- German × Germany: `nameserver ändern` and `domain nameserver ändern` each averaged 10 monthly searches. These values may overlap and must not be added. `nameserver wechseln` and `nameserver umstellen` returned no keywordMetrics: UNKNOWN.
- Spanish × Mexico: `cambiar dns de dominio` averaged 10 monthly searches. The broader DNS wording may also mean record changes. The other three queries returned no keywordMetrics: UNKNOWN.
- Google Ads returned no explicit closeVariants fields. The record preserves the returned texts without inventing variants.
- GSC recorded no observed matching topic rows in its 2026-09-21–2026-10-18 supplement. GSC is supplemental site evidence, not a market census.

The writer opened [Baebeca's German nameserver instructions](https://www.baebeca.de/hilfe/rechenzentrum/domains/nameserver/) and [NubeHost's Mexican Spanish instructions](https://nubehost.mx/kb/hospedaje-web/como-cambiar-los-nameservers-dns-de-su-dominio) on 2026-10-21.
Both provider documents confirm an operational control-panel intent.
The measured explicit migration demand is small, the Mexican measured wording has mixed intent, and a full safety-sensitive translation needs ongoing maintenance.
The topic therefore remains English-only for this batch. This decision applies no universal volume threshold.
Other markets remain unevaluated, with UNKNOWN demand. The decision does not imply zero demand.
No existing translations exist, so this update exposes no sibling translation contradiction.

## Primary documents support the retained migration instructions

The writer opened RFC 1034 sections 4.2.1–4.2.2, RFC 6781 sections 4.3.3–4.3.5.2, RFC 2308 sections 3 and 5, AWS's migration procedure, Google's “If NS changed” section, Cloudflare's primary-zone setup, and ISC's stable dig manual.
The article preserves direct inline source URLs and fetch dates.
A direct shell fetch reached RFC, AWS, and Google sources. Cloudflare and ISC rejected the shell fetch; web opens supplied the actual source text instead.
The private scratch retains the successful downloaded source bodies and source manifest.
The added ISC citation supports server selection and +norecurse. The examples are illustrative read operations, not claims of live execution.
No live customer DNS changes occurred.

## The image package contains one new useful illustration

The new asset is `content/assets/change-domain-nameservers-05-compare-answers.jpg` (1200 × 675).
The writer used the repository inline generator with gpt-image-2 and high quality.
The writer adapted only private scratch response retention and paths before execution. The running attempt script remained unchanged.
Attempt 1 succeeded. The complete API response persisted privately before decoding.
Immutable usage: input 486 (text 486, image 0), output 5488 (image 5488, text 0), total 5974.
The API did not return a model identifier; the request specified gpt-image-2.
The private response lives at `/private/tmp/namefi-stack48/34-change-domain-nameservers/image-attempt1/resp.json`.
The private usage sidecar lives beside the response as `usage.json`.
The writer opened the final image and confirmed correct labels, complete objects, cream margins, and the official top-right logo.
The separate DS card communicates the separate DNSSEC plan. No regeneration was necessary.
The writer also inspected the existing cover and four existing inline assets in a contact sheet. The five existing assets remain relevant and readable.

## Local routing and sanity define the expected page

Astra's `src/i18n-config.ts` supports en, es, de, fr, zh-CN, ar, hi, ko, ja, ta.
Astra's `[lang]/blog/[slug]/page.tsx` builds self canonicals, real-translation hreflang entries, and English x-default.
The actual content tree contains only the English file for this slug.
The expected production URL is `https://namefi.io/r/en/blog/change-domain-nameservers`.
The expected development URL is `https://namefi.dev/r/en/blog/change-domain-nameservers`.
The expected real locale set is en. This local package makes no deployed-render verification claim.

Local `bun run data:validate` and `bun run lint:mdx` passed.
The focused article link audit passed with zero broken links and zero locale or relationship mismatches.
All six referenced image assets exist. The cover is 1200 × 630 and all five inline assets are 1200 × 675.
No remote writes, PR actions, reviews, hosted CI, merges, or publication occurred.
Shared README files describe the same directory roles; this change requires no shared README edit.

## Actual usage checkpoints retain their measurement limits

The companion usage JSON preserves metadata-only actual cumulative counters for the full canonical agent path.
The actual session model is gpt-6.1-sol.
Research-start, image-in-progress, combined research-end/writing-end, and image-end/sanity-start checkpoints exist.
A separate writing-start and exact image-start counter were not captured. Those stage boundaries are unavailable, not zero.
Research, writing, image generation, and sanity overlapped; counter differences must not be presented as isolated phase consumption.
No translation stage ran. Image API usage is separate from session counters.
