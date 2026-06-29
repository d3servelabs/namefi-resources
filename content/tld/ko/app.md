---
title: '.app 도메인이란 무엇인가? HTTPS 보안 TLD 완전 해설'
date: '2026-06-15'
language: ko
priority: P1
tags: ['tld']
authors: ['namefiteam']
draft: false
description: '.app 도메인은 Google Registry가 운영하는 소프트웨어·앱 전용 gTLD로, 모든 사이트에 HTTPS가 의무화되어 있습니다. 적합한 대상, 검색 순위 영향, 등록 방법을 알아보세요.'
keywords: ['.app 도메인', '.app이란', '.app TLD', '.app 도메인 종류', '앱 도메인 확장자', 'Google Registry .app', '.app HTTPS 필수', '.app 도메인 등록', '개발자 도메인']
faqs:
  - question: '누구나 .app 도메인을 등록할 수 있나요?'
    answer: '네. .app TLD는 자격 제한이 없는 개방형 일반 최상위 도메인으로, 누구든지 사용 가능한 이름을 등록할 수 있습니다. 유일한 실질적 조건은 법적인 것이 아니라 기술적인 것입니다. .app 사이트가 브라우저에서 열리려면 유효한 HTTPS 인증서가 필요합니다.'
  - question: '.app 도메인이 SEO에 영향을 미치나요?'
    answer: 'Google은 .app을 표준 일반 gTLD로 취급하며, 고유한 순위 이점이나 불이익을 부여하지 않습니다. .app은 HTTPS를 강제하므로 Google의 보안 연결 권장 사항을 자동으로 충족하게 되며, 이는 가벼운 긍정적 신호로 작용합니다.'
  - question: '누가 .app 도메인을 등록해야 하나요?'
    answer: '모바일 앱 개발사, SaaS 및 웹 앱 빌더, 프로젝트를 선보이는 개발자에게 가장 잘 맞습니다. 이 확장자는 "실제로 작동하는 애플리케이션"이라는 메시지를 전달하므로 제품 허브, 다운로드 페이지, 로그인 포털에 이상적입니다.'
  - question: '.app 도메인에 왜 HTTPS가 필요한가요?'
    answer: 'Google Registry가 출시 전에 .app 전체 존(zone)을 브라우저 HSTS 프리로드 목록에 추가했습니다. 그에 따라 브라우저는 모든 .app 요청을 자동으로 HTTPS로 업그레이드하며, 유효한 TLS 인증서 없이는 도메인이 열리지 않습니다. 이 설정은 선택 해제가 불가능합니다.'
  - question: '.app은 WHOIS 개인정보 보호를 지원하나요?'
    answer: '네. 일반 gTLD인 .app은 표준 등록대행사의 WHOIS 개인정보 보호 또는 프록시 서비스를 지원하며, 현행 ICANN 정책에 따라 공개 WHOIS 결과에서 대부분의 개인 등록자 정보는 이미 삭제 처리됩니다.'
relatedArticles:
  - /ko/blog/top-tlds-to-secure-for-your-startup/
  - /ko/blog/top-tlds-to-secure-for-your-saas/
  - /ko/blog/what-is-a-tld/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/ai-vs-io-domain/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/best-tlds-by-industry/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
  - /ko/glossary/dns/
---

**.app** 도메인은 소프트웨어라는 영역을 위해 만들어진 [일반 최상위 도메인](/ko/glossary/gtld/)(gTLD)입니다. Google Registry가 운영하며, 명확하고 보편적으로 통용되는 의미를 지닙니다. 그리고 이 도메인을 가장 특징짓는 규칙이 하나 있습니다. 모든 .app 사이트는 반드시 HTTPS를 통해 제공되어야 합니다. 모바일 앱, 웹 앱, 혹은 개발자 도구를 만든다면 `.app` 주소는 방문자가 링크를 클릭하기 전에 무엇을 열게 될지 정확히 알려줍니다.

이 페이지에서는 .app이 .com과 같은 일반 확장자와 무엇이 다른지, 실제로 누가 사용하는지, Google이 검색 순위에서 어떻게 취급하는지, 등록 규정, 그리고 Namefi에서 등록하는 방법을 다룹니다.

## .app 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| TLD 유형 | 일반 최상위 도메인 (gTLD) |
| 레지스트리 운영자 | Charleston Road Registry Inc. (Google Registry) |
| 출시 연도 | 위임 2015년; 일반 등록 개시 2018년 5월 |
| IDN 지원 | 지원 |
| DNSSEC | 지원 |
| 등록 제한 | 전면 개방 — 자격 요건 없음; 사이트 로딩을 위해 유효한 HTTPS 인증서 필요 |
| 최적 활용 | 모바일 앱, SaaS/웹 앱, 개발자 프로젝트 |

## .app이란?

"app"이라는 단어는 번역이 필요 없습니다. 스마트폰이든, 브라우저든, 데스크톱이든 애플리케이션을 뜻하는 전 세계 공통 표현이기 때문입니다. 그 덕분에 .app은 새로운 gTLD 중 가장 직관적인 도메인 중 하나입니다. `getproduct.app`과 같은 이름은 `getproduct.com`이 할 수 없는 방식으로 "기능하는 소프트웨어"를 즉시 전달합니다.

.app은 국가 코드 TLD가 아닌 일반 gTLD이므로 지리적 연관성이 없습니다. [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/managing-multi-regional-sites)에 따르면 .app과 같은 [새로운 gTLD](/ko/glossary/new-gtld/)는 기본적으로 일반 도메인으로 취급되며 지역 타겟팅 측면에서 특정 국가에 연결되지 않으므로 글로벌 청중을 대상으로 할 수 있습니다. 위임 및 운영자 세부 정보는 [IANA .app 루트 존 항목](https://www.iana.org/domains/root/db/app.html)에서 확인할 수 있습니다.

.app의 가장 중요한 기술적 특징은 보안 모델입니다. HSTS 프리로드 목록을 통해 레지스트리 수준에서 **모든 사이트에 HTTPS를 적용**한 채로 일반 등록이 가능해진 최초의 TLD입니다. 실질적인 영향은 아래 자격 요건 및 신뢰도 항목에서 설명합니다.

## .app의 역사

Charleston Road Registry Inc.는 ICANN의 새로운 gTLD 프로그램에서 .app을 신청했습니다. 해당 문자열은 여러 신청자 간에 경합이 벌어졌으며, Google이 약 2,500만 달러(당시 기준으로 새로운 gTLD 낙찰 사례 중 최고액 수준)의 입찰가로 2015년 ICANN [경매](/ko/glossary/auction/)에서 낙찰받았습니다. [IANA](/ko/glossary/iana/) 기록에 따르면 위임은 2015년에 완료되었습니다.

네임스페이스는 2018년에 일반에 공개되었습니다. [상표권](/ko/glossary/trademark/) 보유자를 위한 일출(sunrise) 기간과 단계적으로 낮아지는 수수료가 적용된 조기 접근 창구를 거쳐, .app은 2018년 5월 일반 등록 단계에 진입하면서 누구나 표준 가격으로 사용 가능한 이름을 등록할 수 있게 되었습니다. Google은 이를 일반 등록이 가능한 최초의 내장 HTTPS 보안 TLD로 홍보했습니다. 이후 앱 관련 제품의 인지도 높은 공간으로 자리 잡았으나, 기존 확장자에 비하면 여전히 틈새 시장에 머무르고 있습니다.

## .app 활용 방식

- **모바일 앱 랜딩 페이지** — App Store 및 Google Play 링크, 릴리스 노트, 지원 정보를 한곳에 모은 허브. 예: `yourapp.app`.
- **웹 앱 및 SaaS** — 마케팅용 `.com`과 분리된 제품 인터페이스 및 로그인 화면.
- **개발자 포트폴리오 및 사이드 프로젝트** — 정적 이력서 대신 실제 작동하는 도구를 보여주는 `name.app` 또는 `project.app`.
- **문서, 상태 페이지, API 포털** — docs와 가동 상태 페이지를 위한 전용 `.app` 서브사이트.
- **제품 런칭** — 포화 상태인 짧은 `.com` 시장과 달리 찾기 쉬우면서도 간결하고 브랜드화 가능한 이름.

**적합하지 않은 경우:** 콘텐츠 중심 사이트(블로그, 뉴스, 에디토리얼), 익숙한 `.com`이 유리한 오프라인 로컬 비즈니스, 혹은 HTTPS 제공이 불가능하거나 의사가 없는 프로젝트 — 유효한 인증서 없이는 `.app` 사이트가 열리지 않습니다.

## .app을 사용하는 주목할 만한 사이트

- **cash.app** — Block의 개인 간 결제 서비스로, 브랜드 이름과 URL이 완벽하게 일치하는 가장 높은 인지도의 .app 브랜드입니다.
- **google.app** — 운영자인 Google Registry가 직접 프로젝트와 리다이렉트에 이 네임스페이스를 사용합니다.
- **ohdear.app** — Google Registry가 플래그십 .app 사이트로 소개한 잘 알려진 웹사이트 모니터링 서비스입니다.

이들은 실제 사용자, 로그인, 결제를 처리하는 제품으로, .app이 단순한 실험이 아닌 진지한 애플리케이션에서도 신뢰받고 있다는 합리적인 신호입니다.

## .app과 다른 도메인 비교

| | .app | [.com](/ko/tld/com) | [.dev](/ko/tld/dev) | [.io](/ko/tld/io) |
| --- | --- | --- | --- | --- |
| 의미 | 애플리케이션 / 소프트웨어 | 범용, 보편적 | 개발자 / 엔지니어링 | 테크 / 스타트업 연상 |
| 레지스트리 | Google Registry | Verisign | Google Registry | Identity Digital |
| HTTPS 강제 | 예 (HSTS 프리로드) | 아니오 | 예 (HSTS 프리로드) | 아니오 |
| 짧은 이름 가용성 | 양호 | 매우 부족 | 양호 | 보통 |

게시하는 것이 애플리케이션 자체이고 URL이 그것을 나타내기를 원한다면 **.app**을 선택하세요. 설명성보다 폭넓은 친숙함이 중요하다면 **[.com](/ko/tld/com)**을, 개발자 도구 및 엔지니어링 청중을 대상으로 한다면 **[.dev](/ko/tld/dev)**를, 일반적인 테크 스타트업 느낌을 원한다면 **[.io](/ko/tld/io)**를 선택하세요. .app과 [.dev](/ko/tld/dev)는 동일한 레지스트리를 공유하며 HTTPS 의무화 모델도 동일합니다.

## .app을 선택하는 이유

- **내장 보안.** HSTS 프리로드를 통해 강제되는 HTTPS 덕분에 "SSL 활성화를 잊었다"는 실패 사례가 없으며, 방문자가 비보안 페이지 경고를 마주치는 일도 없습니다.
- **즉각적인 의미 전달.** 확장자 자체가 제품을 설명합니다. 이는 도메인 확장자 중 드문 특성으로, 클릭률과 기억률을 높이는 데 유용합니다.
- **가용성.** `.com`에서는 이미 사라진 짧은 한 단어 이름들이 .app에서는 아직 등록 가능합니다.
- **범용·글로벌 취급.** 국가 제한이 없어 국제 청중에게 적합합니다.

## 고려해야 할 사항

- **HTTPS는 선택이 아닌 필수입니다.** 현대 브라우저에서 사이트가 열리려면 반드시 유효한 TLS 인증서를 설정해야 합니다. Vercel, Netlify, Cloudflare, GitHub Pages 같은 호스팅에서는 간단하지만, 이는 반드시 충족해야 하는 조건입니다.
- **.com보다 낮은 기본 인지도.** 일부 비기술적 사용자들은 여전히 `.com`을 기본으로 입력하는 경향이 있으므로, 매칭되는 `.com`을 사용할 수 있다면 확보해 두는 것이 좋습니다.
- **좁은 의미.** 확장자의 강점인 "이것은 앱이다"라는 메시지는 동시에 한계가 되기도 합니다. 소프트웨어와 제품에는 잘 어울리지만, 블로그나 자선단체, 동네 가게에는 어색하게 읽힙니다.
- **단일 운영자 네임스페이스.** .app과 .dev는 모두 Google Registry가 운영하므로, 정책 및 로드맵 결정이 하나의 운영자에 집중됩니다.

## .app 도메인은 누가 등록할 수 있나요?

**등록 제한: 전면 개방.** .app은 제한 없는 일반 gTLD입니다. 자격증, 회원 가입, 업종, 현지 거주 요건이 없으며 전 세계 누구나 사용 가능한 이름을 등록할 수 있습니다. 유일한 실질적 조건은 기술적인 것입니다. 이 존이 HSTS 프리로드 목록에 등재되어 있어, .app 도메인은 유효한 HTTPS 인증서를 연결하기 전까지 브라우저에서 열리지 않습니다. 인증서 없이도 이름을 구매·보유할 수 있지만, 웹사이트로는 접속되지 않습니다.

그 외에는 표준 gTLD 정책이 적용됩니다. 상표권 보유자를 위한 일출 단계가 출시 시 진행되었으며, IDN 이름과 DNSSEC가 지원되고, 등록대행사는 [WHOIS 개인정보 보호](/ko/glossary/whois-privacy/) 또는 프록시 서비스를 제공합니다(현행 ICANN 정책에 따라 대부분의 개인 정보는 이미 삭제 처리됩니다). 이전, 갱신, 상환 [유예 기간](/ko/glossary/grace-period/)은 일반 gTLD 규정을 따릅니다. 공식 규정 문서는 [ICANN .app 레지스트리 협약](https://www.icann.org/en/registry-agreements/details/app)이며, 출시 및 정책 세부 사항은 [Google Registry](https://www.registry.google/)에서 확인할 수 있습니다.

## .app 가격 및 가치

이 정적 페이지에는 구체적인 가격이 표시되지 않지만, .app의 가격 체계에 대해 설명하겠습니다. .app은 저가형이 아닌 표준 새로운 gTLD 등급에 속하며, 다른 프리미엄 느낌의 확장자들과 비슷한 수준으로 책정됩니다. **첫해 가격과 갱신 가격이 다를 수 있으며**, 이름을 보유하는 한 갱신 비용이 계속 발생하므로 지속적인 비용을 고려해야 합니다. 짧은 이름, 사전 단어, 또는 그 외 인기 있는 이름의 일부는 **프리미엄**으로 분류되어 레지스트리가 설정한 높은 요금이 부과됩니다. 비용의 결정 요인은 이름 길이, 키워드 가치, 프리미엄 여부이며, 확장자 자체가 아닌 이러한 요소들이 최저 가격을 결정합니다.

## 신뢰도 및 이메일 전송성

.app은 저렴하거나 스팸성 도메인이 아닌 **현대적이고 안전하며 개발자 신뢰도가 높은** 도메인으로 인식됩니다. 두 가지 요인이 이를 뒷받침합니다. Google이 운영한다는 사실, 그리고 의무 HTTPS 모델로 인해 비보안 .app 사이트가 존재하지 않아 초저가 TLD에서 흔한 일회성 남용 패턴이 억제된다는 점입니다.

다만, 최신 gTLD는 단순히 인지도 기간이 짧다는 이유로 기존 확장자보다 스팸 필터에서 약간 더 신중하게 취급받기도 합니다. .app 도메인으로 이메일을 발송한다면 일반 도메인과 동일한 방식으로 대응하면 됩니다. 올바른 **SPF, DKIM, DMARC** 레코드를 게시하고, 발송 볼륨을 점진적으로 늘리며, 발송 목록을 깨끗하게 유지하세요. 이를 제대로 실행하면 .app의 이메일 전송성은 주류 확장자와 동등한 수준입니다.

## 브랜딩 및 네이밍 팁

가장 효과적인 .app 이름은 "app"이 브랜드를 단순히 뒤따르는 것이 아니라 브랜드를 완성하는 경우입니다. `cash.app`이 잘 작동하는 이유는 전체가 하나의 구(phrase)처럼 읽히기 때문입니다. 확장자와 싸우기보다 의미를 더해줄 때 사용하세요(`tracker.app`, `notes.app`). "닷 앱"은 구두로 전달하기에도 명확하므로, 이름은 짧고 발음하기 쉽게 유지하세요. 대상이 비기술적 사용자라면 직접 입력 트래픽의 안전망으로 매칭되는 `.com`을 확보하는 것도 고려하세요. 하이픈과 헷갈리는 철자는 어디서나 그렇듯 기억하기 어렵게 만듭니다.

## Namefi에서 .app 도메인 등록하는 방법

1. [Namefi](https://namefi.io)에서 원하는 이름을 검색하여 .app 가용성을 확인하세요.
2. 이름을 선택하고 표준 등록인지 프리미엄 등록인지 확인하세요.
3. 등록 후 도메인을 호스팅 서버에 연결하고 HTTPS를 설정하여 사이트가 정상적으로 열리도록 하세요.

Namefi는 투명한 가격 정책을 갖춘 [ICANN 공인 등록대행사](/ko/glossary/accredited-registrar/)로, Web2와 [Web3](/ko/glossary/web3/)를 연결합니다. .app을 등록하고 선택적으로 온체인 자산(NFT)으로 발행하여 더 쉬운 이전과 거래를 가능하게 하면서도, 완전한 ICANN 준수 소유권과 빠른 DNS를 유지할 수 있습니다. 토큰화에 대해 먼저 알고 싶다면 [토큰화된 도메인이란?](/ko/blog/what-are-tokenized-domains)을 참조하세요.

[Namefi에서 .app 도메인 등록하기](https://namefi.io)

## 자주 묻는 질문

### 누구나 .app 도메인을 등록할 수 있나요?

네. .app TLD는 자격 제한이 없는 개방형 일반 최상위 도메인으로, 누구든지 사용 가능한 이름을 등록할 수 있습니다. 유일한 실질적 조건은 법적인 것이 아니라 기술적인 것입니다. .app 사이트가 브라우저에서 열리려면 유효한 HTTPS 인증서가 필요합니다.

### .app 도메인이 SEO에 영향을 미치나요?

Google은 .app을 표준 일반 gTLD로 취급하며, 고유한 순위 이점이나 불이익을 부여하지 않습니다. .app은 HTTPS를 강제하므로 Google의 보안 연결 권장 사항을 자동으로 충족하게 되며, 이는 가벼운 긍정적 신호로 작용합니다.

### 누가 .app 도메인을 등록해야 하나요?

모바일 앱 개발사, SaaS 및 웹 앱 빌더, 프로젝트를 선보이는 개발자에게 가장 잘 맞습니다. 이 확장자는 "실제로 작동하는 애플리케이션"이라는 메시지를 전달하므로 제품 허브, 다운로드 페이지, 로그인 포털에 이상적입니다.

### .app 도메인에 왜 HTTPS가 필요한가요?

Google Registry가 출시 전에 .app 전체 존(zone)을 브라우저 HSTS 프리로드 목록에 추가했습니다. 그에 따라 브라우저는 모든 .app 요청을 자동으로 HTTPS로 업그레이드하며, 유효한 TLS 인증서 없이는 도메인이 열리지 않습니다. 이 설정은 선택 해제가 불가능합니다.

### .app은 WHOIS 개인정보 보호를 지원하나요?

네. 일반 gTLD인 .app은 표준 등록대행사의 WHOIS 개인정보 보호 또는 프록시 서비스를 지원하며, 현행 ICANN 정책에 따라 공개 WHOIS 결과에서 대부분의 개인 등록자 정보는 이미 삭제 처리됩니다.

## 관련 리소스

- [.dev 도메인](/ko/tld/dev) — 동일한 HTTPS 의무화 모델을 갖춘 Google Registry의 형제 gTLD.
- [.com 도메인](/ko/tld/com) — 비교 기준이 되는 범용 기본 도메인.
- [.io 도메인](/ko/tld/io) 및 [.tech 도메인](/ko/tld/tech) — 기타 기술 지향 확장자.
- [토큰화된 도메인이란?](/ko/blog/what-are-tokenized-domains) — Namefi로 등록 시 도메인을 온체인에서 발행하는 방법.
- [도메인 용어 가이드](/ko/blog/domain-terminology-guide) — gTLD, DNSSEC 등의 정의.
- 용어집: [ICANN](/ko/glossary/icann), [등록대행사](/ko/glossary/registrar), [DNS](/ko/glossary/dns), [DNSSEC](/ko/glossary/dnssec).
