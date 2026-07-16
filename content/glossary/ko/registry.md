---
title: 레지스트리
date: '2026-06-22'
language: ko
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 최상위 도메인의 권위 있는 데이터베이스와 네임서버를 운영하며, 소매 판매는 레지스트라에 위임하는 조직입니다.
keywords: ['레지스트리', '레지스트리 운영자', 'TLD 레지스트리', '도메인 레지스트리', 'ICANN', '레지스트라', 'EPP', 'gTLD 레지스트리', 'ccTLD 레지스트리', '공유 레지스트리 시스템']
also_known_as: ['레지스트리 운영자']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
relatedArticles:
  - /ko/blog/what-is-a-tld/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/top-tlds-to-secure-for-your-business/
  - /ko/blog/how-tld-affects-domain-value/
  - /ko/blog/top-tlds-to-secure-for-your-fashion-brand/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/best-tlds-by-industry/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/dns/
  - /ko/glossary/web3/
---

**레지스트리**(registry, *레지스트리 운영자*라고도 함)는 [TLD](/ko/glossary/tld/)의 권위 있는 데이터베이스를 운영하는 조직입니다. 해당 확장자 아래 등록된 모든 도메인을 기록하고, 도메인 이름과 [네임서버](/ko/glossary/nameserver/)를 연결하는 존 파일(zone file)을 관리하며, [DNS](/ko/glossary/dns/) 전반에서 쿼리가 작동하도록 데이터를 공개합니다. 레지스트리는 도메인 이름 공급망의 최상위에 위치하며, [레지스트라](/ko/glossary/registrar/)와 [등록자(registrant)](/ko/glossary/registrant/) 위에 있습니다.

## 레지스트리의 역할

레지스트리의 핵심 기능은 자신이 관할하는 TLD 아래 모든 도메인에 대한 **권위 있는 데이터베이스** — 흔히 *레지스트리 데이터베이스* 또는 *공유 등록 시스템(shared registration system)*이라고 불림 — 를 유지하는 것입니다. 도메인이 생성·갱신·이전·삭제될 때마다 레지스트리는 해당 변경 사항을 기록합니다. 또한 레지스트리는 **TLD 존 파일**을 공개합니다. 이 파일은 해당 TLD 아래의 이름에 대한 쿼리를 어디로 보내야 하는지를 글로벌 [DNS](/ko/glossary/dns/)에 알려주는 [네임서버](/ko/glossary/nameserver/) 위임 정보의 집합입니다.

데이터베이스 관리 외에도 대부분의 레지스트리는 자신의 TLD에 대한 **권위 있는 네임서버**(흔히 TLD 네임서버라 불림)를 직접 운영하거나 계약을 통해 운영합니다. 이 서버들은 예를 들어 "`example.com`에 대해 권위 있는 네임서버가 무엇인가요?"라고 묻는 리졸버(resolver)의 쿼리에 응답하며, 레지스트리의 존 파일에서 답을 반환합니다.

기술적 역할 외에도 레지스트리는 다음을 수행합니다.

- **도매 가격 책정** — [레지스트라](/ko/glossary/registrar/)가 도메인당 연간 지불하는 요금을 설정합니다.
- **등록 정책 수립 및 집행** — 자격 요건, 허용 가능한 사용 규칙, 새 확장자에 대한 선출원(sunrise) 및 상표 보호 기간을 정합니다.
- **WHOIS / RDAP** 조회 서비스를 운영하여 등록 데이터를 공개합니다.
- [ICANN](/ko/glossary/icann/)과의 레지스트리 계약 아래 의무 사항과 성능 기준을 이행하며 조율합니다([ICANN 레지스트리 계약](https://www.icann.org/en/registry-agreements)).

## 레지스트리 vs. 레지스트라 vs. 등록자

도메인 이름 산업은 [ICANN](/ko/glossary/icann/)이 확립한 3계층 모델로 구성됩니다.

| 계층 | 역할 | 예시 |
|------|------|------|
| **레지스트리** | TLD 데이터베이스 운영, 도매 가격 설정, 소비자 직접 판매 없음 | Verisign (.com, .net), PIR (.org), DENIC (.de) |
| **[레지스트라](/ko/glossary/registrar/)** | ICANN 인가 소매업자, 대중에게 도메인 판매, EPP를 통해 레지스트리와 연동 | GoDaddy, Namecheap, Google Domains |
| **[등록자](/ko/glossary/registrant/)** | 도메인 이름을 등록하는 개인 또는 조직 | 도메인을 구매하는 모든 기업 또는 개인 |

레지스트리와 레지스트라 모두 [ICANN](/ko/glossary/icann/)의 인가를 받지만 각각 다른 역할을 수행합니다. ICANN의 수직적 분리 규정(vertical-separation rules)에 따라 레지스트리는 자신이 운영하는 TLD에 대해 소매 레지스트라 역할을 겸할 수 없습니다(제한적 예외 있음). 이러한 분리는 레지스트리가 자사에 유리한 가격이나 인기 도메인에 대한 우선 접근권을 부여하는 것을 방지하기 위한 의도적 설계입니다.

## 레지스트리-레지스트라 모델의 작동 방식

레지스트리와 레지스트라 사이의 기술적 연결 고리는 **[EPP(Extensible Provisioning Protocol)](/ko/glossary/epp/)**입니다. 이는 [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730)에 정의된 XML 기반 프로토콜입니다. 레지스트라는 레지스트리의 EPP 서버에 접속하여 도메인 생애주기 작업을 수행합니다. `check`(이름 사용 가능 여부 확인), `create`, `renew`, `transfer`, `update`, `delete`가 이에 해당합니다.

이 모델에서는 다음 과정이 이루어집니다.

1. 레지스트라는 [ICANN](/ko/glossary/icann/)과 **레지스트라 인증 계약(RAA, Registrar Accreditation Agreement)**을 체결하고, 판매하려는 TLD를 보유한 각 레지스트리와 별도의 **레지스트리-레지스트라 계약**을 맺습니다.
2. 레지스트리는 레지스트라에게 **도매 수수료**를 청구합니다(예: Verisign은 2024년 기준 `.com` 도메인에 대해 인증 레지스트라에게 연간 약 $10.26를 부과합니다).
3. 레지스트라는 마진을 추가하여 [등록자](/ko/glossary/registrant/)에게 **소매 가격**으로 판매합니다.
4. 레지스트라가 레지스트리에 [EPP](/ko/glossary/epp/) 명령을 전송하면, 레지스트리는 권위 있는 데이터베이스와 존 파일을 업데이트합니다. 이로써 도메인은 수분 내에 DNS 전체에서 활성화됩니다.

이 구조는 **공유 레지스트리 시스템(SRS)**이라고도 불립니다. 단일 레지스트리가 수백 개의 경쟁 레지스트라를 동시에 지원할 수 있으며, 모든 레지스트라가 표준화된 [EPP](/ko/glossary/epp/) 트랜잭션을 통해 동일한 권위 있는 데이터베이스에 쓰기 작업을 수행합니다. 레지스트라 계층에서의 경쟁은 어느 단일 리셀러가 TLD에 대한 독점적 접근권을 갖지 않으면서도 소매 가격을 낮추는 효과를 가져옵니다.

## 사례

**일반 TLD 레지스트리**

- **Verisign**은 등록 수 기준 가장 큰 두 개의 [gTLD](/ko/glossary/gtld/)인 `.com`과 `.net`을 운영합니다. [ICANN](/ko/glossary/icann/)과 체결한 레지스트리 계약은 공개되어 있으며 참고 모델로 널리 인용됩니다([IANA 루트 데이터베이스 .com 항목](https://www.iana.org/domains/root/db/com.html)).
- **PIR(Public Interest Registry)**은 `.org`를 운영합니다. 원래 비영리 조직을 위한 비영리 레지스트리로 설립되었습니다.
- **Identity Digital**(구 Donuts 및 Afilias)은 위임된 [새 gTLD](/ko/glossary/new-gtld/)의 최대 운영자 중 하나로, `.blog`, `.online`, `.store`, `.news` 등 수백 개의 확장자를 운영합니다.

**국가 코드 TLD 레지스트리**

[ccTLD](/ko/glossary/cctld/) 레지스트리는 [ICANN](/ko/glossary/icann/) [gTLD](/ko/glossary/gtld/) 계약이 아닌 국가 또는 영토의 권한 아래 운영됩니다. 다만 많은 ccTLD 레지스트리도 [EPP](/ko/glossary/epp/)를 통해 레지스트라와 연동합니다.

- **Nominet** (.uk) — 영국 레지스트리로, 1996년에 설립된 비영리 조직입니다.
- **DENIC** (.de) — 독일 레지스트리로, 레지스트라 회원 조직이 운영하는 협동조합입니다.
- **AFNIC** (.fr) — 프랑스 정부의 위임 아래 운영되는 프랑스 레지스트리입니다.
- **VeriSign** / **CNNIC** (.cn) — 중국인터넷정보센터(China Internet Network Information Center)가 운영하는 중국 국가 코드 레지스트리입니다.

ccTLD 레지스트리는 전 세계 모든 TLD 위임의 권위 있는 목록인 IANA 루트 데이터베이스([iana.org/domains/root/db](https://www.iana.org/domains/root/db))에 등재되어 있습니다.

## 새 gTLD 레지스트리

2012년 이전에는 일반 TLD의 종류가 소수로 제한되어 있었습니다. `.com`, `.net`, `.org`, `.info`, `.biz` 및 몇 가지 추가 확장자가 전부였습니다. ICANN이 2012년에 시작한 **새 gTLD 프로그램(New gTLD Program)**은 거의 모든 문자열을 [새 gTLD](/ko/glossary/new-gtld/)로 신청할 수 있도록 허용했습니다. 최종적으로 1,200개 이상의 새 확장자가 위임되었습니다.

새 [gTLD](/ko/glossary/gtld/) 레지스트리는 [ICANN](/ko/glossary/icann/)과 체결한 **레지스트리 계약**에 따라 운영됩니다. 이 계약은 기술적 요건(EPP 지원, DNSSEC, RDAP), 성능 기준(시스템 가용성, 쿼리 응답 시간), 정책 의무(남용 방지, 상표 보호 메커니즘 — 상표 클리어링하우스 선출원 기간 및 통일 신속 정지 시스템 포함)를 규정합니다.

ICANN은 새 gTLD에 대한 전체 레지스트리 계약 목록을 [icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements)에서 공개하고 있습니다.

## 레지스트리와 토큰화 도메인

일부 대안적 도메인 네임스페이스 — 특히 Unstoppable Domains와 ENS(Ethereum Name Service) — 는 ICANN이 조율하는 DNS 존이 아닌 공개 블록체인에 기반을 두고 도메인과 유사한 이름을 발행합니다. 이러한 시스템에서는 소유권이 레지스트리 데이터베이스가 아닌 스마트 컨트랙트에 기록되며, 조회를 위해서는 표준 DNS 조회 경로가 아닌 브라우저 확장 프로그램이나 호환 가능한 리졸버가 필요합니다.

이러한 블록체인 기반 네임스페이스는 IANA 루트에 위임되어 있지 않으며, 기본적으로 일반 DNS 리졸버에서는 보이지 않습니다. 이들은 앞서 설명한 ICANN 레지스트리 시스템과는 독립적으로 운영됩니다.
