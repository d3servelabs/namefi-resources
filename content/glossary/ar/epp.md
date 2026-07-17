---
title: EPP
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: البروتوكول القياسي اللي بيستخدمه المسجلون لتسجيل النطاقات وإدارتها مع السجل.
keywords: ['EPP', 'Extensible Provisioning Protocol', 'إدارة النطاقات', 'بروتوكول السجل', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /ar/blog/the-panix-com-domain-hijack/
  - /ar/blog/the-lenovo-com-dns-hijack/
  - /ar/blog/expired-domains-and-the-drop-cycle/
  - /ar/blog/what-is-udrp/
  - /ar/blog/domain-escrow-explained/
relatedTopics:
  - /ar/topics/domain-basics/
  - /ar/topics/domain-security/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/domain-flipping-skills/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/registry/
  - /ar/glossary/epp-status-codes/
  - /ar/glossary/dns/
  - /ar/glossary/icann/
---

**EPP** (Extensible Provisioning Protocol) هو بروتوكول الأوامر المستند لـXML المحدد في RFC 5730 اللي بيتحكم في كيفية تواصل [المسجِّل](/ar/glossary/registrar/) مع [السجل](/ar/glossary/registry/) لإنشاء تسجيلات النطاق وتحديثها ونقلها وحذفها. في كل مرة مسجِّل بيسجّل اسماً جديداً أو يجدده أو يبدأ نقلاً، بيبعت أمر EPP عبر جلسة TCP آمنة لسيرفر EPP الخاص بالسجل ويستقبل استجابة هيكلية بتأكد النجاح أو بتُبلّغ عن خطأ. البروتوكول بيحمل كمان [رمز المصادقة](/ar/glossary/auth-code/) المستخدم للتصريح بعمليات النقل الصادرة وبيُظهر [أكواد حالة EPP](/ar/glossary/epp-status-codes/) — زي `clientTransferProhibited` أو `serverHold` — اللي بتصف الحالة الراهنة للنطاق. بما إن EPP محكوم بشكل صارم، الوصول مقصور على المسجلين المعتمدين؛ المستخدمون النهائيون بيتعاملوا معه مباشرةً أبداً.
