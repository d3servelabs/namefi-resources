---
title: 'DNS over HTTPS vs 기업용 스플릿 호라이즌 DNS: 스스로 해결되지 않는 교착 상태'
date: '2026-05-04'
language: ko
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: comparison
description: DNS over HTTPS(DoH)는 DNS 쿼리를 HTTPS 내부에 암호화하여 사용자 프라이버시를 보호합니다. 기업용 스플릿 호라이즌 DNS는 네트워크가 해당 쿼리를 볼 수 있다는 전제에 의존합니다. 이 두 기술의 충돌은 기업 네트워크, 브라우저, 운영체제가 이름 확인을 처리하는 방식을 재편하고 있습니다.
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['dns over https', 'doh', '스플릿 호라이즌 dns', '기업용 dns', 'dot', '암호화 dns', '내부 dns', '이름 확인', 'namefi']
relatedArticles:
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

인터넷 역사의 대부분에 걸쳐 [DNS](/ko/glossary/dns/) 쿼리는 포트 53을 통해 평문으로 전송되었습니다. 네트워크 경로상의 누구든 이 쿼리를 읽고 기록하고 변조할 수 있었습니다. 이는 프라이버시 문제였으며, IETF는 결국 두 가지 암호화 대안을 통해 이를 해결했습니다. 2016년의 [DNS over TLS(DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858)와 2018년의 [DNS over HTTPS(DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484)입니다.

특히 DoH는 판도를 바꾸었습니다. DNS 쿼리를 일반 HTTPS 스트림 *내부*에 숨기기 때문입니다. 네트워크 관찰자의 눈에는 DoH 쿼리가 콘텐츠 서버에 대한 일반적인 TLS 연결과 전혀 구별되지 않습니다. 보안이 취약한 카페 Wi-Fi에서 접속하는 사용자에게는 매우 유익한 기능입니다. 그러나 기업 IT 팀에게는 상황이 다릅니다. 이들은 경계를 통과하는 모든 DNS 쿼리를 파악하고 제어하는 것에 의존하기 때문입니다.

이것이 바로 교착 상태입니다. 양측 모두 정당하고 명확하게 표현된 요구사항을 갖고 있습니다. 표준화 기구, 브라우저 벤더, 운영체제 벤더들은 지난 십여 년간 두 가지를 동시에 작동시키기 위해 노력해왔으며, 그 결과는 서로 불편하게 타협한 일련의 방안들입니다. 2026년에 기업 네트워크를 운영하는 모든 담당자는 이 현실을 이해해야 합니다.

## DoH가 실제로 하는 일

DoH 클라이언트는 DNS 쿼리를 HTTPS POST 또는 GET 요청으로 전송합니다. 주로 `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query` 또는 다른 공개 리졸버로 보냅니다. 응답은 일반적인 HTTPS 응답 본문으로 돌아옵니다. 세 가지 특성이 중요합니다.

- **전송 중 암호화.** 네트워크 관찰자는 쿼리 이름이나 응답을 읽을 수 없습니다.
- **서버 인증.** 클라이언트가 리졸버의 TLS 인증서를 검증하므로 중간자 공격자가 리졸버를 사칭할 수 없습니다.
- **웹 트래픽과 구별 불가.** 포트 443, TLS 1.3, 일반적인 SNI 패턴을 사용합니다. 필터링할 수 있는 DNS 모양의 트래픽 자체가 없습니다.

세 번째 특성이 충돌의 핵심입니다. DoT도 쿼리를 암호화하지만 *전용* 포트(853)를 사용하므로 네트워크에서 차단하거나 리디렉션하기가 쉽습니다. 반면 DoH는 일반 웹 브라우징도 함께 차단하지 않고는 선택적으로 막을 수 없습니다.

## 기업용 스플릿 호라이즌 DNS가 실제로 하는 일

대부분의 대규모 조직은 **스플릿 호라이즌 DNS**를 운영합니다. 동일한 이름(`vpn.example.corp`, `git.example.com`, `intranet.example.com`)이 쿼리가 네트워크 내부에서 오는지 외부에서 오는지에 따라 서로 다른 IP 주소로 해석됩니다.

네트워크 내부에서:
- 리졸버는 회사의 내부 DNS이며, 흔히 Active Directory와 통합되어 있습니다.
- `git.example.com`은 `10.0.4.7`과 같은 사설 RFC 1918 주소로 해석될 수 있습니다.
- 내부 전용 존(`example.corp`, `example.internal`)은 공용 인터넷에 전혀 존재하지 않을 수 있습니다.
- DLP 및 보안 도구가 모든 쿼리를 감시하고 알려진 악성 도메인에 대한 DNS를 플래그할 수 있습니다.

네트워크 외부(또는 가정용 Wi-Fi의 개인 기기):
- 동일한 쿼리가 공개 리졸버로 전달됩니다.
- `git.example.com`은 공개 로드 밸런서로 해석됩니다.
- 내부 전용 이름은 단순히 해석되지 않습니다.

이것은 특별한 기술이 아닙니다. 수백 명 이상의 직원을 둔 거의 모든 기업의 기본 구성입니다. 이 방식은 하나의 핵심 전제에 의존합니다. **엔드포인트가 DHCP, 푸시 정책 또는 VPN 구성을 통해 네트워크가 지정한 리졸버를 사용한다**는 것입니다.

DoH는 이 전제를 깨뜨립니다. 브라우저가 자체 리졸버를 내장하거나 운영체제가 시스템 리졸버를 우회한다면, 엔드포인트는 내부 DNS를 완전히 참조하지 않게 됩니다. 내부 호스트 이름은 확인되지 않고, 보안 도구는 탐지에 의존하던 쿼리를 더 이상 볼 수 없게 됩니다.

## 브라우저와 운영체제가 이 문제를 처리한 방식

벤더들이 이 문제를 외면한 것은 아닙니다. 오늘날 존재하는 타협점들은 여러 계층으로 이루어져 있으며 다소 임시방편적인 성격을 띱니다.

### Chrome의 "자동 업그레이드" 모델

Chrome의 DoH 구현은 시스템 리졸버 자체가 Chrome의 DoH 지원 공급자 허용 목록(Google, Cloudflare, Quad9 등)에 있는 경우에만 시스템 리졸버를 DoH로 업그레이드합니다. 시스템이 허용 목록에 없는 내부 기업 리졸버를 사용하도록 구성되어 있으면 Chrome은 그대로 둡니다. 기업 정책으로 [Chrome의 `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) 설정을 통해 DoH를 완전히 비활성화할 수도 있습니다.

### Firefox의 TRR(신뢰된 재귀 리졸버) 모델

Firefox의 접근 방식은 더 많은 논란을 불러일으켰습니다. Mozilla가 DoH를 기본으로 활성화한 지역에서 Firefox는 미국에서 Cloudflare와 같은 기본 리졸버를 사용하지만, DoH를 활성화하기 전에 기업 및 네트워크 휴리스틱을 실행합니다. 중요한 신호 중 하나는 캐너리 도메인 `use-application-dns.net`입니다. 로컬 리졸버가 부정 응답을 반환하면 Firefox는 기본적으로 DoH가 활성화된 사용자에 대해 애플리케이션 수준 DNS를 비활성화합니다. Mozilla는 중요한 스플릿 호라이즌 관련 사항도 문서화하고 있습니다. 내부 전용 이름은 DoH 해석이 실패하면 일반 DNS로 폴백할 수 있지만, 네트워크 내부에서 다르게 해석되는 공개 이름의 경우 DoH를 비활성화하려면 기업 정책이 필요합니다.

### Apple의 암호화 DNS(iOS 14+, macOS Big Sur+)

Apple은 앱과 구성 프로파일이 전체 시스템에 대해 DoH 또는 DoT를 선택적으로 사용할 수 있게 하지만, 특정 리졸버를 지정하는 MDM 정책을 준수합니다. 기업 관리 기기는 즉시 올바르게 동작합니다.

### Windows 기본 DoH

Windows 11 이후, 그리고 Windows Server 2022 이상에서 운영체제 자체가 시스템 리졸버에 DoH를 사용할 수 있습니다. 그룹 정책으로 DoH를 허용할지, 요구할지, 금지할지를 제어하며, Windows는 지원이 확인된 구성된 DNS 서버에 대해서만 DoH를 활성화합니다. 이것이 아마도 가장 깔끔한 모델일 것입니다. 보안 팀이 정책을 선택하고, 운영체제가 이를 시행합니다.

패턴은 명확합니다. **단일 앱(브라우저)에 내장된 DoH는 네트워크가 제어하기 어렵고, OS 수준 리졸버에 내장된 DoH는 일반적인 MDM 채널을 통해 제어할 수 있습니다**. IETF와 OS 벤더들은 정책이 OS 계층에 속한다는 데 대체로 합의했습니다.

## 2026년 기업의 현실적인 선택지

위의 도구를 감안할 때 세 가지 실행 가능한 전략이 있고, 작동하지 않는 네 번째 방법도 있습니다.

### 전략 A: 전체 내부화, DoH 차단

모든 브라우저에서 DoH를 비활성화하는 정책을 푸시하고, 알려진 공개 DoH 엔드포인트에 대한 포트 443을 차단하며, 모든 DNS를 내부 리졸버를 통해 강제합니다. 내부 리졸버 자체는 업스트림 공개 리졸버에 DoH를 사용할 수 있지만, 네트워크 내부에서는 모든 것이 내부 리졸버를 통합니다.

가장 엄격한 옵션입니다. 스플릿 호라이즌을 완벽하게 보존하고 보안 도구에 완전한 가시성을 제공합니다. 단, 새로운 DoH 엔드포인트의 차단 목록을 유지해야 하고, 사용자가 설치하는 앱 중 DoH를 독자적으로 사용하는 것들(일부 채팅 클라이언트, 일부 VPN)이 오작동할 수 있습니다.

### 전략 B: 내부 DoH

내부 DoH 서버(Cloudflared, AdGuard, 또는 DoH가 활성화된 Windows DNS Server)를 구축하고, 엔드포인트가 이를 사용하도록 구성하며, 내부 DoH 서버에서 스플릿 호라이즌을 실행합니다. 엔드포인트는 네트워크가 가시성을 잃지 않으면서도 암호화된 DNS를 사용할 수 있게 됩니다.

가장 깔끔한 옵션이며 대부분의 대기업이 나아가고 있는 방향입니다. LAN에서 쿼리가 암호화되어 프라이버시 이점을 보존하면서도, 내부 리졸버가 여전히 모든 쿼리를 보고 필터링할 수 있어 보안 이점도 유지됩니다. Microsoft, Google, Apple 모두 이 시나리오에 대한 OS 수준 구성을 지원합니다.

### 전략 C: 캐너리 도메인 / 네트워크 신호

Mozilla 캐너리 도메인을 게시합니다. 관련 Chrome 및 Edge 정책을 푸시합니다. 브라우저가 관리 네트워크에 있음을 감지하고 시스템 리졸버에 위임하는 것에 의존합니다. 가장 가벼운 방식이며 많은 중소기업에는 충분합니다.

### 전략 D(작동하지 않음): "DoH를 그냥 무시하면 되지"

충돌이 없는 척하고, 기본값을 그대로 유지하며, 모든 DNS가 여전히 기업 리졸버를 통해 흐른다고 가정하는 것입니다. 이것이 가장 흔한 상태이며 예측 가능한 장애를 발생시킵니다. 개발자들은 내부 전용 URL이 Edge에서는 작동하지만 Firefox에서는 안 된다고 보고하고, 보안 팀은 DNS 로그에서 공백을 발견하며, 진단에 몇 시간씩 걸리는 간헐적인 VPN-DNS 버그가 발생합니다. 문제는 사라지지 않습니다. 원인을 찾기만 더 어려워질 뿐입니다.

## DoH가 포기하는 것이 프라이버시만은 아닙니다

DoH의 더 미묘한 영향은 리졸버 중앙화입니다. 브라우저나 운영체제가 공개 DoH 리졸버를 사용하도록 구성되면, 해당 사용자의 DNS 스트림이 더 많이 하나의 리졸버 운영자에게 집중될 수 있습니다. Chrome의 자동 모드는 가능한 한 사용자의 기존 DNS 공급자를 보존하도록 명시적으로 설계되어 있고, Firefox의 기본 출시 방식은 지역 및 휴리스틱에 따라 달라지므로, 모든 배포에서 문자 그대로 "모든 쿼리"가 이동하는 것은 아닙니다. 그러나 아키텍처적 트레이드오프는 여전히 남아 있습니다. 암호화된 DNS는 로컬 네트워크나 ISP에 대한 신뢰를 소수의 선택된 리졸버 운영자에 대한 신뢰로 이전시킬 수 있습니다.

이 트레이드오프가 수용 가능한지 여부는 위협 모델에 달려 있습니다. 보안이 취약한 카페 네트워크를 사용하는 사용자에게는 Cloudflare에 신뢰를 집중하는 것이 카페를 신뢰하는 것보다 명백히 개선된 상황입니다. 이미 ISP와 계약 관계를 맺고 있는 기업에게는 퇴보일 수 있습니다. [EFF는 DoH 초기 출시 이후부터 이 교환에 대해 글을 써왔습니다](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).

가장 깔끔한 해답은 위의 전략 B와 동일합니다. 자체 DoH 리졸버를 운영하면 암호화된 DNS를 위해 전체 쿼리 스트림을 제3자에게 신뢰할 필요가 없습니다.

## 도메인 소유자에게 의미하는 바

기업이 사용하는 도메인을 운영한다면—SaaS 앱, 개발자 도구, API 등—관련 사항은 다음과 같습니다.

- 사용자 중 일부는 공개 DoH 엔드포인트를 통해 귀하의 도메인을 확인할 것입니다. 특히 비관리 기기나 명시적으로 구성된 브라우저에서 그렇습니다. CNAME 체인, [서브도메인](/ko/glossary/subdomain/) 위임, 개인화를 위한 DNS 트릭들은 임의의 공개 리졸버에서 확인될 때도 고객의 내부 리졸버에서 확인될 때와 동일하게 작동해야 합니다.
- DNS 기반 검열 우회는 DoH의 실제 사용 사례입니다. 여러분의 도메인이 정부의 DNS 필터에 의해 차단되어 있다면(암호화 메시징 서비스나 VPN 도메인 중 몇몇이 그런 상황입니다), 사용자들은 공개 리졸버의 DoH를 통해 접근할 것입니다. 작동 방식은 동일하고, 정치적 맥락만 다릅니다.
- 내부 스플릿 호라이즌은 공개 이름을 *내부에서만 의미 있는* 주소로 확인해서는 안 됩니다. 사용자가 실수로 DoH를 통해 쿼리하면 연결이 끊어지는 방식으로 말입니다. 전형적인 장애 사례는 내부 전용 `app.example.com`이 DoH 사용자가 도달할 수 없는 사설 IP를 반환하는 경우입니다. 그러면 호텔에 있는 원격 근무자가 같은 호스트 이름에 접근할 수 없다고 버그를 제출합니다. 명확히 분리된 내부 전용 존(`app.example.internal`)을 사용하십시오.

## Namefi와의 관계

Namefi는 DNS를 공개 [제어 플레인](/ko/blog/dns-is-the-control-plane/)—전 세계적 이름 체계와 로컬 정책이 만나는 지점—으로 다룹니다. Namefi의 DNS 워크플로우는 우리가 열거할 수 없는 DoH 엔드포인트를 포함하여 어떤 리졸버에서도 쿼리가 올 수 있다고 가정하며, 게시하는 이름은 어떤 경우에도 일관되게 작동합니다. 내부적으로 스플릿 호라이즌을 운영하는 고객의 경우, Namefi는 공개 측에 위치합니다. `example.com`에 대한 권위 응답은 Namefi가 제공하는 것이며, 내부 리졸버가 내부 사용자를 위해 이를 오버라이드하는 방식은 고객과 엔드포인트 정책 간의 문제입니다.

더 깊은 의미: 암호화된 DNS는 이제 사라지지 않을 것이며, 기업의 가시성 요구도 마찬가지입니다. 이 둘을 조화시키는 방법은 표준에 맞서 싸우는 것이 아니라, 정책 집행 지점을 네트워크에서 운영체제로 옮기는 것입니다. 표준화 기구, Microsoft, Apple, Google, Mozilla 모두 이 답에 수렴했습니다. 남은 과제는 대부분 운영상의 것들입니다.

## 출처 및 추가 자료

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) 및 [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [DoH 정책 제어](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [신뢰된 재귀 리졸버 프로그램](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [캐너리 도메인 동작](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), [스플릿 호라이즌 폴백 가이드](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Chrome의 동일 공급자 DoH 자동 업그레이드 모델](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Windows에서 DNS over HTTPS 구성](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [암호화된 DNS가 인터넷의 가장 큰 프라이버시 공백 중 하나를 해소하는 데 도움이 될 수 있습니다](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).
