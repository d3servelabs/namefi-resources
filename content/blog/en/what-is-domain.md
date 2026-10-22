---
title: "What Is a Domain Name? Examples, Structure, and URLs"
date: '2025-06-19'
language: en
priority: P0
tags: ['faq']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-basics
format: explainer
description: "Understand domain names, root, TLD, second-level domains, subdomains, registration boundaries, and the difference between a domain and a URL."
keywords: ["what is a domain", "what is a domain name", "domain name examples", "domain vs url", "domain structure", "hostname", "second-level domain", "subdomain", "URL path", "URL query", "DNS"]
relatedArticles:
  - /en/blog/what-is-a-tld/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/what-is-udrp/
  - /en/blog/domain-terminology-guide/
  - /en/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/tld/
  - /en/glossary/icann/
  - /en/glossary/registry/
ogImage: ../../assets/what-is-domain-og.jpg
---

## A domain name identifies a place in DNS

A **domain name** is a name such as `example.com` or `namefi.io`. People use domain names to reach websites and email services. A domain name does not include `https://` or a page path.

The **[Domain Name System](/en/glossary/dns/) (DNS)** associates names with records. Address records can supply [IP addresses](/en/glossary/ip-address/) for a website. Other records support services such as email. Registration alone does not supply website hosting or a mailbox. [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034#section-2.4) describes names, records, name servers, and resolvers.

## Domain levels run from the root to more specific names

Read the following example from right to left: `blog.example.com.`. Each dot separates labels, and the final dot represents the root. Ordinary web addresses usually omit the final dot. [RFC 1034, section 3.1](https://www.rfc-editor.org/rfc/rfc1034#section-3.1), defines the hierarchy.

![The DNS hierarchy runs from the root through com and example.com to blog.example.com](../../assets/what-is-domain-01-hierarchy.jpg)

| Level | Complete name | Meaning |
| --- | --- | --- |
| Root | `.` | The common starting point above all TLDs |
| Top level | `com.` | A domain directly below the root |
| Second level | `example.com.` | A domain directly below `com.` |
| Third level | `blog.example.com.` | A domain directly below `example.com.` |

The label `example` selects a child under `com`. The complete second-level domain name is `example.com`, rather than the label alone. A fourth level could be `support.blog.example.com`.

A **[subdomain](/en/glossary/subdomain/)** describes a relationship to a parent domain. `blog.example.com` is a subdomain of `example.com`. More broadly, `example.com` is also below `com`. A subdomain need not identify a separate website. [JPNIC explains domain hierarchy and DNS delegation](https://www.nic.ad.jp/ja/dom/system.html).

## TLD categories do not add another domain level

A **[top-level domain](/en/glossary/tld/)** sits directly below the root. Generic TLDs include `.com` and `.org`. Country-code TLDs include `.uk`, `.de`, and `.jp`. The [IANA root database](https://www.iana.org/domains/root/db) lists TLD types and operators.

A country-code TLD is still a top-level domain. The word “country” describes the category, rather than a separate level. The [TLD guide](/en/blog/what-is-a-tld/) covers extension types and selection in more detail.

## The registrable domain can sit below the second level

DNS depth and registration boundaries answer different questions. In `example.com`, the registrable domain spans two labels. In `example.co.uk`, `uk` is the TLD, `co.uk` is second level, and `example.co.uk` is third level. [Nominet shows both `.uk` and `.co.uk` registration formats](https://nominet.uk/lookup/).

Do not assume that the last two labels always identify the registrable domain. Registration policy determines the boundary. A **public suffix** can contain several labels. [RFC 9499](https://www.rfc-editor.org/rfc/rfc9499.html#section-9) explains why the name alone cannot identify a public suffix.

## A URL includes more than a domain name

Consider `https://blog.example.com/guides/domains?lang=en`:

| Component | Example | Purpose |
| --- | --- | --- |
| Scheme | `https` | Selects the connection scheme |
| Hostname | `blog.example.com` | Identifies the host in this example |
| Registrable domain | `example.com` | Identifies the registration boundary in this example |
| Path | `/guides/domains` | Identifies a resource on the host |
| Query | `lang=en` | Supplies a parameter for the website |

The path and query do not change the DNS hierarchy. [MDN describes URL components](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL#scheme). For a site layout decision, compare [subdomains and subdirectories](/en/blog/subdomain-vs-subdirectory/).

## Registries and registrars have different responsibilities

A **[registry](/en/glossary/registry/)** operates a domain registry. A **[registrar](/en/glossary/registrar/)** handles registrations for customers. ICANN accredits registrars and maintains [gTLD registry agreements](https://www.icann.org/en/contracted-parties/registry-operators/resources/listings). Country-code registries have their own arrangements.

For a gTLD registration, use an [ICANN-accredited registrar](https://www.icann.org/en/contracted-parties/accredited-registrars) or a reseller working through one. Check availability, eligibility, registration terms, and renewal costs before paying. Registration gives rights under the registration agreement. Keep the registration current and configure DNS for the required services.

A domain registration has one registrant at a time. The registrant can authorize another person or service to use the name. Registration does not reserve the same label under every TLD.

## These sources explain domain names and their boundaries

Sources checked on 2026-10-21:

- IETF: [RFC 1034, sections 2.4 and 3.1](https://www.rfc-editor.org/rfc/rfc1034).
- IETF: [RFC 9499, section 9](https://www.rfc-editor.org/rfc/rfc9499.html#section-9).
- JPNIC: [Domain name structure](https://www.nic.ad.jp/ja/dom/system.html).
- IANA: [Root zone database](https://www.iana.org/domains/root/db).
- Nominet: [Domain lookup examples](https://nominet.uk/lookup/).
- MDN: [What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL).
- ICANN: [Accredited registrars](https://www.icann.org/en/contracted-parties/accredited-registrars) and [registry listings](https://www.icann.org/en/contracted-parties/registry-operators/resources/listings).
