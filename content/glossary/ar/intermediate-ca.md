---
title: "جهة إصدار شهادات وسيطة"
date: '2026-10-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "جهة إصدار شهادات وسيطة معاها صلاحية توقيع شهادات مفوّضة من خلال سلسلة لمرجع ثقة."
keywords: ["جهة إصدار شهادات وسيطة", "جهة تصديق وسيطة", "مصادقة TLS"]
also_known_as: ["جهة تصديق وسيطة"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /ar/glossary/man-in-the-middle-attack/
  - /ar/glossary/dane/
  - /ar/glossary/caa/
  - /ar/glossary/certificate-transparency/
---

**جهة إصدار شهادات وسيطة**، المعروفة كمان باسم **جهة تصديق وسيطة**، معاها صلاحية توقيع بتفوضها [جهة إصدار الشهادات](/ar/glossary/certificate-authority/) تانية من خلال سلسلة شهادات. السلسلة عادة بتوصل شهادة موقع بجذر موثوق، وأحيانًا بتمر بعدة شهادات وسيطة. قيود الشهادات بتحد الصلاحية المفوّضة. اختراق [المفتاح الخاص](/ar/glossary/private-key/) لجهة إصدار شهادات وسيطة ممكن يسمح بتوقيعات شهادات احتيالية في حدود الصلاحية دي. البرامج العميلة لازم تطبّق تحديثات سحب الثقة أو الإلغاء المناسبة. استبدال شهادة موقع واحدة ما بيشيلش مفتاح وسيط مخترق من قرارات الثقة عند البرامج العميلة التانية.
