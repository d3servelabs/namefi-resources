---
title: TTL (مدة البقاء)
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: المدة بالثواني اللي ممكن المحلّلات تخزّن فيها سجل DNS في الكاش قبل ما تعيد الاستعلام.
keywords: ['TTL', 'مدة البقاء', 'كاش DNS', 'انتشار DNS', 'تخزين السجلات']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
---

**TTL (مدة البقاء)** هي قيمة بالثواني مرفقة بكل [سجل DNS](/ar/glossary/dns-record-types/) بتقول لـ[المحلّلات](/ar/glossary/dns-resolver/) إزاي يقدروا يخزّنوا الإجابة في الكاش قبل ما يتحققوا تاني. TTL قصير (مثلاً 300 ثانية) بيعني إن التغييرات بتتّفذ بسرعة لكن بيولّد استفسارات أكتر؛ TTL طويل (86,400 ثانية = يوم واحد) أكفأ لكن بيعني إن التحديث بيفضل في الكاش. تقليل TTL بيوم قبل ما تعمل تغيير هو الحيلة المعتادة لـ[انتشار DNS](/ar/glossary/dns-propagation/) السريع. TTL بيتحكم في كاش DNS بس — مش متعلق بمدة تسجيل النطاق ولا بطبقة الملكية [على السلسلة (On-chain)](/ar/glossary/on-chain/) اللي النطاق المُرمَّز بيضيفها.

*المصادر: RFC 1035؛ مسرد TTL من Cloudflare.*
