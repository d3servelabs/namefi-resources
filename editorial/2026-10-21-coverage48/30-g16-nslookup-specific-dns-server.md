# G16 adds a transport check and a Japanese translation

The writer updated the existing English article at the existing slug.
The English title and reader task remain unchanged.
The added section records the port and compares TCP with the previous query.
The section separates nslookup results from application behavior.
The work started from `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.

## Opened primary sources support the article

The writer opened the following sources on 2026-10-21 in America/Los_Angeles.
Microsoft Learn returned substantive documentation despite a generic authorization notice in the page chrome.
The notice did not replace the command documentation.

- [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup) supplies argument order, interactive mode, suffix handling, and errors.
- [Microsoft set type](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-type) supplies record selection and the Windows default.
- [Microsoft server](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-server) explains the current-server lookup dependency.
- [Microsoft set recurse](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-recurse) explains recursion settings.
- [Microsoft set port](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-port) supplies syntax and default port 53.
- [Microsoft set vc](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-vc) supplies the virtual-circuit selector.
- [ISC BIND manual](https://bind9.readthedocs.io/en/latest/manpages.html#nslookup-query-internet-name-servers-interactively) supplies argument order, implementation differences, and type defaults.
- [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html) supplies header flag distinctions.
- [RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html) supplies negative-answer distinctions and caching.
- [RFC 9520](https://www.rfc-editor.org/rfc/rfc9520.html) supplies failure categories and alternate-transport retry context.

The existing `choose-public-dns-resolver` article addresses provider selection.
The current article addresses targeted diagnostic queries.
The update therefore keeps the existing URL and avoids a second article.
No existing translation of this slug existed at the source revision.
The update exposed no material contradiction in an existing translation.

## Google Ads demand supports Japanese for Japan

`30-g16-demand.json` preserves requests, returned variants, averages, and monthly series.
The records use Google Search and separate country and language criteria.
The historical series covers October 2025 through September 2026.
The actual API fetch timestamp appears in each market record.
The fetch occurred on 2026-10-21 in America/Los_Angeles.

The writer checked language IDs against the [official Google Ads table](https://developers.google.com/google-ads/api/data/codes-formats) before requesting metrics.
Japanese uses 1005, German uses 1001, and French uses 1002.
Country targets are Japan 2392, Germany 2276, and France 2250.

| Pair | Returned query | Average monthly searches | Decision |
| --- | --- | --- | --- |
| Japanese / Japan | nslookup dns サーバ 指定 | 110 | Select Japanese |
| Japanese / Japan | nslookup サーバ 指定 | 260 | Select Japanese |
| German / Germany | nslookup bestimmter dns server | 10 | Defer German |
| German / Germany | nslookup dns server angeben | 50 | Defer German |
| French / France | Three requested native phrases | UNKNOWN | Defer pending usable metrics |

The Japanese queries directly match the article's command task.
The writer did not add their averages or treat variants as independent audiences.
Japanese has stronger measured intent coverage than the tested German phrases.
The writer selected one locale to limit ongoing maintenance.
The decision does not apply a universal numeric threshold.
Other returned queries without metrics remain UNKNOWN.
Untested languages and regions remain unmeasured.

The writer searched Japanese queries and opened [Microsoft's Japanese command reference](https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/nslookup).
The writer also opened [Microsoft's Japanese troubleshooting guide](https://learn.microsoft.com/ja-jp/windows-server/networking/dns/troubleshoot/troubleshoot-dns-server).
Both pages address server-specific diagnostic commands.
These results support Japanese technical intent and terminology.
They do not establish a location-personalized Japanese ranking.

The GSC supplement contains no matching observed rows for this slug.
The GSC period is 2026-09-21 through 2026-10-18.
Missing rows do not establish zero market demand.
The committed demand record preserves that limitation.

## The renderer supports the selected locale

The writer inspected local Astra `apps/resources/src/i18n-config.ts`.
The supported locales are `en es de fr zh-CN ar hi ko ja ta`.
The writer inspected `apps/resources/src/app/[lang]/blog/[slug]/page.tsx`.
The renderer creates self-canonical URLs and advertises only actual translations.
The renderer uses English for x-default when English exists.
No runtime changes or extra SEO frontmatter fields were necessary.

Expected URLs after a separately authorized deployment:

- https://namefi.io/r/en/blog/nslookup-specific-dns-server
- https://namefi.io/r/ja/blog/nslookup-specific-dns-server

The local package expects reciprocal `en` and `ja` alternates.
The local package expects English x-default.
The writer has not verified deployment or live metadata.

## The Japanese translation preserves the English content

The translation addresses Japanese technical readers in Japan.
The translation uses neutral explanatory prose and faithful technical translation.
The writer used the repository termbase for DNS, resolver, nameserver, TTL, and DNSSEC anchors.
Microsoft's Japanese documentation supplies additional usage context for server, query, and timeout terminology.
The translation preserves every code block, ordered relationship slug, citation URL, and image reference.
The translation localizes metadata, headings, table labels, source notes, and alternative text.

The structural check found six headings, five inline images, and equal code blocks in both languages.
The ordered citation URLs match exactly.
The paragraph totals are 68 English and 67 Japanese.
A blank line before the final English source bullets explains the grouping difference.
The writer checked section coverage and the NXDOMAIN, NODATA, SERVFAIL, DNSSEC, timeout, and REFUSED distinctions.
No independent or native reviewer participated, as requested.
Rendered desktop/mobile LQA remains unperformed.

## One generated image supports the new section

The writer used the repository `namefi-resource-images` inline generator.
The writer adapted an immutable scratch copy to preserve the complete private response.
The image uses `gpt-image-2`, quality `high`, and the official composited Namefi logotype.
The new asset is `content/assets/nslookup-specific-dns-server-05-transport.jpg`.
Both language versions reference the new asset.
The final dimensions are 1200 × 675 pixels.

Attempt 1 succeeded without regeneration.
The returned usage is 462 input tokens and 5,488 output tokens, totaling 5,950 tokens.
`30-g16-image-usage.json` preserves the complete returned usage structure.
The private response remains under `/private/tmp/namefi-stack48/30-nslookup-specific-dns-server/image-attempt1-private/resp.json`.
The immutable script remains in the same scratch directory's parent.
The writer did not edit the script during execution.

The writer opened the final generated image and all five reused assets.
The new image has legible labels, clear cream margins, and no clipping.
The official logo occupies the empty upper-right corner.
The UDP 53 and TCP 53 paths connect the same question and server.
The cover and four existing section images remain useful.
The image manifest records their sizes and individual inspection outcomes.

## Local sanity passed without remote operations

- `bun run data:validate` passed with 37 existing corpus warnings.
- The locale check covered 4,056 files with zero locale or relationship mismatches.
- `bun run lint:mdx` passed.
- The focused link audit covered both articles with zero broken links or locale mismatches.
- The image check found every referenced asset at the expected path and dimensions.
- Code-block and ordered citation comparisons passed for Japanese.

The writer made no remote GitHub write, PR, review, hosted CI, merge, or deployment.
The package does not modify shared README, AGENTS, CLAUDE, or workflow files.

## Usage checkpoints preserve actual counters with timing limits

`30-g16-usage-checkpoints.json` preserves actual emitted counters for the full canonical agent path.
The observed model is `gpt-6.1-sol`.
The capture helper records cumulative session counters and token-event timestamps.
The writer does not label counter estimates as actual usage.
The first research capture follows initial instruction and repository reads.
The translation-end capture precedes the next emitted long-write counter.
A later translation-complete capture includes that emitted counter.
Image start lacks a dedicated pre-request checkpoint and remains unavailable as a token boundary.
The image API response preserves actual image usage independently.
The API response timestamp records image completion at 2026-10-22T01:14:58.920729+00:00.
