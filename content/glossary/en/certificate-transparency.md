---
title: "Certificate Transparency"
date: '2026-10-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Certificate Transparency uses public logs to expose TLS certificate issuance for independent monitoring and auditing."
keywords: ["Certificate Transparency", "CT", "TLS authentication"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /en/glossary/dane/
  - /en/glossary/caa/
---

**Certificate Transparency**, also called **CT**, records TLS certificates in public, append-only logs. Domain operators and other monitors can inspect the logs for unexpected issuance by a [certificate authority](/en/glossary/certificate-authority/). Client policies can require evidence of logging before accepting a certificate. Logging alone does not prevent fraudulent issuance or revoke a certificate. Client enforcement and monitoring provide different protections. CT complements [CAA](/en/glossary/caa/): CAA guides issuer authorization before issuance, while CT exposes logged certificates for inspection afterward.
