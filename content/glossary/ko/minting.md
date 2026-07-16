---
title: 민팅
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 블록체인에 새로운 토큰 레코드를 기록하는 행위로, 도메인의 경우 소유권을 나타내는 NFT를 발행하는 것을 말합니다.
keywords: ['민팅', '민트', 'NFT 생성', '토큰 발행', '온체인']
also_known_as: ['Mint']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/how-to-tokenize-your-com/
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ko/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/web3/
  - /ko/glossary/tokenize/
---

**민팅(Minting)**은 [블록체인](/ko/glossary/blockchain/)에 새로운 토큰 레코드를 기록하는 행위입니다. 주화를 찍어내는 것에 비유할 수 있으며, 여기서 '조폐소' 역할을 하는 것은 [스마트 컨트랙트](/ko/glossary/smart-contract/) 함수입니다. 이 함수는 컨트랙트의 온체인 상태에 항목을 생성하고 소유자 주소에 할당합니다. 도메인 토큰화에서 민팅은 실제 DNS 도메인 이름이 블록체인 네이티브 자산으로 전환되는 핵심 단계입니다. 스마트 컨트랙트가 `mint`를 호출하면 특정 도메인에 매핑되는 토큰 ID를 가진 [ERC-721](/ko/glossary/erc-721/) [NFT](/ko/glossary/nft/)가 생성됩니다. 이 순간부터 해당 도메인은 기존 도메인 등록 기관의 절차를 거치지 않고도 피어 투 피어로 이전하거나, [NFT 마켓플레이스](/ko/glossary/marketplace/)에 등록하거나, [DeFi](/ko/glossary/defi/)에서 활용할 수 있게 됩니다. 민팅에는 연산 처리 비용으로 [가스](/ko/glossary/gas/)가 필요하며, [토큰화](/ko/glossary/tokenize/) 과정에는 온체인 소유자가 DNS 설정을 제어할 수 있도록 등록 기관 레코드를 잠그는 절차도 포함됩니다. 민팅이 완료되면 NFT가 소유권의 기준이 되며, 이를 소각(삭제)하면 제어권이 기존 등록 시스템으로 반환됩니다.
