---
title: 레이어 2
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 이더리움의 Base처럼 블록체인 위에 구축되어 트랜잭션을 더 빠르고 저렴하게 처리하는 네트워크입니다.
keywords: ['레이어 2', '롤업', '스케일링', '옵티미스틱 롤업', 'ZK 롤업']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
relatedArticles:
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/what-are-tokenized-domains/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/cross-chain-bridge/
  - /ko/glossary/ethereum/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/blockchain/
---

**레이어 2**(L2)는 메인 [블록체인](/ko/glossary/blockchain/)(레이어 1)이 아닌 외부에서 트랜잭션을 실행한 뒤, 압축된 증명 또는 데이터를 메인 체인에 게시하는 네트워크입니다. 이를 통해 상위 체인의 보안을 그대로 물려받으면서 비용과 지연 시간을 크게 줄일 수 있습니다. 주요 설계 방식은 두 가지입니다. 첫째, 옵티미스틱 롤업(optimistic rollup)은 트랜잭션이 유효하다고 가정하고 사기 증명 이의 제기 기간을 허용합니다. 둘째, ZK 롤업(ZK rollup)은 매 배치마다 암호학적 유효성 증명을 게시합니다. Base, Optimism, Arbitrum, zkSync 등은 [이더리움](/ko/glossary/ethereum/) 위에 구축된 대표적인 L2 네트워크입니다. 연산을 L2로 이전하면 [가스](/ko/glossary/gas/) 수수료를 10~100배 절감할 수 있어, 소액 결제와 고빈도 자산 이전이 경제적으로 실현 가능해집니다. [토큰화된 도메인](/ko/glossary/tokenized-domain/) 운영 — 일상적인 전송, DNS 설정 변경, 서브도메인 발급 등 — 을 L2에서 실행하면 사용자는 수 달러 대신 수 센트의 비용만 부담하며, 자산의 출처는 이더리움 메인넷에 계속 고정되어 있습니다. L1과 L2 사이에서 자산을 이동해야 할 때는 [크로스체인 브리지](/ko/glossary/cross-chain-bridge/)를 사용합니다.
