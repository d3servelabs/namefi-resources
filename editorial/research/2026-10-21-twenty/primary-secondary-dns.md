# Primary and secondary DNS servers replicate authoritative zone data

Assignment: order 19 / G06, fixed historical demand slate. Article locale: en-US. Source retrieval: 2026-10-21 UTC. The slate establishes the authorized topic, not current demand or ranking forecasts.

## The sources support separate replication and query roles

Every source below opened successfully through the web tool. The Microsoft page displayed an authorization banner, but also returned the complete public article, including the two-server table and negative-answer rule. No claim relies on the banner or an inaccessible portion. No archive snapshots were collected or invented.

| Source and locator | Verified evidence | Scope |
| --- | --- | --- |
| https://www.rfc-editor.org/rfc/rfc9499.html#section-6 | Primary supplies AXFR/IXFR data, secondary retrieves zones, hidden primary absent from NS set. | Terminology, not provider capabilities. |
| https://www.rfc-editor.org/rfc/rfc2182.html#section-3 | Primary-secondary distinction does not determine resolver priority. Servers initially have equal standing. | Authoritative query behavior. |
| https://www.rfc-editor.org/rfc/rfc2182.html#section-3.1 | Geographic and network diversity mitigate shared failures. | Deployment guidance, no availability guarantee. |
| https://www.rfc-editor.org/rfc/rfc2182.html#section-7 | Serial advancement and controlled recovery matter. Simple decrement fails. | Article avoids copying hazardous numeric recovery sequences. |
| https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.5 | Periodic SOA checks, refresh/retry/expire maintenance, secondary discards obsolete data. | Classic authoritative maintenance, not an unlimited backup promise. |
| https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.1 | Recursive/nonrecursive behavior and local zone/cache distinctions. | Diagnostic separation. |
| https://www.rfc-editor.org/rfc/rfc1035.html#section-3.3.13 | SOA serial uses 32-bit sequence-space comparison, refresh/retry/expire fields have distinct meanings. | Date-like serial is illustrative. |
| https://www.rfc-editor.org/rfc/rfc5936.html#section-2 | AXFR carries zone data. | Protocol, not a hosting plan feature. |
| https://www.rfc-editor.org/rfc/rfc5936.html#section-4 | Ordinary AXFR uses TCP. | Does not deny later encrypted transfer standards. |
| https://www.rfc-editor.org/rfc/rfc1995.html#section-2 | IXFR carries changes when history permits, can return full zone. | No assumption that every service supports IXFR. |
| https://www.rfc-editor.org/rfc/rfc1996.html#section-2 | Transfer dependency relationships can involve authoritative servers in multiple roles. | Per-zone roles. |
| https://www.rfc-editor.org/rfc/rfc1996.html#section-3 | NOTIFY prompts a check. NOTIFY payload must not replace local zone data. | Acknowledgment does not prove completed replication. |
| https://bind9.readthedocs.io/en/stable/chapter3.html#authoritative-name-servers | Primary/secondary examples, primaries, allow-transfer, NOTIFY, secondary storage. | ISC examples, not universal provider configuration. |
| https://bind9.readthedocs.io/en/stable/chapter3.html#resolver-caching-name-servers | Resolver caches answers until TTL expiration. | TTL does not replace zone expiry. |
| https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/dns-client-resolution-timeouts#what-is-the-default-behavior-of-a-dns-client-when-two-dns-servers-are-configured-on-the-nic | Two-server client table distinguishes no response from Name Error, which stops retries. | Windows example only, no universal client algorithm. |
| https://www.rfc-editor.org/rfc/rfc8945.html#section-1.2 | Shared-secret MAC authenticates DNS transactions. Section 1.1 covers zone-transfer integrity and secret protection. | Authentication, not encryption. |
| https://bind9.readthedocs.io/en/stable/chapter7.html#tsig | BIND uses TSIG for server communication and transfers. | Implementation example. |
| https://www.rfc-editor.org/rfc/rfc9103.html#section-7 | Zone transfer over TLS, secondary initiates connection. Section 7.5 requires protected transfer/authentication policy. | Standards support does not prove endpoint support. |

## The review checked complete text and existing routes

The manuscript contains 1,910 substantive body words, excluding frontmatter and sources. The manuscript has four body H2 sections and one sources H2. Both comparison tables have three columns. All ten related article/glossary routes resolve to existing English files. The article adds no series membership and makes no Namefi capability claims. The article contains no missing inline image references. The cover path awaits the parent image step.

The text review checked each protocol claim against the opened passages. The review checked serial wraparound wording, notification versus transfer, stale data versus expiry, query peer status, and TSIG versus confidentiality. All prose sentences remain within 25 whitespace-separated words after removing Markdown link syntax. The review found no MDX tool artifacts. `git diff --check` returned no findings for the article. Full repository validators and image verification belong to the parent publication pass.

The practical checks and failure table are editorial applications of the protocol facts. Matching serials alone do not prove identical data. The article recommends comparing actual records without claiming an automated proof. No production settings, credentials, or live domains appear in examples.

The directory READMEs remain accurate about English independent publication and editorial records. The parent owns the batch inventory update, so this assignment changes no shared README.

## The parent can illustrate four verified mechanisms

```json
{
  "image_scenes": [
    {
      "section": "Primary and secondary servers both answer authoritative queries",
      "scene": "A resolver sends independent query arrows to a primary server and a secondary server. Both servers return the same example.com answer. A separate lower panel shows a laptop with two resolver endpoints, clearly distinct from the authoritative replication pair. Label public authoritative servers as peers, not first-choice and backup.",
      "short_name": "authoritative-peers"
    },
    {
      "section": "Zone transfers distribute changes after a serial check",
      "scene": "A primary publishes serial 2026102102 while a secondary starts at 2026102101. Show NOTIFY primary-to-secondary, an SOA check secondary-to-primary, then a transfer request secondary-to-primary and returned zone data primary-to-secondary. Show AXFR as a complete zone document and IXFR as changed record fragments, with a small full-transfer fallback arrow.",
      "short_name": "transfer-sequence"
    },
    {
      "section": "Independent servers limit outages but cannot preserve freshness forever",
      "scene": "A primary site loses its network connection while a geographically separate secondary still answers from its current zone copy. A timeline marks refresh attempts, retries, then expiry where authoritative service for the obsolete copy stops. A separate TTL marker near a resolver cache clarifies that record caching uses a different timer.",
      "short_name": "outage-expiry"
    },
    {
      "section": "Operators must verify data and protect transfer access",
      "scene": "An operator compares matching SOA serials and actual www.example.com record values on two authoritative servers. Show public query access separately from an authorized transfer path. Place a TSIG authentication badge beside the transfer messages and a distinct TLS encrypted tunnel around the transport, avoiding any claim that TSIG itself encrypts data.",
      "short_name": "verify-protect"
    }
  ]
}
```
