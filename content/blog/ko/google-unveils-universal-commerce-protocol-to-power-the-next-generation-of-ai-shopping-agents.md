---
title: 구글, 차세대 AI 쇼핑 에이전트를 위한 '유니버설 커머스 프로토콜' 공개
date: '2026-01-15'
language: ko
tags: ['Infrastructure', 'AI Agents', 'Digital Commerce']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: web3-foundations
format: news
description: UCP는 AI 어시스턴트가 개방형 웹 전반에서 쇼핑과 결제를 처리할 수 있도록 지원하는 구글의 에이전트 네이티브 커머스 전략입니다.
keywords: ['유니버설 커머스 프로토콜', 'UCP', '구글 UCP', 'AI 쇼핑 에이전트', 'AI 기반 커머스', '에이전틱 커머스', 'AI 이커머스 프로토콜', '대화형 커머스', 'AI 결제', '이커머스의 미래', '에이전트 기반 쇼핑', '개방형 커머스 표준', '구글 AI', '제미나이 AI', '에이전트 엔진 최적화']
relatedArticles:
  - /ko/blog/ai-vs-io-domain/
  - /ko/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ko/blog/top-tlds-to-secure-for-your-ecommerce-store/
  - /ko/blog/from-mona-co-to-crypto-com/
  - /ko/blog/from-mrchewy-com-to-chewy-com/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/choosing-a-tld/
relatedSeries:
  - /ko/series/name-change-game-change/
  - /ko/series/best-tlds-by-industry/
relatedGlossary:
  - /ko/glossary/icann/
  - /ko/glossary/registrar/
  - /ko/glossary/ai-agent/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

구글이 전통적인 전자상거래의 "[링크세](https://ccianet.org/advocacy/link-taxes/)"에 공식적으로 선전포고를 했습니다. 이번 주 초 [전미소매업협회(NRF)](https://nrf.com/) 콘퍼런스에서 이 검색 공룡은 [유니버설 커머스 프로토콜(UCP)](https://ucp.dev/)의 출시를 발표했습니다. UCP는 Gemini를 비롯한 AI 에이전트가 채팅 인터페이스를 벗어나지 않고도 상품 탐색부터 결제까지 전체 쇼핑 과정을 처리할 수 있도록 설계된 오픈소스 표준입니다.

이 프로토콜은 [Shopify](http://shopify.com), [Walmart](http://walmart.com), [Target](http://target.com), [Etsy](http://etsy.com) 등 주요 유통업체들과 공동으로 개발되었으며, 초기 에이전틱 웹을 괴롭혀 온 "[N×N](https://thingsithinkithink.blog/posts/2025/04-08-the-m-x-n-problem-in-software-architecture/)" 통합 문제를 해결하는 것을 목표로 합니다. 지금까지 쇼핑 가능한 AI를 구축하려면 각 판매자마다 별도의 커스텀 통합을 개발해야 했습니다. UCP는 에이전트가 판매자 백엔드와 "협상"할 수 있는 표준화된 언어를 제안하며, 재고 확인, 동적 가격 책정, 안전한 결제까지 모두 포괄합니다.

*"AI 에이전트는 머지않아 우리가 쇼핑하는 방식의 중요한 일부가 될 것입니다,"* 구글 CEO [순다르 피차이](https://www.britannica.com/money/Sundar-Pichai)가 X에 올린 게시물에서 밝혔습니다. *"UCP는 네이티브 결제를 지원하여 AI 모드와 Gemini 앱에서 직접 구매할 수 있게 합니다."*

### 기술적 구조

기술적으로 UCP는 [추상화 레이어](https://www.strata.io/glossary/abstraction-layer/) 역할을 합니다. "쇼핑 서비스"(결제 세션, 품목 목록)와 "기능"(배송, 멤버십 프로그램)을 분리하는 구조입니다. [모델 컨텍스트 프로토콜(MCP)](https://modelcontextprotocol.io/docs/getting-started/intro) 및 구글 자체의 [에이전트 결제 프로토콜(AP2)](https://ap2-protocol.org/)과 완전히 호환되며, 이는 구글이 모든 판매 채널을 직접 소유하지 않더라도 에이전틱 커머스의 핵심 인프라를 장악하겠다는 의지를 보여줍니다.

### 아마존 변수

이번 행보는 자사 상품 데이터를 스크래핑한다는 이유로 [Perplexity](http://perplexity.ai) 등 AI 검색 엔진을 상대로 점점 더 공세적인 법적 조치를 취해 온 [Amazon](http://amazon.com)을 향한 명확한 견제입니다. 판매자가 자발적으로 에이전트에 의한 스크래핑과 판매에 동의하는 개방형 표준을 만들어, 구글은 아마존의 폐쇄적인 생태계를 우회하고 세계에서 가장 인기 있는 AI 모델을 통해 직접 판매할 수 있는 방법을 소매업체에 제공하는 '협력의 동맹'을 구축하고 있습니다.

현재 UCP는 미국 내 일부 파트너사를 대상으로 순차적으로 출시되고 있지만, 그 메시지는 분명합니다. [SEO](/ko/glossary/seo/)의 시대가 저물고 있으며, AEO(에이전트 엔진 최적화)의 시대가 시작되었습니다.
