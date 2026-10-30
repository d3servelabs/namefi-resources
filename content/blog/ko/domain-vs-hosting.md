---
title: "도메인과 호스팅의 차이: 웹사이트 공개에 필요한 서비스"
date: '2026-09-15'
updated: '2026-10-20'
language: ko
tags: ['domains', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-basics
ogImage: ../../assets/domain-vs-hosting-og.jpg
format: guide
description: "도메인 이름과 웹 호스팅의 차이, 각 서비스의 역할, 서로 다른 업체를 이용할 때 도메인과 호스팅을 연결하는 방법을 알아봅니다."
keywords: ['도메인 호스팅 차이', '도메인 이름과 웹 호스팅 차이', '도메인이 있어도 호스팅이 필요한가', '도메인과 호스팅의 차이점', '도메인 호스팅 연결', '웹사이트 호스팅', '도메인 등록', 'DNS 호스팅', '이메일 호스팅', '맞춤 도메인']
relatedArticles:
  - /ko/blog/what-is-domain/
  - /ko/blog/domain-terminology-guide/
  - /ko/blog/set-up-email-with-your-own-domain/
  - /ko/blog/subdomain-vs-subdirectory/
  - /ko/blog/transfer-domain-to-another-registrar/
relatedTopics:
  - /ko/topics/domain-basics/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-investor-field-guide/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/dns-record-types/
  - /ko/glossary/subdomain/
  - /ko/glossary/tld/
---

**도메인 이름은 웹사이트의 주소입니다. 웹 호스팅은 해당 주소에서 제공할 페이지를 저장하거나 생성하는 서비스입니다.** 도메인을 등록한다고 웹사이트나 메일함이 생기지는 않습니다. 웹사이트와 메일함을 위한 서비스도 별도로 준비해야 합니다. [ICANN도 도메인과 웹·이메일 서비스를 명확히 구분합니다.](https://www.icann.org/resources/pages/about-domain-names-2018-08-30-en#:~:text=You%20must%20purchase)

이미 도메인이 있다면 웹사이트 제작 도구나 게시 서비스에 호스팅이 포함되어 있는지 확인해야 합니다. 호스팅이 포함되어 있다면 도메인 연결만으로 충분할 수 있습니다. 호스팅이 없다면 사이트를 게시할 서비스를 마련해야 합니다. 이 글에서는 현재 이용 중인 서비스를 확인하고 각 서비스를 연결하는 방법을 설명합니다. 도메인 이름 자체의 구조는 [도메인 이름이란 무엇인가](/ko/blog/what-is-domain/)에서 확인할 수 있습니다.

## 도메인, 호스팅, DNS, 이메일은 서로 다른 역할을 합니다

![도메인 이름은 사이트를 식별하고, 호스팅은 파일과 서비스를 제공합니다.](../../assets/domain-vs-hosting-01-comparison.jpg)

한 업체가 여러 서비스를 묶어서 판매하더라도 각 서비스의 역할은 구분해서 살펴보세요.

| 서비스 | 제공하는 기능 | 계정에서 확인할 항목 |
| --- | --- | --- |
| 도메인 등록 | 등록 기간 동안 특정 이름을 사용할 권리 | 등록자 정보, 만료일, 갱신 및 네임서버 설정 |
| 웹 호스팅 | 웹사이트를 제공하는 서버 서비스 | 사이트 파일 또는 게시 도구, 배포 설정 및 맞춤 도메인 설정 |
| DNS 호스팅 | 이름을 주소나 다른 서비스에 연결하는 레코드 | 현재 사용 중인 DNS 영역과 레코드 |
| 이메일 호스팅 | 메일함을 운영하는 서비스 | 사용자, 받은편지함, 발신 설정 및 메일 라우팅 안내 |

웹 호스팅은 파일을 그대로 전달하는 사이트뿐 아니라 소프트웨어가 페이지를 생성하는 사이트도 지원합니다. 따라서 일반적인 ‘파일 업로드’ 관리 화면이 없어도 사이트는 호스팅 서비스를 이용할 수 있습니다. [MDN은 정적 웹 서버와 동적 웹 서버를 설명합니다.](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server#summary)

[DNS](/ko/glossary/dns/) 호스팅은 웹 호스팅의 다른 이름이 아니라 별도의 서비스입니다. 예를 들어 DNSimple은 도메인 등록을 다른 [등록대행자](/ko/glossary/registrar/)에 유지하면서 DNSimple의 DNS 서비스를 이용할 수 있다고 명시합니다. [DNSimple의 서비스 문서에서 서비스 간 구분을 확인할 수 있습니다.](https://support.dnsimple.com/articles/dnsimple-services/#domain-registration-transfer-and-renewal)

추가 요금제에 가입하기 전에 표를 참고해 묶음 상품을 확인하세요. 웹사이트를 공개할 수 있는지, 보유한 맞춤 도메인을 지원하는지, 실제 메일함을 제공하는지 확인해야 합니다. 계정에 도메인이 표시된다는 사실만으로는 서비스 포함 여부를 알 수 없습니다.

## 서로 다른 업체를 이용해도 브라우저는 DNS를 거쳐 웹 호스트에 접속합니다

![브라우저는 먼저 DNS로 주소를 조회한 다음 웹 호스트에 페이지를 요청합니다.](../../assets/domain-vs-hosting-02-request-path.jpg)

예를 들어 등록대행자에서 `example.com`을 관리하고, GitHub Pages에 사이트를 게시하며, 이메일 업체에서 `hello@example.com`을 운영한다고 가정해 보겠습니다. 도메인과 이메일 주소는 설명을 위한 예시이며 실제로 설정할 계정이 아닙니다.

방문자가 사이트를 열면 브라우저는 DNS를 이용해 목적지 주소를 찾습니다. 브라우저가 웹 서버에 콘텐츠를 요청하면 웹 서버는 페이지를 반환합니다. DNS는 주소를 알려주고, 웹 서버는 웹사이트 콘텐츠를 제공합니다. 이 설명은 캐시와 다른 기반 시설을 생략한 간단한 요청 흐름입니다. [MDN은 요청 과정을 단계별로 설명합니다.](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works#so_what_happens_exactly)

등록대행자가 담당하는 등록 관리 업무는 페이지 요청 흐름과 별개입니다. GitHub Pages를 이용하려고 도메인 등록을 GitHub로 이전할 필요는 없습니다. GitHub의 설정 문서는 사이트를 설정한 다음 DNS 업체에서 알맞은 레코드를 추가하도록 안내합니다. [GitHub의 맞춤 도메인 설정 안내를 확인하세요.](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

서비스별 역할을 구분하면 변경할 위치를 찾기 쉽습니다.

- 웹사이트 디자인은 게시 서비스나 호스팅 서비스에서 변경합니다.
- 웹사이트가 연결되는 목적지를 바꾸려면 DNS를 수정해야 할 수 있습니다.
- 등록대행자 변경은 도메인 등록 관리 업무에 해당합니다.
- 새 메일함은 이메일 서비스에서 만듭니다.

각 업무를 어느 계정에서 관리하는지 적어 두세요. 관리 계정을 정리하지 않으면 다른 서비스에서 발생한 웹사이트 문제를 도메인 판매 업체에 문의하기 쉽습니다.

## 이메일을 유지하면서 웹사이트를 연결하세요

**웹 호스트의 맞춤 도메인 설정**부터 시작하세요. `www.example.com`처럼 사용할 정확한 호스트 이름을 추가하고, 호스팅 업체가 제공하는 최신 DNS 설정 안내를 확인하세요. 그런 다음 현재 도메인의 DNS 레코드를 어디에서 관리하는지 확인하세요.

GitHub Pages의 설정 과정이 구체적인 예입니다. 저장소의 Pages 설정에서 맞춤 도메인을 지정한 다음 필요한 DNS 레코드를 추가합니다. GitHub의 안내는 `example.com` 같은 루트 도메인과 `www.example.com` 같은 서브도메인을 구분하며, HTTPS 설정과 DNS 확인 방법도 설명합니다. 다른 웹 호스트를 설정할 때 GitHub의 목적지 주소를 그대로 복사하지 마세요. [GitHub Pages를 이용한다면 해당하는 GitHub 설정 안내를 따르세요.](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

변경 내용을 저장하기 전에 기존 레코드와 수정할 내용을 비교하세요.

1. 현재 DNS 설정의 사본을 저장하세요.
2. 웹 호스트가 추가하거나 교체하도록 안내한 웹사이트 레코드를 정확히 확인하세요.
3. 웹사이트 연결과 관계없는 메일 레코드와 확인용 레코드는 유지하세요.
4. 웹 호스트가 네임서버 변경을 요구한다면 먼저 전체 DNS 이전을 계획하세요.
5. 변경 후 사용할 웹사이트 주소, HTTPS, 메일 수신을 각각 확인하세요.

네임서버를 바꾸면 DNS를 제공하는 곳이 달라집니다. Google의 웹사이트 연결 안내는 네임서버를 변경할 때 메일 레코드와 확인용 레코드를 새 DNS 서비스에 복사해야 한다고 경고합니다. 웹사이트와 이메일은 별도 서비스이지만, 웹사이트 연결 작업이 이메일에 영향을 줄 수 있는 이유입니다. [Google의 네임서버 변경 안내를 확인하세요.](https://knowledge.workspace.google.com/admin/domains/connect-your-website-to-a-domain-registered-through-google)

발신 메일 서버는 **MX 레코드**를 조회해 수신 메일 서버를 찾습니다. 따라서 웹사이트가 정상적으로 열린다고 이메일 설정까지 완료되었다고 볼 수는 없습니다. [Google의 MX 문서는 조회 과정을 설명합니다.](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace)

레코드 이름이 낯설다면 수정 전에 [DNS 레코드 유형 (A, AAAA, CNAME, MX, TXT)](/ko/glossary/dns-record-types/)을 참고하세요. 업체마다 DNS 관리 화면에서 이름과 값을 입력하는 방식이 다르므로, 이용 중인 업체의 최신 안내도 함께 확인하세요.

[Namefi DNS 조회](https://namefi.io/domain-tools/dns)로 업체가 지정한 웹사이트 또는 메일 라우팅 레코드를 정확히 확인하세요. 결과와 함께 호스트 이름, 레코드 유형, 선택한 리졸버와 관측 시각을 기록하세요. 그런 다음 앞서 설명한 웹사이트와 이메일 테스트를 각각 진행하세요.

## 청구 내역과 도메인 관리 권한을 확인하세요

묶음 상품을 선택하기 전에 계정별로 확인할 항목을 간단히 정리하세요.

- **도메인:** 등록자로 누구를 기재했으며, 누가 로그인하고 갱신 알림을 받나요?
- **웹사이트:** 어떤 요금제가 사이트 공개를 유지하며, 요금제 이용이 끝나면 어떻게 되나요?
- **이메일:** 메일함이 포함되어 있으며, 어떤 구독으로 메일함 비용을 내나요?
- **DNS:** 도메인 등록을 이전하거나 다른 상품을 해지해도 DNS 서비스를 계속 이용할 수 있나요?
- **서비스 이전:** 사이트와 DNS 설정을 내보낼 수 있나요? 업체는 이전에 어떤 조건을 요구하나요?

도메인 갱신 내역은 다른 서비스와 구분해 기록하세요. ICANN은 도메인 등록에 정해진 기간이 있으며, 이름을 계속 사용하려면 갱신해야 한다고 설명합니다. 갱신 방법과 비용은 등록대행자마다 다릅니다. 호스팅 비용을 결제했다는 사실만으로는 도메인 갱신을 확인할 수 없습니다. [ICANN의 갱신 안내를 확인하세요.](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en)

웹사이트를 공개하지 않고 도메인만 유지할 수도 있습니다. 이름을 확보해 두거나 이메일에만 도메인을 사용할 수 있습니다. 운영하려는 용도에 맞춰 서비스를 선택하고, 각 서비스의 관리 권한과 갱신 가능 여부를 확인하세요. 핵심은 구체적입니다. **도메인 이름, 웹사이트, 메일함은 각각 관리 주체와 정상적으로 작동하는 서비스가 필요합니다.**

## 출처에서 설명과 설정 안내를 확인할 수 있습니다

- ICANN — [도메인 이름 안내](https://www.icann.org/resources/pages/about-domain-names-2018-08-30-en#:~:text=You%20must%20purchase). ‘FAQs’ 앞의 마지막 문단에서 도메인과 웹·이메일 서비스를 구분합니다. 조회일: 2026-09-15.
- MDN — [웹 서버란 무엇인가?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server#summary). ‘Summary’에서 정적 서버와 동적 서버를 설명합니다. 조회일: 2026-09-15.
- DNSimple — [DNSimple 서비스](https://support.dnsimple.com/articles/dnsimple-services/#domain-registration-transfer-and-renewal). ‘Domain registration, transfer, and renewal’에서 독립적인 DNS 호스팅을 설명합니다. 조회일: 2026-09-15.
- MDN — [웹의 동작 원리](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works#so_what_happens_exactly). DNS 조회, HTTP 요청 및 응답 순서를 설명합니다. 조회일: 2026-09-15.
- GitHub — [GitHub Pages 사이트의 맞춤 도메인 관리](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). ‘Configuring an apex domain’과 ‘Configuring a subdomain’을 참고하세요. 조회일: 2026-09-15.
- Google Workspace — [Google을 통해 등록한 도메인에 웹사이트 연결](https://knowledge.workspace.google.com/admin/domains/connect-your-website-to-a-domain-registered-through-google). ‘If NS changed: add Google Workspace services to your web host’를 참고하세요. 조회일: 2026-09-15.
- Google Workspace — [MX 레코드 설정](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace). 문서 첫 부분에서 수신 메일 라우팅을 설명합니다. 조회일: 2026-09-15.
- ICANN — [도메인 이름 갱신과 만료](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en). 질문 1–2에서 등록 기간과 갱신 방법을 설명합니다. 조회일: 2026-09-15.
