---
title: "DANE"
date: '2026-10-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE authenticates TLS services through certificate or key associations in DNSSEC-protected TLSA records."
keywords: ["DANE", "DNS-Based Authentication of Named Entities", "TLS authentication"]
also_known_as: ["DNS-Based Authentication of Named Entities"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
relatedArticles:
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/dnssec-for-domain-owners/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/certificate-authority/
  - /en/glossary/intermediate-ca/
  - /en/glossary/man-in-the-middle-attack/
  - /en/glossary/caa/
  - /en/glossary/certificate-transparency/
---

**DANE**, short for **DNS-Based Authentication of Named Entities**, uses TLSA records to associate a TLS service with a certificate, public key, or trust anchor. [DNSSEC](/en/glossary/dnssec/) authenticates the DNS data. A supporting client enforces the association during TLS authentication. Depending on the selected usage, DANE can constrain a public [certificate authority](/en/glossary/certificate-authority/) or authenticate a service independently of public CA trust. Merely publishing TLSA records does not protect clients that ignore DANE. Operators must coordinate key changes with TLSA updates and preserve DNSSEC validation.
