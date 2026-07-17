---
title: WHOIS (and RDAP)
date: '2026-05-22'
language: en
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: WHOIS and its successor RDAP are the public lookup services for a domain's registration details, such as its registrar and expiration date.
keywords: ['WHOIS', 'RDAP', 'domain registration lookup', 'registrant information', 'domain ownership lookup']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/expired-domains-and-the-drop-cycle/
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/what-is-udrp/
  - /en/blog/cctld-market-share-by-registration-volume/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/icann/
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/whois-privacy/
  - /en/glossary/registry/
---

**WHOIS** is the long-standing protocol and public service for looking up registration information about a domain — registrar, registration and expiration dates, and historically the [registrant](/en/glossary/registrant/)'s contact information. Its modern successor is **RDAP (Registration Data Access Protocol)**, which returns structured JSON and is the protocol [ICANN](/en/glossary/icann/) and registries are migrating to. For [tokenized domains](/en/blog/what-are-tokenized-domains/), WHOIS/RDAP records still exist at the [registrar](/en/glossary/registrar/) level because the underlying [DNS](/en/glossary/dns/) registration is real and ICANN-recognized — only the *ownership and transfer mechanics* shift to the [on-chain](/en/glossary/on-chain/) layer. Privacy is increasingly common: many registrars now mask personal contact details by default, in line with privacy laws like GDPR. Reference: [ICANN's WHOIS lookup](https://lookup.icann.org/).
