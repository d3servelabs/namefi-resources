---
title: "주요 블록체인 합의 메커니즘: 작업 증명, 지분 증명 그리고 그 너머"
date: '2026-07-02'
language: ko
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 20
format: roundup
description: 작업 증명, 지분 증명, 위임 지분 증명, BFT 합의 등 주요 블록체인 합의 메커니즘과 각 방식이 네트워크를 보호하는 원리를 명확하게 설명합니다.
ogImage: ../../assets/blockchain-consensus-mechanisms-og.jpg
keywords: ['블록체인 합의 메커니즘', '합의 메커니즘', '작업 증명', '지분 증명', '위임 지분 증명', '비잔틴 장애 허용', 'Tendermint', 'CometBFT', '역사 증명', '권위 증명', '공간 증명', '이중 지불 문제', '블록체인 최종성', 'Ethereum Merge', 'Bitcoin 채굴', '검증자', '스테이킹', '시빌 저항성', 'Namefi']
relatedArticles:
  - /ko/blog/blockchain-virtual-machines/
  - /ko/blog/blockchain-scaling-approaches/
  - /ko/blog/blockchain-cryptographic-primitives/
  - /ko/blog/blockchain-privacy-technologies/
  - /ko/blog/what-are-tokenized-domains/
relatedGlossary:
  - /ko/glossary/consensus-mechanism/
  - /ko/glossary/proof-of-work/
  - /ko/glossary/proof-of-stake/
  - /ko/glossary/blockchain/
  - /ko/glossary/ethereum/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/domain-flipping-skills/
---

모든 [블록체인](/ko/glossary/blockchain/)은 누군가의 돈을 맡을 만큼 신뢰받기 전에 한 가지 질문에 답해야 합니다. 무슨 일이 어떤 순서로 일어났는지를 누가 결정할까요? 결정을 내릴 은행도, 공증인도, 중앙 서버도 없습니다. **합의 메커니즘**은 중앙 주체 없이, 그리고 누구도 같은 코인을 두 번 쓰지 못하게 하면서 네트워크 참여자들이 하나의 공유된 거래 기록에 합의하기 위해 따르는 규칙의 집합입니다.

이 가이드에서는 현재 사용되는 주요 합의 메커니즘, 각 방식이 실제로 다음 블록을 선택하는 방법, 그리고 그에 따른 트레이드오프를 살펴봅니다.

---

## 합의가 실제로 해결하는 문제

탈중앙화된 합의를 어렵게 만드는 문제는 두 가지입니다.

**이중 지불 문제.** 디지털 시스템에서 가치 단위는 데이터일 뿐이며 데이터는 복사할 수 있습니다. 중재자가 없다면 누군가가 같은 코인을 쓰는 서로 충돌하는 두 거래를 브로드캐스트하는 일을 막을 수 없습니다. Satoshi Nakamoto의 Bitcoin 백서는 목표를 직접적으로 설명합니다. 수신자가 앞선 결제가 나중의 충돌 거래로 되돌려지지 않는다고 확신하려면 네트워크에 “참여자들이 거래를 받은 순서에 대한 하나의 기록에 합의하는 시스템”이 필요합니다([Bitcoin 백서](https://bitcoin.org/bitcoin.pdf)).

**중앙 주체 없는 합의.** 일반 데이터베이스에서는 한 운영자의 판단이 최종 결정입니다. 공개된 무허가형 네트워크에서는 거짓말하거나, 검열하거나, 기록을 다시 쓰려는 참여자를 포함해 누구나 노드를 실행하고 거래를 제안하며 다음 블록을 추가하려 할 수 있습니다. 합의 메커니즘은 정직한 참여자가 네트워크를 계속 운영할 수 있을 만큼 비용을 낮게 유지하면서도 원장을 공격하는 비용을 감당하기 어렵게 높이거나 공격 동기를 다른 방식으로 억제해야 합니다.

아래의 각 메커니즘은 “누가 다음 블록을 제안하며, 그 블록을 신뢰할 수 있다는 사실을 어떻게 아는가?”라는 질문에 서로 다른 답을 내놓습니다. 비교할 때 가장 중요한 두 축은 **[시빌 저항성](/ko/glossary/consensus-mechanism/)**, 즉 공격자 한 명이 가짜 신원을 무제한으로 만들어 모두를 표결에서 이기는 일을 무엇이 막는지와 **최종성**, 즉 거래가 얼마나 빠르고 확실하게 되돌릴 수 없는 상태가 되는지입니다.

---

## 작업 증명

![여러 채굴자가 같은 해시 퍼즐을 풀기 위해 경쟁하고, 한 명은 "찾았다!"라고 적힌 블록을 들어 올리며, 번개 모양은 채굴의 높은 에너지 비용을 나타내는 모습](../../assets/blockchain-consensus-mechanisms-01-proof-of-work.jpg)

[작업 증명](/ko/glossary/proof-of-work/)(PoW)은 Bitcoin이 2009년에 도입한 메커니즘으로, 사람들이 “블록체인”이라는 말을 들을 때 가장 흔히 떠올리는 방식입니다. 채굴자들은 암호학적 퍼즐을 풀기 위해 경쟁합니다. 후보 블록의 데이터를 nonce와 함께 반복해서 해싱하여 결과 해시가 목표값보다 작아질 때까지 계산합니다. Ethereum 개발자 문서는 이 경쟁을 명확하게 설명합니다. 채굴자는 다른 누구보다 먼저 유효한 해를 찾기 위해 “데이터 세트를 수학 함수에 반복해서 넣습니다”([ethereum.org: 작업 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/#:~:text=When%20racing%20to%20create%20a%20block%2C%20a%20miner%20repeatedly%20put%20a%20dataset)). 유효한 해시를 먼저 찾은 채굴자가 다음 블록을 제안하고 블록 보상과 거래 수수료를 받습니다.

**시빌 저항성**은 퍼즐 자체에서 나옵니다. 해시 계산에는 실제 전력과 하드웨어 비용이 들기 때문에 가짜 신원을 많이 만들어도 유리하지 않으며, 오직 실제 연산 능력만 중요합니다. **최종성은 확률적입니다.** Bitcoin 백서는 노드가 항상 “가장 긴 체인을 올바른 체인으로 보고 확장한다”고 설명합니다([Bitcoin 백서](https://bitcoin.org/bitcoin.pdf)). 수신자는 해당 거래 위에 블록이 더 채굴될 때까지 기다리면서 거래가 확정되었다는 신뢰를 얻습니다. 새 블록이 추가될 때마다 기록을 다시 쓰는 비용은 기하급수적으로 커지지만, 어떤 단일 블록도 즉시 수학적으로 최종 확정되는 것은 아닙니다.

트레이드오프는 에너지입니다. 실제 연산으로 네트워크를 보호하면 실제 전력을 소비하게 되므로 Bitcoin 채굴 전력은 연간 테라와트시 단위로 측정됩니다. **예시 체인:** Bitcoin, Litecoin, Dogecoin, 그리고 2022년 이전의 Ethereum.

---

## 지분 증명

![검증자가 스테이킹 예치금으로 코인 더미를 금고에 잠근 뒤 추첨 바퀴를 통해 다음 블록 제안자로 선택되고, 금고에는 슬래싱 경고표가 붙어 있는 모습](../../assets/blockchain-consensus-mechanisms-02-proof-of-stake.jpg)

[지분 증명](/ko/glossary/proof-of-stake/)(PoS)은 연산 작업을 경제적 담보로 대체합니다. 참여자는 채굴하는 대신 네트워크의 네이티브 자산을 **스테이킹**, 즉 잠그고, 프로토콜은 각 블록을 제안할 스테이커를 의사 난수 방식으로 선택합니다. Ethereum의 검증자 역할은 좋은 참고 설계입니다. 검증자는 32 ETH를 예치하고 클라이언트 소프트웨어를 실행합니다. 그러면 프로토콜은 “매 슬롯마다 검증자 한 명을 블록 제안자로” 무작위 선택하고, 역시 무작위로 선정된 다른 검증자 위원회가 해당 블록의 유효성을 확인합니다([ethereum.org: 지분 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=One%20validator%20is%20randomly%20selected%20to%20be%20a%20block%20proposer%20in%20every%20slot)).

**시빌 저항성**은 지분 자체에서 나옵니다. 가짜 검증자를 많이 만들어도 동일한 자본을 더 많은 신원에 나눌 뿐이므로 영향력이 늘어나지 않습니다. 충돌하는 블록이나 서로 모순되는 유효성 증명을 제안하는 등의 부정행위는 **슬래싱**으로 처벌합니다. 프로토콜이 위반한 검증자의 지분 일부를 소각하는 방식입니다([ethereum.org: 지분 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=Two%20primary%20behaviors%20can%20be%20considered%20dishonest)). Ethereum은 체크포인트 메커니즘(Casper FFG와 LMD-GHOST 포크 선택 규칙의 결합)을 사용해 에포크 단위로 블록을 최종 확정합니다. 따라서 BFT 방식의 단일 라운드 투표 없이도 순수 PoW보다 강한 최종성 보장을 제공합니다.

PoW와 비교할 때 가장 두드러지는 트레이드오프는 에너지입니다. 스테이킹은 퍼즐을 풀기 위해 경쟁하는 전용 하드웨어가 필요하지 않으므로, ethereum.org의 표현대로 “작업 증명 계산에 많은 에너지를 사용할 필요가 없습니다”([ethereum.org: 지분 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=there%20is%20no%20need%20to%20use%20lots%20of%20energy%20on%20proof)). 절감 규모도 충분히 문서화되어 있습니다. 독립 분석 기관 CCRI는 Ethereum이 2022년 9월 PoW에서 PoS로 전환한 “The Merge”로 네트워크의 연간 전력 소비량이 99.988% 넘게 감소했다고 분석했습니다([ethereum.org: 에너지 소비](https://ethereum.org/en/energy-consumption/#:~:text=CCRI%20estimates%20that%20The%20Merge%20reduced%20Ethereum%27s%20annualized%20electricity%20consumption%20by%20more%20than%2099.988%25)). **예시 체인:** Ethereum, Cardano, Solana(경제적 보안에는 PoS를 사용하고 역사 증명을 함께 사용), Polkadot.

---

## 위임 지분 증명

위임 지분 증명(DPoS)은 스테이킹 모델을 유지하면서 선거 계층을 추가합니다. 모든 스테이커에게 개별적으로 블록 제안 자격을 주는 대신, 토큰 보유자가 소수의 **대표자**(증인 또는 블록 생성자라고도 함)에게 자신의 지분을 투표하고 선출된 집단만 실제로 블록을 생성합니다. 투표권은 보유 토큰 수에 비례합니다. 관련 분야에서는 핵심 메커니즘을 다음과 같이 잘 설명합니다. “각 토큰 보유자의 투표권은 보유한 토큰 수에 비례”하며 선거는 계속되므로 보유자는 언제든 투표 대상을 바꾸거나 성과가 낮은 대표자를 축출할 수 있습니다([Binance Academy: 위임 지분 증명 설명](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)).

**시빌 저항성**은 여전히 지분을 기반으로 합니다. 투표는 계정 수가 아니라 보유 토큰에 따라 가중됩니다. 하지만 블록 *생성*은 모든 스테이커에게 열려 있지 않고 선출된 소규모 위원회에 집중됩니다. 이 집중이 바로 설계 목적입니다. 활성 검증자 집합이 작고 미리 알려져 있으므로 DPoS 네트워크는 “흔히 3초보다 훨씬 짧은 빠른 블록 생성 시간”을 달성할 수 있습니다([Binance Academy: 위임 지분 증명 설명](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)). 트레이드오프는 탈중앙화입니다. 대부분의 DPoS 네트워크에는 대략 “21~101명의 활성 검증자”만 있어 개방형 PoS 네트워크에서 흔한 수백 또는 수천 명보다 훨씬 적습니다. 또한 투표 참여가 저조하면 같은 대표자들이 시간이 지나면서 자리를 굳힐 수 있습니다([Binance Academy: 위임 지분 증명 설명](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)). **예시 체인:** EOS, TRON, 그리고 변형된 형태로 DPoS를 사용하는 초기 Cosmos SDK 애플리케이션 체인 다수.

---

## BFT 방식 합의(Tendermint / CometBFT, PBFT)

![원탁에 둘러앉은 검증자들 중 3분의 2가 넘는 인원이 초록색 확인 팻말을 들어 합의하고, 자물쇠 아이콘이 표시된 블록이 즉시 최종 확정되는 모습](../../assets/blockchain-consensus-mechanisms-03-bft.jpg)

비잔틴 장애 허용(BFT) 합의는 완전히 다른 방식으로 접근합니다. 블록마다 경쟁하거나 제안자 한 명을 무작위로 선택하는 대신, 이미 알려진 검증자 집합이 명시적인 투표 라운드를 진행합니다. 같은 라운드에서 일반적으로 투표권의 3분의 2를 초과하는 특별다수가 동의해야만 블록을 커밋합니다. Cosmos SDK의 합의 엔진이며 Tendermint Core의 후속인 **CometBFT**는 스스로 “임의의 결정론적 유한 상태 머신을 위한 비잔틴 장애 허용(BFT) 상태 머신 복제(SMR)”를 수행한다고 설명합니다([Cosmos 문서: CometBFT](https://docs.cosmos.network/cometbft)). 이는 일부 노드에 장애가 있거나 악의적으로 행동해도 독립적으로 실행되는 노드 집합을 하나의 일관된 복제 원장처럼 작동하게 한다는 뜻입니다.

Tendermint 방식 체인의 **시빌 저항성**은 대개 스테이킹을 통해 상위 계층에서 구현됩니다. PoS처럼 검증자의 가중치가 지분에 따라 결정됩니다. 한편 BFT 투표 프로토콜 자체는 **최종성**을 제공합니다. 한 라운드에서 블록이 필요한 특별다수의 검증자 서명을 모으면 커밋되며, PoW 블록처럼 체인 재구성 대상이 되지 않습니다. 그 결과 빠르고 실용적인 거래 확정이 가능합니다. Cosmos Network는 CometBFT 기반 체인에서 1초 미만의 거래 확정을 강조합니다([Cosmos Network](https://cosmos.network/#:~:text=%3C1%20second%20transaction%20settlement)). 이는 블록을 기다리며 확인하는 PoW 모델과 대조됩니다. 트레이드오프는 BFT 프로토콜이 검증자 집합을 이미 알고 있어야 하고 그 규모가 제한되어야 한다는 점입니다. 통신 오버헤드는 검증자 수에 따라 커지므로 직접 참여할 수 있는 검증자 수에 상한이 생깁니다. **예시 체인:** Cosmos Hub와 기타 Cosmos SDK 체인(CometBFT), Binance Chain, 그리고 최초의 실용적 비잔틴 장애 허용(PBFT) 설계를 기반으로 한 허가형·기업용 원장.

---

## 그 너머: 역사 증명, 권위 증명, 공간 증명

몇 가지 메커니즘이 전체 지형을 채웁니다. 각 방식은 핵심 시빌 저항성 문제를 대체하기보다 더 좁은 문제를 해결합니다.

Solana가 PoS와 함께 사용하는 **역사 증명(PoH)**은 독립된 합의 메커니즘이 아니라 암호학적 시계입니다. “이전에 생성된 상태의 데이터를 해싱한 값을” 반복해서 이어 붙여 검증 가능한 타임스탬프를 체인에 직접 삽입합니다. 이를 통해 검증자들이 시간에 관해 서로 통신하지 않아도 사건 사이에 얼마나 많은 시간이 흘렀는지 증명하는 순서를 만듭니다([Solana: 역사 증명](https://solana.com/news/proof-of-history#:~:text=inserting%20data%20into%20the%20sequence%20by%20appending%20the%20hash%20of%20the%20data%20of%20the%20previously%20generated%20states)). 이 시계는 검증자에게 합의를 위한 검증 가능한 순서를 제공하지만, 그 자체가 거래를 병렬로 실행하게 하는 것은 아닙니다. 병렬 실행은 **Sealevel**이 담당합니다. Solana 거래는 읽거나 쓸 모든 계정을 미리 선언하므로, 런타임은 서로 겹치지 않는 거래뿐 아니라 동일한 상태를 읽기만 하는 거래도 동시에 실행할 수 있습니다([Solana: Sealevel](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=The%20reason%20why%20Solana%20is%20able%20to%20process%20transactions%20in%20parallel,transactions%20that%20are%20only%20reading%20the%20same%20state%20to%20execute%20concurrently%20as%20well)).

**권위 증명(PoA)**은 개방형 채굴이나 지분 기반 검증을 승인된 서명자 집합으로 대체합니다. PoW에 비해 블록 생성에 필요한 자원 비용을 크게 줄입니다. ethereum.org는 PoA가 PoW처럼 많은 자원이 필요한 채굴을 피할 수 있다고 설명합니다([ethereum.org: 권위 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=as%20it%20overcomes%20the%20need%20for%20high%20quality%20resources%20as%20PoW%20does)). 하지만 네트워크 운영 비용이나 보안 비용이 사라지는 것은 아닙니다. 보안 및 거버넌스 부담은 신뢰받는 검증자의 신원과 평판, 서명자 승인 규칙으로 이동합니다. PoA는 알려진 서명자를 신뢰해야 하며, 이들의 신원은 흔히 KYC나 식별 가능한 조직을 통해 확인됩니다([ethereum.org: 신뢰받는 서명자](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Proof%2Dof%2Dauthority%20requires%20trusting%20a%20set%20of%20authorized%20signers,if%20a%20validator%20does%20anything%20wrong%2C%20their%20identity%20is%20known)). 또한 ethereum.org가 설명한 구현에서는 서명자들이 동료를 추가하거나 제거하는 데 투표합니다([ethereum.org: 서명자 승인](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Each%20signer%20votes%20for%20the%20addition%20or%20removal%20of%20a%20signer%20in%20their%20block%20when%20they%20create%20a%20new%20block)). 탈중앙화를 포기하는 대신 속도와 낮은 운영 비용을 얻기 때문에 공개된 적대적 네트워크보다는 주로 프라이빗 체인, 테스트넷, 로컬 개발 네트워크에서 사용됩니다.

**공간 증명**과 그 변형인 시공간 증명은 연산 능력이나 지분 대신 할당된 디스크 저장 공간을 사용합니다. 참여자는 사용하지 않는 하드 드라이브 공간을 따로 확보했음을 증명하고, 프로토콜은 해당 공간을 계속 보유하고 있음을 증명하도록 주기적으로 요구합니다. PoW와 비슷한 시빌 저항성을 훨씬 적은 에너지로 제공하지만 많은 저장장치가 필요하다는 비용이 따릅니다. 가장 잘 알려진 예는 Chia입니다.

---

## 메커니즘 비교

| 메커니즘 | 시빌 저항성의 기반 | 최종성 | 에너지 비용 | 탈중앙화 | 예시 체인 |
|---|---|---|---|---|---|
| 작업 증명 | 연산 비용(해싱) | 확률적(확인 횟수) | 매우 높음 | 높음(무허가형 채굴) | Bitcoin, Litecoin, Dogecoin |
| 지분 증명 | 위험에 노출된 경제적 지분 | 체크포인트 기반 / 에포크 안에서 거의 최종 확정 | 매우 낮음 | 높음(수십만 명의 검증자) | Ethereum, Cardano, Polkadot |
| 위임 지분 증명 | 대표자를 뽑는 지분 가중 투표 | 빠름, 선출된 생성자마다 거의 즉시 확정 | 매우 낮음 | 더 낮음(소규모 선출 검증자 집합) | EOS, TRON |
| BFT 방식(Tendermint/CometBFT, PBFT) | 지분 또는 허가된 신원 + 특별다수 투표 | 커밋 즉시 결정론적으로 확정 | 낮음 | 중간(규모가 제한된 검증자 집합) | Cosmos Hub, Binance Chain |
| 권위 증명 | 검증된 신원/평판 | 빠름, 거의 즉시 확정 | 매우 낮음 | 낮음(신뢰받는 소규모 검증자 집합) | 프라이빗/기업용 체인, 테스트넷 |
| 공간 증명 | 할당된 저장 용량 | 확률적(블록 기반) | 낮음 | 중간(저장장치 의존) | Chia |

---

## 토큰화 도메인과의 관계

합의 메커니즘은 모든 [토큰화 도메인](/ko/blog/what-are-tokenized-domains/) 아래에 보이지 않게 자리한 기반입니다. `.com`, `.ai`, `.io` 도메인이 [NFT](/ko/glossary/nft/)로 발행되면 해당 토큰의 소유자에 대한 기록과 그 이후의 모든 이전, 판매, 갱신은 토큰이 존재하는 체인을 보호하는 합의 메커니즘만큼만 신뢰할 수 있습니다. [이더리움](/ko/glossary/ethereum/)에서 발행된 도메인 NFT는 PoS의 빠르고 비용이 낮은 최종성과 수십만 명에 이르는 검증자 집합을 물려받습니다. 같은 자산이 PoW 체인에 있다면 확률적 최종성과 훨씬 높은 거래 비용을 물려받습니다. 어떤 메커니즘이 체인의 기반인지, 그리고 그 메커니즘의 시빌 저항성과 최종성 보장이 실제로 무엇을 의미하는지 이해하는 일은 토큰화 도메인을 포함한 모든 온체인 자산을 평가하는 데 필요합니다.

---

## 출처 및 추가 자료

- [Bitcoin: 개인 간 전자화폐 시스템(Nakamoto 백서)](https://bitcoin.org/bitcoin.pdf)
- [ethereum.org — 작업 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/)
- [ethereum.org — 지분 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
- [ethereum.org — 권위 증명](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/)
- [ethereum.org — 에너지 소비](https://ethereum.org/en/energy-consumption/)
- [Cosmos 문서 — CometBFT](https://docs.cosmos.network/cometbft)
- [Cosmos Network](https://cosmos.network/)
- [Binance Academy — 위임 지분 증명 설명](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)
- [Solana — 역사 증명](https://solana.com/news/proof-of-history)
- [Solana — Sealevel: 수천 개의 스마트 계약 병렬 처리](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
