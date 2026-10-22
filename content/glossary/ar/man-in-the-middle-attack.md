---
title: "هجوم الوسيط"
date: '2026-10-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "هجوم الوسيط بيحط مهاجم بين طرفين بيتواصلوا علشان يعترض الاتصال أو يغيّره."
keywords: ["هجوم الوسيط", "MITM", "مصادقة TLS"]
also_known_as: ["MITM", "هجوم على مسار الاتصال"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
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
  - /ar/glossary/dane/
  - /ar/glossary/caa/
  - /ar/glossary/certificate-transparency/
---

**هجوم الوسيط**، المعروف كمان باسم **MITM** أو **هجوم على مسار الاتصال**، بيحط مهاجم بين طرفين بيتواصلوا. المهاجم بيعترض الاتصال أو بيمرره أو بيغيّره، والطرفين ممكن يكونوا فاكرين إنهم بيتواصلوا مباشرة. [اختطاف DNS](/ar/glossary/dns-hijacking/) يقدر يعيد توجيه الاتصال ناحية المهاجم. HTTPS عادة بيواجه انتحال طرف الاتصال بالتحقق من الشهادة وإثبات حيازة المفتاح الخاص. اختراق [جهة إصدار الشهادات](/ar/glossary/certificate-authority/) ممكن يضعف المصادقة دي لما البرنامج العميل يفضل يقبل الجهة المتأثرة. التشفير ساعتها ممكن يحمي اتصال طرفه هو المهاجم.
