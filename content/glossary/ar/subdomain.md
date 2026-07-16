---
title: النطاق الفرعي
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: بادئة بتتضاف على النطاق عشان تنشئ عنوان منفصل، زي blog.example.com أو app.example.com.
keywords: ['نطاق فرعي', 'مضيف', 'blog.example.com', 'DNS', 'نطاق المستوى الثاني']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /ar/blog/how-domain-hijacking-actually-happens/
  - /ar/blog/what-is-a-tld/
  - /ar/blog/domain-hacks-explained/
  - /ar/blog/domain-terminology-guide/
  - /ar/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/domain-flipping-skills/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/tld/
  - /ar/glossary/registrar/
  - /ar/glossary/registry/
  - /ar/glossary/domain-forwarding/
---

**النطاق الفرعي** هو بادئة بتتضاف على نطاقك عشان تنشئ عنوان مختلف تحته — `blog.example.com` و`app.example.com` و`mail.example.com` كلهم نطاقات فرعية لـ `example.com`. بتنشئه بإضافة [سجل DNS](/ar/glossary/dns-record-types/) (غالباً A أو CNAME) في [خوادم الأسماء](/ar/glossary/nameserver/) للنطاق الأب، من غير تسجيل إضافي أو رسوم. النطاقات الفرعية بتخلي الاسم المُسجَّل الواحد يستضيف خدمات كتير، وده بيخليها لبنة أساسية للمواقع والتطبيقات والـ APIs. في عالم الترميز، الملكية بتقع على [نطاق المستوى الثاني (SLD)](/ar/glossary/second-level-domain/) [المُسجَّل](/ar/glossary/registrant/)؛ والنطاقات الفرعية هي مجرد إعدادات تحته وبتبقى لمن يتحكم في [محفظة](/ar/glossary/wallet/) النطاق الأب.

*المصادر: RFC 1034؛ مسرد النطاقات الفرعية من Cloudflare.*
