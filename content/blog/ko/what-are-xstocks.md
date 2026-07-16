---
title: xStocks란 무엇인가? 도메인 투자자가 알아야 할 이유
date: '2025-07-02'
updated: '2026-06-10'
language: ko
tags: ['faq', 'domains', 'tokenization']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
format: explainer
description: xStocks에 대한 명확한 해설—Solana 위에서 Backed Finance가 발행하는 토큰화 주식(토큰화 지분증권)입니다. xStocks가 무엇인지, 작동 방식, 전통적인 주식과의 차이점, 리스크, 그리고 토큰화 도메인도 포함된 광범위한 실물자산(RWA) 토큰화 트렌드와의 관계를 알아봅니다.
keywords: ['xStocks', 'xStocks란', 'xStocks가 무엇인가', 'xStocks 크립토', '토큰화 주식', '토큰화 지분증권', 'was sind xStocks', 'xStocks是什么', '什么是xstocks', 'que son los xStocks', 'unterschied xStocks traditionelle Aktien', 'Backed Finance', 'Kraken xStocks', 'Bybit xStocks', 'Solana 토큰화 주식', '온체인 지분증권', '실물자산 토큰화', 'RWA 토큰화', '토큰화 도메인', '도메인 토큰화', 'Namefi']
relatedArticles:
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/onchain-domain-flipping/
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/dns/
  - /ko/glossary/web3/
  - /ko/glossary/tld/
---

크립토 거래소나 트레이딩 앱에서, 혹은 "블록체인 위의 주식"이라는 헤드라인에서 **xStocks**라는 단어를 본 적이 있으신가요? xStock이 진짜 주식인지, 크립토 코인인지, 아니면 주가에 베팅하는 상품인지 궁금하셨을 것입니다. 그리고 이것이 도메인과 무슨 관계가 있는지도요.

이 글은 **"무엇"**에 대한 질문에 직접 답합니다. xStocks가 *무엇인지*, 어떻게 *작동하는지*, 누가 *발행하는지*, 전통적인 주식과 어떻게 *다른지*, 이해해야 할 *리스크*는 무엇인지—그리고 [토큰화 도메인](/ko/blog/what-are-tokenized-domains/)도 포함되는 광범위한 **실물자산(RWA) 토큰화** 트렌드를 주시하는 모든 분들에게 왜 이것이 중요한지 설명합니다.

> 먼저 한 가지를 명확히 하겠습니다. **xStocks는 Namefi의 제품이 아닙니다.** 여기서는 자산 토큰화가 향하는 방향을 보여주는 교육적 사례로 다룹니다. 이 글의 어떤 내용도 금융, 법적, 세무 조언이 아닙니다.

---

## 간단한 정의

**xStock**은 실제 주식이나 ETF의 가격을 추적하는 퍼블릭 블록체인 토큰으로, 발행자가 보관하는 기초 주식 1주에 **1:1로 담보**되도록 설계되어 있습니다. xStocks는 **토큰화 주식**(또는 *토큰화 지분증권*)입니다. 전통적인 증권사를 거치지 않고도 Apple이나 Tesla 같은 기업에 가격 노출을 얻을 수 있는 블록체인 기반의 방법입니다.

간단히 말하면:

> xStock은 하나의 주식 경제적 가치를 그대로 반영하는 크립토 토큰입니다(예: `AAPLx`는 Apple 추적, `TSLAx`는 Tesla 추적). 자기 보관(self-custodial) [지갑](/ko/glossary/wallet/)에 보관하며 크립토 거래소와 탈중앙화 프로토콜에서 거래할 수 있고, 대체로 전통적인 시장 거래 시간 외에도 거래됩니다.

xStocks는 **Backed Assets(Backed Finance 산하 법인)**이 발행하며 주로 표준 SPL 토큰으로 **Solana** 블록체인에서 운영됩니다. **xStocks Alliance**를 통해 배포되는데, 여기에는 **Kraken**, **Bybit**, 그리고 **Raydium**, **Jupiter**, **Kamino** 같은 Solana DeFi 플랫폼이 포함됩니다. 2025년 말, Kraken은 xStocks의 배후 회사인 Backed를 **인수**할 것이라고 발표했습니다.

---

## xStocks 작동 방식

마케팅에서 들리는 것보다 메커니즘은 훨씬 단순합니다.

1. **실제 주식이 보관됩니다.** 유통 중인 각 xStock 토큰에 대해, 발행자는 규제 수탁자에게 실제 주식(또는 ETF 유닛) 1주에 해당하는 것을 보유해야 합니다. 즉, 공급이 1:1로 담보됩니다.
2. **토큰이 온체인에서 발행됩니다.** 그 보유분은 Solana 위의 토큰(예: `AAPLx`)으로 표현되며, Phantom이나 Solflare 같은 자기 보관 지갑에 보유할 수 있습니다.
3. **거의 24시간 거래됩니다.** [온체인](/ko/glossary/on-chain/) 토큰이기 때문에 xStock은 기초 주식시장 거래 시간이 아닌 거래소에서 **24/5**, DeFi 프로토콜에서는 사실상 24/7로 매수, 매도, 이전이 가능합니다.
4. **DeFi와 연결됩니다.** xStocks는 *컴포저블*합니다. 다른 크립토 토큰과 마찬가지로 [담보](/ko/glossary/collateral/)로 제공하거나, 유동성 풀에서 페어링하거나, 다른 온체인 전략에 활용할 수 있습니다.

**배당금**에 대해: xStocks는 지갑에 현금 배당금을 직접 지급하지 않습니다. 대신 발행자가 배당금 가치를 기초 포지션에 재투자하고, 그 분배가 반영되도록 토큰 가치를 조정합니다. 현금 지급이 아닌 경제적 패스스루 방식입니다.

2026년 초 기준으로 xStocks는 거래량 기준으로 최대 토큰화 지분증권 상품으로 성장했으며, 출시(2025년 6월) 당시 약 60개 자산에서 100개 이상의 토큰화 주식 및 ETF 카탈로그로 확대되었고, 발행자는 커버리지를 더욱 넓히겠다는 의지를 밝혔습니다.

---

## xStocks와 전통 주식의 차이점

많은 비영어권 독자들이 실제로 궁금해하는 질문입니다—*was sind xStocks*, *xStocks是什么*, *qué son los xStocks*, 특히 *"xStocks는 전통적인 주식과 어떻게 다른가?"* 솔직한 비교를 제시합니다.

| 특성 | 전통적인 주식 | xStock (토큰화 주식) |
|---|---|---|
| 법적으로 보유하는 것 | 회사의 주식 | 주식 가치를 추적하는 토큰 |
| 의결권 | 있음 (일반적으로) | 없음 |
| 배당금 | 현금으로 지급 | 토큰 가치에 반영, 현금 지급 없음 |
| 보관 위치 | 증권 계좌 | 자기 보관 크립토 지갑 |
| 거래 시간 | 거래소 시간 (예: 하루 약 6.5시간) | 거래소 24/5, DeFi 약 24/7 |
| 결제 | T+1 (영업일 기준 약 1일) | 온체인 거의 즉시 |
| DeFi 연동성 | 없음 | 있음 |
| 신뢰 대상 | 증권사, 청산소 | 토큰 발행자 + 수탁자 + 블록체인 |

핵심 포인트: **xStock은 주식 자체가 아닙니다.** 주식의 가격(및 배당금 가치)에 대한 *경제적 노출*을 제공하지만, 일반적으로 의결권 같은 **주주 권리는 부여되지 않으며**, 규제된 증권사를 통해 주식을 직접 보유할 때는 없는 **발행자 및 수탁 리스크**가 따릅니다.

---

## 리스크와 고려 사항

xStocks는 흥미로운 혁신이지만 리스크가 없는 것은 아니며, 균형 잡힌 해설은 이 점을 명확히 해야 합니다.

- **발행자 및 거래상대방 리스크.** 토큰 가치는 발행자가 실제로 수탁자에게 담보 주식을 보유하고 유지하는지에 달려 있습니다. 발행자의 신용도, 운영, 지급 능력 리스크를 부담하게 됩니다.
- **주주 권리 없음.** 의결권 없음, 현금 배당금 없음, 청산 시 회사 또는 그 자산에 대한 직접적인 법적 청구권 없음.
- **유동성 리스크.** 특정 xStock의 온체인 시장은 얕을 수 있어, 원하는 시점에 적정 가격으로 청산하기 어려울 수 있습니다.
- **규제 불확실성.** 토큰화 증권의 법적 지위는 여전히 발전 중이며 국가마다 다릅니다. xStocks는 많은 관할권에서 적격 고객에게 제공되지만 **미국인에게는 제공되지 않으며**(캐나다, 영국, 호주 등도 마찬가지), EU에서는 기존 증권 체계 안에서 다루어지고 있습니다.
- **스마트 컨트랙트 및 플랫폼 리스크.** 다른 온체인 자산과 마찬가지로 버그, 취약점 공격, 플랫폼 중단이 발생할 수 있습니다.

행동하기 전에 반드시 해당 관할권의 현재 자격 요건과 발행자의 리스크 공시를 확인하시기 바랍니다.

---

## 도메인 투자자와 Namefi 사용자가 알아야 할 이유

여기서 연결고리가 생깁니다. xStocks 자체는 도메인 이야기가 아닙니다. 하지만 **토큰화 도메인**이 속한 것과 동일한 메가트렌드—**실물자산(RWA) 토큰화**—의 생생한 사례입니다.

패턴은 자산 클래스 전반에 걸쳐 동일합니다. 전통적으로 유동성이 낮고 특수 시스템 안에 갇혀 있던 것—증권사 뒤의 **주식**, 레지스트라 뒤의 **도메인**—에 동기화된 온체인 표현을 부여합니다. 그러면 갑자기 그 자산이 다음과 같이 됩니다.

- **지갑 네이티브** — 호스팅 계좌가 아닌 본인이 직접 보관합니다.
- **수 초 만에 이전 가능** — 며칠에 걸친 결제나 [에스크로](/ko/glossary/escrow/) 절차가 없습니다.
- **컴포저블** — 담보로, 마켓플레이스에서, [DeFi](/ko/glossary/defi/)에서 활용 가능합니다.
- **글로벌 접근 가능** — 국경을 초월해 24시간 거래 가능합니다.

이것이 바로 [토큰화 도메인](/ko/blog/what-are-tokenized-domains/)이 의미하는 것입니다. 실제로 [ICANN](/ko/glossary/icann/)이 인정한 도메인(예: `example.com`)의 소유권이 지갑 안의 NFT로도 존재하며, DNS [레지스트리](/ko/glossary/registry/)와 동기화 상태를 유지합니다. xStock이 1초 미만으로 결제될 수 있게 하는 동일한 메커니즘으로, 프리미엄 `.com` 도메인도 그만큼 빠르게 소유권이 이전되거나 담보로 제공될 수 있습니다.

도메인에 특화된 가능성을 더 알고 싶으시다면 [2026년 토큰화 도메인 활용 사례](/ko/blog/tokenized-domain-use-cases-2026/)에서 담보 대출, [분산 소유](/ko/glossary/fractional-ownership/), 온체인 마켓플레이스, [임대](/ko/glossary/leasing/) 등을 정리해 두었습니다. xStocks는 더 넓은 시장이 그 *모델*을 검증하고 있음을 보여주며, 토큰화 도메인은 그 모델을 인터넷에서 가장 오래되고 가치 있는 자산 클래스 중 하나에 적용하는 것입니다.

명확히 해둘 중요한 차이점이 하나 있습니다. xStock은 직접 소유하지 않는 오프체인 주식을 *추적*하는 토큰인 반면, Namefi로 토큰화된 도메인은 진짜 도메인 *그 자체*입니다. 온체인 토큰과 레지스트리 레코드는 다른 곳에 보관된 자산의 추적자가 아니라 **동일** 자산의 두 가지 동기화된 레이어입니다.

---

## 자주 묻는 질문

**xStocks란 무엇인가요?** xStocks는 토큰화 주식입니다. Backed가 발행하고 주로 Solana에서 운영되는 블록체인 토큰으로, 실제 주식과 ETF의 가격을 추적하며 수탁 보관 중인 기초 주식에 1:1로 담보되도록 설계되어 있습니다.

**Was sind xStocks? (독일어로 xStocks란 무엇인가.)** xStocks는 토큰화 지분증권입니다. 실제 주식(예: Apple, Tesla) 가치를 그대로 반영하는 크립토 토큰으로, 자기 보관 지갑에 보관하며 거의 24시간 거래할 수 있습니다.

**xStocks 是什么？/ 什么是 xStocks？ (중국어로 xStocks란 무엇인가.)** xStocks 是代币化股票（tokenized stocks），即在区块链（主要是 Solana）上发行、按 1:1 锚定真实股票或 ETF 的代币，由 Backed 发行，可在加密钱包中自托管并近乎全天候交易。

**¿Qué son los xStocks? (스페인어로 xStocks란 무엇인가.)** Los xStocks son acciones tokenizadas: tokens en blockchain (principalmente Solana) que replican el valor de acciones reales, respaldados 1:1 por las acciones subyacentes y negociables casi a toda hora.

**Worin liegt der Unterschied zwischen xStocks und traditionellen Aktien? (xStocks와 전통 주식의 차이점은 무엇인가.)** 전통 주식은 의결권, 현금 배당금, 시장 거래 시간 내 증권사/청산소 결제를 포함한 주식의 법적 소유권입니다. xStock은 주식 가치를 추적하는 토큰입니다. 의결권 없음, 배당금은 현금이 아닌 토큰 가치에 반영, 지갑에 자기 보관, 온체인 거의 즉시 결제, 그리고 발행자 및 수탁 리스크가 수반됩니다.

**xStocks는 크립토와 같은 건가요?** xStocks는 크립토 *토큰*이지만, Bitcoin이나 [스테이블코인](/ko/glossary/stablecoin/)과 달리 개별 주식의 가격을 추적합니다. (달러 연동 토큰과의 차이점은 [스테이블코인이란 무엇인가?](/ko/blog/what-are-stablecoins/)를 참고하세요.)

**xStocks는 누가 발행하나요?** Backed(Backed Finance)가 발행하며, Kraken과 Bybit을 포함한 xStocks Alliance를 통해 배포됩니다. Kraken은 2025년 Backed를 인수할 계획을 발표했습니다.

**미국인도 xStocks를 살 수 있나요?** 아닙니다. 작성 시점 기준으로 xStocks는 미국인에게 제공되지 않으며, 캐나다, 영국, 호주 등에도 여러 제한이 있습니다. 해당 관할권의 현재 자격 요건을 반드시 확인하십시오.

**xStocks에 의결권이나 현금 배당금이 있나요?** 의결권은 없습니다. 배당금은 현금 지급이 아닌 토큰 가치 조정 방식으로 패스스루됩니다.

---

## 더 큰 그림

xStocks는 **실물자산 토큰화가 주류에 진입했음**을 명확히 보여주는 신호입니다. 슬로건으로서가 아니라, 실제 온체인 거래량의 수십억 달러로서입니다. 주식은 이 전환을 이룬 최초의 대형 자산 클래스 중 하나였습니다. 전 세계적으로 인정받고, 수십 년간 검증되었으며, 이미 디지털인 도메인은 자연스러운 다음 장이 될 것입니다.

이 트렌드의 도메인 측면을 더 깊이 알고 싶다면 [토큰화 도메인이란 무엇인가?](/ko/blog/what-are-tokenized-domains/)부터 시작해 [2026년 토큰화 도메인 활용 사례](/ko/blog/tokenized-domain-use-cases-2026/)를 살펴보세요. 실제로 활용하려면 [namefi.io](https://namefi.io)를 방문하시고 X에서 [@namefi_io](https://x.com/namefi_io)를 팔로우하세요.

*이 해설은 영어로 작성되었습니다. 번역된 버전은 독일어, 스페인어, 중국어 독자들이 xStocks가 무엇인지, 그리고 더 넓은 토큰화 움직임과 어떻게 관련되는지 동일하게 이해하는 데 도움을 줍니다.*
