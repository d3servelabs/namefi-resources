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

DNS 계층은 루트 `.`에서 시작합니다. 아래에는 최상위 도메인 `com`, 2단계 도메인 `example.com`, 서브도메인 `blog.example.com`이 있습니다. `example`만으로는 레이블입니다. `example.co.uk`에서는 `uk`가 최상위, `co.uk`가 2단계, `example.co.uk`가 3단계입니다. 등록 가능한 도메인의 경계는 항상 2단계와 일치하지 않습니다. [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034#section-3.1).

도메인은 한 시점에 한 명의 등록자를 가집니다. 등록자는 다른 사람이나 서비스에 사용을 허용할 수 있습니다. 등록은 다른 확장자의 같은 이름까지 확보하지 않습니다. [ICANN](https://www.icann.org/en/contracted-parties/accredited-registrars).

---

## **도메인 이름은 누가 관리하는가?**

도메인 이름의 전 세계적 조율은 **[ICANN](/ko/glossary/icann/)** (**Internet Corporation for Assigned Names and Numbers**)이라는 비영리 기관이 담당합니다. 1998년에 설립된 ICANN은 도메인 이름과 IP 주소의 할당을 관리하며, 대중에게 도메인 이름을 판매하는 [등록 대행사](/ko/glossary/registrar/)(GoDaddy, Namecheap, Namefi 등)와 협력합니다.

레지스트리는 도메인 등록부를 운영합니다. 등록 대행사는 고객의 등록을 처리합니다. ICANN은 등록 대행사를 인증하고 gTLD 레지스트리 운영자와 계약을 체결합니다. 국가별 도메인은 자체 관리 체계를 따릅니다. [ICANN](https://www.icann.org/en/contracted-parties/registry-operators/resources/listings).

---

## **도메인 이름 등록 방법**

gTLD 등록에는 ICANN 인증 등록 대행사 또는 관련 리셀러를 이용할 수 있습니다. 등록 가능 여부, 자격, 계약 조건과 갱신 비용을 확인하세요. 등록 계약은 도메인 사용 권리를 정합니다. [ICANN](https://www.icann.org/en/contracted-parties/accredited-registrars).

절차는 다음과 같습니다.

1.  [Namefi](https://namefi.io)와 같은 등록 대행사 웹사이트를 방문합니다.
2.  원하는 도메인 이름을 검색합니다.
3.  사용 가능한 경우, 등록을 진행합니다.
4.  이제 해당 도메인이 가리키는 곳(예: 웹사이트 또는 이메일)을 직접 제어할 수 있습니다.



---

## **도메인 이름이 중요한 이유**

도메인 이름은 다음과 같은 측면에서 매우 중요합니다.

*   **온라인 정체성 및 브랜딩** (예: 기업, 크리에이터, 스타트업 등).
*   **신뢰성과 발견 가능성** — 커스텀 도메인은 임의의 URL보다 훨씬 전문적인 인상을 줍니다.
*   **[검색 엔진 최적화](/ko/glossary/seo/)** (SEO).
*   디지털 존재에 대한 **통제권과 소유권**.

세상이 점점 더 온라인 중심으로 이동함에 따라, 적절한 도메인 이름을 보유하는 것은 디지털 세계의 핵심 부동산을 소유하는 것과 같습니다.
