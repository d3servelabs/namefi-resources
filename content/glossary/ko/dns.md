---
title: DNS
date: '2025-06-30'
language: ko
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 사람이 읽을 수 있는 도메인 이름을 컴퓨터가 인터넷 트래픽을 라우팅하는 데 사용하는 IP 주소로 변환하는 계층적 네이밍 시스템입니다.
keywords: ['DNS', '도메인 네임 시스템', '이름 해석', 'DNS 조회', 'DNS 레코드', '네임서버', '재귀 리졸버', 'DNSSEC', '인터넷 인프라']
also_known_as: ['도메인 네임 시스템']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
relatedArticles:
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /ko/blog/the-sea-turtle-dns-espionage/
  - /ko/blog/the-dnspionage-campaign/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
  - /ko/glossary/web3/
---

**DNS** (*Domain Name System*)는 `example.com`과 같은 사람이 읽을 수 있는 도메인 이름을, 네트워킹 장비가 인터넷 전반에 걸쳐 패킷을 라우팅하는 데 사용하는 [IP 주소](/ko/glossary/ip-address/)로 변환하는 인터넷의 분산 계층적 네이밍 시스템입니다. DNS가 없다면 모든 사용자가 방문하려는 모든 사이트의 숫자 주소를 외워야 할 것입니다. [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034)와 [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035)(1987년 IETF가 발표한 후 오늘날까지도 근간을 이루는 표준)에 정의된 DNS는 인터넷의 핵심 프로토콜 중 하나로 자리를 지키고 있습니다.

## DNS의 역할

DNS는 **이름 해석(name resolution)**을 수행합니다. 도메인 이름이 주어지면 해당 이름과 연관된 리소스 레코드를 반환하는데, 가장 일반적으로는 브라우저나 애플리케이션이 연결 요청을 보낼 위치를 알 수 있도록 [IP 주소](/ko/glossary/ip-address/)를 돌려줍니다. 또한 이메일 라우팅(MX 레코드), 도메인 소유권 검증(TXT 레코드), 특정 서버 집합으로의 존(zone) 권한 위임(NS 레코드)에도 활용됩니다.

DNS는 업데이트보다 조회가 훨씬 빈번하게 이루어지기 때문에, 즉각적인 일관성보다는 전 세계 수백만 대 서버에 분산된 빠른 캐시 읽기에 최적화되어 있습니다.

## DNS 조회의 동작 방식

브라우저 주소창에 `example.com`을 입력하면 여러 단계로 이루어진 해석 과정이 시작됩니다.

1. **로컬 캐시 확인.** 운영 체제는 먼저 자체 DNS 캐시를 확인합니다. 최근에 저장된 유효한 응답이 있으면 조회는 즉시 종료됩니다.

2. **재귀 리졸버.** 캐시된 응답이 없으면 쿼리는 [DNS 리졸버](/ko/glossary/dns-resolver/)로 전달됩니다. 이 서버는 ISP, 기업(예: Cloudflare의 `1.1.1.1` 또는 Google의 `8.8.8.8`), 또는 소속 조직이 운영하며, 사용자를 대신해 답을 찾는 작업을 맡습니다. 이러한 동작 방식을 **재귀적 해석(recursive resolution)**이라고 합니다.

3. **루트 네임서버.** 리졸버에 캐시된 응답이 없으면 13개의 논리적 [루트 존](/ko/glossary/root-zone/) 네임서버 클러스터(`a`부터 `m`까지) 중 하나에 연락합니다. 루트 서버는 최종 답을 알지 못하지만, `.com`이나 `.org`와 같은 해당 최상위 도메인(TLD)을 담당하는 [네임서버](/ko/glossary/nameserver/)로 리퍼럴(referral)을 응답합니다. [IANA](https://www.iana.org/domains/root)가 루트 존 데이터베이스를 공개하고 관리합니다.

4. **TLD 네임서버.** 리졸버는 TLD 네임서버에 쿼리를 보냅니다. TLD 네임서버는 특정 도메인(`example.com`)의 **권위 네임서버**로 가는 리퍼럴을 응답합니다.

5. **권위 네임서버.** 리졸버는 실제 DNS 레코드를 보유한 해당 도메인의 권위 [네임서버](/ko/glossary/nameserver/)에 쿼리를 보냅니다. 권위 서버는 리소스 레코드, 예를 들어 IPv4 주소를 담은 `A` 레코드를 반환합니다.

6. **응답 및 캐싱.** 리졸버는 클라이언트에 답을 반환하고, 레코드의 [TTL](/ko/glossary/ttl/)(Time to Live)에 명시된 기간 동안 캐시에 저장합니다. TTL이 만료되기 전에 동일한 이름에 대한 후속 쿼리는 캐시에서 처리되므로 지연 시간을 줄이고 상위 서버의 부하를 낮출 수 있습니다.

이처럼 리졸버가 반복적인 탐색을 대신 수행하고 클라이언트는 단 하나의 서버와만 통신하는 방식을 **재귀적 해석**이라고 합니다. 이와 달리 **반복적 해석(iterative resolution)**은 클라이언트 자신이 계층 구조의 각 단계를 순서대로 직접 쿼리하는 방식으로, 실제로는 거의 쓰이지 않지만 리졸버가 내부적으로 계층을 탐색하는 방식이 바로 이것입니다([RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)).

## DNS 계층 구조와 주요 레코드 유형

DNS는 역전된 트리 구조로 구성됩니다. 최상단에는 루트(`.`)가 있고, 그 아래에 TLD(`.com`, `.net`, `.io`, `.de` 같은 국가 코드)가 있으며, 각 TLD 아래에는 2단계 도메인(`example.com`)이, 그리고 임의 깊이의 서브도메인(`mail.example.com`)이 존재합니다.

이 트리의 각 노드를 **존(zone)**이라 하며, 존의 권위 네임서버가 해당 존의 **리소스 레코드**를 보유합니다. 자주 접하게 되는 [DNS 레코드 유형](/ko/glossary/dns-record-types/)은 다음과 같습니다.

| 레코드 | 용도 | 값 예시 |
|--------|------|---------|
| **A** | 이름을 IPv4 주소에 매핑 | `93.184.216.34` |
| **AAAA** | 이름을 IPv6 주소에 매핑 | `2606:2800:21f:cb07::1` |
| **CNAME** | 하나의 이름을 다른 정식 이름으로 별칭 지정 | `www → example.com` |
| **MX** | 도메인의 메일 서버를 우선순위와 함께 지정 | `10 mail.example.com` |
| **NS** | 존을 네임서버 집합에 위임 | `ns1.example.com` |
| **TXT** | 임의의 텍스트 저장; SPF, DKIM, 도메인 검증에 활용 | `"v=spf1 include:…"` |
| **SOA** | Start of Authority — 존 자체에 대한 메타데이터 | 시리얼, 새로 고침, 재시도 타이밍 |

`CNAME` 레코드는 존 정점(bare domain `example.com`)에 배치할 수 없습니다. `CNAME`은 해당 이름의 유일한 레코드여야 하지만, 정점에는 `NS`와 `SOA` 레코드도 함께 필요하기 때문입니다. 많은 DNS 공급자는 독자적인 "CNAME 플래트닝" 또는 `ALIAS`/`ANAME` 유사 레코드 유형으로 이 문제를 우회합니다.

## DNS를 운영하는 주체

DNS의 거버넌스와 운영은 여러 계층의 주체에 분산되어 있습니다.

- **[ICANN](/ko/glossary/icann/) / IANA.** 국제인터넷주소관리기구(ICANN)는 [루트 존](/ko/glossary/root-zone/)을 감독하고 글로벌 DNS 네임스페이스를 조율합니다. ICANN의 기능 조직인 IANA는 모든 TLD와 해당 권위 네임서버를 나열한 [루트 존 데이터베이스](https://www.iana.org/domains/root)를 유지 관리합니다.

- **레지스트리.** [레지스트리](/ko/glossary/registry/)는 특정 TLD에 대한 권위 데이터베이스를 운영합니다. 예를 들어 Verisign이 `.com`과 `.net`을, Public Interest Registry가 `.org`를 운영합니다. 레지스트리는 각 도메인의 네임서버를 가리키는 NS 레코드를 발행하고 관리합니다.

- **레지스트라.** [레지스트라](/ko/glossary/registrar/)는 ICANN(또는 관련 레지스트리)으로부터 인가를 받아 일반 대중에게 도메인 이름을 판매하고, 고객을 대신해 등록 데이터를 레지스트리에 제출하는 기관입니다.

- **재귀 리졸버.** DNS 리졸버는 ISP, 공개 DNS 서비스(Cloudflare, Google, Quad9), 기업, 가정용 라우터가 운영합니다. 앞서 설명한 반복적 조회를 처리하고 쿼리 지연 시간을 줄이기 위해 결과를 캐시합니다([Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)).

- **권위 네임서버.** 도메인 소유자 또는 DNS 공급자가 호스팅하는 이 서버들은 실제 존 파일을 보유하고 리졸버의 쿼리에 확정적인 답변을 제공합니다.

## 보안

초기 DNS 명세는 보안보다 안정성과 확장성에 중점을 두고 설계되었습니다. 시간이 지나면서 다양한 취약점과 방어 메커니즘이 등장했습니다.

**캐시 오염(Cache poisoning).** 공격자가 리졸버의 캐시에 위조된 DNS 응답을 삽입하면, 사용자가 인지하지 못한 채 정상 사이트 대신 악의적인 사이트로 연결될 수 있습니다. 2008년의 Kaminsky 공격은 이를 대규모로 입증했으며, 이로 인해 포트 무작위화와 [DNSSEC](/ko/glossary/dnssec/) 도입이 확산되었습니다.

**DNSSEC.** RFC 4033–4035에 정의된 DNS 보안 확장(DNS Security Extensions)은 DNS 레코드에 암호화 서명을 추가합니다. [DNSSEC](/ko/glossary/dnssec/) 서명을 검증하는 리졸버는 변조된 응답을 탐지할 수 있습니다. 도입률은 높아지고 있지만 균일하지는 않습니다. 2024년 기준으로 루트 존과 주요 TLD의 약 90%가 서명되어 있지만, 종단 간 검증이 이루어지려면 체인의 모든 존이 서명되고 리졸버가 서명을 실제로 확인해야 합니다.

**DNS 하이재킹(DNS hijacking).** 레지스트라 계정, 레지스트리 시스템, 또는 ISP의 리졸버를 장악한 공격자는 DNS 응답을 대규모로 리디렉션할 수 있습니다. 방어 수단으로는 레지스트라 수준의 다중 인증, 레지스트리 잠금(EPP `serverTransferProhibited`), 예상치 못한 NS 또는 A 레코드 변경에 대한 모니터링이 있습니다.

**DNS over HTTPS / DNS over TLS (DoH / DoT).** 이 프로토콜들은 클라이언트와 리졸버 사이의 DNS 쿼리를 암호화하여 전송 중 도청과 경로상 변조를 방지합니다. 이는 데이터 프라이버시 측면의 보호로, 데이터 무결성을 다루는 DNSSEC와 상호 보완적인 역할을 합니다.

## DNS와 토큰화 도메인

일부 블록체인 기반 도메인 시스템(이더리움 네임 서비스 등)은 전통적인 DNS 계층 구조와 무관하게 이름→주소 매핑 전체를 온체인에서 관리합니다. 반면 일부 시스템은 기존 방식으로 등록된 도메인의 소유권을 나타내는 온체인 토큰을 발행하고, 기반이 되는 DNS 존 파일은 기존 네임서버에서 계속 호스팅됩니다. 후자의 경우 DNS 해석은 앞서 설명한 일반적인 조회 흐름을 따르며, 블록체인 레코드는 소유권을 증명할 뿐 해석 경로에는 포함되지 않습니다. 온체인 소유권 레코드와 글로벌 DNS, 이 두 시스템은 별개의 계층으로 공존하거나 게이트웨이 리졸버를 통해 연결될 수 있습니다.

---

*출처: [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034), [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035), [IANA Root Zone Database](https://www.iana.org/domains/root), [Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/), [ICANN — What is DNS?](https://www.icann.org/resources/pages/what-2012-02-25-en)*
