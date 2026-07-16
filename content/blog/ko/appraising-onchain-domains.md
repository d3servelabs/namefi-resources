---
title: 'ENS 및 토큰화 도메인 감정: 온체인 비교 거래 읽기'
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 40
format: analysis
description: '온체인 비교 거래, 하한가와 프리미엄 분석, ENS 클럽 요인을 활용해 ENS 및 토큰화 도메인을 감정하는 방법과 DNS 도메인 감정과의 차이를 설명합니다.'
ogImage: ../../assets/appraising-onchain-domains-og.jpg
keywords: ['ENS 도메인 감정', 'ENS 도메인 가치 평가', '토큰화 도메인 감정', '온체인 비교 거래', '도메인 비교 판매 사례', 'NameBio 비교 사례', 'ENS 하한가', 'ENS 999 클럽', 'ENS 10k 클럽', 'ENS 이름 가치 평가 방법', '토큰화 도메인 가치', '웹3 도메인 감정', 'ERC-721 도메인 가치', '온체인 판매 이력', '도메인 하한가와 프리미엄']
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

감정은 플리핑이 수익으로 이어질지를 결정하는 기술입니다. 소싱은 무엇이 매물로 나왔는지를 알려주고 판매는 도메인을 현금으로 바꾸지만, 그 사이에 있는 숫자, 즉 도메인의 실제 가치를 판단하는 데서 마진이 생깁니다. 이는 `.com`에도, 온체인 자산에도 똑같이 적용됩니다. 다만 온체인 세계는 [DNS](/ko/glossary/dns/) 애프터마켓에서 대개 얻기 어려운 정보를 제공할 수 있습니다. 공개된 타임스탬프 기반 소유권 이력과, 마켓플레이스 프로토콜이 대가를 기록하는 경우 감사 가능한 거래 증거입니다. 그렇다고 완전한 거래 기록이 되는 것은 아닙니다. 일부 이전은 판매가 아니며, 일부 대금이나 거래 조건은 여전히 오프체인에 남습니다. 이 글은 더 넓은 [도메인 플리핑](/ko/blog/domain-flipping/) 플레이북의 감정 편으로, [온체인 도메인 플리핑](/ko/blog/onchain-domain-flipping/)에서 거래하는 두 자산인 [ENS](/ko/glossary/ens/) 이름과 토큰화된 ICANN 도메인에 초점을 맞춥니다.

방법론은 전문 감정평가사와 부동산 중개인이 쓰는 것과 같습니다. 바로 비교 거래 사례(comps)입니다. Wikipedia의 정의에 따르면 [비교 대상, 즉 comps는 가치를 평가하려는 대상 부동산과 유사한 특성을 가진 부동산을 뜻하는 부동산 감정 용어](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)입니다. 도메인에는 시세표가 없으므로 최근에 판매된 유사 이름의 가격을 바탕으로 판단해야 합니다. 온체인의 차이는 주장된 판매를 단순히 보고대로 받아들이지 않고, 프로토콜별 마켓플레이스 및 결제 이벤트와 대조해 확인할 수 있다는 점입니다. 단, 해당 이벤트가 대가를 공개하는 경우에만 가능합니다.

## 비교 거래 자료는 어디에서 얻는가

![돋보기를 든 감정평가사가 블록체인 큐브에서 흘러나오는 최근 비교 거래 가격표와 투명한 온체인 원장을 살펴보는 편집 일러스트](../../assets/appraising-onchain-domains-01-onchain-comps.jpg)

전통적인 도메인에서 대표적인 비교 거래 데이터베이스는 [NameBio](https://namebio.com/)입니다. 키워드, 확장자, 가격, 날짜로 필터링할 수 있는 과거 [도메인 거래](/ko/glossary/domain-trading/)의 검색 가능한 아카이브입니다. DNS 애프터마켓에서 공개 가격 피드에 가장 가까운 자료입니다. 감정하려는 이름과 비슷한 이름을 검색하고 실제 체결 가격을 살펴본 다음, 직감이 아니라 증거를 바탕으로 타당한 가격 범위를 정할 수 있습니다. 다만 눈에 띄는 숫자는 추정치로 취급해야 합니다. 보고된 판매는 공개할 가치가 있는 거래 쪽으로 편향되며, 체결된 거래 데이터베이스만으로는 끝내 팔리지 않은 이름을 알 수 없기 때문입니다. 그래도 출발점으로는 어떤 자동 감정 도구보다 낫습니다. 그래서 [도메인 이름의 가치를 평가하는 방법](/ko/blog/how-to-value-a-domain-name/) 가이드에서도 알고리즘보다 [비교 판매 사례](/ko/glossary/comparable-sales/)를 더 중시합니다.

온체인에서는 비교 거래 증거가 더 풍부할 수 있고 누구나 무료로 확인할 수 있습니다. ENS 이름이나 토큰화 도메인은 [NFT](/ko/glossary/nft/)이며 [ERC-721](/ko/glossary/erc-721/) 표준을 따릅니다. 이더리움 사양은 ERC-721을 [스마트 컨트랙트 내 NFT를 위한 표준 API](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)로 설명합니다. [`Transfer` 이벤트는 발신자, 수신자, 토큰 ID만으로 소유권 변경을 기록](https://eips.ethereum.org/EIPS/eip-721#specification)합니다. 이 이벤트는 해당 이전이 판매였는지 표시하지 않으며 가격도 기록하지 않습니다. 판매 내역을 재구성하는 방식은 마켓플레이스마다 다릅니다. 예를 들어 Seaport의 [`OrderFulfilled` 이벤트는 offer 배열과 consideration 배열을 따로 기록](https://docs.opensea.io/docs/seaport-events-and-errors#orderfulfilled)합니다. 지원되는 마켓플레이스는 이런 기록을 바탕으로 판매 이력, 리스팅, 하한가를 구성할 수 있지만, 지갑 간 이전, 오프체인 결제, 복잡한 번들은 별도의 검증이 필요하며 명확한 비교 사례가 나오지 않을 수도 있습니다. 감정상 장점은 감사 추적이 더 강해진다는 것이지, 판매 기록이 자동으로 완전해진다는 뜻이 아닙니다.

## 하한가와 프리미엄

![동일한 작은 이름 타일이 평평한 하한선을 이루고 그 위로 소수의 프리미엄 타일이 높이 솟은 가격 차트 편집 일러스트](../../assets/appraising-onchain-domains-02-floor-vs-premium.jpg)

온체인 감정에서 가장 유용한 관점은 하한가와 프리미엄을 나누는 것입니다. 실제 거래 방식에도 자연스럽게 들어맞습니다.

**하한가**는 알아볼 수 있는 특정 범주에서 현재 매물로 나온 이름 중 가장 저렴한 가격, 즉 [마켓플레이스](/ko/glossary/marketplace/) 컬렉션의 최저 호가입니다. 서로 비슷한 이름의 집합, 예를 들어 다섯 글자 `.eth` 이름이나 임의의 네 자리 숫자 이름에서 하한가는 기준점이 됩니다. 특별한 차별점이 없는 일반적인 구성원의 현재 가치가 대략 어느 정도인지를 보여줍니다. 하한가는 시장과 유행에 따라 움직이므로, 인용하는 모든 하한가는 상수가 아니라 특정 시점의 스냅샷입니다.

**프리미엄**은 특정 이름이 하한가를 넘어 추가로 인정받는 모든 가치입니다. 더 짧거나, 실제 사전 단어이거나, 널리 알려진 브랜드이거나, 낮은 숫자라는 이유로 붙습니다. 감정평가사의 일은 대부분 이 프리미엄을 정당화하는 데 있습니다. 하한가는 화면에서 바로 읽을 수 있지만, 하한가와 `crypto.eth`가 받을 가격 사이의 차이는 비교 거래로 뒷받침해야 하는 판단입니다. 원칙은 먼저 하한가에 기준을 두고 비교 거래를 근거로 프리미엄을 올려 잡는 것입니다. 희망 가격부터 정한 뒤 거꾸로 낮추는 방식은 피해야 합니다.

ENS의 등록 가격 자체가 길이에 따라 단계적으로 달라지므로 이 원칙을 구체적으로 보여줍니다. ENS 문서에 따르면 [5글자 이상의 .eth는 연간 5 USD](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)이며, 네 글자와 세 글자 이름은 설계상 등록 비용이 더 높습니다. 짧은 이름일수록 보유 비용부터 높다는 프로토콜 차원의 희소성 신호는 판매 한 건을 살펴보기 전에도 프리미엄이 어디에 집중되는지를 알려줍니다.

## ENS 희소성과 클럽 요인

![세 자리 숫자, 네 자리 숫자, 회문, 짧은 이름으로 구성된 ENS 스타일 이름 토큰이 등급 배지 선반의 희소성 단계별로 분류되는 편집 일러스트](../../assets/appraising-onchain-domains-03-club-factors.jpg)

ENS에는 어떤 DNS 확장자에도 없는 특징이 있습니다. 체계화된 희소성 등급입니다. 이른바 "클럽"은 오직 이름의 형태로 정의되는 집합이며, 클럽 소속 여부는 이해하기 쉽고 강력한 가치 요인입니다.

가장 잘 알려진 것은 숫자 클럽입니다. 999 Club은 `000.eth`부터 `999.eth`까지 1,000개의 세 자리 숫자 이름이고, 10k Club은 `0000.eth`부터 `9999.eth`까지 10,000개의 네 자리 숫자 이름입니다. 각 집합의 공급량이 고정되어 있고 매우 적기 때문에, 하한가는 뚜렷하고 프리미엄이 붙는 상위 구간은 얇은 수집품 시리즈처럼 거래됩니다. 숫자는 언어에 구애받지 않고 오타를 내기도 어렵습니다. 숫자 이름이 독자적인 투기 시장으로 성장한 이유 중 하나입니다. 같은 논리는 짧은 문자 조합, 회문, 이모지 이름에도 적용됩니다. 패턴이 희소하고 알아보기 쉬울수록 하한가 위에 붙는 프리미엄이 커집니다.

최고가 거래는 프리미엄 분포의 상단이 얼마나 멀리 뻗는지를 보여줍니다. ENS 역대 최고 판매는 `paradigm.eth`입니다. The Block에 따르면 [2021년 10월 420 ETH, 당시 약 150만 달러에 구매](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=purchased%20in%20October%202021%20for%20420%20ETH)되었습니다. 999 Club의 첫 번째 이름인 `000.eth`는 [300 ETH, 315,000달러에 구매](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)되어, [이더와 달러 기준 모두 두 번째로 큰 판매 기록](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=making%20it%20the%20second%2Dlargest%20sale)을 세웠습니다. 이들은 이상치이고 ETH로 가격이 책정되므로 달러 환산액은 토큰 가격에 따라 달라집니다. 그래도 가격 곡선의 상단을 정하는 기준점이 됩니다. 클럽 이름을 감정한다는 것은 하한과 상한을 모두 온체인에서 관찰할 수 있는 분포 위에 그 이름의 위치를 잡는 일입니다. 이런 이름이 다른 온체인 자산과 비교해 어디에 있는지는 [프리미엄 Web3 TLD](/ko/blog/premium-web3-tlds/)와 더 폭넓은 [ENS, Unstoppable, 토큰화 DNS 비교](/ko/blog/ens-vs-unstoppable-vs-tokenized-dns/)를 참고하십시오.

## 토큰화된 ICANN 도메인 감정은 DNS 도메인 감정이다

이 구분은 흐려서는 안 됩니다. 토큰화된 ICANN 도메인은 라벨만 다른 ENS 이름이 아닙니다. 실제 `.com`, `.xyz`, `.io`의 소유권을 토큰으로 반영하면서, 기반 도메인은 어디에서나 계속 정상적으로 해석됩니다. [토큰화 도메인이란 무엇인가](/ko/blog/what-are-tokenized-domains/)에서 설명하듯, 이들은 병렬 네임스페이스가 아니라 온체인 계층을 *추가로* 가진 실제 DNS 도메인입니다. 감정에서의 실질적 결과는 명확합니다. 토큰화된 `.com`은 다른 `.com`과 같은 방식으로 평가해야 합니다. NameBio의 DNS 비교 거래와 길이, 키워드 수요, 확장자 경쟁력 같은 통상적인 기본 요소를 사용합니다. 구매자는 지갑 핸들이 아니라 어디서나 해석되는 이름에 돈을 내기 때문입니다.

따라서 비교 거래 집합은 명확하게 나뉩니다. `acme.eth`를 감정할 때는 가치의 핵심이 암호화폐 네이티브 신원에 있으므로 ENS 판매 사례와 클럽 하한가를 사용합니다. 토큰화된 `acme.com`을 감정할 때는 거래가 온체인에서 정산될 뿐 실제 웹사이트 주소라는 점이 가치의 핵심이므로 `.com` 비교 거래를 사용합니다. 둘을 혼동하는 것이 이 분야에서 가장 흔한 감정 오류입니다. 같은 루트 단어를 가진 토큰화된 `.com`과 `.eth`는 구매자와 비교 거래가 크게 다른 별개의 상품입니다. 거래 관점에서의 차이는 [ENS와 DNS 도메인 플리핑 비교](/ko/blog/ens-vs-dns-domain-flipping/)에서, 토큰화가 거래 방식을 바꾸는 원리는 [토큰화가 도메인 플리핑을 바꾸는 방법](/ko/blog/how-tokenization-changes-domain-flipping/)에서 다룹니다.

## 온체인 감정은 DNS 감정과 어떻게 다른가

입력 요소에는 공통점이 많지만, 이름이 토큰이 되면 네 가지가 실제로 달라집니다.

**비교 거래 증거를 가정하지 않고 감사할 수 있습니다.** NameBio 항목은 누군가 공개하기로 선택한 판매 기록입니다. 반면 온체인 소유권 변경은 누구나 읽을 수 있는 [스마트 컨트랙트](/ko/glossary/smart-contract/) 이벤트이며, 마켓플레이스 프로토콜이 대가를 기록했다면 판매를 확인할 수 있습니다. ERC-721 `Transfer` 이벤트만으로는 충분하지 않습니다. 비교 거래로 인정하려면 판매 프로토콜, 결제 자산, 번들 항목, 오프체인 거래 단계, 자전거래 가능성을 여전히 확인해야 합니다.

**실시간 하한가가 존재합니다.** DNS 이름에는 하한가가 없고 각각 별도로 협상합니다. 온체인 이름 컬렉션에는 하한가가 있으며, 계속 움직이는 하한가는 `.com` 가치 평가에서는 볼 수 없는 방식으로 시간마다 감정가를 바꿉니다.

**결제·정산 마찰을 줄이는 구조는 있지만, 시장 유동성이 자동으로 생기지는 않습니다.** 마켓플레이스 컨트랙트는 대금과 토큰을 [원자적 이전](/ko/glossary/atomic-transfer/) 방식으로 교환할 수 있습니다. 모든 거래 단계가 함께 완결되거나 하나도 이행되지 않는 구조입니다. [BIS의 원자적 결제 개요](https://www.bis.org/publ/othp99.htm)에서 설명하듯, 이는 중간 인계 단계를 줄이고 정산 시간, 비용, 위험을 낮출 가능성이 있습니다. 하지만 정산 구조가 개선된다고 해서 온체인 [도메인 유동성](/ko/glossary/domain-liquidity/)이 저절로 높아지는 것은 아닙니다. 원자적 결제는 구매 수요, 판매 공급, 깊이 있는 양방향 시장을 만들어내지 않습니다. 원자적 실행은 [NFT로 도메인을 판매](/ko/blog/selling-domains-as-nfts/)할 때 에스크로 업체나 이전 대기 기간을 없앨 수 있습니다. [뉴욕 연방준비은행은 시장 유동성을 다차원적인 개념으로 설명](https://www.newyorkfed.org/newsevents/speeches/2015/dud150930.html)하며 매수·매도 스프레드, 시장 깊이, 가격 충격 같은 요소로 측정합니다. 이러한 요소는 정산 구조와 별도로 평가해야 합니다. 전체 정산 절차는 [토큰화된 마켓플레이스가 에스크로를 대체하는 방법](/ko/blog/how-tokenized-marketplaces-replace-escrow/)에서 설명합니다.

**암호화폐 표시 가격에는 두 번째 변수가 추가됩니다.** 대부분의 온체인 비교 거래는 ETH로 표시됩니다. "5 ETH 가치"인 이름은 토큰 가격 변동만으로도 수천 달러씩 움직일 수 있으므로, 감정 단위가 ETH인지 법정화폐인지 항상 명시해야 합니다. 두 단위는 서로 다른 이야기를 보여주며, ETH 하한가를 안정적인 달러 금액으로 취급하면 감정이 잘못됩니다.

핵심은 다음과 같습니다. 온체인 감정은 감사하기 쉬운 소유권 이력과 더 빠른 정산을 제공할 수 있고, 마켓플레이스가 대가를 기록하는 경우 더 풍부한 비교 거래 증거도 제공합니다. 그러나 감정의 본질은 달라지지 않습니다. 하한가를 기준으로 삼고 검증된 비교 판매 사례로 프리미엄을 정당화하며 자산에 맞는 비교 집합을 사용해야 합니다. [Namefi](https://namefi.io) 같은 플랫폼의 토큰화된 `.com`은 그 본질인 실제 도메인으로 평가하고, `.eth`는 온체인 수집품으로 평가합니다. 비교 집합만 올바르게 잡으면 나머지는 계산의 문제입니다.

## 친절한 면책 고지 (반드시 읽어 주십시오!)

> 저희는 변호사, 회계사, 재무 어드바이저, 또는 의사가 아니며, **이 글의 어떤 내용도 법적, 재무적, 세무, 회계, 의학적 또는 기타 전문적 조언이 아닙니다.** 이 게시물은 자체 교육 목적과 고객의 편의를 위해 작성되었습니다. 여기의 정보는 오래되었거나, 특정 지역에만 해당하거나, 단순히 틀릴 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에는 **반드시 실제 전문가와 상담하십시오(진심입니다!)**. 그것이 여의치 않다면, 친구에게 물어보거나, Twitter, Reddit, AI 또는 점술사에게 물어보십시오. 요약하자면: **DOYR - 직접 조사하십시오**. 함께 배우고 즐겨봅시다.

## 출처 및 추가 참고 자료

- Wikipedia — [비교 대상(유사한 최근 판매를 활용하는 comps 감정 방식)](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)
- NameBio — [과거 도메인 이름 판매의 검색 가능한 데이터베이스](https://namebio.com/)
- Ethereum Improvement Proposals — [ERC-721의 `Transfer` 이벤트는 판매 대가가 아니라 `_from`, `_to`, `_tokenId`를 기록](https://eips.ethereum.org/EIPS/eip-721#specification)
- OpenSea Documentation — [offer 배열과 consideration 배열을 따로 기록하는 Seaport `OrderFulfilled` 이벤트](https://docs.opensea.io/docs/seaport-events-and-errors#orderfulfilled)
- Bank for International Settlements — [원자적 결제와 결제 속도, 비용, 위험에 미칠 수 있는 영향](https://www.bis.org/publ/othp99.htm)
- Federal Reserve Bank of New York — [시장 유동성 측정 요소에는 매수·매도 스프레드, 시장 깊이, 가격 충격이 포함됨](https://www.newyorkfed.org/newsevents/speeches/2015/dud150930.html)
- ENS Documentation — [이름 길이에 따른 .eth 등록 가격(5글자 이상 = 연간 $5)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- The Block — [000.eth는 300 ETH(315,000달러), paradigm.eth는 2021년 10월 420 ETH(약 150만 달러)에 판매되었으며 ENS 이름은 OpenSea에서 NFT로 거래됨](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
