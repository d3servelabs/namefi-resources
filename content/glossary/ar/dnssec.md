---
title: DNSSEC (امتدادات أمان نظام أسماء النطاقات)
date: '2026-05-22'
language: ar
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: توقيعات تشفيرية على سجلات DNS بتخلي المحللين يتحققوا إن الرد أصلي وما اتزوّرش ولا اتعبّث بيه في الطريق.
keywords: ['DNSSEC', 'أمان DNS', 'أمان النطاق', 'سجل DS', 'سلسلة الثقة', 'DNS تشفيري']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /ar/blog/dns-on-tokenized-domains/
  - /ar/blog/how-domain-hijacking-actually-happens/
  - /ar/blog/the-curve-finance-dns-hijack/
  - /ar/blog/the-dnspionage-campaign/
  - /ar/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/registrar/
  - /ar/glossary/registry/
  - /ar/glossary/icann/
  - /ar/glossary/tld/
---

**DNSSEC (امتدادات أمان نظام أسماء النطاقات)** هي مجموعة امتدادات تشفيرية لبروتوكول [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) بتخلي المحللين يتحققوا من أصالة وسلامة ردود DNS. من غير DNSSEC، ممكن مهاجم يزوّر أو يتلاعب بردود DNS في المسار بين المحلِّل والسيرفر المرجعي، وبكده يحوّل المستخدمين لبنية تحتية خبيثة. مع DNSSEC، السجلات بتكون موقّعة، وسلسلة الثقة بتمتد من جذر DNS لأسفل عبر كل منطقة بواسطة سجلات DS. DNSSEC محدد في [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) والـ RFCs المتعلقة بيه. ترميز النطاق مش بيغيّر DNSSEC خالص — سلسلة الثقة لسه بتمر عبر [مسجل النطاقات](/ar/glossary/registrar/) والسجل، وسجلات DS بتتنشر بنفس الطريقة. كتير من مزودي DNS (زي Cloudflare وRoute53) بيوقّعوا المناطق أوتوماتيكيًا لما بيتفعّل DNSSEC.
