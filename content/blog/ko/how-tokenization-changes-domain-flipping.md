---
title: "토크나이제이션이 도메인 플리핑을 바꾸는 방식"
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-tokenization
series: domain-flipping-skills
seriesOrder: 34
format: explainer
description: "도메인을 온체인으로 가져오면 플리핑의 구조가 어떻게 바뀌는지 설명합니다 — 검증된 소유권, 원자적 결제, 그리고 느린 등록기관 애프터마켓 대신 프로그래밍 가능한 이전."
ogImage: ../../assets/how-tokenization-changes-domain-flipping-og.jpg
keywords: ['토크나이즈드 도메인 플리핑', '온체인 도메인 플리핑', '토크나이즈드 도메인 플립', '도메인 NFT 플리핑', '원자적 도메인 결제', 'NFT로 도메인 판매', '토크나이즈드 도메인 마켓플레이스', '도메인 플리핑 web3', 'ERC-721 도메인', '온체인 도메인 이전', '토크나이즈드 도메인 커스터디', '프로그래밍 가능한 도메인 소유권', '도메인 에스크로 대안', '온체인 도메인 플립', '토크나이즈드 도메인 재판매']
relatedArticles:
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

[도메인 플리핑](/ko/blog/domain-flipping/)에서 실질적인 작업의 대부분은 도메인 이름 자체와 무관합니다. 좋은 도메인을 찾고, 가치를 평가하고, 보호하고, 구매자를 물색하고 나면 — 그 이후에 아무도 반기지 않는 단계가 기다립니다. 바로 자산을 이전하고, 한쪽이 손해를 보지 않으면서 대금을 수령하는 일입니다. 이 결제 단계는 느리고 수동적이며, 서로 모르는 당사자들 사이의 신뢰에 기대고 있습니다. 토크나이제이션은 바로 이 구조를 근본적으로 바꿉니다.

도메인을 온체인으로 가져온다고 해서 나쁜 이름이 좋아지거나, 좋은 이름이 싸지는 것은 아닙니다. 바뀌는 것은 거래의 *메커니즘* — 무엇을 구매하는지 확인하는 방법, 자산을 보유하는 방식, 이전이 이루어지는 과정, 그리고 대금이 정산되는 방식입니다. 이 글에서는 플립의 생애주기 중 토크나이제이션이 실제로 작업을 바꾸는 네 가지 지점을 살펴봅니다: 취득, 커스터디, 이전, 재판매. 기본 개념이 낯설다면 [토크나이즈드 도메인이란 무엇인가](/ko/blog/what-are-tokenized-domains/)부터 시작하십시오. 트레이더 관점의 심층 플레이북이 필요하다면 클러스터 핵심 글인 [온체인 도메인 플리핑](/ko/blog/onchain-domain-flipping/)을 참고하십시오.

## 먼저, '온체인'이 여기서 실제로 의미하는 것

정확한 구분이 중요합니다. '블록체인 도메인'이라는 표현 아래 세 가지 서로 다른 것이 뭉뚱그려져 있고, 이들은 동일한 자산이 아닙니다.

`vitalik.eth` 같은 [ENS](/ko/glossary/ens/) 이름과 `brand.crypto` 같은 [Unstoppable 방식](/ko/blog/ens-vs-unstoppable-vs-tokenized-dns/) 이름은 완전히 온체인에 존재하며, [ICANN](/ko/blog/what-are-tokenized-domains/) 루트 밖에 있습니다. 리졸버나 브릿지 없이는 일반 브라우저에서 해석되지 않습니다. 반면 **토크나이즈드 도메인**은 실제 ICANN 도메인 — 어떤 브라우저에서도 동작하는 `.com`, `.xyz`, `.io` — 이며, 그 소유권이 지갑 안에 [NFT](/ko/glossary/nft/) 형태의 토큰으로도 표현됩니다. [DNS](/ko/glossary/dns/) 레코드와 온체인 토큰은 동기화 상태를 유지하므로, 이름은 기존과 동일하게 계속 해석되면서 소유권은 지갑 네이티브 방식으로 관리됩니다. 이 범주들의 차이는 [토크나이즈드 도메인 vs 웹3 도메인](/ko/blog/tokenized-domain-vs-web3-domain/)에서 자세히 다루며, 이 글 전체의 전제가 됩니다. 즉, 플리핑이 달라진다고 할 때, 우리는 온체인 소유권 레이어를 갖게 된 *실제* 도메인을 플리핑하는 것을 의미합니다 — 병렬 네임스페이스를 거래하는 것이 아닙니다.

이 모든 것의 기반이 되는 토큰 표준은 [ERC-721](/ko/glossary/erc-721/)입니다. 오리지널 명세에 따르면 스마트 컨트랙트 내에서 NFT를 위한 [표준 API 구현을 가능하게 하는](https://eips.ethereum.org/EIPS/eip-721#:~:text=allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs%20within%20smart%20contracts) 이더리움 인터페이스입니다. 이 '표준 API'가 이 이야기의 숨은 주인공입니다. 토크나이즈드 도메인이 다른 모든 NFT와 동일한 인터페이스를 사용하기 때문에, 이미 NFT를 처리하는 모든 지갑, 마켓플레이스, [스마트 컨트랙트](/ko/glossary/smart-contract/)가 별도의 커스텀 통합 없이 도메인을 처리할 수 있습니다.

## 취득: 실제로 검증할 수 있는 이름 구매

![돋보기가 지갑 안의 도메인 NFT 토큰을 드러내고, 주변에 블록으로 이루어진 공개 원장과 투명한 출처 추적 기록이 펼쳐지는 편집 일러스트](../../assets/how-tokenization-changes-domain-flipping-01-verify.jpg)

등록기관 애프터마켓에서 구매 대상을 검증하는 일은 번거롭습니다. 마켓플레이스 목록, 프라이버시 보호 뒤에 숨어 있을 수 있는 WHOIS 레코드, 그리고 판매자가 실제로 해당 이름을 통제하고 이전해 줄 것이라는 말을 신뢰해야 합니다. [교차 등록기관 이전](/ko/blog/how-tokenized-marketplaces-replace-escrow/)이 며칠 후 완료되기 전까지는 실제로 소유하게 됐는지 알 수 없습니다.

온체인에서는 소유권이 공개된 사실입니다. 도메인의 NFT는 누구나 읽을 수 있는 주소에 존재하고, 이를 발행한 [스마트 컨트랙트](/ko/glossary/smart-contract/)는 감사가 가능하며, 이전 이력은 블록 익스플로러에서 바로 확인할 수 있습니다. 돈을 쓰기 전에 어떤 지갑이 해당 이름을 보유하고 있는지, 어떤 컨트랙트가 이를 관리하는지, 비정상적인 방식으로 이동되거나 래핑되지는 않았는지를 정확히 확인할 수 있습니다. 이는 실사(due diligence) 측면에서 명백한 진보입니다 — 기존 애프터마켓에서는 스스로 수행할 수 없었던 출처 확인이 가능해집니다. 아직 커스터디를 취득하지 않은 자산을 가격 산정해야 할 때 특히 중요하며, 온체인 출처 정보는 합리적인 가격 산출을 위한 하나의 입력값이 됩니다.

솔직한 단서: *토큰*을 검증하기는 쉽지만, *그 아래에 있는 이름*도 검증해야 합니다. 토크나이즈드 `.com`은 그것이 반영하는 DNS 도메인만큼만 유효합니다. 갱신 상태, [ICANN](/ko/glossary/icann/) 정책 노출, 상표권 위험은 소유권 증서가 온체인에 있다고 해서 사라지지 않습니다. 토크나이제이션은 소유권을 명확하게 만들 뿐, 이름을 합법적으로 플립할 수 있게 만들지는 않습니다.

## 커스터디: 자산을 직접 보유하기

이것이 이후의 모든 것이 따라오는 구조적 변화입니다. 전통적인 모델에서는 도메인을 직접 보유하는 것이 아닙니다 — 도메인을 보유하는 등록기관에 *계정*을 보유하는 것입니다. 이것이 [위탁 소유권](/ko/glossary/custodial-ownership/)입니다. 계정이 잠기거나, 정지되거나, 분실되면, 지불 금액에 상관없이 이름도 함께 사라집니다.

토크나이즈드 도메인은 본인의 지갑에 존재합니다. 개인 키를 보유하고, 자산을 보유하는 것입니다. 이것은 크립토 자산을 이동 가능하게 만드는 자기 수탁(self-custody) 모델이 이름에 적용된 것인데, 플리퍼들이 과소평가하는 양면이 있습니다. 자기 수탁은 등록기관을 단일 실패 지점에서 제거하지만, 대신 *당신*이 단일 실패 지점이 됩니다. 키를 분실하면 비밀번호를 재설정해 줄 고객 지원 창구가 없습니다.

상당한 가치의 포트폴리오를 보유한 사람이라면, 지갑 보안을 플리핑의 핵심 기술로 대해야 한다는 주장이 됩니다. 자산 이동에 하나 이상의 키가 필요한 [멀티 시그 지갑](/ko/glossary/multi-sig/)이 표준적인 도구이지만, [멀티 시그 지갑이 실제로 보안을 개선하는가](/ko/blog/do-multisig-wallets-actually-improve-security/)에서 다루듯 이는 트레이드오프이지 마법의 방패가 아닙니다. 그리고 자기 수탁은 복구도 본인 책임이기 때문에, 사고가 발생하기 전에 선택지를 파악해 두는 것은 선택이 아닌 필수입니다. 키를 분실했을 때 실제로 가능한 것들은 [지갑 분실 후 토크나이즈드 도메인 복구](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)에서 확인하십시오.

## 이전: 일주일이 아닌 몇 분

![느린 등록기관 이전 — 지워진 달력과 자물쇠 — 과 빠른 온체인 이전 — 하나의 확정된 블록에서 두 지갑 사이를 이동하는 도메인 NFT — 을 대비한 편집 일러스트](../../assets/how-tokenization-changes-domain-flipping-02-transfer.jpg)

이것이 등록기관 세계와의 대비가 가장 극명하고, 플립에서 발생하는 마찰의 대부분이 실제로 존재하는 지점입니다.

구식 방식으로 소유권자 간에 도메인을 이동하는 것은 실질적인 대기 기간이 내장된 이전 정책에 의해 규율됩니다. gTLD 도메인을 등록하거나 새로운 등록기관으로 이전할 때 ICANN 규정이 잠금을 적용합니다. 특정 소유권 변경 이후 60일 동안은 [다른 등록기관으로의 모든 이전을 방지하는 잠금](https://support.dnsimple.com/articles/icann-60-day-lock-registrant-change/#:~:text=any%20transfer%20to%20another%20registrar%20for%20sixty%20%2860%29%20days)을 등록기관이 부과해야 합니다. 일반적인 등록기관 간 이전도 인증 코드, 이메일 확인, 그리고 며칠간의 처리 기간이 필요합니다. 이 중 어느 것도 악의적인 것이 아닙니다. 탈취를 방지하기 위해 존재합니다. 그러나 이것은 마찰이고, 속도에 의존하는 플립을 망칩니다.

온체인 이전은 트랜잭션 하나입니다. 토큰이 한 지갑에서 다른 지갑으로 이동해 블록에서 확정되고, 플랫폼은 DNS 측 레코드를 동기화 상태로 유지하여 이름의 해석이 중단되지 않습니다. ENS도 자체 이름에 대해 같은 점을 지적합니다 — 사용자는 레지스트리와 상호작용하여 [다른 ERC721 토큰과 동일하게](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token) 이름을 이전할 수 있습니다 — 그리고 토크나이즈드 ICANN 도메인은 정확히 그 특성을 상속합니다. 플리퍼에게 '이전이 트랜잭션'이라는 것은, 합의된 당일 같은 세션 안에서 거래를 종결할 수 있다는 의미입니다. 구매자와 판매자가 일주일 동안 등록기관 이전을 지켜봐야 하는 대신 말입니다.

## 재판매: 에스크로를 대체하는 원자적 결제

![화폐 코인과 도메인 NFT 토큰이 하나의 루프 안에서 동시에 교환되고, 더 이상 필요 없는 에스크로 에이전트가 옆에 치워진 원자적 스왑 편집 일러스트](../../assets/how-tokenization-changes-domain-flipping-03-atomic.jpg)

토크나이제이션이 플리핑에서 바꾸는 가장 중요한 것은 대금이 정산되는 방식입니다.

모든 도메인 거래에서 발생하는 고전적인 교착 상태는 신뢰 순서 문제입니다. 판매자는 대금을 받기 전에 이전하지 않으려 하고, 구매자는 이름을 받기 전에 지불하지 않으려 합니다. 기존의 해결책은 [에스크로](/ko/glossary/escrow/) — 중립적인 제3자가 자금을 보관하다가 이전이 완료되면 지급하고, 그 간극을 메우는 대가로 수수료(흔히 몇 퍼센트)를 받는 것입니다. 작동하기는 하지만 느리고 모든 거래마다 비용이 발생합니다.

온체인에서는 그 간극을 기계적으로 닫을 수 있습니다. [원자적 이전](/ko/glossary/atomic-transfer/)을 통해 대금 지급과 자산 이전이 동일한 트랜잭션에서 이루어집니다. 구매자의 자금 *과* 도메인 NFT가 함께 이동하거나, 아무것도 이동하지 않습니다. 어느 한쪽이 노출되는 시간적 간격이 없으므로, 에스크로 에이전트가 메워야 할 간극 자체가 존재하지 않습니다. 전체 메커니즘은 [토크나이즈드 마켓플레이스가 에스크로를 대체하는 방법](/ko/blog/how-tokenized-marketplaces-replace-escrow/)에서 다루지만, 플리퍼에게 핵심 메시지는 단순합니다. 모든 판매에서 수수료, 지연, 그리고 상대방을 제거할 수 있습니다.

토크나이즈드 도메인은 표준 NFT이기 때문에, 이미 존재하는 인프라에 바로 등록할 수 있습니다. [NFT로 판매](/ko/blog/selling-domains-as-nfts/)하여 일반 마켓플레이스에 올릴 수 있습니다 — [가장 큰 NFT 마켓플레이스 중 하나로 성장한](https://en.wikipedia.org/wiki/OpenSea#:~:text=one%20of%20the%20largest%20NFT%20marketplaces) OpenSea가 대표적인 예입니다 — 도메인 전용 거래 공간과 함께 말입니다. 어디에 등록할지는 신중히 검토할 가치가 있습니다. [온체인 도메인 마켓플레이스 비교](/ko/blog/onchain-domain-marketplaces-compared/)에서 확인하십시오. 실질적인 결과는 더 넓은 [유동성](/ko/glossary/domain-trading/) 표면입니다. 하나의 자산을 여러 곳에 등록하고, 중개인 없이 결제합니다.

## 프로그래밍 가능한 소유권: 기존 세계에 유사물이 없는 부분

위에서 설명한 모든 것은 토크나이제이션이 더 빠르거나 저렴하게 만드는 등록기관 세계의 유사물이 있습니다. 이 마지막 항목은 그렇지 않습니다.

도메인이 [스마트 컨트랙트](/ko/glossary/smart-contract/) 자산이기 때문에, 소유권이 프로그래밍 가능해집니다. 이름을 대출의 담보로 사용하거나, 코드로 규칙이 집행되는 온체인 경매를 통해 판매하거나, 여러 보유자 간에 [분할](/ko/glossary/domain-trading/)하거나, 자동으로 실행되는 조건으로 임대할 수 있습니다. 이러한 패턴은 전통적인 애프터마켓에는 존재하지 않습니다. 전통 시장에서 도메인은 등록기관 데이터베이스의 항목으로 구매, 판매, 또는 연결하는 것만 가능합니다. 단순한 저가 매수-고가 매도를 넘어 생각하는 플리퍼에게, 프로그래밍 가능성은 기존에는 변호사와 맞춤형 계약을 감당할 수 있는 사람들에게만 가능했던 금융 및 구조화 옵션을 엽니다.

이 부분은 또한 채택 곡선에서 가장 초기 단계에 있으므로, 특수한 사용 사례들은 성숙한 것이 아닌 신흥(emerging)으로 다루어야 합니다. 현재 의존할 수 있는 것은 앞의 네 가지입니다. 검증 가능한 취득, 자기 수탁, 빠른 이전, 에스크로 없는 결제.

## 변하지 않는 것

토크나이제이션이 과장되는 경우가 있으므로, 한계에 대해 솔직하게 말할 가치가 있습니다. 플리핑에서 어려운 부분은 여전히 어렵습니다. 구매할 만한 이름을 발굴하고, 솔직하게 평가하고, 상표권 함정을 피하고, 무엇보다 구매자를 찾아야 합니다. 아무도 원하지 않는 토크나이즈드 이름은 아무도 원하지 않는 등록기관 보유 이름과 정확히 같이 팔리지 않습니다. `Voice.com`이 [3천만 달러](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=blockchain%20provider%20Block.one%20paid%2030%20million%20US%20dollars%20for%20the%20domain%20name%20voice.com)에 거래된 것은 그 이름에 대한 수요 때문이지, 결제가 이루어진 시스템 때문이 아닙니다. 토크나이제이션은 수요를 만들지 않습니다. 이미 수요가 지지하는 거래에서 마찰을 제거할 뿐입니다.

이미 `.com`을 보유하고 있고 직접 차이를 경험해 보고 싶다면, 가장 깔끔한 진입 방법은 보유한 이름을 토크나이즈하고 새로운 방식으로 거래를 한 번 진행해 보는 것입니다. 단계별 안내는 [.com을 토크나이즈하는 방법](/ko/blog/how-to-tokenize-your-com/)을, 어디서 할지 선택할 때는 [도메인 토크나이제이션 플랫폼 선택하기](/ko/blog/choosing-a-domain-tokenization-platform/)를 참고하십시오. [Namefi](https://namefi.io) 같은 플랫폼은 DNS 레이어를 전 과정에서 완전히 기능하도록 유지하므로, 위에서 설명한 온체인 메커니즘을 갖추는 동안에도 이름은 도메인으로서 계속 작동합니다.

## 친절한 면책 고지 (꼭 읽어 주세요!)

> 저희는 변호사, 회계사, 재무 고문, 의사가 아니며, **이 글의 어떤 내용도 법적, 재무적, 세무적, 회계적, 의학적 또는 그 밖의 전문적 조언이 아닙니다.** 이 글은 자체적인 학습과 고객 편의를 위해 작성한 것입니다. 여기의 정보는 구식일 수 있고, 특정 지역에만 해당할 수 있으며, 단순히 틀릴 수도 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에 **반드시 전문가와 상담하십시오(진심으로!)**. 혹은 그게 맞지 않는다면, 친구에게, 트위터에, 레딧에, AI에게, 또는 점술가에게 물어보십시오. 요컨대: **DOYR — 직접 조사하십시오**. 함께 배우고 즐겁게 나아갑시다.

## 출처 및 추가 읽기

- Ethereum Improvement Proposals — [EIP-721: Non-Fungible Token Standard (NFT를 위한 표준 API)](https://eips.ethereum.org/EIPS/eip-721#:~:text=allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs%20within%20smart%20contracts)
- ENS 문서 — [.eth 레지스트라 (다른 ERC721 토큰과 동일하게 이름 이전; 등록 수수료)](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token)
- DNSimple — [등록자 변경 후 ICANN 60일 잠금 (이전 잠금 정책)](https://support.dnsimple.com/articles/icann-60-day-lock-registrant-change/#:~:text=any%20transfer%20to%20another%20registrar%20for%20sixty%20%2860%29%20days)
- Wikipedia — [OpenSea (가장 큰 NFT 마켓플레이스 중 하나)](https://en.wikipedia.org/wiki/OpenSea#:~:text=one%20of%20the%20largest%20NFT%20marketplaces)
- SIDN — [Voice.com, 3천만 달러에 매각 (Block.one, 2019년)](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=blockchain%20provider%20Block.one%20paid%2030%20million%20US%20dollars%20for%20the%20domain%20name%20voice.com)
