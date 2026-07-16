---
title: DNSSEC (Domain Name System Security Extensions)
date: '2026-05-22'
language: en
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: Cryptographic signatures on DNS records that let resolvers verify a response is authentic and was not forged or tampered with in transit.
keywords: ['DNSSEC', 'DNS security', 'domain security', 'DS record', 'chain of trust', 'cryptographic DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/the-dnspionage-campaign/
  - /en/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/registry/
  - /en/glossary/icann/
  - /en/glossary/tld/
---

**DNSSEC (Domain Name System Security Extensions)** is a set of cryptographic extensions to the [DNS](/en/glossary/dns/) protocol that lets resolvers verify the authenticity and integrity of DNS responses. Without DNSSEC, an attacker can forge or tamper with DNS replies on the path between resolver and authoritative server, redirecting users to malicious infrastructure. With DNSSEC, the records are signed, and a chain of trust runs from the DNS root down through each zone via DS records. DNSSEC is specified in [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) and related RFCs. Tokenizing a domain doesn't change DNSSEC at all — the chain of trust still runs through the [registrar](/en/glossary/registrar/) and [registry](/en/glossary/registry/), and DS records are published the same way. Many DNS providers (Cloudflare, Route53) sign zones automatically when DNSSEC is enabled.
