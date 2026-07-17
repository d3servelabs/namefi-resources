---
title: 개인 키
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 블록체인 계정을 제어하고 트랜잭션에 서명하는 비밀 숫자로, 절대 공유해서는 안 됩니다.
keywords: ['개인 키', '서명 키', '지갑 키', '비밀 키', '블록체인 계정']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/do-multisig-wallets-actually-improve-security/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/public-key/
  - /ko/glossary/wallet/
  - /ko/glossary/web3/
  - /ko/glossary/registrar/
  - /ko/glossary/blockchain/
---

**개인 키(private key)**는 계정을 제어하는 비밀 숫자입니다. 대부분의 블록체인에서 256비트 크기이며, 해당 주소에서 발생하는 모든 트랜잭션을 승인하는 디지털 서명을 생성합니다. 개인 키는 어떠한 경우에도 본인의 통제 하에 두어야 합니다. 분실하면 자산을 영구적으로 잃게 되고, 노출되면 누구든 [지갑](/ko/glossary/wallet/)을 비워갈 수 있습니다. 대부분의 사용자는 원시 키를 직접 다루지 않고, 대신 [시드 구문](/ko/glossary/seed-phrase/)을 통해 보호합니다. 시드 구문은 개인 키를 결정론적으로 재생성할 수 있는 사람이 읽을 수 있는 니모닉입니다. 개인 키에서 파생되는 상대 개념인 [공개 키](/ko/glossary/public-key/)는 외부에 공유해도 안전합니다.
