---
title: 공개 키
date: '2026-06-22'
language: ko
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: 블록체인 키 쌍에서 공유 가능한 절반으로, 개인 키에서 파생되며 자금 수신 및 서명 검증에 사용됩니다.
keywords: ['공개 키', '주소', '검증 키', '비대칭 암호화', '블록체인 계정']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/do-multisig-wallets-actually-improve-security/
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/private-key/
  - /ko/glossary/web3/
  - /ko/glossary/blockchain/
  - /ko/glossary/smart-contract/
  - /ko/glossary/dns/
---

**공개 키**는 [블록체인](/ko/glossary/blockchain/) 계정의 암호화 키 쌍 중 외부에 공유할 수 있는 절반입니다. 공개 키 자체, 또는 공개 키에서 파생된 주소는 누구에게나 공개해도 안전합니다. 타인이 토큰을 보내거나 스마트 컨트랙트를 사용자 대신 호출할 때 이 주소를 사용합니다. 공개 키는 [개인 키](/ko/glossary/private-key/)로부터 단방향 타원 곡선 수학을 통해 도출되므로, 공개 키를 공유하더라도 트랜잭션을 승인하는 비밀 정보가 노출되지 않습니다. 디지털 서명을 공개 키로 검증하면 해당 메시지가 대응하는 개인 키 보유자에 의해 서명되었음을 증명할 수 있으며, 이를 통해 네트워크는 트랜잭션이 실제로 승인된 것임을 확인합니다.
