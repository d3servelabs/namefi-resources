---
title: "Intermediate CA"
date: '2026-10-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "An intermediate CA holds certificate-signing authority delegated through a chain to a trust anchor."
keywords: ["Intermediate CA", "Intermediate Certificate Authority", "TLS authentication"]
also_known_as: ["Intermediate Certificate Authority"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /en/glossary/man-in-the-middle-attack/
  - /en/glossary/dane/
  - /en/glossary/caa/
  - /en/glossary/certificate-transparency/
---

An **intermediate CA**, also called an **intermediate certificate authority**, holds signing authority that another [certificate authority](/en/glossary/certificate-authority/) delegates through a certificate chain. A chain normally connects a website certificate to a trusted root, sometimes through several intermediate certificates. Certificate constraints limit the delegated authority. Compromise of an intermediate CA's [private key](/en/glossary/private-key/) can permit fraudulent certificate signatures within that authority. Clients must apply relevant distrust or revocation updates. Replacing one website certificate does not remove a compromised intermediate key from other clients' trust decisions.
