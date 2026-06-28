---
title: TLD
date: '2026-05-22'
language: en
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: A top-level domain (TLD) is the rightmost label in a domain name, such as .com, .org, or .de, delegated through the IANA root zone under ICANN oversight.
keywords: ['TLD', 'top-level domain', 'gTLD', 'ccTLD', 'new gTLD', 'DNS', 'IANA', 'ICANN', 'root zone', 'domain registry']
also_known_as: ['Top-Level Domain']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /en/blog/what-is-a-tld/
  - /en/blog/top-tlds-to-secure-for-your-startup/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/how-tld-affects-domain-value/
  - /en/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /en/topics/choosing-a-tld/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/best-tlds-by-industry/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/icann/
  - /en/glossary/registry/
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/web3/
---

**TLD** (*top-level domain*), also called a **Top-Level Domain**, is the rightmost label in a fully qualified domain name — the segment that follows the last dot. In `www.example.com`, the TLD is `.com`; in `bbc.co.uk`, it is `.uk`. TLDs sit at the apex of the [DNS](/en/glossary/dns/) hierarchy and are the foundation upon which every other domain name is built.

## Where the TLD sits in a domain name

The [DNS](/en/glossary/dns/) is a hierarchical, tree-structured naming system. Reading a domain name from right to left reveals that hierarchy:

1. **Root (`.`)** — The invisible dot at the very right end. The [root zone](/en/glossary/root-zone/) is the authoritative starting point: a small set of servers maintained by [IANA](/en/glossary/iana/) that know which name servers are authoritative for every TLD.
2. **TLD** — The first visible label from the right (`.com`, `.org`, `.de`). Each TLD has its own authoritative name servers, run by a [registry](/en/glossary/registry/) operator.
3. **[Second-level domain](/en/glossary/second-level-domain/)** — The label immediately left of the TLD (e.g., `example` in `example.com`). This is what registrants purchase from a registrar.
4. **Subdomain** — Any further labels to the left (`www`, `mail`, `blog`), managed by whoever controls the second-level domain.

When a resolver looks up `www.example.com`, it first asks a root server where `.com` lives, then asks the `.com` registry name servers where `example.com` lives, then asks `example.com`'s name servers for the `www` record. This delegation chain ensures that no single server needs to know all domain names.

## Types of TLD

IANA groups TLDs into several categories:

| Category | Examples | Notes |
|---|---|---|
| **[gTLD](/en/glossary/gtld/)** (generic) | `.com`, `.net`, `.org`, `.info` | Originally unrestricted or broadly scoped; the most widely used class |
| **[ccTLD](/en/glossary/cctld/)** (country-code) | `.de`, `.uk`, `.jp`, `.us` | Two-letter codes assigned per ISO 3166-1; often governed by national authority |
| **sTLD** (sponsored) | `.gov`, `.edu`, `.mil`, `.museum` | A gTLD sub-type with a sponsoring organisation that restricts eligibility |
| **[New gTLD](/en/glossary/new-gtld/)** | `.app`, `.blog`, `.shop`, `.xyz` | Introduced from 2013 onward through ICANN's expansion program |
| **Infrastructure** | `.arpa` | Reserved for technical DNS infrastructure; not open for registration |
| **Test / Reserved** | `.example`, `.localhost`, `.invalid` | Defined in RFC 2606; never delegated in the public root |

The `.arpa` domain is the only current infrastructure TLD. It hosts reverse-lookup zones (`in-addr.arpa` for IPv4, `ip6.arpa` for IPv6) that map IP addresses back to host names.

Country-code TLDs were originally scoped to registrants within the named country, but many have been liberalised for global registration — `.io` (British Indian Ocean Territory) and `.co` (Colombia) are prominent examples used internationally as generic alternatives.

## How TLDs are created and delegated

The authoritative list of all delegated TLDs is maintained in the **IANA root zone database** ([iana.org/domains/root/db](https://www.iana.org/domains/root/db)), which maps each TLD to its set of authoritative name servers and its designated [registry](/en/glossary/registry/) operator.

**ccTLD delegation** follows the policy set out in [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591) (Postel, 1994): two-letter codes are derived from ISO 3166-1, and each is delegated to a trustee — typically a government agency or nationally recognised body — that is expected to serve the public interest of that country or territory. [IANA](/en/glossary/iana/) reviews requests for re-delegation when governance of a ccTLD changes hands.

**New gTLDs** are created through [ICANN](/en/glossary/icann/) application rounds. The first major expansion began in 2012, when ICANN opened applications for any string of three or more characters as a generic TLD. Applicants pay a base fee, undergo evaluation for technical capability and financial stability, pass an objection process (covering community, morality, intellectual-property, and string-confusion grounds), and sign a Registry Agreement with ICANN ([ICANN new gTLD programme](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)). Over 1,200 new gTLDs were delegated from that round. A second application round opened in 2026, further expanding the namespace.

Once delegated, a TLD's [registry](/en/glossary/registry/) operator maintains the authoritative database of all second-level domains registered under it, runs the zone's name servers, and sets the policies (pricing, eligibility, length rules) that registrars must follow when selling names to registrants.

## Examples and notable TLDs

| TLD | Operator | Notes |
|---|---|---|
| `.com` | Verisign | Largest TLD by registration volume; originally for commercial entities |
| `.net` | Verisign | Originally for network infrastructure providers; now unrestricted |
| `.org` | Public Interest Registry | Originally for non-profit organisations; now largely unrestricted |
| `.gov` | GSA (US) | Restricted to US federal, state, and local government entities |
| `.edu` | Educause | Restricted to accredited US post-secondary institutions |
| `.uk` | Nominet | UK ccTLD; common registrations use second-level labels like `.co.uk` |
| `.de` | DENIC | Germany ccTLD; one of the largest ccTLDs by volume |
| `.io` | ICANN / registry transition pending | British Indian Ocean Territory code; widely adopted by tech companies |
| `.app` | Google Registry | New gTLD; HTTPS required by registry policy |
| `.xyz` | XYZ.com LLC | New gTLD; large registration volume due to low pricing |

## TLDs, value, and SEO

Search engines treat TLDs in two distinct ways:

**Geo-targeting:** A [ccTLD](/en/glossary/cctld/) sends a geographic signal. Google Search Central notes that a `.de` site is generally interpreted as targeting German-speaking users, and Google Search Console allows explicit geo-targeting for generic TLDs but applies ccTLD signals automatically. If a business intends to serve a global audience from a single domain, a generic TLD avoids unintended geographic restriction.

**Ranking:** For most purposes, the TLD itself is not a ranking factor. Google has stated that it [treats new gTLDs like any other TLD](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains) and that a `.com` does not inherently outrank a `.app` or `.xyz`. What matters is the overall authority and relevance of the domain, not the extension alone. Some older keyword-rich TLDs (like `.jobs` or `.travel`) carry implicit context signals, but these are minor compared to content quality and backlink profile.

**Brand perception and memorability:** Domain investors and marketers observe that established short TLDs — especially `.com` — carry strong end-user recognition, which can affect click-through rates in search results, direct navigation, and trust. This is a market and behavioural dynamic rather than an algorithmic one.

**Premium and aftermarket pricing:** The perceived value of a TLD affects secondary-market prices for [second-level domain](/en/glossary/second-level-domain/) names beneath it. `.com` names command higher aftermarket prices on average than equivalent names under newer extensions, reflecting consumer familiarity rather than any technical advantage.

## TLDs and tokenized domains

Several blockchain-based naming systems operate outside the IANA root zone, effectively introducing alternative TLDs that resolve only within compatible resolvers or browser extensions. Examples include `.eth` (Ethereum Name Service), `.crypto`, and `.nft`. These are not delegated through [IANA](/en/glossary/iana/) and do not resolve in the global DNS by default, though bridges and gateway services can provide partial interoperability.

Within the IANA-administered namespace, tokenization of [second-level domain](/en/glossary/second-level-domain/) names (representing ownership of a name like `example.com` as a blockchain token) is a separate concept from the TLD itself; the TLD remains under the same registry governance regardless of how ownership of individual names beneath it is recorded.
