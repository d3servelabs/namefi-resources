---
title: 'DNS-Resolver (Rekursiver Resolver)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Der Server, der eine Domain-Anfrage entgegennimmt und die DNS-Hierarchie durchläuft, um die passende Adresse zurückzugeben.
keywords: ['DNS-Resolver', 'rekursiver Resolver', 'Resolver', '8.8.8.8', '1.1.1.1', 'DNS-Lookup']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /de/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /de/blog/the-dyn-dns-mirai-attack/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/tokenized-domain-vs-web3-domain/
  - /de/blog/premium-web3-tlds/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/tld/
  - /de/glossary/urs/
  - /de/glossary/registry/
  - /de/glossary/registrar/
---

Ein **DNS-Resolver** (oder *rekursiver Resolver*) ist der Server, den ein Gerät immer dann anfrägt, wenn es einen Domainnamen in eine [IP-Adresse](/de/glossary/ip-address/) umwandeln muss. Öffentliche Resolver wie `1.1.1.1` (Cloudflare) und `8.8.8.8` (Google) übernehmen die eigentliche Arbeit: Ausgehend von der [Root-Zone](/de/glossary/root-zone/) traversieren sie die [DNS](/de/glossary/dns/)-Hierarchie bis zu den autoritativen [Nameservern](/de/glossary/nameserver/) der Domain und speichern die Antwort für die Dauer des [TTL](/de/glossary/ttl/). Dies ist der Teil des DNS, der dafür sorgt, dass „einen Namen eingeben, eine Website erreichen" sofort funktioniert. Resolver lesen nur öffentliche DNS-Daten — sie haben keine Sicht darauf, wem eine Domain *gehört*, weshalb die [Wallet](/de/glossary/wallet/)-basierte Eigentumsschicht einer tokenisierten Domain für die Auflösung unsichtbar ist und nichts daran ändert, wie Namen aufgelöst werden. *Quelle(n): RFC 1034; Cloudflare DNS-Resolver.*
