---
title: TLD(최상위 도메인)란 무엇인가? 완전 가이드
date: '2026-06-10'
language: ko
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: choosing-a-tld
format: explainer
description: TLD는 .com이나 .io처럼 도메인 이름에서 마지막 점 이후에 오는 부분입니다. TLD의 의미, 종류(gTLD, ccTLD, 스폰서드, 신규 gTLD, IDN), 그리고 선택 방법을 알아보세요.
keywords: ['tld', 'tld 의미', 'tld란', '최상위 도메인이란', '최상위 도메인', 'tld 정의', 'tld 종류', '도메인 확장자란', '도메인 확장자', 'gTLD', 'ccTLD', '스폰서드 TLD', '신규 gTLD', 'IDN TLD', 'ICANN', 'IANA', '도메인 레지스트리', '도메인 등록 기관', 'TLD 선택', '인기 TLD', 'namefi']
relatedArticles:
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/ai-vs-io-domain/
  - /ko/blog/top-tlds-to-secure-for-your-startup/
  - /ko/blog/top-tlds-to-secure-for-your-saas/
  - /ko/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/best-tlds-by-industry/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/tld/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
  - /ko/glossary/dns/
---

## TLD란 무엇인가?

**TLD([최상위 도메인](/ko/glossary/tld/))**는 도메인 이름에서 **마지막 점 이후**에 오는 부분입니다. `namefi.io`에서 TLD는 `.io`이고, `google.com`에서는 `.com`, `wikipedia.org`에서는 `.org`입니다.

이것이 바로 **TLD의 정의**를 한 문장으로 표현한 것입니다. [도메인 이름](/ko/blog/what-is-domain/)에서 가장 오른쪽에 위치한 레이블이며, **도메인 확장자** 또는 **도메인 접미사**라고도 부르지만 기술적으로 정확한 표현은 *최상위 도메인*입니다. 인터넷 명명 체계의 최상위에 위치하기 때문에 이러한 이름이 붙었습니다.

> **TLD 의미, 간략하게:** *Top-Level Domain(최상위 도메인)* — 웹 주소 끝에 붙는 접미사(`.com`, `.org`, `.io`, `.ai`, `.xyz`)로, [도메인 네임 시스템(DNS)](/ko/glossary/dns/)에서 가장 높은 계층을 나타냅니다.

**"que es un TLD"**(스페인어) 또는 **"qu'est-ce qu'un TLD"**(프랑스어)를 검색하셨더라도 어떤 언어로든 답은 동일합니다. TLD는 도메인 이름의 끝 부분이며, [ICANN](/ko/glossary/icann/)의 감독 아래 전 세계 레지스트리 시스템에 의해 관리됩니다.

---

## TLD vs 도메인 vs 서브도메인

전체 도메인 이름은 여러 부분으로 구성되며, **오른쪽에서 왼쪽** 방향으로 읽습니다. TLD가 어디에 위치하는지 이해하면 대부분의 혼동이 해소됩니다.

```
blog . namefi . io
 │       │       │
 │       │       └── TLD (최상위 도메인)
 │       └────────── SLD (2차 도메인)
 └────────────────── 서브도메인
```

| 구성 요소 | 예시(`blog.namefi.io`에서) | 설명 |
|------|-------------------------------|------------|
| **TLD** | `.io` | 최상위 도메인 — 그 아래에 이름을 *등록*하는 접미사. |
| **2차 도메인(SLD)** | `namefi` | 직접 선택하고 소유하는 고유한 이름. |
| **서브도메인** | `blog` | 콘텐츠를 구성하기 위해 직접 생성하는 선택적 접두사. |

몇 가지 중요한 구분을 정리하면 다음과 같습니다.

- **도메인**(또는 *등록 가능한 도메인*)은 일반적으로 SLD와 TLD를 합친 것, 즉 `namefi.io`를 의미합니다. 실제로 등록하고 비용을 지불하는 대상입니다.
- **TLD**는 공유되는 끝 부분입니다. `.io`를 소유하는 것이 아니라, 그 *아래*에 있는 이름을 소유하는 것입니다.
- **서브도메인**은 도메인을 소유한 후 자유롭게 만들 수 있는 것으로, `mail.namefi.io`, `shop.namefi.io` 등이 그 예입니다.

도메인 구조에 대한 더 자세한 설명은 [도메인 이름이란?](/ko/blog/what-is-domain/)과 [도메인 용어 가이드](/ko/blog/domain-terminology-guide/)를 참고하세요.

---

## TLD의 종류

모든 TLD가 같은 것은 아닙니다. ICANN과 [IANA](/ko/glossary/iana/)는 TLD를 몇 가지 범주로 분류합니다. 흔히 접하게 되는 주요 **TLD 종류**를 소개합니다.

### 1. 일반 최상위 도메인(gTLD)

**gTLD**는 클래식하고 범용적인 확장자입니다. 원래 세트는 소규모이지만 전 세계적으로 널리 알려져 있습니다.

- [`.com`](/ko/tld/com/) — *상업용*, 전체 웹의 기본 확장자
- [`.net`](/ko/tld/net/) — 원래 네트워크 인프라용
- [`.org`](/ko/tld/org/) — 원래 단체 및 비영리 기관용
- [`.info`](/ko/tld/info/) — 정보 제공 사이트용

이들은 누구에게나 개방되어 있으며, 인터넷에서 가장 신뢰받고 유동성이 높은 확장자로 남아 있습니다.

### 2. 국가 코드 최상위 도메인(ccTLD)

**ccTLD**는 ISO 3166 국가 코드 목록을 기반으로 특정 국가나 지역에 연결된 두 글자 TLD입니다. `.us`(미국), `.uk`(영국), `.de`(독일), `.cn`(중국), [`.ae`](/ko/tld/ae/)(아랍에미리트), [`.ac`](/ko/tld/ac/)(어센션 섬) 등이 그 예입니다.

흥미로운 점은, 많은 ccTLD가 해당 국가의 의미를 넘어 유용한 철자로 인해 재활용되고 있다는 것입니다.

- [`.ai`](/ko/tld/ai/)는 기술적으로 앤귈라의 [ccTLD](/ko/glossary/cctld/)이지만, 인공지능 기업들의 대표 확장자가 되었습니다.
- [`.io`](/ko/tld/io/)는 영국령 인도양 지역에 속하지만, 기술 및 스타트업 브랜딩("I/O")에서 지배적으로 사용됩니다.
- `.co`(콜롬비아)는 `.com`의 짧은 대체재로 널리 사용됩니다.

이것이 바로 **[gTLD](/ko/glossary/gtld/) vs ccTLD**의 핵심 차이입니다. gTLD는 ICANN 계약 아래 직접 관리되며 전 세계에 개방되어 있는 반면, ccTLD는 각국 기관에 위임되어 있으며 저마다 고유한 규정을 가집니다(일부는 현지 거주 요건을 요구하고, 일부는 그렇지 않습니다).

### 3. 스폰서드 최상위 도메인(sTLD)

**스폰서드 TLD**는 자격 요건을 정하는 특정 커뮤니티나 단체가 후원하는 제한적 gTLD입니다. 일반적으로 등록하려면 자격을 갖춰야 합니다. 대표적인 예로 `.gov`(미국 정부), `.edu`(미국 인가 교육 기관), `.mil`(미국 군), `.aero`(항공 산업), `.museum` 등이 있습니다.

### 4. 신규 gTLD

2013년부터 ICANN은 **[신규 gTLD](/ko/glossary/new-gtld/) 프로그램**을 통해 네임스페이스를 수십 개에서 1,000개 이상으로 대폭 확장했습니다. 이들은 키워드, 산업, 취미, 브랜드 등 다양한 영역을 포괄합니다.

| 카테고리 | 예시 |
|----------|----------|
| 기술 및 웹 | [`.app`](/ko/tld/app/), [`.dev`](/ko/tld/dev/), [`.tech`](/ko/tld/tech/), [`.cloud`](/ko/tld/cloud/), [`.click`](/ko/tld/click/) |
| 현대적 및 범용 | [`.xyz`](/ko/tld/xyz/), [`.site`](/ko/tld/site/), [`.online`](/ko/tld/online/), [`.world`](/ko/tld/world/), [`.space`](/ko/tld/space/) |
| 상거래 | [`.shop`](/ko/tld/shop/), [`.store`](/ko/tld/store/), [`.vip`](/ko/tld/vip/) |
| 커뮤니티 및 콘텐츠 | [`.blog`](/ko/tld/blog/), [`.club`](/ko/tld/club/), [`.live`](/ko/tld/live/), [`.fun`](/ko/tld/fun/) |
| 짧고 기억하기 쉬운 | [`.io`](/ko/tld/io/), [`.top`](/ko/tld/top/), [`.sbs`](/ko/tld/sbs/), [`.now`](/ko/tld/now/) |

신규 gTLD는 인터넷에 새로운 가능성을 열었습니다. 좋은 `.com` 도메인이 모두 등록된 상황에서 [`.xyz`](/ko/tld/xyz/), [`.site`](/ko/tld/site/), [`.app`](/ko/tld/app/) 같은 확장자가 신선하고 기억하기 쉬운 네이밍 공간을 제공하게 되었습니다.

### 5. 국제화 최상위 도메인(IDN TLD)

**IDN TLD**는 라틴 문자가 아닌 아랍어, 중국어, 키릴 문자, 데바나가리 문자 등으로 작성된 최상위 도메인입니다. `.рф`(러시아), `.中国`(중국), `.السعودية`(사우디아라비아) 등이 그 예입니다. 사람들이 자신의 언어와 문자 체계로 인터넷을 처음부터 끝까지 이용할 수 있게 해줍니다.

### Web3 확장자에 대한 참고사항

`.eth`나 `.crypto` 같은 [블록체인](/ko/glossary/blockchain/) 기반 확장자를 보셨을 수도 있습니다. 이들은 ICANN TLD가 *아닙니다*. 전통적인 DNS 루트 밖에 존재하며, 특수 지갑이나 리졸버를 통해서만 접근할 수 있습니다. Namefi도 이들을 목록에 포함하고 있으며(참고: [`.eth`](/ko/tld/eth/)), 이들이 별개의 범주임을 알아두는 것이 중요합니다. 이 차이점은 [토크나이즈드 도메인 vs Web3 도메인](/ko/blog/tokenized-domain-vs-web3-domain/)에서 자세히 설명합니다.

---

## TLD 거버넌스 구조

모든 TLD 뒤에는 계층화된 거버넌스 시스템이 있습니다. 각 주체의 역할은 다음과 같습니다.

- **ICANN** — [인터넷 주소 자원 관리 기관](/ko/glossary/icann/)은 전 세계 네임스페이스를 조정하고, gTLD 정책을 수립하며, 등록 기관을 인증하는 비영리 단체입니다. 1998년에 설립되었으며, 도메인 업계에서 심판 역할에 가장 가까운 기관입니다.
- **IANA** — ICANN 산하의 인터넷 할당 번호 관리 기관(Internet Assigned Numbers Authority)은 모든 유효한 TLD와 각 TLD를 운영하는 [레지스트리](/ko/glossary/registry/)를 담은 권위 있는 **[루트 존](/ko/glossary/root-zone/)**을 관리합니다.
- **레지스트리(Registry)** — 각 TLD는 해당 확장자의 중앙 데이터베이스를 운영하는 *레지스트리*에 의해 관리됩니다. 예를 들어 **Verisign**이 `.com`과 `.net`을 운영하고, **공익 레지스트리(PIR)**가 `.org`를 운영합니다. ccTLD 레지스트리는 일반적으로 국가 기관이며, 예를 들어 [`.ae`](/ko/tld/ae/)는 아랍에미리트의 TDRA가 관리합니다.
- **레지스트라(Registrar)** — [레지스트라](/ko/glossary/registrar/)는 사용자가 도메인을 구매하는 소매 창구입니다. ICANN 인증 레지스트라(Namefi, GoDaddy, Namecheap 등)가 대중에게 도메인을 판매하고, 등록 정보를 레지스트리에 전달합니다.

전체 구조를 정리하면 이렇습니다. **ICANN/IANA**가 규칙과 루트를 결정하고 → **레지스트리**가 각 TLD를 운영하고 → **레지스트라**가 **사용자**에게 도메인을 판매합니다. `yourname.com`을 등록할 때, 사용자는 레지스트라에서 구매하고, 레지스트라는 ICANN 정책 아래 레지스트리(Verisign)에 이를 기록합니다.

---

## TLD 예시: 주요 확장자 한눈에 보기

자주 사용되는 **TLD 예시**와 각 확장자가 가장 잘 알려진 용도를 정리한 빠른 참고 표입니다.

| TLD | 종류 | 대표 용도 |
|-----|------|----------------|
| [`.com`](/ko/tld/com/) | gTLD | 모든 비즈니스의 기본 — 가장 신뢰받고 가치 있는 확장자 |
| [`.org`](/ko/tld/org/) | gTLD | 비영리 단체, 커뮤니티, 오픈소스 프로젝트 |
| [`.net`](/ko/tld/net/) | gTLD | 기술, 네트워크, 인프라 |
| [`.io`](/ko/tld/io/) | ccTLD (재활용) | 스타트업, 개발자, SaaS |
| [`.ai`](/ko/tld/ai/) | ccTLD (재활용) | 인공지능 및 기술 |
| [`.app`](/ko/tld/app/) | 신규 gTLD | 모바일 및 웹 앱(HTTPS 전용) |
| [`.dev`](/ko/tld/dev/) | 신규 gTLD | 개발자 및 엔지니어링 팀 |
| [`.tech`](/ko/tld/tech/) | 신규 gTLD | 기술 브랜드 및 제품 |
| [`.xyz`](/ko/tld/xyz/) | 신규 gTLD | 현대적이고 유연하며 세대를 초월한 확장자 |
| [`.shop`](/ko/tld/shop/) | 신규 gTLD | 전자상거래 및 소매 |
| [`.vip`](/ko/tld/vip/) | 신규 gTLD | 프리미엄, 독점적, 멤버십 브랜드 |
| [`.sbs`](/ko/tld/sbs/) | 신규 gTLD | "나란히(Side-by-side)" — 저렴하고 표현력 있는 이름 |

특정 TLD에 대해 더 알고 싶으신가요? [`.cloud`](/ko/tld/cloud/), [`.online`](/ko/tld/online/), [`.store`](/ko/tld/store/), [`.site`](/ko/tld/site/), [`.club`](/ko/tld/club/), [`.world`](/ko/tld/world/) 등 수십 개의 TLD 가이드가 포함된 전체 [TLD 가이드 라이브러리](/ko/tld/)를 둘러보세요.

---

## TLD 선택 방법

1,000개가 넘는 옵션 중에서 적절한 확장자를 고르는 것은 몇 가지 실용적인 질문으로 귀결됩니다.

1. **`.com`을 사용할 수 있나요?** 신뢰도와 재판매 가치 측면에서 여전히 황금 기준입니다. 원하는 `.com`이 사용 가능하고 적정 가격이라면, 일반적으로 가장 안전한 선택입니다. [왜 `.com`이 황금 기준인지](/ko/tld/com/)를 확인해 보세요.
2. **TLD가 목적에 맞나요?** 스타트업에는 [`.io`](/ko/tld/io/)나 [`.ai`](/ko/tld/ai/)가, 쇼핑몰에는 [`.shop`](/ko/tld/shop/)이나 [`.store`](/ko/tld/store/)가, 개발자 도구에는 [`.dev`](/ko/tld/dev/)가 잘 어울립니다. 올바른 확장자는 사업 내용을 *설명*할 수 있습니다.
3. **특정 국가를 타겟으로 하나요?** [`.ae`](/ko/tld/ae/) 같은 ccTLD는 현지 존재감을 나타내고 로컬 검색 가시성에 도움이 될 수 있습니다. 단, 먼저 자격 요건을 확인하세요.
4. **이름이 기억하기 쉽고 브랜딩에 적합한가요?** 현대적인 TLD([`.xyz`](/ko/tld/xyz/), [`.app`](/ko/tld/app/))에 짧은 SLD를 조합하면 길고 어색한 `.com`보다 나은 경우가 많습니다.
5. **갱신 비용은 얼마인가요?** 일부 TLD는 첫 해 프로모션 가격이 저렴하지만 갱신 비용이 높습니다. 초기 가격이 아닌 장기 비용을 반드시 확인하세요.
6. **제한 사항이 있나요?** 스폰서드 TLD(`.gov`, `.edu`)와 일부 ccTLD는 자격 요건이 필요합니다. [`.app`](/ko/tld/app/)과 [`.dev`](/ko/tld/dev/) 같은 신규 gTLD는 기본적으로 HTTPS를 강제합니다.

좋은 원칙 하나를 정리하자면, **사용자가 신뢰하고 기억할 수 있는 TLD를 선택한 다음, 가격과 규정이 계획에 맞는지 확인하세요**.

---

## TLD와 토크나이제이션

다음 세대 도메인에서 흥미로운 부분이 바로 여기입니다. TLD는 브랜딩에 영향을 줄 뿐 아니라, 도메인을 **[온체인](/ko/glossary/on-chain/)**으로 가져올 수 있는지 여부에도 영향을 미칩니다.

[토크나이즈드 도메인](/ko/blog/what-are-tokenized-domains/)이란 실제 ICANN 인증 도메인으로, 소유권이 [지갑](/ko/glossary/wallet/) 내 토큰(일반적으로 [NFT](/ko/glossary/nft/))으로도 표현되는 도메인입니다. DNS 레이어는 기존과 동일하게 작동하면서, 그 위에 두 번째 프로그래밍 가능한 소유권 레이어가 추가됩니다.

하지만 모든 TLD가 이에 동등하게 준비된 것은 아닙니다. 일부 레지스트리는 온체인 소유권 레이어를 지원하기 위해 일찍 움직였고, 아직 전혀 움직이지 않은 곳도 있습니다. 따라서 다음과 같은 기능을 원한다면 어떤 TLD를 선택하느냐가 중요합니다.

- 직접 자신의 지갑에 도메인 보관
- 몇 초 만에 온체인으로 도메인 이전(DNS 레코드도 함께 반영)
- NFT 마켓플레이스에 등록하거나 [DeFi](/ko/glossary/defi/)에서 [담보](/ko/glossary/collateral/)로 활용

**Namefi**는 [이더리움](/ko/glossary/ethereum/) 메인넷에서 실제 ICANN 도메인을 최초로 [토크나이즈](/ko/glossary/tokenize/)한 플랫폼이자, Base에서 최초로 이를 실현한 플랫폼으로, [`.com`](/ko/tld/com/), [`.xyz`](/ko/tld/xyz/), [`.io`](/ko/tld/io/) 등 위에서 언급한 수많은 TLD를 지원합니다. 실제 브라우저에서 접근 가능한 도메인과 지갑 기반 소유권을 하나의 제품으로 제공합니다.

> 두 레이어가 어떻게 결합되는지 궁금하신가요? [토크나이즈드 도메인이란?](/ko/blog/what-are-tokenized-domains/)을 읽거나, [namefi.io](https://namefi.io)에서 도메인을 등록하거나 토크나이즈해 보세요.

---

## 자주 묻는 질문

### TLD란 무엇인가요?
TLD(최상위 도메인)는 `.com`, `.org`, `.io`처럼 도메인 이름에서 마지막 점 이후에 오는 부분입니다. 도메인 네임 시스템 체계에서 가장 높은 계층이며, 도메인 확장자 또는 접미사라고도 합니다.

### TLD는 무엇의 약자인가요?
TLD는 **Top-Level Domain(최상위 도메인)**의 약자입니다. 인터넷 명명 체계의 최상위에 위치한 웹 주소 끝의 접미사를 가리킵니다.

### TLD와 도메인의 차이는 무엇인가요?
*도메인*은 등록 가능한 전체 이름, 즉 2차 이름과 TLD를 합친 것(예: `namefi.io`)입니다. *TLD*는 공유되는 끝 부분(`.io`)일 뿐입니다. 도메인은 직접 등록하고 소유하지만, TLD 아래에 이름을 등록하는 것이며 TLD 자체를 소유하는 것은 아닙니다.

### TLD의 주요 종류는 무엇인가요?
주요 종류로는 `.com` 같은 일반 TLD(gTLD), `.uk`나 `.ai` 같은 국가 코드 TLD(ccTLD), `.edu`나 `.gov` 같은 스폰서드 TLD(sTLD), `.xyz`나 `.app` 같은 신규 gTLD, 그리고 라틴 문자가 아닌 문자로 표기되는 국제화 TLD(IDN)가 있습니다.

### gTLD와 ccTLD의 차이는 무엇인가요?
gTLD는 ICANN 계약 아래 직접 관리되는 전 세계에서 사용 가능한 일반 확장자입니다(예: `.com`, `.org`). ccTLD는 국가나 지역에 연결된 두 글자 확장자로 각국 기관에 위임되어 있으며(예: `.uk`, `.de`, `.ai`), 각자 고유한 등록 규정을 가집니다.

### TLD의 예시는 어떤 것이 있나요?
`.com`, `.org`, `.net`, `.io`, `.ai`, `.app`, `.dev`, `.tech`, `.xyz`, `.shop`, `.vip` 등이 대표적인 예입니다. 현재 1,000개가 훨씬 넘는 TLD가 사용 가능합니다.

### TLD는 누가 관리하나요?
ICANN이 전 세계 네임스페이스를 조정하고 레지스트라를 인증하며, IANA가 모든 유효한 TLD의 권위 있는 루트 존을 유지합니다. 레지스트리는 개별 TLD를 운영하고(예: Verisign이 `.com` 운영), 레지스트라가 대중에게 도메인을 판매합니다.

### 어떤 TLD를 선택해야 하나요?
원하는 `.com`이 사용 가능하고 적정 가격이라면, 신뢰도와 재판매 가치 측면에서 일반적으로 가장 안전한 선택입니다. 그렇지 않다면 목적에 맞는 TLD를 선택하세요. 스타트업이라면 `.io`나 `.ai`, 쇼핑몰이라면 `.shop`, 개발자라면 `.dev`가 적합합니다. 등록 전에 갱신 비용과 자격 요건을 반드시 확인하세요.

---

## 요약

- **TLD(최상위 도메인)**는 도메인에서 마지막 점 이후에 오는 부분으로, `.com`, `.org`, `.io` 등이 이에 해당합니다. 도메인 확장자라고도 합니다.
- 오른쪽에서 왼쪽으로 읽으면, 도메인은 **TLD → 2차 도메인 → 서브도메인** 순으로 구성됩니다.
- 주요 **TLD 종류**는 gTLD, ccTLD, 스폰서드 TLD, 신규 gTLD, 국제화(IDN) TLD입니다.
- TLD는 최상위에서 **ICANN**과 **IANA**가, 각 확장자를 운영하는 **레지스트리**가, 그리고 사용자에게 도메인을 판매하는 **[레지스트라](/ko/glossary/registrar/)**가 거버넌스를 담당합니다.
- TLD 선택은 신뢰도, 적합성, 비용의 문제이며, 점점 더 **온체인**으로 [토크나이즈드 도메인](/ko/blog/what-are-tokenized-domains/)으로 전환할 수 있는지의 여부도 중요해지고 있습니다.

원하는 TLD로 도메인을 등록하거나 토크나이즈할 준비가 되셨나요? [namefi.io](https://namefi.io)를 방문해 시작해 보세요.
