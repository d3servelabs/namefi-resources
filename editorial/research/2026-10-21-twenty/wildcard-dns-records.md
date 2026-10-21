# Wildcard DNS evidence supports tree-dependent matching

Assignment: order 14, G13, fixed historical topic `wildcard-dns-records`. Locale: en-US. Historical demand slate supplies planning context only. No fresh demand or ranking claim appears in the manuscript.

All sources below were opened and read on 2026-10-21 UTC through the web tool. No blocked source supplies evidence. No archive snapshot was verified. Public citations therefore use original primary-source URLs and section locators.

## RFC 4592 defines wildcard synthesis and existing names

URL: https://www.rfc-editor.org/rfc/rfc4592.html

Locators: sections 2.1.1–2.1.2, 2.2.1–2.2.3, 3.3.1–3.3.3. The leftmost complete asterisk label identifies a wildcard. Existing names, empty non-terminals, and zone cuts constrain synthesis. The closest existing ancestor determines one source of synthesis, with no broader fallback. Section 2.2.1 explicitly demonstrates multi-label matching and an existing name preventing another type's synthesis. Section 3.3.3 covers owner substitution, type matching, and wildcard CNAME processing.

The article's customer platform, zone addresses, worksheet, and operational choices are hypothetical examples and analysis. No operational test against example.com occurred. All predicted worksheet outcomes assume the standard algorithm and the stated limited zone data. The table distinguishes no-data at existing names from missing-name behavior. The text deliberately does not equate DNS matching with one-label certificate matching.

## Cloudflare documents an implementation exception

URL: https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/

Locators: “Create a Wildcard record,” “Wildcards are only supported on the first label,” “Wildcards are multi-level by default,” and “Specific DNS records take precedence over wildcard records,” especially Example 2, implicit parent. Documentation displayed update date April 16, 2026. Standard nameservers retain the upper wildcard for the documented empty-parent case. Advanced nameservers follow RFC 4592 and do not. The article reports this provider-specific distinction explicitly, without assuming universal provider compliance. The article makes no Cloudflare certificate, pricing, or product availability claim.

## RFC 9525 separates TLS matching from DNS matching

URL: https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3

Locators: section 6.3 and section 7.1. One wildcard character must occupy the complete leftmost label of a presented identifier. The wildcard matches one reference label. Additional certificate identifiers can cover additional names. The article's example isolates certificate name coverage and does not guarantee complete certificate validation merely from name matching.

## NGINX documents independent server-name rules

URL: https://nginx.org/en/docs/http/server_names.html

Locators: opening precedence list, “Wildcard names,” and “Virtual server selection.” NGINX server_name selects server blocks and supports exact names, wildcard names, and regular expressions. A leading wildcard can match multiple name parts. The article uses NGINX solely to establish separate web routing behavior. The article does not generalize NGINX matching to all hosting platforms.

## RFC 2308 explains empty answers and negative caching

URL: https://www.rfc-editor.org/rfc/rfc2308.html

Locators: sections 2.2, 3, and 5. NOERROR without relevant data can indicate NODATA. Referrals require separate interpretation. An authoritative negative response carries SOA data. Its cache lifetime uses the minimum of the SOA TTL and SOA MINIMUM. The article avoids a universal recovery period and does not cite the old document's optional historical SERVFAIL timing.

## The text review preserves scope and relevant links

The manuscript has four substantive H2 sections and one Sources H2. The body has 1,825 words by a regex word count excluding frontmatter and Sources. The manuscript contains a three-column decision matrix and examples with reserved names and documentation addresses. Five related blog files and five related glossary files exist. The cluster, topic paths, and series paths follow the repository taxonomy. The manuscript has no series membership, Namefi product claim, generated image reference, TODO, or publishing command. The parent owns image generation and repository-wide validation. The existing README inventory already describes batch publication generically, so this article does not require a writer-owned README edit.

The review checked all concrete protocol statements against the opened locators above. The review retained the Cloudflare exception and sharpened assumptions before the prediction table. The review checked prose, heading meaning, path existence, frontmatter fields, paragraph length, and the completed ending. Provider behavior remains a reader-facing test requirement. The article does not promise that DNS synthesis creates an application tenant or authorizes access.

```json
{
  "image_scenes": [
    {
      "section": "A wildcard supplies records when a matching name is missing",
      "scene": "Show a DNS zone card for example.com with separate apex A 192.0.2.10 and wildcard *.example.com A 192.0.2.20 rows. Three missing customer names point to the wildcard answer, while the apex points to its separate address. Label all names as hypothetical and avoid implying tenant creation.",
      "short_name": "wildcard-answers"
    },
    {
      "section": "Existing names determine which wildcard can answer",
      "scene": "Show two DNS trees side by side. Without shop.example.com, blue.shop.example.com uses closest encloser example.com and candidate *.example.com. With shop.example.com present, the candidate becomes *.shop.example.com, shown absent. Include a small empty team node above probe.team.example.com, labeled existing empty parent under RFC 4592. Note provider behavior may differ.",
      "short_name": "closest-encloser"
    },
    {
      "section": "DNS matching does not configure certificates or website routing",
      "scene": "Show three independent checks labeled DNS answer, TLS name coverage, and application routing. A deep hostname blue.amber.example.com gets a DNS answer but fails a certificate containing only *.example.com. A one-label amber.example.com passes that name check, then reaches a separate customer lookup. Do not imply the name check alone validates an entire certificate.",
      "short_name": "three-checks"
    },
    {
      "section": "A test matrix reveals wildcard failures before deployment",
      "scene": "Show an operator worksheet with rows for fresh name, deeper name, explicit TXT-only name, empty parent, apex, and delegation. Compare authoritative answer, recursive answer, and HTTPS outcome using concise status markers. Include a negative-cache clock alongside SOA data, with no universal propagation duration.",
      "short_name": "test-matrix"
    }
  ]
}
```
