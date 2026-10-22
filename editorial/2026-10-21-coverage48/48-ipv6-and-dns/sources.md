# Opened primary sources support the IPv6 resolver guide

The source-check date is October 21, 2026, America/Los_Angeles.
The UTC collection interval is October 22, approximately 02:22–02:25.
The writer opened each source through the web tool and checked the relevant claim.
No command output in the published guide represents an actual network measurement.

| Opened source | Relevant location | Supported claims |
| --- | --- | --- |
| https://www.rfc-editor.org/rfc/rfc3596.html | Section 1, lines 86–88 | Query IP transport and record address family remain independent. |
| https://www.rfc-editor.org/rfc/rfc3901.html | Sections 1 and 4 | A recursive resolver needs reachable transport along referrals. Client transport does not establish upstream transport. The guide uses the reachability principle and does not portray the 2004 transition forecasts as current facts. |
| https://developers.google.com/speed/public-dns/docs/using | IP addresses and preparation | Both IPv6 and IPv4 address pairs, preservation of previous configuration, platform-specific instructions. |
| https://developers.cloudflare.com/1.1.1.1/ip-addresses/ | Standard service and Families tables | Standard IPv6 and IPv4 pairs, absence of content filtering for standard service, distinct filtered variants. |
| https://docs.quad9.net/services/ | 9.9.9.9 Secure | Secure IPv6 and IPv4 pairs, threat blocking, distinct unfiltered and ECS variants. |
| https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility | Simple usage and options, including lines 330–340 | Explicit server, name and type syntax. `-4` and `-6` select address family. |
| https://developers.google.com/speed/public-dns/docs/secure-transports | Introduction | Traditional UDP/TCP DNS lacks encryption. DoH and DoT provide separate encrypted transports. |
| https://www.rfc-editor.org/rfc/rfc2308.html#section-2 | Section 2 | NXDOMAIN versus an existing name without the requested data. |

The paired-query diagnostic table gives investigative leads. A timeout does not establish a specific routing or firewall cause.
The final resolver paragraph applies the existing self-hosted resolver article's cache and upstream distinction.
The article contains no operating-system menu instructions, measured speed rankings, global availability claims, or DNS changes.

## The locale decision uses actual service metadata and demand

The writer opened https://developers.google.com/google-ads/api/data/codes-formats and verified German criterion 1001.
The read-only GeoTargetConstant API verified Germany 2276 as country DE before the metrics call.
The first Geo API attempt used an incorrect endpoint separator and returned HTTPError.
The corrected endpoint succeeded. The failed request supplied no demand evidence.
The writer used only the successful historical response in `translation-demand.json`.

The writer read Astra's actual `src/i18n-config.ts`, which lists `de`.
The translation uses Germany German and glossary titles from `content/termbase.json`.
Google's German setup page and FRITZ!'s German instructions provide terminology and intent context.
The writer did not copy platform instructions into the article.
The translation preserves all source citation URLs, commands, numeric addresses, image paths, and four section purposes.
A deterministic local comparison confirmed identical ordered code spans and external URLs before final metadata completion.
The writer performed paragraph coverage and German readability checks locally.
No independent native reviewer participated during creation, under the user's no-review instruction.
