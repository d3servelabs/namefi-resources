---
title: "ENS 및 토큰화 도메인 감정: 온체인 비교 거래 사례 읽기"
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'analysis']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 40
format: analysis
description: "온체인 비교 거래 사례, 플로어-프리미엄 논리, ENS 클럽 요소를 활용해 ENS 및 토큰화 도메인을 감정하는 방법 — 그리고 DNS와 어떻게 다른지 설명합니다."
ogImage: ../../assets/appraising-onchain-domains-og.jpg
keywords: ['ENS 도메인 감정', 'ENS 도메인 가치 평가', '토큰화 도메인 감정', '온체인 비교 거래 사례', '도메인 비교 거래', 'NameBio 비교 사례', 'ENS 플로어 가격', 'ENS 999 클럽', 'ENS 10k 클럽', 'ENS 이름 가치 평가 방법', '토큰화 도메인 가치', 'Web3 도메인 감정', 'ERC-721 도메인 가치', '온체인 거래 내역', '도메인 플로어 대 프리미엄']
relatedArticles:
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/how-to-read-comparable-domain-sales/
  - /ko/blog/domain-appraisal-tools-compared/
  - /ko/blog/domain-flipping/
  - /ko/blog/onchain-domain-marketplaces-compared/
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
  - /ko/glossary/registry/
---

감정은 플리핑으로 수익을 낼 수 있는지를 결정하는 핵심 기술입니다. 소싱은 어떤 도메인이 매물로 나와 있는지 알려주고, 판매는 도메인을 수익으로 전환시키지만, 그 사이에 있는 숫자 — 도메인이 실제로 얼마나 가치 있는가 — 에 마진이 달려 있습니다. 이는 `.com`에서도 마찬가지이고 온체인에서도 마찬가지입니다. 다만 온체인 세계는 [DNS](/ko/glossary/dns/) 애프터마켓이 결코 제공할 수 없었던 것을 제공합니다. 바로 거의 모든 거래의 공개적이고 타임스탬프가 찍힌 기록입니다. 이 글은 더 넓은 [도메인 플리핑](/ko/blog/domain-flipping/) 플레이북 중 감정 챕터로, [온체인 도메인 플리핑](/ko/blog/onchain-domain-flipping/)에서 거래하는 두 가지 자산 — [ENS](/ko/glossary/ens/) 이름과 토큰화된 ICANN 도메인 — 에 초점을 맞춥니다.

방법론은 전문 감정사와 부동산 중개인이 사용하는 것과 동일합니다. 바로 비교 사례(comps)입니다. Wikipedia의 정의에 따르면, [비교 사례(comparables 또는 comps)는 가치를 파악하려는 대상 부동산과 특성이 유사한 부동산을 지칭하는 부동산 감정 용어](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)입니다. 도메인에는 시세가 없기 때문에, 유사한 도메인이 최근에 얼마에 팔렸는지를 기반으로 추론해야 합니다. 온체인의 특이점은 "최근에 얼마에 팔렸다"는 정보가 소문이 아니라 검증 가능한 사실이 된다는 점입니다.

## 비교 사례의 출처

![감정사 캐릭터가 돋보기를 들고 블록체인 큐브에서 흘러나오는 최근 비교 거래 가격표가 담긴 투명한 온체인 원장을 읽는 편집 일러스트](../../assets/appraising-onchain-domains-01-onchain-comps.jpg)

전통적인 도메인의 경우, 표준적인 비교 사례 데이터베이스는 [NameBio](https://namebio.com/)입니다. 키워드, 확장자, 가격, 날짜별로 필터링이 가능한 과거 [도메인](/ko/glossary/domain-trading/) 거래 내역의 검색 가능한 아카이브입니다. DNS 애프터마켓에서 공개 시세 피드에 가장 가까운 서비스입니다. 감정하려는 도메인과 유사한 이름을 검색하고, 실제 성사된 거래 가격을 확인한 뒤, 직감이 아닌 증거를 기반으로 합리적인 가격 범위를 설정합니다. 헤드라인 수치는 추정치로 취급해야 합니다 — 보고된 거래는 보고할 가치가 있는 것들에 편중되어 있고, 성사된 거래 데이터베이스로는 끝내 팔리지 않은 도메인들에 대해서는 알 수 없습니다. 그러나 출발점으로서는 모든 자동화 감정 도구보다 낫습니다. 그래서 [도메인 가치를 평가하는 방법](/ko/blog/how-to-value-a-domain-name/) 가이드도 알고리즘보다 [비교 거래 사례](/ko/glossary/comparable-sales/)에 의존하는 것입니다.

온체인에서는 비교 사례 데이터가 더욱 뛰어나며, 무료입니다. ENS 이름이나 토큰화된 도메인은 [ERC-721](/ko/glossary/erc-721/) 표준 하의 [NFT](/ko/glossary/nft/)이기 때문입니다. 이더리움 사양에서는 이를 [스마트 컨트랙트 내 NFT를 위한 표준 API](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)로 정의합니다. 모든 전송과 판매가 공개 원장에 기록됩니다. 마켓플레이스는 이 정보를 직접 표면화합니다. ENS 이름은 [대체 불가능한 토큰(NFT)이며 OpenSea 같은 NFT 마켓플레이스에서 판매될 수 있고](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=ENS%20names%20are%20also%20non%2Dfungible%20tokens), 이러한 마켓플레이스는 누구의 자체 보고 없이도 컬렉션의 전체 판매 내역, 현재 매물, 플로어 가격을 보여줍니다. 감정의 원재료 — 유사한 도메인 최근 10건이 실제로 얼마에 거래되었는가 — 가 온체인에 있으며, 감사 가능하고, 유료 구독이 필요 없습니다.

## 플로어 대 프리미엄

![평평한 플로어 기준선 위에 동일한 소형 도메인 타일이 많이 있고, 몇 개의 두드러진 프리미엄 타일이 라인 위로 높이 솟아오른 가격 차트 편집 일러스트](../../assets/appraising-onchain-domains-02-floor-vs-premium.jpg)

온체인 감정에서 가장 유용한 프레임은 플로어 대 프리미엄이며, 이 자산들이 실제로 거래되는 방식에 깔끔하게 대응됩니다.

**플로어(floor)**는 특정 카테고리에서 구매 가능한 가장 저렴한 도메인, 즉 [마켓플레이스](/ko/glossary/marketplace/) 컬렉션에서 가장 낮은 호가입니다. 유사한 도메인들의 클래스(예: 5글자 `.eth` 이름이나 임의의 네 자리 숫자)에서 플로어는 기준선 역할을 합니다. 지금 이 순간 해당 집합의 일반적이고 차별화되지 않은 구성원이 대략 얼마나 가치 있는지를 나타냅니다. 플로어는 시장 상황과 관심도에 따라 움직이므로, 인용하는 플로어 가격은 상수가 아닌 특정 시점의 스냅샷입니다.

**프리미엄(premium)**은 특정 도메인이 그 플로어를 초과하여 받는 모든 추가 가치입니다. 더 짧거나, 실제 사전 단어이거나, 잘 알려진 브랜드이거나, 낮은 숫자이기 때문에 발생합니다. 감정사의 작업 대부분이 바로 이 프리미엄을 정당화하는 것입니다. 플로어는 화면에서 읽을 수 있지만, 플로어와 `crypto.eth`가 받을 수 있는 가격 사이의 간격은 비교 사례를 통해 뒷받침해야 하는 판단입니다. 원칙은 꿈의 숫자에서 내려오는 방식이 아니라, 먼저 플로어에 닻을 내리고, 비교 거래 사례를 통해 프리미엄을 위쪽으로 논증하는 것입니다.

ENS는 자체 등록 가격이 길이별로 단계적으로 책정되어 있기 때문에 이를 구체적으로 보여줍니다. ENS 문서에 따르면, [5글자 이상의 .eth는 연간 5 USD](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)가 소요되는 반면, 4자 및 3자 이름은 설계상 등록 비용이 더 비쌉니다. 이 프로토콜 수준의 희소성 신호 — 짧은 이름일수록 보유 비용도 더 비쌈 — 는 단 하나의 거래 내역도 보기 전에 이미 프리미엄이 어디에 집중되는지 알려줍니다.

## ENS 희소성과 클럽 요소

![3자리 등급, 4자리 등급, 회문(팰린드롬), 짧은 이름 등 순위가 매겨진 배지 선반에 ENS 스타일의 도메인 토큰이 희소성 등급별로 분류되는 편집 일러스트](../../assets/appraising-onchain-domains-03-club-factors.jpg)

ENS에는 어떤 DNS 확장자도 공유하지 않는 독특한 특징이 있습니다. 바로 체계화된 희소성 등급입니다. "클럽"은 순전히 형태에 의해 정의된 이름의 집합이며, 클럽 멤버십은 가치의 강력하고 명확한 동인입니다.

가장 잘 알려진 것은 숫자 클럽입니다. 999 클럽은 `000.eth`부터 `999.eth`까지의 1,000개 세 자리 이름이며, 10k 클럽은 `0000.eth`부터 `9999.eth`까지의 10,000개 네 자리 이름입니다. 각각의 공급이 고정되어 있고 매우 적기 때문에, 가시적인 플로어와 얇은 프리미엄 꼬리를 가진 수집품 시리즈처럼 거래됩니다. 숫자는 또한 언어 중립적이고 오타가 나기 어렵습니다. 이것이 숫자가 독자적인 투기 시장이 된 이유 중 하나입니다. 동일한 논리가 짧은 영문자 조합, 회문(팰린드롬), 이모지 이름에도 적용됩니다. 패턴이 희귀하고 읽기 쉬울수록 플로어 대비 프리미엄이 두터워집니다.

최고가 거래는 프리미엄 꼬리가 얼마나 멀리 뻗어 있는지를 보여줍니다. 기록상 가장 큰 ENS 거래는 `paradigm.eth`로, The Block에 따르면 [2021년 10월에 420 ETH(당시 약 150만 달러)에 구매](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=purchased%20in%20October%202021%20for%20420%20ETH)되었으며, `000.eth` — 999 클럽의 선두 멤버 — 는 [300 ETH(315,000달러)에 구매](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)되어 [이더와 달러 양면에서 두 번째로 큰 거래](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=making%20it%20the%20second%2Dlargest%20sale)가 되었습니다. 이들은 이상치이며 ETH로 표시되므로, 달러 금액은 토큰 가격에 따라 크게 달라집니다. 그러나 이 수치들은 곡선의 최상단을 고정합니다. 클럽 이름을 감정할 때, 플로어와 천장이 모두 온체인에서 관찰 가능한 분포 어디에 위치하는지를 파악하는 작업입니다. 이러한 이름들이 다른 온체인 자산과 비교해 어디에 위치하는지는 [프리미엄 Web3 TLD](/ko/blog/premium-web3-tlds/)와 더 넓은 [ENS vs Unstoppable vs 토큰화 DNS](/ko/blog/ens-vs-unstoppable-vs-tokenized-dns/) 비교를 참조하세요.

## 토큰화된 ICANN 도메인 감정은 DNS 감정이다

반드시 구분해야 할 선이 있습니다. 토큰화된 ICANN 도메인은 다른 레이블이 붙은 ENS 이름이 아닙니다. 소유권이 토큰으로 미러링된 실제 `.com`, `.xyz`, 또는 `.io` 도메인으로, 기본 이름은 모든 곳에서 계속 확인됩니다. [토큰화된 도메인이 무엇인지](/ko/blog/what-are-tokenized-domains/)에 대한 설명에서 말했듯이, 이것들은 온체인 레이어를 *함께* 가지는 실제 DNS 도메인이지, 병렬 네임스페이스가 아닙니다. 감정에 대한 실용적인 결과는 다음과 같습니다. 토큰화된 `.com`은 어떤 `.com`이든 가치를 평가하는 방식으로 — NameBio의 DNS 비교 사례와 길이, 키워드 수요, 확장자 강도의 일반적인 기본 지표를 사용하여 — 가치를 평가합니다. 구매자는 지갑 핸들이 아닌 전 세계적으로 확인 가능한 이름에 돈을 지불하기 때문입니다.

따라서 비교 사례 집합은 명확하게 나뉩니다. `acme.eth`를 감정하려면 ENS 거래와 클럽 플로어를 가져옵니다. 그 가치가 크립토 네이티브 정체성이기 때문입니다. 토큰화된 `acme.com`을 감정하려면 `.com` 비교 사례를 가져옵니다. 그 가치가 우연히 온체인에서 결제되는 실제 웹사이트 주소이기 때문입니다. 이 둘을 혼동하는 것이 이 분야에서 가장 흔한 감정 오류입니다. 토큰화된 `.com`과 동일한 루트 단어의 `.eth`는 서로 다른 구매자와 매우 다른 비교 사례를 가진 서로 다른 제품입니다. 이 구분의 거래 측면은 [ENS vs DNS 도메인 플리핑](/ko/blog/ens-vs-dns-domain-flipping/)에서, 토큰화가 거래를 어떻게 바꾸는지는 [토큰화가 도메인 플리핑을 어떻게 바꾸는가](/ko/blog/how-tokenization-changes-domain-flipping/)에서 다룹니다.

## 온체인 감정과 DNS 감정의 차이

입력 요소들은 비슷하지만, 도메인이 토큰이 되면 네 가지가 실질적으로 달라집니다.

**비교 데이터는 보고가 아닌 검증 가능합니다.** NameBio 항목은 누군가 공개하기로 선택한 거래이지만, 온체인 거래는 누구나 읽을 수 있는 [스마트 컨트랙트](/ko/glossary/smart-contract/) 이벤트입니다. 이는 신뢰의 층 하나를 제거하며, 미보고 거래 대신 워시 트레이딩이 새롭게 주의해야 할 대상이 됩니다.

**실시간 플로어가 존재합니다.** DNS 도메인에는 플로어 가격이 없습니다. 각각이 별도의 협상입니다. 온체인 도메인 컬렉션에는 플로어가 있으며, 움직이는 플로어는 `.com` 평가와는 달리 시간 단위로 감정치를 변화시킵니다.

**유동성이 구조적입니다.** 토큰화된 도메인은 구매자가 결제할 때 단일 [원자적 전송](/ko/glossary/atomic-transfer/)으로 결제됩니다. 에스크로 에이전트도, 전송 기간도 없습니다. 이 덕분에 온체인 [도메인 유동성](/ko/glossary/domain-liquidity/)이 높아지고 비교 사례가 더 최신 상태로 유지됩니다. 이것이 중간자 없이 도메인을 [NFT로 판매](/ko/blog/selling-domains-as-nfts/)할 수 있게 하는 동일한 메커니즘입니다. [토큰화된 마켓플레이스가 에스크로를 대체하는 방법](/ko/blog/how-tokenized-marketplaces-replace-escrow/)에서 자세히 다룹니다.

**크립토 표시 가격은 두 번째 변수를 추가합니다.** 대부분의 온체인 비교 사례는 ETH로 표시됩니다. "5 ETH 가치"의 도메인은 토큰 가격 변동만으로도 수천 달러가 오르내릴 수 있습니다. 따라서 ETH로 감정하는지 법정화폐로 감정하는지 항상 명기해야 합니다. 두 가지는 서로 다른 이야기를 하며, ETH 플로어를 안정적인 달러 금액으로 취급하면 감정이 잘못됩니다.

핵심 원칙은 다음과 같습니다. 온체인 감정은 더 나은 데이터와 더 빠른 시장을 제공하지만, 핵심 기술은 변하지 않습니다. 플로어에 닻을 내리고, 실제 비교 거래 사례로 프리미엄을 정당화하고, 올바른 자산에 맞는 올바른 비교 사례 집합으로 가격을 매기세요. [Namefi](https://namefi.io)와 같은 플랫폼의 토큰화된 `.com`은 실제 도메인으로서 감정되고, `.eth`는 온체인 수집품으로서 감정됩니다. 비교 사례 집합을 올바르게 설정하면 나머지는 산수입니다.

## 주의 사항 (꼭 읽어 주세요!)

> 저희는 변호사, 회계사, 재무 어드바이저, 의사가 아니며, **이 글의 어떤 내용도 법률, 금융, 세무, 회계, 의료 또는 기타 전문적인 조언이 아닙니다.** 이 글은 자체 학습 목적과 고객 편의를 위해 작성되었습니다. 내용이 오래되었거나, 특정 지역에만 해당되거나, 단순히 틀렸을 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에는 **반드시 전문가와 상담하세요(진심으로!)**. 그게 여의치 않다면 친구에게 물어보거나, 트위터에 물어보거나, Reddit에 물어보거나, AI에게 물어보거나, 점성술사에게 물어보세요. 한마디로 **DOYR — Do Your Own Research(스스로 조사하세요)**. 함께 배우고 즐겁게 임합시다.

## 참고 자료 및 추가 읽기

- Wikipedia — [비교 사례 (유사한 최근 거래에 의한 감정 방법)](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)
- NameBio — [과거 도메인 이름 거래의 검색 가능한 데이터베이스](https://namebio.com/)
- Ethereum Improvement Proposals — [ERC-721: 대체 불가능한 토큰 표준 (스마트 컨트랙트 내 NFT를 위한 표준 API)](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)
- ENS 문서 — [이름 길이별 .eth 레지스트라 가격 책정 (5글자 이상 = 연간 $5)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- The Block — [000.eth가 300 ETH(315,000달러)에 판매됨; paradigm.eth가 420 ETH(약 150만 달러, 2021년 10월)에 판매됨; OpenSea의 NFT로서의 ENS 이름](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
