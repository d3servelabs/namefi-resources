---
title: 'الانتظار قبل الحذف (Drop)'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: الحالة الأخيرة قبل ما نطاق غير متجدَّد يتحرر للعموم للتسجيل من جديد.
keywords: ['الانتظار قبل الحذف', 'حذف النطاق', 'الإمساك بالنطاق المتاح', 'نطاق منتهٍ', 'تحرير']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ar/blog/expired-domains-and-the-drop-cycle/
  - /ar/blog/domain-backorders-and-drop-catching/
  - /ar/blog/how-to-win-domain-auctions/
  - /ar/blog/hand-registering-domains-to-flip/
  - /ar/blog/when-to-drop-a-domain/
relatedTopics:
  - /ar/topics/domain-investing/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/registry/
  - /ar/glossary/icann/
  - /ar/glossary/backorder/
  - /ar/glossary/registrar/
  - /ar/glossary/dns/
---

**الانتظار قبل الحذف** هو آخر حالة في دورة حياة النطاق المنتهٍ: بعد ما [فترة الاسترداد](/ar/glossary/redemption-period/) تعدي من غير استرداد، [السجل](/ar/glossary/registry/) بيحط الاسم في حالة `pendingDelete` لمدة حوالي خمس أيام، ومش ممكن خلالها تجدده أو تحوّله. في نهاية المدة دي النطاق بـ**يتحرر** — بيتحذف وينطلق للعموم، متاح للتسجيل من جديد على أساس الأول يكسب. اللحظة دي هي اللي خدمات [الباكأوردر](/ar/glossary/backorder/) والإمساك بالنطاقات المتاحة بتتسابق عشان تلتقط فيها الأسماء المطلوبة. الانتظار قبل الحذف هو حالة بحتة على مستوى [السجل](/ar/glossary/registry/) في نظام [DNS](/ar/glossary/dns/) التقليدي؛ ما ليهاش مقابل في طبقة الملكية على السلسلة، وده سبب إن تجديد التسجيل الأساسي للنطاق المُرمَّز لسه مهم.

*المصادر: كودات حالة ICANN EPP.*
