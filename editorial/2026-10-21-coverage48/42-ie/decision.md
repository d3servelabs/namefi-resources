# This package adds an Ireland eligibility reference and a German translation

The owner assigned order 42, source T02, to `.ie` on 21 October 2026.
The branch starts from coordinator base `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The author used `gpt-6.1-sol` under the batch's explicit model override.

## The English page fills a distinct reference need

A semantic search of English TLD and blog content found no `.ie` reference or equivalent Ireland eligibility guide.
The search found incidental Ireland references in `.cpa`, `.ltd`, and accounting articles.
Those pages answer different questions, so the package creates `content/tld/en/ie.md`.
The page explains island-wide eligibility, overseas trade evidence, the 2018 change, current naming rules, contractual duties and buyer decisions.
The package does not assert Namefi support without verification.

## The operator policies establish eligibility

The author opened these primary sources on 21 October 2026 Pacific time (22 October UTC):

- `https://www.weare.ie/document-requirements/`: identity, island-wide connection, applicant-specific evidence and overseas business route.
- `https://www.weare.ie/our-policies/`: the current operator index directly links the December 2023 registration policy below.
- `https://www.weare.ie/wp-content/uploads/2023/12/Registration-and-Naming-2023.pdf`: current published registration policy, December 2023 version, naming and nameserver rules.
- `https://www.weare.ie/registrant-terms-conditions-policy/`: current operator landing page links the November 2020 contract below.
- `https://www.weare.ie/wp-content/uploads/2020/11/Registrant-Terms-and-Conditions-16-November-2020.pdf`: current linked contract, accurate data and dispute obligations.
- `https://www.weare.ie/liberalisation/`: the 21 March 2018 change removed the claim-to-name test, while retaining identity and connection checks.
- `https://www.weare.ie/frequently-asked-questions/`: DNSSEC, individual WHOIS treatment, renewals, and registrar transfer Authcodes.
- `https://www.iana.org/domains/root/db/ie.html`: delegation and manager only. The author did not use IANA to infer eligibility.
- `https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites`: country-code signals, with no ranking guarantee.
- `https://www.weare.ie/` and `https://www.revenue.ie/en/Home.aspx`: actual institutional use examples.

The private scratch directory retains fetched HTML, PDFs and extracted text.
The attempted `/registration-requirements/` and `/registrant-terms-and-conditions/` addresses did not resolve through the web tool.
The author replaced those guesses with verified operator URLs.
A guessed `/registration-and-naming-policy/` redirected to the home page and supplies no policy evidence.
The correct PDF supplies the policy evidence.
The author removed a proposed CRO example after its fetch failed.
The public page cites only opened evidence.

## Country and language measurements support one translation

The author validated Ads language criteria against the official table before requests:
`https://developers.google.com/google-ads/api/data/codes-formats`.
The table lists English `1000`, German `1001`, and French `1002`.
The author used separate country criteria: Ireland `2372`, Germany `2276`, and France `2250`.
The requests used `GOOGLE_SEARCH` and the Namefi MCC `3505976042` via GuestSafe.
The evidence files preserve exact requests, returned close variants, averages and monthly series.
The response period is October 2025 through September 2026.

| Pair | Returned monthly averages | Decision |
| --- | --- | --- |
| English / Ireland | `ie domain` 1300; `register ie domain` 140; `ie domain country` 20; `irish domain` 880 | Create the English source for the primary market |
| German / Germany | `ie domain` 880; `domain irland` 880; `ie domain registrieren` 10; `irische domain` UNKNOWN | Create the complete German translation |
| French / France | `nom de domaine ie` 20; `extension ie` 70; `domaine irlande` UNKNOWN; `acheter domaine ie` UNKNOWN | Defer this lower-volume pair during this batch |

The author did not sum related query volumes or treat missing metrics as zero.
The German country and native-language phrases support Ireland-domain intent alongside the language-neutral `ie domain` query.
The French measurements show some intent, but a second legal-policy translation adds ongoing maintenance work for a smaller observed opportunity.
The French decision is an editorial comparison for this topic, not a universal threshold.

Search results on 21 October showed the first-party German OVHcloud `.ie` product page and the first-party French OVHcloud `.ie` product page.
The operator page addresses registration eligibility directly, which supports a reference-page treatment for the measured intent.
The author used those results for intent fit, not as sources for registry policy.
GSC observed no matching existing `/tld/ie/` rows during 21 September–18 October 2026.
The absence is expected for a new URL and does not establish zero market demand.

## The actual renderer supports the selected German locale

The author inspected Astra `apps/resources/src/i18n-config.ts` and the TLD route metadata function.
Supported locales are `en`, `es`, `de`, `fr`, `zh-CN`, `ar`, `hi`, `ko`, `ja`, and `ta`.
The renderer emits a self canonical for each locale, alternates only for actual source-language files, and English `x-default`.
No runtime change belongs to this package.

Irish `ga` has no supported route, and the official Google Ads language table has no Irish criterion.
Irish-language demand remains UNKNOWN rather than zero.
The author reported this gap to root and did not substitute German as a proxy for Irish.
The German selection has its own Germany/German demand evidence.
Other supported locales have no qualified demand evidence in this package and remain deferred as UNKNOWN.

The expected production URLs are:

- `https://namefi.io/r/en/tld/ie`
- `https://namefi.io/r/de/tld/ie`

The expected dev URLs use `namefi.dev` with the same paths.
English and German should advertise each other and English `x-default` after publication.
The `/de/tld/uk/` relationship intentionally relies on the renderer's fallback behavior.

## The translation preserves the complete English source

The German translation includes all sections, tables, FAQs, metadata, image descriptions and citations.
The translation preserves exact English relationship slugs with German locale prefixes.
The author used `content/termbase.json` for `ccTLD`, `Registrar`, and `DNSSEC`.
The register addresses business readers formally as `Sie`.
`Registry` means the operator, `Registrar` means the service provider, and `Domaininhaber` means the holder.
The author checked high-risk legal statements against the English source, including overseas individuals and the distinction between registrar and holder changes.
No native-human or independent review took place because the owner waived creation-phase reviews.
The package retains a machine-readable structural coverage check.
The shared image text remains English, while the surrounding article prose and image alt text are German.

## Four image attempts retain complete usage evidence

Both final assets use `gpt-image-2`, quality `high`, through adapted copies of the repository image scripts.
Each attempt has a separate fixed script and private output directory.
The process saved the complete API response before parsing and created an immutable usage sidecar.
No running script changed.
The private directory is `/private/tmp/namefi-stack48/42-ie/`.

| Attempt | Input tokens | Output tokens | Total | Result |
| --- | ---: | ---: | ---: | --- |
| Cover 1 | 713 | 3401 | 4114 | Rejected because the illustration entered the bottom reserve |
| Inline 1 | 478 | 5488 | 5966 | Rejected because the heading and bottom card lacked crop margins |
| Cover 2 | 770 | 3401 | 4171 | Final, opened and passed visual QC |
| Inline 2 | 491 | 5488 | 5979 | Final, opened and passed visual QC |

Final cover: `content/assets/ie-og.jpg`, 1200 × 630 progressive JPEG.
Final illustration: `content/assets/ie-01-eligibility.jpg`, 1200 × 675 progressive JPEG.
Both final files show readable text, cream margins, and the composited official Namefi logo at top right.
The cover preserves the empty bottom band.
The inline diagram gives examples of evidence and does not replace the detailed applicant requirements.
The manifest records final file hashes and the attempt sidecars preserve actual returned usage.
Session counters include cached input in input and reasoning output in output.
Missing fine-grained token boundaries remain unavailable rather than estimated.

## Local sanity checks establish package readiness

The package runs `data:validate`, `lint:mdx`, focused locale/link checks, image dimensions and `git diff --check`.
`data:validate` passed with 37 existing warnings, zero locale mismatches, and zero relationship mismatches.
The validator confirmed that 1,641 FAQs match their body sections.
`lint:mdx` passed.
The focused audit found zero broken links, zero locale mismatches, and one intentional German `.uk` fallback.
Image existence, final dimensions, progressive encoding and `git diff --check` passed.
No deployed desktop/mobile page check took place in this local-only package.
The coordinator must check the actual renderer and deployed canonical/alternate metadata after integration.
No remote write, hosted CI, bot review, pull request, merge, or deployment belongs to this authoring package.
Shared README files need no procedural change, and the author did not edit them.
