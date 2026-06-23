---
title: 'أنواع سجلات DNS (A، AAAA، CNAME، MX، TXT)'
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: الإدخالات في المنطقة اللي بتربط نطاق بعناوين وخدمات — A وAAAA وCNAME وMX وTXT وغيرهم.
keywords: ['سجلات DNS', 'سجل A', 'سجل AAAA', 'CNAME', 'سجل MX', 'سجل TXT']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
---

**أنواع سجلات DNS** هي الإدخالات الفردية في منطقة النطاق اللي بتقول لـ[DNS (نظام أسماء النطاقات)](/ar/glossary/dns/) يبعت أنواع مختلفة من الزيارات على فين. الشائعة منهم هي **A** (بيربط اسم بـ[عنوان IP](/ar/glossary/ip-address/) من IPv4)، و**AAAA** (IPv6)، و**CNAME** (بيعمل اسم مستعار لاسم تاني)، و**MX** (بيوجّه البريد الإلكتروني)، و**TXT** (نص حر بيتستخدم لـ SPF وDKIM والتحقق من النطاق). السجلات دي بتنشرها [خوادم الأسماء](/ar/glossary/nameserver/) اللي بتفوّض النطاق ليها، وهي اللي بتخلي الموقع يشتغل والبريد يوصل فعلاً. ترميز النطاق مش بيمس الطبقة دي: السجلات بتفضل شغّالة بشكل طبيعي بينما الملكية والنقل بينتقلوا لطبقة [على السلسلة (On-chain)](/ar/glossary/on-chain/) يتحكم فيها بـ[محفظة](/ar/glossary/wallet/).

*المصادر: RFC 1035؛ سجلات DNS من Cloudflare.*
