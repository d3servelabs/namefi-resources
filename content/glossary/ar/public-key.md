---
title: المفتاح العام
date: '2026-06-22'
language: ar
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
description: النصف القابل للمشاركة من زوج مفاتيح البلوكشين، مشتق من المفتاح الخاص؛ يُستخدم لاستقبال الأموال والتحقق من التوقيعات.
keywords: ['مفتاح عام', 'عنوان', 'مفتاح التحقق', 'تشفير غير متماثل', 'حساب البلوكشين']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /ar/blog/the-badgerdao-frontend-attack/
  - /ar/blog/the-myetherwallet-bgp-dns-attack/
  - /ar/blog/do-multisig-wallets-actually-improve-security/
  - /ar/blog/onchain-domain-custody-and-recovery/
  - /ar/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/domain-flipping-skills/
relatedGlossary:
  - /ar/glossary/private-key/
  - /ar/glossary/web3/
  - /ar/glossary/blockchain/
  - /ar/glossary/smart-contract/
  - /ar/glossary/dns/
---

**المفتاح العام** هو النصف القابل للمشاركة من زوج المفاتيح التشفيرية لحساب البلوكشين. هو — أو العنوان المشتق منه — آمن للنشر على الملأ: ده هو المكان اللي بيبعت فيه الآخرون توكنات أو بيستدعوا عقودًا ذكية نيابةً عنك. المفتاح العام مشتق من [المفتاح الخاص](/ar/glossary/private-key/) بعمليات رياضية أحادية الاتجاه على المنحنيات الإهليجية، لأنك لو شاركته مش هيكشف السر اللي بيصرّح المعاملات. التحقق من توقيع رقمي بمقارنته بالمفتاح العام يثبت إن الرسالة وُقِّعت من حامل المفتاح الخاص المطابق، وده هو الطريقة اللي بيتأكد بيها البروتوكول إن المعاملة مصرَّح بها فعلًا.
