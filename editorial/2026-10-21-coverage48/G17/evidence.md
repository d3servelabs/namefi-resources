# G17 updates the existing encrypted DNS comparison

The writer updated `content/blog/en/dns-over-https-vs-dns-over-tls.md` from base `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The title, slug, reader task, and existing useful sections remain.
The update adds a visibility table and Android hostname instructions.
The Android section distinguishes original DoT support from eligible DoH3 upgrades.
No previous translation existed. The writer added a complete German translation.
The writer used `gpt-6.1-sol` under the owner's GPT workflow override.

## The evidence supports one new German translation

The writer fetched direct Google Ads historical metrics on 2026-10-21 local time (2026-10-22 UTC).
Every request separately targets a language and country on `GOOGLE_SEARCH`.
The customer and login MCC is 3505976042.
The response series covers October 2025 through September 2026.
The JSON files preserve exact query text, close variants, averages, monthly series, geo, language, network, and fetch time.
The writer checked language IDs against Google's [official table](https://developers.google.com/google-ads/api/data/codes-formats) before requesting metrics.
The IDs are en 1000, de 1001, fr 1002, es 1003, ja 1005, ko 1012, zh-CN 1017, ar 1019, hi 1023, ta 1130.

| Locale and region | Returned monthly averages | Decision |
| --- | --- | --- |
| en, United States | dns over https 2400; dns over tls 720; private dns for android 1300; encrypted dns 880 | Update existing English comparison and add practical Android coverage |
| de, Germany | dns über https 210; dns über tls 20; dns verschlüsseln 70; privates dns android 320 | Select a full German comparison |
| fr, France | dns sur https 90; dns chiffré 50; dns privé android 590; dns sur tls UNKNOWN | Defer. Android setup dominates the native sample. Prioritize Germany's larger directly phrased HTTPS comparison demand for the first maintained translation |
| es, Spain | dns sobre https 20; dns sobre tls 10; dns cifrado 10; dns privado android 260 | Defer. The measured sample chiefly asks for phone setup, while the page's primary task compares transport boundaries |
| ja, Japan | dns 暗号 化 110; dns over https 720; プライベート dns android 210 | Defer. Relevant encryption demand exists, but the English protocol phrase does not establish a preference for Japanese prose. A future comparison-specific Japanese query sample would strengthen selection |
| ko, South Korea | dns over https 140; 안드로이드 프라이빗 dns 50; 암호화 dns UNKNOWN | Defer. Native comparison evidence remains insufficient for another maintained full translation |
| zh-CN, Singapore | 加密 dns 20; dns over https 320; 安 卓 私人 dns UNKNOWN | Defer. Do not treat the English phrase as proof of simplified Chinese reading preference |
| ar, Egypt | تشفير dns 10; dns عبر https UNKNOWN; dns الخاص اندرويد UNKNOWN | Defer. The native topic evidence remains sparse |
| hi, India | dns over https 590; both native-script queries UNKNOWN | Defer. Correct Hindi ID 1023 does not turn English phrase demand into Hindi prose demand |
| ta, India | dns over https 590; both native-script queries UNKNOWN | Defer. Tamil ID 1130 returns no usable native-script metrics |

The writer applies no universal numeric threshold.
The selected German sample covers both named protocols, encryption, and Android configuration.
The German [Cloudflare comparison](https://www.cloudflare.com/de-de/learning/dns/dns-over-tls/) and [Android help](https://support.google.com/android/answer/9654714?hl=de) confirm the local educational comparison and configuration intent.
The writer opened both pages after inspecting search results.
The writer treats other locale deferrals as maintenance priorities, not claims of absent demand.
Four initial requests returned HTTP 429. Separate `*-retry.json` responses preserve the successful retries.
UNKNOWN means the response omitted usable metrics. UNKNOWN never means zero.

The GSC supplement covers 2026-09-21 through 2026-10-18.
The topic aggregate contains zero matching observed rows, impressions, and clicks.
GSC observation limits prevent interpreting missing rows as zero market demand.
The writer did not commit whole-site private GSC data.

## The writer opened primary sources for the content

The writer opened all seven original cited sources and three Android sources on 2026-10-21.
The writer retained the original verified claims and added supported details.

| Opened primary source | Supported content |
| --- | --- |
| [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484.html), sections 3–4 and 8 | DoH endpoint selection, GET/POST, HTTPS authentication, HTTP privacy considerations |
| [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858.html), sections 1 and 3 | Stub-to-recursive scope, TLS over TCP, port 853, no cleartext on a failed DoT connection |
| [RFC 8310](https://www.rfc-editor.org/rfc/rfc8310.html#section-5), sections 4–6 | Strict and opportunistic profiles, authentication, initial address lookup |
| [RFC 9076](https://www.rfc-editor.org/rfc/rfc9076.html), sections 5.2 and 6 | Resolver visibility, transport boundaries, remaining metadata and traffic analysis |
| [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html#section-1) | DNSSEC origin authentication and integrity rather than confidentiality |
| [Firefox documentation](https://support.mozilla.org/en-US/kb/dns-over-https) | Default Protection fallback and Max Protection warning/exception behavior |
| [Google secure transports](https://developers.google.com/speed/public-dns/docs/secure-transports#endpoints) | dns.google, port 853, DoH URL and port 443 |
| [Android help](https://support.google.com/android/answer/9654714) | Private DNS menu, three choices, DNS-only protection |
| [Google Public DNS setup](https://developers.google.com/speed/public-dns/docs/using#android) | Provider hostname dns.google |
| [Android team's DoH3 announcement](https://security.googleblog.com/2022/07/dns-over-http3-in-android.html) | Eligible Android 11+ system updates can upgrade known resolvers to DoH3 |

The writer read the complete existing English page and the overlapping public-resolver and enterprise split-horizon pages.
The update keeps resolver policy comparison and enterprise deployment outside the page's central task.
No material contradiction required repair in a previous translation because no previous translation existed.
The added Android wording avoids the misleading generalization that every modern Private DNS connection necessarily uses DoT.

## The image records preserve two actual generation attempts

The writer used a private immutable copy of the repository's `inline-illustration.sh`.
The copy changes credential delivery to a header pipe and persists the complete response before decoding.
Each attempt has a separate fixed script and a separate private response.
The writer never edited a running script.
Both attempts used `gpt-image-2`, high quality, and 1536×1024 generation.
The house script cropped and resized the final image to 1200×675 and composited the official logo.

| Attempt | API input | API output | API total | Visual result |
| --- | --- | --- | --- | --- |
| 1 | 483 | 5488 | 5971 | Rejected because the heading touched and clipped the top edge after cropping |
| 2 | 465 | 5488 | 5953 | Accepted after removing the optional heading |

The final image is `content/assets/dns-over-https-vs-dns-over-tls-05-visibility-boundary.jpg`.
Both locale pages reference the final image.
The writer opened each final attempt at full size.
The accepted image has correct labels, cream margins, no cropped objects, and the official top-right logo.
The accepted image explains that the network cannot read the query while the resolver can.
The writer also inspected a contact sheet of the five reused assets.
The existing cover and four section illustrations still match the retained text.
English labels in reused shared technical diagrams remain shared art. German alt text fully describes the images.

The private response location is `/private/tmp/namefi-stack48/22-dns-over-https-vs-dns-over-tls/image-attemptN-response.private.json`.
Only sanitized usage sidecars enter Git.

## Local sanity passes and translation coverage matches

`data-validate.log` records a pass with 37 existing repository warnings.
`mdx.log` records a successful `bun run lint:mdx`.
`links.log` records two audited files with zero broken links, locale mismatches, relationship mismatches, and missing translations.
The writer confirmed image existence and dimensions: cover 1200×630, inline images 1200×675.
Both language files have seven headings and five inline images.
English has 2484 whitespace words. German has 2339 whitespace words.
The German page preserves every citation URL and every code span.
The German page contains no `/en/` internal route.
The German relationship arrays preserve English order and slugs.
The writer checked paragraph coverage, negation, strict/opportunistic outcomes, Android version caveats, tables, and diagnostic steps.
The termbase supplies canonical linked German terms.
Google's German Android help supplies the interface vocabulary.
The German page uses formal technical address and natural German punctuation.
No independent native reviewer or deployed renderer check ran under the local-only creation scope.
No review, hosted CI, remote write, PR operation, or publication occurred.

## The actual locale URLs remain two pages

- https://namefi.io/r/en/blog/dns-over-https-vs-dns-over-tls/
- https://namefi.io/r/de/blog/dns-over-https-vs-dns-over-tls/

The existing renderer owns self-canonical and reciprocal hreflang generation.
The expected language set is en and de, with English x-default.
The writer added no unsupported SEO frontmatter.
Deployment verification remains for the coordinator after the remote gate opens.

`usage-checkpoints.json` preserves actual latest emitted cumulative session counters, timestamps, and model identity.
The counters identify phase boundaries approximately at emitted events, not exact isolated phase billing.
Research, writing, German translation, and image phases can overlap.
Do not add cached input to input or reasoning output to output again.
No missing usage component is represented as zero.
The parent owns shared README updates. This topic requires no shared README change.
