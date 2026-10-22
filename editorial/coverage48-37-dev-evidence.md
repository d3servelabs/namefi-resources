# The .dev update clarifies registration rules and HTTPS setup

This O08 package updates the existing English URL. The source keeps the existing title and reader job. The update removes unsupported reputation, availability, and infrastructure comparisons. Google Registry policy confirms open registration. The registration policy adds protected-name conditions that the old page omitted. IANA confirms only the operator and delegation date.

The update corrects the general-availability date to February 28, 2019. The registry announcement and contemporaneous Google Developers post agree. The old English, Japanese, Korean, and Tamil pages used March 1.

## Primary sources support distinct claims

The writer opened these sources on October 21, 2026, America/Los_Angeles:

- https://www.registry.google/policies/ — open TLD status, including .dev.
- https://www.registry.google/policies/registration/dev/ — required HTTPS notice, two-letter-name and protected-organization conditions.
- https://www.registry.google/policies/pricing/dev/ — separate registration, premium, renewal, transfer, and restore fee categories.
- https://www.registry.google/faqs/ — Charleston Road Registry relationship to Google.
- https://www.registry.google/domains/dev/ — namespace preloading and developer examples.
- https://www.registry.google/announcements/launch-details-for-dev/ — general availability on February 28, 2019.
- https://developers.googleblog.com/dev-for-all/ — contemporaneous public-registration confirmation.
- https://www.iana.org/domains/root/db/dev.html — operator, delegation, gTLD status only.
- https://hstspreload.org/ — upgrades, connection failure, subdomains including internal hosts.
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security — browser scope and certificate handling.
- https://developers.google.com/search/blog/2015/07/googles-handling-of-new-top-level — generic-TLD ranking treatment.

The old multi-regional Search Central URL returned 404. The new source supports the replacement SEO wording. This update makes no numeric registration-term claim. Readers must check the registrar's offered term and renewal quote.

## Measured demand supports one complete German refresh

`coverage48-37-dev-demand.json` preserves complete request fields, close variants, averages, and monthly series. The API used Namefi MCC 3505976042, Google Search, separate country and language targets, and October 2025 through September 2026 monthly period returned by Google. Fetch date: October 22 UTC, October 21 local. Missing metrics mean UNKNOWN.

The writer verified language IDs against https://developers.google.com/google-ads/api/data/codes-formats before requests: de 1001, ja 1005, es 1003, ko 1012, fr 1002. Country targets: Germany 2276, Japan 2392, Spain 2724, South Korea 2410, France 2250.

| Language and region | Returned keyword averages per month | Decision |
| --- | --- | --- |
| German, Germany | dev domain 590; dev domain kaufen 20; dev domain registrieren 10 | Complete refresh of the existing short page. Commercial variants and a weak existing page justify maintenance. |
| Japanese, Japan | dev ドメイン 390; dev ドメイン 取得 30; dev ドメイン 料金 UNKNOWN | Preserve existing detailed page and repair critical facts. Defer full synchronization. |
| Spanish, Spain | dominio dev 90; comprar dominio dev 10; registrar dominio dev 10 | Preserve existing page and repair security claim. Defer full expansion. |
| Korean, South Korea | dev 도메인 170; dev 도메인 구매 20; dev 도메인 등록 UNKNOWN | Preserve detailed page and repair critical facts. Defer full synchronization. |
| French, France | domaine dev 10; nom de domaine dev 20; acheter domaine dev UNKNOWN | Preserve existing page and repair security claim. Defer full expansion. |

These figures are not a universal selection threshold. German has the largest measured broad-query demand in the evaluated markets and an existing short page. The German result intent includes registrar purchase pages with HTTPS guidance. The writer opened https://www.inwx.de/de/dev-domain to inspect that intent. The Japanese and Korean pages already contain fuller material. Existing German terminology and the termbase guided the translation. No native human review occurred.

The GSC supplement covers September 21 through October 18, 2026, final web data. O08 has 6,350 observed impressions and 19 clicks. South Korea contributes 2,361 impressions and 15 clicks, France 621 impressions, Germany 51, and Spain 85. These are site observations, not market totals. A missing query is not zero demand. The sanitized per-topic private record resides at `/private/tmp/namefi-stack48/37-dev/gsc-O08.json`.

Arabic, Hindi, Tamil, and Chinese receive necessary safety corrections only. This package makes no demand-based expansion decision for those markets. Demand remains unmeasured, not zero. No new locale or runtime changes occur.

## Existing translations retain their scope while receiving safety corrections

German now covers every revised English section, FAQ, citation, and image. Relationship slugs follow English in the same order with the German locale prefix. Eight other existing translations remain. The writer removes maximum-security claims from short pages and removes the impossible insecure-site guarantee from Japanese, Korean, and Tamil. Localized notes clarify browser scope, internal subdomains, and the limits of HSTS. Japanese, Korean, and Tamil also receive the corrected launch date and source.

Japanese, Korean, and Tamil also receive source-backed replacements for unsupported reputation and pricing paragraphs. Eight preserved translations do not incorporate every new English section. A later complete refresh remains optional. The package does not describe all ten languages as synchronized.

## One generated image explains the HTTPS setup

Asset: `content/assets/dev-01-https-setup.jpg`, 1200×675. English and German reference the asset. The writer used the repository inline-image script with a private immutable attempt copy, gpt-image-2, high quality. The copy persists the complete API response before parsing. No retries occurred.

Private response: `/private/tmp/namefi-stack48/37-dev/image-attempt1-response-private.json`. Immutable usage: `/private/tmp/namefi-stack48/37-dev/image-attempt1-usage.json`. API usage: input 427, output 5,488, total 5,915. The API did not return a model field. The request specifies gpt-image-2.

The writer opened the final JPEG. The final image passes spelling, crop, generous cream margins, compact scene, and official top-right logo checks. The browser labels read example.dev and docs.example.dev correctly. The image has no clipped objects. This inline image does not require the cover's bottom caption reserve.

## The renderer supports the existing ten locale URLs

The writer inspected Astra `src/i18n-config.ts` and `src/app/[lang]/tld/[slug]/page.tsx`. The supported locale set is en, es, de, fr, zh-CN, ar, hi, ko, ja, ta. The renderer self-canonicalizes each locale and includes only real translations in hreflang. English supplies x-default. No manual SEO frontmatter keys are necessary.

Expected URLs: `https://namefi.io/r/{locale}/tld/dev` for all ten locales above. All ten files already exist. The package performs no deployed-page check, hosted CI, review, push, PR, merge, or release.

## Actual usage checkpoints preserve their boundary limitations

Private phase counters reside at `/private/tmp/namefi-stack48/37-dev/usage-checkpoints.json`. The canonical agent is `/root/stack48_coordinator/coverage48_37_o08`. The helper reports actual model gpt-6.1-sol and emitted cumulative counters. Capture timestamps differ from token-event timestamps. The image-start checkpoint occurred after launch, so the checkpoint is not an exact request boundary. No token estimate replaces unavailable boundaries.

## Local sanity checks pass without hosted services

`bun data:validate` passes with 37 existing warnings. The locale check reports zero locale mismatches and zero relationship mismatches. FAQ synchronization passes. `bun lint:mdx` passes. The focused audit reports zero broken links, zero missing locales, zero locale mismatches, and zero relationship mismatches. Three existing Tamil tech-page links use the intentional English fallback. The final asset check confirms 1200×675 dimensions. English and German have nine main sections, four FAQs, and identical external citation sets. No shared README update is needed because the package changes content and adds one planning artifact pair without changing directory responsibilities.
