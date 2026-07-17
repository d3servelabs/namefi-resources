---
title: ERC-20
date: '2026-06-22'
language: ar
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: المعيار القياسي لـ Ethereum للتوكنات القابلة للتبادل زي العملات المستقرة، ويكمّل معيار ERC-721 للـ NFT.
keywords: ['ERC-20', 'توكن قابل للتبادل', 'معيار التوكن', 'عملة مستقرة', 'توكن إيثيريوم']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
relatedArticles:
  - /ar/blog/the-badgerdao-frontend-attack/
  - /ar/blog/onchain-domain-flipping/
  - /ar/blog/selling-domains-as-nfts/
  - /ar/blog/how-tokenization-changes-domain-flipping/
  - /ar/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /ar/topics/domain-investing/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/domain-flipping-skills/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/ethereum/
  - /ar/glossary/erc-721/
  - /ar/glossary/stablecoin/
  - /ar/glossary/wallet/
  - /ar/glossary/web3/
---

**ERC-20** هو مقترح تحسين [Ethereum](/ar/glossary/ethereum/) اللي بيحدد واجهة قياسية للتوكنات القابلة للتبادل — كل وحدة متطابقة وقابلة للاستبدال، تماماً زي الدولارات في حساب بنكي. أي عقد بينفذ دوال `transfer` و`approve` و`allowance` الخاصة بـERC-20 بيكون متوافق تلقائياً مع المحافظ والبورصات وبروتوكولات DeFi من غير أي تكامل مخصص. [العملات المستقرة](/ar/glossary/stablecoin/) زي USDC وUSDT هي توكنات ERC-20، وكذلك معظم توكنات الحوكمة والمنفعة. ERC-20 بيتناقض بشكل حاد مع [ERC-721](/ar/glossary/erc-721/): توكن ERC-721 غير قابل للتبادل — لكل واحد منه معرّف فريد يمثل أصلاً مميزاً، زي اسم نطاق بعينه.
