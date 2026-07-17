---
title: 'ENS vs DNS 도메인 플리핑: 무엇이 다른가'
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: '.eth 이름 플리핑과 전통적인 DNS 도메인 플리핑의 차이점 — 소유권, 유동성, 갱신, 가스비, 그리고 각각의 적합한 용도를 설명합니다.'
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', 'ENS 도메인 플리핑', 'ENS 도메인 투자', '.eth 도메인 투자', '.eth 이름 플리핑', 'ENS vs 전통 도메인', '온체인 도메인 플리핑', 'NFT 도메인 유동성', 'ENS 갱신 수수료', 'ERC-721 도메인', 'web3 도메인 플리핑', 'OpenSea에서 ENS 판매', 'ENS 만료 유예 기간', '토큰화 도메인 플리핑', 'ENS 가스비']
relatedArticles:
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/onchain-domain-marketplaces-compared/
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

도메인 플리핑을 해본 분이라면 [ENS](/ko/glossary/ens/) 시장을 곁에서 지켜보면서 "새로운 포장만 씌운 같은 게임이 아닐까?" 하는 의문을 품어봤을 것입니다. 결론부터 말하면, 그렇지 않습니다. `.eth` 이름 플리핑과 전통적인 `.com` 플리핑은 표면적으로 닮아 있습니다 — 좋은 문자열을 싸게 사서 더 필요로 하는 사람에게 파는 것이니까요. 하지만 그 밑바닥은 거의 모든 것이 다릅니다. 소유권이 어떻게 노출되는지, 거래가 어떻게 체결되는지, 이름을 보유하는 데 무엇을 지불하는지, 그리고 "소유"가 무엇을 의미하는지까지. 이 글에서는 그 실질적인 차이를 짚어보고, 여러분의 시간과 자본이 실제로 어디에 속하는지 판단할 수 있도록 돕겠습니다.

먼저 한 가지 짚어두어야 할 점이 있습니다. 이 분야는 개념이 뒤섞여 있는 경우가 많습니다. ENS `.eth` 이름은 **토큰화된 DNS 도메인**과 다릅니다. `.eth` 이름은 완전히 [온체인](/ko/glossary/on-chain/)에 존재하며, 리졸버나 브리지 없이는 일반 브라우저에서 접근할 수 없습니다. 반면 토큰화된 `.com`은 실제 [ICANN](/ko/glossary/icann/) 도메인이면서 *동시에* 온체인 토큰을 보유한 것입니다 — `.com`이 작동하는 모든 곳에서 정상적으로 접근할 수 있습니다. 이 세 가지 구분에 대해서는 [토큰화 도메인 vs web3 도메인](/ko/blog/tokenized-domain-vs-web3-domain/)과 [ENS vs Unstoppable vs 토큰화 DNS](/ko/blog/ens-vs-unstoppable-vs-tokenized-dns/) 비교글에서 자세히 다룹니다. 이 글은 ENS `.eth` 플리핑과 전통적인 DNS 플리핑을 구체적으로 비교합니다 — 세 번째 카테고리, 즉 두 가지의 장점을 모두 취하는 토큰화 DNS도 염두에 두시기 바랍니다.

## 실제로 무엇을 구매하는가

![셀프 커스터디 NFT 이름 토큰과 키를 손에 들고 있는 지갑 일러스트와, 제3자가 잠근 등록기관 로그인 및 임대 문서 일러스트를 편집한 이미지](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

전통적인 DNS 도메인은 등록입니다. ICANN 공인 [등록기관(registrar)](/ko/glossary/registrar/)에 요금을 지불하면, 레지스트리 데이터베이스에 이름이 등록됩니다. 문자열 자체를 소유하는 것이 아니라 갱신 가능한 임대권을 보유하는 것이며, 접근 수단은 등록기관 계정 로그인입니다.

ENS 이름은 본질적으로 다릅니다. ENS 문서에 따르면, [이더리움 네임 서비스(ENS)는 이더리움 블록체인을 기반으로 한 분산형·개방형·확장 가능한 이름 지정 시스템입니다](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain). 등록된 `.eth` 이름은 [NFT](/ko/glossary/nft/) — 구체적으로는 [ERC-721](/ko/glossary/erc-721/) 토큰 — 이며, 여러분의 [지갑](/ko/glossary/wallet/)에 보관됩니다. ENS 문서는 사용자가 [다른 ERC721 토큰과 동일하게 이름을 이전할 수 있다](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)고 명시합니다. 그 기반이 되는 ERC-721 표준은 [대체 불가능한 토큰, 즉 증서(deeds)로도 알려진 것에 대한 표준 인터페이스](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)이며, [NFT를 추적하고 이전하는 기본 기능을 제공합니다](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs).

첫 번째 차이는 바로 커스터디(custody)입니다. DNS에서는 등록기관이 계정의 키를, 레지스트리가 권위 있는 레코드를 보관합니다. ENS에서는 [스마트 컨트랙트](/ko/glossary/smart-contract/)가 레코드를 보관하고 *여러분*이 키를 보관합니다. 플리퍼 입장에서는 양날의 검입니다 — 거래 시 중개자가 사라지지만, [커스터디](/ko/glossary/custodial-ownership/) 전체 책임이 본인의 [시드 구문](/ko/glossary/wallet/)에 달려 있습니다.

## 소유권은 공개적이고 온체인에 기록되며 감사 가능합니다

`.com`을 구입하면 소유권은 반(半)공개 상태입니다. WHOIS 데이터는 종종 가려져 있고, 이전 이력은 불투명하며, 구매자는 이름이 깨끗하고 분쟁이 없다는 판매자의 말을 대체로 믿어야 합니다.

ENS는 이를 정반대로 뒤집습니다. 모든 등록, 이전, 판매가 온체인 트랜잭션이기 때문에, 이름의 전체 이력이 공개되고 영구적으로 기록됩니다. 누구든 어떤 [지갑](/ko/glossary/wallet/)이 `crypto.eth`를 보유하는지, 마지막으로 언제 거래됐는지, 얼마에 거래됐는지 확인할 수 있습니다. 플리퍼 입장에서 이는 양면이 있습니다. 장점: 실사가 간단하고, 위조가 어려우며, 구매자가 [에스크로](/ko/glossary/escrow/) 대리인 없이도 몇 초 만에 소유권을 확인할 수 있습니다. 단점: 포트폴리오와 취득 원가가 경쟁자에게 노출되고, "플리퍼"임이 드러나는 지갑은 불리한 역제안을 받을 수 있습니다. 전통적인 도메인 투자에서는 조용히 있을 수 있지만, ENS에서는 그럴 수 없습니다.

이 투명성은 온체인 이름을 가치 평가하고 프로그래밍 방식으로 거래하기 쉽게 만드는 속성이기도 합니다 — [온체인 도메인 감정평가](/ko/blog/appraising-onchain-domains/)에서 이 주제를 더 자세히 다룹니다.

## 2차 시장 유동성: 브로커가 아닌 마켓플레이스

![NFT 마켓플레이스 매장에서의 원스텝 원자적 스왑 일러스트와, 중간 에이전트를 경유하는 느리고 복잡한 다단계 에스크로 경로 일러스트를 편집한 이미지](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

ENS가 경험을 실질적으로 바꾸는 지점이 바로 여기입니다. `.eth` 이름은 ERC-721 토큰이기 때문에, 도메인 업계만의 특수한 인프라 없이도 범용 NFT [마켓플레이스](/ko/glossary/marketplace/) — OpenSea, Blur 등 — 와 네이티브로 호환됩니다. 다른 NFT처럼 등록하면 되고, 거래는 마켓플레이스의 표준 [스마트 컨트랙트](/ko/glossary/smart-contract/)를 통해 체결됩니다.

체결 방식이 핵심적인 차이입니다. 전통적인 도메인 거래는 며칠에 걸친 절차입니다. 가격에 합의하고, 에스크로를 개설하고, 구매자가 자금을 입금하고, 등록기관에서 [이전](/ko/glossary/atomic-transfer/)을 진행하고, 등록기관이 확인하면 에스크로가 해제됩니다. ENS 거래는 [원자적 이전](/ko/glossary/atomic-transfer/)입니다. 구매자의 결제와 여러분의 토큰이 단일 트랜잭션에서 동시에 교환되거나, 아니면 아무것도 일어나지 않습니다. 거래 중간에 제3자가 자산을 보관하지 않습니다. 이것은 토큰화 도메인 거래에서 에스크로가 필요 없는 것과 동일한 메커니즘입니다 — [토큰화 마켓플레이스가 에스크로를 대체하는 방법](/ko/blog/how-tokenized-marketplaces-replace-escrow/)과 [온체인 도메인 마켓플레이스 비교](/ko/blog/onchain-domain-marketplaces-compared/)를 참고하십시오.

그러나 유동성에는 실질적인 함정이 있습니다. NFT 마켓플레이스는 *NFT*에 대해서는 유동적이지만, `.eth` 이름은 그 이름을 구체적으로 원하고 이미 크립토를 다룰 줄 아는 구매자에게만 팔립니다. 훌륭한 `.com`은 지구상의 모든 기업에 팔 수 있지만, 훌륭한 `.eth`는 ETH를 보유하고, 지갑을 운용하며, 온체인 이름에 가치를 두는 훨씬 좁은 풀의 사람들에게만 팔 수 있습니다. 이전은 빠르지만 수요는 얇습니다. "즉시 이전 가능"과 "쉽게 팔 수 있음"을 혼동하지 마십시오.

## 갱신과 만료 방식이 다릅니다

![용서하는 유예 기간 안전망이 떨어지는 도메인 태그를 잡는 일러스트와, 내려가는 가격과 이름을 낚아채는 손이 있는 엄격한 더치 옥션 시계 일러스트를 편집한 이미지](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

두 시스템 모두 이름을 유지하는 데 비용이 들지만, 그 메커니즘은 포트폴리오 운용에 중요한 방식으로 다릅니다.

전통적인 DNS는 등록기관 약관에 따라 운영됩니다. [gTLD](/ko/glossary/gtld/) 등록은 최대 10년까지 보유할 수 있습니다 — 위키피디아에 따르면 [gTLD 도메인 이름의 최대 등록 기간은 10년](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)입니다 — 그리고 일반 `.com`의 갱신 비용은 저렴합니다. 위키피디아에 따르면 2023년 기준 [소매 비용은 연간 약 $9.70부터 시작됩니다](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year). 갱신을 놓쳐도 너그러운 완충 장치가 있습니다 — 이름이 실제로 드롭되기까지 몇 주에 걸친 환급 기간(redemption window)과 유예 기간이 있습니다.

ENS는 이름 길이에 따른 ETH 기반 연간 수수료를 사용합니다. ENS 문서에 따르면, 5자 이상 이름은 연간 약 $5, 4자 이름은 약 $160, 3자 이름은 약 $640입니다 — 짧고 희귀한 문자열은 매점(hoarding)을 억제하기 위해 더 많은 비용이 듭니다 (이 글 작성 시점의 추정치이며, ENS 가격은 USD로 표시되고 ETH로 결제되므로 정확한 ETH 금액은 시장에 따라 변동됩니다). 만료 방식은 더 엄격하고 경쟁적입니다. ENS 문서에 따르면 이름이 만료된 후 [유예 기간 이후 90일](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires)이 지나야 다시 등록 가능해지며, 이 기간에는 문서가 "[21일 더치 옥션](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction)"이라고 부르는 경매를 통해 재등록 가격이 매우 높은 곳에서 시작해 점차 정상 수수료 수준으로 하락합니다. 플리퍼 입장에서 이 경매는 위험(가치 있는 이름을 실수로 만료하면 경쟁자가 낚아챌 수 있음)인 동시에 기회(더치 가격이 하락하는 시점에 프리미엄 이름을 회수할 수 있음)입니다.

실용적인 교훈: ENS는 DNS보다 갱신 관리를 더 철저히 해야 합니다. 유예 메커니즘이 덜 관대하며, 갱신을 놓쳤을 때의 결과는 조용한 드롭이 아니라 경쟁자 모두가 지켜보는 공개 경매입니다.

## 가스비와 체결 비용

전통적인 도메인 비용은 예측 가능합니다. 고정 갱신료, 가끔 이전 수수료, 에스크로 수수료 정도입니다. 포트폴리오의 연간 유지 비용을 정확히 예산화할 수 있습니다.

ENS는 여러분이 통제할 수 없는 변수를 추가합니다. 바로 가스비입니다. 등록, 갱신, 이전, 등록 — 모든 온체인 행위는 네트워크 혼잡도에 따라 변동하는 수수료가 붙는 이더리움 트랜잭션입니다. 조용한 날에는 미미하지만, 대규모 민팅이나 시장 급등 시기에는 저가 이름의 $5 갱신료를 훨씬 초과하는 금액이 가스비로 나갈 수 있습니다. 이는 저가 플리핑의 수익 계산을 바꿉니다. 200개의 잡다한 `.com`을 갱신하는 비용은 정해져 있고 예측 가능하지만, 200개의 하위 등급 `.eth` 이름을 갱신하는 비용은 수수료보다 가스비가 훨씬 클 수 있으며, 수수료 자체도 ETH 가격에 따라 달라집니다. 레이어2와 배칭 도구가 이를 완화하지만, 핵심은 변하지 않습니다. ENS의 유지 비용은 DNS보다 불규칙하고 예측하기 어려우며, 이 불예측성은 물량을 운용하는 누구에게나 실질적인 비용입니다.

## 각각의 적합한 용도

어느 것이 절대적으로 더 낫다고 할 수 없습니다 — 서로 다른 플리퍼와 다른 이름에 적합합니다.

**전통적인 DNS 플리핑**은 구매자가 크립토 사용자가 아닌 *기업*일 때 유리합니다. 웹사이트, 이메일, Google 순위를 위해 `austinplumbing.com`이 필요한 최종 사용자가 그 예입니다. 구매자 풀은 전체 경제이고, 이름은 어디서나 마찰 없이 작동하며, 유지 비용은 예측 가능하고, 플레이북은 성숙해 있습니다. 단점은 느리고 에스크로에 묶인 체결과 불투명한 소유권입니다. [도메인 플리핑](/ko/blog/domain-flipping/)의 대부분의 기술 — 소싱, [감정평가](/ko/blog/how-to-value-a-domain-name/), 아웃리치 — 은 이 분야에서 발전했습니다.

**ENS 플리핑**은 이름의 가치가 *크립토 네이티브*일 때 유리합니다. 깔끔한 지갑 아이덴티티, 프로토콜이나 DAO 핸들, 짧은 수집형 문자열이 그 예입니다. 체결은 원자적이고, 소유권은 셀프 커스터디되며, 자산은 온체인 앱과 결합 가능합니다. 단점은 좁은 구매자 풀, 가스비 노출, 엄격한 만료 규칙, 그리고 키에 대한 전적인 책임입니다 — 지갑을 잃으면 이름도 사라집니다. 바로 이 때문에 [지갑 분실 후 온체인 이름 복구](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)와 [멀티시그 커스터디](/ko/glossary/multi-sig/)가 DNS보다 훨씬 더 중요합니다.

그리고 선택을 강요하지 않는 세 번째 경로가 있습니다. **토큰화 DNS 도메인** — 온체인 토큰이 결합된 실제 `.com` — 은 DNS의 보편적인 구매자 풀과 ENS의 원자적·에스크로 없는 체결 및 셀프 커스터디를 모두 제공합니다. [Namefi](https://namefi.io)가 구축하는 것이 바로 이 영역입니다. 어차피 플리핑할 이름을 토큰화하고, 어디서나 접근 가능하게 유지하면서, 에스크로 없이 온체인으로 판매할 수 있습니다. 온체인 측면을 진지하게 고려하고 있다면, 클러스터 기둥 글인 [온체인 도메인 플리핑](/ko/blog/onchain-domain-flipping/)과 [토큰화가 도메인 플리핑을 어떻게 바꾸는가](/ko/blog/how-tokenization-changes-domain-flipping/)에서 전체 그림을 확인하고, [NFT로 도메인 판매하기](/ko/blog/selling-domains-as-nfts/)에서 등록 방법을 살펴보십시오.

## 결론

ENS와 DNS 플리핑은 정신은 공유하지만 인프라는 거의 공유하지 않습니다. ENS는 공개 소유권, NFT 마켓플레이스 [유동성](/ko/glossary/domain-trading/), 원자적 체결을 제공하지만 — 좁은 구매자 풀, 가스비 노출, 가혹한 만료 규칙, 셀프 커스터디 위험이 그 대가입니다. DNS는 보편적인 구매자 풀, 예측 가능한 유지 비용, 너그러운 갱신 완충 장치를 제공하지만 — 느리고 에스크로에 묶인 불투명한 이전이 그 대가입니다. 가장 현명한 플리퍼는 어느 진영에 속하지 않고, 이름에 맞는 시장을 선택합니다. 그리고 점점 더 많은 플리퍼들이 토큰화 DNS에 손을 뻗어 선택 자체를 하지 않으려 합니다.

## 친애하는 독자에게 (반드시 읽어주세요!)

> 저희는 변호사, 회계사, 금융 자문가, 혹은 의사가 아니며, **이 글의 어떤 내용도 법률, 금융, 세무, 회계, 의료 또는 그 외 어떤 종류의 전문적 조언이 아닙니다.** 이 글은 저희 스스로의 공부와 고객 여러분의 편의를 위해 작성되었습니다. 여기의 정보는 오래됐거나, 특정 지역에만 해당하거나, 단순히 틀릴 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에는 **실제 전문가와 반드시 상담하십시오 (진심입니다!)**. 그것이 맞지 않는다면 친구, 트위터, 레딧, AI, 혹은 점쟁이에게 물어보십시오. 요컨대: **DOYR — 스스로 조사하십시오 (Do Your Own Research)**. 함께 배우고 즐겁게 나아갑시다.

## 출처 및 추가 읽을거리

- ENS Docs — [ENS란 무엇인가? (이더리움 블록체인 기반 분산형 이름 지정 시스템)](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Docs — [ETH 등록기 (.eth 이름은 ERC721 토큰처럼 이전 가능; 만료 유예 기간 및 더치 옥션; 길이 기반 연간 수수료)](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Ethereum Improvement Proposals — [ERC-721 대체 불가능한 토큰 표준 ("대체 불가능한 토큰, 즉 증서로도 알려진 것에 대한 표준 인터페이스")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [도메인 이름 등록기관 (gTLD 최대 10년 등록; 소매 `.com` 갱신 가격)](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
