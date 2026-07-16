---
title: 秘密鍵
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ブロックチェーンアカウントを管理し、トランザクションに署名するための秘密の数値。絶対に他人と共有してはならない。
keywords: ['秘密鍵', '署名鍵', 'ウォレット鍵', 'シークレットキー', 'ブロックチェーンアカウント']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/do-multisig-wallets-actually-improve-security/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/public-key/
  - /ja/glossary/wallet/
  - /ja/glossary/web3/
  - /ja/glossary/registrar/
  - /ja/glossary/blockchain/
---

**秘密鍵**とは、アカウントを管理するための秘密の数値であり、ほとんどのブロックチェーンでは256ビット長で表される。アドレスから発行されるすべてのトランザクションを承認するデジタル署名を生成するものであり、自分の管理下から外れてはならない。失えば資産を永久に失い、漏洩すれば誰でも[ウォレット](/ja/glossary/wallet/)を空にできる。ほとんどのユーザーは生の秘密鍵を直接扱うことなく、[シードフレーズ](/ja/glossary/seed-phrase/)—人間が読めるニーモニックで、決定論的に秘密鍵を再生成できる—によって保護する。対になる[公開鍵](/ja/glossary/public-key/)は秘密鍵から導出され、公開しても安全である。
