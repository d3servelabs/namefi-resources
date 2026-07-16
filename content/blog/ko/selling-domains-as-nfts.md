---
title: '도메인을 NFT로 판매하기: 온체인 유동성'
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 35
format: guide
description: '도메인을 NFT로 판매하는 방법: 리스팅 메커니즘, Seaport와 OpenSea, 구매자 제한 비공개 판매, 로열티, 그리고 가스비 및 사기 함정.'
ogImage: ../../assets/selling-domains-as-nfts-og.jpg
keywords: ['NFT로 도메인 판매', '도메인 NFT', '토큰화 도메인 판매', '온체인 도메인 유동성', 'OpenSea 도메인 NFT 리스팅', 'Seaport 프로토콜', '구매자 제한 리스팅', '비공개 NFT 리스팅', 'NFT 로열티 도메인', 'ERC-721 도메인', '원자적 이전 도메인', '토큰화 도메인 판매', 'NFT 판매 가스비', 'NFT 도메인 사기', '온체인 도메인 플리핑']
relatedArticles:
  - /ko/blog/onchain-domain-marketplaces-compared/
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/end-user-vs-reseller-domain-pricing/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/dns/
  - /ko/glossary/web3/
  - /ko/glossary/tld/
---

전통적인 도메인 거래에는 구조적 신뢰 문제가 내재되어 있습니다. 판매자는 돈이 입금되기 전에 이전을 진행하고 싶지 않고, 구매자는 도메인이 자신의 계정에 나타나기 전에 대금을 송금하고 싶지 않습니다. [에스크로](/ko/glossary/escrow/) 산업 전체가 바로 이 두 가지 상반된 심리 사이를 중재하기 위해 존재합니다. 도메인을 [NFT](/ko/glossary/nft/)로 판매하면 이 교착 상태가 해소됩니다. 실제 ICANN 도메인의 소유권이 [온체인](/ko/glossary/on-chain/) 토큰이기도 할 때, 해당 도메인은 자금이 이동하는 것과 동일한 트랜잭션 안에서 리스팅하고 가격을 설정하며 이전할 수 있는 자산이 됩니다. 결제와 이전 사이의 어두운 공백 속에서 자산을 보관하는 중간자가 더 이상 필요 없습니다.

이 가이드는 바로 그 유동성 레이어에 관한 것입니다. [도메인](/ko/glossary/domain-trading/) NFT를 리스팅할 때 실제로 어떤 일이 일어나는지, 마켓플레이스의 작동 구조는 어떠한지, 공개 리스팅 대신 구매자 제한 비공개 리스팅을 언제 사용해야 하는지, 로열티는 어떻게 작동하는지, 그리고 온체인 판매를 조용히 잠식하는 가스비 및 사기 함정을 다룹니다. 이 글은 [도메인 플리핑](/ko/blog/domain-flipping/) 시리즈의 한 축이며, 토큰화 도메인이 무엇인지 이미 알고 있다는 전제 하에 작성되었습니다. 모르신다면 [토큰화 도메인이란 무엇인가](/ko/blog/what-are-tokenized-domains/)부터 시작하시기 바랍니다.

## 실제로 무엇을 판매하는가

먼저, 이 글 전체의 기반이 되는 중요한 개념을 짚고 넘어가겠습니다. 토큰화 도메인은 [ENS](/ko/glossary/ens/) 이름이나 Unstoppable 이름과 다른 자산이며, 판매 행위 역시 동일하지 않습니다.

- **[ENS](https://ens.domains) `.eth` 이름**은 이더리움 위에서만 존재합니다. ENS를 지원하는 [지갑](/ko/glossary/wallet/)과 앱에서는 확인할 수 있지만, 일반 브라우저 주소창에서는 작동하지 않습니다. ENS는 글자 수에 따라 등록 비용을 책정합니다. ENS 문서에 따르면 [5글자 이상의 `.eth` 이름은 연간 $5](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), [4글자는 연간 $160](https://docs.ens.domains/registry/eth#:~:text=A%20%604%60%20letter%20%60160%20USD%60%20per%20year), [3글자는 연간 $640](https://docs.ens.domains/registry/eth#:~:text=and%20a%20%603%60%20letter%20%60640%20USD%60%20per%20year)입니다.
- **Unstoppable 이름** (`.crypto`, `.x` 등)은 ICANN 루트 밖에서 발행되는 [Web3](/ko/glossary/web3/) 이름입니다.
- **토큰화된 ICANN 도메인**이 바로 이 시리즈가 다루는 대상입니다. 모든 브라우저에서 접속되는 실제 `example.com`이면서, 동시에 그 제어권을 나타내는 토큰이 지갑에 존재하는 형태입니다. 세 가지를 직접 비교한 내용은 [토큰화 도메인 vs. Web3 도메인](/ko/blog/tokenized-domain-vs-web3-domain/)에서 확인하실 수 있습니다.

아래의 마켓플레이스 메커니즘은 모두 NFT이기 때문에 세 가지 모두에 적용됩니다. 그러나 이전되는 *가치*는 크게 다릅니다. ENS 이름을 판매하면 구매자는 온체인 전용 아이덴티티를 얻습니다. 토큰화된 `.com`을 판매하면 구매자는 소유권 이전 과정에서도 DNS가 계속 작동하는, 범용으로 접속 가능한 비즈니스 자산을 얻습니다. 매끄러운 리스팅 화면에 속아 하나를 다른 것처럼 가격을 책정하는 실수를 범하지 마십시오.

## 도메인 NFT가 유동성을 갖추는 방법

거래할 도메인 NFT의 대부분은 [ERC-721](/ko/glossary/erc-721/) 토큰입니다. Wikipedia는 이를 [이더리움 블록체인에서 고유하고 대체 불가능한 토큰(NFT)을 생성하고 관리하기 위한 규칙과 인터페이스를 정의하는 기술적 프레임워크](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)라고 설명합니다. 표준 토큰이기 때문에 유동성을 가집니다. ERC-721을 지원하는 모든 [마켓플레이스](/ko/glossary/marketplace/), 지갑, [스마트 컨트랙트](/ko/glossary/smart-contract/)는 해당 이름이 특수한 경우가 아니더라도 리스팅하고, 에스크로하거나, 담보로 활용할 수 있습니다.

이 표준화가 바로 유동성의 핵심입니다. 전통적인 도메인은 레지스트라나 도메인 마켓플레이스가 허용하는 곳에서만 거래됩니다. 도메인 NFT는 ERC-721이 통용되는 어디서든 거래할 수 있으며, 오늘날 그것은 대부분의 NFT 생태계를 의미합니다. 이것이 토큰화가 거래 방식을 바꾸는 구조적 이유이며, 더 자세한 내용은 [토큰화가 도메인 플리핑을 어떻게 바꾸는가](/ko/blog/how-tokenized-marketplaces-replace-escrow/)에서 다룹니다.

## 마켓플레이스에 리스팅하기: Seaport와 OpenSea

![마켓플레이스 차양 아래, 한쪽에 도메인 NFT 토큰을 올리고 다른 쪽에 코인 더미를 올린 저울 중앙에 체인 링크가 맞물려 있는 에디토리얼 일러스트](../../assets/selling-domains-as-nfts-01-atomic-swap.jpg)

NFT 판매의 주요 인프라는 [Seaport](https://docs.opensea.io/docs/seaport)와 [OpenSea](https://opensea.io)입니다. 이 둘이 서로 다른 레이어임을 이해하면 도움이 됩니다. Seaport는 프로토콜이고, OpenSea는 그 위에 구축된 하나의 스토어프런트입니다. OpenSea 공식 문서에 따르면 [Seaport는 블록체인에서 NFT를 안전하고 효율적으로 사고팔기 위한 마켓플레이스 프로토콜](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)이며, [Seaport는 OpenSea 웹사이트를 구동합니다](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20powers%20the%20OpenSea%20website). OpenSea의 모든 주문은 Seaport를 통해 처리됩니다.

판매자에게 중요한 개념은 Seaport의 양면 구조입니다. **오퍼(offer)**와 **컨시더레이션(consideration)**으로 구성됩니다. 오퍼는 내가 제공하는 것(도메인 NFT)이고, 컨시더레이션은 내가 요구하는 것(ETH나 스테이블코인 가격, 그리고 다른 당사자에게 배분될 수수료 및 로열티)입니다. 이 주문에 한 번 서명합니다. 구매자가 이를 이행하기 전까지는 아무것도 이동하지 않으며, 이행이 이루어지면 프로토콜은 양측을 단일한 원자적 단계로 정산합니다. 내 토큰과 상대방의 결제가 같은 트랜잭션 안에서 교환되거나, 아니면 둘 다 이루어지지 않습니다. 이 원자성이 바로 에스크로를 대체하는 [원자적 이전](/ko/glossary/atomic-transfer/) 속성입니다. 한쪽은 결제했지만 다른 쪽이 아직 이전하지 않은 구간이 존재하지 않습니다.

실제 리스팅은 대부분의 판매자가 한 번 하고 나면 잊어버리는 두 단계로 이루어집니다.

1. **승인(Approval).** 지갑에서 처음 리스팅할 때, 판매가 실행될 경우 마켓플레이스 컨트랙트가 해당 토큰을 대신 이동할 수 있도록 승인 서명을 합니다. 이 과정에서 가스비가 발생합니다. 이후 같은 컬렉션의 다른 토큰을 리스팅할 때는 일반적으로 가스비가 들지 않습니다.
2. **리스팅 주문.** 실제 주문(가격, 통화, 기간)에 서명합니다. 대부분의 마켓플레이스에서 이 서명은 **가스비가 없습니다**. 트랜잭션을 전송하는 것이 아니라 메시지에 서명하는 것이므로, 고정 가격 리스팅을 생성하거나 취소하는 데 일반적으로 비용이 들지 않으며, 누군가 구매할 때 비용이 발생합니다.

실질적인 결과로, 고정 가격 구매의 가스비는 보통 구매자가 부담합니다. OpenSea의 판매자 가이드는 이를 명확히 설명합니다. [고정 가격 상품을 구매할 때 가스비는 구매자가 냅니다](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item). 반면 [오퍼를 수락할 때 가스비는 판매자가 냅니다](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Sellers%20pay%20gas%20fees%20when%20accepting%20offers). 즉, 리스팅하고 기다리면 구매자가 가스비를 부담하지만, 입찰을 적극적으로 수락하면 판매자가 부담하게 됩니다. 네트워크가 혼잡할 때 이 비대칭성을 고려하여 판매 전략을 세워야 합니다.

## 구매자 제한 비공개 리스팅

![유리 진열장 안에 잠긴 도메인 NFT 메달리온을 소수의 군중이 바라보고 있으며, 오직 한 사람만 이를 열 수 있는 황금 열쇠를 들고 있는 에디토리얼 일러스트](../../assets/selling-domains-as-nfts-02-private-listing.jpg)

공개 리스팅은 누구에게나 팔아도 상관없는 일반적인 도메인에 적합합니다. 그러나 실제 도메인 거래 상당수는 먼저 오프마켓에서 협상이 이루어집니다. 이메일이나 통화로 가격을 합의한 뒤 *그 특정 구매자*와 신뢰할 수 있는 방식으로 정산하면 됩니다. 이런 도메인을 공개 리스팅하는 것은 실수입니다. 마켓플레이스를 주시하는 제3자가 합의된 가격에 구매자보다 먼저 낚아챌 수 있기 때문입니다.

해결책은 **구매자 제한(비공개) 리스팅**입니다. Seaport는 컨시더레이션에 필수 수령인을 지정할 수 있기 때문에 이를 기본적으로 지원합니다. OpenSea에서는 리스팅 과정 중에 설정할 수 있습니다. OpenSea 가이드에 따르면, [특정 구매자를 위해 상품을 예약하려면 Reserve를 클릭하고 해당 지갑 주소를 입력하면 됩니다](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=reserve%20the%20item%20for%20a%20specific%20buyer.%20To%20do%20so%2C%20click). 오직 해당 지갑만 주문을 이행할 수 있습니다. 다른 사람들은 리스팅을 볼 수 있지만 구매할 수 없습니다.

이것은 중개인을 통한 구매자 제한 정산의 온체인 버전이며, Namefi가 오퍼 기반 판매에서 활용하는 방식입니다. 합의된 금액은 사람과 협상하고, 비공개 리스팅으로 정산하여 합의된 구매자만이 원자적 스왑을 완료할 수 있도록 합니다. 오프마켓 거래의 프라이버시와 온체인 거래의 에스크로 없는 완결성을 동시에 얻을 수 있습니다. 단, 목적지 지갑 주소를 정확히 확인해야 합니다. 문자 하나가 틀리면 수천만 원짜리 도메인을 아무도 제어할 수 없는 주소로 예약하게 됩니다.

## 로열티: 판매 이후에도 지속되는가

일부 도메인 NFT에는 로열티가 설정되어 있어, 재판매 시마다 원래 발행자나 창작자에게 일정 비율이 지급됩니다. 이 표준은 [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981)로, 그 목적은 컨트랙트가 [NFT가 판매 또는 재판매될 때마다 NFT 창작자 또는 권리 보유자에게 지급될 로열티 금액을 알릴 수 있도록](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold) 하는 것입니다.

플리퍼라면 반드시 알아야 할 두 가지가 있습니다. 첫째, EIP-2981은 로열티를 *알릴* 뿐, *강제하지는* 않습니다. 로열티가 실제로 지급되는지 여부는 마켓플레이스 정책에 달려 있으며, 업계는 2022년부터 2023년 사이에 대부분의 로열티를 선택 사항으로 전환했습니다. 다음 거래에서 로열티가 이행된다고 가정하고 수익을 계산하지 마십시오. 이행되지 않을 수 있습니다. 둘째, 로열티는 플리퍼에게 양날의 검입니다. 판매 시 지급하는 로열티는 마진에서 실질적으로 차감되는 비용이며, 플랫폼 수수료도 여기에 더해집니다. OpenSea 가이드에 따르면 플랫폼은 [일반적으로 판매자에게 1% 수수료를 부과하며](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=OpenSea%20typically%20charges%20a%201%25%20fee%20to%20the%20seller), 창작자 수익도 적용될 경우 수익에서 공제됩니다. 확정하기 전에 마켓플레이스가 보여주는 수수료 내역을 꼼꼼히 확인하십시오. 그 숫자가 바로 실제 수령액이며, 플리핑이 가치 있었는지를 판단하는 기준이 됩니다.

## 가스비 및 사기 함정 피하기

![유리 돔 아래 방패로 보호된 지갑 주위에, 코인을 흘리는 주유기, 서명 승인 문서를 낚아채는 피싱 낚싯바늘, 주소가 뒤바뀐 클립보드 등 경고 깃발이 달린 위험 요소들이 둘러싼 에디토리얼 일러스트](../../assets/selling-domains-as-nfts-03-gas-scam.jpg)

온체인 유동성은 실재하지만, 새로운 취약점도 함께 옵니다. 두 가지 주요 위험은 가스비와 사기입니다.

**가스비.** 이더리움은 연산에 비용을 부과합니다. ethereum.org에 따르면 [가스는 이더리움 네트워크에서 특정 작업을 실행하는 데 필요한 연산량을 측정하는 단위](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)이며, ETH로 지불합니다. 네트워크가 혼잡한 날에는 수백만 원짜리 도메인의 승인 및 정산 가스비가 마진의 상당 부분을 차지할 수 있으며, 저가 도메인의 경우 판매 금액을 초과하기도 합니다. 두 가지 대응책이 있습니다. 네트워크가 조용할 때 승인을 완료하고, 수수료가 낮은 체인에서의 리스팅을 고려하는 것입니다. 이것이 이더리움 메인넷뿐만 아니라 Base에서의 토큰화 도메인이 소규모 도메인 플리퍼에게 중요한 이유 중 하나입니다.

**사기.** 온체인 세계에는 고유한 사기 수법들이 있으며, 도메인 NFT도 그 대상입니다.

- **지갑 주소 바꿔치기.** 악성 소프트웨어와 클립보드 하이재커는 붙여넣기한 주소를 조용히 바꿔치기합니다. 서명하기 전에 반드시 두 번째 수단으로 구매자 또는 수령인 주소의 처음과 끝 문자를 확인하십시오.
- **악성 '승인' 서명.** 가짜 마켓플레이스나 피싱 사이트는 컨트랙트에 토큰에 대한 광범위한 권한을 부여하는 승인 서명을 요청할 수 있습니다. 서명이 정확히 무엇을 승인하는지 이해하지 못한다면 서명하지 마십시오. 예상치 못한 승인 요청은 악의적인 것으로 간주하십시오.
- **위조 리스팅.** 사기꾼은 유사하게 생긴 토큰을 발행하여 실제 토큰화 도메인인 것처럼 리스팅합니다. 구매자는 발행사가 공개한 컨트랙트 주소와 대조하여 확인해야 하며, 판매자는 자신의 정상 리스팅이 구매자에게 노출되는 것인지 확인해야 합니다. 이것이 보관과 출처 관리가 중요한 이유입니다. 자세한 내용은 [지갑 분실 후 토큰화 도메인 복구하기](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)와 [멀티-시그 지갑이 실제로 보안을 향상시키는가](/ko/blog/do-multisig-wallets-actually-improve-security/)의 [멀티-시그](/ko/glossary/multi-sig/) 설정 사례를 참고하십시오.
- **가짜 '고객 지원'.** 어떤 정당한 기관도 먼저 DM을 보내 시드 구문이나 '검증' 서명을 요청하지 않습니다. 시드 구문은 절대 외부로 유출되어서는 안 됩니다. 이것은 예외 없는 원칙입니다.

핵심은 다음과 같습니다. 온체인 정산은 *거래* 과정의 상대방 리스크를 제거하는 동시에, *지갑* 운용에서의 운영 리스크를 새롭게 부과합니다. 에스크로 에이전트가 사라졌고, 주소 오입력을 잡아줄 사람도 사라졌습니다. 그 책임은 이제 자신에게 있습니다.

## 플리퍼에게 남겨진 것

도메인을 NFT로 판매한다는 것은 도메인을 진정으로 유동적인 자산으로 만드는 것을 의미합니다. 가스비 없이 리스팅하고, 원자적으로 정산하고, 특정 구매자를 위해 예약하고, 단일 레지스트라의 애프터마켓이 아닌 깊은 마켓플레이스 생태계 전체를 통해 거래할 수 있는 ERC-721 토큰이 됩니다. 전통적인 판매를 정의했던 에스크로 교착 상태가 대부분 해소됩니다. 그 대신 요구되는 것은 온체인 리터러시입니다. 무엇에 서명하는지, 가스비가 얼마나 드는지, 어떤 거래 상대방이 실제인지 파악하는 능력이 필요합니다.

토큰화 도메인이 거래 경제를 어떻게 바꾸는지에 대한 더 큰 그림은 [도메인 플리핑](/ko/blog/domain-flipping/) 허브에서 시작하는 것을 권장하며, [도메인을 토큰화해야 하는 이유](/ko/blog/why-tokenize-domains/)는 처음부터 온체인 레이어를 추가해야 하는 근거를 설명합니다. 실제 브라우저로 접속되는 도메인으로 처음부터 끝까지 판매를 시험해 보고 싶다면, [Namefi](https://namefi.io)는 바로 이를 위해 만들어졌습니다. DNS가 소유권 이전 과정에서도 계속 작동하면서 온체인으로 리스팅하고 정산할 수 있는 토큰화 `.com`을 제공합니다.

## 친절한 면책 고지 (꼭 읽어 주세요!)

> 저희는 변호사, 회계사, 재무 어드바이저, 또는 의사가 아닙니다. **이 글의 어떤 내용도 법률, 금융, 세무, 회계, 의료 또는 기타 전문적인 조언이 아닙니다.** 이 포스팅은 저희 스스로 공부하고 고객분들께 편의를 제공하기 위해 작성합니다. 여기 담긴 정보는 오래된 것일 수도 있고, 특정 지역에만 해당하거나, 단순히 잘못된 내용일 수도 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에는 **반드시 전문가와 상담하십시오 (진심으로요!)**. 그것이 여의치 않다면 친구에게 물어보거나, 트위터나 레딧, AI 또는 점쟁이에게 물어보십시오. 한마디로: **DOYR - Do Your Own Research**, 스스로 조사하세요. 함께 배우고 즐겨 봅시다.

## 출처 및 추가 자료

- OpenSea Docs — [Seaport (마켓플레이스 프로토콜; OpenSea 구동; 오퍼/컨시더레이션 모델)](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea — [NFT 판매 방법 (특정 구매자 예약; 가스비 부담자; 판매자 1% 수수료)](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)
- Wikipedia — [ERC-721 (이더리움의 대체 불가능한 토큰 표준)](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)
- Ethereum Improvement Proposals — [EIP-2981 (NFT 로열티 표준)](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)
- ENS Docs — [.eth 등록 가격 (글자 수에 따라 연간 $5 / $160 / $640)](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ethereum.org — [가스 및 수수료 (가스 정의)](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)
