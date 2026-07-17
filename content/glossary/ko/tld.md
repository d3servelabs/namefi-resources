---
title: TLD
date: '2026-05-22'
language: ko
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 최상위 도메인(TLD)은 도메인 이름에서 가장 오른쪽에 위치한 레이블로, .com, .org, .de 등이 해당되며 ICANN 감독 하에 IANA 루트 존을 통해 위임됩니다.
keywords: ['TLD', '최상위 도메인', 'gTLD', 'ccTLD', '신규 gTLD', 'DNS', 'IANA', 'ICANN', '루트 존', '도메인 레지스트리']
also_known_as: ['최상위 도메인', 'Top-Level Domain']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /ko/blog/what-is-a-tld/
  - /ko/blog/top-tlds-to-secure-for-your-startup/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/how-tld-affects-domain-value/
  - /ko/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/best-tlds-by-industry/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/icann/
  - /ko/glossary/registry/
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/web3/
---

**TLD**(*top-level domain*), 즉 **최상위 도메인**은 완전한 도메인 이름에서 가장 오른쪽에 위치하는 레이블로, 마지막 점(.) 뒤에 오는 부분입니다. `www.example.com`에서 TLD는 `.com`이며, `bbc.co.uk`에서는 `.uk`입니다. TLD는 [DNS](/ko/glossary/dns/) 계층 구조의 최상위에 위치하며, 다른 모든 도메인 이름이 구축되는 기반입니다.

## 도메인 이름에서 TLD의 위치

[DNS](/ko/glossary/dns/)는 계층적 트리 구조로 이루어진 명명 체계입니다. 도메인 이름을 오른쪽에서 왼쪽으로 읽으면 이 계층 구조가 드러납니다.

1. **루트(`.`)** — 맨 오른쪽 끝에 있는 보이지 않는 점입니다. [루트 존](/ko/glossary/root-zone/)은 권위 있는 출발점으로, [IANA](/ko/glossary/iana/)가 관리하는 소수의 서버 집합이 모든 TLD의 권위 있는 네임 서버 정보를 보유합니다.
2. **TLD** — 오른쪽에서 첫 번째로 보이는 레이블(`.com`, `.org`, `.de`)입니다. 각 TLD는 [레지스트리](/ko/glossary/registry/) 운영자가 운영하는 고유한 권위 있는 네임 서버를 갖습니다.
3. **[2단계 도메인](/ko/glossary/second-level-domain/)** — TLD 바로 왼쪽의 레이블(예: `example.com`에서 `example`)입니다. 등록자가 레지스트라를 통해 구매하는 부분입니다.
4. **서브도메인** — 왼쪽으로 더 이어지는 레이블(`www`, `mail`, `blog`)로, 2단계 도메인을 관리하는 주체가 제어합니다.

리졸버가 `www.example.com`을 조회할 때, 먼저 루트 서버에 `.com`의 위치를 묻고, 그 다음 `.com` 레지스트리 네임 서버에 `example.com`의 위치를 묻고, 마지막으로 `example.com`의 네임 서버에 `www` 레코드를 요청합니다. 이 위임 연쇄 방식 덕분에 단일 서버가 모든 도메인 이름을 알 필요가 없습니다.

## TLD의 유형

IANA는 TLD를 다음과 같은 카테고리로 분류합니다.

| 카테고리 | 예시 | 비고 |
|---|---|---|
| **[gTLD](/ko/glossary/gtld/)** (일반) | `.com`, `.net`, `.org`, `.info` | 원래 제한이 없거나 광범위한 범위를 가진 TLD; 가장 널리 사용되는 유형 |
| **[ccTLD](/ko/glossary/cctld/)** (국가 코드) | `.de`, `.uk`, `.jp`, `.us` | ISO 3166-1에 따라 부여된 두 글자 코드; 통상 국가 기관이 관할 |
| **sTLD** (스폰서) | `.gov`, `.edu`, `.mil`, `.museum` | 등록 자격을 제한하는 후원 기관이 있는 gTLD의 하위 유형 |
| **[신규 gTLD](/ko/glossary/new-gtld/)** | `.app`, `.blog`, `.shop`, `.xyz` | 2013년 이후 ICANN의 확장 프로그램을 통해 도입 |
| **인프라** | `.arpa` | 기술적 DNS 인프라 전용으로 예약됨; 일반 등록 불가 |
| **테스트 / 예약** | `.example`, `.localhost`, `.invalid` | RFC 2606에 정의됨; 공개 루트에서 위임되지 않음 |

`.arpa`는 현재 유일한 인프라 TLD입니다. IP 주소를 호스트 이름으로 역방향 조회하는 역방향 조회 존을 호스팅합니다(IPv4의 경우 `in-addr.arpa`, IPv6의 경우 `ip6.arpa`).

국가 코드 TLD는 원래 해당 국가의 등록자에게만 제한되었으나, 많은 경우 전 세계 등록이 가능하도록 자유화되었습니다. `.io`(영국령 인도양 영토)와 `.co`(콜롬비아)는 전 세계적으로 일반 대안으로 널리 사용되는 대표적인 예입니다.

## TLD의 생성과 위임

위임된 모든 TLD의 권위 있는 목록은 **IANA 루트 존 데이터베이스**([iana.org/domains/root/db](https://www.iana.org/domains/root/db))에 관리되며, 각 TLD와 권위 있는 네임 서버 집합 및 지정된 [레지스트리](/ko/glossary/registry/) 운영자가 매핑되어 있습니다.

**ccTLD 위임**은 [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591)(Postel, 1994)에 규정된 정책을 따릅니다. 두 글자 코드는 ISO 3166-1에서 파생되며, 각 코드는 해당 국가 또는 영토의 공익을 위해 봉사할 것으로 기대되는 수탁자(통상 정부 기관 또는 국가 공인 기관)에게 위임됩니다. [IANA](/ko/glossary/iana/)는 ccTLD 관할권이 이전될 때 재위임 요청을 검토합니다.

**신규 gTLD**는 [ICANN](/ko/glossary/icann/)의 신청 라운드를 통해 생성됩니다. 첫 번째 대규모 확장은 2012년에 시작되었으며, ICANN이 세 글자 이상의 모든 문자열을 일반 TLD로 신청할 수 있도록 개방했습니다. 신청자는 기본 수수료를 납부하고, 기술적 역량과 재정적 안정성 평가를 받으며, 이의 제기 절차(커뮤니티, 도덕성, 지식재산권, 문자열 혼동 사유 포함)를 통과하고, ICANN과 레지스트리 계약을 체결해야 합니다([ICANN 신규 gTLD 프로그램](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)). 해당 라운드에서 1,200개 이상의 신규 gTLD가 위임되었습니다. 2026년에는 두 번째 신청 라운드가 개시되어 네임스페이스가 더욱 확장되었습니다.

위임이 완료되면 TLD의 [레지스트리](/ko/glossary/registry/) 운영자는 그 아래 등록된 모든 2단계 도메인의 권위 있는 데이터베이스를 관리하고, 존의 네임 서버를 운영하며, 레지스트라가 등록자에게 도메인을 판매할 때 따라야 하는 정책(가격, 자격 요건, 길이 규정)을 설정합니다.

## TLD 예시 및 주요 TLD

| TLD | 운영자 | 비고 |
|---|---|---|
| `.com` | Verisign | 등록 수량 기준 최대 TLD; 원래 상업용 목적 |
| `.net` | Verisign | 원래 네트워크 인프라 제공업체용; 현재는 제한 없음 |
| `.org` | Public Interest Registry | 원래 비영리 단체용; 현재는 대부분 제한 없음 |
| `.gov` | GSA(미국) | 미국 연방, 주, 지방 정부 기관 전용 |
| `.edu` | Educause | 미국 공인 고등 교육 기관 전용 |
| `.uk` | Nominet | 영국 ccTLD; 일반적으로 `.co.uk` 같은 2단계 레이블로 등록 |
| `.de` | DENIC | 독일 ccTLD; 수량 기준 최대 ccTLD 중 하나 |
| `.io` | ICANN / 레지스트리 이전 진행 중 | 영국령 인도양 영토 코드; 기술 기업들이 광범위하게 채택 |
| `.app` | Google Registry | 신규 gTLD; 레지스트리 정책에 따라 HTTPS 필수 |
| `.xyz` | XYZ.com LLC | 신규 gTLD; 저렴한 가격으로 대규모 등록량 확보 |

## TLD, 가치, 그리고 SEO

검색 엔진은 TLD를 두 가지 방식으로 처리합니다.

**지역 타겟팅:** [ccTLD](/ko/glossary/cctld/)는 지리적 신호를 보냅니다. Google Search Central에 따르면 `.de` 사이트는 일반적으로 독일어 사용자를 대상으로 하는 것으로 해석되며, Google Search Console에서는 일반 TLD에 대해 명시적 지역 타겟팅을 허용하지만 ccTLD 신호는 자동으로 적용됩니다. 단일 도메인으로 전 세계 사용자를 대상으로 하는 비즈니스라면 일반 TLD를 선택하는 것이 의도치 않은 지역 제한을 피할 수 있습니다.

**순위:** 대부분의 경우 TLD 자체는 순위 요소가 아닙니다. Google은 [신규 gTLD를 다른 TLD와 동일하게 처리](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains)하며, `.com`이 `.app`이나 `.xyz`보다 본질적으로 더 높은 순위를 갖지 않는다고 명시했습니다. 중요한 것은 확장자가 아니라 도메인의 전반적인 권위와 관련성입니다. `.jobs`나 `.travel` 같은 일부 오래된 키워드 중심 TLD는 암묵적인 맥락 신호를 갖지만, 이는 콘텐츠 품질이나 백링크 프로필에 비해 미미한 영향을 미칩니다.

**브랜드 인지도와 기억 용이성:** 도메인 투자자와 마케터들은 특히 `.com`과 같은 잘 확립된 짧은 TLD가 강력한 최종 사용자 인지도를 가지며, 이것이 검색 결과의 클릭률, 직접 접속, 신뢰도에 영향을 미칠 수 있다고 관찰합니다. 이는 알고리즘적 요소가 아닌 시장 및 행동 역학에 해당합니다.

**프리미엄 및 애프터마켓 가격:** TLD의 인지 가치는 그 아래에 있는 [2단계 도메인](/ko/glossary/second-level-domain/) 이름의 유통 시장 가격에 영향을 미칩니다. `.com` 도메인은 평균적으로 신규 확장자 아래의 동일한 이름보다 더 높은 유통 시장 가격을 형성하는데, 이는 기술적 우위가 아닌 소비자 친숙도를 반영합니다.

## TLD와 토큰화 도메인

여러 블록체인 기반 명명 시스템이 IANA 루트 존 밖에서 운영되며, 사실상 호환 가능한 리졸버나 브라우저 확장에서만 해석되는 대체 TLD를 도입했습니다. 예로는 `.eth`(이더리움 네임 서비스), `.crypto`, `.nft` 등이 있습니다. 이들은 [IANA](/ko/glossary/iana/)를 통해 위임되지 않으며 기본적으로 글로벌 DNS에서 해석되지 않지만, 브리지와 게이트웨이 서비스를 통해 부분적인 상호 운용성을 제공할 수 있습니다.

IANA 관할 네임스페이스 내에서, [2단계 도메인](/ko/glossary/second-level-domain/) 이름의 토큰화(`example.com` 같은 이름의 소유권을 블록체인 토큰으로 표현)는 TLD 자체와는 별개의 개념입니다. TLD는 그 아래 개별 도메인 이름의 소유권이 어떻게 기록되는지와 관계없이 동일한 레지스트리 관할 하에 유지됩니다.
