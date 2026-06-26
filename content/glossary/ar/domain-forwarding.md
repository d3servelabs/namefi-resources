---
title: إعادة توجيه النطاق
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: إرسال الزوار من نطاق تلقائياً لعنوان تاني، غالباً عبر إعادة توجيه 301.
keywords: ['إعادة توجيه النطاق', 'إعادة توجيه 301', 'إعادة توجيه URL', 'DNS', 'إدارة النطاقات']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /ar/blog/how-domain-hijacking-actually-happens/
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-lenovo-com-dns-hijack/
  - /ar/blog/from-twitter-com-to-x-com/
  - /ar/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-investing/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/name-change-game-change/
relatedGlossary:
  - /ar/glossary/301-redirect/
  - /ar/glossary/registrar/
  - /ar/glossary/dns/
  - /ar/glossary/icann/
  - /ar/glossary/tld/
---

**إعادة توجيه النطاق** (بتُسمى كمان إعادة توجيه URL أو إعادة توجيه 301) هي إعداد بيبعت تلقائياً كل زائر يوصل لنطاق معين لـ URL وجهة مختلفة. متغيِّر [إعادة توجيه 301](/ar/glossary/301-redirect/) بيشير لمحركات البحث إن الانتقال دائم، وبيمرّر معظم link equity النطاق الأصلي للهدف — وده بيخليه الخيار المفضل عند توحيد العلامات التجارية أو ترحيل الترافيك. إعادة التوجيه بتتضبط إما في لوحة تحكم المسجِّل أو بضبط [نوع سجل DNS](/ar/glossary/dns-record-types/) يشير لسيرفر ويب بيطبق قاعدة إعادة التوجيه. حالة استخدام شائعة هي شراء [نطاق فرعي](/ar/glossary/subdomain/) مطابق أو متغيّر خاطئ إملائياً وتوجيهه للموقع الرئيسي لالتقاط الترافيك التائه. إعادة توجيه النطاق مختلفة عن التفويض الكامل لـDNS: النطاق لا يزال بيُحلَّل عبر DNS، لكن تعليمات HTTP-level بتعيد توجيه المتصفح.
