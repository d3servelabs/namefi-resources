# The evidence distinguishes root discovery from domain service

Assignment: order 16, G07, `root-dns-servers`. Fixed historical demand slate. No fresh keyword demand inference. Research fetched sources on 2026-10-21 UTC. The article uses protocol facts and explicitly hypothetical troubleshooting examples. Parent owns imagery and publication.

## The sources support the article's technical boundaries

| Source and locator | Evidence and use |
| --- | --- |
| https://www.iana.org/domains/root — opening description | Root highest zone, chiefly TLD delegations; IANA coordinates TLD managers and technical delegation information. |
| https://www.iana.org/domains/root/servers — introduction, authority table, Configuring the Root Servers | Thirteen named authorities A–M; IPv4/IPv6 addresses; many instances; root hints bootstrap resolution. No numerical instance total appears in article. |
| https://root-servers.org/faq/ — root-domain, identifier, instance and filtering questions | Root stable discovery point; identifiers differ from operators/instances; each identifier has IPv4 and IPv6; instance counts change; operators commit to complete unmodified IANA namespace. |
| https://root-servers.org/ — introductory inventory and operator listings | Current dated inventory exists. Article links inventory without freezing numerical counts or asserting topology is static. |
| https://www.rfc-editor.org/rfc/rfc9499.html#section-6 — DNS Servers and Clients | Stub/recursive/authoritative roles; anycast definition; instance meaning; distinctions from root hints. Used current terminology instead of superseded RFC 8499. |
| https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.2 — referral algorithm | Child NS records in authority and useful addresses/glue in additional section. Root referral does not forward application traffic. |
| https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.2 and section-5.3.3 | Cache TTL expiry, local information first, cache/use better delegation. Lookup does not always restart at root. |
| https://www.iana.org/domains/root/files — Root Zone Files | Root hints versus root zone versus cryptographic trust anchors. Distinct files and purposes. |
| https://www.rfc-editor.org/rfc/rfc8109.html#section-2 and section-3 | Priming QNAME '.', QTYPE NS; vendor hints may age; repeat only when needed; use another target after no response. Article omits implementation-specific timing. |
| https://www.rfc-editor.org/rfc/rfc9156.html#section-2 — sections 1–3 | Full QNAME need not reach root; minimize labels; warm cache and query limits matter; upstream recursive resolver still receives full original request. |
| https://www.rfc-editor.org/rfc/rfc4033.html#section-2 — trust-anchor definition; sections 3–4 | Trust anchor begins authentication chain; origin authentication and integrity; no confidentiality or denial-of-service protection. Registration ownership is a separate question. |
| https://www.iana.org/dnssec/files — introduction, Root Zone Trust Anchors | Root KSK anchor and rollover guidance; no copied key value, planned rollover date, or unsupported current key-status assertion. |
| https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility — dig syntax, +trace, +norecurse | `dig . NS` uses configured resolver; +trace performs iterative referral tracing, not a replay of browser resolver activity. Commands read DNS; no record edits. |

Every row above records a source opened with the web tool on 2026-10-21 UTC. No source quotations appear in the public article. Article uses direct inline primary-source links. No archive snapshot was obtained or invented.

## The review preserves material limits

The first attempted FAQ URL, `/faq.html`, failed. That URL supplied zero evidence. The actual linked `/faq/` page opened and supplied the evidence above. RFC 8499 opened during discovery, but the article cites RFC 9499 for current terminology. The article deliberately avoids the FAQ's historical “most recently 2016” incident claim and numerical traffic/latency generalizations. Live root-server instance counts change, so the public article does not state a current total. Hypothetical network-policy examples and recommended evidence collection are editorial diagnostic reasoning, not measured incidents. The article makes no Namefi feature claims.

The source review checked root referrals, cache reuse, query minimization, anycast scope, and trust-anchor limits. The text review checked short active sentences, concrete H2 claims, no unsupported outage conclusions, four body H2 sections, and five existing related article/glossary paths. Parent will add images before final repository validation.

## The four illustrations explain the four body sections

```json
{
  "image_scenes": [
    {
      "section": "Root servers provide referrals to the next authority",
      "scene": "A recursive resolver sends separate numbered queries to root, .com, and example.com authoritative servers. Return arrows show .com referral, example.com referral, and final address. Root never forwards the request. A website connection appears separately after DNS.",
      "short_name": "referral-path"
    },
    {
      "section": "Thirteen identifiers represent a distributed service",
      "scene": "Thirteen small identifier tiles A through M sit above a world map. Expand one identifier into several physical instance symbols sharing one IPv4/IPv6 service identity. Show routing choosing one instance, without implying geographic nearest selection or a fixed instance total.",
      "short_name": "identifiers-instances"
    },
    {
      "section": "Caches and minimized queries change the lookup path",
      "scene": "Two parallel DNS lookup paths show a cold resolver discovering .com at root and a warm resolver reusing a cached .com delegation. The root query label reads com., while the original request reads www.example.com. Root hints and a priming query for dot NS appear as a small startup inset.",
      "short_name": "cache-minimization"
    },
    {
      "section": "DNSSEC and diagnostics answer different questions",
      "scene": "A root trust anchor starts a signature-validation chain through .com to example.com, labeled DNS data authenticity. Beside the chain, a diagnostic panel separates recursive answer, iterative trace, and website connection. A registrar-account document sits outside the validation chain to distinguish domain ownership from DNS authentication.",
      "short_name": "trust-diagnostics"
    }
  ]
}
```

## The coordinator updated the priming specification

The coordinator discovered that RFC 9609 obsoletes RFC 8109. On 2026-10-21, the coordinator opened RFC 9609 sections 2–4 and read root identifier changes, NS query structure, expiry-based repetition and retry requirements. The public article now cites RFC 9609. This correction belongs to coordinator overhead after the writer end boundary.
