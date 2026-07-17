---
title: マルチシグ
date: '2025-06-30'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: 2-of-3署名のように、複数の秘密鍵でトランザクションを承認するウォレットの仕組み。1つの鍵が漏洩しても単独で資産を移動できない。
keywords: ['マルチシグ', 'multisig', '複数署名', 'セキュリティ強化', '共同管理']
level: 1
sources:
  - https://docs.safe.global/
relatedArticles:
  - /ja/blog/do-multisig-wallets-actually-improve-security/
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/wallet/
  - /ja/glossary/private-key/
  - /ja/glossary/tokenized-domain/
---

**マルチシグ（多重署名）**は、トランザクションを承認するために単一の秘密鍵ではなく複数の秘密鍵を必要とするセキュリティの仕組みである。たとえば2-of-3のマルチシグ構成では、指定された3つの鍵のうち少なくとも2つが揃わなければトランザクションを承認できない。これは高価値のトークン化ドメインにおいて特に有効であり、複数の当事者が所有権を共有する場合や、追加的なセキュリティが不可欠な場面で力を発揮する。マルチシグ[ウォレット](/ja/glossary/wallet/)は、単一障害点・内部不正・鍵の紛失に対する防御策となる。組織はマルチシグを活用することで、重要なドメイン移転に複数の役員の承認を必須とする運用が可能になり、個人もドメイン資産の盗難や誤った紛失に対する保護として利用できる。
