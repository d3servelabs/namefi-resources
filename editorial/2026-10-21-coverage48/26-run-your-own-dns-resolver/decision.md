# The G05 update adds tool selection and one German translation

Order 26 updates the existing English `run-your-own-dns-resolver` article.
The source revision is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The existing title, slug, operational scope, and ordered relationships remain intact.
The revision adds Technitium, Pi-hole with Unbound, loopback scope, distinct ports, and paired validation outcomes.
The writer used actual model `gpt-6.1-sol` under the user's GPT batch override.

## German demand supports one maintained translation

Google Ads API v26 returned historical metrics on October 22, 2026 UTC (October 21 in Los Angeles).
The requests target Google Search, with separate language and country criteria.
The official language table confirms German 1001 and Spanish 1003:
https://developers.google.com/google-ads/api/data/codes-formats
Germany uses geo criterion 2276. Spain uses 2724.
Both evidence JSON files preserve exact requests, returned close variants when present, monthly series, and fetch timestamps.
Neither response returned a close-variant field.
The returned period spans October 2025 through September 2026.

| Locale and country | Requested query | Average monthly searches | Decision |
| --- | --- | ---: | --- |
| de / Germany | eigenen dns server einrichten | 20 | Select |
| de / Germany | dns server selber hosten | 10 | Select |
| de / Germany | pi hole unbound einrichten | 20 | Select |
| de / Germany | technitium dns einrichten | 20 | Select |
| de / Germany | duckdns einrichten | 30 | Adjacent dynamic-DNS intent only |
| es / Spain | servidor dns local | 10 | Defer |
| es / Spain | configurar duckdns | 10 | Adjacent dynamic-DNS intent only |
| es / Spain | crear servidor dns propio | UNKNOWN | Defer |
| es / Spain | configurar pi hole unbound | UNKNOWN | Defer |
| es / Spain | configurar technitium dns | UNKNOWN | Defer |

The German decision rests on several specific setup intents, including both named resolver options.
The Spanish measured resolver term is broad. Three specific Spanish setup terms have unavailable metrics.
DuckDNS counts do not establish recursive-resolver demand.
The decision uses topic fit and maintenance cost rather than a universal numeric threshold.
One complete German translation remains manageable alongside the English source.
Other locales and regions remain unassessed. Unassessed demand remains UNKNOWN.

A web search for German setup terms returned German Unbound installation and Technitium configuration guides.
Examples included heimnetz.de's Raspberry Pi Unbound/Pi-hole guide and igorslab.de's Technitium setup guide.
Those results support an instructional intent assessment only. The article cites primary project documentation for technical claims.
A Spanish setup query also returned instructional pages, but intent fit alone does not supply missing demand metrics.
The SERP observation is a language-intent check, not a location-personalized ranking measurement.

The supplied GSC topic aggregate observed no matching rows for this article.
The aggregate covers September 21 through October 18, 2026.
No rows do not prove zero market demand. No country-specific GSC ranking signal supports or contradicts selection.

## The writer verified primary project and standards sources

The writer opened the complete existing English article and the overlapping ISP/public-resolver and gaming-benchmark articles.
The overlap check keeps this article about operating a private resolver rather than choosing a public service or promising gaming speed.
The writer opened these primary sources on October 21, 2026 local time:

- https://technitium.com/dns/ supports recursion, authoritative roles, browser console, filtering, and encrypted forwarders.
- https://docs.pi-hole.net/guides/dns/unbound/ supports the Pi-hole/Unbound arrangement, port 5335, custom upstream syntax, and paired DNSSEC tests.
- https://unbound.docs.nlnetlabs.nl/en/latest/use-cases/home-resolver.html supports private host-first deployment and home-network operation.
- https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html supports listener, access control, forwarding, and TLS configuration.
- https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound-checkconf.html supports syntax/configuration checking and exit status.
- https://www.duckdns.org/spec.jsp supports hostname address updates rather than recursive resolution.
- https://datatracker.ietf.org/doc/html/rfc5358 supports restricting recursion to prevent reflection abuse.
- https://datatracker.ietf.org/doc/html/rfc9076 supports the distinction between resolver and authoritative-server observation.

## The German translation preserves the English content contract

The target variant is standard German for Germany, addressing home-network operators with “Sie”.
The translation preserves all source sections, tables, steps, caveats, citations, code values, image references, and ordered relationships.
The working terminology uses DNS-Resolver, rekursive Auflösung, Weiterleitung, Vertrauensanker, Empfangsschnittstelle, and Zugriffsregel.
Product names and standard acronyms remain unchanged.
The writer consulted the repository termbase. The translation does not introduce new glossary entries.
The writer checked source-to-target completeness and edited German prose.
No human native-language LQA or deployed rendered check occurred.
The local scope permits content sanity and image inspection only.

Expected real pages after publication:
- https://namefi.io/r/en/blog/run-your-own-dns-resolver/
- https://namefi.io/r/de/blog/run-your-own-dns-resolver/

Each real page should self-canonical. Reciprocal alternates should include only en and de, with English x-default.
The renderer owns canonical and hreflang generation. The writer added no unsupported SEO frontmatter.
The writer made no deployment claim.

## The image attempt preserves its response and usage

The new inline illustration uses the prescribed inline harness, `gpt-image-2`, high quality, and official composited Namefi logo.
An immutable private copy adapts only response persistence and usage capture.
The complete successful response lives in private scratch before parsing or cleanup.
The sanitized immutable attempt usage records 465 input tokens, 5488 output tokens, and 5953 total tokens.
The single generation attempt succeeded. A preceding GuestSafe syntax failure never launched generation and incurred no image API request.
The writer visually inspected the new image and all five retained images.
`image-qc.json` records dimensions, hashes, and results.
The new image explains Pi-hole filtering followed by Unbound recursion. Both language pages reference the same image.
The existing cover and four section images remain relevant.

Phase counters preserve actual latest emitted session events rather than estimates.
The image-generation start counter was captured late after generation had finished.
The exact image-only session-token boundary is UNKNOWN because writing and translation overlapped image execution.
The API-returned image usage is complete. No missing usage component is treated as zero.
The current session counter includes cached input and reasoning output within its totals.
The topic files preserve event timestamps so aggregation can use the actual emitted boundaries.

The writer reviewed relevant README files. Shared README changes are unnecessary for this in-place article update and single translation.
The writer did not modify README, AGENTS, CLAUDE, workflow, stack, or review policy files.
The topic ends with a local commit only. Remote writes, PR changes, hosted CI, review requests, merging, and publication remain prohibited.

## Local sanity passed before the local commit

`TMPDIR=/private/tmp bun run data:validate` exited 0 with 37 existing coverage warnings.
`bun run lint:mdx` exited 0.
The focused two-file link audit exited 0 with no broken links, locale mismatches, or relationship mismatches.
Four missing German body-link translations intentionally use same-locale runtime fallback.
The deterministic coverage check found six headings, five body images, eighteen table rows, sixteen numbered steps, and forty-eight prose units in each language.
Citation URL order and inline-code values match exactly.
All six referenced assets exist at their declared paths and dimensions.
`git diff --check` passed.
The evidence directory preserves the validation logs.
