---
title: 멀티시그
date: '2025-06-30'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 트랜잭션을 승인하기 위해 여러 개의 개인 키가 필요한 지갑으로, 예를 들어 3개 중 2개의 서명이 필요한 방식이므로 키 하나가 유출되더라도 단독으로 자금을 이동시킬 수 없습니다.
keywords: ['멀티시그', 'multisig', '다중 서명', '보안 강화', '공동 보관']
level: 1
sources:
  - https://docs.safe.global/
relatedArticles:
  - /ko/blog/do-multisig-wallets-actually-improve-security/
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/wallet/
  - /ko/glossary/private-key/
  - /ko/glossary/tokenized-domain/
---

**멀티시그(다중 서명, multi-signature)**는 트랜잭션을 승인하기 위해 단 하나가 아닌 여러 개의 개인 키를 요구하는 보안 메커니즘입니다. 예를 들어 2-of-3 멀티시그 설정에서는 지정된 3개의 키 중 최소 2개가 모든 트랜잭션을 승인해야 합니다. 이는 여러 당사자가 소유권을 공유하거나 추가적인 보안이 필수적인 고가치 토큰화 도메인에 특히 유용합니다. 멀티시그 [지갑](/ko/glossary/wallet/)은 단일 장애 지점, 내부자 위협, 또는 키 분실에 대한 방어 수단이 됩니다. 조직은 멀티시그를 활용하여 중요한 도메인 이전 시 여러 임원의 승인을 의무화할 수 있으며, 개인은 도메인 자산의 도난이나 실수로 인한 손실을 방지하는 데 활용할 수 있습니다.
