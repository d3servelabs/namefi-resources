# The guide follows practical DNS dependencies

Assignment: order 8, G11, `dns-record-types-guide`. Historical demand slate fixes the subject, not current search volume. Writer session: `/root/w20_08`. All research used public primary sources. Fetch date: 2026-10-21 UTC, approximately 19:38–19:43 UTC. No archive snapshot was obtained or invented.

## The source record separates protocols from provider features

- https://www.rfc-editor.org/rfc/rfc1034.html — sections 3.6.2 and 4.2.1. Verified alias processing, apex NS/SOA requirements, delegation boundaries and in-zone nameserver glue. The apex CNAME conclusion follows from coexistence requirements, not a separate provider restriction.
- https://www.rfc-editor.org/rfc/rfc1035.html — sections 3.3.9, 3.3.11–3.3.14, 3.4.1 and 3.5. Verified MX preference and hostname, NS authority, PTR name, SOA serial/timing data, TXT container, A address, and address-based reverse hierarchy. The article does not repeat the obsolete original SOA MINIMUM interpretation.
- https://www.rfc-editor.org/rfc/rfc2181.html — sections 8, 10.1 and 10.3. Verified TTL is a maximum lifetime, CNAME excludes ordinary coexisting data, and MX/NS targets require address records rather than aliases. Historical DNSSEC names in this RFC do not represent the modern record names.
- https://www.rfc-editor.org/rfc/rfc3596.html — section 2. Verified AAAA IPv6 address format, separate from A.
- https://developers.cloudflare.com/dns/cname-flattening/ — “How it works” and “Aspects to keep in mind.” Verified provider resolves CNAME targets and returns final IP addresses. This is a named provider example, not a universal ALIAS/ANAME implementation claim. Flattening can break checks requiring literal CNAME answers, although the article avoids expanding that separate troubleshooting topic.
- https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/ — “SOA.” Verified Cloudflare creates SOA automatically for its authoritative DNS. The article names Cloudflare rather than asserting every managed provider behaves identically.
- https://www.rfc-editor.org/rfc/rfc9460.html — abstract, sections 2–3 and 9. Verified SVCB/HTTPS endpoint parameters, HTTPS specialization, AliasMode and apex compatibility. The article preserves address fallback and avoids claiming universal client support.
- https://www.rfc-editor.org/rfc/rfc7208.html — sections 3.1–3.3. Verified TXT publication for SPF and prohibition against multiple selectable SPF records. Separate unrelated TXT records do not imply duplicate SPF.
- https://www.rfc-editor.org/rfc/rfc6376.html — section 3.6.2, especially 3.6.2.1–3.6.2.2. Verified selector plus `_domainkey` namespace and DNS TXT key retrieval. Alias instructions remain conditional on actual provider requirements.
- https://www.rfc-editor.org/rfc/rfc4034.html — sections 2–5. Verified DNSKEY, RRSIG, NSEC, DS roles, DS parent placement, and explicit CNAME DNSSEC metadata coexistence. Article does not claim all signed zones use NSEC rather than NSEC3.
- https://www.rfc-editor.org/rfc/rfc8659.html — section 3. Verified effective CAA lookup follows DNS resolution and climbs ancestor names. CAA affects issuance authorization and does not deploy a certificate.
- https://www.rfc-editor.org/rfc/rfc2782.html — “The format of the SRV RR.” Verified priority, weight, port, target, address requirement and target alias prohibition. Client must implement relevant service lookup.
- https://www.rfc-editor.org/rfc/rfc2308.html — section 5. Verified NXDOMAIN and NODATA caching and SOA-based negative TTL. No universal propagation delay appears in the article.

Every source above was opened with the web tool, and relevant source passages were read. All sources materially support manuscript claims. Practical inventory, migration, and recovery guidance is editorial synthesis from the verified dependencies, rather than a claimed protocol mandate.

## The review keeps the scope distinct from the glossary

The existing `dns-record-types` glossary defines common types. This article organizes types around application dependencies, migration decisions, policy checks and recovery. Generic examples use reserved domains and documentation addresses. The manuscript makes no Namefi product claims and gives no commands that overwrite records.

The review checked all factual paragraphs against the source record. The review specifically retained DNSSEC metadata exceptions for CNAME, separated apex flattening from wire CNAME behavior, and restricted SRV usefulness to supporting applications. The review replaced an overbroad managed-provider SOA claim with Cloudflare's documented policy. All five related articles and five related glossary targets exist. Four body H2 sections precede the required source section. Both tables have three short columns. The 126-character description satisfies the limit. Parent handles imagery and batch validation/publication. No README changes are needed for this individual manuscript because the parent owns the batch inventory.

Body count: 1,846 whitespace-separated words after removing frontmatter, the source section and Markdown link destinations. The count includes headings and short table cells.

## Four illustrations explain the dependency checks

```json
{
  "image_scenes": [
    {
      "section": "Website records connect names to reachable services",
      "short_name": "website-record-paths",
      "scene": "Show www.example.com branching to an A card with 192.0.2.20, an AAAA card with 2001:db8::20, and a CNAME card leading to site.example.net then address cards. Add a separate apex panel labeled SOA + NS with ordinary CNAME blocked. A provider flattening panel returns address cards rather than a CNAME. Keep the DNSSEC metadata exception in a small explicit annotation."
    },
    {
      "section": "Email records divide delivery from sender authentication",
      "short_name": "email-dependencies",
      "scene": "Show three distinct mail checks: incoming mail follows example.com MX to mail.example.net then address records; SPF reads a TXT policy; DKIM reads selector1._domainkey.example.com for a public key. Show a website A record in a separate lane. Do not depict MX as pointing to an IP address or SPF as controlling incoming delivery."
    },
    {
      "section": "Authority and policy records control separate decisions",
      "short_name": "authority-policy",
      "scene": "Show parent delegation NS directing a resolver to the child zone's authoritative servers. Beside the child zone place SOA management data and DNSKEY/RRSIG signature data, with a parent DS connection to the child key. Put CAA on a separate certificate-issuance decision path and SRV on a service-discovery path. Labels must distinguish DNS authority, validation, and certificate authorization."
    },
    {
      "section": "A controlled change preserves records and tests dependencies",
      "short_name": "change-verification",
      "scene": "Show a saved zone inventory followed by a specific record edit, authoritative-server checks, recursive-cache checks and separate website/email/certificate application checks. Include old cached positive and negative answer cards with countdown clocks. A recovery arrow restores only the changed record from the inventory. Avoid a fixed universal propagation duration."
    }
  ]
}
```
