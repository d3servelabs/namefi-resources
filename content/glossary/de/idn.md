---
title: 'IDN (Internationalized Domain Name) / Punycode'
date: '2026-06-22'
language: de
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Eine Domain mit Nicht-ASCII-Zeichen, die für DNS als ASCII-Punycode mit dem Präfix xn-- kodiert wird.
keywords: ['IDN', 'Internationalized Domain Name', 'Punycode', 'xn--', 'Unicode-Domain', 'Homograph']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /de/blog/what-is-a-tld/
  - /de/blog/from-discordapp-com-to-discord-com/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /de/blog/domain-hacks-explained/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-investing/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/registry/
  - /de/glossary/tld/
  - /de/glossary/dns/
  - /de/glossary/phishing/
---

Ein **IDN (Internationalized Domain Name)** ist eine Domain, die Nicht-ASCII-Zeichen verwendet — `münchen.de`, `中国.cn` oder eine Emoji-Domain —, damit Namen in anderen Schriften als dem lateinischen Grundalphabet geschrieben werden können. Da das [DNS](/de/glossary/dns/) selbst nur ASCII verarbeitet, wird ein IDN in eine kompatible ASCII-Zeichenkette namens **Punycode** kodiert, die stets mit dem Präfix `xn--` beginnt (so wird `münchen` zu `xn--mnchen-3ya`). [Registries](/de/glossary/registry/) und [Registrare](/de/glossary/registrar/) unterstützen IDNs auf [TLD](/de/glossary/tld/)-Ebene, obwohl sie ein bekanntes Risiko bergen: Visuell ähnliche Zeichen ermöglichen *Homograph*-Lookalikes, die für [Phishing](/de/glossary/phishing/) eingesetzt werden. Ein IDN ist dennoch ein gewöhnlicher registrierter Name darunter, sodass er wie jede andere Domain in einer [Wallet](/de/glossary/wallet/) tokenisiert und verwahrt werden kann. *Quelle(n): RFC 5890; ICANN-IDN-Ressourcen.*
