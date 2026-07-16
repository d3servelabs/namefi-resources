---
title: "온체인 도메인 플리핑: ENS 및 토큰화 도메인 거래"
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 32
format: guide
description: "온체인 도메인 플리핑의 작동 방식 — ENS 및 토큰화 도메인을 지갑에 보관하는 NFT 유동 자산으로 거래하는 방법, 그리고 레지스트라 플리핑과의 차이점."
ogImage: ../../assets/onchain-domain-flipping-og.jpg
keywords: ['온체인 도메인 플리핑', 'ENS 도메인 플리핑', '토큰화 도메인 플리핑', '토큰화 도메인 거래', '도메인 NFT 플리핑', '웹3 도메인 플립', 'ENS 도메인 투자', 'NFT 도메인 마켓플레이스', 'NFT로 도메인 판매', '온체인 도메인 트레이딩', 'ERC-721 도메인', '지갑 보관 도메인', '원자적 도메인 결제', '토큰화 도메인 유동성', '웹3 도메인 플리핑']
relatedArticles:
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/onchain-domain-marketplaces-compared/
  - /ko/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/dns/
  - /ko/glossary/web3/
---

도메인 플리핑의 구조는 단순합니다. 낮은 가격에 도메인을 매입하고, 그 도메인을 필요로 하는 구매자를 찾은 뒤, 높은 가격에 매도하는 방식입니다. 전통적인 거래 방식은 [레지스트라](/ko/glossary/registrar/), 애프터마켓 플랫폼, 그리고 이전이 완료되는 동안 대금을 보관하는 에스크로 에이전트를 통해 이루어집니다. 온체인 도메인 플리핑은 동일한 저가 매입·고가 매도 논리를 [블록체인](/ko/glossary/blockchain/) 위로 옮겨온 것으로, 여기서 도메인 이름 자체가 [지갑](/ko/glossary/wallet/)에 보관되며 다른 [NFT](/ko/glossary/nft/)처럼 거래할 수 있는 토큰이 됩니다.

이 하나의 변화 — 이름이 토큰이 된다는 것 — 가 거래의 거의 모든 단계를 바꿔놓습니다. 보관, 리스팅, 결제가 레지스트라의 계정 수준 작업이 아니라, 직접 통제하는 온체인 트랜잭션이 됩니다. 이 가이드는 온체인 도메인 플리핑이 실제로 무엇인지 설명하고, 플리퍼가 거래할 수 있는 두 가지 전혀 다른 종류의 "온체인 이름" 사이의 중요한 경계를 짚으며, 매수·보관·리스팅·결제에 이르는 거래의 전 과정을 안내합니다. 이는 더 넓은 [도메인 플리핑](/ko/blog/domain-flipping/) 플레이북의 온체인 핵심 축입니다.

## "온체인 도메인 플리핑"의 의미

일반적인 플리핑에서 소유권은 레지스트라의 데이터베이스에 존재합니다. 계정에 로그인하면 레지스트라 기록에서 해당 도메인의 관리 권한이 확인되고, 구매자에게 이전하려면 레지스트라가 중개하는 계정 간 또는 레지스트라 간 [이전](/ko/glossary/atomic-transfer/)이 이루어집니다. 자산은 실재하지만 직접 보유하는 것이 아니라, 자산을 가리키는 계정을 보유하는 셈입니다.

온체인 플리핑은 그 계정을 [토큰](/ko/glossary/tokenize/)으로 대체합니다. 도메인 이름이 [ERC-721](/ko/glossary/erc-721/) 표준에 따른 NFT로 표현되는데, 이더리움 스펙은 이를 [스마트 컨트랙트 내 NFT를 위한 표준 API](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)로 정의하며, 자체 요약에서는 [증서(deeds)라고도 불리는 대체 불가능 토큰](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)을 위한 표준 인터페이스라고 설명합니다. "증서"라는 단어가 핵심 개념을 담고 있습니다. 토큰이 다른 누군가가 보관하는 기록에 대한 영수증이 아니라, 도메인의 권리증서 자체가 지갑에 담겨 있다는 것입니다. 토큰을 보유한 사람이 도메인을 통제하며, 통제권 이전은 지원 티켓이 아닌 [스마트 컨트랙트](/ko/glossary/smart-contract/) 호출로 이루어집니다.

이러한 특성이 온체인 도메인을 유동적 자산 클래스처럼 거래되게 만드는 이유입니다. 예술품이나 컬렉터블과 동일한 [NFT 마켓플레이스](/ko/glossary/marketplace/)에 리스팅되고, 몇 분 만에 결제가 완료되며, 공개적으로 검증 가능한 소유 이력을 보유합니다. 플리핑 자체가 레지스트라 이전보다는 디지털 자산을 위해 구축된 레일 위의 [도메인 트레이딩](/ko/glossary/domain-trading/)에 가깝습니다.

## 두 종류의 온체인 이름 — 혼동하지 마십시오

![지갑 신원 칩과 토큰 대 NFT로 둘러싸인 지구본과 증서 인증서 — 두 가지 서로 다른 온체인 이름 자산을 나란히 나타낸 편집 일러스트레이션](../../assets/onchain-domain-flipping-01-two-kinds.jpg)

거래에 앞서 가장 중요하게 파악해야 할 것은, "온체인 도메인"이 플리퍼에게 서로 다르게 작동하는 두 가지 진정으로 다른 자산을 가리킨다는 사실입니다.

첫 번째는 [Web3](/ko/glossary/web3/) 네이티브 이름으로, 대표적인 예가 [ENS](/ko/glossary/ens/)입니다(`.eth`). 이 이름들은 이더리움 위에서만 존재합니다. ICANN 루트에 속하지 않으므로 `vitalik.eth`는 리졸버나 브리지 없이 일반 브라우저에서 작동하지 않습니다. 이들의 가치는 지갑 신원과 크립토 네이티브 네이밍에 있습니다. ENS는 또한 공개적인 등록 시장이기도 합니다. ENS 문서에 따르면 [5자 이상의 .eth는 연간 5달러의 비용이 발생하며](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), 4자 및 3자 이름은 의도적으로 더 높은 가격이 책정되어 있고, 등록 후에는 [다른 ERC-721 토큰과 동일하게](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token) 이전할 수 있습니다. 이 낮고 투명한 등록 하한가가 짧고 프리미엄인 `.eth` 이름이 자체적인 투기 시장을 형성하게 된 이유입니다.

두 번째는 **토큰화된 ICANN 도메인**입니다 — 실제 `.com`, `.xyz`, `.io` 도메인으로, 기반 DNS 이름이 어디서나 계속 작동하는 동시에 소유권이 NFT로 미러링된 것입니다. [토큰화 도메인이란 무엇인가](/ko/blog/what-are-tokenized-domains/)에서 설명하듯이, 이것들은 병렬 네임스페이스가 아닌 온체인 표현도 함께 갖춘 실제 DNS 도메인입니다. 플리퍼 입장에서 그 차이는 구체적입니다. 토큰화된 `.com`은 전통적인 인터넷의 범용 접근성, 이메일, 인증서 지원을 갖추고 있는 반면, ENS 이름은 크립토 네이티브 유틸리티를 제공하지만 웹사이트처럼 작동하려면 브리지가 필요합니다. 둘 다 온체인에서 플리핑할 수 있지만 동일한 상품이 아니며, 구매자는 각각에서 서로 다른 가치를 구매하는 것입니다. 두 유형의 직접 비교는 [토큰화 도메인 vs 웹3 도메인](/ko/blog/tokenized-domain-vs-web3-domain/)에서 확인할 수 있습니다.

세 번째 버킷으로 Unstoppable Domains 같은 플랫폼의 Web3 TLD들이 있는데, 이는 토큰화된 ICANN 이름보다 ENS에 더 가깝습니다. [프리미엄 Web3 TLD](/ko/blog/premium-web3-tlds/) 가이드에서 이들의 위치를 다루고 있습니다. 세 가지를 명확히 구분하면 각각을 올바르게 가격 책정할 수 있습니다.

## 레지스트라 애프터마켓 플리핑과의 차이

![원자적 결제를 나타낸 편집 일러스트레이션 — 동전과 NFT 토큰이 두 손 사이에서 퍼즐 조각처럼 맞물리고, 에스크로 에이전트는 옆으로 비켜진 모습](../../assets/onchain-domain-flipping-02-atomic-settle.jpg)

두 방식의 메커니즘은 결제 단계에서 가장 크게 갈립니다. 전통적인 플리핑에서 불안감이 가장 큰 부분이 바로 이 지점입니다. 레지스트라 방식에서는 매도자와 매수자가 교착 상태에 빠집니다. 매도자는 대금을 받기 전에 이전하지 않으려 하고, 매수자는 도메인을 받기 전에 대금을 지불하지 않으려 합니다. 그래서 제3자 [에스크로](/ko/glossary/escrow/) 에이전트가 양측을 중재해야 합니다. 이 전통적인 워크플로에 대한 상세한 설명은 [도메인 에스크로 설명](/ko/blog/domain-escrow-explained/)에서 확인하십시오.

온체인에서는 이 교착 상태가 단일 원자적 트랜잭션으로 해소될 수 있습니다. NFT를 위해 구축된 마켓플레이스 프로토콜은 대금 지급과 이전이 함께 이루어지거나 전혀 이루어지지 않도록 합니다. OpenSea의 주문 프로토콜인 Seaport는 자체적으로 [NFT를 안전하고 효율적으로 사고파는 마켓플레이스 프로토콜](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)이라고 설명하며, 실제 효과는 매수자의 대금과 매도자의 토큰이 하나의 결제 단계에서 교환된다는 것입니다. 어떤 에이전트도 거래 중간에 자산을 보관하지 않습니다 — 컨트랙트가 교환을 강제합니다. 이것이 토큰화 마켓플레이스가 [에스크로를 대체한다](/ko/blog/how-tokenized-marketplaces-replace-escrow/)고 말할 때 의미하는 메커니즘입니다.

그 외 주요 차이점들:

- **보관권이 본인에게 있습니다.** 레지스트라 계정 대신 자산이 본인의 지갑에 있습니다. 플랫폼 종속성과 계정 압수 위험은 제거되지만, [키 관리](/ko/glossary/custodial-ownership/)의 전적인 책임을 지게 됩니다 — 키를 잃으면 도메인도 잃습니다.
- **유동성 범위가 넓습니다.** 토큰화된 도메인은 도메인 전용 애프터마켓뿐 아니라 다른 모든 ERC-721 자산과 함께 일반 NFT 마켓플레이스에 리스팅할 수 있어, 잠재 구매자 풀과 입찰 기회가 넓어집니다.
- **출처가 공개됩니다.** 모든 이전 판매 및 이전 내역이 온체인에서 확인 가능하므로, 구매자는 마켓플레이스의 주장을 신뢰하지 않고도 이력을 검증할 수 있습니다 — 감정평가와 도메인 도용 여부 확인에 유용합니다.

## 거래 단계별 안내: 매수, 보관, 리스팅, 결제

![온체인 플리핑 4단계 흐름 편집 일러스트레이션 — 이름표를 확대하는 돋보기, 키와 지갑, 마켓플레이스 상점 전면, 코인과 토큰의 순환 교환](../../assets/onchain-domain-flipping-03-trade-steps.jpg)

### 매수

온체인 이름을 소싱하는 방법은 다른 플리핑과 동일합니다 — 저평가된 자산을 찾는 것이지만, 채널이 다릅니다. ENS 이름은 ENS 등록 시장이나 2차 NFT 마켓플레이스에서 구할 수 있으며, 누구나 온체인에서 등록 수수료를 읽을 수 있으므로 하한가가 투명합니다. 토큰화된 ICANN 도메인은 저평가되었다고 판단하는 실제 `.com`을 등록하거나 [토큰화](/ko/blog/how-to-tokenize-your-com/)하거나, 이미 토큰화된 것을 구매하는 방식으로 얻을 수 있습니다. 원칙은 나머지 [도메인 트레이딩](/ko/glossary/domain-trading/)과 동일합니다. 아무도 사지 않을 이름에 집착하지 말고, 진입 시 과도하게 지불하지 마십시오. 매수 가격이 전체 수익률을 결정합니다.

### 보관

이 단계는 레지스트라 플리핑에서는 없는 개념이며, 초보 플리퍼들이 과소평가하는 부분입니다. 이름이 NFT가 되는 순간 *본인*이 보관 시스템입니다. 핫 월렛은 활발한 거래에 편리하지만 가장 취약합니다. 하드웨어 월렛이나 [멀티시그](/ko/glossary/multi-sig/) 방식은 일부 편의성을 희생하는 대신 수개월간 보유할 이름을 훨씬 더 안전하게 보호합니다. 멀티시그가 올바른 선택인지는 실질적인 질문입니다 — [멀티시그 월렛이 실제로 보안을 향상시키는가](/ko/blog/do-multisig-wallets-actually-improve-security/)에서 이를 비교합니다. 그리고 키를 잃으면 도메인을 잃을 수 있으므로, 필요하기 전에 복구 계획을 세워두십시오. [지갑 분실 후 토큰화 도메인 복구](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)에서 가능한 것과 불가능한 것을 다룹니다.

### 리스팅

온체인 이름을 리스팅하는 것은 파킹된 도메인의 "매매 가능" 랜딩 페이지가 아니라 마켓플레이스 액션입니다. NFT 마켓플레이스에서 직접 고정 즉시 구매가를 설정하거나 경매를 열 수 있으며, 리스팅 자체가 온체인(또는 마켓플레이스 서명) 주문이 되어 어떤 구매자도 이행할 수 있습니다. 토큰화된 ICANN 도메인의 경우 일반적인 판매 페이지 유입 경로 옵션도 유지됩니다 — 차이점은 클로징이 에스크로 인계가 아닌 토큰 교환을 통해 이루어진다는 것입니다. 토큰화된 이름의 경우 특히 [DNS 연속성](/ko/blog/dns-on-tokenized-domains/)이 중요합니다. 잘 구축된 토큰화 도메인은 인계 과정에서도 깔끔하게 작동을 유지하므로, 운영 중인 사이트가 판매 중에 다운되지 않습니다.

### 결제

결제는 온체인 인프라 전체의 최종 보상입니다. 구매자가 주문을 이행하면 대금 지급과 토큰 이전이 함께 실행되고, 소유권이 하나의 확인된 트랜잭션으로 이전됩니다. ENS 이름의 경우 여기서 끝납니다 — 새 보유자가 이제 `.eth` 이름을 통제합니다. 토큰화된 ICANN 도메인의 경우 토큰 이전이 권리증서가 되며, 플랫폼이 기반 DNS 등록을 동기화 상태로 유지하여 구매자가 실제로 접속 가능한 도메인을 통제하게 됩니다. 어느 경우든 어느 쪽도 먼저 행동할 필요가 없었고, 어떤 에이전트도 그 사이에 자산을 보관하지 않았습니다.

## 수익의 현실

온체인 플리핑은 여전히 포트폴리오 게임이지 복권이 아닙니다 — 보유한 이름 대부분은 팔리지 않으며, 수익이 보유 비용을 충당합니다. 하지만 주요 판매 사례들이 이 분야가 주목받는 이유를 보여줍니다. The Block에 따르면 현재까지 가장 비싸게 팔린 ENS 이름은 [2021년 10월에 420 ETH(당시 약 150만 달러)에 구매된 paradigm.eth](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=paradigm.eth%2C%20which%20was%20purchased%20in%20October%202021%20for%20420%20ETH)이며, 같은 보고서는 [000.eth가 2022년 7월 300 ETH(31만 5천 달러)에 구매되었다](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)고 전합니다.

이를 비즈니스 모델이 아닌 예외적 사례로 취급하십시오 — `.com` 대형 판매에 적용되는 것과 같은 현실 검증이 여기서도 이중으로 적용되며, 추가로 온체인 이름 가격이 암호화폐 시장의 변동성을 따라간다는 점도 고려해야 합니다. ETH로 측정되는 하한가는 단 하나의 거래 없이도 달러 기준으로 절반이 될 수 있습니다. 하이라이트 릴이 아닌 냉철한 평가가 온체인 포트폴리오를 흑자로 유지하는 방법입니다.

## Namefi의 역할

깔끔한 온체인 플리핑 — 지갑 보관 권리증서, 원자적 결제, 에스크로 교착 없음 — 이 바로 [Namefi](https://namefi.io)가 *실제* ICANN 도메인에 구현하고자 구축한 워크플로입니다. 토큰화된 소유권은 `.com`의 통제를 NFT처럼 검증 가능하고 이전 가능하게 만들며, DNS 연속성은 인계 과정에서도 이름의 접속성을 유지하여 플리퍼가 구매자들이 실제로 대금을 지불하는 범용 접근성을 포기하지 않고 온체인 유동성을 확보할 수 있습니다. 이미 보유한 도메인을 이 모델에 편입하고 싶다면 [.com 토큰화 방법](/ko/blog/how-to-tokenize-your-com/)에서 안내를 확인하고, 플랫폼 간 비교는 [도메인 토큰화 플랫폼 선택](/ko/blog/choosing-a-domain-tokenization-platform/)에서 확인하십시오.

## 면책 고지 (꼭 읽어주세요!)

> 저희는 변호사, 회계사, 재무 어드바이저, 의사가 아니며, **이 글의 어떠한 내용도 법률, 금융, 세무, 회계, 의료 또는 기타 전문적 조언이 아닙니다.** 이 글은 자체 학습과 고객의 편의를 위해 작성되었습니다. 정보가 최신이 아닐 수 있고, 특정 지역에만 해당되거나 단순히 잘못된 내용이 포함될 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에는 **반드시 실제 전문가와 상담하십시오(진지하게!)**. 그것이 내키지 않는다면 친구에게 묻거나, 트위터, 레딧, AI, 또는 점술사에게 물어보십시오. 한마디로: **DOYR - 직접 조사하십시오**. 함께 배우고 즐겁게 나아갑시다.

## 출처 및 추가 자료

- Ethereum Improvement Proposals — [ERC-721 대체 불가능 토큰 표준 (NFT "증서라고도 불림")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ENS Documentation — [ETH 레지스트라 (등록 가격 책정; ERC-721 토큰으로 이전)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ProjectOpenSea — [Seaport (NFT를 안전하고 효율적으로 사고파는 마켓플레이스 프로토콜)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- The Block — [ENS 도메인 000.eth 300 ETH 낙찰; paradigm.eth 420 ETH로 최대 ENS 판매 기록 유지](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
