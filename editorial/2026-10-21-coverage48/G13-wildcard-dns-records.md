# This update makes wildcard DNS failures easier to diagnose

G13 / order 36 updates the existing English `wildcard-dns-records` article. The established title, slug, examples, source links and reader purpose remain appropriate. The English change adds wildcard CNAME target resolution and concrete `dig` commands. The added explanation distinguishes DNS status from command exit status. The neighboring `subdomain-examples` article explains naming hierarchy, while this article explains synthesis boundaries. No duplicate article is needed.

## Opened primary sources support the matching rules

The author opened RFC 4592, Cloudflare wildcard documentation, RFC 9525, RFC 2308, NGINX server-name documentation and the ISC BIND manual on 2026-10-21 America/Los_Angeles. RFC Editor plain-text requests for RFC 2308 and RFC 9525 returned 429; the author opened the full IETF Datatracker HTML instead. Failed requests supplied no evidence.

- RFC 4592 sections 2.1 and 2.2 define syntax and existing names. Section 3.3 defines closest-encloser selection, no broader fallback and CNAME synthesis. https://www.rfc-editor.org/rfc/rfc4592.txt
- Cloudflare documents the explicit-name boundary and the standard/advanced nameserver difference for implicit parents. https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/
- RFC 9525 section 6.3 defines one-label TLS wildcard matching. https://datatracker.ietf.org/doc/html/rfc9525#section-6.3
- RFC 2308 sections 2.2, 3 and 5 distinguish NODATA/referrals and define negative caching. https://datatracker.ietf.org/doc/html/rfc2308#section-2.2
- NGINX documents separate server-name precedence and multi-part wildcard matching. https://nginx.org/en/docs/http/server_names.html
- ISC BIND documents `+norecurse`, verbose output and successful command exit after NXDOMAIN. https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility

The update exposed no contradiction requiring repair in another existing translation. The base contains no translations of this article.

## German demand supports one complete translation

`G13-wildcard-dns-demand.json` preserves exact requests, returned variants, average searches and monthly series. Requests used GOOGLE_SEARCH and separate country/language targets. The author checked language IDs against Google's official codes page before querying: German 1001 and Japanese 1005. Germany uses geo 2276; Japan uses geo 2392. Data covers October 2025 through September 2026. Fetch date was 2026-10-21 local / 2026-10-22 UTC.

Germany/German returned `wildcard dns` at 140 average monthly searches and `wildcard subdomain` at 40. `dns wildcard eintrag` and `dns platzhalter` returned no metrics: UNKNOWN, not zero. German search results showed direct setup intent from IONOS, Variomedia and netcup. The author opened IONOS's German wildcard DNS setup page, confirming appropriate terminology and reader purpose: https://www.ionos.de/hilfe/domains/wildcard-dns-records-konfigurieren/wildcard-dns-record-erstellen/ . Select German for Germany because measured technical-query demand aligns with the article's diagnostic purpose. Borrowed technical queries do not establish the searcher's proficiency; German setup results provide supplemental language-intent evidence.

Japan/Japanese returned `ワイルド カード dns` and `ワイルド カード サブ ドメイン` at 20 each. The setup query returned UNKNOWN. Defer Japanese for this batch: the observed demand is materially smaller, and another full technical translation adds maintenance cost. This decision does not assert zero Japanese demand. Other locales remain unselected and unmeasured; no demand claim applies to those markets. No universal numeric threshold applies.

The GSC supplement observed no matching rows for this slug from 2026-09-21 through 2026-10-18. Missing rows do not measure total market demand.

## The German article preserves all source units

The target is standard German for technical operators in Germany. The translation retains every source paragraph, table, image, code span and citation. Repository termbase titles govern linked glossary terms. IONOS uses Wildcard-DNS-Record; the article consistently uses Wildcard-DNS-Eintrag in explanatory prose. Protocol tokens, domains and commands remain literal. The translation uses German punctuation and human-facing metadata.

Automated comparison found 5 headings, 5 inline images, 22 table lines and 74 nonblank body units in each language. Code-span multisets and external-link multisets match exactly. English body length is 2,087 whitespace words; German body length is 1,966. Source and target received an author accuracy and fluency pass. No independent or native-human language review occurred, per batch restrictions.

The author inspected the actual Astra `i18n-config.ts` and `[lang]/blog/[slug]/page.tsx`. Both `de` and `ja` are supported. The renderer creates self-canonical URLs, advertises actual source-language alternates only, and points x-default to English. Expected actual page set:

- https://namefi.io/r/en/blog/wildcard-dns-records
- https://namefi.io/r/de/blog/wildcard-dns-records

The expected hreflang set is en, de and English x-default. Deployment and rendered desktop/mobile checks remain pending because this package is local only. No unsupported locale file or manual SEO frontmatter was added.

## One new image supplements five reusable images

`G13-wildcard-dns-images.json` records dimensions, hashes and visual inspection. One actual `gpt-image-2` high generation produced `wildcard-dns-records-05-query-results.jpg` at 1200 × 675. The official logo sits at top-right. All domains and statuses match the explicit zone assumptions in the adjacent prose. The author opened the final image and all five retained assets. Every file remains readable, unclipped and relevant. The shared figures retain English labels; German alt text and surrounding prose explain each figure.

The author copied the repository inline generator into an immutable attempt script. The script saved the complete private API response before parsing, and saved a separate usage sidecar. One attempt succeeded. The API returned input 460, output 5,488, total 5,948 tokens. Returned model was absent; requested model was gpt-image-2. No attempt usage is missing. Private raw response and script remain under `/private/tmp/namefi-stack48/36-wildcard-dns-records/` and are not committed.

## Local sanity passed without remote operations

`bun run data:validate` passed with 37 existing warnings, 4,056 checked files, zero locale mismatches and zero relationship mismatches. `bun run lint:mdx` passed. The focused link audit passed with zero broken links and zero locale mismatches and zero missing-translation fallback warnings. Referenced assets exist at the expected dimensions. Shared README descriptions remain accurate, so no shared README changes are proposed.

Usage checkpoints retain actual latest emitted cumulative counters and event timestamps. The observed authoring model is gpt-6.1-sol. Phase timestamps use UTC. Latest emitted counters can precede a checkpoint; checkpoints do not provide exact per-phase billing boundaries. Cached input is included in input, and reasoning output is included in output. No estimate replaces an unavailable counter.

No remote writes, PR creation, code review, hosted CI, merge or publication occurred. PR335 remains untouched. The coordinator can use the local commit in the local stack. Remaining publication work consists of deployment and rendered locale/SEO checks after the remote gate changes.
