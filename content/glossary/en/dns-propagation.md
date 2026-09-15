---
title: "DNS Propagation"
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: "DNS propagation is the delay in observing a DNS update while cached answers and delegation information are refreshed."
keywords: ["how long DNS propagation takes", "DNS update delay", "DNS cache", "nameserver change"]
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
  - https://datatracker.ietf.org/doc/html/rfc2308#section-5
  - https://datatracker.ietf.org/doc/html/rfc8767#section-1
relatedArticles:
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/the-malaysia-airlines-dns-hijack/
  - /en/blog/the-perl-com-domain-theft/
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/ttl/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/registry/
---

**DNS propagation** is the delay in observing a [DNS](/en/glossary/dns/) update while [resolvers](/en/glossary/dns-resolver/) refresh cached answers. Different caches can hold different versions of the same answer. The [time to live (TTL)](/en/glossary/ttl/) tells a resolver how long an answer may normally remain cached before it needs refreshing. [1](#ref-ttl)

## How long does DNS propagation take?

There is no single completion time for every resolver. Start with the previous record’s TTL and when each resolver cached it. Changing the TTL now does not rewrite answers already cached elsewhere. Lower it before a planned change and allow the previous cache lifetime to pass before changing the destination. [1](#ref-ttl)

A previously missing name can also remain missing in a cache after you create it. DNS caches negative answers, with their own expiry derived from the zone’s SOA record. [2](#ref-negative)

TTL expiry is not an absolute worldwide deadline: some resolvers can serve stale data when authoritative servers cannot be reached. [3](#ref-stale)

## What to check when a change is not visible

Check the exact hostname and [record type](/en/glossary/dns-record-types/) that changed. Then compare the answer at the authoritative service with the recursive resolver your device uses. An old authoritative answer points to an update or delegation problem; a new authoritative answer with an old recursive answer points toward caching. This comparison is a troubleshooting starting point, not proof that all other DNS settings are correct.

For a nameserver move, check both delegation and the records at the destination provider. Repeatedly changing the records while waiting makes it harder to identify which version a cache holds. Flushing one device or resolver does not clear everyone else’s cache.

## Sources and further reading

- <span id="ref-ttl"></span>**1.** IETF — [RFC 1035, resource-record TTL](https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3) — fetched 2026-09-15.
- <span id="ref-negative"></span>**2.** IETF — [RFC 2308, caching negative answers](https://datatracker.ietf.org/doc/html/rfc2308#section-5) — fetched 2026-09-15.
- <span id="ref-stale"></span>**3.** IETF — [RFC 8767, serve-stale behavior](https://datatracker.ietf.org/doc/html/rfc8767#section-1) — fetched 2026-09-15.
