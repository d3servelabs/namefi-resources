---
title: TTL (Time to Live)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: How long, in seconds, a DNS record may be cached by resolvers before it must be looked up again.
keywords: ['TTL', 'time to live', 'DNS cache', 'DNS propagation', 'record caching']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /en/blog/the-panix-com-domain-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-sushiswap-miso-insider-attack/
  - /en/blog/working-with-domain-brokers/
  - /en/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-investing/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/dns-propagation/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/registry/
---

**TTL (time to live)** is a value, in seconds, attached to every [DNS record](/en/glossary/dns-record-types/) that tells [resolvers](/en/glossary/dns-resolver/) how long they may cache the answer before checking again. A short TTL (say 300 seconds) means changes take effect quickly but generates more lookups; a long TTL (86,400 seconds = one day) is efficient but means an update lingers in caches. Lowering the TTL a day before you plan a change is the standard trick for fast [DNS propagation](/en/glossary/dns-propagation/).
