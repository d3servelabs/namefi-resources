# The source record supports explicit nslookup comparisons

Assignment: order 11, G16, nslookup-specific-dns-server. Historical slate fixes the topic and does not establish current search demand. Writer: /root/w20_11. Research fetched sources on 2026-10-21 UTC, approximately 19:42–19:44 UTC. Final source cross-check belongs to writing/text review.

## Primary sources establish syntax and response meanings

- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup — Remarks: first argument identifies queried host, second identifies server; omitted second uses default. Trailing period controls suffix behavior. Full substantive page returned, despite generic authorization boilerplate in page chrome.
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-type — Syntax and Parameters: set type selector, Windows documented default A; MX, TXT, NS meanings.
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-server — Opening description and Syntax: interactive server command resolves named server using current default. This supports bootstrap dependency, not a claim that all platforms use an identical bootstrap path.
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-recurse — Parameters: recurse default; norecurse stops recursive request behavior.
- https://bind9.readthedocs.io/en/latest/manpages.html#nslookup-query-internet-name-servers-interactively — Synopsis, Arguments, Interactive Commands: explicit server syntax, preceding hyphen options, absolute names, state selectors. Important discrepancy: current development manual documents default A followed by AAAA. Article distinguishes Microsoft default documentation rather than claiming universal A-only behavior. Manual marks root/finger/ls/view/help subcommands unimplemented.
- https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1 — Header flags: AA, RD, RA have separate meanings; RCODE defines server failure and refusal.
- https://www.rfc-editor.org/rfc/rfc2308.html — Sections 1, 2.1, 2.2, 5: NXDOMAIN versus inferred NODATA; alias-chain final target nuance; negative caching TTL from SOA and countdown. Final source cross-check explicitly read sections 2.2 and 5.
- https://www.rfc-editor.org/rfc/rfc9520.html#section-2 — Sections 2.1–2.6: SERVFAIL, refusal, timeouts, and DNSSEC validation failure. Negative useful responses differ from resolution failure. Article avoids obsolete optional-failure-caching conclusions from RFC 2308 because RFC 9520 updates those rules.

## The manuscript limits diagnostic conclusions

Examples use reserved domains and documentation addresses. Commands are illustrative read-only lookups, not executed observations. No live DNS result or current provider endpoint claim appears. Internal-versus-external deployment discussion links existing article as background. Diagnostic recommendations are editorial analysis, not assertions of measured behavior.

The current BIND latest manual identifies a development release. The article identifies documentation behavior and warns about local implementation differences. No archived snapshot was obtained or invented. Fetch dates reflect actual reads. No Namefi product capability claim appears. Source paraphrases remain concise; the practical procedure and hypothetical incident analysis provide original instructional material.

The author checked metadata, four body H2 sections, exact five existing blog and glossary links, two valid topic/series routes, sentence length, standalone scope, citation support, and a complete ending. Parent owns imagery and full repository validation. Upper README review found a batch-owned inventory, so the writer did not change shared files.

```json
{
  "image_scenes": [
    {"section": "An explicit server and record type define the test", "short_name": "explicit-query", "scene": "An annotated terminal command nslookup -type=A example.com. SERVER_IP with separate labeled blocks for record type, absolute queried name, and server address. Show name first and server second. A small note contrasts Windows documented A default with BIND documented A then AAAA default, emphasizing explicit type."},
    {"section": "The server's role determines what an answer can show", "short_name": "server-roles", "scene": "One client sends the identical example.com. A question along two labeled paths. A recursive resolver may use a cache and upstream lookups. A verified authoritative server answers its own zone. Separate AA authority and RD recursion-request labels prevent conflating the roles."},
    {"section": "Controlled comparisons isolate useful differences", "short_name": "controlled-comparison", "scene": "A three-column comparison sheet holds a fixed www.example.com. A question beside resolver A, resolver B, and authoritative endpoint tests. UTC time and network are recorded. Hypothetical old 192.0.2.10 and new 192.0.2.20 answers illustrate bounded cache investigation, with no global propagation countdown."},
    {"section": "Error categories guide the next recovery check", "short_name": "dns-error-decisions", "scene": "A diagnostic decision diagram separates received DNS responses from no response. Received responses branch to NXDOMAIN name absent, NODATA requested type absent, SERVFAIL processing failure, and REFUSED policy rejection. No response branches to timeout and endpoint/network checks. Show different recovery checks without implying every error means a missing domain."}
  ]
}
```
