---
title: '도메인 탈취는 실제로 이렇게 일어납니다: 다섯 가지 공격 경로와 그것을 차단하는 대응 수단'
date: '2026-05-10'
language: ko
tags: ['security', 'domains', 'registrar', 'incident-response', 'domain-flipping']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 1
format: case-study
description: 실제 현장에서 공격자들이 도메인을 탈취하는 다섯 가지 방법—소셜 엔지니어링, 레지스트라 계정 침해, DNS 공급자 탈취, 네임서버 하이재킹, 만료 도메인 재등록—을 방어자 관점에서 구체적으로 살펴보고, 각각을 차단하는 대응 수단을 설명합니다.
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['도메인 탈취', '도메인 보안', '레지스트라 잠금', '이전 잠금', 'dnssec', '이중 인증', '소셜 엔지니어링', '댕글링 DNS', 'namefi']
relatedArticles:
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-perl-com-domain-theft/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/registry/
---

"[도메인 탈취](/ko/glossary/domain-hijacking/)"라는 표현은 극적으로 들리지만, 실제로 어떻게 발생하느냐에 따라 그 의미가 크게 달라집니다. [피싱](/ko/glossary/phishing/) 이메일로 [레지스트라](/ko/glossary/registrar/) 계정이 탈취되는 것도 하이재킹이고, [DNS](/ko/glossary/dns/) 공급자에서 [네임서버](/ko/glossary/nameserver/) 레코드가 조용히 교체되는 것도 하이재킹입니다. 만료된 도메인을 타인이 가져가 재지정하는 것 역시 넓은 의미에서 하이재킹에 해당합니다.

어떤 경우든 결과는 동일합니다. 이제 다른 누군가가 당신의 도메인이 가리키는 곳을 전 세계에 알리게 됩니다. 이메일, 결제, 로그인 흐름, SaaS 연동이 모두 공격자에게 트래픽을 보내기 시작합니다. 복구에는 보통 며칠, 때로는 몇 주가 걸립니다. 도메인이 다른 레지스트라로 이전된 경우에는 [ICANN](/ko/glossary/icann/)의 [이전 분쟁 해결 정책(TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)이 관련될 수 있으며, 그 외의 경우에는 레지스트라 에스컬레이션, [레지스트리](/ko/glossary/registry/) 에스컬레이션, 플랫폼 복구, 또는 법원 명령이 필요한 경우가 많습니다. 가장 빠른 해결책은 애초에 그런 상황에 처하지 않는 것입니다.

이 글에서는 가장 자주 나타나는 다섯 가지 공격 경로를 방어자 시점에서 살펴보고, 각각을 실제로 차단하는 구체적인 대응 수단을 제시합니다.

## 1. 레지스트라 지원팀을 겨냥한 소셜 엔지니어링

지난 10년간 주목을 받은 도메인 탈취 사건 중 다수는 기술적 취약점 없이 발생했습니다. 전화 한 통으로 이루어진 것입니다.

공격 패턴은 이렇습니다. 공격자가 대상에 관한 정보—[WHOIS](/ko/glossary/whois/) 이력, LinkedIn, 유출된 비밀번호 덤프, 소셜 미디어—를 충분히 수집한 뒤, 도메인 소유자를 사칭하여 레지스트라 지원팀에 전화하거나 이메일을 보냅니다. 비밀번호 재설정, 이메일 변경, 또는 이전 [인증 코드](/ko/glossary/auth-code/)를 요청합니다. 지원 담당자가 공격자가 이미 준비한 확인 절차만 따른다면, 계정은 손을 바꿉니다.

암호화폐 거래소, 광고 플랫폼, 인프라 브랜드 등에서 발생한 가장 피해가 큰 탈취 사건 여러 건이 바로 이 방식으로 이루어졌습니다. 레지스트라 코드의 취약점은 전혀 필요하지 않습니다. 이 공격은 절차 안에 있는 사람을 이용합니다.

**차단 방법:**

- **레지스트라 측의 강력한 규칙** — 소유권 변경 시 공증 문서 또는 기존 [등록자](/ko/glossary/registrant/) 채널을 통한 다중 인증 확인을 의무화합니다.
- **[레지스트리 잠금](/ko/glossary/registry-lock/)** (레지스트라 잠금과 별개) — 레지스트리 운영자 자체가 대역 외 확인 없이는 이전이나 연락처 변경을 처리하지 않습니다. `.com`, `.net`, 그리고 많은 ccTLD에서 사용 가능합니다.
- **실제로 사용하는 레지스트라를 확인하고 나머지를 정리합니다.** 2007년에 시작한 브랜드는 자격증명이 취약한 서너 개의 레지스트라에 오래된 계정을 남겨 두는 경우가 많습니다.

## 2. 레지스트라 계정 침해(자격증명 경로)

소셜 엔지니어링의 기술적 변형입니다. 공격자가 레지스트라 계정 자격증명을 피싱하거나, 크리덴셜 스터핑 덤프에서 발견하여 직접 로그인합니다. 그런 다음 도메인 잠금을 해제하고, 연락처 이메일을 변경한 뒤 이전을 요청합니다.

**차단 방법:**

- **레지스트라 계정에 피싱에 강한 2FA를 적용합니다.** 인증 앱을 통한 TOTP가 최소 기준이며, 하드웨어 키(WebAuthn / FIDO2)가 최고 수준입니다. SMS 기반 2FA는 충분하지 않습니다. SIM 스와핑 공격에 반복적으로 뚫렸기 때문입니다. 미국 정부의 [CISA 지침](https://www.cisa.gov/secure-our-world/turn-mfa)은 SMS에서 벗어날 것을 명시적으로 권고합니다.
- **계정별 잠금 외에 도메인별 잠금도 지원하는 레지스트라를 사용합니다.** 계정 하나가 침해되어도 모든 도메인의 잠금이 한꺼번에 해제되지 않도록 합니다.
- **연락처 변경, 네임서버 변경, 이전 요청에 대한 감사 로그 및 알림을 설정합니다.** 공격자가 가장 먼저 하는 행동이 이 알림을 차단하는 것입니다. 공격자가 제어하지 못하는 채널로 알림이 전달된다면 대응할 시간을 확보할 수 있습니다.

## 3. DNS 공급자 탈취

레지스트라 계정이 철저히 잠겨 있더라도, 레지스트라가 게시하는 *네임서버*가 별도 계정을 가진 DNS 공급자—Cloudflare, Route 53, NS1, DNSimple, 자체 BIND 서버—를 가리킬 수 있습니다. 공격자가 그 DNS 계정에 접근하면 레지스트라를 건드릴 필요가 없습니다. A, MX, TXT 레코드만 다시 쓰면 트래픽이 따라갑니다.

대부분의 기업이 레지스트라 보안에는 투자하면서도 DNS 공급자는 "인프라"로 취급하여 통제가 느슨하기 때문에, 공격자 입장에서는 이 경로가 더 쉬운 경우가 많습니다.

**차단 방법:**

- **DNS 공급자 계정에도 레지스트라와 동일한 수준의 2FA를 적용합니다.** 동등하게 민감한 자산으로 다루십시오. 실제로 그렇습니다.
- **존(zone) 수준에서 서명된 [DNSSEC](/ko/glossary/dnssec/)를 사용합니다.** DNSSEC는 DNS 공급자 계정 침해 자체를 막지는 않습니다. 공격자가 공급자를 통해 레코드를 게시하고, 공급자가 존의 활성 키로 서명하면, 검증하는 리졸버는 해당 응답을 정상으로 처리합니다. DNSSEC가 차단하는 것은 경로 상의 위변조, 캐시 포이즈닝, 그리고 서명이 없거나 잘못 서명된 위조 응답입니다(상위 도메인이 올바른 DS 레코드를 게시하고 있다는 전제 하에). 프로토콜 세부 사항은 [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033)를 참조하십시오.
- **별도 계정과 자격증명을 사용하는 멀티 공급자 DNS**와 [멀티 서명자 DNSSEC](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)를 활용합니다. 이는 가용성 향상과 공급자 격리에 도움이 되지만, 모든 공급자가 의도한 존 데이터를 서비스하고 DNSKEY/DS 세트가 올바르게 조율된 경우에만 효과가 있습니다. 리졸버가 침해되지 않은 공급자를 자동으로 우선하는 마법 같은 해결책은 아닙니다.

## 4. 오래된 위임 레코드와 댕글링 레코드를 통한 네임서버 하이재킹

더 교묘한 변형입니다. 도메인 자체는 멀쩡하지만, *[서브도메인](/ko/glossary/subdomain/)*이 CNAME 또는 NS 레코드를 통해 원래 소유자가 더 이상 통제하지 않는 서드파티 서비스를 가리키는 경우입니다. 공격자가 서드파티 측에서 해당 리소스를 등록하면 그 서브도메인에 응답할 수 있게 됩니다.

예시:

- 이미 해제된 Heroku, S3, Azure 자산으로 CNAME이 연결된 서브도메인. 공격자가 해당 자산 이름을 다시 가져가면 유효한 TLS 인증서까지 발급받습니다.
- 삭제된 DNS 공급자 계정을 가리키는 위임 `NS` 레코드. 공격자가 정확히 같은 호스트 패턴으로 새 계정을 만들면 서브도메인에 대해 원하는 레코드를 마음대로 서비스할 수 있습니다.

이런 사례들은 **댕글링 DNS(dangling DNS)**라는 포괄적인 용어로 분류됩니다. 대규모 조직 대부분이 수백에서 수천 개의 서브도메인을 보유하면서 그 일부만 감사하기 때문에, 오늘날 공개 웹에서 가장 흔한 형태의 "실제" 도메인 하이재킹입니다.

**차단 방법:**

- **소유한 모든 존의 NS, CNAME, ALIAS 레코드 전수 목록을 작성하고, 각각의 담당자를 지정합니다.**
- **자동화된 댕글링 DNS 스캐너**를 통해 모든 레코드를 주기적으로 재확인하고, 더 이상 응답하지 않는 서드파티 서비스를 가리키는 레코드에 플래그를 표시합니다. [GitHub 블로그](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/)와 [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/)에는 이 공격 유형에 대한 상세한 분석이 실려 있습니다.
- **기반 서비스를 폐기하는 당일에 해당 레코드도 함께 삭제합니다.**

## 5. 만료 도메인 재등록

가장 단순하고 가장 대비하기 어색한 공격입니다. 등록자가 도메인 갱신을 잊어버립니다. [유예 기간](/ko/glossary/grace-period/)이 지납니다. 도메인이 풀(pool)로 반환됩니다. 다른 누군가가 등록합니다.

이것은 운영상의 실수처럼 보이지만 결과는 동일합니다. 이제 다른 사람이 그 도메인을 통제하며, 수년에 걸쳐 쌓아온 신뢰 신호들(SPF, DKIM, OAuth 콜백, 비밀번호 재설정 이메일, 결제 연동)이 모두 낯선 이에게 흘러갑니다. 공개된 여러 사건에서 공격자들이 [만료 도메인](/ko/blog/expired-domains-and-the-drop-cycle/)을 의도적으로 구매한 이유는, 이전 소유자가 해당 도메인을 OAuth 토큰의 `iss` 클레임이나 트랜잭션 이메일의 발신자로 등록해 두었기 때문입니다.

**차단 방법:**

- **인증, 결제, 또는 프로덕션 트래픽에 관련된 도메인은 5~10년 장기 갱신을 합니다.** 비용은 미미하지만 그 보호 효과는 상당합니다.
- **묵시적으로 실패할 수 없는 결제 수단으로 자동 갱신을 설정합니다.** 카드 만료가 실수에 의한 도메인 소멸의 가장 흔한 원인입니다.
- **90일, 60일, 30일, 7일 전에 알림을 설정하고, 한 사람이 아닌 *팀* 이메일로 전송합니다.** 담당자가 퇴사할 경우를 대비해야 합니다.

## 바람직한 보안 상태

위의 대응 수단을 종합하면, 중요한 도메인의 기본 기준선은 다음과 같습니다:

| 대응 수단                                  | 차단하는 공격 경로                              |
| ------------------------------------------ | ----------------------------------------------- |
| 레지스트라에 하드웨어 키 2FA               | 계정 침해 (경로 2)                              |
| DNS 공급자에 하드웨어 키 2FA               | DNS 탈취 (경로 3)                               |
| 레지스트리 잠금 (사용 가능한 경우)         | 소셜 엔지니어링 (경로 1)                        |
| 존 수준에서 서명된 DNSSEC                  | DNS 경로 상의 위변조 및 위조 응답               |
| 서브도메인 목록 + 댕글링 스캐너            | 서브도메인 하이재킹 (경로 4)                    |
| 5~10년 갱신 + 자동 갱신                    | 실수에 의한 만료 (경로 5)                       |
| 연락처/NS/이전 변경 알림                   | 다섯 가지 모두 (조기 인지 가능)                 |

도메인을 관리하고 있으면서 위 항목 중 하나라도 충족하지 못한다면, 공격자의 작업은 그만큼 쉬워집니다.

## Namefi가 상황을 바꾸는 방법

위에서 언급한 대응 수단들은 대부분 특정 레지스트라, 특정 DNS 공급자, 또는 특정 워크플로 도구의 기능으로 존재하며, 보안 수준은 가장 취약한 계정에 의해 결정됩니다. Namefi는 [온체인](/ko/glossary/on-chain/)에서 등록자 관계를 토큰화합니다. 즉, *이 도메인의 소유자가 누구인지*에 대한 권위 있는 기록이 어떤 레지스트라의 고객 데이터베이스 밖에 존재하게 됩니다. 어느 공급자의 지원 담당자도 정당한 소유자가 승인해야 하는 서명된 트랜잭션 없이는 소유권을 조용히 변경할 수 없습니다. 레지스트라는 여전히 기술적인 위임을 처리하지만, *제어* 계층은 소셜 엔지니어링이 통하지 않는 곳으로 이동합니다.

이것이 위 표의 모든 대응 수단을 완전히 대체하지는 않습니다. DNSSEC도 여전히 필요하고, DNS 공급자에 2FA도 여전히 필요하며, 갱신도 여전히 해야 합니다. 그러나 가장 흔하고 파급력이 큰 탈취 벡터(경로 1)를 위협 모델에서 완전히 제거합니다.

## 출처 및 추가 자료

- ICANN — [이전 분쟁 해결 정책 범위](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)
- IETF — [DNSSEC RFC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) 및 [멀티 서명자 DNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)
- CISA — [다중 인증(MFA) 지침](https://www.cisa.gov/secure-our-world/turn-mfa)
- Detectify Labs — [적대적 서브도메인 탈취 분석](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/)
- Verisign — [.com/.net 레지스트리 잠금](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml)
