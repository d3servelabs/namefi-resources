# CNAME and A records require different configuration choices

Assignment: order 12, G12. Authoring locale: en-US. Canonical writer: /root/w20_12.
Scope: procedural comparison, not a complete DNS record catalog. Historical demand slate sets the topic, not current search demand.

All sources below were fetched and read through web tools on 2026-10-21 UTC. No archive snapshot was obtained. RFC claims concern protocol semantics. Provider claims describe the fetched documentation and can change.

| Source and locator | Evidence and limits |
| --- | --- |
| https://www.rfc-editor.org/rfc/rfc1035.html#section-3.4.1 | A contains a 32-bit Internet address; multiple addresses use multiple A records. |
| https://www.rfc-editor.org/rfc/rfc3596.html#section-2.1 | AAAA stores an IPv6 address; sections 2.2–2.3 define encoding and query. |
| https://www.rfc-editor.org/rfc/rfc1034.html#section-3.6.2 | CNAME maps alias owner to canonical target; address query follows target; CNAME query returns alias; chains work, loops cause errors. Section 4.2.1 requires apex NS and SOA. |
| https://www.rfc-editor.org/rfc/rfc2181.html#section-10.1 | One canonical target per alias, no ordinary other data at alias owner. Section 10.3 forbids alias-valued MX and NS targets. Section 8 defines TTL as a maximum. |
| https://www.rfc-editor.org/rfc/rfc4034.html#section-3 | Modern DNSSEC adds RRSIG and NSEC coexistence with CNAME. Section 4 explains NSEC. Do not repeat obsolete SIG/NXT/KEY terms from RFC 2181 as current record recommendations. |
| https://developers.cloudflare.com/dns/cname-flattening/ | How it works: provider resolves target and returns address instead of CNAME. Aspects to keep in mind: all-record flattening can break verification requiring CNAME, dangling target can yield NODATA. No performance promise adopted. |
| https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-elb-load-balancer.html | Opening and configuration sections: Route 53 alias is an extension, apex permitted, A alias routes to ELB. Do not generalize to arbitrary external targets or other providers. |
| https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site | Apex and subdomain sections show separate methods and require repository custom-domain settings. Security section explains disabled site with lingering DNS can permit takeover. No deployment timing quoted. |
| https://www.rfc-editor.org/rfc/rfc2308.html#section-5 | Negative answers have TTL using SOA information. Section 3 defines minimum of SOA TTL and MINIMUM. No universal propagation deadline. |
| https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.2 | HTTP 301 uses new URI and Location; sections 4.3.3–4.3.4 explain origin certificate identity. DNS alias is not HTTP redirect. |
| https://www.rfc-editor.org/rfc/rfc5737.html#section-3 | 192.0.2.0/24 belongs to documentation address space. Examples are hypothetical and not deployment values. |

Review limits: No live DNS deployment, performance test, or Namefi product claim. Example configuration is hypothetical. Platform setup instructions prevail over generic examples. DNSSEC exceptions do not permit apex CNAME with SOA/NS. A records do not supply IPv6. Address answers from flattening do not prove an ordinary A was entered in the console.

Parent owns image generation, image QC, publication and repository-wide validation. Ancestor READMEs describe this batch and need no assigned-file changes.

## The manuscript passed a text and source review

Body word count: 1,936 under the word-count script, excluding frontmatter and sources. Four body H2 sections and one source H2. Both tables use three columns. All five blog targets and five glossary targets exist. Taxonomy follows the existing domain-vs-hosting article. No invented product claims, live IP endpoints, propagation deadline, performance guarantee, or image placeholder references. Direct inline citations retain source locators. The author reviewed every source-dependent mechanism against the fetched passages. The article explains DNSSEC exceptions and MX/NS alias-target restrictions explicitly. Parent still needs imagery and repository-wide validation.

```json
{
  "image_scenes": [
    {
      "section": "A records supply addresses while CNAME records supply target names",
      "short_name": "resolution-paths",
      "scene": "Two parallel DNS resolution paths. Top: app.example.com A points directly to documentation address 192.0.2.20. Bottom: www.example.com CNAME points to site.example.net, whose A record supplies 192.0.2.30. Label names and record types clearly. Do not depict CNAME as an HTTP redirect."
    },
    {
      "section": "Apex requirements prevent ordinary CNAME records from sharing the zone name",
      "short_name": "apex-rules",
      "scene": "Zone example.com has apex SOA and NS cards alongside an A address card. An ordinary CNAME card at the apex shows a conflict with SOA and NS. Separate www.example.com CNAME card shows a valid below-apex alias. Small note: DNSSEC signature records are narrow exceptions; do not depict exceptions as permission for apex CNAME."
    },
    {
      "section": "Provider alias features return answers through a separate mechanism",
      "short_name": "flattening",
      "scene": "Three labeled stages show administrator entering hostname target in provider console, provider resolving site.example.net, and authoritative DNS returning A address 192.0.2.20 to resolver. Distinguish stored provider configuration from DNS answer. Label flattening as provider behavior; avoid latency claims."
    },
    {
      "section": "DNS checks and HTTPS checks reveal different failures",
      "short_name": "separate-checks",
      "scene": "A browser request for https://www.example.com/ follows DNS resolution first, then HTTPS certificate and hostname checks, then a web-server response. A separate 301 plus Location response leads to a new URL. Keep DNS CNAME arrow separate from HTTP redirect arrow."
    }
  ]
}
```
