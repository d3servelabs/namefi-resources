---
title: أكواد حالة EPP
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: الأعلام القياسية على النطاق اللي بتوضح حالته — مقفول أو متوقف أو قيد النقل والمزيد.
keywords: ['أكواد حالة EPP', 'clientHold', 'serverTransferProhibited', 'حالة النطاق', 'قيد الحذف']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ar/blog/expired-domains-and-the-drop-cycle/
  - /ar/blog/domain-backorders-and-drop-catching/
  - /ar/blog/how-to-sell-a-domain-name-you-own/
  - /ar/blog/the-panix-com-domain-hijack/
  - /ar/blog/working-with-domain-brokers/
relatedTopics:
  - /ar/topics/domain-investing/
  - /ar/topics/domain-security/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/epp/
  - /ar/glossary/registry/
  - /ar/glossary/dns/
  - /ar/glossary/transfer-lock/
---

**أكواد حالة EPP** هي الأعلام القابلة للقراءة آلياً المحددة في بروتوكول [EPP](/ar/glossary/epp/) اللي بتصف بالضبط العمليات المسموح بها على النطاق في أي وقت. بتيجي في فضائين من الأسماء: الأكواد التي تبدأ بـ`client*` بيضبطها [المسجِّل](/ar/glossary/registrar/) والأكواد التي تبدأ بـ`server*` بيضبطها السجل، مع أسبقية أكواد السيرفر. من الأكواد الشائعة: `clientTransferProhibited` ([قفل النقل](/ar/glossary/transfer-lock/) اللي بيمنع النقل الصادر)، و`serverDeleteProhibited` (حماية على مستوى [السجل](/ar/glossary/registry/) ضد الحذف)، و`clientHold` (بيوقف تحليل DNS، غالباً لعدم الدفع)، و`pendingDelete` اللي بيُعلّم النطاق في [فترة السماح](/ar/glossary/grace-period/) قبل تحريره وإتاحته للتسجيل من جديد — حالة مجاورة لـ[قيد الحذف](/ar/glossary/pending-delete/). فهم هذه الأكواد مهم عملياً: نطاق يُظهر `serverTransferProhibited` ما ينقلش حتى بعد فتح قفله من المسجِّل، وده بيفاجئ المشترين في منتصف المعاملة.
