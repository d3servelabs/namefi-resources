---
title: "DNS Record Types"
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: "DNS record types define the data a DNS entry carries, such as an IP address, an alias, a mail server, or verification text."
keywords: ["A record vs CNAME", "AAAA record", "MX record", "TXT record", "DNS records explained"]
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035#section-3.3
  - https://datatracker.ietf.org/doc/html/rfc3596#section-2
relatedArticles:
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-dnspionage-campaign/
  - /en/blog/what-are-tokenized-domains/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/tld/
  - /en/glossary/icann/
  - /en/glossary/registry/
---

**DNS record types** define the kind of data stored in a [DNS](/en/glossary/dns/) resource record. The type tells a resolver how to interpret the answer; one domain can have different records for its website, email, and other services. [1](#ref-records)

## Common DNS record types

| Type | What it contains | Typical role |
| --- | --- | --- |
| A | An IPv4 address | Locate a host by address. |
| AAAA | An IPv6 address | Locate a host over IPv6. |
| CNAME | Another domain name | Make one name an alias of another. |
| MX | A mail-server name and preference | Identify where incoming email should go. |
| TXT | One or more text strings | Publish text consumed by verification and other protocols. |

A, CNAME, MX, and TXT are defined in RFC 1035. AAAA is defined in RFC 3596. [1](#ref-records) [2](#ref-ipv6)

## Reading an A record and a CNAME

An A record points to an IPv4 [IP address](/en/glossary/ip-address/); a CNAME points to another name whose records must then be resolved. A CNAME is a DNS alias, not a web-page redirect: it does not specify an HTTP redirect destination or a URL path. Choose the record your hosting provider asks for rather than treating these types as interchangeable. [1](#ref-records)

The [nameservers](/en/glossary/nameserver/) publish the records. Changing one type does not automatically update other services: changing a website’s A record does not, by itself, change its MX record. Cached answers can also persist during [DNS propagation](/en/glossary/dns-propagation/).

## Sources and further reading

- <span id="ref-records"></span>**1.** IETF — [RFC 1035, standard record types](https://datatracker.ietf.org/doc/html/rfc1035#section-3.3) and [A records](https://datatracker.ietf.org/doc/html/rfc1035#section-3.4.1) — fetched 2026-09-15.
- <span id="ref-ipv6"></span>**2.** IETF — [RFC 3596, AAAA records](https://datatracker.ietf.org/doc/html/rfc3596#section-2) — fetched 2026-09-15.
