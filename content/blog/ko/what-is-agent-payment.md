---
title: "에이전트 결제란 무엇이며, 모두가 앞다퉈 뛰어드는 이유는?"
date: '2026-08-13'
language: 'ko'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "에이전트 결제는 AI 에이전트에게 범위가 정해지고 철회 가능한 권한으로 지출할 수 있게 합니다. Stripe의 Link 에이전트용 지갑, Mercury의 에이전트 카드, 그리고 2025~26년의 쟁탈전을 들여다봅니다."
keywords: ["에이전트 결제란", "에이전트 결제 설명", "에이전틱 커머스", "에이전트용 Stripe Link 지갑", "에이전트용 Stripe Issuing", "Mercury 에이전트 카드", "Mercury 지출 관리", "Agentic Commerce Protocol", "구글 AP2 프로토콜", "Mastercard Agent Pay", "Visa Intelligent Commerce", "일회용 카드 AI 에이전트", "공유 결제 토큰", "AI 에이전트 지출 한도", "x402 에이전트 결제"]
relatedArticles:
  - /ko/blog/wallet-checkout/
  - /ko/blog/agents-buy-domains/
  - /ko/blog/state-of-agentic/
  - /ko/blog/agent-native/
  - /ko/blog/ai-agent-register/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/blockchain-concepts/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/x402/
  - /ko/glossary/stablecoin/
  - /ko/glossary/wallet/
  - /ko/glossary/tokenized-domain/
---

16개월 사이에 양대 카드 네트워크와 Google, OpenAI, Stripe가 모두 같은 것을 위한 인프라를 발표하거나 출시했습니다. 바로 [AI 에이전트](/ko/glossary/ai-agent/)가 돈을 쓸 수 있게 하는 일입니다. Mastercard는 2025년 4월 29일 [Agent Pay를 발표했습니다](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens). Visa는 다음 날 [Intelligent Commerce를 공개했습니다](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf). Google은 2025년 9월, 60개가 넘는 파트너 기업과 함께 [Agent Payments Protocol(AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)을 공개했습니다. 같은 달 OpenAI는 [ChatGPT 안에서 Instant Checkout을 켰습니다](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe). 그리고 2026년 4월, Stripe는 에이전트가 한 번에 한 건씩 빌려 쓸 수 있는 소비자 지갑인 [Link의 에이전트용 지갑](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)을 출시했습니다. 기업용 뱅킹 플랫폼인 Mercury조차 이제 "팀과 **에이전트를 위한 카드**"라는 문구로 [지출 관리 홍보](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)를 이끌고 있습니다.

이 글은 "에이전트 결제"가 실제로 무엇인지 설명하고, 두 가지 시사점 있는 구현 사례 — Stripe의 소비자 측 지갑과 Mercury의 기업 측 에이전트 카드 — 를 살펴본 뒤, 왜 그렇게 많은 기업이 거의 동시에 "이 흐름을 놓칠 여유가 없다"고 판단했는지 짚어봅니다.

## "에이전트 결제"가 실제로 의미하는 것

에이전트 결제는 소프트웨어 에이전트가 개인이나 기업을 대신해 돈을 쓸 수 있게 하는 인프라입니다. 다만 카드 번호 원본을 그대로 넘겨주는 무딘 방식이 아니라, **범위가 정해져 있고**(얼마까지, 어느 가맹점에서, 어떤 목적으로), **증명 가능하며**(에이전트가 실제로 승인받았음을 가맹점이 확인할 수 있음), **철회 가능한**(소유자가 언제든 끌 수 있음) 권한을 부여하는 방식입니다.

마지막 항목이 핵심입니다. Visa 카드 번호를 봇의 설정 파일에 붙여 넣는 것을 막을 장치는 지금까지 없었습니다. 대부분의 사람이 그렇게 하지 않는 이유는, 카드 번호가 범위 없는 권한이기 때문입니다. 그 번호를 가진 사람은 누구든, 사용자가 알아채고 카드를 정지시킬 때까지 어디서든 무엇이든 청구할 수 있습니다. Google의 AP2 발표문은 근본 문제를 명확히 짚습니다. 오늘날의 결제 시스템은 대체로 ["신뢰할 수 있는 화면에서 사람이 직접 '구매' 버튼을 클릭한다고 가정"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking)하며, 자율 에이전트가 결제를 시작하는 것은 ["이 근본적인 가정을 깨뜨립니다"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption). AP2는 이 간극을 모든 에이전트 거래가 답해야 할 세 가지 질문으로 정리합니다. **승인**(사용자가 이 구매에 대해 에이전트에게 권한을 부여했는가?), **진정성**(에이전트의 요청이 사용자의 실제 의도를 반영하는가?), **책임 소재**(문제가 생겼을 때 손실은 누가 지는가?).

이 분야의 모든 제품 — 카드 네트워크의 토큰 프로그램, 개방형 프로토콜, 지갑, 에이전트 카드 — 은 이 세 가지 질문에 충분히 잘 답해, 에이전트에게 돈을 쓰게 하는 일을 평범하고 지루한 일상으로 만들려는 시도입니다.

## Stripe: 에이전트가 한 건씩 빌려 쓰는 지갑

Stripe가 [2026년 4월 29일 발표한](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching) 제품은 **Link의 에이전트용 지갑**으로, 새로운 **에이전트용 Issuing** 계층 위에 구축되었습니다. Link는 Stripe의 소비자용 지갑입니다 — "빠른 결제를 위해 내 정보를 저장한다"는 제품이며, Stripe는 그 고객 기반을 [2억 명이 넘는 소비자](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)로 밝히고 있습니다. 에이전트 흐름은 다음과 같이 작동합니다.

1. 소비자는 표준 OAuth 흐름을 통해 에이전트에게 자신의 Link 지갑 접근 권한을 부여합니다. 다른 서드파티 앱을 연결할 때와 동일한 동의 방식입니다.
2. 에이전트가 무언가를 사고 싶을 때, 가맹점 이름, URL, 금액, 그리고 무엇을 왜 사는지에 대한 사람이 읽을 수 있는 설명 등 맥락 정보를 담은 **지출 요청**을 생성합니다.
3. 소비자는 웹이나 Link 모바일 앱에서 요청을 검토하고 승인합니다. 현재는 [어떤 자격 증명이든 공유되기 전에 요청마다 사람의 검토가 필요](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review)합니다. Stripe에 따르면 지출 한도와 사전 승인된 자율성은 다음 단계로 계획되어 있습니다.
4. 승인이 나면 에이전트는 **일회용 카드** 또는 **Shared Payment Token(SPT)**을 받습니다. 이는 [금액, 통화, 가맹점 같은 통제 항목으로 범위를 지정할 수 있는](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant) 자격 증명입니다. Stripe의 표현을 빌리면 ["에이전트는 사용자의 원본 결제 자격 증명에 절대 접근할 수 없습니다."](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

이 설계는 자세히 살펴볼 가치가 있습니다. 카드 저장 모델을 뒤집기 때문입니다. 저장된 카드는 가맹점(또는 에이전트)이 몇 번이고 다시 끌어다 쓸 수 있는 상시 권한이며, 그 범위는 자격 증명 자체가 아니라 사후에 집행되는 약관으로 제한됩니다. 반면 지출 요청은 구매 시점에 생성되는 단일 권한 부여이며, 해당 구매 하나에만 국한되고 이후에는 소멸합니다. Stripe는 그 아래 계층인 **에이전트용 Issuing**도 공개해, 기업이 자체 에이전틱 지갑을 구축할 수 있게 합니다. 일회용 가상 카드, 자금 보관, 카드 단위 권한, 거래 모니터링, 승인 시점의 부정거래 방지 통제 등이 여기에 포함됩니다.

## Mercury: 법인 카드와 에이전트의 만남

Stripe의 지갑은 소비자 쪽 질문에 답합니다. "쇼핑 에이전트가 내 돈으로 물건을 사게 하려면 어떻게 해야 하나?" Mercury의 [지출 관리](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)는 그 기업 버전에 답하며, 그 답은 시사하는 바가 큽니다. 에이전트를 직원처럼 취급하라는 것입니다.

Mercury는 이 제품을 ["지능형 예산, 직원 환급, 팀과 에이전트를 위한 카드를 갖춘 자율 집행형 비용 관리"](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)라고 설명합니다. 작동 방식은 익숙한 지출 관리 도구 모음입니다 — [특정 목적에 맞춰 범위를 정한 예산과 가드레일](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents), 카테고리별 한도, 실시간 추적, 스스로 집행되는 정책 — 이를 사람이 아닌 지출 주체까지 대상을 넓혀, 기업은 [승인된 거래를 위한 전용 에이전트 카드를 발급](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)할 수 있으며, 각 카드마다 고유한 한도를 둘 수 있습니다.

해당 페이지는 실제로 데모까지 보여줍니다. 에이전트가 "Jane's agent card"로 결제 양식을 채우고 100달러짜리 광고 주문을 넣은 뒤, 그 카드의 월 지출 한도가 1,000달러이며 카드 정보는 해당 결제에만 사용되고 저장되지 않았다고 보고합니다. Mercury Spend는 [모든 Mercury 기업 뱅킹 고객에게 기본 포함](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers)되며, 다른 은행을 이용하는 팀을 위한 독립형 버전도 계획되어 있습니다.

기능 목록보다 이 프레이밍 자체가 더 중요합니다. 기업 입장에서 돈을 쓰는 에이전트는 낯선 새로운 결제 문제가 아니라, **인원 충원**입니다. 재무 시스템에 새로 입사한 직원과 똑같이 카드, 예산, 목적, 월 한도, 감사 추적 기록을 부여받습니다. Stripe가 소비자를 위한 동의 루프를 만들었다면, Mercury는 소프트웨어를 위한 조직도 자리를 만든 셈입니다.

## 16개월의 발표 행렬

타임라인을 한자리에 모아 보면, 이 쟁탈전을 놓치기가 더 어렵습니다.

| 날짜 | 기업 | 발표 내용 |
|---|---|---|
| 2025년 4월 29일 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens): Agentic Tokens; 거래하려면 에이전트가 [등록 및 검증](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified)을 거쳐야 함 |
| 2025년 4월 30일 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users): 토큰화된 자격 증명을 통해 Visa 네트워크를 AI 에이전트에 개방 |
| 2025년 9월 16일 | Google | [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption): Amex부터 Coinbase, PayPal까지 60개 이상의 파트너가 참여한 개방형 프로토콜 |
| 2025년 9월 29일 | OpenAI + Stripe | [ChatGPT 내 Instant Checkout](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe), 오픈소스로 공개된 Agentic Commerce Protocol(ACP) 기반 |
| 2026년 1월 15일 | Google | [Universal Commerce Protocol (UCP)](/ko/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/): AP2와 나란히 작동하도록 설계된 개방형 커머스 상호운용성 표준 |
| 2026년 4월 29일 | Stripe | [Link의 에이전트용 지갑 + 에이전트용 Issuing](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching): 소비자 지갑 접근과 에이전트 지출을 위한 발급 기본 요소 |
| 2026년 | Mercury | [에이전트 카드를 갖춘 지출 관리](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions): 예산, 가드레일, 에이전트 전용 카드 |

왜 이렇게 몰려들었을까요? 세 가지 힘이 작용하고 있으며, 이 부분은 발표문이 직접 밝힌 내용이 아니라 어디까지나 해석입니다.

**구매자가 이동하고 있고, 지갑도 그들과 함께 이동하려 합니다.** OpenAI는 [매주 7억 명이 넘는 사람이 ChatGPT를 찾는다](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week)고 밝혔으며, 이제 채팅 안에서 구매까지 처리합니다. 발견과 결제가 모두 에이전트와의 대화 안에서 일어난다면, 그 에이전트의 지갑을 제공하는 쪽이 모든 가맹점과 모든 고객 사이에 자리 잡게 됩니다. Stripe가 개발자에게 던지는 메시지는 그 보상을 노골적으로 드러냅니다. Link 위에 구축하면 [2억 명 규모의 소비자 기반](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)에 닿을 수 있다는 것입니다. 결제 기업들은 지난 20년간 검색과 소셜이 상거래를 매개하는 모습을 지켜봐 왔습니다. 어느 곳도 에이전트가 그 일을 하는 것을 구경만 할 생각은 없습니다.

**범위 없는 자격 증명은 자동화 앞에서 버티지 못합니다.** 목적에 맞게 설계된 레일이 없으면, 사람들은 에이전트에게 저장된 카드와 공유 로그인을 그대로 넘겨줍니다 — 범위가 전혀 없는 상시 권한이며, 바로 부정거래 탐지 시스템이 잡아내려는 정확한 패턴입니다. Visa의 제품 총괄은 이 요구를 사용자를 넘어서는 신뢰로 규정했습니다. 에이전트는 ["사용자뿐 아니라 은행과 판매자에게도 결제를 맡길 만하다고 신뢰받아야 합니다"](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users). 승인된 에이전트와 카드 테스트 봇을 구별할 수 있는 네트워크는 정상 거래는 더 많이 승인하고 부정 거래는 더 많이 차단할 수 있습니다. 구별하지 못하는 네트워크는 둘 다 제대로 해내지 못할 것입니다.

**프로토콜은 영토 선점 경쟁입니다.** ACP, AP2, Mastercard의 Agentic Tokens, Visa의 토큰화된 자격 증명 모두 기계 구매의 기본 문법 자리를 노립니다. 개방형 표준은 대개 채택하기 쉽다는 점으로 이런 경쟁에서 승리합니다. 바로 그런 이유로 OpenAI는 [ACP를 오픈소스로 공개](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building)했고, Google은 AP2를 위해 60개 출시 파트너를 모은 뒤 2026년 1월 [Universal Commerce Protocol](/ko/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)로 결제를 둘러싼 쇼핑 워크플로 표준화를 이어갔습니다. 패배한 표준을 두 번 통합하고 싶은 사람은 아무도 없습니다.

## 하나의 설계 패턴, 여러 개의 로고

브랜딩을 걷어내면, 진지하게 만들어진 모든 에이전트 결제 제품은 결국 같은 네 가지 속성으로 수렴합니다.

1. **원본 자격 증명을 절대 노출하지 않습니다.** 일회용 카드(Stripe), Shared Payment Token(Stripe/ACP), Agentic Tokens(Mastercard), 토큰화된 자격 증명(Visa). 에이전트는 사용자의 PAN이 아니라 목적에 맞게 만들어진 수단을 지니고 다닙니다.
2. **권한의 범위를 정합니다.** 자격 증명 자체에 금액, 통화, 가맹점, 시간 제한을 둡니다 — OpenAI의 버전을 보면, 암호화된 결제 토큰은 ["특정 금액과 특정 가맹점에 대해서만 승인됩니다"](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants).
3. **적어도 지금은 승인 루프에 사람을 남겨 둡니다.** Stripe는 현재 요청마다 검토를 요구하며, Mercury의 예산은 사람이 정한 한도 안에서 지출을 사전 승인합니다. 자율성의 다이얼은 움직이지만, 시작점은 0에 가깝습니다.
4. **에이전트의 지출을 읽을 수 있게 만듭니다.** 등록된 에이전트(Mastercard), 지출 요청의 맥락 문자열(Stripe), 실시간 추적과 영수증 제출 또는 카드 잠금 방식의 집행(Mercury). 모든 거래는 "어떤 에이전트가, 누구의 권한으로, 무엇을 위해"라는 질문에 답할 수 있어야 합니다.

이 속성들이 크립토 네이티브 독자에게 낯익게 들린다면, 그럴 만합니다. [x402](/ko/glossary/x402/)의 정확 결제 방식 아래 서명으로 승인되는 [스테이블코인](/ko/glossary/stablecoin/) 전송 — 정확한 금액을, 정확한 수신자에게, 시간 범위 안에서만 유효하게, 구매 시점에 결제자 본인의 [지갑](/ko/glossary/wallet/)이 서명 — 은 반대 방향에서 도달한 같은 설계입니다. 다만 범위 제한을 발급사의 정책 엔진이 아니라 암호학이 집행한다는 점이 다릅니다. Stripe 스스로도 스테이블코인을 에이전트 지갑에 곧 추가될 결제 수단으로 꼽고 있습니다. 카드의 세계와 크립토의 세계는 같은 답으로 수렴하고 있습니다. **저장된 권한이 아니라, 거래마다 부여되는 권한.**

## 도메인은 어디에 들어맞는가

도메인은 에이전트가 스스로 구매하는 최초의 품목 중 하나로 자리 잡고 있습니다. 순수한 API 객체이며 배송 주소가 필요 없고, 배포된 모든 에이전트 제품은 결국 자신이 통제하는 이름을 필요로 하기 때문입니다. 저희는 [에이전트가 사람 없이 도메인을 구매하는 방법](/ko/blog/agents-buy-domains/), [에이전트 네이티브 등록대행자란 무엇인지](/ko/blog/agent-native/), 그리고 [AI 에이전트가 Namefi에서 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)을 단계별로 다룬 적이 있습니다.

결제 문제에 대한 Namefi 자체의 답은 [계정 없이 암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/)에서 깊이 다룬 지갑 서명 결제입니다. 에이전트의 지갑은 x402 챌린지에 응답해, 정확히 하나의 등록 건에 대해 정확히 하나의 가격으로 USDC 전송 승인에 서명합니다. 계정도, 어디에도 저장된 자격 증명도 없이 말이죠. 그리고 그 도메인은 [토큰화 도메인](/ko/glossary/tokenized-domain/)으로 같은 지갑에 귀속됩니다. 이것이 바로 이 글이 설명해 온 의미 그대로의 에이전트 결제이며, 오늘날 실제 제품에서 살아 작동하고 있고, 에이전트가 가장 예측 가능하게 구매해야 하는 대상을 위한 것입니다.

결국 에이전트 결제를 제공하려는 이 쟁탈전은 신뢰받기 위한 쟁탈전입니다. 2억 명이 넘는 Link 소비자, 매주 7억 명이 넘는 ChatGPT 사용자, 그리고 모든 법인 카드 프로그램이 같은 베팅으로 수렴하고 있습니다. 다음 10억 명의 구매자가 모두 사람은 아닐 것이며, 그 소프트웨어에 안전하고 범위가 정해지고 책임 소재가 분명한 지출 권한을 부여하는 인프라는 지난 상거래 시대에 카드 네트워크가 그랬던 것만큼 근본적인 기반이 될 것이라는 베팅입니다.

## 출처 및 추가 자료

- Stripe — [Giving agents the ability to pay](https://stripe.com/blog/giving-agents-the-ability-to-pay) (Link의 에이전트용 지갑 + 에이전트용 Issuing, 2026년 4월 29일)
- Mercury — [Spend Management](https://mercury.com/spend-management) (예산, 가드레일, 전용 에이전트 카드)
- Google Cloud — [Announcing the Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (2025년 9월 16일)
- OpenAI — [Buy it in ChatGPT: Instant Checkout and the Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (2025년 9월 29일)
- Mastercard — [Mastercard unveils Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (2025년 4월 29일)
- Visa — [Find and Buy with AI: Visa Unveils New Era of Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce, 2025년 4월 30일)
- Namefi — [계정 없이 암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/) (x402 지갑 서명 결제)
