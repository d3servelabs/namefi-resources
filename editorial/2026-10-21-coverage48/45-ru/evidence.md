# This topic adds a Russia domain reference in English and German

T03/order45 adds `content/tld/en/ru.md` and a complete German counterpart.
A scan of existing English TLD titles, filenames, and Russia references found no equivalent .ru page.
The generic TLD article explains the hierarchy but does not cover Russia’s identity and registration rules.
The existing directory README remains accurate. Shared README edits belong to root.

## The current rules require more than the old English translation explains

Research ran on October 21, 2026, Pacific time (October 22 UTC).
The web fetcher returned403 for cctld.ru. The in-app browser rendered the English and Russian document directories and the September announcement.
An escalated curl fetch retrieved the actual PDFs from the browser-observed links.
`pdftotext` read the registry rules and dispute procedure. Local Apple Vision read every page of the scanned government resolution.
The private PDFs, extracted text, OCR program and API responses stay in `/private/tmp/namefi-stack48/45-ru/`.

Actually opened sources:

- https://www.iana.org/domains/root/db/ru.html — active ccTLD, Latin script, manager. No eligibility inference.
- https://cctld.ru/domains/docs/ — current Russian directory with government resolutions1119/1120.
- https://cctld.ru/en/domains/docs/ — English directory still links the2021 English PDF.
- https://cctld.ru/en/media/news/kc/40983/ — September2 announcement confirms effective-date and registrar-transition context.
- https://cctld.ru/files/pdf/docs/rules_gov.pdf — Resolution1119 effective2026-09-01. Paragraph4: .ru syntax;5: .рф distinction;9–13: contract, applicant data and ESIA;28–34: annual identification and30-day preferential period;50–56: delegation;74: cancellation.
- https://cctld.ru/files/pdf/docs/rules_ru-rf.pdf — Russian registry rules effective2026-05-25. Paragraphs2.1–2.7 distinguish common rules and customer contract.
- https://cctld.ru/files/pdf/docs/litigations.pdf — dispute procedure effective2026-05-25. Paragraph1.1 covers trademark/service-mark disputes. Paragraph1.4 prevents registrar unilateral satisfaction of third-party claims.
- https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf — English version dated2021, excluded as authority for current identity obligations.
- https://img.reg.ru/faq/publichnaya_oferta_reg_ru_site_07-24_220724.pdf — actual downloaded REG.RU public offer dated2024-07-22. Contract covers registration/renewal and references registry rules. The provider offer directory did not yield readable current contract content in the browser. Current provider-specific terms remain UNVERIFIED; the article makes no provider-specific eligibility, payment, refund, or availability promise.

The article follows the September government regulation for identity obligations.
The article does not copy the older one-year renewal mechanism as the full current administration process.
The article makes no blanket foreign-applicant, sanctions, payment-access, or financial claim.
The article treats foreign-entity information requirements as information requirements, not guaranteed practical eligibility.

## German demand justifies a full German page independently

Official language IDs were checked at https://developers.google.com/google-ads/api/data/codes-formats .
Russian1031, German1001, English1000. Official Google Ads API geo constants query verified Russia2643, Germany2276, US2840, Kazakhstan2398, each ENABLED.
Requests used GOOGLE_SEARCH, MCC3505976042, no extra network, fetched2026-10-22 UTC.
The attached raw historical-metrics records preserve close variants and monthly series. Missing keyword metrics mean UNKNOWN.

- English×US: `ru domain`1000/month, `ru internet domain`1000, `register ru domain`480. The original assigned demand slate had1000+1000. Close variants may overlap; do not sum.
- German×Germany: `ru domain`320, `ru domain registrieren`10, `ru domain kaufen`10. The neutral informational query and transactional queries support a full reference for German readers evaluating a Russian address. The German page is an independent market choice, not a Russian substitute.
- Russian×Russia: historical-metrics request rejected geo_target_constants[0] with INVALID_VALUE despite the exact official geo constant being ENABLED. Result UNKNOWN, not0. No guessed replacement Russia ID.
- Russian×Kazakhstan: `домен ru`10, `регистрация домена ru`10, `купить домен ru`30, `домен ру`20. The native Russian queries establish specific interest in the Russian-language market. Kazakhstan does not stand in for Russia.

Actual content folders and repo rules contain10 locales: en,ar,de,es,fr,hi,ja,ko,ta,zh-CN. Russian has no supported route. Russian translation remains deferred due unsupported routing plus unavailable Russia metrics. No unroutable draft or infrastructure changes.
Other supported languages remain deferred: no relevant measured market evidence in this topic, and no GSC country lead. UNKNOWN is not0.
GSC aggregate T03 matched0 rows,0 observed impressions/clicks for absent `/tld/ru/` from2026-09-21 through2026-10-18. An absent page supplies no evidence of zero market demand.
German informational/registration intent fits the exact native query meanings. Live searches for `ru domain registrieren` and `ru domain bedeutung` returned German registration pages (Formality and DomainProvider.de) and meaning guides. Search intent combines country meaning, requirements, and provider availability. The article does not adopt the snippets’ factual or pricing claims.

## Two new assets explain identity and ongoing administration

House scripts generated every attempt with gpt-image-2 high. Immutable scratch copies saved complete API responses before parsing and usage extraction.
Final cover `ru-og.jpg`1200×630: attempt1 failed lower-band reserve. Attempt2 passed visual QC: accurate title, official top-right logo, empty lower band and no cutoff.
Final inline `ru-01-registration.jpg`1200×675: attempt1 passed visual QC: four readable steps, full scene, cream margin, official top-right logo.
All three immutable attempt usage sidecars accompany this record. Full base64 responses remain private.
The English diagrams serve both locales; German alt text and prose fully translate the article.

## The locale pages preserve source coverage

The German translation preserves all source sections, list items, FAQs, citations, numbers, image references and ordered relationships.
Self-checks compare the full two-page content, sentence meaning, punctuation and register.
No independent review or hosted CI ran under the creation-phase prohibition.
Expected production URLs: https://namefi.io/r/en/tld/ru/ and https://namefi.io/r/de/tld/ru/ .
The renderer owns canonical/hreflang generation. Final deployment verification belongs to root.

## Local sanity checks passed after two metadata corrections

`TMPDIR=/private/tmp bun run data:validate` passed with37 pre-existing directory warnings and13 tests passed.
`bun run lint:mdx` passed.
Focused link audit of both new pages:0 broken,0 missing-locale,0 locale-mismatch,0 relationship-mismatch,0 missing-translation fallback.
The FAQ gate confirms every visible answer matches frontmatter.
Asset existence and dimensions passed. Every final generated image was opened for visual inspection.
Initial sanity caught missing visible FAQ blocks and incomplete relationship arrays. The final files include all required metadata and exact FAQ answers.
The root README, content README, TLD README, and assets README still describe the resulting layout correctly; no shared README change is needed.

Actual agent model from session metadata: gpt-6.1-sol.
The canonical usage path is `/root/coverage48_45_t03`.
Usage checkpoints contain actual emitted counters, with cached input already included in input and reasoning output already included in output.
Research, writing, translation and image work interleaved. No isolated image-start counter was captured. The translation-start boundary follows the English draft and the translation-end boundary includes evidence writing. These are emitted-event checkpoints, not exact disjoint per-stage billing counters.
All three image API attempts have immutable returned usage. Total image tokens:14160, including discarded cover attempt1. No missing image usage.
Russian routing, Russia Ads historical metrics, and current provider-specific contract terms remain explicitly deferred or unverified as described above. No other required package item remains missing.
