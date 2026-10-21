# Evidence supports a resolver decision guide

Assignment: order 2, G01. Fixed title: Which public DNS resolver should you actually use? Scope: privacy, DNSSEC validation, filtering, and failure behavior. Locale: en-US. Historical demand slate establishes assignment only, not current demand. Research fetched 2026-10-21 UTC.

## The following primary sources support the manuscript

- https://developers.cloudflare.com/1.1.1.1/ip-addresses/ — “1.1.1.1” and “1.1.1.1 for Families”: standard IPv4 pair 1.1.1.1/1.0.0.1 has no content filtering. Separate .2 pair blocks malware and .3 pair adds adult-content filtering.
- https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/ — “Cloudflare’s commitment to privacy”: limited logs, IP truncation and 25-hour deletion commitments; sampled packet exception. Avoid absolute no-logging claim. APNIC access to anonymized metadata has its own section.
- https://developers.google.com/speed/public-dns/privacy — “Our Commitment,” “Temporary DNS Logs,” “Permanent DNS Logs”: no ad targeting with personal DNS data; temporary IP+query logs subject to deletion within 24–48 hours with security/abuse extension; sampled permanent logs replace client IP with location. Initial /docs/privacy URL failed and provides zero evidence; canonical /privacy URL opened successfully.
- https://developers.google.com/speed/public-dns/docs/using — “Before you start” and “Google Public DNS IP addresses”: save previous settings; 8.8.8.8/8.8.4.4; IPv6 settings separate. Platform instructions vary.
- https://developers.google.com/speed/public-dns/docs/security — “DNSSEC” and “Client-side encrypted transports”: Google validates DNSSEC and supports DoH/DoT.
- https://docs.quad9.net/services/ — “9.9.9.9 (Secure)”: threat-blocking service, 9.9.9.9/149.112.112.112; DoT dns.quad9.net; DoH https://dns.quad9.net/dns-query. Other variants differ.
- https://quad9.net/privacy/policy/ — applicability and IP address treatment: version 1.1 June 24, 2026; normal and anomalous conditions have separate policies. No absolute privacy claim.
- https://docs.quad9.net/FAQs/ — “Protocol Test,” “Identifying a Quad9 block,” “What is EDNS Client Subnet”: protocol test TXT proto.on.quad9.net; NXDOMAIN may be filter or nonexistence; DNSSEC failure SERVFAIL; ECS sends partial address upstream.
- https://support.mozilla.org/en-US/kb/dns-over-https — “Protection levels explained”: default may fall back, max warns, enterprise/VPN considerations. Browser behavior is product-specific.
- https://www.rfc-editor.org/rfc/rfc4033.html#section-3 — sections 3–5 and 12: authentication/integrity, not confidentiality; unsigned data and misconfiguration limitations.
- https://www.rfc-editor.org/rfc/rfc7858.html#section-1 — client/resolver transport confidentiality, not provider anonymity; section 3 TLS sessions.
- https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.3 — resolver cache, delegations and TTL. Explains why new resolver settings do not edit authoritative DNS.
- https://developers.google.com/speed/public-dns/docs/troubleshooting — “Problems resolving a domain,” “Returning the wrong answers”: validation diagnostics, cached answers, inconsistent authoritative data, network interception.

## The review preserves material limits

No latency benchmark was performed. Recommendations are conditional editorial judgments, not speed rankings. No claim establishes legal protection, anonymity, complete malware blocking or uptime. No archive snapshots were fetched or invented. Source word budgets require concise policy summaries. Public article avoids unverified Google filtering assertions and unverified Cloudflare DNSSEC details. Parent owns imagery and publishing. Relevant README inventory changes belong to parent because writers may modify only assigned files.

## Text and source review checked the finished article

The complete 1,832-word body received a claim-to-source review, product-policy boundary review, and natural-prose review. All ten related article/glossary targets and all first-mention glossary targets exist. Four body H2 sections precede the required sources H2. The comparison table has three columns. Commands query services without mutating settings. No image references exist before image generation. The assigned question title remains unchanged as required. Source claims stay within concise per-source summaries. No Namefi product capability is asserted. Full repository validation remains with parent after images arrive.

```json
{
  "image_scenes": [
    {
      "section": "A resolver choice changes who answers your device",
      "scene": "Device sends a query to recursive resolver; resolver checks cache then authoritative DNS. Separate arrows show encrypted client transport and DNSSEC signature validation. Label DNSSEC integrity and transport confidentiality distinctly.",
      "short_name": "resolver-boundaries"
    },
    {
      "section": "Provider policies narrow the practical shortlist",
      "scene": "Four equal service cards show Cloudflare standard without filtering, Cloudflare Families category filtering, Quad9 secure threat blocking, and Google validation. Below cards show a policy document and local test device without ranking medals or speed numbers.",
      "short_name": "policy-shortlist"
    },
    {
      "section": "Filtering and validation require different recovery decisions",
      "scene": "Two diagnostic branches: Quad9 filter NXDOMAIN leads to classification review; DNSSEC SERVFAIL leads to domain signature investigation. A separate nonexistent-name NXDOMAIN branch prevents equating every NXDOMAIN with filtering.",
      "short_name": "failure-diagnosis"
    },
    {
      "section": "A reversible trial verifies the resolver and its fallback",
      "scene": "Sequential personal-device trial: save settings, select variant and encrypted transport, verify system and browser paths, test VPN and normal applications, restore settings. A fork contrasts encrypted failure warning with fallback to default resolver.",
      "short_name": "reversible-trial"
    }
  ]
}
```
