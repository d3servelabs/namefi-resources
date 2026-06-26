---
title: السَّكّ
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
description: إنشاء توكن جديد على البلوكشين — وفي حالة الدومين، إصدار الـ NFT اللي بيمثّل تملّكه.
keywords: ['سكّ', 'إنشاء NFT', 'إصدار توكن', 'على السلسلة', 'مينتنج']
also_known_as: ['سَكّ']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /ar/blog/what-are-tokenized-domains/
  - /ar/blog/how-to-tokenize-your-com/
  - /ar/blog/onchain-domain-custody-and-recovery/
  - /ar/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ar/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/domain-security/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/registrar/
  - /ar/glossary/tokenized-domain/
  - /ar/glossary/web3/
  - /ar/glossary/tokenize/
---

**السَّكّ** (المعروف أيضًا بـ "سَكّ") هو فعل كتابة سجل توكن جديد على [البلوكشين](/ar/glossary/blockchain/) — زيّه زي سكّ العملة المعدنية، إلا إن "المطبعة" هنا عبارة عن دالة في [عقد ذكي](/ar/glossary/smart-contract/) بتنشئ إدخالًا في حالة العقد على السلسلة وبتعيّنه لعنوان مالك. في ترميز الدومينات، السَّكّ هو الخطوة المحورية اللي فيها اسم DNS الحقيقي بيصبح أصلًا أصيلًا على البلوكشين: العقد الذكي بيستدعي `mint`، فينشئ [ERC-721](/ar/glossary/erc-721/) [NFT](/ar/glossary/nft/) معرّفه بيتوافق مع دومين محدد. من تلك اللحظة، الدومين يقدر يتنقل بين الأشخاص مباشرةً، أو يُدرج في سوق NFT، أو يُستخدم في DeFi من غير ما يمس سير العمل التقليدي للمُسجِّل. السَّكّ بيحتاج [غاز](/ar/glossary/gas/) لدفع تكلفة المعالجة، وعملية [الترميز](/ar/glossary/tokenize/) بتشمل كمان قفل سجل المُسجِّل عشان المالك على السلسلة يتحكم في إعدادات DNS. بعد السَّكّ، الـ NFT هو المرجع الأصيل للتملّك؛ وحرقه (إتلافه) بيعيد التحكم للنظام التقليدي للتسجيل.
