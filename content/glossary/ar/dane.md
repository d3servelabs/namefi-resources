---
title: "DANE"
date: '2026-10-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE بيثبت هوية خدمات TLS بربط شهادة أو مفتاح في سجلات TLSA محمية بـDNSSEC."
keywords: ["DANE", "مصادقة الكيانات المسماة المعتمدة على DNS", "مصادقة TLS"]
also_known_as: ["مصادقة الكيانات المسماة المعتمدة على DNS"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /ar/glossary/caa/
  - /ar/glossary/certificate-transparency/
---

**DANE** اختصار **مصادقة الكيانات المسماة المعتمدة على DNS**، وبيستخدم سجلات TLSA علشان يربط خدمة TLS بشهادة أو مفتاح عام أو مرجع ثقة. [DNSSEC (امتدادات أمان نظام أسماء النطاقات)](/ar/glossary/dnssec/) بيثبت صحة بيانات DNS. البرنامج العميل الداعم بيفرض الارتباط أثناء مصادقة TLS. حسب نمط الاستخدام المختار، DANE يقدر يقيّد [جهة إصدار الشهادات](/ar/glossary/certificate-authority/) العامة أو يثبت هوية خدمة بشكل مستقل عن الثقة العامة في CA. مجرد نشر سجلات TLSA ما بيحميش البرامج العميلة اللي بتتجاهل DANE. المشغلين لازم ينسقوا تغييرات المفاتيح مع تحديثات TLSA ويحافظوا على التحقق من DNSSEC.
