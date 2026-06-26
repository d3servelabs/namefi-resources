---
title: رمز التفويض (رمز EPP، رمز النقل)
date: '2026-05-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: سر قصير خاص بكل نطاق يُصدره المسجِّل للسماح بنقل النطاق إلى مسجِّل تاني، وبيتسمى كمان رمز EPP أو رمز النقل.
keywords: ['رمز التفويض', 'رمز EPP', 'رمز النقل', 'نقل النطاق', 'رمز التفويض', 'رمز AuthInfo']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /ar/blog/domain-escrow-explained/
  - /ar/blog/how-to-sell-a-domain-name-you-own/
  - /ar/blog/how-tokenization-changes-domain-flipping/
  - /ar/blog/the-panix-com-domain-hijack/
  - /ar/blog/how-to-tokenize-your-com/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/domain-investor-field-guide/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/registry/
  - /ar/glossary/dns/
  - /ar/glossary/cross-registrar-transfer/
  - /ar/glossary/epp/
---

**رمز التفويض** — المعروف كمان بـ**رمز EPP** أو **رمز AuthInfo** أو **رمز النقل** — هو سر مشترك قصير بيصدره [مسجل النطاقات](/ar/glossary/registrar/) لنطاق معين بهدف تفويض [نقل النطاق بين المسجلين](/ar/glossary/cross-registrar-transfer/). EPP (بروتوكول التوفير القابل للتوسعة) هو بروتوكول السجل الأساسي المعياري؛ ورمز التفويض هو بيانات الاعتماد الخاصة بكل نطاق جوّاه. عشان تنقل نطاق من مسجِّل لمسجِّل تاني، لازم المسجِّل المستقبِل يقدّم رمز تفويض صالح حصل عليه صاحب النطاق من المسجِّل الحالي. الرمز عادةً بيكون مرئيًا في لوحة تحكم المسجِّل، أحيانًا مخبي وراء زرار "نقل النطاق" أو "الحصول على رمز EPP". بالنسبة لـ[النطاقات المُرمَّزة](/ar/blog/what-are-tokenized-domains/)، نقل الملكية على السلسلة **مش** بيحتاج رمز تفويض — نقل [NFT (رمز غير قابل للاستبدال)](/ar/glossary/nft/) بيبقى ذري على السلسلة. رموز التفويض مرتبطة بس بنقل النطاق بين المسجلين في عالم [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) التقليدي.
