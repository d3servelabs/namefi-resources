---
title: 'IDN (اسم النطاق الدولي) / Punycode'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: نطاق بيستخدم حروفاً غير ASCII، بيتشفَّر لـ DNS كـ ASCII Punycode يبدأ بـ xn--.
keywords: ['IDN', 'اسم نطاق دولي', 'Punycode', 'xn--', 'نطاق يونيكود', 'homograph']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /ar/blog/what-is-a-tld/
  - /ar/blog/from-discordapp-com-to-discord-com/
  - /ar/blog/the-lenovo-com-dns-hijack/
  - /ar/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /ar/blog/domain-hacks-explained/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-investing/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/registry/
  - /ar/glossary/tld/
  - /ar/glossary/dns/
  - /ar/glossary/phishing/
---

**IDN (اسم النطاق الدولي)** هو نطاق بيستخدم حروفاً غير ASCII — زي `münchen.de` أو `中国.cn` أو نطاق emoji — عشان الأسماء تتكتب بخطوط غير اللاتيني الأساسي. لأن [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) نفسه بيتعامل مع ASCII بس، الـ IDN بيتشفَّر لسلسلة ASCII متوافقة اسمها **Punycode**، دايماً بتبدأ ببادئة `xn--` (فـ `münchen` بتبقى `xn--mnchen-3ya`). [السجلات](/ar/glossary/registry/) و[مسجلو النطاقات](/ar/glossary/registrar/) بيدعموا الـ IDNs على مستوى [TLD (نطاق المستوى الأعلى)](/ar/glossary/tld/)، وإن كان فيه مخاطرة معروفة: الحروف المتشابهة بصرياً ممكن تتستخدم في هجمات *homograph* للتصيد الاحتيالي. الـ IDN في النهاية اسم مُسجَّل عادي تحته، فممكن يتّرمَز ويتحفظ في [محفظة](/ar/glossary/wallet/) زي أي نطاق تاني.

*المصادر: RFC 5890؛ موارد ICANN للـ IDN.*
