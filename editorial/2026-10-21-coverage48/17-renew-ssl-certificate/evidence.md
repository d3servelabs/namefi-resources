# This topic updates the SSL certificate renewal procedure

G41 / order 17 updates `content/blog/en/renew-ssl-certificate.md` in place.
The article keeps its title, slug, operational purpose, and existing relationships.
The article adds current validity limits, lifetime-aware renewal timing, deployment-hook testing, and symptom-based recovery.
The article distinguishes public certificate recovery from self-signed certificate trust management.

## Research confirms the current rules and future changes separately

The writer opened all 12 cited primary documents on October 21, 2026, America/Los_Angeles.
The UTC work interval began on October 22.
The source map in `sources.json` records supported claims and section locators.

The writer read the entire existing renewal article and `what-is-https.md` before writing.
The HTTPS article explains protocol concepts and trust.
The renewal article gives an existing-site operator an update and recovery procedure.
The writer did not expand the renewal article into SAN certificate shopping or self-signed certificate generation.

The 200-day public maximum applies to issuance from March 15, 2026 through March 14, 2027.
Older certificates can retain their original validity period.
The later 100-day and 47-day maxima remain future issuance rules.
Let's Encrypt's current 90-day default differs from the public maximum and its announced future default changes.

## Measured Japanese demand supports one complete translation

`ads-ja-JP.json`, `ads-de-DE.json`, and `ads-es-MX.json` preserve direct Google Ads historical responses.
Each response retains the language target, country target, returned close variants, averages, and monthly series.
The network is Google Search.
The returned period covers October 2025 through September 2026.
The fetch timestamps use UTC.
The Namefi research account is MCC 3505976042.
No credential values enter these files.

| Market | Returned query | Average monthly searches | Decision |
| --- | --- | --- | --- |
| Japan / Japanese | ssl 証明 書 更新 | 320 | Select Japanese |
| Japan / Japanese | ssl 証明 書 期限切れ | 210 | Supports recovery intent |
| Japan / Japanese | let's encrypt 更新 | 140 | Supports automation intent |
| Germany / German | ssl zertifikat erneuern | 70 | Defer German |
| Germany / German | ssl zertifikat abgelaufen | 50 | Defer German |
| Germany / German | letsencrypt zertifikat erneuern | 70 | Defer German |
| Mexico / Spanish | renovar certificado ssl | 10 | Defer Spanish |
| Mexico / Spanish | certificado ssl caducado | 10 | Defer Spanish |

Google Ads grouped the Mexican renewal and renovación phrases into one returned result.
The writer did not add those variants as separate demand.
The averages represent estimates, not guaranteed traffic or exact unique searchers.

The writer searched the actual Japanese, German, and Spanish phrases.
The writer opened the Japanese operator page at https://ssl.nihon-data.jp/koshinsan/.
The page separates expiry tracking, issuance, installation, and automatic renewal.
The operational search intent matches the English renewal guide.
The writer also opened IONOS's German renewal instructions at https://www.ionos.de/hilfe/index.php?id=2730.
German intent fits, but Japanese demand offers the stronger measured opportunity for one maintained translation.
The Mexico-specific GoDaddy fetch failed, so that fetch supplies no evidence.
The writer deferred Mexico because measured demand was small, with no compensating site evidence.
These decisions use this topic's evidence and maintenance cost, without a universal numeric cutoff.
Unmeasured locales remain UNKNOWN and deferred, not zero-demand markets.

`gsc.json` preserves the sanitized topic supplement.
The observed period covers September 21 through October 18, 2026.
No matching topic rows appeared in the supplement.
Missing rows do not establish zero demand or zero total site traffic.

## The Japanese article preserves the full English procedure

The selected locale is Japanese for Japan, stored under repository locale `ja`.
The translation includes all source sections, examples, four code blocks, four tables, five inline images, and citation URLs.
`translation-coverage.json` records deterministic coverage checks.
The writer checked all blocks against English and reread Japanese prose.
No external, independent, or native-human language review occurred.
No rendered application check occurred in this content-only local package.

The working terminology follows `content/termbase.json`: DNS, 秘密鍵, 公開鍵, ネームサーバー（NSレコード）, and レジストラ.
The writer opened https://letsencrypt.org/ja/docs/challenge-types/ for Japanese challenge terminology.
The Japanese source is older than English, so current English primary documents govern technical facts.

Expected real article URLs:

- https://namefi.io/r/en/blog/renew-ssl-certificate/
- https://namefi.io/r/ja/blog/renew-ssl-certificate/

The renderer should produce each locale's self canonical, reciprocal en/ja alternates, and English x-default.
The package adds no unsupported SEO frontmatter keys.
Final deployed canonical and hreflang checks remain integration work after the remote gate opens.
The Japanese HTTPS and domain-versus-hosting body links intentionally use same-locale English fallback.

## Two generated illustrations clarify timing and validation

The writer used the repository inline house script with `gpt-image-2`, high quality, and GuestSafe credential injection.
A scratch copy passed the authorization header by a file descriptor and retained usage metadata before cleanup.
The official SVG logotype remains the composited top-right logo.

| Asset | Action | Purpose | Inspection result |
| --- | --- | --- | --- |
| renew-ssl-certificate-02-validation-paths.jpg | Regenerate | Replace confusing HTTPS-plus-port-80 depiction with explicit HTTP-01 / Port 80, DNS-01 / TXT, and managed / Keep CNAME | Passed on first attempt |
| renew-ssl-certificate-05-renewal-timing.jpg | New | Finish ARI renewal, deployment, and public verification before expiry | Passed on first attempt |
| renew-ssl-certificate-og.jpg | Reuse | Existing renewal and public-deployment cover | Opened and retained |
| renew-ssl-certificate-01-public-certificate.jpg | Reuse | Public endpoint versus origin | Opened and retained |
| renew-ssl-certificate-03-renewal-deployment.jpg | Reuse | Issuance, deployment, and verification | Opened and retained |
| renew-ssl-certificate-04-public-verification.jpg | Reuse | Local file versus public endpoint | Opened and retained |

Both generated files measure 1200 by 675 pixels.
The reused cover measures 1200 by 630 pixels.
The writer opened every final asset and checked spelling, content, margins, clipping, and logo placement.
`image-usage.json` retains returned attempt-specific API usage.
No retries occurred.

## Local sanity passed without remote activity

- `TMPDIR=/private/tmp bun run data:validate`: passed with 37 existing locale-directory warnings.
- `bun run lint:mdx`: passed.
- Scoped English/Japanese link check: zero broken links, missing-locale links, locale mismatches, or relationship mismatches.
- Scoped link check: two intentional missing-translation fallbacks.
- `bun links:test`: 18 passed, zero failed, 95 assertions.
- `git diff --check`: passed.
- Translation checks: identical code blocks and external URL sets, matching heading counts and table shapes.
- Every referenced image exists with the required dimensions.

`usage-checkpoints.json` records actual emitted model counters and UTC phase checkpoints.
Cached input belongs inside input, and reasoning output belongs inside output.
The counters are cumulative session observations, not estimates of account quota usage.
The event timestamps can precede tool execution, so phase labels do not provide exact isolated generation costs.

The writer considered the parent README files and left shared README ownership with the coordinator.
The coordinator can add a batch index entry for G41 when assembling the stack.
The writer performed no push, pull-request mutation, comment, code review, third-party review, hosted CI, merge, or release.
The user's remote gate remains closed.
