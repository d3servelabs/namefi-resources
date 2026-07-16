---
title: 'خادم الأسماء (سجل NS)'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: خادم بيرد على استفسارات DNS للنطاق؛ سجلات NS بتسمّي الخوادم الموثوقة.
keywords: ['خادم الأسماء', 'سجل NS', 'خادم موثوق', 'تفويض DNS', 'استضافة DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
relatedArticles:
  - /ar/blog/how-domain-hijacking-actually-happens/
  - /ar/blog/the-myetherwallet-bgp-dns-attack/
  - /ar/blog/dns-on-tokenized-domains/
  - /ar/blog/the-lenovo-com-dns-hijack/
  - /ar/blog/the-dnspionage-campaign/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/registrar/
  - /ar/glossary/registry/
  - /ar/glossary/tld/
  - /ar/glossary/zone-file/
---

**خادم الأسماء** هو خادم بيرد على استفسارات [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) للنطاق، وسجلات **NS** في [السجل (مشغل السجل)](/ar/glossary/registry/) بتحدد إيه الخوادم الموثوقة بالنسبة له. لما بتوجّه نطاق على مضيف DNS (Cloudflare أو Route 53 أو DNS [مسجل النطاقات](/ar/glossary/registrar/) نفسه)، أنت بتبقى بتعيّن خوادم الأسماء بتاعته؛ الخوادم دي بعدين بتنشر [أنواع السجلات](/ar/glossary/dns-record-types/) — A وMX وTXT وغيرهم — اللي بتوجّه الزيارات والبريد. ترميز النطاق مش بيغيّر الطبقة دي: خوادم الأسماء وسجلاتها بتفضل شغّالة بالظبط زي ما هي، بينما الملكية والنقل بينتقلوا لطبقة [على السلسلة (On-chain)](/ar/glossary/on-chain/) يتحكم فيها بـ[محفظة](/ar/glossary/wallet/).

*المصادر: RFC 1034؛ أنواع خوادم DNS من Cloudflare.*
