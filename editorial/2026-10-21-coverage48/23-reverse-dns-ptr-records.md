# This update separates SMTP banner warnings from outbound identity checks

The writer updated existing English article `reverse-dns-ptr-records` for source G15, order 23.
The article keeps its established title, slug, ownership boundary, examples, and related links.
The new section answers the measured English banner-mismatch query without duplicating the general record-type or nslookup guides.
The writer read both adjacent guides before editing.

## Primary sources define the new SMTP distinction

The writer opened RFC 5321 sections 3.1, 3.2, and 4.1.4 on 2026-10-21.
The receiving server announces the SMTP greeting, while the sending client supplies EHLO.
Section 4.1.4 limits rejection based solely on an EHLO-to-IP verification failure.
The article states that narrow limit separately from Gmail's published DNS requirements.

The writer opened MxToolbox's own SMTP Banner Check and SMTP Reverse DNS Mismatch explanations.
The article now distinguishes a greeting warning from evidence about an actual rejected outbound connection.
The new table assigns PTR, forward DNS, greeting, and EHLO settings to the responsible administrator.
All new technical claims link directly to primary sources in the article.
The writer also reopened all retained source documents and found no material contradiction requiring a correction.
Private source notes remain under `/private/tmp/namefi-stack48/23-reverse-dns-ptr-records/sources-opened.json`.

## Measured demand supports an English-only package

The demand sidecar retains four actual Google Ads historical-metrics responses.
Each response retains the request, language, geography, network, fetch time, close variants when returned, and monthly series.
The reported monthly series spans October 2025 through September 2026.
The writer verified German criterion 1001 and Spanish criterion 1003 against Google's official language table before requesting metrics.
Germany uses geography 2276, and Spain uses geography 2724.

German lookup and setup phrases return average monthly values of 10 each.
The educational phrase `was ist reverse dns` returns 20.
Spanish `dns inverso` returns 70, `registro ptr` returns 40, and `comprobar dns inverso` returns 10.
Explicit Spanish guide/configuration phrases return no metric fields.
Missing metric fields mean UNKNOWN.
The writer does not add query volumes as independent audiences.

The native result inspection found lookup-tool intent in both candidate markets.
The writer checked a German provider's PTR checker and Microsoft's Spanish reverse-lookup guide as primary intent examples.
The inspection also found multiple Spanish lookup tools.
This result supports keeping Spanish as a future candidate, while deferring a full translated maintenance commitment during this batch.
The choice is an editorial judgment about article fit and maintenance cost, without a universal volume threshold.

The supplied GSC supplement has no matching observed rows for G15 during 2026-09-21 through 2026-10-18.
Missing GSC observations do not establish zero demand.
Other locales remain unmeasured and deferred as UNKNOWN.
No existing translations exist for the assigned slug, and the writer created no new translation.

## One generated image explains the new diagnostic section

The package adds `content/assets/reverse-dns-ptr-records-05-smtp-identity.jpg`.
The writer used the repository inline illustration harness with GuestSafe injection, `gpt-image-2`, and high quality.
The writer copied the harness into private scratch before execution and preserved the full successful response before parsing.
The image required one generation attempt.
The immutable usage sidecar records 485 input tokens, 5,488 output tokens, and 5,973 total tokens.

The initial 16:9 crop placed the heading too near the upper edge.
The writer reprocessed the same generated PNG to 1200 × 800, preserving the original composition and official logo.
The writer inspected the final JPG for spelling, margin, cropping, logo placement, and factual meaning.
The final JPG passed every applicable inline-image check.
The existing cover and four still-relevant illustrations remain in use.

## Local sanity checks pass for the topic package

`TMPDIR=/private/tmp bun run data:validate` passed with 37 existing warnings.
The validator checked 4,055 files with zero locale or relationship mismatches.
`bun run lint:mdx` passed.
The focused link audit passed with zero broken links, locale mismatches, or relationship mismatches.
The writer confirmed every referenced image exists and checked the final image dimensions.
No code review, third-party review, hosted CI, remote write, pull request, merge, or publication occurred.

The expected real locale URL is `https://namefi.io/r/en/blog/reverse-dns-ptr-records/`.
The renderer should keep English self-canonical and English x-default.
No new alternate-language page exists.
The writer did not verify deployment because the package remains local.

The writer considered the parent README files and found no structural change requiring a shared README edit.
The usage sidecar preserves actual emitted counters and explains overlapping phase boundaries.
No translation usage exists because the writer selected no translation.
