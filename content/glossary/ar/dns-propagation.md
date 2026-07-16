---
title: انتشار DNS
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: التأخير قبل ما تغيير DNS يتشاف في كل مكان، وده بيحصل لأن السجلات القديمة المُخزّنة بتنتهي تدريجياً عند المحلّلات.
keywords: ['انتشار DNS', 'تأخير تحديث DNS', 'TTL', 'كاش DNS', 'تغيير خادم الأسماء']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /ar/blog/the-curve-finance-dns-hijack/
  - /ar/blog/the-malaysia-airlines-dns-hijack/
  - /ar/blog/the-perl-com-domain-theft/
  - /ar/blog/dns-on-tokenized-domains/
  - /ar/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/name-change-game-change/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/ttl/
  - /ar/glossary/registrar/
  - /ar/glossary/icann/
  - /ar/glossary/registry/
---

**انتشار DNS** هو الوقت اللي بيعدي بين إنك تعمل تغيير في [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) وبين ما التغيير ده يبان في كل مكان على الإنترنت. ده بيحصل لأن [المحلّلات](/ar/glossary/dns-resolver/) حول العالم بتخزّن الإجابة القديمة في الكاش لحد ما [TTL](/ar/glossary/ttl/) بتاعتها ينتهي، فسجل [dns-record-types](/ar/glossary/dns-record-types/) أو تحديث [خادم أسماء](/ar/glossary/nameserver/) جديد بيتنشر تدريجياً مش فوري — ممكن ياخد من دقائق لحد يومين. مفيش DNS مركزي واحد تحدّثه في لحظة واحدة؛ الانتشار مجرد كاشات بتنتهي صلاحيتها. الحل العملي هو تقليل الـ TTL قبل التغيير المخطط بيوم. ومفيش حاجة من دي بيلمسها ملكية النطاق: الترميز بيغيّر مين يتحكم في الاسم على السلسلة، مش سرعة انتشار تعديلات DNS.

*المصادر: مسرد TTL من Cloudflare؛ RFC 1035.*
