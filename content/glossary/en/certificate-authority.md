---
title: "Certificate Authority"
date: '2026-10-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "A certificate authority issues digital certificates that associate identities with public keys."
keywords: ["Certificate Authority", "CA", "TLS authentication"]
also_known_as: ["CA", "Certification Authority"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /en/glossary/intermediate-ca/
  - /en/glossary/man-in-the-middle-attack/
  - /en/glossary/dane/
  - /en/glossary/caa/
  - /en/glossary/certificate-transparency/
---

A **certificate authority**, also called a **certification authority** or **CA**, issues digital certificates that associate identities with [public keys](/en/glossary/public-key/). A publicly trusted TLS CA checks domain control and applicable identity requirements before signing a website certificate. Clients validate the certificate chain against a trusted root and check the server's proof of the corresponding private key. A CA can delegate signing authority to an [intermediate CA](/en/glossary/intermediate-ca/). CA trust authenticates an identity under client policy. CA trust does not guarantee that a website's content is honest.
