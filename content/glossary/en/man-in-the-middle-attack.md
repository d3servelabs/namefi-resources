---
title: "Man-in-the-Middle Attack"
date: '2026-10-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "A man-in-the-middle attack interposes an attacker between communicating parties to intercept or alter communication."
keywords: ["Man-in-the-Middle Attack", "MITM", "TLS authentication"]
also_known_as: ["MITM", "On-Path Attack"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
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
  - /en/glossary/dane/
  - /en/glossary/caa/
  - /en/glossary/certificate-transparency/
---

A **man-in-the-middle attack**, also called a **MITM** or **on-path attack**, places an attacker between communicating parties. The attacker intercepts, relays, or changes communication while the parties may believe they communicate directly. [DNS hijacking](/en/glossary/dns-hijacking/) can redirect a connection toward the attacker. HTTPS normally counters endpoint impersonation through certificate validation and proof of private-key possession. A compromised [certificate authority](/en/glossary/certificate-authority/) can undermine that authentication when a client still accepts the affected authority. Encryption can then protect a connection whose endpoint is the attacker.
