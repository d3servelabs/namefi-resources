# The article distinguishes absolute DNS names from local name completion

Assignment: order 5, G35. The fixed historical demand slate supplies planning evidence, not current SEO estimates. Scope: FQDN notation, root label, search-list interpretation, zone origins, and safe read-only diagnosis. No Namefi product claims.

All sources below were fetched and read through the web tool on 2026-10-21 UTC. Dates identify actual fetches, not archive snapshots.

- https://www.rfc-editor.org/rfc/rfc9499.html#section-2 — Global DNS composition and formats, FQDN, hostname. Strict presentation includes the empty root label and separator; common display often omits the final dot. The terminology explicitly recognizes ambiguity. Article avoids declaring everyday dotless FQDN usage incorrect.
- https://www.rfc-editor.org/rfc/rfc1034.html#section-3.1 — Tree labels, complete versus relative names, local search-list context and implementation differences. Source lines 342–402 read. Hypothetical name decomposition and search examples apply these rules.
- https://www.rfc-editor.org/rfc/rfc1035.html#section-5.1 — Master-file absolute and relative domain names, origin concatenation, and @ notation. Lines 1778–1884 read. CNAME target example follows domain-name field rules. The article does not suggest arbitrary TXT contents or addresses acquire origins.
- https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility — Stable documentation displayed version 9.20.30. Read +domain, +ndots, +search/+nosearch, +showsearch, +short. +domain enables search and sets one suffix. Search is off by default. Commands are documented illustrative commands, not claimed executed observations. No fixed public resolver address or domain answer claimed.
- https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-s-dns-config — Pod DNS searches/options examples, generated resolv.conf and Windows-node caveats. Article claims only configurable search/options and platform differences, not a universal ordering or default cluster suffix.
- https://www.rfc-editor.org/rfc/rfc6066.html#section-3 — Server Name Indication HostName uses ASCII without a trailing dot. Source lines 333–347 read. Article uses this as a boundary example, not a claim of universal browser rejection, certificate matching behavior, cookies or redirects.

Research limits: man7 resolv.conf fetch timed out and supplies zero evidence. Latest BIND development manual was opened during discovery, then stable manual replaced development references. No current hosted-DNS provider form was audited, so article directs readers to the exact provider field instructions. The article makes no universal browser-URL trailing-dot recommendation. Reserved-domain examples are hypothetical and do not promise records exist.

Self-review: checked all inline external citations against the opened passages. Checked owner/target terminology, root label explanation, search versus fixed-origin distinction, and SNI boundary. Verified all five related blog and five glossary targets exist. Body has four H2 sections plus sources, one three-column table, no missing inline-image references, no series membership, and no product claims. Parent owns image generation, integrated validation, and publication. Reviewed parent READMEs; no scoped correction was needed for this standalone addition.

```json
{
  "image_scenes": [
    {"section":"A complete DNS name includes the root label","scene":"Show the DNS hierarchy root labeled empty root, then com, example, www. Beside the tree, show www.example.com. with the final dot highlighted and connected to the empty root label. Do not depict dots as servers.","short_name":"root-label"},
    {"section":"Local search lists can expand names before a lookup","scene":"Show hypothetical input printer and configured suffix office.example.com combining into printer.office.example.com. Compare an explicit api.example.com. query that bypasses suffix completion. Label the expansion as hypothetical and avoid implying all resolvers share one search order.","short_name":"search-context"},
    {"section":"Zone files use an origin to complete relative names","scene":"Show hypothetical origin example.com. with two owner-name paths: www becomes www.example.com.; www.example.com without its terminal dot becomes www.example.com.example.com. Mark the duplicated suffix clearly. Add an absolute www.example.com. path that stays complete.","short_name":"zone-origin"},
    {"section":"Controlled lookups separate naming errors from application failures","scene":"Show a diagnostic sequence: exact DNS query name, DNS response, then separate application connection check. Put a boundary between DNS notation example.com. and TLS SNI hostname example.com. Make clear the DNS dot rule does not prescribe public URL rewriting.","short_name":"diagnostic-boundary"}
  ]
}
```
