---
title: "جهة إصدار الشهادات"
date: '2026-10-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "جهة إصدار الشهادات بتصدر شهادات رقمية بتربط الهويات بمفاتيح عامة."
keywords: ["جهة إصدار الشهادات", "CA", "مصادقة TLS"]
also_known_as: ["CA", "سلطة التصديق"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
relatedArticles:
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-myetherwallet-bgp-dns-attack/
  - /ar/blog/the-curve-finance-dns-hijack/
  - /ar/blog/dns-on-tokenized-domains/
  - /ar/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/intermediate-ca/
  - /ar/glossary/man-in-the-middle-attack/
  - /ar/glossary/dane/
  - /ar/glossary/caa/
  - /ar/glossary/certificate-transparency/
---

**جهة إصدار الشهادات**، المعروفة كمان باسم **سلطة التصديق** أو **CA**، بتصدر شهادات رقمية بتربط الهويات بـ[المفتاح العام](/ar/glossary/public-key/). جهة إصدار شهادات TLS الموثوقة علنًا بتراجع التحكم في الدومين ومتطلبات إثبات الهوية المطلوبة قبل توقيع شهادة موقع. البرامج العميلة بتتحقق من سلسلة الشهادات مقارنة بجذر موثوق، وبتراجع إثبات الخادم لحيازة المفتاح الخاص المقابل. جهة إصدار الشهادات تقدر تفوض صلاحية التوقيع لـ[جهة إصدار شهادات وسيطة](/ar/glossary/intermediate-ca/). الثقة في جهة إصدار الشهادات بتثبت هوية حسب سياسة البرنامج العميل. الثقة في جهة إصدار الشهادات ما بتضمنش إن محتوى الموقع صادق.
