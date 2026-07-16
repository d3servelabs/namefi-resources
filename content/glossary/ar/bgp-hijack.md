---
title: اختطاف BGP
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: إعادة توجيه ترافيك الإنترنت عن طريق إعلان مسارات IP مزيفة، وهو هجوم على طبقة الشبكة أسفل من DNS.
keywords: ['اختطاف BGP', 'اختطاف المسار', 'IP prefix', 'أمن الشبكات', 'توجيه الإنترنت']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /ar/blog/the-myetherwallet-bgp-dns-attack/
  - /ar/blog/the-dnspionage-campaign/
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-sea-turtle-dns-espionage/
  - /ar/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/name-change-game-change/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/dns-hijacking/
  - /ar/glossary/icann/
  - /ar/glossary/public-key/
  - /ar/glossary/web3/
---

**اختطاف BGP** (اختطاف بروتوكول بوابة الحدود — Border Gateway Protocol) هو هجوم على طبقة الشبكة حيث نظام ذاتي خبيث أو مُهيَّأ بشكل خاطئ بيُذيع إعلانات توجيه مزيفة، وبيقنع الراوترات التانية على الإنترنت بإرسال الترافيك المتجه لـ[عنوان IP](/ar/glossary/ip-address/) شرعي عبر بنية تحتية المهاجم بدلاً منه. على عكس [اختطاف DNS](/ar/glossary/dns-hijacking/) — اللي بيفسد تعيينات الاسم للـ IP — اختطاف BGP بيشتغل على طبقة التوجيه، فسجلات DNS للنطاق بتفضل سليمة و DNSSEC ما بيوفرش حماية ضده. بعد إعادة توجيه الترافيك، المهاجمون يقدروا يعترضوا إصدار شهادات TLS (اختطافات BGP استُخدمت للحصول على شهادات مزيفة من هيئات التصديق اللي بتستخدم التحقق من النطاق عبر HTTP)، أو يقرأوا الترافيك غير المشفّر، أو ينفذوا هجمات man-in-the-middle. الحلول تشمل التحقق من أصل المسار عبر RPKI (البنية التحتية للمفاتيح العامة للموارد) وخدمات المراقبة اللي بتنبه لما أنظمة ذاتية غير متوقعة تُعلن عن prefixes بتاعتك.
