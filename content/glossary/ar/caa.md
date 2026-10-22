---
title: "CAA"
date: '2026-10-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "سجل CAA بيحدد جهات إصدار الشهادات اللي الدومين مصرح لها تصدر شهادات."
keywords: ["CAA", "تفويض جهة إصدار الشهادات", "مصادقة TLS"]
also_known_as: ["تفويض جهة إصدار الشهادات"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /ar/glossary/certificate-transparency/
---

**CAA** اختصار **تفويض جهة إصدار الشهادات**، وهو سجل DNS بيحدد [جهة إصدار الشهادات](/ar/glossary/certificate-authority/) أو الجهات اللي الدومين مصرح لها تصدر شهادات. جهة إصدار الشهادات الملتزمة بتراجع سجلات CAA المطلوبة قبل الإصدار. [DNSSEC (امتدادات أمان نظام أسماء النطاقات)](/ar/glossary/dnssec/) يقدر يثبت صحة إجابة DNS اللي بتنقل السياسة. CAA بيقلل الإصدار غير المقصود من خلال العمليات الملتزمة. CAA ما بيخليش المتصفحات ترفض شهادات من جهات إصدار تانية، وما بيلغيش الشهادات الموجودة، وما بيوقفش حد بيزور شهادات مباشرة بمفتاح توقيع CA مخترق. CAA بيحدد تفويض جهة الإصدار، والتحقق من الدومين بيفضل شرط منفصل.
