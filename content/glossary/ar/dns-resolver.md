---
title: 'محلّل DNS (المحلّل التكراري)'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: الخادم اللي بياخد استعلام نطاق ويتنقل في هيكل DNS عشان يرجّع العنوان المناسب.
keywords: ['محلّل DNS', 'محلّل تكراري', 'محلّل', '8.8.8.8', '1.1.1.1', 'استعلام DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
---

**محلّل DNS** (أو *المحلّل التكراري*) هو الخادم اللي جهازك بيسأله كل ما محتاج يحوّل نطاق لـ[عنوان IP](/ar/glossary/ip-address/). المحلّلات العامة زي `1.1.1.1` (Cloudflare) و`8.8.8.8` (Google) بتعمل الشغل الصعب: بتبدأ من [منطقة الجذر](/ar/glossary/root-zone/)، وبتستفسر للأسفل في هيكل [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) لـ[خوادم الأسماء](/ar/glossary/nameserver/) الموثوقة للنطاق، وبعدين بتخزّن الإجابة في الكاش لمدة [TTL](/ar/glossary/ttl/) بتاعتها. الجزء ده من DNS هو اللي بيخلي "اكتب اسم، توصل للموقع" يحصل بسرعة. المحلّلات بتقرأ بيانات DNS العامة بس — معهاش أي تصوّر عن مين *يملك* النطاق، وده السبب اللي بيخلي طبقة الملكية القائمة على [المحفظة](/ar/glossary/wallet/) للنطاق المُرمَّز غير مرئية للـ resolution ومش بتغيّر أي حاجة في طريقة حل الأسماء.

*المصادر: RFC 1034؛ محلّل DNS من Cloudflare.*
