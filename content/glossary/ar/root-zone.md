---
title: 'منطقة الجذر (خوادم الجذر)'
date: '2026-06-22'
language: ar
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: قمة هيكل DNS، بتحتوي على قائمة بكل TLD والخوادم الموثوقة ليه.
keywords: ['منطقة الجذر', 'خوادم الجذر', 'هيكل DNS', 'تفويض TLD', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /ar/blog/what-is-a-tld/
  - /ar/blog/premium-web3-tlds/
  - /ar/blog/the-malaysia-airlines-dns-hijack/
  - /ar/blog/what-are-tokenized-domains/
  - /ar/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ar/topics/choosing-a-tld/
  - /ar/topics/domain-security/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/tld/
  - /ar/glossary/dns/
  - /ar/glossary/registry/
  - /ar/glossary/registrar/
  - /ar/glossary/icann/
---

**منطقة الجذر** هي أعلى نقطة في هيكل [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) — القائمة الرئيسية لكل [TLD (نطاق المستوى الأعلى)](/ar/glossary/tld/) وإيه خوادم [السجل (مشغل السجل)](/ar/glossary/registry/) الموثوقة بيه. بيخدمها **خوادم الجذر**، وهي مجموعة موزّعة عالمياً من الأنظمة متاحة عند ثلاثة عشر عنوان مُسمّى، ومحتويات المنطقة بيتم صيانتها من خلال [IANA](/ar/glossary/iana/). كل استعلام نطاق مش متخزّن في الكاش بيبدأ من هنا: [المحلّل](/ar/glossary/dns-resolver/) بيسأل الجذر فين يلاقي `.com`، وبعدين بيتبع السلسلة للأسفل. منطقة الجذر هي مرساة تسمية الإنترنت — والترميز مش بيلمسها، لأنه بيضيف طبقة ملكية يتحكم فيها بـ[محفظة](/ar/glossary/wallet/) فوق الـ DNS الموجود بدل ما يستبدل الجذر.

*المصادر: منطقة جذر IANA؛ خوادم جذر IANA.*
