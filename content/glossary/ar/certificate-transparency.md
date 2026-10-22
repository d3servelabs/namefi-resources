---
title: "شفافية الشهادات"
date: '2026-10-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "شفافية الشهادات بتستخدم سجلات عامة لكشف إصدار شهادات TLS للمراقبة والمراجعة المستقلة."
keywords: ["شفافية الشهادات", "CT", "مصادقة TLS"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /ar/glossary/certificate-authority/
  - /ar/glossary/intermediate-ca/
  - /ar/glossary/man-in-the-middle-attack/
  - /ar/glossary/dane/
  - /ar/glossary/caa/
---

**شفافية الشهادات**، المعروفة كمان باسم **CT**، بتسجل شهادات TLS في سجلات عامة بتسمح بالإضافة بس. مشغلو الدومينات وجهات المراقبة التانية يقدروا يفحصوا السجلات بحثًا عن إصدار غير متوقع من [جهة إصدار الشهادات](/ar/glossary/certificate-authority/). سياسات البرامج العميلة ممكن تشترط إثبات التسجيل قبل قبول شهادة. التسجيل لوحده ما بيمنعش الإصدار الاحتيالي وما بيلغيش الشهادة. فرض القواعد في البرنامج العميل والمراقبة بيوفروا حمايتين مختلفتين. CT بيكمّل [CAA](/ar/glossary/caa/): CAA بيوجه تفويض جهة الإصدار قبل الإصدار، وCT بيكشف الشهادات المسجلة لفحصها بعد الإصدار.
