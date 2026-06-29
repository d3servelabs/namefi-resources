---
title: 크로스체인 브리지
date: '2026-06-22'
language: ko
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: 서로 직접 통신할 수 없는 블록체인 간에 토큰이나 메시지를 이동시키는 프로토콜입니다.
keywords: ['브리지', '크로스체인', '상호운용성', '토큰 브리지', '멀티체인']
also_known_as: ['브리지']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/tokenized-domain-use-cases-2026/
  - /ko/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/ethereum/
  - /ko/glossary/web3/
  - /ko/glossary/tokenize/
  - /ko/glossary/registrar/
---

**브리지**(또는 크로스체인 브리지)는 한 [블록체인](/ko/glossary/blockchain/)에서 자산을 잠그고, 네이티브 통신 채널을 공유하지 않는 다른 네트워크에 대표 토큰을 발행하는 프로토콜입니다. 가장 일반적인 방식은 '잠금-발행(lock-and-mint)' 패턴으로, 소스 체인의 브리지 컨트랙트에 토큰을 예치하면 수탁자 또는 탈중앙화 오라클이 목적지 체인의 상응하는 컨트랙트에 래핑된 동등 자산을 발행하도록 지시합니다. 브리지는 [Ethereum](/ko/glossary/ethereum/) 메인넷을 Optimism, Base 같은 [레이어-2](/ko/glossary/layer-2/) 롤업이나 Polygon, Solana 같은 완전히 별개의 체인과 연결합니다. 브리지는 잠긴 자산의 대규모 풀을 보유하기 때문에 공격자의 주요 표적이 되며, 실제로 수억 달러 규모의 해킹 피해를 입은 사례가 다수 존재합니다. 토큰화된 도메인의 경우, 브리지를 활용하면 Ethereum에서 발행된 NFT를 저렴한 레이어-2로 이전해 낮은 비용으로 거래하다가, [DeFi](/ko/glossary/defi/) [담보](/ko/glossary/collateral/) 활용을 위해 다시 메인넷으로 가져올 수 있습니다.
