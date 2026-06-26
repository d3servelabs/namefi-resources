---
title: 'TTL (Time to Live)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Wie lange, in Sekunden, ein DNS-Eintrag von Resolvern zwischengespeichert werden darf, bevor er erneut abgefragt werden muss.
keywords: ['TTL', 'Time to Live', 'DNS-Cache', 'DNS-Propagierung', 'Eintrag-Caching']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-sushiswap-miso-insider-attack/
  - /de/blog/working-with-domain-brokers/
  - /de/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-investing/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/dns-propagation/
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/registry/
---

**TTL (Time to Live)** ist ein Wert in Sekunden, der jedem [DNS-Eintrag](/de/glossary/dns-record-types/) beigefügt ist und [Resolvern](/de/glossary/dns-resolver/) mitteilt, wie lange sie die Antwort zwischenspeichern dürfen, bevor sie erneut nachfragen. Ein kurzer TTL (z.&nbsp;B. 300 Sekunden) bedeutet, dass Änderungen schnell wirksam werden, erzeugt aber mehr Anfragen; ein langer TTL (86.400 Sekunden = ein Tag) ist effizient, bedeutet aber, dass ein Update länger in Caches verbleibt. Den TTL einen Tag vor einer geplanten Änderung zu senken ist die Standardmethode für eine schnelle [DNS-Propagierung](/de/glossary/dns-propagation/). Der TTL regelt nur das DNS-Caching — er hat nichts mit der Registrierungslaufzeit einer Domain oder der [On-Chain](/de/glossary/on-chain/)-Eigentumsschicht zu tun, die eine tokenisierte Domain hinzufügt. *Quelle(n): RFC 1035; Cloudflare-TTL-Glossar.*
