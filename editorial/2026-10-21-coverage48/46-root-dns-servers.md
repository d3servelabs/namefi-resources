# This update separates root answers from delegation referrals

G07 updates `content/blog/en/root-dns-servers.md` in place.
The source base is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The update preserves the English title, slug, taxonomy and ordered relationships.
The update adds a complete German translation for Germany.
The author used `gpt-6.1-sol` under the owner's batch model override.
The author did not change model policy files.

## The new section explains two direct queries

The existing article already covers identifiers, instances, caching, priming and DNSSEC.
The update adds direct A-root queries for `. NS` and `com. NS` with `+norecurse`.
The update explains `ANSWER`, `AUTHORITY`, `ADDITIONAL`, `aa`, `NOERROR` and empty answers.
The commands describe expected protocol behavior and do not claim captured live output.
The text limits direct diagnostics to networks whose policy permits external DNS.

The author read the full English article and the overlapping resolver-choice, primary/secondary DNS and FQDN articles.
The root article retains the discovery and delegation reader task.
The author opened every existing source URL as writing context.
The author checked the added claims against the following exact primary-source passages:

- [IANA Root Name Servers](https://www.iana.org/domains/root/servers): A-root IPv4 `198.41.0.4`.
- [RFC 1034 Section 4.3.2](https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.2): step 3(b) puts referral NS records in authority and available addresses in additional.
- [RFC 1035 Section 4.1.1](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1): AA scope and response codes 0 and 3.
- [BIND stable dig manual](https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility): server argument, configured resolver default and `+recurse, +norecurse` description.

The author fetched the sources on 2026-10-21 in America/Los_Angeles.
The update does not constitute a new full audit of every legacy claim.

## German demand justifies one complete translation

The demand record is `46-root-dns-servers-demand.json` beside this file.
Google Ads used German `languageConstants/1001`, Germany `geoTargetConstants/2276` and `GOOGLE_SEARCH`.
The author confirmed German ID 1001 in [Google's official language table](https://developers.google.com/google-ads/api/data/codes-formats) before requesting metrics.
The response reports October 2025 through September 2026 monthly observations.
The adjacent JSON preserves the request, complete response, close variants and monthly series.
The author did not add overlapping keyword groups.

| Returned keyword group | Average monthly searches |
| --- | --- |
| dns root server | 390 |
| root nameserver | 880 |
| dns stammserver | 10 |

A German search for DNS root-server terms returned explanatory articles and operational material.
The author opened [Cloudflare's German root-server explanation](https://www.cloudflare.com/de-de/learning/dns/glossary/dns-root-server/).
The observed results fit the hierarchy and root-service intent.
The new direct-answer/referral comparison provides a specific diagnostic addition to general explanations.
Broad German “Root-Server” searches can also mean hosting, so the request used DNS-specific terms.
The evidence supports one German translation rather than expansion to every supported language.

The GSC topic aggregate covers 2026-09-21 through 2026-10-18.
The aggregate has no observed matching topic rows.
The absence does not establish zero demand or zero German demand.
Other locale/region combinations remain UNKNOWN and deferred because this task did not measure those combinations.
A future translation decision needs direct local metrics and an intent assessment.

The complete German translation adds one manuscript and shares six images with English.
The maintenance cost includes keeping the protocol caveats, commands and source links aligned after future English changes.
No monetary cost or maintenance-time estimate is available.
The measured demand and focused diagnostic value justify this one added maintenance obligation.

## The German translation preserves the source structure

The target uses standard German for technically interested readers and domain owners.
The target provides a faithful translation rather than additional local claims.
The termbase supplies DNS, Root-Zone (Root-Server), TLD, DNS-Resolver (Rekursiver Resolver), and DNSSEC names.
The working vocabulary uses Verweis for referral, Kennung for identifier, Instanz for instance and Vertrauensanker for trust anchor.
[Microsoft's German DNS concepts page](https://learn.microsoft.com/de-de/windows-server/identity/ad-ds/plan/reviewing-dns-concepts) supplies precedent for Delegierung, autoritativ and DNS-Stammserver.
The page returned readable article text despite an authentication notice.

The two manuscripts have seven matching heading positions, five matching inline images and ten matching table rows.
All four command blocks, 41 inline code spans and 35 external link URLs match in order.
The author compared every source paragraph with the German counterpart and checked German phrasing.
The German source list has one fewer blank separator, with all fourteen source entries retained.
All recognized internal routes use `/de/`, including ordered relationships.
The translation has no independent human or native-speaker review.
The owner excluded additional agents and review during creation.

The author inspected Astra's `src/i18n-config.ts`, `getAvailableLocalesForSlug` and blog `generateMetadata` locally.
The runtime supports `de` and counts only actual source-language files for alternates.
Expected production pages are:

- `https://namefi.io/r/en/blog/root-dns-servers`
- `https://namefi.io/r/de/blog/root-dns-servers`

Each page should self-canonical.
The expected reciprocal alternate set is `en`, `de`, with English `x-default`.
Deployed canonical, alternate and desktop/mobile rendering checks belong to final batch publication.
The author did not claim a deployed check for unpublished local files.

## One new image supports the diagnostic comparison

The image manifest is `46-root-dns-servers-images.json` beside this file.
The new asset is `content/assets/root-dns-servers-05-answer-referral.jpg`, 1200 × 675.
The author used the house inline harness, `gpt-image-2`, high quality and official top-right logo compositing.
An immutable scratch harness copy adds response persistence before parsing and cleanup.
Attempt 1 succeeded, so no regeneration occurred.
The complete response remains in private scratch and never enters Git.
The API reports 490 input tokens, 5488 output tokens and 5978 total tokens.
The response does not identify a returned model, so the manifest distinguishes requested model from returned metadata.

The existing cover and four existing inline images remain relevant.
The author opened the new image individually and all six final images in a contact sheet.
The spelling, visible labels, margins, framing and official-logo placement passed visual checks.
The shared image contains English labels, and the German text and alt text explain the diagram in German.

## Local sanity passes without remote work

`TMPDIR=/private/tmp bun run data:validate` passed with 37 existing collection warnings.
The validation included 13 passing tests, zero failures, locale invariants and FAQ synchronization.
`bun run lint:mdx` passed.
The focused link audit checked both manuscripts with zero broken links, missing locales, locale mismatches, relationship mismatches or fallback warnings.
The image manifest records dimensions and SHA-256 hashes for all final assets.
The author examined the relevant README files and found no necessary directory-description changes.
The author did not edit shared README files, policies, review settings or workflow files.
The author did not push, open a PR, request review, run hosted CI, merge or release.

## Actual counters retain their measurement limits

`46-root-dns-servers-usage.json` preserves actual emitted writer counters.
The canonical agent path is `/root/coverage48_46_g07`.
The scratch file `writer-usage-checkpoints.json` remains separate from root's earlier `usage-checkpoints.json`.
The first writer checkpoint occurred after initial context loading, so the measured delta does not cover all startup work.
Research, writing, translation and sanity checkpoints preserve available cumulative boundaries.
Image start has no independent token checkpoint, and image generation overlapped other work.
The API usage record measures the image operation separately.
Cached input is part of input, and reasoning output is part of output.
Neither subset should be added again.
No account-quota share or unavailable phase counter has been estimated.
