---
title: "CAA"
date: '2026-10-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "A CAA record identifies the certificate authorities that a domain authorizes to issue certificates."
keywords: ["CAA", "Certification Authority Authorization", "TLS authentication"]
also_known_as: ["Certification Authority Authorization"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /en/glossary/certificate-transparency/
---

**CAA**, short for **Certification Authority Authorization**, is a DNS record that identifies the [certificate authorities](/en/glossary/certificate-authority/) a domain authorizes to issue certificates. A compliant CA checks applicable CAA records before issuance. [DNSSEC](/en/glossary/dnssec/) can authenticate the DNS response carrying the policy. CAA reduces unintended issuance through compliant processes. CAA does not make browsers reject certificates from other issuers, revoke existing certificates, or stop someone who forges certificates with a compromised CA signing key. CAA specifies issuer authorization, while domain validation remains a separate requirement.
