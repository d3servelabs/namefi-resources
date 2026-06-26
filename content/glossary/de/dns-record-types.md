---
title: 'DNS-Eintragstypen (A, AAAA, CNAME, MX, TXT)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die Einträge in einer Zone, die eine Domain auf Adressen und Dienste abbilden — A, AAAA, CNAME, MX, TXT und mehr.
keywords: ['DNS-Einträge', 'A-Record', 'AAAA-Record', 'CNAME', 'MX-Record', 'TXT-Record']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /de/blog/dns-on-tokenized-domains/
  - /de/blog/how-domain-hijacking-actually-happens/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/the-dnspionage-campaign/
  - /de/blog/what-are-tokenized-domains/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/registrar/
  - /de/glossary/tld/
  - /de/glossary/icann/
  - /de/glossary/registry/
---

**DNS-Eintragstypen** sind die einzelnen Einträge in der Zone einer Domain, die dem [DNS](/de/glossary/dns/) mitteilen, wohin unterschiedliche Arten von Datenverkehr geleitet werden sollen. Die gängigsten sind **A** (bildet einen Namen auf eine IPv4-[IP-Adresse](/de/glossary/ip-address/) ab), **AAAA** (IPv6), **CNAME** (erstellt einen Alias von einem Namen auf einen anderen), **MX** (leitet E-Mails weiter) und **TXT** (Freitext für SPF, DKIM und Domain-Verifizierung). Diese Einträge werden von den [Nameservern](/de/glossary/nameserver/) veröffentlicht, an die eine Domain delegiert wird, und sie sind es, die dafür sorgen, dass eine Website geladen wird oder eine E-Mail zugestellt wird. Die Tokenisierung einer Domain lässt all das unberührt: Die Einträge werden weiterhin normal aufgelöst, während Eigentum und Transfer zu einer [Wallet](/de/glossary/wallet/)-gesteuerten [On-Chain](/de/glossary/on-chain/)-Schicht wechseln. *Quelle(n): RFC 1035; Cloudflare DNS-Einträge.*
