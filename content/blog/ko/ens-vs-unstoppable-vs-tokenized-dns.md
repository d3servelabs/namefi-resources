---
title: "ENS vs Unstoppable vs 토큰화된 DNS 도메인 비교"
date: '2026-06-24'
language: ko
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: choosing-a-tld
series: domain-flipping-skills
seriesOrder: 37
format: comparison
description: "ENS vs Unstoppable Domains vs 토큰화된 ICANN DNS, 브라우저 해석 가능 여부, 갱신 여부, 실질적 통제권 기준으로 비교합니다."
ogImage: ../../assets/ens-vs-unstoppable-vs-tokenized-dns-og.jpg
keywords: ['ENS vs Unstoppable Domains', 'ENS vs 토큰화 도메인', 'Unstoppable Domains vs ENS', 'web3 도메인 비교', '토큰화 DNS 도메인', 'ENS 도메인 플리핑', '.eth 도메인', '.crypto 도메인', 'web3 도메인 브라우저 해석', 'ENS 갱신 수수료', 'Unstoppable Domains 무갱신', 'ICANN vs web3 도메인', 'web3 도메인 통제권', '토큰화 도메인 vs web3 도메인', 'NFT 도메인 비교']
relatedArticles:
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/ens-vs-dns-domain-flipping/
  - /ko/blog/onchain-domain-marketplaces-compared/
  - /ko/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

온체인으로 도메인을 플리핑할 때 첫 번째 결정은 어떤 종류의 '온체인 이름'을 거래하느냐입니다. 흔히 하나로 묶어 생각하는 세 가지 카테고리는 서로 다른 자산이며, 그 차이가 도메인이 브라우저에서 해석되는지, 내년에 갱신 비용을 내야 하는지, 실질적으로 누가 통제하는지를 결정합니다. 이 가이드는 세 가지를 정면 비교합니다: [ENS](/ko/glossary/ens/) (`.eth`), [Unstoppable Domains](https://unstoppabledomains.com) (`.crypto`, `.x`, `.nft`), 그리고 토큰화된 실제 ICANN [DNS](/ko/glossary/dns/) 도메인 ([Namefi](https://namefi.io)에서 [토큰화](/ko/glossary/tokenize/)할 수 있는 `.com`/`.io`/`.xyz` 도메인).

세 가지의 공통점은 하나입니다. 이름 소유권을 토큰 형태로 [지갑](/ko/glossary/wallet/)에 보관한다는 것입니다. 하지만 재판매에 영향을 미치는 모든 면에서 갈라집니다. 한 가지만 기억해야 한다면, 이것을 기억하십시오. ENS와 Unstoppable의 이름은 ICANN 루트 *밖*에 존재하지만, 토큰화된 DNS 도메인은 토큰이 얹힌 ICANN 도메인 *그 자체*입니다. 이 단순한 사실이 해석 가능성, 갱신 방식, 통제권 전반에 파급 효과를 일으킵니다.

## 각각의 실체

![세 개의 이름 토큰 카드가 나란히 작은 받침대 위에 놓인 편집 일러스트 — 육각형 .eth 스타일 토큰, 둥근 Web3 이름 배지, 클래식 글로브 형태의 ICANN 도메인 카드가 동등한 비중으로 배치됨](../../assets/ens-vs-unstoppable-vs-tokenized-dns-01-three-name-types.jpg)

**ENS**는 [Ethereum](/ko/glossary/ethereum/) 위의 네이밍 시스템입니다. 공식 문서는 명확하게 설명합니다. [ENS는 'alice.eth'와 같은 사람이 읽을 수 있는 이름을 Ethereum 주소와 같은 기계 판독 가능 식별자로 매핑합니다](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names). 콘텐츠 해시와 메타데이터도 마찬가지입니다. `.eth` 이름은 Ethereum 위에서 토큰으로 발행되며, [다른 ERC721 토큰과 동일한 방식으로 이름을 이전할 수 있습니다](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token). 즉 구조적으로 [ERC-721](/ko/glossary/erc-721/) [NFT](/ko/glossary/nft/)입니다. 핵심적으로 `.eth`는 ICANN이 위임한 것이 아니라 ENS가 온체인에서 자체적으로 만든 네임스페이스입니다.

**Unstoppable Domains**는 `.crypto`, `.x`, `.nft`, `.dao` 같은 블록체인 네이티브 이름을 판매합니다. 이 [도메인 이름들은 Ethereum 블록체인에서 NFT(non-fungible token)로 발행될 수 있으며](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token), 회사는 이를 사용자의 지갑에 보관합니다. 지원 문서에는 [Web3 도메인은 디지털 자산(NFT)으로 암호화폐 지갑에 저장되며 완전히 귀하의 소유입니다](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)라고 명시되어 있습니다. `.eth`와 마찬가지로, 이 TLD들은 ICANN 루트에 속하지 않습니다.

**토큰화된 DNS 도메인**은 본질적으로 다릅니다. 기반 자산은 공인 [레지스트라](/ko/glossary/registrar/)를 통해 등록된 일반 ICANN 도메인 — `example.com`, `yourname.io` — 이며, 그 소유권을 반영하기 위해 온체인 토큰이 발행됩니다. 상세한 구조는 [토큰화된 도메인이란 무엇인가](/ko/blog/what-are-tokenized-domains/)에서 다루지만, 요약하면 새로운 네임스페이스가 아니라 두 레이어가 동기화된 하나의 이름입니다. 더 넓은 카테고리 구분은 [토큰화 도메인 vs web3 도메인](/ko/blog/tokenized-domain-vs-web3-domain/)을 참조하십시오.

## 브라우저 해석 가능성: 이름이 그냥 작동하는가?

![세 개의 브라우저 주소창 창이 겹쳐진 편집 일러스트 — 위쪽은 녹색 체크 표시가 있고, 나머지 둘은 해석을 위해 작은 퍼즐 조각 형태의 게이트웨이 플러그인이 필요함](../../assets/ens-vs-unstoppable-vs-tokenized-dns-02-resolvability.jpg)

이것이 가장 명확한 구분선이며, 플리퍼 입장에서는 사실상 전부입니다. 대부분의 최종 구매자가 실제로 돈을 내는 이유가 바로 해석 가능성이기 때문입니다.

토큰화된 `.com`은 일반 `.com`이 작동하는 모든 곳 — 모든 브라우저, 모든 이메일 클라이언트, 모든 CDN과 인증 기관 — 에서 해석됩니다. 그것 자체가 일반 `.com`이기 때문입니다. 방문자에게 별도의 준비가 필요하지 않습니다.

ENS와 Unstoppable 이름은 자체적으로는 그 기준을 통과하지 못합니다. Unstoppable은 솔직하게 인정합니다. [Chrome & Firefox에서 도메인 해석을 위해 확장 프로그램을 다운로드할 수 있습니다](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=you%20can%20download). Brave와 Opera 같은 일부 크립토 친화적 브라우저에서만 네이티브로 해석됩니다. ENS `.eth` 이름도 리졸버, 게이트웨이, 또는 확장 프로그램 없이는 표준 브라우저에서 같은 상황입니다. 이는 공학적 결함이 아니라 ICANN 바깥에서 자유롭게 개발할 수 있도록 의도된 설계 선택입니다. 그러나 이는 구매자가 누구인지를 바꿉니다. 이름이 일반 Chrome에서 로드되길 기대하는 일반 시장이 아니라, 주로 [web3](/ko/glossary/web3/)와 지갑 네이티브 사용자층에 판매하는 것입니다.

알아둘 만한 뉘앙스가 하나 있습니다. ENS는 DNS로부터 멀어지는 것이 아니라 *DNS를 향해* 브리징합니다. 문서에 따르면 [ENS는 DNS 이름을 지원하며, 사용자가 DNSSEC를 통해 DNS 이름을 ENS로 가져올 수 있습니다](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names). 따라서 `.com` 소유자가 자신의 실제 이름을 ENS에 투영할 수 있습니다. 하지만 이는 DNS 이름이 일반 인터넷에서 해석을 담당하고, ENS가 온체인 정체성 레이어를 추가하는 것입니다. `.eth` 자체가 표준 브라우저에서 해석된다는 의미가 아닙니다.

## 갱신: 내년에도 비용이 드는가?

갱신 모델은 보유 비용에 직접적으로 영향을 미치는 방식으로 세 가지가 갈라지는 지점이며, 플리퍼가 불쾌한 놀라움을 마주할 수 있는 부분입니다.

ENS `.eth` 이름에는 연간 수수료가 있습니다. 공식 레지스트라 문서는 가격을 명확히 명시합니다. [5글자 이상의 .eth는 연간 5 USD, 4글자는 연간 160 USD, 3글자는 연간 640 USD가 청구됩니다](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you). 그리고 [이 수수료는 ETH로 납부합니다](https://docs.ens.domains/registry/eth/#:~:text=This%20fee%20is%20paid%20in%20ETH). 납부를 놓치면 유예 기간이 있으며, 이후 ENS에 따르면 [이름이 만료된 후 90일(즉, 유예 기간 이후)에 임시 프리미엄 경매가 시작됩니다](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires). 짧고 가치 있는 `.eth` 이름의 경우 갱신 비용은 실질적인 고정 지출입니다.

Unstoppable Domains는 정반대 모델을 내세웁니다. 일회성 구매입니다. 문서에는 Web3 도메인은 [빼앗길 수 없고, 갱신이 필요 없으며, 평생 귀하의 것입니다](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=don%27t%20require%20renewals%2C%20and%20are%20yours%20for%20life)라고 명시되어 있습니다. 연간 청구서가 없다는 점은 장기 보유 플리퍼에게 매력적이지만, '평생'이라는 표현은 프로토콜의 의도에 관한 주장이지 ICANN 보증이 아닙니다. 이 이름들은 그것을 읽는 해석 인프라가 존재하는 한에서만 유효합니다.

토큰화된 DNS 도메인은 일반적인 ICANN 경제 모델을 따릅니다. 레지스트라의 연간 갱신 비용을 납부하며, gTLD 등록은 최대 10년 기간까지 허용됩니다. 반복 비용이지만, 모든 `.com` 투자자가 이미 예산에 반영하는 것과 동일한 잘 이해된 비용입니다. 토큰화가 두 번째 갱신을 추가하지는 않습니다. 토큰은 그 아래의 하나의 DNS 등록을 추적할 뿐입니다.

## 실질적인 통제권은 누구에게 있는가?

![갱신 시계와 열쇠가 달린 세 개의 제어판 편집 일러스트 — 하나의 열쇠는 사용자의 손에 완전히 쥐어져 있고, 나머지 둘은 높은 레지스트리 타워로 뻗어 들어가고 있음](../../assets/ens-vs-unstoppable-vs-tokenized-dns-03-who-controls.jpg)

'자기 수탁(self-custody)'이라는 용어가 세 가지 모두에 느슨하게 사용되므로, 각 레이어에서 통제권이 무엇을 의미하는지 정확하게 파악해야 합니다.

ENS와 Unstoppable의 경우, 온체인 통제권은 진정으로 사용자의 것입니다. [프라이빗 키](/ko/glossary/private-key/)를 보유하면 이름을 보유하며, 지원 티켓을 통해 레지스트라가 이를 회수할 수 없습니다. 이것이 [수탁 소유권](/ko/glossary/custodial-ownership/)이 지갑 수탁으로 대체되는 진정한 매력입니다. 단, '이름'이 의미를 갖는 것은 그것을 인식하는 해석 시스템 안에서입니다. 토큰을 통제하지만 그것을 해석하는 곳이 브라우저 확장 프로그램과 일부 dApp뿐이라면, 통제권은 실재하지만 그 *범위*는 채택 수준에 의해 제한됩니다.

토큰화된 DNS 도메인의 경우, 통제권은 레이어로 구성되어 있습니다. 지갑의 토큰이 온체인 소유권과 이전을 관장하며, 기반이 되는 이름은 실제 ICANN 도메인으로 남습니다. 즉, 갱신, ICANN 정책, [UDRP](/ko/glossary/udrp/) 분쟁의 대상이 됩니다. 모든 `.com`이 따르는 것과 동일한 규칙입니다. 신뢰할 수 있는 토큰화 플랫폼은 두 레이어를 동기화 상태로 유지하므로, 토큰을 이전하면 도메인이 이전되며, DNS 연속성이 보장되어 인계 과정에서 라이브 사이트가 끊기지 않습니다. 지갑 네이티브 통제권과 인터넷 전체가 이미 인식하는 이름을 동시에 얻는 것입니다. 트레이드오프는 명확합니다. '시스템 밖에 있는 것'이 아닙니다. 실세계 규칙에 따르는 실제 도메인이기 때문입니다. 수탁 문제는 [지갑 분실 후 토큰화 도메인 복구](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)에서 더 자세히 다룹니다.

## 유동성과 판매 채널

세 가지 모두 [ERC-721](/ko/glossary/erc-721/) 스타일 NFT이거나 그에 근접하기 때문에, NFT [마켓플레이스](/ko/glossary/marketplace/)에 등록하고 [원자적(atomic)](/ko/glossary/atomic-transfer/) 구매자 지불 및 수령 스왑으로 이전할 수 있습니다. 제3자 [에스크로](/ko/glossary/escrow/) 에이전트가 거래 중간에 자산을 보관할 필요가 없습니다. 이 공통 인프라가 온체인 이름 플리핑을 매력적으로 만드는 핵심이며, 이는 [토큰화 마켓플레이스가 에스크로를 대체하는 방법](/ko/blog/how-tokenized-marketplaces-replace-escrow/)에서 다룹니다.

그러나 구매자 풀은 다릅니다. ENS는 세 가지 중 2차 시장이 가장 깊습니다. 프리미엄 `.eth` 이름들은 상당한 금액에 거래되었습니다. CoinGecko에 따르면 [지금까지 팔린 가장 비싼 크립토 도메인은 "paradigm.eth"로, 2021년 10월 9일 1,510,000달러(420 ETH)에 매각되었습니다](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for). The Block은 [Ethereum Name Service(ENS) 도메인 000.eth가 300 ETH($315,000)에 구매되었다](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)고 보도했습니다. 실제 수치이지만, DNS 세계에서 `Voice.com`이 이례적인 사례이듯 이것도 이례적인 사례로 보아야 합니다. 상한선이 존재한다는 것을 알려줄 뿐, 전형적인 도메인의 거래 가격을 나타내지 않습니다. 인용되는 '바닥 가격' 수치는 사실이 아니라 유동적인 추정치입니다.

토큰화된 DNS 도메인은 다르고 더 넓은 구매자 층에 접근합니다. 실제로 모든 곳에서 해석 가능한 도메인과 지갑 네이티브 소유권을 함께 원하는 모든 사람입니다. 이름이 모든 브라우저에서 로드되고, 이메일을 운영하고, SSL 인증서를 발급받을 수 있기를 원하면서도 NFT로 판매하는 옵션을 포기하지 않으려는 사람들입니다.

## 어떤 것을 플리핑할 것인가?

단일한 승자는 없습니다. 구매자에 맞는 선택이 있을 뿐입니다.

- **ENS `.eth` 플리핑**은 온체인 정체성으로서 짧은 숫자나 단어 이름을 중시하는 크립토 네이티브 사용자층에 판매하고, 보유 가치가 있는 이름의 연간 갱신 비용을 감당할 수 있다면 적합합니다.
- **Unstoppable 이름 플리핑**은 갱신 없는 지갑 중심 web3 정체성을 원하는 구매자가 대상이며, 표준 브라우저 해석 가능성이 우선순위가 아닌 경우에 해당합니다. 해당 네임스페이스의 가치 평가 방식은 [프리미엄 web3 TLD](/ko/blog/premium-web3-tlds/)를 참조하십시오.
- **토큰화된 DNS 도메인 플리핑**은 가장 넓은 구매자 풀을 원하고 실제로 *작동하는* 이름 — 보유하고, 프로그래밍하고, 온체인으로 판매할 수 있으면서 모두를 위해 해석되는 실제 ICANN `.com`/`.io`/`.xyz` — 을 원한다면 적합합니다. [.com을 토큰화하는 방법](/ko/blog/how-to-tokenize-your-com/)으로 시작하고, 플랫폼을 비교한다면 [도메인 토큰화 플랫폼 선택](/ko/blog/choosing-a-domain-tokenization-platform/)에서 기준을 다룹니다.

이 모든 것이 기존의 에스크로-신뢰 모델보다 나은 이유에 대한 큰 그림은 [도메인 플리핑](/ko/blog/domain-flipping/) 허브에서 전체 스킬 스택을 정리하며, [도메인을 토큰화하는 이유](/ko/blog/why-tokenize-domains/)에서 그 장점을 심층적으로 다룹니다. 어떤 카테고리를 거래하든, 가격을 제시하기 전에 지갑에 어떤 자산이 있는지 파악하십시오. 해석 가능성, 갱신 여부, 통제권은 세부 사항이 아니라 바로 제품 자체입니다.

## 면책 고지 (꼭 읽어주세요!)

> 저희는 변호사, 회계사, 재무 자문가, 또는 의사가 아닙니다. **이 글의 어떤 내용도 법률, 금융, 세무, 회계, 의료 또는 기타 전문적 조언이 아닙니다.** 이 글은 저희 자신의 학습과 고객 편의를 위해 작성한 것입니다. 여기의 정보는 오래되었거나, 특정 지역에만 해당하거나, 단순히 틀릴 수도 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정에는 **반드시 실제 전문가와 상담하십시오(진심입니다!)**. 그게 맞지 않는다면 친구에게 물어보거나, 트위터, Reddit, AI, 또는 점쟁이에게 물어보십시오. 한마디로: **DOYR - Do Your Own Research**. 함께 배우고 즐겁게 나아갑시다.

## 참고 자료 및 추가 읽을거리

- ENS Docs — [ENS 프로토콜: 사람이 읽을 수 있는 이름을 주소에 매핑](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)
- ENS Docs — [ETH 레지스트라: .eth는 다른 ERC721 토큰처럼 이전; 연간 가격(5 / 160 / 640 USD/년); ETH로 수수료 납부; 90일 유예 기간](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- ENS Docs — [ENS는 DNSSEC를 통한 DNS 이름 가져오기 지원](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)
- Unstoppable Domains Support — [Web3 도메인은 지갑에 NFT로 저장; 갱신 없음, 평생 소유; Chrome & Firefox는 브라우저 확장 필요](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)
- CoinMarketCap — [Unstoppable Domains는 Ethereum 블록체인에서 NFT로 발행](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)
- CoinGecko Research — [가장 비싼 크립토 도메인: paradigm.eth 2021년 10월 9일 1,510,000달러(420 ETH)에 매각](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)
- The Block — [000.eth, 300 ETH($315,000)에 구매, ENS 역대 두 번째 최고가 거래](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
