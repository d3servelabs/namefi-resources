---
title: ERC-20
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 스테이블코인 등 대체 가능한 토큰을 위한 이더리움 표준으로, ERC-721 NFT 표준과 함께 사용됩니다.
keywords: ['ERC-20', '대체 가능 토큰', '토큰 표준', '스테이블코인', '이더리움 토큰']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
relatedArticles:
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/ethereum/
  - /ko/glossary/erc-721/
  - /ko/glossary/stablecoin/
  - /ko/glossary/wallet/
  - /ko/glossary/web3/
---

**ERC-20**은 대체 가능한 토큰의 표준 인터페이스를 정의하는 [이더리움](/ko/glossary/ethereum/) 개선 제안(EIP)입니다. 대체 가능하다는 것은 각 단위가 동일하고 상호 교환 가능하다는 의미로, 은행 계좌의 달러화와 같습니다. ERC-20의 `transfer`, `approve`, `allowance` 함수를 구현하는 컨트랙트는 별도의 커스텀 통합 없이 지갑, 거래소, [DeFi](/ko/glossary/defi/) 프로토콜과 자동으로 호환됩니다. USDC, USDT 같은 [스테이블코인](/ko/glossary/stablecoin/)은 ERC-20 토큰이며, 대부분의 거버넌스 토큰 및 유틸리티 토큰도 마찬가지입니다. ERC-20은 [ERC-721](/ko/glossary/erc-721/)과 명확히 구별됩니다. ERC-721 토큰은 대체 불가능하며, 각 토큰이 고유한 ID를 가지고 특정 도메인 이름처럼 독립적인 자산을 나타냅니다.
