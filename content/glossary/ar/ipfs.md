---
title: IPFS
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: بروتوكول نظير-لنظير يعرّف الملفات بمحتواها، يُستخدم لاستضافة بيانات الويب اللامركزي.
keywords: ['IPFS', 'عنونة المحتوى', 'نظير-لنظير', 'تخزين لامركزي', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /ar/blog/the-curve-finance-dns-hijack/
  - /ar/blog/what-are-tokenized-domains/
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/onchain-domain-custody-and-recovery/
  - /ar/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/domain-flipping-skills/
relatedGlossary:
  - /ar/glossary/web3/
  - /ar/glossary/dns/
  - /ar/glossary/tokenized-domain/
  - /ar/glossary/registrar/
  - /ar/glossary/blockchain/
---

**IPFS** (المعروف أيضًا بـ InterPlanetary File System) هو بروتوكول وسائط نظير-لنظير يعرّف الملفات بهاش محتواها — معرّف المحتوى (CID) — بدل موقع السيرفر. لو عندك عقدتين بيحتفظوا بنفس الملف، هيولّدوا نفس الـ CID، فالشبكة تقدر تجيبه من أقرب واحد. نموذج عنونة المحتوى ده عكس HTTP، اللي فيه الـ URL بيشير لسيرفر بعينه ممكن يوقف. في تطبيقات [web3](/ar/glossary/web3/)، IPFS هو طبقة البيانات اللامركزية المعتمدة خارج السلسلة: الميتاداتا بتاعة الـ NFT والأعمال الفنية والمستندات بتتخزن على IPFS عشان متبقاش مثبّتة بشكل دائم على [البلوكشين](/ar/glossary/blockchain/) الغالي — بدل كده، السجل [على السلسلة](/ar/glossary/on-chain/) بيتحفظ فيه الـ CID الثابت. لأصحاب الدومينات المُرمَّزة، IPFS يقدر يستضيف موقع لامركزي بيشتغل لما حد عنده بوابة أو إضافة متوافقة مع IPFS، من غير ما يحتاج سيرفرات DNS التقليدية.
