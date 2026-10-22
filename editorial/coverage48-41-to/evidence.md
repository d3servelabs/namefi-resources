# This package updates the existing .to guide

This package covers order41 / O09 only. The English slug remains `to`.
The starting commit is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The author used `gpt-6.1-sol`, as reported by session counters.

## The update replaces unsupported assurances with current operator rules

The source page mixed verified registry facts with unsupported reputation claims.
The update removes claims about guaranteed email delivery, abuse deterrence from
price, historical popularity, and automatic permission for branded redirects.
The update also removes an unconditional Namefi availability/tokenization promise.

The useful additions explain total initial cost, ownership changes versus provider
transfers, responsibility for redirect abuse, privacy limits, and DNSSEC versus HTTPS.
Tonic's warning specifies permanent suspension after a legitimate phishing report
for free shortening/redirection. The update preserves that condition.
The FAQ does not explicitly state a residency test. The guide describes global
availability and the absence of a stated Tonga residency condition in the FAQ.
The guide does not claim that IANA establishes registration eligibility.

The author opened these primary sources on 2026-10-22 UTC, or October 21 locally:

- https://www.tonic.to/ — operator identity and automated operation since 1997.
- https://www.tonic.to/faq.htm — global registration, reserved names, initial and
  renewal terms, ownership-change charges, privacy, IDN policy, abuse warning.
- https://www.tonic.to/newname.htm — public availability-entry page.
- https://www.iana.org/domains/root/db/to.html — government manager, active ccTLD,
  lookup endpoints, insecure delegation. This source proves no retail eligibility.
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
  — country signals and generic ccTLD exceptions. The current list omits .to.

The author read the full previous English guide and neighboring .io/.tv guides,
and the domain-hacks guide. The existing .to URL serves a distinct registry-specific
reader job. The update keeps that job and the established English title.

## Direct country and language measurements select German and Japanese

The three `ads-*.json` files preserve complete request and response objects.
Each request used Google Search only, a separate country criterion, and a language
criterion. Responses include close variants when returned, average monthly demand,
and the complete returned monthly series. Missing metrics mean UNKNOWN, not zero.
The returned monthly series covers October 2025 through September 2026.
The fetch timestamps in each JSON identify the actual request time.

The author verified language criteria before requesting data at:
https://developers.google.com/google-ads/api/data/codes-formats
German=1001, Japanese=1005, Czech=1021.

| Locale / country | Query | Average monthly searches | Decision |
| --- | --- | ---: | --- |
| de / Germany, geo2276 | to domain | 880 | Select complete German translation |
| de / Germany | to domain kaufen | 20 | Relevant purchase intent |
| de / Germany | to domain bedeutung | 10 | Relevant meaning intent |
| de / Germany | to domain land | 50 | Relevant country intent |
| ja / Japan, geo2392 | to ドメイン | 170 | Select complete Japanese translation |
| ja / Japan | to ドメイン 取得 | 10 | Relevant acquisition intent |
| ja / Japan | to ドメイン 国 | UNKNOWN | Missing metrics do not mean zero |
| cs / Czechia, geo2203 | to doména | 10 | Defer: unsupported route and limited observed demand |
| cs / Czechia | doména to registrace | UNKNOWN | Missing metrics do not mean zero |
| cs / Czechia | doména to země | UNKNOWN | Missing metrics do not mean zero |

The German decision combines relevant native query modifiers with a substantial
base query. The Japanese decision combines a clear domain query with acquisition
intent. These two complete translations justify maintenance for a policy explainer.
The author did not apply a universal numeric threshold.

The author searched native queries and opened provider pages to check intent:
https://www.domainprovider.de/to-domain/ offers registration and meaning information.
https://www.sppd.ne.jp/personal/faq.php?cid=002&k=0 answers Japanese acquisition questions.
https://www.gonbei.jp/news/domain/20131106.html shows an older Japanese .to information
and registration context. These pages support intent only. Tonic remains the policy
source. A Czech provider result failed to open, so that result establishes no facts.

The retained GSC supplement covers 2026-09-21 through 2026-10-18. The .to URL matched
419 observed rows, 1,585 impressions, and zero clicks. Germany had 45 impressions,
Japan three, and Czechia 12. Site observations do not measure total market demand.
Other countries' observations alone do not establish target-language intent.
The remaining locales stay deferred because this topic has no direct language/region
measurement supporting an additional translation in this pass. No demand is inferred
to be zero. No existing .to translations existed at the starting commit.

The author inspected the actual renderer at
`namefi-astra/main/apps/resources/src/i18n-config.ts`.
Supported locales are `en es de fr zh-CN ar hi ko ja ta`.
Czech is unsupported. The author reported that route gap to coordination and did
not create a Czech file or substitute another language. The TLD page renderer uses
self-canonical URLs and actual-translation hreflang with English x-default.
No runtime change or invented SEO frontmatter field was necessary.

## The translations retain every source section and citation

German and Japanese each preserve ten level-two headings, four FAQ questions,
one image, the same table structure, all source URLs, and ordered relationship slugs.
The translations localize metadata, image alt text, FAQ answers, and body text.
The author used `content/termbase.json` for ccTLD, domain hack, WHOIS, DNSSEC, and DNS.
Same-locale links retain source slugs even when fallback would be necessary.
`translation-sanity.json` records structural and URL parity.

The author compared all policy paragraphs and numbers against English and read
both translations for fluency. No human/native-speaker LQA or rendered site check
occurred. The package remains a local content package, not a deployment claim.

## The final cover passes inspection after one regeneration

The house `og-cover.sh` recipe generated `content/assets/to-og.jpg` with
`gpt-image-2`, high quality, at native 1216×640 and final 1200×630.
The official SVG logotype appears at the top right. All three pages reference
this asset in frontmatter and body. No other image needed replacement or reuse.

The author opened both attempts. Attempt1 failed because decorative labels reached
the bottom reserve. Attempt2 passed: full cream bleed, centered complete objects,
correct spelling, official logo, and empty bottom caption band. The final file is
approximately 91 KB. `image-usage.json` preserves both immutable attempt usages.

Attempt1 returned 701 input tokens and 3,401 output tokens, total 4,102.
Attempt2 returned 745 input tokens and 3,401 output tokens, total 4,146.
Image totals are 1,446 input and 6,802 output tokens, total 8,248.
No attempt has missing API usage. Every fixed attempt script persisted the complete
API response privately before saving an exclusive-create usage sidecar.
The private scratch directory is `/private/tmp/namefi-stack48/41-to/`.
The private response files contain image bytes and must not enter Git.

## Local sanity checks pass without hosted CI

`bun run data:validate` passed, including 13 local data tests, frontmatter validation,
locale/relationship checks, and all FAQ/body synchronization checks.
Data validation reported 37 pre-existing missing-locale-directory warnings.
`bun run lint:mdx` passed.
The focused link audit passed for all three files: zero broken links, locale
mismatches, relationship mismatches, and missing-translation fallbacks.
Image size, reference existence, translation source URL parity, and diff whitespace
checks passed. Dependencies use an untracked symlink to the existing main
`node_modules`, after sandbox temp permissions prevented a fresh installation.

Expected post-deployment URLs:

- https://namefi.io/r/en/tld/to/
- https://namefi.io/r/de/tld/to/
- https://namefi.io/r/ja/tld/to/

The author performed no push, PR operation, review, hosted CI, merge, or deployment.
The root coordinator owns publication and deployed URL checks.

## Session checkpoints expose the available usage boundaries

`usage-checkpoints.json` preserves actual emitted cumulative counters and event
timestamps for the full canonical agent path. Cached input is part of input.
Reasoning output is part of output. Neither component may be added twice.
The initial setup predates the first research checkpoint.
The first image attempt overlapped research/writing. Its isolated start counter
is unavailable. The image retry start and final image QC boundaries are recorded.
The original `images-end` checkpoint predates the retry and is not final acceptance.
The final image QC endpoint supersedes that provisional endpoint.
