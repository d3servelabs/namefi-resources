---
title: "eMudhra CA 침해는 도메인 보안에 HTTPS 이상의 보호가 필요함을 보여 준다"
date: '2026-10-22'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: explainer
description: "eMudhra CA 키 침해, 웹사이트 사칭 위험, DNSSEC·DANE·CAA·CT가 제공하는 서로 다른 보호를 설명한다."
keywords: ["eMudhra", "emSign", "CA 침해", "인증 기관", "중간 인증 기관", "MITM", "DNSSEC", "DANE", "CAA", "인증서 투명성", "TLS 인증서", "도메인 보안"]
relatedArticles:
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/certificate-authority/
  - /ko/glossary/intermediate-ca/
  - /ko/glossary/man-in-the-middle-attack/
  - /ko/glossary/dnssec/
  - /ko/glossary/dane/
---

웹사이트는 사칭자와의 연결도 암호화할 수 있다. 암호화만으로 연결 상대를 누가 제어하는지 확인할 수는 없다.

eMudhra 사건으로 도메인 소유자, 창업자, Web3 팀은 암호화와 인증의 차이를 시급히 이해해야 한다. 2026년 10월 20일, Google과 Mozilla는 중간 인증 기관 키 침해에 대한 긴급 대응을 공개했다. 취약한 키 생성 과정이 웹사이트 인증서 위조 경로를 만들었다. 영향받은 키를 계속 신뢰하는 클라이언트는 사칭 위험에 노출됐다. [Google은 실패 원인과 차단 대응을 설명한다](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/).

**상태 확인일: 2026년 10월 22일.** 조사는 계속되고 있다. 키 침해가 확인됐다는 사실이 공격자의 고객 트래픽 가로채기를 입증하지는 않는다.

## 이번 사건은 개별 웹사이트 상위의 서명 권한 위험을 드러냈다

[인증 기관](/ko/glossary/certificate-authority/), 즉 CA는 신원과 공개 키를 연결하는 디지털 인증서를 발급한다. HTTPS에서 인증서는 서버가 인증할 수 있는 도메인 이름을 명시한다. CA는 인증서에 서명하기 전에 적용되는 신원 확인 요건을 검사한다. 브라우저는 인증서 체인과 서버가 해당 개인 키를 보유했다는 증명을 확인한다. [RFC 5280은 인증서 모델을 설명한다](https://www.rfc-editor.org/rfc/rfc5280#section-3.2).

루트 CA는 신뢰 앵커를 제공한다. [중간 인증 기관](/ko/glossary/intermediate-ca/)은 루트 아래에서 위임받은 서명 권한을 보유한다. 웹사이트 인증서는 보통 중간 인증 기관 아래에 위치한다. 웹사이트 키 침해는 해당 인증서의 신원을 위협한다. 중간 키 침해는 인증서 제약 조건과 클라이언트 검사에 따라 서로 무관한 여러 도메인을 위협할 수 있다.

Mozilla의 [사건 기록은 영향받은 중간 인증서 8개를 명시한다](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0). 6개는 TLS용이며, 2개는 코드 서명용이다. Mozilla는 취약한 개인 키를 독자적으로 복구했다. eMudhra는 10월 18일에 인증서를 폐지 상태로 표시했다. 이러한 사실은 키 생성 실패를 나타내며, 누군가 모든 고객의 개인 키를 훔쳤다는 증거는 아니다.

[10월 21일 성명](https://emudhra.com/en/post/certificate-security-incident#:~:text=During%20the%20ceremony)에서 eMudhra는 2025년 4월 30일 키 생성 의식의 래핑 및 언래핑 단계를 취약한 키의 원인으로 지목했다. eMudhra는 영향받은 중간 인증 기관이 최종 개체 인증서를 발급하지 않았으며, 공개 전 악용 증거도 발견하지 못했다고 밝혔다. 회사는 정확한 근본 원인 조사도 아직 완료하지 못했다고 밝혔다. 성명은 eMudhra의 조사 결과를 설명하며, 모든 과거 트래픽에 대한 독립적인 보증은 아니다.

## 브라우저 보호 조치는 실제 노출 범위를 바꿨다

Google에 따르면 Chrome은 10월 17일 CRLSet 업데이트로 영향받은 키를 차단했다. Google은 차단 전에 영향받은 TLS 중간 인증 기관 6개 아래의 TLS 인증서가 CT에 나타나지 않았다고도 보고했다. 따라서 해당 CT 요건을 강제하는 클라이언트에서는 해당 중간 인증 기관의 부정 인증서가 작동할 수 없었을 것이다. Google의 권고문은 Chrome을 해당 클라이언트에 포함한다.

Mozilla는 [그날 저녁 OneCRL 차단 목록을 배포했다](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/). Mozilla는 OneCRL 보호를 받지 못할 수 있는 구성에 대한 Firefox 업데이트도 공개했다. 브라우저 업데이트만으로 같은 기기의 모든 애플리케이션이 동일한 보호를 받는다고 입증할 수는 없다. [Cloudflare는 애플리케이션마다 다른 인증서 검증기를 사용할 수 있다고 명시적으로 경고한다](https://blog.cloudflare.com/emudhra-certificate-compromise/#:~:text=A%20successful%20browser%20test).

Google의 10월 20일 권고문은 Chrome Root Store를 사용하는 클라이언트 전반에서 **emSign ECC Root CA - G3**를 태평양 일광 절약 시간 기준 2026년 10월 27일에 제거할 계획이라고 명시한다. Google은 영향받는 웹사이트 운영자에게 다른 신뢰받는 계층으로 인증서를 이전하라고 지시한다. 운영자는 즉각적인 보안 차단과 이후 루트 신뢰 철회가 일으킬 서비스 중단을 구분해야 한다.

## 중간자 공격자는 트래픽 접근과 수용되는 신원을 모두 확보해야 한다

[중간자 공격](/ko/glossary/man-in-the-middle-attack/), 즉 MITM은 공격자를 통신 당사자 사이에 위치시킨다. 다음은 가상의 공격이며, 관찰된 eMudhra 악용 사례가 아니다.

1. 공격자가 악성 DNS 응답이나 다른 네트워크 가로채기 방법으로 방문자를 공격자에게 돌린다.
2. 공격자가 방문 대상 도메인의 위조 인증서를 제시한다.
3. 보호받지 못한 클라이언트가 인증서를 수용하고 공격자와 TLS 연결을 설정한다.
4. 공격자가 실제 서비스로 트래픽을 중계하면서 애플리케이션 데이터를 읽거나 변경한다.

CA 키를 보유했다고 트래픽이 자동으로 공격자에게 향하지는 않는다. 인증서만으로 과거에 기록한 모든 세션을 복호화할 수도 없다. TLS 1.3의 순방향 비밀성은 명시된 가정 아래에서 장기 인증 키의 사후 침해로부터 이전 세션을 보호한다. [RFC 8446은 차이를 설명한다](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1).

Namefi의 [Fox-IT 사례 연구](/ko/blog/the-fox-it-dns-hijack/)는 비슷한 결과로 이어진 다른 경로를 살펴본다. 등록기관 침해로 공격자가 부정 인증서를 획득했다. Namefi의 [MyEtherWallet 사례 연구](/ko/blog/the-myetherwallet-bgp-dns-attack/)는 라우팅 및 DNS 조작을 살펴본다. 도메인 보안은 트래픽 방향과 통신 상대 인증을 모두 다뤄야 한다.

## DNSSEC은 DNS 응답을 인증하지만 CA 키를 복구하지 않는다

[DNSSEC (도메인 네임 시스템 보안 확장)](/ko/glossary/dnssec/)은 DNS 데이터에 디지털 서명을 추가한다. 검증 리졸버는 신뢰 체인을 통해 서명을 확인한다. 영역 서명이 정확하고 검증 체인이 온전하면, 공격자가 주소 응답을 위조 응답으로 바꿨을 때 검증 과정이 변경을 감지한다. [RFC 4033은 보호 범위와 한계를 정의한다](https://datatracker.ietf.org/doc/html/rfc4033#section-3).

클라이언트는 로컬에서 검증하거나, 검증 리졸버와 해당 리졸버로 향하는 인증된 연결을 모두 신뢰해야 한다. [RFC 4033은 마지막 구간의 요건을 설명한다](https://datatracker.ietf.org/doc/html/rfc4033#section-7).

앞서 설명한 조건을 충족하면 DNSSEC은 가상 공격의 DNS 위조 단계를 차단할 수 있다. DNSSEC은 중간 인증 기관을 폐지하거나, HTTPS 인증서를 검증하거나, 웹 트래픽을 암호화하지 않는다. 다른 경로로 트래픽을 가로채는 공격자는 여전히 취약한 클라이언트에 위조 인증서를 제시할 수 있다.

서명만으로 등록기관 계정이나 권한 DNS 제어판을 보호할 수도 없다. 정식 DNS 변경 권한을 장악한 공격자는 공급자가 서명하는 유해 레코드를 게시할 수 있다. 운영자는 DNSSEC 검증뿐 아니라 계정 보호, 변경 모니터링, 올바른 상위 영역 DS 레코드도 갖춰야 한다.

## 클라이언트가 연결 조건을 강제하면 DANE는 서비스 키를 서명된 DNS에 결합한다

[DANE](/ko/glossary/dane/)는 TLSA 레코드로 DNSSEC과 TLS 인증을 연결한다. 도메인 운영자는 예상 인증서, 키 또는 신뢰 앵커를 서명된 DNS에 게시한다. 지원 클라이언트는 DNSSEC을 검증하고 TLSA 연결 조건을 강제한다. [RFC 6698은 연결 관계를 규정한다](https://www.rfc-editor.org/rfc/rfc6698#section-2).

예를 들어 DANE-EE 용도는 서비스를 공개 키에 직접 결합할 수 있다. 무관한 CA 키로 위조한 인증서는 결합 조건을 충족하지 못한다. 보호 효과를 얻으려면 안전한 DNSSEC 검증, 정확한 TLSA 데이터, 클라이언트의 실제 강제가 필요하다. 키 교체에는 TLSA 업데이트 조율도 필요하다. [RFC 7671은 운영 지침을 제공한다](https://www.rfc-editor.org/rfc/rfc7671#section-5.1).

TLSA 레코드를 게시해도 일반 브라우저 방문자가 자동으로 보호받지는 않는다. Firefox의 [DANE 구현 요청은 여전히 거절 상태다](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924). 운영자는 정확히 어떤 클라이언트를 사용하는지 확인하고 지원 여부를 검증해야 한다. DANE는 [SMTP 전송 보안](https://www.rfc-editor.org/rfc/rfc7672)을 위한 표준화된 적용 방식이 있다.

## CAA와 CT는 서로 다른 인증서 통제 수단을 제공한다

| 통제 수단 | 보호 | 한계 |
| --- | --- | --- |
| DNSSEC | 검증 리졸버가 서명된 DNS 데이터의 진위를 확인한다. | DNSSEC은 침해된 CA 키를 복구하지 않는다. |
| DANE | 지원 클라이언트가 DNSSEC으로 인증한 TLSA 연결 관계를 확인한다. | 클라이언트가 연결 조건을 강제해야 한다. |
| CAA | 규격을 준수하는 CA가 도메인이 허용한 발급자를 확인한다. | 위조자는 CA의 발급 절차를 우회할 수 있다. |
| CT | 로그가 인증서 발급을 드러내 모니터링과 클라이언트 정책 검사를 지원한다. | 로그만으로 모든 위조를 막거나 모든 클라이언트를 보호하지는 못한다. |

[CAA](/ko/glossary/caa/)는 허용한 발급자를 DNS에 게시한다. [RFC 8659는 발급 권한 부여와 클라이언트 인증서 검증을 구분한다](https://www.rfc-editor.org/rfc/rfc8659#section-1). 도난당했거나 복구할 수 있는 서명 키가 있으면 위조자는 CAA 검사를 무시할 수 있다.

[인증서 투명성](/ko/glossary/certificate-transparency/), 즉 CT는 인증서 발급에 대한 공개 감사를 가능하게 한다. 모니터링은 예상하지 못한 인증서를 표시할 수 있고, 클라이언트의 정책 강제는 필수 로그 증거가 없는 인증서를 거부할 수 있다. [RFC 9162는 로그 방식을 설명한다](https://www.rfc-editor.org/rfc/rfc9162#section-1). 앞서 살펴본 Google의 조사 결과는 CA 사건에서 정책 강제가 중요한 이유를 보여 준다.

## 도메인 운영자는 지금 클라이언트 신뢰와 인증서 의존 관계를 점검해야 한다

- 최신 브라우저, 운영 체제, 런타임, CA 패키지 보안 업데이트를 설치한다.
- 웹사이트, API, 모바일 애플리케이션, 컨테이너, TLS 검사 게이트웨이의 인증서 체인 목록을 작성한다.
- 대체 인증서 경로를 포함하여 영향받은 중간 인증 기관과 루트 제거에 관한 공급자 지침을 따른다.
- 해당 클라이언트의 마감일 전에 신뢰가 철회되는 계층에 연결된 인증서를 교체한다.
- 조치 후 각 애플리케이션이 실제 사용하는 TLS 검증기를 시험한다.
- 인증서 검증을 계속 활성화하고, 인증서 오류가 발생하면 접속을 중단한다.
- 올바른 DS 위임과 함께 DNSSEC을 활성화하고, 검증하는 이름 해석 서비스를 사용한다.
- CAA로 허용 발급자를 제한하고, CT를 모니터링하며, 등록기관과 DNS 계정을 보호한다.

VPN은 트래픽 경로를 바꿀 수 있다. VPN은 클라이언트의 인증서 신뢰 판단을 복구하지 않는다. HSTS는 HTTPS를 요구하지만, 클라이언트가 위조된 HTTPS 신원을 수용하면 보호는 여전히 무력화된다. [RFC 6797은 HSTS의 보안 한계를 설명한다](https://www.rfc-editor.org/rfc/rfc6797#section-14).

Namefi 독자에게 도메인 소유권, DNS 관리, TLS 인증, 지갑 권한 부여는 각각 별도의 통제가 필요한 영역이다. 도메인 토큰화는 브라우저 CA 신뢰를 자동으로 대체하거나 DNSSEC을 활성화하지 않는다. Namefi의 [토큰화 도메인 DNS 가이드](/ko/blog/dns-on-tokenized-domains/)는 운영상 연결 관계를 설명한다. Namefi의 [Curve Finance 사례 연구](/ko/blog/the-curve-finance-dns-hijack/)는 Web3 팀이 인터페이스를 제공하는 도메인을 보호해야 하는 이유를 보여 준다.

## 일차 출처는 사건과 방어 조치를 기록한다

아래 출처는 모두 2026년 10월 22일에 확인했다. 조사가 계속되면서 사건 관련 성명이 바뀔 수 있다.

- [Google: Chrome과 Android 대응](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/), 2026년 10월 20일. 엔트로피, CT, 차단, 루트 제거 관련 절.
- [Mozilla: Firefox 대응](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/), 2026년 10월 20일. OneCRL 배포와 추가 업데이트.
- [Mozilla 버그 2083449](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0), 설명과 댓글 1. 인증서 범위, 독립적인 키 복구, 폐지.
- [eMudhra 사건 성명](https://emudhra.com/en/post/certificate-security-incident), 업데이트 2–4. 회사 조사 결과와 고객 전환 선택지.
- [Cloudflare 사건 지침](https://blog.cloudflare.com/emudhra-certificate-compromise/), 애플리케이션별 검증 지침.
- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280#section-3.2), 인증서와 신뢰 경로 모델.
- [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1), TLS 1.3 순방향 비밀성.
- [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033#section-3), DNSSEC 서비스, 한계, 검증.
- [RFC 6698](https://www.rfc-editor.org/rfc/rfc6698#section-2)과 [RFC 7671](https://www.rfc-editor.org/rfc/rfc7671#section-5.1), DANE 연결 관계와 운영.
- [Mozilla 버그 1994924](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924), Firefox DANE 구현 상태.
- [RFC 7672](https://www.rfc-editor.org/rfc/rfc7672), SMTP용 DANE.
- [RFC 8659](https://www.rfc-editor.org/rfc/rfc8659#section-1), CAA 권한 부여와 검증의 구분.
- [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162#section-1), CT 로그 기록과 모니터링.
- [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797#section-14), HSTS 보안 고려 사항.
