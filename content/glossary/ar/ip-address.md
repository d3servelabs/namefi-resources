---
title: 'عنوان IP (IPv4 / IPv6)'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: العنوان الرقمي اللي بيعرّف جهاز على شبكة، وهو اللي DNS بيربط اسم النطاق بيه.
keywords: ['عنوان IP', 'IPv4', 'IPv6', 'سجل A', 'سجل AAAA', 'شبكات']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc791
  - https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/
---

**عنوان IP** هو التسمية الرقمية اللي بتعرّف جهاز على شبكة — `93.184.216.34` بصيغة **IPv4** الأقدم، أو سلسلة سداسية عشرية أطول زي `2606:2800:220:1:248:1893:25c8:1946` في **IPv6**، اللي موجود لأن العالم خلص من مساحة IPv4. الهدف الكلي من [DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) هو ربط نطاق سهل التذكر بواحد من العناوين دي: سجل **A** [من أنواع سجلات DNS](/ar/glossary/dns-record-types/) بيربط الاسم بعنوان IPv4، وسجل **AAAA** بيربطه بـ IPv6. كتل العناوين بتتخصص من خلال [IANA](/ar/glossary/iana/) للسجلات الإقليمية. ترميز النطاق بيشتغل فوق كل ده بطبقة منفصلة — بيغيّر مين *يملك* الاسم، مش الأعداد اللي الاسم بيحلّها.

*المصادر: RFC 791؛ مسرد عنوان IP من Cloudflare.*
