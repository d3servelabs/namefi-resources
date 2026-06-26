---
title: قفل النقل
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: حالة تمنع نقل الدومين لمُسجِّل آخر حتى يُفتح القفل صراحةً.
keywords: ['قفل النقل', 'قفل المُسجِّل', 'أمان الدومين', 'حالة EPP', 'نقل الدومين']
also_known_as: ['قفل المُسجِّل']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ar/blog/the-panix-com-domain-hijack/
  - /ar/blog/how-to-sell-a-domain-name-you-own/
  - /ar/blog/how-tokenization-changes-domain-flipping/
  - /ar/blog/avoiding-domain-sale-scams/
  - /ar/blog/working-with-domain-brokers/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-investing/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/domain-hijacking/
  - /ar/glossary/cross-registrar-transfer/
  - /ar/glossary/epp/
  - /ar/glossary/registry-lock/
---

**قفل النقل** (المعروف أيضًا بـ "قفل المُسجِّل"؛ حالة EPP: `clientTransferProhibited`) هو علامة يضعها [المُسجِّل](/ar/glossary/registrar/) تمنع نقل الدومين لمُسجِّل مختلف قبل فتح القفل عمدًا. لما القفل مفعَّل، أي محاولة لبدء [نقل بين المُسجِّلين](/ar/glossary/cross-registrar-transfer/) بتُرفض فور التقديم، حتى لو الطالب عنده [رمز المصادقة](/ar/glossary/auth-code/). هو واحد من أبسط وأفعل وسائل الحماية من [اختطاف الدومين](/ar/glossary/domain-hijacking/): حتى لو لص تمكّن من الوصول لحسابك، مش هيقدر ينقل الأصل في الخفاء ما دام القفل مفعَّلًا. أفضل ممارسة هي إبقاء قفل النقل مفعَّلًا في كل الأوقات وإزالته فقط للفترة القصيرة اللازمة لإتمام نقل شرعي.
