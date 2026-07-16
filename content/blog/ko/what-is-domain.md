---
title: 도메인 이름이란 무엇인가?
date: '2025-06-19'
language: ko
priority: P0
tags: ['faq']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-basics
format: explainer
description: 도메인 이름은 온라인 존재의 토대입니다.
keywords: ['도메인 이름', 'DNS', '도메인 네임 시스템', 'IP 주소', '웹 주소', '인터넷 기초', '도메인 등록', '웹사이트 주소', 'URL', 'namefi']
relatedArticles:
  - /ko/blog/what-is-a-tld/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/what-is-udrp/
  - /ko/blog/domain-terminology-guide/
  - /ko/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /ko/topics/domain-basics/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-investor-field-guide/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
---

## **도메인 이름이란 무엇인가?**

**도메인 이름**은 웹 브라우저에 입력하여 웹사이트를 방문할 때 사용하는 기억하기 쉬운 주소입니다. `google.com`, `wikipedia.org`, `namefi.io` 같은 것들이 대표적인 예입니다. 도메인 이름은 인터넷상의 도로 주소와 같은 역할을 합니다. 즉, 특정 사이트를 인터넷 어디에서 찾을 수 있는지 컴퓨터에 알려주는 것입니다.

인터넷은 **[도메인 네임 시스템](/ko/glossary/dns/) (DNS)**이라는 체계에 의존합니다. DNS는 거대한 전화번부와 같은 역할을 합니다. 모든 웹사이트는 `192.0.2.1`과 같은 숫자로 구성된 [IP 주소](/ko/glossary/ip-address/)를 가진 서버에 호스팅되어 있지만, 숫자는 기억하기 어렵기 때문에 도메인 이름을 대신 사용합니다. 브라우저에 도메인 이름을 입력하면 DNS가 이를 해당 IP 주소로 변환하여 브라우저가 올바른 웹사이트를 불러올 수 있도록 합니다.

---

## **도메인 구조 이해하기**

도메인 이름은 여러 부분으로 구성됩니다.

*   **[최상위 도메인](/ko/glossary/tld/) (TLD):** 주소 끝에 오는 접미사로, `.com`, `.org`, `.net`이 대표적이며, 최근에는 `.xyz`, `.app`, 심지어 `.ninja` 같은 것들도 등장했습니다. 일반 최상위 도메인(gTLD)과 국가별 최상위 도메인(ccTLD, 예: `.us`, `.uk`, `.cn`)으로 구분됩니다.
*   **[2단계 도메인](/ko/glossary/second-level-domain/) (SLD):** 이름의 핵심 부분으로, `google.com`에서 `google`에 해당합니다.
*   **[서브도메인](/ko/glossary/subdomain/):** `blog.example.com`이나 `mail.example.org`처럼 콘텐츠를 체계적으로 정리하는 데 사용하는 선택적 접두사입니다.

모든 도메인 이름은 고유합니다. 누군가 `example.com`을 등록하면 다른 사람은 해당 도메인을 사용할 수 없습니다.

---

## **도메인 이름은 누가 관리하는가?**

도메인 이름의 전 세계적 조율은 **[ICANN](/ko/glossary/icann/)** (**Internet Corporation for Assigned Names and Numbers**)이라는 비영리 기관이 담당합니다. 1998년에 설립된 ICANN은 도메인 이름과 IP 주소의 할당을 관리하며, 대중에게 도메인 이름을 판매하는 [등록 대행사](/ko/glossary/registrar/)(GoDaddy, Namecheap, Namefi 등)와 협력합니다.

또한 ICANN은 특정 TLD를 관리하는 조직인 레지스트리를 인증합니다. 예를 들어, Verisign은 `.com`과 `.net`을 운영하고, Public Interest Registry는 `.org`를 관리합니다.

---

## **도메인 이름 등록 방법**

도메인 이름을 취득하려면 **[ICANN 인증 등록 대행사](/ko/glossary/accredited-registrar/)**를 이용해야 합니다. 원하는 도메인을 검색하고, 등록 수수료(보통 연 단위)를 납부하면 갱신을 유지하는 한 해당 도메인 사용 권리를 '보유'하게 됩니다.

절차는 다음과 같습니다.

1.  [Namefi](https://namefi.io)와 같은 등록 대행사 웹사이트를 방문합니다.
2.  원하는 도메인 이름을 검색합니다.
3.  사용 가능한 경우, 등록을 진행합니다.
4.  이제 해당 도메인이 가리키는 곳(예: 웹사이트 또는 이메일)을 직접 제어할 수 있습니다.

[Namefi](https://namefi.io)는 다른 등록 대행사와 비교하여 서브도메인 관리, DNS 보안 도구, [블록체인](/ko/glossary/blockchain/) 도메인과 같은 탈중앙화 시스템 연동 등 고급 기능을 제공합니다.

---

## **도메인 이름이 중요한 이유**

도메인 이름은 다음과 같은 측면에서 매우 중요합니다.

*   **온라인 정체성 및 브랜딩** (예: 기업, 크리에이터, 스타트업 등).
*   **신뢰성과 발견 가능성** — 커스텀 도메인은 임의의 URL보다 훨씬 전문적인 인상을 줍니다.
*   **[검색 엔진 최적화](/ko/glossary/seo/)** (SEO).
*   디지털 존재에 대한 **통제권과 소유권**.

세상이 점점 더 온라인 중심으로 이동함에 따라, 적절한 도메인 이름을 보유하는 것은 디지털 세계의 핵심 부동산을 소유하는 것과 같습니다.
