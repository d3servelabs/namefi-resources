---
title: IDN (Internationalized Domain Name) / Punycode
date: '2026-06-22'
language: en
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: A domain using non-ASCII characters, encoded for DNS as ASCII Punycode beginning with xn--.
keywords: ['IDN', 'internationalized domain name', 'Punycode', 'xn--', 'Unicode domain', 'homograph']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /en/blog/what-is-a-tld/
  - /en/blog/from-discordapp-com-to-discord-com/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /en/blog/domain-hacks-explained/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-investing/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/registry/
  - /en/glossary/tld/
  - /en/glossary/dns/
  - /en/glossary/phishing/
---

An **IDN (internationalized domain name)** is a domain that uses non-ASCII characters — `münchen.de`, `中国.cn`, or an emoji domain — so names can be written in scripts beyond basic Latin. Because the [DNS](/en/glossary/dns/) itself only handles ASCII, an IDN is encoded into a compatible ASCII string called **Punycode**, which always begins with the `xn--` prefix (so `münchen` becomes `xn--mnchen-3ya`). [Registries](/en/glossary/registry/) and [registrars](/en/glossary/registrar/) support IDNs at the [TLD](/en/glossary/tld/) level, though they carry a known risk: visually similar characters enable *homograph* lookalikes used in [phishing](/en/glossary/phishing/).
