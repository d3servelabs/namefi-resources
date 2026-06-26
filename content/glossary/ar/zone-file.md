---
title: 'ملف المنطقة (سجل الغراء)'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: الملف النصي اللي بيحتوي على كل سجلات DNS للنطاق، بما فيها سجلات الغراء لخوادم الأسماء.
keywords: ['ملف المنطقة', 'سجل الغراء', 'منطقة DNS', 'سجلات موثوقة', 'خادم الأسماء']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
relatedArticles:
  - /ar/blog/how-domain-hijacking-actually-happens/
  - /ar/blog/what-are-tokenized-domains/
  - /ar/blog/dns-on-tokenized-domains/
  - /ar/blog/the-dnspionage-campaign/
  - /ar/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/registry/
  - /ar/glossary/registrar/
  - /ar/glossary/tld/
  - /ar/glossary/icann/
---

**ملف المنطقة** هو الملف النصي على [خوادم الأسماء](/ar/glossary/nameserver/) الموثوقة للنطاق اللي بيحتوي على كل [سجلات DNS](/ar/glossary/dns-record-types/) بتاعته — إدخالات A وMX وTXT وغيرها اللي بتحدد كيف يتصرف النطاق. **سجل الغراء** هو حالة خاصة: لما خوادم أسماء النطاق موجودة *تحت نفس النطاق ده* (مثلاً `ns1.example.com` بيخدم `example.com`)، [السجل (مشغل السجل)](/ar/glossary/registry/) الأب لازم ينشر [عنوان IP](/ar/glossary/ip-address/) لخادم الأسماء مباشرة في المنطقة الأم عشان يتفادى مشكلة البيضة والدجاجة في الاستعلام. تعديل ملف المنطقة هو الطريقة لإعداد [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) للنطاق. ده بيانات تشغيلية، منفصلة تماماً عن الملكية — وده بالظبط اللي النطاق المُرمَّز بينقله لطبقة يتحكم فيها بـ[محفظة](/ar/glossary/wallet/).

*المصادر: RFC 1035؛ مسرد منطقة DNS من Cloudflare.*
