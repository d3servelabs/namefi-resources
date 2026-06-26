---
title: DNS Hijacking
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Redirecting a domain's traffic by tampering with DNS resolution rather than its registration.
keywords: ['DNS hijacking', 'cache poisoning', 'DNS spoofing', 'DNSSEC', 'traffic redirection']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-sea-turtle-dns-espionage/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-dnspionage-campaign/
  - /en/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/bgp-hijack/
  - /en/glossary/registry/
  - /en/glossary/urs/
---

**DNS hijacking** (also called DNS spoofing or cache poisoning) attacks the resolution layer rather than the registration itself: instead of seizing the domain at the [registrar](/en/glossary/registrar/), the attacker corrupts what a [DNS resolver](/en/glossary/dns-resolver/) or [nameserver](/en/glossary/nameserver/) believes the domain points to, silently sending visitors to a malicious IP. In a cache poisoning attack, a forged DNS response is accepted by a recursive resolver and cached for the duration of the TTL, misdirecting every user that resolver serves — with no change visible in the authoritative [DNS](/en/glossary/dns/) records. The primary technical countermeasure is [DNSSEC](/en/glossary/dnssec/), which cryptographically signs DNS responses so resolvers can detect tampering. Unlike traditional [domain theft](/en/glossary/domain-theft/), DNS hijacking leaves ownership records untouched, making it harder to detect without active monitoring of where your domain actually resolves.
