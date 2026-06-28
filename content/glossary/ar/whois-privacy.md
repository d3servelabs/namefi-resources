---
title: خصوصية WHOIS
date: '2026-06-22'
language: ar
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: خدمة بتخفي بيانات تواصل المسجِّل الشخصية في سجلات WHOIS أو RDAP العامة.
keywords: ['خصوصية WHOIS', 'حماية الخصوصية', 'RDAP', 'خصوصية المسجِّل', 'إخفاء بيانات التواصل']
also_known_as: ['حماية الخصوصية']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /ar/blog/from-massdrop-com-to-drop-com/
  - /ar/blog/how-domain-hijacking-actually-happens/
  - /ar/blog/from-getdropbox-com-to-dropbox-com/
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-investing/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/name-change-game-change/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/dns/
  - /ar/glossary/icann/
  - /ar/glossary/tld/
  - /ar/glossary/whois/
---

**خصوصية WHOIS** (المعروفة أيضًا بـ "حماية الخصوصية") هي خدمة تقدمها معظم [المُسجِّلين](/ar/glossary/registrar/) بتستبدل جهة اتصال وكيلة — عادةً عنوان المُسجِّل نفسه وإيميل إعادة توجيه — باسم [المسجِّل](/ar/glossary/registrant/) الحقيقي وعنوانه ورقم هاتفه وإيميله في سجلات [WHOIS](/ar/glossary/whois/) وRDAP العامة. بدونها، هذه التفاصيل متاحة للاستعلام العلني، مما يجعل الملاك هدفًا للبريد المزعج ومحاولات الهندسة الاجتماعية والتصيّد المستهدف المصمَّم للإيقاع ببيانات اعتماد المُسجِّل. إنفاذ GDPR منذ 2018 دفع كثيرًا من السجلات لحجب البيانات الشخصية بشكل افتراضي في WHOIS الخاص بالـ gTLD، لكن الحماية تتفاوت بحسب TLD والمُسجِّل، لذا تفعيل خدمة الخصوصية صراحةً لا يزال ممارسةً جيدة. المهم فهم ما لا تفعله خصوصية WHOIS: هي بتُخفي بيانات التواصل لكنها لا تمنع مهاجمًا تقنيًا ماهرًا من استخدام تعداد DNS أو سجلات شفافية الشهادات لرسم خريطة البنية التحتية للدومين.
