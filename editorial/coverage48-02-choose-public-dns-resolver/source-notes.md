# Opened primary sources support the resolver guide

The writer opened the following primary sources on October 21, 2026 UTC. Direct citations remain inline because the site renderer can remove custom reference anchors. Product claims reflect the opened documentation. The article gives no measured provider ranking.

| Source | Opened passage and supported claim |
| --- | --- |
| [Cloudflare addresses](https://developers.cloudflare.com/1.1.1.1/ip-addresses/) | 1.1.1.1 and Families tables: standard service has no content filtering; exact IPv4/IPv6 pairs; separate malware and adult-content variants |
| [Cloudflare DoT](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-tls/#how-it-works) | How it works: one.one.one.one hostname and standard-service DoT addresses |
| [Cloudflare privacy](https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/) | Commitments 2–5 and Limited data sharing with APNIC: sampled packets, limited logs, deletion and anonymized metadata access |
| [Google setup](https://developers.google.com/speed/public-dns/docs/using#google_public_dns_ip_addresses) | Important: Before you start and address lists: preserve prior settings; IPv4/IPv6 addresses; configuration depends on client |
| [Google secure transports](https://developers.google.com/speed/public-dns/docs/secure-transports#endpoints) | Endpoints: dns.google DoT and HTTPS DoH endpoint. An ordinary address setting does not establish encryption |
| [Google privacy](https://developers.google.com/speed/public-dns/privacy) | Temporary and Permanent DNS Logs: deletion processes within 24–48 hours, security exceptions, sampled logs with location replacing client address; advertising-use limits |
| [Google security](https://developers.google.com/speed/public-dns/docs/security#dnssec) | DNSSEC: signature validation; encrypted transports cover a separate property |
| [Quad9 services](https://docs.quad9.net/services/#9999-secure) | 9.9.9.9 Secure table: threat blocking, IPv4/IPv6 addresses, dns.quad9.net DoT hostname. Other variants have different features |
| [Quad9 privacy](https://quad9.net/privacy/policy/) | Applicability: normal conditions; separate anomalous-conditions policy. Version 1.1 dated June 24, 2026 |
| [Quad9 FAQs](https://docs.quad9.net/FAQs/) | Protocol test; identifying a block; ECS: proto.on.quad9.net command and outputs, NXDOMAIN versus SERVFAIL limits, partial address disclosure to authoritative servers |
| [Mozilla protection levels](https://support.mozilla.org/en-US/kb/dns-over-https#w_protection-levels-explained) | Default protection falls back to default resolvers on issues. Max protection warns on secure-resolution failure. Browser scope differs from system scope |
| [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.3) | Resolver algorithm and caches: local information, referrals and recursive work |
| [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html#section-4) | Sections 3–5 and 12: DNS data authentication and integrity; no confidentiality or website-content trust guarantee |
| [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858.html#section-1) | Introduction: TLS secures the client–resolver transport against eavesdropping and on-path modification |
| [Google performance](https://developers.google.com/speed/public-dns/docs/performance#introduction_causes_and_mitigations_of_dns_latency) | Network latency and cache misses are distinct contributors. Local first queries do not establish public-cache emptiness |
| [Google troubleshooting](https://developers.google.com/speed/public-dns/docs/troubleshooting#problems_resolving_a_domain) | Domain-resolution failures, DNSSEC diagnostics and stale answers require evidence beyond a generic response code |

A separate Python evidence fetch received HTTP errors for Cloudflare documentation. The writer successfully opened the Cloudflare pages with the web tool and read the relevant tables and policy passages. Failed raw fetches supplied no supporting evidence. Raw temporary responses remain in the topic scratch directory, outside the published content and PR.

The original prose already covers privacy retention, validation and recovery. The writer retained those claims after source checks. The new material addresses general selection and configuration. No material contradiction required a repair to an existing translation because the assignment had no existing translations.
