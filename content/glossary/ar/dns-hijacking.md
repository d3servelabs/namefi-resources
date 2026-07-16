---
title: اختطاف DNS
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: إعادة توجيه ترافيك النطاق بالتلاعب في تحليل DNS بدل التسجيل نفسه.
keywords: ['اختطاف DNS', 'تسميم الكاش', 'تزوير DNS', 'DNSSEC', 'إعادة توجيه الترافيك']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-sea-turtle-dns-espionage/
  - /ar/blog/the-myetherwallet-bgp-dns-attack/
  - /ar/blog/the-dnspionage-campaign/
  - /ar/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/domain-investor-field-guide/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/registrar/
  - /ar/glossary/bgp-hijack/
  - /ar/glossary/registry/
  - /ar/glossary/urs/
---

**اختطاف DNS** (بيُسمى كمان تزوير DNS أو تسميم الكاش) بيهاجم طبقة التحليل بدل التسجيل نفسه: بدل الاستيلاء على النطاق عند المسجِّل، المهاجم بيفسد ما يعتقده [محلِّل DNS](/ar/glossary/dns-resolver/) أو [خادم الأسماء](/ar/glossary/nameserver/) إن النطاق بيشير إليه، وبيبعت الزوار بهدوء لـ IP خبيث. في هجوم تسميم الكاش، استجابة DNS مزيفة بيقبلها محلِّل تعاودي ويخزّنها لمدة TTL، فبيتم توجيه كل مستخدم بيخدمه المحلِّل ده لعنوان خاطئ — من غير ما يظهر أي تغيير في سجلات [DNS](/ar/glossary/dns/) الموثوقة. الإجراء التقني المضاد الأساسي هو [DNSSEC](/ar/glossary/dnssec/)، اللي بيوقّع استجابات DNS تشفيرياً عشان المحلِّلات تقدر تكشف التلاعب. على عكس [سرقة النطاق](/ar/glossary/domain-theft/) التقليدية، اختطاف DNS بيسيب سجلات الملكية سليمة، وده بيخليه أصعب في الاكتشاف من غير مراقبة نشطة لأين نطاقك بيُحلَّل فعلياً.
