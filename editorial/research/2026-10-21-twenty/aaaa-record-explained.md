# The research supports a practical AAAA deployment guide

Assignment: G10, fixed historical title “The AAAA record, explained without the IPv6 lecture”. The historical demand slate supplies planning context, not current demand or ranking evidence. Scope: AAAA meaning, coexistence with A, deployment readiness, and failure diagnosis. Avoid a full IPv6 tutorial or a DNS-type catalog.

All sources below were opened through the web tool on 2026-10-21 UTC. No archive snapshots were obtained or asserted. No product capabilities or live domain answers are asserted. Examples are hypothetical.

- https://www.rfc-editor.org/rfc/rfc3596.html — sections 1 and 2.1–2.4. AAAA stores one 128-bit IPv6 address; multiple records support multiple addresses; AAAA queries return associated records. DNS transport and returned address family are independent.
- https://www.rfc-editor.org/rfc/rfc4213.html — sections 2 and 2.2. Dual-stack nodes implement both protocols; application availability is separate from stack availability; resolver libraries handle both A and AAAA. Supports distinction between DNS and application readiness.
- https://www.rfc-editor.org/rfc/rfc5952.html — sections 4.1–4.3. Canonical address rendering suppresses leading zeros, compresses the longest zero run, and uses lowercase. Equivalent textual representations need careful comparison.
- https://www.rfc-editor.org/rfc/rfc3849.html — sections 2–3. 2001:db8::/32 serves documentation, not deployable public service addresses.
- https://www.rfc-editor.org/rfc/rfc1035.html — sections 3.2.1, 3.4.1 and 5.1. Resource records carry owner, type, class, TTL and data. A carries an IPv4 address. TTL expresses cache lifetime in seconds. Master-file format supports example reading.
- https://www.rfc-editor.org/rfc/rfc2308.html — sections 2.1, 2.2, 3 and 5. NXDOMAIN means missing name; NODATA indicates missing requested type. Negative responses cache under SOA-based rules. Do not collapse empty terse output into NXDOMAIN.
- https://www.rfc-editor.org/rfc/rfc8305.html — sections 2–5 and 9.2–9.3. Happy Eyeballs coordinates DNS and connection attempts; connection success does not prove application correctness; fallback can hide operational faults. No universal client timing asserted.
- https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility — dig synopsis, simple usage, query options, return codes and examples. dig can query a specific type/server; +short hides context; exit zero includes NXDOMAIN. Latest docs currently identify development documentation; basic options are used without version-specific guarantees.
- https://curl.se/docs/manpage.html#-6 — --ipv4, --ipv6, --verbose, --max-time and --resolve options. Family-specific tests and hostname-preserving resolution overrides are supported. macOS resolver behavior can return mapped IPv4 addresses, so forced-family success is not universal native-path proof.

Uncertainty and review: no live hosting platform was selected, so the article makes no provider-specific DNS requirements, proxy-origin assumptions, certificate issuance promises, or setup UI claims. Operational checks are editorial recommendations derived from protocol separation. Readability pass must preserve four body sections and distinguish service tests from address lookups.

## The self-review checks the complete manuscript

The source review checked the AAAA definition, DNS transport distinction, text compression, record fields, negative caching, fallback boundaries, dig syntax and curl family behavior. The prose review removed universal propagation promises and retained hostname-specific tests. All five related article targets and five glossary targets exist. Four body sections and a three-column decision table satisfy structure. The body contains 1823 whitespace-delimited words after link-markup removal, excluding frontmatter and sources. Parent handles images and repository-wide validation.

```json
{
  "image_scenes": [
    {
      "section": "An AAAA record publishes an address for one hostname",
      "scene": "Show the hypothetical entry www.example.com. 300 IN AAAA 2001:db8::20 as five clearly labeled fields: hostname, TTL seconds, class, type, IPv6 address. Mark the address as documentation only.",
      "short_name": "record-fields"
    },
    {
      "section": "A working IPv6 endpoint determines whether you should add AAAA",
      "scene": "Show one hostname splitting into an A-to-IPv4 route and an AAAA-to-IPv6 route. Both reach matching website deployment cards. A readiness checklist verifies the public endpoint before AAAA publication.",
      "short_name": "dual-stack-readiness"
    },
    {
      "section": "DNS queries and connection tests answer different questions",
      "scene": "Show two distinct verification stages: a DNS lookup returns an AAAA value; a separate IPv6 HTTPS request tests the hostname and receives expected application content. Do not depict DNS lookup success as connection success.",
      "short_name": "separate-tests"
    },
    {
      "section": "A targeted rollback addresses broken IPv6 publication",
      "scene": "Show a migration incident with the A route reaching the new website while stale AAAA reaches an old endpoint. An operator corrects only the affected AAAA and then rechecks both routes. Include a cache clock to indicate existing cached answers can remain.",
      "short_name": "targeted-recovery"
    }
  ]
}
```
