# Research supports the PTR control boundary

Fetched UTC 2026-10-21. Assignment G15 uses historical topic demand evidence, not current keyword metrics. The article covers diagnosis and configuration responsibility, without asserting Namefi product features.

- https://www.rfc-editor.org/rfc/rfc1035#section-3.3.12 and section 3.5: PTR data contains a domain name. IPv4 reverse names use reversed address octets under IN-ADDR.ARPA. Opened full document and relevant passages.
- https://www.rfc-editor.org/rfc/rfc3596#section-2.5: IPv6 reverse queries use reversed hexadecimal nibbles under IP6.ARPA. Opened section.
- https://www.rfc-editor.org/rfc/rfc2317#section-4 and section 5.2: classless delegation uses parent CNAME records and delegated child zones. The parent must participate even when PTR data lives outside IN-ADDR.ARPA. Opened examples and alternative naming passage.
- https://www.rfc-editor.org/rfc/rfc1912.html#section-2.1: operational guidance recommends matching forward/reverse records, direct address records rather than PTR targets that alias through CNAME. Informational document, not a universal mail acceptance standard.
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Elastic_Addressing_Reverse_DNS.html: Considerations and Create a reverse DNS record. Elastic IP reverse DNS requires corresponding A record and has account/release constraints. Example of provider administration, not universal policy.
- https://support.google.com/a/answer/81126?hl=en: Sender requirements and IP addresses. Personal Gmail requires forward/reverse consistency, plus independent authentication and other sender conditions. Reverse hostname A/AAAA must resolve to sending public IP. Provider policy, not protocol definition.
- https://www.rfc-editor.org/rfc/rfc7208.html#section-2.1 and section 5.5: SPF authorizes sending hosts for MAIL FROM/HELO identities. The SPF ptr mechanism SHOULD NOT be published. Opened abstract and specific mechanism passage.
- https://www.rfc-editor.org/rfc/rfc6376.html#section-1 and section 3.7: DKIM associates domain responsibility through a signature, with body/header hashing. Opened introduction and hashing procedure.
- https://www.rfc-editor.org/rfc/rfc7489.html#section-3.1: DMARC identifier alignment connects visible From domain with SPF/DKIM authenticated identifiers. Opened alignment definitions and examples.
- https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility: dig synopsis, -x, +trace, query type, output flags. Commands only read DNS. Documentation examples are hypothetical, not live network tests.

Limits: no archive snapshot claimed. No provider-specific universal PTR count or propagation deadline. PTR data has no field establishing legal ownership. Forward confirmation demonstrates DNS consistency only. No general list of domains on an IP can follow from a PTR lookup. Source standards are scoped to their stated protocol, and current Gmail/AWS policies apply only to those operators.

Additional source checked during text review: https://www.rfc-editor.org/rfc/rfc2308.html#section-5, fetched UTC 2026-10-21. Negative answers can remain cached, so adding PTR does not erase a previous cached absence.

Self-review: four body H2 sections, one sources section, three-column practical table, five verified existing article targets and five glossary targets. Hypothetical examples are explicit. No ownership or delivery guarantees. Parent retains imagery/publication responsibility. Local and ancestor README inventory already covers this batch; no writer-side README edits authorized.

```json
{
  "image_scenes": [
    {
      "section": "PTR records answer an address-to-name question",
      "scene": "Two clearly separate DNS query paths: mail.example.com A returns 192.0.2.25; 25.2.0.192.in-addr.arpa PTR returns mail.example.com. Include a small IPv6 ip6.arpa branch, without implying automatic synchronization.",
      "short_name": "two-directions"
    },
    {
      "section": "IP address delegation determines who can change reverse DNS",
      "scene": "Separate forward domain administrator and IP provider. Provider parent reverse zone CNAME points into delegated child zone with PTR. Show both administrators participating.",
      "short_name": "reverse-delegation"
    },
    {
      "section": "Forward confirmation checks consistency across two lookups",
      "scene": "A three-node check shows 192.0.2.25 to PTR mail.example.com to A 192.0.2.25, with a separate red mismatch example ending 192.0.2.26.",
      "short_name": "forward-confirmation"
    },
    {
      "section": "Mail receivers evaluate PTR records alongside authentication and reputation",
      "scene": "Mail receiver evaluates separate labeled checks: PTR plus forward consistency, SPF authorization, DKIM signature, DMARC alignment, reputation. Mark DNS consistency as one check, with no guaranteed delivery outcome.",
      "short_name": "mail-checks"
    }
  ]
}
```

## The coordinator checked the current DMARC reference

The RFC Editor info page marks RFC 7489 obsolete. The coordinator opened RFC 9989 and read the identifier alignment passages on 2026-10-21. The public article now cites RFC 9989 for the same SPF/DKIM alignment distinction. This correction occurred after the writer end boundary and belongs to coordinator overhead.
