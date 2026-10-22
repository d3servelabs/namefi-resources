# G32 updates the existing custom-domain email guide

The English update preserves `set-up-email-with-your-own-domain` and its setup job.
The source revision is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The writer used `gpt-6.1-sol`, as recorded by the session counter.
The writer worked on October 21, 2026 in America/Los_Angeles.
The UTC checkpoints fall on October 22.

## The update helps readers choose an email service before editing DNS

The existing article already explained verification, MX, authentication, migration and testing.
The update adds a service-choice table and one generated illustration.
The table distinguishes hosted mailboxes, iCloud+ custom domains and incoming forwarding.
The update links to the existing free-service guide instead of duplicating plan comparisons.
The writer read the complete English target, `free-business-email-options` and `domain-vs-hosting`.
The English title and all existing relationship metadata remain unchanged.

## Opened primary sources support the retained and added instructions

The writer opened each source through the web tool on October 21, 2026 local time.
A separate shell-fetch attempt failed under the sandbox and supplied no factual evidence.
The web tool returned readable primary documentation for the following claims.

| Primary source | Verified claim |
| --- | --- |
| [Google Gmail activation](https://knowledge.workspace.google.com/admin/gmail/activate-gmail-with-google-workspace-your-company) | User accounts precede the MX change. Existing-message import remains an additional task. |
| [Google TXT verification](https://knowledge.workspace.google.com/admin/domains/verify-your-domain-with-a-txt-record) | The account supplies a unique TXT value and requires verification after publication. |
| [Google MX setup](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace) | `smtp.google.com`, priority 1, supported legacy `aspmx` values, removal of other MX records, Gmail activation and diagnostic checks. |
| [Google SPF setup](https://knowledge.workspace.google.com/admin/security/set-up-spf) | Inventory all legitimate sending services before building the policy. |
| [Google SPF troubleshooting](https://knowledge.workspace.google.com/admin/security/troubleshoot-spf-issues) | Consolidate multiple SPF records into one record at the relevant name. |
| [Google DKIM setup](https://knowledge.workspace.google.com/admin/security/set-up-dkim) | Public and private key roles, 24–72-hour key-generation wait, publication before signing activation and external-recipient testing. |
| [Google DMARC setup](https://knowledge.workspace.google.com/admin/security/set-up-dmarc) | SPF or DKIM must pass with alignment. The record-publication section specifies at least 48 hours of SPF/DKIM authentication. |
| [Google DMARC rollout](https://knowledge.workspace.google.com/admin/security/recommended-dmarc-rollout) | Begin monitoring with `p=none` before progressively enforcing policy. |
| [Cloudflare routing](https://developers.cloudflare.com/email-service/get-started/route-emails/) | Incoming routing forwards to an existing destination that the account verifies. |
| [Cloudflare Email Service](https://developers.cloudflare.com/email-service/) | Incoming routing and outbound transactional sending remain separate service functions. |
| [DNSimple services](https://support.dnsimple.com/articles/dnsimple-services/) | Customers can use DNS hosting while keeping registration elsewhere. |
| [Microsoft custom domains](https://learn.microsoft.com/en-us/microsoft-365/admin/setup/add-domain?view=o365-worldwide) | Domain Connect can automate ownership verification and records. Manual configuration remains available. |
| [Apple custom domains](https://support.apple.com/en-us/102540) | iCloud+ subscription, two-factor authentication and enabled iCloud Mail are prerequisites. |

The writer also opened Apple's German support page and Microsoft's German domain page.
The German documentation supports the terms E-Mail-Domain, Postfach and Domain.
The repository termbase supplies DNS, Registrar and DNS-Eintragstypen.

## Measured German demand justifies one complete translation

`20-G32-demand.json` preserves the exact Ads requests and responses.
The responses include returned close variants, average volumes and every monthly value.
Each request uses Google Search, a separate country target and a verified language criterion.
The official [Ads language table](https://developers.google.com/google-ads/api/data/codes-formats) confirms German 1001, French 1002 and Spanish 1003.
The returned monthly series covers October 2025 through September 2026.

| Locale and country | Query | Average monthly searches | Decision |
| --- | --- | ---: | --- |
| German, Germany / 2276 | eigene email domain | 1,900 | Select `de` for Germany |
| German, Germany / 2276 | email domain kaufen | 720 | Supports provider-choice and setup intent |
| German, Germany / 2276 | email mit eigener domain | 390 | Direct match for the setup guide |
| German, Germany / 2276 | icloud eigene domain | 110 | Supports the iCloud prerequisite paragraph |
| French, France / 2250 | adresse mail nom de domaine | 390 | Defer this cycle |
| French, France / 2250 | mail avec nom de domaine | 70 | Defer this cycle |
| French, France / 2250 | créer adresse mail domaine | 10 | Defer this cycle |
| French, France / 2250 | icloud domaine personnalisé | 10 | Defer this cycle |
| Spanish, Mexico / 2484 | correo con dominio propio | 320 | Defer this cycle |
| Spanish, Mexico / 2484 | crear correo con dominio propio | 110 | Defer this cycle |
| Spanish, Mexico / 2484 | comprar dominio correo | 20 | Defer this cycle |
| Spanish, Mexico / 2484 | icloud dominio personalizado | 10 | Defer this cycle |

The writer does not add the query volumes together as unique market demand.
The German sample has stronger measured demand across purchase and setup queries.
The German Apple result directly serves custom-domain setup intent.
French provider results and Spanish hosting guides also show relevant intent.
The limited first translation prioritizes the stronger German opportunity and limits maintenance work.
The French and Mexican Spanish deferrals therefore do not claim absent demand.
Other supported languages remain unmeasured and deferred, with demand UNKNOWN.

The supplied GSC aggregate observes 23 impressions and zero clicks across 19 rows.
The period is September 21 through October 18, 2026, with final web data.
The topic aggregate contains no German, French or Mexican country row.
Missing country/query observations do not establish zero search demand.
The private whole-site dataset remains outside the repository.

## The German article preserves the English facts and structure

The translation addresses German-speaking domain owners in Germany with formal `Sie`.
The translation uses faithful technical prose and preserves brands and DNS values.
The translation localizes human-facing metadata, headings, tables, lists, captions and source labels.
The six sections, 17 table lines, three inline images and every code span match the English structure.
All 29 external link occurrences match the English body exactly.
Every internal link uses `/de/` with its original slug.
All relationship arrays preserve English ordering with the locale replacement.
No existing translation required a contradiction repair because the source had no translations.

The writer performed bilingual coverage and German fluency checks.
No independent native-speaker or third-party review ran under the owner's creation restriction.
A deployed application render and deployed SEO checks remain integration-stage work.
The content package adds no unsupported SEO frontmatter.
The expected renderer behavior is self-canonical pages, reciprocal `en`/`de` alternates and English x-default.

## One new image supplements three valid existing assets

`20-G32-images.json` records dimensions, hashes, actions and visual checks.
The generated image distinguishes mailbox receive/send from incoming forwarding.
The writer opened every final image at inspection time.
All images preserve full framing, correct labels and the official top-right logo.
The cover retains the empty bottom band.
The article reuses the valid cover, routing image and authentication image.

The new image used the repository inline generator recipe with `gpt-image-2`, high quality.
The first attempt passed. The writer did not regenerate the image.
The immutable API usage sidecar records 411 input, 5,488 output and 5,899 total tokens.
The API response did not return a model identifier. The request explicitly specified `gpt-image-2`.
The fixed scratch script saved the usage sidecar before image parsing.
The script's EXIT cleanup removed the complete private response after success.
The full response is unavailable. The usage sidecar remains complete.
No base64 response or credential enters the commit.

## Local sanity passes before the local handoff

- `TMPDIR=/private/tmp bun run data:validate` passed with 37 existing corpus warnings.
- `TMPDIR=/private/tmp bun run lint:mdx` passed.
- The focused link audit reports zero broken, missing-locale, locale, or relationship errors.
- The link audit reports one permitted fallback for `/de/blog/free-business-email-options/`.
- Deterministic translation checks preserve external URLs, internal route slugs, code spans, sections, table lines and image counts.
- All referenced assets exist. The cover measures 1200×630. Each inline image measures 1200×675.

`20-G32-usage.json` preserves observed session checkpoints with counter-event timestamps.
The checkpoints are latest emitted counters, not exact synchronous phase measurements.
Cached input already belongs to input. Reasoning output already belongs to output.
The record does not infer an account allowance share or invent unavailable measurements.

## Publication must wait for the owner's remote gate

The package contains only local changes and a local `[skip ci]` commit.
The writer did not push, open or change a PR, run review tools, run hosted CI, merge or publish.
PR 335 remains untouched.
Expected real locale URLs after authorized publication are:

- `https://namefi.io/r/en/blog/set-up-email-with-your-own-domain/`
- `https://namefi.io/r/de/blog/set-up-email-with-your-own-domain/`

The local content package has no missing article or image.
Full image-response retention, independent native LQA and deployed renderer checks remain explicitly unavailable.
The coordinator owns shared README updates. No shared README or policy file changed.
