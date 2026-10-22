---
title: "Man-in-the-Middle-Angriff"
date: '2026-10-22'
language: "de"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "Ein Man-in-the-Middle-Angriff schaltet einen Angreifer zwischen Kommunikationspartner, um Kommunikation abzufangen oder zu verändern."
keywords: ["Man-in-the-Middle-Angriff", "MITM", "TLS-Authentifizierung"]
also_known_as: ["MITM", "On-Path-Angriff"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
relatedArticles:
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/dns-on-tokenized-domains/
  - /de/blog/dnssec-for-domain-owners/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/certificate-authority/
  - /de/glossary/intermediate-ca/
  - /de/glossary/dane/
  - /de/glossary/caa/
  - /de/glossary/certificate-transparency/
---

Ein **Man-in-the-Middle-Angriff**, auch **MITM** oder **On-Path-Angriff** genannt, schaltet einen Angreifer zwischen Kommunikationspartner. Der Angreifer fängt Kommunikation ab, leitet sie weiter oder verändert sie, während die Beteiligten möglicherweise von einer direkten Verbindung ausgehen. [DNS-Hijacking](/de/glossary/dns-hijacking/) kann eine Verbindung zum Angreifer umleiten. HTTPS wirkt einer Identitätsvortäuschung am Endpunkt normalerweise durch Zertifikatsvalidierung und den Nachweis des Besitzes des privaten Schlüssels entgegen. Eine kompromittierte [Zertifizierungsstelle](/de/glossary/certificate-authority/) kann diese Authentifizierung untergraben, wenn ein Client die betroffene Stelle weiterhin akzeptiert. Die Verschlüsselung kann dann eine Verbindung schützen, deren Endpunkt der Angreifer ist.
