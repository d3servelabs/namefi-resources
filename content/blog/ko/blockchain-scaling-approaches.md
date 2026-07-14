---
title: "주요 블록체인 확장 방식: 롤업, 사이드체인, 채널, 샤딩"
date: '2026-07-02'
language: ko
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: 옵티미스틱 롤업, ZK 롤업, 사이드체인, 결제 채널, 샤딩, 데이터 가용성 레이어를 비교하는 블록체인 확장성 입문 가이드입니다.
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['블록체인 확장성', '블록체인 확장 솔루션', '레이어 2 확장', '롤업', '옵티미스틱 롤업', 'ZK 롤업', '사이드체인', '결제 채널', '상태 채널', '샤딩', '데이터 가용성', '확장성 트릴레마', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /ko/blog/blockchain-virtual-machines/
  - /ko/blog/blockchain-consensus-mechanisms/
  - /ko/blog/blockchain-privacy-technologies/
  - /ko/blog/blockchain-cryptographic-primitives/
  - /ko/blog/premium-web3-tlds/
relatedGlossary:
  - /ko/glossary/rollup/
  - /ko/glossary/optimistic-rollup/
  - /ko/glossary/zk-rollup/
  - /ko/glossary/data-availability/
  - /ko/glossary/layer-2/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/domain-flipping-skills/
---

Ethereum 메인넷은 초당 약 15건의 거래를 처리합니다. Visa 같은 결제 네트워크는 초당 수만 건을 처리합니다. 이 격차 때문에 블록체인에는 확장성이 필요합니다. 즉, 모든 참여자에게 기반 체인의 모든 거래를 검증하도록 요구하지 않고 더 많은 작업을 처리할 방법이 필요합니다. 지난 몇 년 동안 업계는 [롤업](/ko/glossary/rollup/), 사이드체인, 결제 채널, 샤딩이라는 몇 가지 뚜렷한 방식으로 수렴했습니다. 각 방식은 보안, 탈중앙화, 비용 사이에서 서로 다른 선택을 합니다.

이 가이드에서는 주요 확장 방식을 살펴보고 각각의 기반 메커니즘을 설명한 뒤 나란히 비교합니다. 다음에 어떤 프로젝트의 문서에서 이 개념을 접했을 때 차이를 분명히 알 수 있을 것입니다.

---

## 확장성 트릴레마

Vitalik Buterin이 제시한 **확장성 트릴레마**는 이 분야 대부분의 기반이 되는 사고 모형입니다. 블록체인은 세 가지 속성을 동시에 원합니다. “확장성: 하나의 일반 노드가 검증할 수 있는 것보다 더 많은 거래를 체인이 처리할 수 있음”, “탈중앙화: 소수의 대규모 중앙화 주체에 대한 신뢰 의존성 없이 체인을 운영할 수 있음”, “보안: 참여 노드 중 상당수가 공격을 시도해도 체인이 버틸 수 있음”입니다. 하지만 전통적인 설계는 이 셋 중 둘만 달성합니다([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). Bitcoin과 초기 Ethereum은 처리량보다 탈중앙화와 보안을 선택했습니다. 소수의 강력한 검증자에 의존하는 높은 TPS의 체인은 확장성과 보안을 얻는 대신 탈중앙화를 희생합니다. 단순한 다중 체인 설계는 확장 가능하고 탈중앙화를 유지할 수 있지만, 공격자가 체인 하나만 장악하면 되는 경우 안전하지 않을 수 있습니다.

아래의 모든 방식은 사실 같은 질문에 대한 답입니다. 삼각형의 다른 두 꼭짓점을 포기하지 않고 처리량을 어떻게 늘릴 수 있을까요?

## 롤업: 오프체인 실행, 온체인 정산

![여러 장의 작은 거래 티켓이 '롤업 압축기'라고 표시된 압축 장치로 모여 압축된 배치 큐브가 된 다음, 서로 연결된 블록으로 이루어진 기반 레이어 체인에 게시되는 평면 벡터 다이어그램](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

**[롤업](/ko/glossary/rollup/)**은 레이어 1(L1) 밖에서 거래를 실행한 다음 압축된 요약과 그 기반이 되는 거래 데이터를 기반 체인에 게시합니다. 이러한 시스템의 대표적인 추적 서비스인 L2BEAT는 롤업을 “주기적으로 상태 커밋을 Ethereum에 게시하는 L2”로 정의합니다. 이 커밋은 “유효성 증명으로 검증되거나, 낙관적으로 받아들여진 뒤 일정한 사기 증명 기간 안에 사기 증명 메커니즘을 통해 이의를 제기할 수 있습니다”([l2beat.com](https://l2beat.com/scaling/summary)). 데이터와 커밋이 모두 L1에 기록되므로 누구나 Ethereum만으로 롤업의 상태를 재구성할 수 있습니다. 바로 이 점 덕분에 롤업은 사용자에게 새로운 검증자 집합을 신뢰하도록 요구하지 않고 L1의 보안을 물려받습니다. 오늘날 대부분의 사람이 이용하는 [레이어 2](/ko/glossary/layer-2/) 네트워크의 기반 기술이 이것입니다. Base, Arbitrum, Optimism, zkSync, Starknet은 모두 롤업입니다.

롤업은 오프체인 실행의 정확성을 증명하는 방식에 따라 두 계열로 나뉩니다.

### 옵티미스틱 롤업

![주황색 'Optimistic' 문에는 사기 증명 기간을 나타내는 7일 시계와 이의 제기 깃발이 있고, 초록색 'ZK' 문에는 즉각적인 초록색 유효성 증명 확인 표시가 있는 두 개의 문을 나란히 그린 평면 벡터 일러스트](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

[옵티미스틱 롤업](/ko/glossary/optimistic-rollup/)은 “오프체인 거래가 유효하다고 가정하며 거래 배치에 대한 유효성 증명을 게시하지 않습니다”([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). 운영자는 거래를 배치로 묶어 오프체인에서 실행하고 압축된 데이터를 Ethereum에 게시합니다. 그러면 전체 노드를 실행하는 누구나 사기 증명으로 해당 배치에 이의를 제기할 수 있는 기간이 열립니다. L2에서 L1으로 자금을 인출하려면 “약 일주일 동안 이어지는 이의 제기 기간이 끝날” 때까지 기다려야 합니다([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). 이 일주일의 기간 때문에 일반적인 옵티미스틱 롤업 인출은 약 일주일이 걸립니다. 더 빠른 출금을 위해 수수료를 받는 타사 유동성 공급자를 이용하는 경우는 예외입니다.

옵티미스틱 롤업에는 완전한 암호학적 증명 파이프라인 대신 사기 증명 시스템만 필요합니다. 역사적으로 범용 스마트 컨트랙트를 더 쉽게 지원할 수 있었던 이유입니다. **Arbitrum**, **Optimism**, 그리고 ethereum.org에서 “OP Stack으로 구축된 옵티미스틱 롤업”이라고 설명하는 Coinbase의 롤업 **Base**([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack))는 현재 사용량 기준으로 가장 큰 옵티미스틱 롤업입니다.

### ZK 롤업

[ZK 롤업](/ko/glossary/zk-rollup/)은 반대 방식으로 접근합니다. 유효하다고 가정하고 이의 제기 기간을 두는 대신, 각 배치와 함께 상태 전이가 정확하다는 암호학적 증명인 유효성 증명을 제출합니다. Ethereum이 이 증명을 온체인에서 검증하므로 “ZK 롤업에서 Ethereum으로 자금을 이동할 때 지연이 없습니다. ZK 롤업 컨트랙트가 유효성 증명을 검증하면 출금 거래가 실행되기 때문입니다”([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). ZK 롤업은 “배치 하나에서 수천 건의 거래를 처리한 다음 메인넷에는 최소한의 요약 데이터만 게시할 수 있습니다”([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)). 여기에는 zk-SNARK(작은 증명, 빠른 검증)나 zk-STARK(투명하며 신뢰 설정이 필요 없음) 같은 증명 시스템을 사용합니다. **zkSync Era**, **Starknet**(“STARK와 Cairo VM에 기반한 범용 ZK 롤업”)([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM)), **Linea**가 대표적인 ZK 롤업입니다. Polygon zkEVM과 Scroll도 기존 Ethereum 스마트 컨트랙트를 ZK 증명이 가능한 환경에서 실행하기 위해 zkEVM을 구현합니다.

트레이드오프는 유효성 증명 생성에 많은 연산이 필요하며, 완전한 EVM 등가성을 구현하려면 사기 증명 시스템보다 기술적으로 더 어렵다는 점입니다. ZK 롤업이 더 빠른 최종성을 제공하는데도 옵티미스틱 롤업이 먼저 주류로 채택된 이유 중 하나입니다.

## 사이드체인

**사이드체인**은 “Ethereum과 독립적으로 실행되며 양방향 브리지로 Ethereum 메인넷에 연결된 별도의 블록체인”입니다. 롤업과 달리 “사이드체인은 별도의 합의 메커니즘을 사용하며 Ethereum의 보안 보장을 누리지 못합니다”([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). 이것이 레이어 2와 구별되는 핵심입니다. 사이드체인은 Ethereum이 아니라 자체 검증자 집합을 따르므로 상속받는 보안을 포기하는 대신 독립적인 설계 자유를 얻고, 보통 더 낮은 수수료와 더 빠른 블록을 제공합니다.

**Polygon PoS**가 가장 잘 알려진 예입니다. Polygon의 제품 페이지는 이를 “Ethereum에서 가장 많이 사용되는 사이드체인으로, 수십억 규모의 가치를 보호하며 검증을 거친 네트워크이자 거의 즉각적인 거래와 센트 미만의 수수료를 제공하는 체인”이라고 설명합니다([polygon.technology](https://polygon.technology/polygon-pos)). 이 체인은 Ethereum이 아니라 자체 지분 증명 검증자 집합으로 보호됩니다. **Gnosis Chain**(이전 이름 xDai)도 널리 사용되는 사이드체인이며 Skale과 Metis Andromeda도 여기에 포함됩니다. 서로 다르고 대체로 더 작은 검증자 집합을 신뢰하므로 사이드체인의 보안은 그 집합만큼만 강합니다. 무효 상태를 원칙적으로 L1에 고정된 데이터로 찾아내 되돌릴 수 있는 롤업과는 실질적으로 다른 보장입니다.

## 상태 채널과 결제 채널

**상태 채널**을 사용하면 둘 이상의 참여자가 공유 컨트랙트에 자금을 잠그고 서명된 업데이트를 직접 주고받아 오프체인에서 거래할 수 있습니다. 따라서 “채널 참여자들은 채널을 열고 닫기 위해 온체인 거래 두 건만 제출하면서 오프체인 거래를 원하는 만큼 수행할 수 있습니다”([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). 결제 채널은 단순한 잔액 전송에 특화된 형태로, “두 사용자가 공동으로 관리하는 ‘양방향 원장’으로 가장 잘 설명할 수 있습니다”([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). 참여자들은 서로 오프체인에서 즉시 원하는 만큼 거래할 수 있으며, 채널을 열어 담보를 잠그고 채널을 닫아 최종 잔액을 정산할 때만 기반 체인을 사용합니다.

가장 잘 알려진 구현은 Bitcoin의 **Lightning Network**입니다. 자체 사이트는 이를 “블록체인의 스마트 컨트랙트 기능을 사용해 참여자 네트워크 전반에서 즉각적인 결제를 지원하는 탈중앙화 네트워크”라고 설명합니다. “양방향 결제 채널”을 기반으로 인터넷에서 데이터 패킷을 전달하는 것처럼 결제를 라우팅합니다([lightning.network](https://lightning.network/)). 다만 채널은 *열린 채널로 서로 연결되는 경로가 있는 참여자 사이의 거래*만 확장할 수 있고, 채널을 열려면 자금을 미리 예치해야 하며, 채널 네트워크가 대규모로 원활히 작동하려면 유동성 라우팅이 필요합니다. 누구나 임의의 스마트 컨트랙트를 실행할 수 있는 범용 롤업에는 이런 제약이 없습니다.

## 샤딩과 데이터 가용성 레이어

![거래가 샤드 1부터 샤드 4까지 네 개의 병렬 샤드 경로로 나뉘어 각각 독립적으로 블록체인을 처리하고, 모두 아래쪽의 데이터 가용성 레이어 띠로 이어지는 평면 벡터 다이어그램](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

**샤딩**은 블록체인의 검증 작업을 여러 병렬 노드 부분집합인 “샤드”에 나눠 단일 노드가 네트워크의 전체 거래 부하를 처리하지 않아도 되게 합니다. Vitalik Buterin은 무작위로 표본을 뽑은 검증자 위원회가 서로 다른 샤드를 병렬로 검증하는 샤딩이 트릴레마의 “세 가지를 모두 얻는 기법”이라고 주장합니다([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)). 모든 노드가 모든 샤드의 전체 데이터를 다운로드하지 않아도 샤딩을 안전하게 만드는 기술은 [데이터 가용성](/ko/glossary/data-availability/) 샘플링(DAS)입니다. 이는 “개별 노드에 지나친 부담을 주지 않고 네트워크가 데이터의 가용성을 확인하는 방법”입니다([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)). 라이트 노드는 블록 데이터 중 무작위로 선택된 작은 조각만 다운로드하며, 소거 코딩 덕분에 전체 데이터가 게시되었다고 확신할 수 있습니다.

같은 데이터 가용성 문제는 롤업에도 직접 적용됩니다. 그래서 전용 데이터 가용성 레이어가 독립적인 인프라 범주로 등장했습니다. **Celestia**는 “롤업과 L2가 Celestia를 누구나 다운로드할 수 있도록 거래 데이터를 게시하고 제공하는 네트워크로 사용”하게 하려고 특별히 구축된 모듈형 블록체인입니다([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)). 롤업은 Ethereum 메인넷 대신 더 저렴하고 목적에 맞게 구축된 DA 레이어에 데이터를 게시할 수 있습니다. EigenLayer의 리스테이킹 인프라를 기반으로 구축된 **EigenDA**는 DA 레이어의 보안에도 참여하기로 선택한 Ethereum 스테이커가 보호하는 유사한 서비스를 제공합니다. Ethereum L1 대신 외부 DA 레이어에 데이터를 게시하는 롤업은 때때로 “순수” 롤업이 아니라 *밸리디움(validium)* 또는 *옵티미움(optimium)*이라고 불립니다. L2BEAT가 이들을 롤업과 다른 L2 솔루션 옆의 별도 범주로 추적하기 때문입니다([l2beat.com](https://l2beat.com/scaling/summary)). 이들은 데이터 게시 비용을 낮추는 대신 L1에 고정된 보안 보장의 일부를 포기합니다.

## 확장 방식 비교

| 방식 | 연산이 실행되는 곳 | L1 보안을 상속하는가? | 데이터 가용성 | 주요 트레이드오프 | 예시 |
|---|---|---|---|---|---|
| 옵티미스틱 롤업 | 오프체인(L2) | 예 — 데이터 + L1상의 사기 증명 | 전체 데이터를 L1에 게시 | 약 7일의 출금 이의 제기 기간 | Arbitrum, Optimism, Base |
| ZK 롤업 | 오프체인(L2) | 예 — 데이터 + L1상의 유효성 증명 | 전체 데이터를 L1에 게시 | 증명 생성 비용이 높고 완전한 EVM 등가성 구현이 더 어려움 | zkSync, Starknet, Linea |
| 사이드체인 | 독립 체인 | 아니요 — 자체 합의/검증자 | 자체 체인, L1에는 게시하지 않음 | 자체 검증자 집합만큼만 강한 보안 | Polygon PoS, Gnosis Chain |
| 상태/결제 채널 | 참여자 사이의 오프체인 | 간접 상속 — L1에 자금 잠금 | 게시하지 않고 최종 상태만 온체인에 기록 | 채널로 연결된 참여자 간 거래만 확장하며 자금을 미리 잠가야 함 | Lightning Network |
| 샤딩/DA 레이어 | 병렬 샤드 또는 별도 DA 네트워크 | 경우에 따라 다름 — L1 샤딩은 상속하지만 외부 DA 레이어는 새로운 신뢰 가정 추가 | 데이터 가용성 샘플링으로 검증 | 외부 DA는 비용을 줄이지만 L1 외부의 의존성 추가 | Ethereum 샤딩 로드맵, Celestia, EigenDA |

어떤 방식도 모든 축에서 앞서지는 못합니다. 그래서 실제 운영 시스템은 이들을 점점 더 결합합니다. 예를 들어 데이터를 Ethereum 대신 Celestia에 게시하는 ZK 롤업은 한 레이어에서 유효성 증명의 보안을 가져오고 다른 레이어에서 저렴한 데이터 가용성을 가져옵니다.

---

## 토큰화 도메인과의 관계

[토큰화 도메인](/ko/glossary/tokenized-domain/)에서는 모든 민팅, 이전, DNS 업데이트, 담보 작업이 온체인 거래이므로 확장 방식이 중요합니다. 거래 비용과 최종성에 걸리는 시간이 어디에서 정산되는지에 따라 달라지기 때문입니다. 옵티미스틱 롤업에서 확인된 토큰화 `.com` 이전은 사용자에게 저렴하고 빠르지만, 빠른 출금 브리지를 사용하지 않으면 약 일주일 동안 L1을 기준으로 완전히 최종 확정되지 않습니다. ZK 롤업의 같은 이전은 유효성 증명이 기록되는 즉시 L1을 기준으로 최종 확정됩니다. 사이드체인은 더 저렴할 수 있지만, 사이드체인에만 존재하는 도메인 NFT는 Ethereum이 아니라 해당 사이드체인의 더 작은 검증자 집합이 제공하는 보안을 물려받습니다. 이러한 트레이드오프를 이해하는 것은 도메인이 온체인에서 표현될 때 실제로 무엇을 소유하는지 이해하는 과정의 일부이며, [Web3 기초](/ko/topics/web3-foundations/) 전반에서도 중요한 실사 습관입니다.

---

## 출처 및 추가 자료

- [블록체인 확장성의 한계 — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [레이어 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [옵티미스틱 롤업 — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK 롤업 — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [사이드체인 — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [상태 채널 — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [데이터 가용성 — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [L2BEAT 확장성 요약](https://l2beat.com/scaling/summary)
- [Celestia란? — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
