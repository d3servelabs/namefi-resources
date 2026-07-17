---
title: DNS-Propagierung
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Die Verzögerung, bevor eine DNS-Änderung überall sichtbar ist, da alte Einträge in den Resolver-Caches ablaufen.
keywords: ['DNS-Propagierung', 'DNS-Aktualisierungsverzögerung', 'TTL', 'DNS-Cache', 'Nameserver-Änderung']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/the-malaysia-airlines-dns-hijack/
  - /de/blog/the-perl-com-domain-theft/
  - /de/blog/dns-on-tokenized-domains/
  - /de/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/ttl/
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/registry/
---

**DNS-Propagierung** ist die Verzögerung zwischen dem Vornehmen einer [DNS](/de/glossary/dns/)-Änderung und dem Zeitpunkt, an dem diese Änderung überall im Internet sichtbar ist. Sie entsteht, weil [Resolver](/de/glossary/dns-resolver/) weltweit die alte Antwort zwischenspeichern, bis ihr [TTL](/de/glossary/ttl/) abläuft, sodass ein neuer [Eintrag](/de/glossary/dns-record-types/) oder eine [Nameserver](/de/glossary/nameserver/)-Aktualisierung schrittweise statt sofort ausgerollt wird — von wenigen Minuten bis zu einigen Tagen. Es gibt kein globales „DNS", das man auf einmal aktualisieren könnte; die Propagierung ist schlicht das Ablaufen von Caches. Die praktische Abhilfe besteht darin, den TTL vor einer geplanten Änderung zu senken. All dies berührt nicht das Eigentum an einer Domain: Die Tokenisierung ändert, wer den Namen On-Chain kontrolliert, nicht wie schnell sich DNS-Bearbeitungen verbreiten. *Quelle(n): Cloudflare-TTL-Glossar; RFC 1035.*
