---
title: جسر التسلسلات المتقاطعة
date: '2026-06-22'
language: ar
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: بروتوكول بيحرّك التوكنات أو الرسائل بين البلوكتشينات اللي ما تقدرش تتواصل مع بعضها بشكل أصلي.
keywords: ['جسر', 'cross-chain', 'قابلية التشغيل البيني', 'جسر التوكنات', 'متعدد التسلسلات']
also_known_as: ['جسر']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /ar/blog/how-tokenization-changes-domain-flipping/
  - /ar/blog/tokenize-your-com-to-flip-it/
  - /ar/blog/what-are-tokenized-domains/
  - /ar/blog/tokenized-domain-use-cases-2026/
  - /ar/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/domain-security/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/tokenized-domain/
  - /ar/glossary/ethereum/
  - /ar/glossary/web3/
  - /ar/glossary/tokenize/
  - /ar/glossary/registrar/
---

**جسر التسلسلات المتقاطعة** (المعروف أيضًا بـ *جسر*) هو بروتوكول بيقفل أصلاً في [بلوكتشين](/ar/glossary/blockchain/) واحد وبيسك توكناً تمثيلياً في بلوكتشين تانية، وبيتيح بالتالي انتقال القيمة والبيانات عبر شبكات ما بينها قناة تواصل أصلية. النمط الأكثر شيوعاً هو "القفل والسك": بتودع توكناً في عقد الجسر على التسلسل المصدر، وحارس أو أوراكل لامركزي بيوجّه عقداً مطابقاً في التسلسل المستهدف لإصدار معادل مُغلَّف. الجسور بتربط [Ethereum](/ar/glossary/ethereum/) الرئيسي بـ[الطبقة الثانية](/ar/glossary/layer-2/) rollups زي Optimism أو Base، وبتسلسلات منفصلة تمامًا زي Polygon أو Solana. لأن الجسور بتحتفظ بمجمعات كبيرة من الأصول المقفولة، هي أهداف هجوم عالية القيمة — عدة جسور تعرضت لثغرات بالمليارات. بالنسبة للنطاقات المُرمَّزة، الجسر بيتيح انتقال NFT صادر على Ethereum لـ layer-2 أرخص للتحويلات منخفضة التكلفة، ثم الرجوع للشبكة الرئيسية كضمان DeFi.
